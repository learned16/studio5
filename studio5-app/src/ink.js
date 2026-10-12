/* Shared Ink Engine — one engine for notebooks, PDF markup, Drawing Coach, sketches and photo markup.
   Stroke model (document units, stored as tenths for compactness):
   {id, t:'pen'|'hl'|'line'|'rect'|'ell'|'arrow'|'text', c:color, w:width, l:layer, p:[x,y,pressure(0-100),…], d:duration ms, txt?, s?}
   Tools: pen, highlighter, eraser (splits strokes — only the touched segment goes), lasso (select/move/delete),
   shapes, text, hand (pan). Pen-only mode ignores palm/finger contact for drawing and uses fingers to pan/pinch. */
S5.inkState = Object.assign({ tool: "pen", color: "#1b2130", width: 2.2, hlColor: "#f2c94c", shape: "line", eraser: 14, template: null }, S5.ls.get("inkState", {}));
S5.INK_COLORS = ["#1b2130", "#1f4fa8", "#b8392a", "#2d7a4b", "#a26a06", "#7b3fa0", "#8a8f98"];
S5.INK_TEMPLATES = { blank: "Blank", ruled: "Ruled", grid: "Grid 5 mm", dots: "Dots", iso: "Isometric", engineering: "Engineering sheet", title: "Title block" };

S5.Ink = class Ink {
  constructor(host, opts) {
    this.host = host; this.o = opts; this.doc = opts.doc;
    this.W = opts.width || this.doc.width || 1000; this.H = opts.height || this.doc.height || 1414;
    this.strokes = (this.doc.strokes || []).map((s) => ({ ...s }));
    this.layers = this.doc.layers && this.doc.layers.length ? this.doc.layers.map((l) => ({ ...l })) : [{ n: "Layer 1", v: true }];
    this.layer = 0; this.undoS = []; this.redoS = []; this.sel = new Set(); this.ptrs = new Map();
    this.overlay = !!opts.overlay; // PDF page overlay: fixed scale, no own pan
    this.s = 1; this.ox = 0; this.oy = 0; this.bboxes = new WeakMap(); this.ghostAlpha = 0.25;
    this.build();
  }
  build() {
    const h = this.host; h.innerHTML = "";
    if (!this.overlay && !this.o.noToolbar) { this.bar = document.createElement("div"); this.bar.className = "ink-tools"; h.appendChild(this.bar); this.renderBar(); }
    this.stage = document.createElement("div"); this.stage.className = this.overlay ? "overlay" : "ink-stage";
    h.appendChild(this.stage);
    this.cBg = document.createElement("canvas"); this.cMain = document.createElement("canvas"); this.cLive = document.createElement("canvas");
    this.stage.append(this.cBg, this.cMain, this.cLive);
    if (!this.overlay) { this.status = document.createElement("div"); this.status.className = "ink-status"; this.stage.appendChild(this.status); }
    this.bind();
    this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(this.stage);
    if (this.o.refUrl) { this.refImg = new Image(); this.refImg.onload = () => this.drawBg(); this.refImg.src = this.o.refUrl; }
    requestAnimationFrame(() => { this.resize(); if (!this.overlay) this.fit(); });
  }
  destroy() { this.ro?.disconnect(); this.flush(); this.dead = true; }
  /* ---------- toolbar ---------- */
  renderBar() {
    const st = S5.inkState, b = (tool, label, title) => `<button class="tb" data-ink="tool" data-v="${tool}" aria-pressed="${st.tool === tool}" title="${title}">${label}</button>`;
    const icons = { pen: '<svg width="18" height="18" viewBox="0 0 24 24"><path d="M4 20l4-1 11-11-3-3L5 16z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>', hl: '<svg width="18" height="18" viewBox="0 0 24 24"><path d="M5 19h6M9 15l8-8 3 3-8 8H9z" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>', eraser: '<svg width="18" height="18" viewBox="0 0 24 24"><path d="M4 16l9-9 6 6-6 6H8zM11 19h9" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>', lasso: '<svg width="18" height="18" viewBox="0 0 24 24"><ellipse cx="12" cy="10" rx="8" ry="5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-dasharray="3 2"/><path d="M8 14c-1 3 1 5 3 5" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>', shape: '<svg width="18" height="18" viewBox="0 0 24 24"><rect x="4" y="4" width="9" height="9" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="15" cy="15" r="5" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>', text: '<svg width="18" height="18" viewBox="0 0 24 24"><path d="M5 6h14M12 6v13" stroke="currentColor" stroke-width="2" fill="none"/></svg>', hand: '<svg width="18" height="18" viewBox="0 0 24 24"><path d="M8 12V6a1.5 1.5 0 013 0v5V4.5a1.5 1.5 0 013 0V11V6a1.5 1.5 0 013 0v8c0 4-3 6-6 6s-5-2-6.5-4L4 12.5a1.5 1.5 0 012.5-1.5L8 13" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>' };
    const cols = S5.INK_COLORS.map((c) => `<button class="sw" data-ink="color" data-v="${c}" style="background:${c}" aria-pressed="${st.color === c}" aria-label="Colour ${c}"></button>`).join("");
    this.bar.innerHTML = `${b("pen", icons.pen, "Pen (P)")}${b("hl", icons.hl, "Highlighter (H)")}${b("eraser", icons.eraser, "Eraser — removes only the part you touch (E)")}${b("lasso", icons.lasso, "Lasso select / move (L)")}${b("shape", icons.shape, "Shapes")}${b("text", icons.text, "Text (T)")}${b("hand", icons.hand, "Pan / zoom (space)")}
      <span class="sep"></span>${cols}<span class="sep"></span>
      <select data-ink="width" aria-label="Line width">${[0.8, 1.4, 2.2, 3.5, 6, 10].map((w) => `<option value="${w}" ${st.width == w ? "selected" : ""}>${w} pt</option>`).join("")}</select>
      ${st.tool === "shape" ? `<select data-ink="shape" aria-label="Shape">${[["line", "Line"], ["arrow", "Arrow"], ["rect", "Rectangle"], ["ell", "Ellipse"]].map(([v, n]) => `<option value="${v}" ${st.shape === v ? "selected" : ""}>${n}</option>`).join("")}</select>` : ""}
      ${this.o.noTemplate ? "" : `<select data-ink="template" aria-label="Paper">${Object.entries(S5.INK_TEMPLATES).map(([k, n]) => `<option value="${k}" ${(this.doc.template || "blank") === k ? "selected" : ""}>${n}</option>`).join("")}</select>`}
      <select data-ink="layer" aria-label="Layer">${this.layers.map((l, i) => `<option value="${i}" ${i === this.layer ? "selected" : ""}>${S5.esc(l.n)}${l.v ? "" : " (hidden)"}</option>`).join("")}<option value="+">+ New layer</option><option value="toggle">Show / hide current</option></select>
      <span class="sep"></span>
      <button class="tb" data-ink="undo" title="Undo (Ctrl+Z)">↶</button><button class="tb" data-ink="redo" title="Redo (Ctrl+Y)">↷</button>
      ${this.sel.size ? `<button class="tb" data-ink="delsel" title="Delete selection" style="color:var(--redline)">Delete ${this.sel.size}</button>` : ""}
      <button class="tb" data-ink="fit" title="Fit page">Fit</button>
      <button class="tb" data-ink="pen-only" aria-pressed="${S5.settings.get("penOnly")}" title="Pen-only: fingers pan and zoom, palm never draws">Pen only</button>
      ${this.o.ghost ? `<label class="tiny row" style="gap:4px">Overlay <input type="range" min="0" max="80" value="${this.ghostAlpha * 100}" data-ink="ghost" style="width:70px"></label>` : ""}
      <button class="tb" data-ink="png" title="Export PNG">PNG</button>`;
    this.bar.onclick = (e) => { const t = e.target.closest("[data-ink]"); if (t) this.barAction(t.dataset.ink, t.dataset.v); };
    this.bar.onchange = (e) => { const t = e.target.closest("[data-ink]"); if (t) this.barAction(t.dataset.ink, t.value); };
    this.bar.oninput = (e) => { const t = e.target.closest('[data-ink="ghost"]'); if (t) { this.ghostAlpha = t.value / 100; this.drawBg(); } };
  }
  barAction(a, v) {
    const st = S5.inkState;
    if (a === "tool") { st.tool = v; this.clearSel(); }
    else if (a === "color") { st.color = v; if (this.sel.size) this.recolorSel(v); }
    else if (a === "width") st.width = parseFloat(v);
    else if (a === "shape") st.shape = v;
    else if (a === "template") { this.doc.template = v; this.drawBg(); this.dirty(); }
    else if (a === "layer") { if (v === "+") { this.layers.push({ n: "Layer " + (this.layers.length + 1), v: true }); this.layer = this.layers.length - 1; this.dirty(); } else if (v === "toggle") { this.layers[this.layer].v = !this.layers[this.layer].v; this.redraw(); this.dirty(); } else this.layer = +v; }
    else if (a === "undo") this.undo(); else if (a === "redo") this.redo();
    else if (a === "delsel") this.deleteSel();
    else if (a === "fit") this.fit();
    else if (a === "pen-only") { S5.settings.set("penOnly", !S5.settings.get("penOnly")); }
    else if (a === "png") this.exportPNG();
    S5.ls.set("inkState", { tool: st.tool, color: st.color, width: st.width, shape: st.shape });
    S5.bus.emit("inkbar");
    if (this.bar) this.renderBar();
  }
  /* ---------- geometry ---------- */
  resize() {
    if (this.dead) return;
    const r = this.stage.getBoundingClientRect(); const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    if (r.width < 2 || r.height < 2) return;
    this.cw = r.width; this.ch = r.height; this.dpr = dpr;
    for (const c of [this.cBg, this.cMain, this.cLive]) { c.width = Math.round(r.width * dpr); c.height = Math.round(r.height * dpr); c.style.width = r.width + "px"; c.style.height = r.height + "px"; }
    if (this.overlay) { this.s = r.width / this.W; this.ox = 0; this.oy = 0; }
    this.redraw();
  }
  fit() { if (this.overlay || !this.cw) return; const s = Math.min(this.cw / this.W, this.ch / this.H) * 0.96; this.s = s; this.ox = (this.cw - this.W * s) / 2; this.oy = Math.max(8, (this.ch - this.H * s) / 2); this.redraw(); }
  toDoc(e) { const r = this.stage.getBoundingClientRect(); return [(e.clientX - r.left - this.ox) / this.s, (e.clientY - r.top - this.oy) / this.s]; }
  bbox(st) {
    let b = this.bboxes.get(st); if (b) return b;
    const p = st.p; let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (let i = 0; i < p.length; i += 3) { const x = p[i] / 10, y = p[i + 1] / 10; if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y; }
    if (st.t === "text") { x1 = x0 + (st.txt || "").length * (st.s || 18) * 0.55; y0 -= st.s || 18; }
    const pad = (st.w || 2) + 2; b = [x0 - pad, y0 - pad, x1 + pad, y1 + pad]; this.bboxes.set(st, b); return b;
  }
  /* ---------- rendering ---------- */
  ctx(c) { const x = c.getContext("2d"); x.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); return x; }
  redraw() { if (!this.cw) return; this.drawBg(); this.drawMain(); this.clearLive(); this.updateStatus(); }
  drawBg() {
    if (!this.cw) return;
    const x = this.ctx(this.cBg); x.clearRect(0, 0, this.cw, this.ch);
    x.save(); x.translate(this.ox, this.oy); x.scale(this.s, this.s);
    if (!this.overlay) { x.fillStyle = "#ffffff"; x.shadowColor = "rgba(0,0,0,.12)"; x.shadowBlur = 8; x.fillRect(0, 0, this.W, this.H); x.shadowBlur = 0; }
    if (this.refImg && this.refImg.complete) { x.globalAlpha = this.o.refAlpha ?? 0.35; const r = Math.min(this.W / this.refImg.width, this.H / this.refImg.height); x.drawImage(this.refImg, 0, 0, this.refImg.width * r, this.refImg.height * r); x.globalAlpha = 1; }
    S5.drawTemplate(x, this.doc.template || "blank", this.W, this.H, this.doc);
    if (this.o.guide) S5.drawGuide(x, this.o.guide, this.W, this.H);
    if (this.o.ghost && this.ghostAlpha > 0) { x.globalAlpha = this.ghostAlpha; for (const st of this.o.ghost) this.paint(x, { ...st, c: "#1f4fa8" }); x.globalAlpha = 1; }
    x.restore();
  }
  drawMain() {
    const x = this.ctx(this.cMain); x.clearRect(0, 0, this.cw, this.ch);
    x.save(); x.translate(this.ox, this.oy); x.scale(this.s, this.s);
    const vis = [-this.ox / this.s, -this.oy / this.s, (this.cw - this.ox) / this.s, (this.ch - this.oy) / this.s];
    for (const st of this.strokes) {
      if (this.layers[st.l || 0] && !this.layers[st.l || 0].v) continue;
      const b = this.bbox(st); if (b[2] < vis[0] || b[0] > vis[2] || b[3] < vis[1] || b[1] > vis[3]) continue;
      this.paint(x, st);
      if (this.sel.has(st.id)) { x.save(); x.strokeStyle = "#1f4fa8"; x.setLineDash([4 / this.s, 3 / this.s]); x.lineWidth = 1 / this.s; x.strokeRect(b[0], b[1], b[2] - b[0], b[3] - b[1]); x.restore(); }
    }
    x.restore();
  }
  paint(x, st) {
    const p = st.p, n = p.length / 3; if (!n) return;
    x.save(); x.strokeStyle = x.fillStyle = st.c || "#1b2130"; x.lineCap = "round"; x.lineJoin = "round";
    if (st.t === "hl") { x.globalAlpha *= 0.32; x.lineCap = "butt"; x.lineWidth = (st.w || 2) * 6; x.beginPath(); x.moveTo(p[0] / 10, p[1] / 10); for (let i = 3; i < p.length; i += 3) x.lineTo(p[i] / 10, p[i + 1] / 10); x.stroke(); x.restore(); return; }
    if (st.t === "text") { x.font = `${st.s || 18}px "IBM Plex Sans", "IBM Plex Sans Arabic", sans-serif`; x.direction = S5.hasArabic(st.txt) ? "rtl" : "ltr"; x.textAlign = "left"; x.fillText(st.txt || "", p[0] / 10, p[1] / 10); x.restore(); return; }
    if (st.t === "line" || st.t === "arrow" || st.t === "rect" || st.t === "ell") {
      const [ax, ay, bx, by] = [p[0] / 10, p[1] / 10, p[3] / 10, p[4] / 10]; x.lineWidth = st.w || 2; x.beginPath();
      if (st.t === "rect") x.rect(Math.min(ax, bx), Math.min(ay, by), Math.abs(bx - ax), Math.abs(by - ay));
      else if (st.t === "ell") x.ellipse((ax + bx) / 2, (ay + by) / 2, Math.abs(bx - ax) / 2 || 0.1, Math.abs(by - ay) / 2 || 0.1, 0, 0, Math.PI * 2);
      else { x.moveTo(ax, ay); x.lineTo(bx, by); if (st.t === "arrow") { const a = Math.atan2(by - ay, bx - ax), L = 10 + (st.w || 2) * 3; x.moveTo(bx, by); x.lineTo(bx - L * Math.cos(a - 0.4), by - L * Math.sin(a - 0.4)); x.moveTo(bx, by); x.lineTo(bx - L * Math.cos(a + 0.4), by - L * Math.sin(a + 0.4)); } }
      x.stroke(); x.restore(); return;
    }
    // pressure pen: quadratic segments with per-segment width
    const w = st.w || 2;
    if (n === 1) { x.beginPath(); x.arc(p[0] / 10, p[1] / 10, w * (0.35 + 0.65 * p[2] / 100) / 2, 0, Math.PI * 2); x.fill(); x.restore(); return; }
    let px = p[0] / 10, py = p[1] / 10;
    for (let i = 3; i < p.length; i += 3) {
      const cx = p[i] / 10, cy = p[i + 1] / 10, pr = p[i + 2] / 100;
      const mx = (px + cx) / 2, my = (py + cy) / 2;
      x.lineWidth = w * (0.35 + 0.65 * pr); x.beginPath();
      if (i === 3) x.moveTo(px, py); else { const qx = p[i - 6] / 10, qy = p[i - 5] / 10; x.moveTo((qx + px) / 2, (qy + py) / 2); }
      x.quadraticCurveTo(px, py, mx, my); x.stroke();
      px = cx; py = cy;
    }
    x.beginPath(); const lx = p[p.length - 6] / 10, ly = p[p.length - 5] / 10; x.moveTo((lx + px) / 2, (ly + py) / 2); x.lineTo(px, py); x.stroke();
    x.restore();
  }
  clearLive() { if (this.cw) this.ctx(this.cLive).clearRect(0, 0, this.cw, this.ch); }
  updateStatus() { if (this.status) this.status.textContent = `${Math.round(this.s * 100)}% · ${this.strokes.length} strokes · ${this.layers[this.layer]?.n || ""}${this.savedAt ? " · saved" : ""}`; }
  /* ---------- input ---------- */
  bind() {
    const el = this.stage;
    el.addEventListener("pointerdown", (e) => this.down(e));
    el.addEventListener("pointermove", (e) => this.move(e));
    el.addEventListener("pointerup", (e) => this.up(e));
    el.addEventListener("pointercancel", (e) => this.up(e, true));
    el.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse" && this.cur) this.up(e); });
    el.addEventListener("contextmenu", (e) => e.preventDefault());
    if (!this.overlay) el.addEventListener("wheel", (e) => { e.preventDefault(); if (e.ctrlKey || e.metaKey) this.zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * 0.01)); else { this.ox -= e.deltaX; this.oy -= e.deltaY; this.redraw(); } }, { passive: false });
    this.keyH = (e) => {
      if (!this.stage.isConnected) { document.removeEventListener("keydown", this.keyH); return; }
      if (e.target.closest && e.target.closest("input,textarea,select")) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") { e.preventDefault(); e.shiftKey ? this.redo() : this.undo(); }
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") { e.preventDefault(); this.redo(); }
      else if ((e.key === "Delete" || e.key === "Backspace") && this.sel.size) this.deleteSel();
      else if (!e.ctrlKey && !e.metaKey && !this.overlay) { const m = { p: "pen", h: "hl", e: "eraser", l: "lasso", t: "text" }[e.key]; if (m && this.bar) this.barAction("tool", m); }
    };
    if (!this.overlay) document.addEventListener("keydown", this.keyH);
  }
  zoomAt(cx, cy, f) { const r = this.stage.getBoundingClientRect(); const px = cx - r.left, py = cy - r.top; const ns = S5.clamp(this.s * f, 0.1, 8); this.ox = px - (px - this.ox) * (ns / this.s); this.oy = py - (py - this.oy) * (ns / this.s); this.s = ns; this.redraw(); }
  down(e) {
    if (this.o.readOnly) return;
    const st = S5.inkState; const penOnly = S5.settings.get("penOnly");
    this.ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY, type: e.pointerType });
    const touches = [...this.ptrs.values()].filter((p) => p.type === "touch");
    // a finger while a pen is active, or fingers in pen-only mode → navigation, never ink
    const fingerNav = e.pointerType === "touch" && (penOnly || touches.length > 1);
    if (this.overlay && fingerNav) { const sc = this.o.scroller; if (sc) { e.preventDefault(); this.nav = { scroll: true, x: e.clientX, y: e.clientY, st: sc.scrollTop, sl: sc.scrollLeft }; } return; } // fingers scroll the PDF
    e.preventDefault(); try { this.stage.setPointerCapture(e.pointerId); } catch {}
    if (touches.length > 1 && this.cur) { this.cur = null; this.clearLive(); }
    if (fingerNav || st.tool === "hand" || e.button === 1) { this.nav = { x: e.clientX, y: e.clientY, ox: this.ox, oy: this.oy, s: this.s, d: this.pinchDist() }; return; }
    if (this.cur) return;
    const [x, y] = this.toDoc(e);
    const pr = e.pointerType === "pen" ? (e.pressure || 0.5) : 0.5;
    this.t0 = performance.now();
    if (st.tool === "text") { this.placeText(x, y, e); return; }
    if (st.tool === "lasso") {
      if (this.sel.size && this.inSelBox(x, y)) { this.cur = { kind: "move", x0: x, y0: y, dx: 0, dy: 0 }; return; }
      this.clearSel(); this.cur = { kind: "lasso", poly: [x, y] }; return;
    }
    if (st.tool === "eraser") { this.cur = { kind: "erase", removed: [], added: [] }; this.eraseAt(x, y); return; }
    if (st.tool === "shape") { this.cur = { kind: "shape", st: { id: S5.uid("s"), t: st.shape, c: st.color, w: st.width, l: this.layer, p: [Math.round(x * 10), Math.round(y * 10), 50, Math.round(x * 10), Math.round(y * 10), 50] } }; return; }
    const t = st.tool === "hl" ? "hl" : "pen";
    this.cur = { kind: "ink", st: { id: S5.uid("s"), t, c: t === "hl" ? (st.color === "#1b2130" ? st.hlColor : st.color) : st.color, w: st.width, l: this.layer, p: [Math.round(x * 10), Math.round(y * 10), Math.round(pr * 100)] } };
  }
  pinchDist() { const t = [...this.ptrs.values()].filter((p) => p.type === "touch"); if (t.length < 2) return 0; return Math.hypot(t[0].x - t[1].x, t[0].y - t[1].y); }
  move(e) {
    if (this.ptrs.has(e.pointerId)) { const p = this.ptrs.get(e.pointerId); p.x = e.clientX; p.y = e.clientY; }
    if (this.nav && this.nav.scroll) { const sc = this.o.scroller; sc.scrollTop = this.nav.st - (e.clientY - this.nav.y); sc.scrollLeft = this.nav.sl - (e.clientX - this.nav.x); return; }
    if (this.nav) {
      const d = this.pinchDist();
      if (d && this.nav.d && !this.overlay) { const t = [...this.ptrs.values()].filter((p) => p.type === "touch"); const cx = (t[0].x + t[1].x) / 2, cy = (t[0].y + t[1].y) / 2; this.s = this.nav.s; this.ox = this.nav.ox; this.oy = this.nav.oy; this.zoomAt(cx, cy, d / this.nav.d); this.ox += cx - this.nav.x; this.oy += cy - this.nav.y; this.redraw(); if (!this.nav.mid) { this.nav.mid = true; this.nav.x = cx; this.nav.y = cy; } }
      else if (!this.overlay) { this.ox = this.nav.ox + (e.clientX - this.nav.x); this.oy = this.nav.oy + (e.clientY - this.nav.y); this.redraw(); }
      return;
    }
    const c = this.cur; if (!c) return;
    e.preventDefault();
    const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    if (c.kind === "ink") {
      const p = c.st.p;
      for (const ev of evs.length ? evs : [e]) {
        const [x, y] = this.toDoc(ev); const xi = Math.round(x * 10), yi = Math.round(y * 10);
        const lx = p[p.length - 3], ly = p[p.length - 2];
        if (Math.abs(xi - lx) + Math.abs(yi - ly) < 6 / this.s) continue;
        p.push(xi, yi, Math.round((ev.pointerType === "pen" ? (ev.pressure || 0.5) : 0.5) * 100));
      }
      this.drawLiveStroke(c.st);
    } else if (c.kind === "shape") { const [x, y] = this.toDoc(e); c.st.p[3] = Math.round(x * 10); c.st.p[4] = Math.round(y * 10); this.drawLiveStroke(c.st, true); }
    else if (c.kind === "erase") { for (const ev of evs.length ? evs : [e]) { const [x, y] = this.toDoc(ev); this.eraseAt(x, y); } }
    else if (c.kind === "lasso") { const [x, y] = this.toDoc(e); c.poly.push(x, y); this.drawLasso(c.poly); }
    else if (c.kind === "move") { const [x, y] = this.toDoc(e); c.dx = x - c.x0; c.dy = y - c.y0; this.drawMoving(c); }
  }
  up(e, cancel) {
    this.ptrs.delete(e.pointerId);
    if (this.nav) { if (![...this.ptrs.values()].some((p) => p.type === "touch") || e.pointerType !== "touch") this.nav = null; return; }
    const c = this.cur; if (!c) return; this.cur = null;
    if (cancel && c.kind === "ink") { this.clearLive(); return; }
    if (c.kind === "ink" || c.kind === "shape") { c.st.d = Math.round(performance.now() - this.t0); this.commit({ op: "add", strokes: [c.st] }); }
    else if (c.kind === "erase") { if (c.removed.length) this.pushUndo({ op: "replace", removed: c.removed, added: c.added }); this.dirty(); }
    else if (c.kind === "lasso") { this.selectPoly(c.poly); this.clearLive(); }
    else if (c.kind === "move") { if (Math.abs(c.dx) + Math.abs(c.dy) > 0.5) { this.translateSel(c.dx, c.dy); this.pushUndo({ op: "move", ids: [...this.sel], dx: c.dx, dy: c.dy }); this.dirty(); } this.clearLive(); this.drawMain(); }
  }
  drawLiveStroke(st, clear) {
    const x = this.ctx(this.cLive); if (clear || st.t === "hl") x.clearRect(0, 0, this.cw, this.ch);
    x.save(); x.translate(this.ox, this.oy); x.scale(this.s, this.s);
    if (st.t === "pen" && !clear) { const n = st.p.length; const sub = { ...st, p: st.p.slice(Math.max(0, n - 12)) }; this.paint(x, sub); } else this.paint(x, st);
    x.restore();
  }
  drawLasso(poly) { const x = this.ctx(this.cLive); x.clearRect(0, 0, this.cw, this.ch); x.save(); x.translate(this.ox, this.oy); x.scale(this.s, this.s); x.strokeStyle = "#1f4fa8"; x.setLineDash([5 / this.s, 4 / this.s]); x.lineWidth = 1.2 / this.s; x.beginPath(); x.moveTo(poly[0], poly[1]); for (let i = 2; i < poly.length; i += 2) x.lineTo(poly[i], poly[i + 1]); x.closePath(); x.stroke(); x.restore(); }
  drawMoving(c) { const x = this.ctx(this.cLive); x.clearRect(0, 0, this.cw, this.ch); x.save(); x.translate(this.ox + c.dx * this.s, this.oy + c.dy * this.s); x.scale(this.s, this.s); x.globalAlpha = 0.6; for (const st of this.strokes) if (this.sel.has(st.id)) this.paint(x, st); x.restore(); }
  /* ---------- operations ---------- */
  commit(op) { this.apply(op); this.pushUndo(op); this.dirty(); }
  apply(op, inverse) {
    if (op.op === "add") { if (inverse) { const ids = new Set(op.strokes.map((s) => s.id)); this.strokes = this.strokes.filter((s) => !ids.has(s.id)); } else this.strokes.push(...op.strokes); }
    else if (op.op === "replace" || op.op === "delete") { const rem = inverse ? op.added || [] : op.removed; const add = inverse ? op.removed : op.added || []; const ids = new Set(rem.map((s) => s.id)); this.strokes = this.strokes.filter((s) => !ids.has(s.id)).concat(add); }
    else if (op.op === "move") { const k = inverse ? -1 : 1; this.sel = new Set(op.ids); this.translateSel(op.dx * k, op.dy * k); }
    else if (op.op === "recolor") { const map = inverse ? op.before : op.after; this.strokes = this.strokes.map((s) => (s.id in map ? { ...s, c: map[s.id] } : s)); }
    this.redrawMainOnly();
  }
  redrawMainOnly() { if (this.cw) { this.drawMain(); this.clearLive(); this.updateStatus(); } }
  pushUndo(op) { this.undoS.push(op); if (this.undoS.length > 300) this.undoS.shift(); this.redoS = []; }
  undo() { const op = this.undoS.pop(); if (!op) return; this.apply(op, true); this.redoS.push(op); this.dirty(); }
  redo() { const op = this.redoS.pop(); if (!op) return; this.apply(op); this.undoS.push(op); this.dirty(); }
  eraseAt(x, y) {
    const r = (S5.inkState.eraser || 14) / Math.max(this.s, 0.4); const r2 = r * r; const c = this.cur;
    const next = []; let changed = false;
    for (const st of this.strokes) {
      if ((this.layers[st.l || 0] && !this.layers[st.l || 0].v) || (st.l || 0) !== this.layer && this.layers.length > 1) { next.push(st); continue; }
      const b = this.bbox(st); if (x < b[0] - r || x > b[2] + r || y < b[1] - r || y > b[3] + r) { next.push(st); continue; }
      const p = st.p; const hit = [];
      for (let i = 0; i < p.length; i += 3) { const dx = p[i] / 10 - x, dy = p[i + 1] / 10 - y; hit.push(dx * dx + dy * dy <= r2); }
      if (st.t !== "pen" && st.t !== "hl") { // shapes and text go as a whole
        const segHit = hit.some(Boolean) || (st.t !== "text" && S5.segDist(x, y, p[0] / 10, p[1] / 10, p[3] / 10, p[4] / 10) < r);
        if (segHit) { c.removed.push(st); changed = true; } else next.push(st); continue;
      }
      if (!hit.some(Boolean)) { next.push(st); continue; }
      changed = true; c.removed.push(st);
      // keep the untouched runs as new strokes — the eraser removes only the segment it touched
      let run = [];
      const flush = () => { if (run.length >= 6) { const ns = { ...st, id: S5.uid("s"), p: run }; next.push(ns); c.added.push(ns); } run = []; };
      for (let i = 0, k = 0; i < p.length; i += 3, k++) { if (hit[k]) flush(); else run.push(p[i], p[i + 1], p[i + 2]); }
      flush();
    }
    if (changed) { // removed strokes that were added in this same gesture should not be restored on undo
      const addedIds = new Set(c.added.map((s) => s.id));
      c.removed = c.removed.filter((s) => { if (addedIds.has(s.id)) { addedIds.delete(s.id); c.added = c.added.filter((a) => a.id !== s.id); return false; } return true; });
      this.strokes = next; this.redrawMainOnly();
    }
    const lx = this.ctx(this.cLive); lx.clearRect(0, 0, this.cw, this.ch); lx.beginPath(); lx.strokeStyle = "rgba(184,57,42,.6)"; lx.arc(x * this.s + this.ox, y * this.s + this.oy, r * this.s, 0, Math.PI * 2); lx.stroke();
  }
  selectPoly(poly) {
    if (poly.length < 6) return;
    const inside = (px, py) => { let c = false; for (let i = 0, j = poly.length - 2; i < poly.length; j = i, i += 2) { const xi = poly[i], yi = poly[i + 1], xj = poly[j], yj = poly[j + 1]; if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) c = !c; } return c; };
    for (const st of this.strokes) { const p = st.p; for (let i = 0; i < p.length; i += 3) if (inside(p[i] / 10, p[i + 1] / 10)) { this.sel.add(st.id); break; } }
    this.drawMain(); if (this.bar) this.renderBar();
  }
  inSelBox(x, y) { for (const st of this.strokes) if (this.sel.has(st.id)) { const b = this.bbox(st); if (x >= b[0] && x <= b[2] && y >= b[1] && y <= b[3]) return true; } return false; }
  translateSel(dx, dy) { const ix = Math.round(dx * 10), iy = Math.round(dy * 10); this.strokes = this.strokes.map((st) => { if (!this.sel.has(st.id)) return st; const p = st.p.slice(); for (let i = 0; i < p.length; i += 3) { p[i] += ix; p[i + 1] += iy; } return { ...st, p }; }); this.drawMain(); }
  clearSel() { if (this.sel.size) { this.sel.clear(); this.drawMain(); } }
  deleteSel() { const rem = this.strokes.filter((s) => this.sel.has(s.id)); if (!rem.length) return; this.sel.clear(); this.commit({ op: "delete", removed: rem, added: [] }); if (this.bar) this.renderBar(); }
  recolorSel(c) { const before = {}, after = {}; for (const s of this.strokes) if (this.sel.has(s.id)) { before[s.id] = s.c; after[s.id] = c; } this.commit({ op: "recolor", before, after }); }
  placeText(x, y, e) {
    const r = this.stage.getBoundingClientRect(); const inp = document.createElement("input"); inp.className = "ink-text-edit"; inp.dir = "auto";
    inp.style.left = e.clientX - r.left + "px"; inp.style.top = e.clientY - r.top - 18 + "px"; inp.placeholder = "Type, then Enter";
    this.stage.appendChild(inp); setTimeout(() => inp.focus(), 0);
    const done = (ok) => { if (inp.dataset.done) return; inp.dataset.done = 1; const v = inp.value.trim(); inp.remove(); if (ok && v) this.commit({ op: "add", strokes: [{ id: S5.uid("s"), t: "text", txt: v, s: 14 + S5.inkState.width * 3, c: S5.inkState.color, l: this.layer, p: [Math.round(x * 10), Math.round(y * 10), 50] }] }); };
    inp.addEventListener("keydown", (k) => { if (k.key === "Enter") done(true); if (k.key === "Escape") done(false); });
    inp.addEventListener("blur", () => done(true));
  }
  /* ---------- persistence ---------- */
  dirty() {
    this.savedAt = null; this.ver = (this.ver || 0) + 1; this.updateStatus();
    const snap = { ...this.doc, strokes: this.strokes, layers: this.layers, updatedAt: S5.now() };
    try { S5.ls.set("journal", { rec: snap }); } catch {}
    clearTimeout(this.saveT); this.saveT = setTimeout(() => this.flush(), 500);
    this.o.onChange && this.o.onChange(this.strokes);
  }
  async flush() {
    clearTimeout(this.saveT); this.saveT = null;
    if (this.savingNow) { this.again = true; return; }
    if (!this.ver || this.ver === this.savedVer) return;
    const ver = this.ver; this.savingNow = true;
    try { const cur = S5.store.raw(this.doc.id); const rec = { ...(cur || this.doc), strokes: this.strokes.slice(), layers: this.layers.map((l) => ({ ...l })), template: this.doc.template, width: this.W, height: this.H }; await S5.store.put(rec, { silent: true }); this.doc = rec; this.savedVer = ver; if (ver === this.ver) S5.ls.del("journal"); this.savedAt = Date.now(); this.updateStatus(); }
    finally { this.savingNow = false; if (this.again) { this.again = false; this.flush(); } }
  }
  async exportPNG(scale = 2) { const c = this.toCanvas(scale); const blob = await new Promise((r) => c.toBlob(r, "image/png")); S5.ui.saveFile(`${(this.doc.title || "ink").replace(/[^\w؀-ۿ -]/g, "")}.png`, blob); }
  toCanvas(scale = 1) {
    const c = document.createElement("canvas"); c.width = this.W * scale; c.height = this.H * scale; const x = c.getContext("2d"); x.scale(scale, scale);
    x.fillStyle = "#fff"; x.fillRect(0, 0, this.W, this.H); S5.drawTemplate(x, this.doc.template || "blank", this.W, this.H, this.doc);
    for (const st of this.strokes) if (!this.layers[st.l || 0] || this.layers[st.l || 0].v) this.paint(x, st); return c;
  }
};
S5.segDist = (px, py, ax, ay, bx, by) => { const dx = bx - ax, dy = by - ay; const L = dx * dx + dy * dy || 1; let t = ((px - ax) * dx + (py - ay) * dy) / L; t = S5.clamp(t, 0, 1); return Math.hypot(px - (ax + t * dx), py - (ay + t * dy)); };

/* paper templates — W is document width in units (1000 ≈ A4 width; 1 mm ≈ 4.76 units) */
S5.drawTemplate = (x, tpl, W, H, doc) => {
  const mm = W / 210; x.save(); x.lineWidth = 0.6;
  const lines = (step, color) => { x.strokeStyle = color; x.beginPath(); for (let y = step * 3; y < H; y += step) { x.moveTo(0, y); x.lineTo(W, y); } x.stroke(); };
  const grid = (step, color) => { x.strokeStyle = color; x.beginPath(); for (let i = step; i < W; i += step) { x.moveTo(i, 0); x.lineTo(i, H); } for (let j = step; j < H; j += step) { x.moveTo(0, j); x.lineTo(W, j); } x.stroke(); };
  if (tpl === "ruled") { lines(8 * mm, "#cfd8e6"); x.strokeStyle = "#e9b3ab"; x.beginPath(); x.moveTo(25 * mm, 0); x.lineTo(25 * mm, H); x.stroke(); }
  if (tpl === "grid" || tpl === "engineering") { grid(5 * mm, "#e3e8ef"); x.lineWidth = 0.8; grid(25 * mm, "#ccd5e2"); }
  if (tpl === "dots") { x.fillStyle = "#b9c2cf"; for (let i = 5 * mm; i < W; i += 5 * mm) for (let j = 5 * mm; j < H; j += 5 * mm) { x.beginPath(); x.arc(i, j, 0.9, 0, 6.3); x.fill(); } }
  if (tpl === "iso") { x.strokeStyle = "#dde3ec"; const s = 6 * mm; const t = Math.tan(Math.PI / 6); x.beginPath(); for (let i = -H; i < W + H; i += s / Math.cos(Math.PI / 6) * 1) { x.moveTo(i, 0); x.lineTo(i + H / t, H); x.moveTo(i, 0); x.lineTo(i - H / t, H); } for (let i = 0; i < W; i += s) { x.moveTo(i, 0); x.lineTo(i, H); } x.stroke(); }
  if (tpl === "engineering" || tpl === "title") {
    x.strokeStyle = "#2a3346"; x.lineWidth = 1.6; x.strokeRect(10 * mm, 10 * mm, W - 20 * mm, H - 20 * mm);
    const tbW = 100 * mm, tbH = 26 * mm, tx = W - 10 * mm - tbW, ty = H - 10 * mm - tbH; x.lineWidth = 1; x.strokeRect(tx, ty, tbW, tbH);
    x.beginPath(); x.moveTo(tx, ty + tbH / 2); x.lineTo(tx + tbW, ty + tbH / 2); x.moveTo(tx + tbW * 0.62, ty); x.lineTo(tx + tbW * 0.62, ty + tbH); x.stroke();
    x.fillStyle = "#2a3346"; x.font = `${3.2 * mm}px "IBM Plex Mono", monospace`;
    x.fillText((doc?.title || "TITLE").slice(0, 34), tx + 2 * mm, ty + tbH / 2 - 3 * mm); x.fillText("SCALE " + (doc?.scale || "1:50"), tx + tbW * 0.62 + 2 * mm, ty + tbH / 2 - 3 * mm);
    x.fillText("STUDIO5 · " + S5.fmtDate(doc?.createdAt || S5.now()), tx + 2 * mm, ty + tbH - 3 * mm); x.fillText("SHEET " + (doc?.sheet || "01"), tx + tbW * 0.62 + 2 * mm, ty + tbH - 3 * mm);
  }
  x.restore();
};
/* Drawing Coach guides */
S5.drawGuide = (x, g, W, H) => {
  x.save(); x.beginPath(); x.rect(0, 0, W, H); x.clip(); x.strokeStyle = "rgba(31,79,168,.35)"; x.lineWidth = 0.8; x.setLineDash([6, 5]);
  const hy = H * 0.42;
  if (g === "1pt") { const vx = W / 2; x.beginPath(); x.moveTo(0, hy); x.lineTo(W, hy); for (let a = 0; a < 16; a++) { const ang = (a / 16) * Math.PI * 2; x.moveTo(vx, hy); x.lineTo(vx + Math.cos(ang) * W, hy + Math.sin(ang) * W); } x.stroke(); x.setLineDash([]); x.fillStyle = "rgba(31,79,168,.8)"; x.beginPath(); x.arc(vx, hy, 4, 0, 6.3); x.fill(); x.font = "12px IBM Plex Mono"; x.fillText("VP · horizon (eye level)", vx + 8, hy - 8); }
  if (g === "2pt") { const v1 = -W * 0.15, v2 = W * 1.15; x.beginPath(); x.moveTo(0, hy); x.lineTo(W, hy); for (let a = -6; a <= 6; a++) { x.moveTo(v1, hy); x.lineTo(W * 1.2, hy + a * H * 0.12); x.moveTo(v2, hy); x.lineTo(-W * 0.2, hy + a * H * 0.12); } x.stroke(); x.setLineDash([]); x.font = "12px IBM Plex Mono"; x.fillStyle = "rgba(31,79,168,.8)"; x.fillText("horizon — both VPs sit on this line", 12, hy - 8); }
  if (g === "lines") { x.setLineDash([]); x.strokeStyle = "rgba(31,79,168,.15)"; x.beginPath(); for (let y = 60; y < H - 40; y += 60) { x.moveTo(80, y); x.lineTo(W - 80, y); } x.stroke(); }
  if (g === "grid") S5.drawTemplate(x, "grid", W, H);
  if (g === "iso") S5.drawTemplate(x, "iso", W, H);
  x.restore();
};
/* Basic geometric analysis for Drawing Coach Lite (measured, not judged) */
S5.inkAnalyze = (strokes) => {
  const pens = strokes.filter((s) => s.t === "pen" && s.p.length >= 6);
  const out = { strokes: pens.length, avgStraightness: null, angleSpread: null, feathering: 0, avgSpeed: null, convergence: null };
  if (!pens.length) return out;
  const st = [], angles = [], speeds = [], lines = [];
  for (const s of pens) {
    const p = s.p, ax = p[0] / 10, ay = p[1] / 10, bx = p[p.length - 3] / 10, by = p[p.length - 2] / 10;
    const chord = Math.hypot(bx - ax, by - ay); let len = 0, maxDev = 0;
    for (let i = 3; i < p.length; i += 3) { len += Math.hypot(p[i] / 10 - p[i - 3] / 10, p[i + 1] / 10 - p[i - 2] / 10); maxDev = Math.max(maxDev, S5.segDist(p[i] / 10, p[i + 1] / 10, ax, ay, bx, by)); }
    if (len < 40) { out.feathering++; continue; }
    if (chord / len > 0.9) { st.push(1 - maxDev / Math.max(chord, 1)); let a = Math.atan2(by - ay, bx - ax) * 180 / Math.PI; if (a < 0) a += 180; angles.push(a); lines.push([ax, ay, bx, by]); }
    if (s.d) speeds.push(len / s.d * 1000);
  }
  if (st.length) out.avgStraightness = S5.round((st.reduce((a, b) => a + b, 0) / st.length) * 100, 1);
  if (angles.length > 1) { const m = angles.reduce((a, b) => a + b, 0) / angles.length; out.angleSpread = S5.round(Math.sqrt(angles.reduce((a, b) => a + (b - m) ** 2, 0) / angles.length), 1); }
  if (speeds.length) out.avgSpeed = Math.round(speeds.reduce((a, b) => a + b, 0) / speeds.length);
  // convergence: spread of pairwise line intersections (how well receding lines meet one vanishing point)
  if (lines.length >= 3) {
    const pts = [];
    for (let i = 0; i < lines.length; i++) for (let j = i + 1; j < lines.length; j++) { const [x1, y1, x2, y2] = lines[i], [x3, y3, x4, y4] = lines[j]; const d = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4); if (Math.abs(d) < 1e-6) continue; const px = ((x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4)) / d, py = ((x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4)) / d; if (Math.abs(px) < 5000 && Math.abs(py) < 5000) pts.push([px, py]); }
    if (pts.length >= 3) { pts.sort((a, b) => a[0] - b[0]); const med = pts[Math.floor(pts.length / 2)]; const ds = pts.map((p) => Math.hypot(p[0] - med[0], p[1] - med[1])).sort((a, b) => a - b); out.convergence = Math.round(ds[Math.floor(ds.length / 2)]); }
  }
  return out;
};
