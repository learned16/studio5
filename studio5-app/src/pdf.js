/* PDF viewer: the original stays immutable; ink annotations live in separate `inkpage` records
   ({fileId, page}). Text is extracted once into a device-local index for unified search. */
S5.pdfReady = () => !!(window.pdfjsLib && window.pdfjsLib.getDocument);
S5.pdfCache = new Map();
S5.openPdf = async (file) => {
  if (!S5.pdfReady()) throw new Error("The PDF engine did not load. Check your connection and reopen.");
  if (S5.pdfCache.has(file.id)) return S5.pdfCache.get(file.id);
  const b = await S5.blobs.get(file.blobKey, file.assetId);
  if (!b) throw new Error("This file's bytes are not on this device yet. Open it on the device where you added it, or restore a backup that includes files.");
  const task = window.pdfjsLib.getDocument({ data: new Uint8Array(b.data.slice(0)), isEvalSupported: false });
  const pdf = await task.promise;
  S5.pdfCache.set(file.id, pdf);
  if (S5.pdfCache.size > 4) { const k = S5.pdfCache.keys().next().value; S5.pdfCache.get(k).destroy?.(); S5.pdfCache.delete(k); }
  return pdf;
};
S5.indexPdfText = async (file) => {
  try {
    const have = await S5.idb.get("meta", "pdftext_" + file.id); if (have) return have;
    const pdf = await S5.openPdf(file); const pages = [];
    for (let i = 1; i <= Math.min(pdf.numPages, 400); i++) { const pg = await pdf.getPage(i); const tc = await pg.getTextContent(); pages.push(tc.items.map((t) => t.str).join(" ").replace(/\s+/g, " ").trim()); }
    await S5.idb.put("meta", "pdftext_" + file.id, pages);
    if (!file.pages) await S5.store.update(file.id, { pages: pdf.numPages });
    return pages;
  } catch (e) { console.warn("index pdf", e); return null; }
};

S5.PdfView = class PdfView {
  constructor(host, file, opts = {}) {
    this.host = host; this.file = file; this.o = opts; this.zoom = S5.ls.get("pdfZoom", 1); this.annotate = false; this.inks = new Map(); this.page = opts.startPage || 1;
    this.host.innerHTML = `<div class="ink-tools pdf-bar"></div><div class="pdf-host"><div class="empty">Opening ${S5.esc(file.name)}…</div></div>`;
    this.bar = host.querySelector(".pdf-bar"); this.scroller = host.querySelector(".pdf-host");
    this.load();
  }
  async load() {
    try { this.pdf = await S5.openPdf(this.file); }
    catch (e) { this.scroller.innerHTML = `<div class="empty"><strong>Could not open this PDF.</strong><br>${S5.esc(e.message)}</div>`; return; }
    if (!this.file.pages) S5.store.update(this.file.id, { pages: this.pdf.numPages });
    this.renderBar(); await this.layout();
    S5.indexPdfText(this.file);
  }
  renderBar() {
    const st = S5.inkState;
    this.bar.innerHTML = `<button class="tb" data-p="prev" title="Previous page">‹</button>
      <span class="mono small"><input data-p="goto" value="${this.page}" style="width:42px;text-align:center" aria-label="Page"> / ${this.pdf?.numPages || "?"}</span>
      <button class="tb" data-p="next" title="Next page">›</button><span class="sep"></span>
      <button class="tb" data-p="zout" title="Zoom out">−</button><span class="mono tiny">${Math.round(this.zoom * 100)}%</span><button class="tb" data-p="zin" title="Zoom in">+</button><button class="tb" data-p="fitw" title="Fit width">Width</button><span class="sep"></span>
      <button class="tb" data-p="annot" aria-pressed="${this.annotate}" title="Write on the PDF (the original file is never changed)">✎ Annotate</button>
      ${this.annotate ? ["pen", "hl", "eraser"].map((t) => `<button class="tb" data-p="tool" data-v="${t}" aria-pressed="${st.tool === t}">${{ pen: "Pen", hl: "Mark", eraser: "Erase" }[t]}</button>`).join("") + S5.INK_COLORS.slice(0, 5).map((c) => `<button class="sw" data-p="color" data-v="${c}" style="background:${c}" aria-pressed="${st.color === c}" aria-label="Colour"></button>`).join("") + `<button class="tb" data-p="undo" title="Undo on current page">↶</button>` : ""}
      <span class="grow"></span>
      ${this.o.onCapture ? `<button class="btn sm" data-p="cap">Capture from p.${this.page}</button>` : ""}
      <input data-p="find" placeholder="Find in PDF" style="width:130px;height:32px;padding:0 8px;border:1px solid var(--rule);border-radius:6px;background:var(--paper)" aria-label="Find in PDF">`;
    this.bar.onclick = (e) => { const t = e.target.closest("[data-p]"); if (!t) return; this.act(t.dataset.p, t.dataset.v); };
    this.bar.onkeydown = (e) => { const t = e.target.closest("[data-p]"); if (!t || e.key !== "Enter") return; if (t.dataset.p === "goto") this.go(parseInt(t.value) || 1); if (t.dataset.p === "find") this.find(t.value); };
  }
  act(a, v) {
    if (a === "prev") this.go(this.page - 1); else if (a === "next") this.go(this.page + 1);
    else if (a === "zin" || a === "zout" || a === "fitw") { if (a === "fitw") { this.zoom = 1; } else this.zoom = S5.clamp(this.zoom * (a === "zin" ? 1.2 : 1 / 1.2), 0.4, 4); S5.ls.set("pdfZoom", this.zoom); this.layout(); }
    else if (a === "annot") { this.annotate = !this.annotate; if (this.annotate && !["pen", "hl", "eraser"].includes(S5.inkState.tool)) S5.inkState.tool = "pen"; this.scroller.querySelectorAll(".overlay").forEach((o) => (o.style.pointerEvents = this.annotate ? "auto" : "none")); this.renderBar(); }
    else if (a === "tool") { S5.inkState.tool = v; this.renderBar(); }
    else if (a === "color") { S5.inkState.color = v; this.renderBar(); }
    else if (a === "undo") { const ink = this.inks.get(this.page); ink && ink.undo(); }
    else if (a === "cap") this.o.onCapture(this.page);
  }
  async find(q) {
    q = (q || "").trim().toLowerCase(); if (!q) return;
    const pages = await S5.indexPdfText(this.file); if (!pages) return S5.ui.toast("Text search is not available for this PDF (scanned pages have no text).");
    const hits = []; pages.forEach((t, i) => { if (t.toLowerCase().includes(q)) hits.push(i + 1); });
    if (!hits.length) return S5.ui.toast(`“${q}” not found`);
    const next = hits.find((p) => p > this.page) || hits[0]; this.go(next); S5.ui.toast(`Found on ${hits.length} page(s): ${hits.slice(0, 12).join(", ")}${hits.length > 12 ? "…" : ""}`);
  }
  go(n) { if (!this.pdf) return; n = S5.clamp(n, 1, this.pdf.numPages); this.page = n; const el = this.scroller.querySelector(`[data-page="${n}"]`); el && el.scrollIntoView({ block: "start" }); this.renderBar(); this.o.onPage && this.o.onPage(n); }
  async layout() {
    const sc = this.scroller; const avail = Math.max(280, sc.clientWidth - 28);
    this.inks.forEach((i) => i.destroy()); this.inks.clear();
    sc.innerHTML = ""; this.views = [];
    const first = await this.pdf.getPage(1); const base = first.getViewport({ scale: 1 });
    this.scale = (avail / base.width) * this.zoom;
    for (let i = 1; i <= this.pdf.numPages; i++) {
      const d = document.createElement("div"); d.className = "pdf-page"; d.dataset.page = i;
      d.style.width = Math.floor(base.width * this.scale) + "px"; d.style.height = Math.floor(base.height * this.scale) + "px";
      sc.appendChild(d);
    }
    this.io?.disconnect();
    this.io = new IntersectionObserver((ents) => { for (const e of ents) if (e.isIntersecting) this.renderPage(+e.target.dataset.page, e.target); }, { root: sc, rootMargin: "600px 0px" });
    sc.querySelectorAll(".pdf-page").forEach((d) => this.io.observe(d));
    this.pio?.disconnect();
    this.pio = new IntersectionObserver((ents) => { for (const e of ents) if (e.isIntersecting && e.intersectionRatio > 0.5) { const n = +e.target.dataset.page; if (n !== this.page) { this.page = n; const g = this.bar.querySelector('[data-p="goto"]'); if (g) g.value = n; const c = this.bar.querySelector('[data-p="cap"]'); if (c) c.textContent = `Capture from p.${n}`; this.o.onPage && this.o.onPage(n); } } }, { root: sc, threshold: [0.5] });
    sc.querySelectorAll(".pdf-page").forEach((d) => this.pio.observe(d));
    if (this.page > 1) setTimeout(() => this.go(this.page), 50);
  }
  async renderPage(n, el) {
    if (el.dataset.done) return; el.dataset.done = 1;
    const pg = await this.pdf.getPage(n); const vp = pg.getViewport({ scale: this.scale }); const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const c = document.createElement("canvas"); c.width = Math.floor(vp.width * dpr); c.height = Math.floor(vp.height * dpr); c.style.width = Math.floor(vp.width) + "px"; c.style.height = Math.floor(vp.height) + "px";
    el.appendChild(c);
    await pg.render({ canvasContext: c.getContext("2d"), viewport: vp, transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null }).promise.catch(() => {});
    // annotation overlay
    const base = pg.getViewport({ scale: 1 });
    let rec = S5.store.list("inkpage", (r) => r.fileId === this.file.id && r.page === n)[0];
    const ov = document.createElement("div"); ov.className = "overlay"; ov.style.pointerEvents = this.annotate ? "auto" : "none"; el.appendChild(ov);
    const doc = rec || { id: S5.uid("ink"), type: "inkpage", fileId: this.file.id, page: n, title: `${this.file.name} p.${n}`, strokes: [], layers: [{ n: "Notes", v: true }], width: base.width, height: base.height, createdAt: S5.now(), subjectId: this.file.subjectId || "", projectId: this.file.projectId || "" };
    const ink = new S5.Ink(ov, { doc, overlay: true, width: base.width, height: base.height, noToolbar: true, scroller: this.scroller });
    this.inks.set(n, ink);
  }
  destroy() { this.io?.disconnect(); this.pio?.disconnect(); this.inks.forEach((i) => i.destroy()); }
};
