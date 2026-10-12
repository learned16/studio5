/* Library — files, sources, notebooks, skills map, experience memory, research & evidence, AI council. */
S5.views.library = (r) => {
  const tab = r.tab || "files";
  const tabs = [["files", "Files & PDFs", S5.store.count("file")], ["notebooks", "Notebooks", S5.store.count("notebook")], ["sources", "Sources", S5.store.count("source")], ["skills", "Skills map"], ["memory", "Experience", S5.store.count("memory")], ["research", "Research", S5.store.count("research")], ["council", "Ask the AI council"]];
  let body = "";
  if (tab === "files") {
    const fs = S5.store.list("file").sort((a, b) => b.createdAt.localeCompare(a.createdAt)); const kind = r.kind || "all";
    const shown = fs.filter((f) => kind === "all" || f.kind === kind);
    S5.ui.mount(() => { const dz = document.getElementById("dropzone"); if (!dz) return; dz.ondragover = (e) => { e.preventDefault(); dz.classList.add("over"); }; dz.ondragleave = () => dz.classList.remove("over"); dz.ondrop = async (e) => { e.preventDefault(); dz.classList.remove("over"); for (const f of e.dataTransfer.files) await S5.intakeFile(f, { library: true }); S5.ui.toast("Added"); }; });
    body = `<div id="dropzone" class="dropzone" style="margin-bottom:12px">Drop PDFs or images here, or ${H.btn("choose files", "upload", { library: 1 }, "sm primary")}<br><span class="tiny">Originals are stored unchanged with a SHA-256 hash; duplicates are detected. Your notes and ink live separately.</span></div>
      <div class="seg" style="margin-bottom:10px">${[["all", "All"], ["pdf", "PDF"], ["image", "Images"], ["video", "Video"], ["other", "Other"]].map(([k, n]) => `<button data-act="open" data-v="library" data-tab="files" data-kind="${k}" aria-pressed="${k === kind}">${n}</button>`).join("")}</div>
      ${shown.length ? `<div class="list">${shown.map((f) => H.item({ lead: f.kind === "pdf" ? "red" : f.kind === "image" ? "cobalt" : "", t: S5.esc(f.name), s: [f.kind.toUpperCase(), S5.fmtBytes(f.size), f.pages ? f.pages + " pages" : "", H.subj(f.subjectId), f.projectId ? S5.esc(S5.store.get(f.projectId)?.name || "") : "", f.assetId ? "in cloud" : "this device"].filter(Boolean).join(" · "), act: "open", data: { v: "file", id: f.id } })).join("")}</div>` : H.empty("No files yet.", "")}`;
  } else if (tab === "notebooks") {
    const nbs = S5.store.list("notebook").sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    body = `<div class="row between" style="margin-bottom:10px"><span class="small muted">One ink engine for lecture notes, sketches, problem solving and markup.</span>${H.btn("+ Notebook", "new-notebook", {}, "sm primary")}</div>${nbs.length ? `<div class="grid cols-3">${nbs.map((n) => `<button class="sheet" data-act="open" data-v="notebook" data-id="${n.id}" style="text-align:start;cursor:pointer;display:grid;gap:4px"><span class="eyebrow">${S5.esc(S5.INK_TEMPLATES[n.template] || "")} · ${(n.pages || []).length || 1} page(s)</span><b dir="auto">${S5.esc(n.title)}</b><span class="small muted">${H.subj(n.subjectId)}${n.projectId ? S5.esc(S5.store.get(n.projectId)?.name || "") : ""} · edited ${S5.fmtDateTime(n.updatedAt)}</span></button>`).join("")}</div>` : H.empty("No notebooks yet.", "")}`;
  } else if (tab === "sources") {
    const ss = S5.store.list("source");
    body = `<div class="row between" style="margin-bottom:10px"><span class="small muted">Title, author, type, date, link or file, pages, confidence, how you use it, citation. AI output is never a source by itself.</span>${H.btn("+ Source", "new", { type: "source", defaults: JSON.stringify({ confidence: "medium", kind: "book" }) }, "sm primary")}</div>
      ${ss.length ? `<div class="list">${ss.map((s) => H.item({ lead: s.kind === "ai" ? "amber" : s.confidence === "high" ? "green" : "", t: S5.esc(s.title), s: [s.author, s.kind, s.year, s.pages && "pp. " + s.pages, s.kind === "ai" ? "AI output — verify before citing" : ""].filter(Boolean).map(S5.esc).join(" · "), right: H.pill(s.confidence || "?"), act: "edit", data: { type: "source", id: s.id } })).join("")}</div>
      ${H.section("Citations", `<ol class="small" style="padding-left:18px;display:grid;gap:4px">${ss.filter((s) => s.kind !== "ai").map((s) => `<li dir="auto">${S5.esc(s.citation || S5.cite(s))}</li>`).join("")}</ol>`, H.btn("Copy", "copy-cites", {}, "sm"))}` : H.empty("No sources yet.", "")}`;
  } else if (tab === "skills") {
    const groups = S5.store.list("skill", (s) => !s.parent); const active = S5.store.list("skill", (s) => s.active);
    body = `<p class="small muted" style="margin-bottom:10px">A skill rises only with evidence: an exercise, a project, a file, a test, a professor's assessment, or doing it alone. At most three active goals keep you focused. Active now: <b>${active.length}/3</b>.</p>
      <div class="grid cols-2">${groups.map((g) => H.section(S5.esc(g.name), `<div class="list">${S5.store.list("skill", (s) => s.parent === g.id).map((s) => H.item({ lead: s.active ? "cobalt" : (s.state || 0) >= 4 ? "green" : "", t: S5.esc(s.name) + (s.active ? " " + H.pill("active goal", "cobalt") : ""), s: `${S5.SKILL_STATES[s.state || 0]} · ${(s.evidence || []).length} evidence`, right: H.ladder(s.state || 0, 6), act: "skill", data: { id: s.id } })).join("")}</div>`, H.btn("+", "new", { type: "skill", defaults: JSON.stringify({ parent: g.id, state: 0 }) }, "sm ghost"))).join("")}</div>`;
  } else if (tab === "memory") {
    const ms = S5.store.list("memory").sort((a, b) => (b.stage || 0) - (a.stage || 0)); const kinds = [...new Set(ms.map((m) => m.kind))];
    body = `<div class="row between" style="margin-bottom:10px"><p class="small muted" style="max-width:70ch">First note → tried once → repeated → confirmed in context → approved experience. A project-specific professor preference is not a general rule. Conflicting memories are kept side by side, never overwritten.</p>${H.btn("+ Memory", "new", { type: "memory", defaults: JSON.stringify({ stage: 0, kind: "lesson" }) }, "sm primary")}</div>
      ${kinds.map((k) => H.section(S5.esc(k), `<div class="list">${ms.filter((m) => m.kind === k).map((m) => { const conf = S5.linksOf(m.id).filter((l) => l.rel === "CONFLICTS_WITH"); return H.item({ lead: (m.stage || 0) >= 3 ? "green" : "", t: S5.esc(m.text) + H.demo(m), s: `${S5.MEM_STAGES[m.stage || 0]}${m.context ? " · " + S5.esc(m.context) : ""}${conf.length ? ` · <span style="color:var(--redline)">conflicts with ${conf.length}</span>` : ""}`, right: `${H.ladder((m.stage || 0) + 1, 5)}${(m.stage || 0) < 4 ? H.btn("↑", "mem-up", { id: m.id }, "sm") : ""}${H.btn("⇄", "mem-conflict", { id: m.id }, "sm ghost")}`, act: "edit", data: { type: "memory", id: m.id } }); }).join("")}</div>`)).join("") || H.empty("No experiences recorded yet.", "")}`;
  } else if (tab === "research") {
    const rs = S5.store.list("research");
    body = `<div class="row between" style="margin-bottom:10px"><span class="small muted">Research question, sources, literature notes, claims, evidence, quotes, methodology, source conflicts and citations — with an honest record of what AI contributed.${S5.toolOn("research") ? "" : " (Year 5 workspace — available now as a preview.)"}</span>${H.btn("+ Research", "new", { type: "research" }, "sm primary")}</div>
      ${rs.length ? `<div class="list">${rs.map((x) => H.item({ lead: "cobalt", t: S5.esc(x.title), s: S5.esc((x.question || "").slice(0, 100)) + ` · ${S5.store.count("claim", (c) => c.researchId === x.id)} claims`, act: "open", data: { v: "research", id: x.id } })).join("")}</div>` : H.empty("No research yet.", "")}`;
  } else if (tab === "council") {
    body = S5.ai.on() ? `<section class="sheet"><p class="small muted">Three independent views — Tutor, Critic, Examiner — then a synthesis that shows where they disagree. For learning and thinking; not a source and not your work.</p>
      <label class="field" style="margin-top:10px"><span>Question</span><textarea id="cc-q" dir="auto" rows="3" placeholder="e.g. Why do Iraqi courtyard houses work in summer, and what should I take from that for my pavilion?"></textarea></label>
      <label class="field" style="margin-top:8px"><span>Context (optional)</span><input id="cc-c" dir="auto" placeholder="Subject, project, constraints"></label>
      <div class="row" style="margin-top:10px">${H.btn("Ask the council", "council", {}, "primary")}</div></section><div id="cc-out" class="grid cols-2" style="margin-top:14px"></div>` : H.empty("AI is not available in this view.", "Open Studio5 signed in to claude.ai and allow AI to use the council. Everything else works without it.");
  }
  return `<div class="page-head"><div class="titles"><span class="eyebrow">Sources, files, memory and growth</span><h1>Library</h1></div></div>${H.tabs(tabs, tab, "open", { v: "library" })}${body}`;
};
S5.cite = (s) => `${s.author ? s.author + ". " : ""}(${s.year || "n.d."}). ${s.title}.${s.url ? " " + s.url : ""}${s.pages ? ", pp. " + s.pages : ""}`;
S5.act["copy-cites"] = () => { const t = S5.store.list("source", (s) => s.kind !== "ai").map((s) => s.citation || S5.cite(s)).join("\n"); navigator.clipboard?.writeText(t).then(() => S5.ui.toast("Copied"), () => S5.ui.toast("Copy not allowed here")); };
S5.act["mem-up"] = async (el, e) => { e.stopPropagation(); const m = S5.store.get(el.dataset.id); await S5.store.update(m.id, { stage: Math.min(4, (m.stage || 0) + 1) }); };
S5.act["mem-conflict"] = (el, e) => { e.stopPropagation(); const m = S5.store.get(el.dataset.id); const others = S5.store.list("memory", (x) => x.id !== m.id); const d = S5.ui.modal("Mark a conflict", `<p class="small">Both memories are kept. Choose the one that contradicts “${S5.esc(m.text.slice(0, 80))}”.</p><select id="mc-s" style="width:100%">${others.map((o) => `<option value="${o.id}">${S5.esc(o.text.slice(0, 90))}</option>`).join("")}</select>`, { footer: `<button class="btn primary" id="mc-ok">Link as conflict</button>` }); d.el.querySelector("#mc-ok").onclick = async () => { await S5.link(m.id, "CONFLICTS_WITH", d.el.querySelector("#mc-s").value); d.close(); S5.ui.toast("Conflict recorded"); }; };
S5.act.skill = (el) => {
  const s = S5.store.get(el.dataset.id); const active = S5.store.list("skill", (x) => x.active && x.id !== s.id).length;
  const m = S5.ui.modal(s.name, `<div class="row"><label class="field" style="flex:1"><span>Level</span><select id="sk-st">${S5.SKILL_STATES.map((x, i) => `<option value="${i}" ${i === (s.state || 0) ? "selected" : ""}>${x}</option>`).join("")}</select></label><label class="check"><input type="checkbox" id="sk-act" ${s.active ? "checked" : ""} ${!s.active && active >= 3 ? "disabled" : ""}> Active goal ${!s.active && active >= 3 ? "(3 already active)" : ""}</label></div>
    <h4>Evidence</h4>${(s.evidence || []).length ? `<div class="list">${s.evidence.map((e) => H.item({ lead: "green", t: S5.esc(e.text), s: `${S5.esc(e.kind)} · ${S5.esc(e.confidence || "")} · ${S5.fmtDate(e.at)}` })).join("")}</div>` : `<p class="small muted">No evidence yet. Raising the level needs at least one piece.</p>`}
    <div class="form-grid"><label class="field"><span>Evidence type</span><select id="ev-k"><option value="exercise">Exercise</option><option value="project">Project</option><option value="file">File</option><option value="test">Test</option><option value="professor">Professor assessment</option><option value="independent">Done alone</option></select></label><label class="field"><span>Confidence</span><select id="ev-c"><option>self-assessed</option><option>measured</option><option>professor-confirmed</option></select></label><label class="field wide"><span>What shows it</span><input id="ev-t" dir="auto"></label></div>`, { footer: `<button class="btn" id="ev-add">Add evidence</button><button class="btn primary" id="sk-save">Save</button>` });
  m.el.querySelector("#ev-add").onclick = async () => { const t = m.el.querySelector("#ev-t").value.trim(); if (!t) return S5.ui.toast("Describe the evidence"); await S5.store.update(s.id, { evidence: [...(s.evidence || []), { at: S5.now(), kind: m.el.querySelector("#ev-k").value, confidence: m.el.querySelector("#ev-c").value, text: t }] }); m.close(); S5.act.skill(el); };
  m.el.querySelector("#sk-save").onclick = async () => { const st = +m.el.querySelector("#sk-st").value; if (st > (s.state || 0) && !(s.evidence || []).length) return S5.ui.toast("Add evidence before raising the level"); await S5.store.update(s.id, { state: st, active: m.el.querySelector("#sk-act").checked }); m.close(); };
};
S5.act.council = async () => {
  const q = document.getElementById("cc-q").value.trim(); if (!q) return S5.ui.toast("Write a question");
  const out = document.getElementById("cc-out"); const ctx = document.getElementById("cc-c").value;
  const draw = (o) => { out.innerHTML = ["Tutor", "Critic", "Examiner", "Synthesis"].map((k) => `<section class="sheet ${k === "Synthesis" ? "now" : ""}" style="${k === "Synthesis" ? "grid-column:1/-1" : ""}"><header><h4>${k}</h4>${H.ai()}</header><p class="small" dir="auto" style="white-space:pre-wrap">${o[k] ? S5.esc(o[k]) : '<span class="muted">…</span>'}</p></section>`).join("") + (o.Synthesis ? `<div class="row" style="grid-column:1/-1">${H.btn("Save as AI note", "council-save", {}, "sm")}</div>` : ""); };
  draw({}); S5.councilLast = null;
  try { const res = await S5.ai.council(q, ctx, draw); S5.councilLast = { q, res }; draw(res); } catch (e) { S5.ui.toast(e.message, true); }
};
S5.act["council-save"] = async () => { const c = S5.councilLast; if (!c) return; await S5.store.create("note", { title: "AI council: " + c.q.slice(0, 60), body: Object.entries(c.res).map(([k, v]) => `## ${k}\n${v}`).join("\n\n"), aiGenerated: true }); S5.ui.toast("Saved as a note marked AI-generated"); };

/* ---------- research workspace ---------- */
S5.views.research = (r) => {
  const x = S5.store.get(r.id); if (!x) return H.empty("Not found", "");
  const claims = S5.store.list("claim", (c) => c.researchId === x.id); const srcIds = new Set(claims.map((c) => c.sourceId).filter(Boolean));
  return `<div class="crumbs"><button data-act="open" data-v="library" data-tab="research">Library / Research</button></div>
    <div class="page-head"><div class="titles"><span class="eyebrow">Research & evidence</span><h1 dir="auto">${S5.esc(x.title)}</h1></div>${H.btn("Edit", "edit", { type: "research", id: x.id }, "sm")}</div>
    <div class="split"><div class="stack">${H.section("Question & method", `<p dir="auto"><b>${S5.esc(x.question || "No question yet")}</b></p><p class="small" dir="auto" style="margin-top:6px">${S5.esc(x.methodology || "")}</p>`)}
      ${H.section("Claims & evidence", claims.length ? `<div class="list">${claims.map((c) => H.item({ lead: { strong: "green", moderate: "cobalt", weak: "amber", conflict: "red" }[c.strength] || "", t: S5.esc(c.text), s: [c.evidence, c.quote && `“${c.quote}”`, S5.store.get(c.sourceId) && "source: " + S5.title(S5.store.get(c.sourceId)), c.pages && "pp. " + c.pages].filter(Boolean).map(S5.esc).join(" · "), right: H.pill(c.strength || "?"), act: "edit", data: { type: "claim", id: c.id } })).join("")}</div>` : H.empty("No claims yet.", "Each claim needs evidence and a source; mark conflicts between sources instead of hiding them."), H.btn("+ Claim", "new", { type: "claim", defaults: JSON.stringify({ researchId: x.id, strength: "moderate" }) }, "sm primary"))}</div>
    <div class="stack">${H.section("Contribution record", `<dl class="kv"><dt>Mine</dt><dd dir="auto">${S5.esc(x.myContribution || "—")}</dd><dt>AI</dt><dd dir="auto">${S5.esc(x.aiContribution || "—")}</dd></dl>`)}
      ${H.section("Sources used", srcIds.size ? `<ol class="small" style="padding-left:18px">${[...srcIds].map((id) => S5.store.get(id)).filter(Boolean).map((s) => `<li dir="auto">${S5.esc(s.citation || S5.cite(s))}</li>`).join("")}</ol>` : H.empty("Link sources through claims.", ""))}
      ${H.section("Conflicts", claims.filter((c) => c.strength === "conflict").map((c) => `<p class="small" dir="auto">• ${S5.esc(c.text)}</p>`).join("") || `<p class="small muted">None marked.</p>`)}</div></div>`;
};

/* ---------- files ---------- */
S5.views.file = (r) => {
  const f = S5.store.get(r.id); if (!f) return H.empty("File not found", "");
  S5.setPlace(`${f.name}${r.page ? " p." + r.page : ""}`, { v: "file", id: f.id, page: r.page });
  const annots = S5.store.count("inkpage", (p) => p.fileId === f.id && (p.strokes || []).length);
  S5.ui.mount(() => {
    const host = document.getElementById("file-host"); if (!host) return;
    if (f.kind === "pdf") { const v = new S5.PdfView(host, f, { startPage: r.page || f.lastPage || 1, onPage: (p) => (S5.filePage = p), onCapture: (p) => S5.openCapture({ subjectId: f.subjectId, projectId: f.projectId, page: p, fileId: f.id }) }); return () => { v.destroy(); if (S5.filePage) S5.store.update(f.id, { lastPage: S5.filePage }); }; }
    if (f.kind === "image") { S5.blobs.url(f.blobKey, f.assetId).then((u) => { host.innerHTML = u ? `<img src="${u}" alt="${S5.esc(f.name)}" style="max-width:100%;border-radius:6px;border:1px solid var(--rule)">` : H.empty("Image bytes are not on this device.", ""); }); }
    else if (f.kind === "video") { S5.blobs.url(f.blobKey, f.assetId).then((u) => { host.innerHTML = u ? `<video src="${u}" controls style="max-width:100%"></video>` : H.empty("Not on this device.", ""); }); }
    else host.innerHTML = H.empty("No preview for this file type.", "The original is stored; export it from a backup.");
  });
  return `<div class="crumbs"><button data-act="back">← Back</button></div>
    <div class="page-head"><div class="titles"><span class="eyebrow">${f.kind.toUpperCase()} · ${S5.fmtBytes(f.size)} · original unchanged · sha256 ${f.hash.slice(0, 12)}${annots ? ` · ${annots} annotated page(s)` : ""}</span><h2 dir="auto">${S5.esc(f.name)}</h2></div>
    <div class="row">${f.kind === "image" ? H.btn("Mark up a copy", "img-markup", { id: f.id }, "sm") : ""}${H.btn("File it", "edit", { type: "file", id: f.id }, "sm")}${H.btn("Capture", "capture", { subject: f.subjectId || "", project: f.projectId || "" }, "sm")}</div></div>
    <div id="file-host" class="${f.kind === "pdf" ? "pane" : ""}" style="${f.kind === "pdf" ? "height:calc(100dvh - 200px);min-height:420px" : ""}"></div>`;
};
S5.act["img-markup"] = async (el) => { const f = S5.store.get(el.dataset.id); let nb = S5.store.list("notebook", (n) => n.refFileId === f.id)[0]; if (!nb) nb = await S5.store.create("notebook", { title: `Markup — ${f.name}`, subjectId: f.subjectId || "", projectId: f.projectId || "", template: "blank", refFileId: f.id, pages: [] }); S5.ui.go({ v: "notebook", id: nb.id }); };
S5.act.upload = async (el) => {
  const files = await S5.ui.pickFile("application/pdf,image/*,video/*", true); if (!files.length) return;
  let last;
  for (const f of files) { if (f.size > 200 * 1048576) { S5.ui.toast(`${f.name} is larger than 200 MB — keep it in your Windows workspace instead.`, true); continue; } last = await S5.intakeFile(f, { subjectId: el.dataset.subject || "", projectId: el.dataset.project || "", library: !!el.dataset.library }); }
  if (last && el.dataset.lecture) { await S5.store.update(el.dataset.lecture, { fileId: last.id }); S5.ui.render(); }
  S5.ui.toast(files.length > 1 ? `${files.length} files added` : "File added");
};

/* ---------- notebooks ---------- */
S5.notebookPage = (nb, idx) => {
  let ids = [...(nb.pages || [])];
  const existing = ids[idx] && S5.store.raw(ids[idx]);
  if (existing) return existing;
  const pg = { id: S5.uid("ink"), type: "inkpage", notebookId: nb.id, title: `${nb.title} · p.${idx + 1}`, strokes: [], layers: [{ n: "Layer 1", v: true }], template: nb.template || "blank", width: 1000, height: 1414, createdAt: S5.now(), subjectId: nb.subjectId || "", projectId: nb.projectId || "", rev: 0 };
  S5.store.put(pg, { silent: true }); ids[idx] = pg.id; nb.pages = ids; S5.store.update(nb.id, { pages: ids });
  return pg;
};
S5.act["new-notebook"] = (el) => S5.ui.edit("notebook", { subjectId: el.dataset.subject || "", projectId: el.dataset.project || "", template: "ruled", pages: [] }, { onSave: (nb) => S5.ui.go({ v: "notebook", id: nb.id }) });
S5.views.notebook = (r) => {
  const nb = S5.store.get(r.id); if (!nb) return H.empty("Notebook not found", "");
  const idx = S5.clamp(r.page ?? nb.cur ?? 0, 0, Math.max(0, (nb.pages || []).length));
  const page = S5.notebookPage(nb, idx); const n = Math.max(1, (nb.pages || []).length);
  S5.setPlace(`${nb.title} p.${idx + 1}`, { v: "notebook", id: nb.id, page: idx });
  if (nb.cur !== idx) S5.store.update(nb.id, { cur: idx });
  S5.ui.mount(() => {
    let ink; const host = document.getElementById("nb-ink");
    const start = (refUrl) => { ink = new S5.Ink(host, { doc: page, refUrl, refAlpha: 0.9 }); };
    if (nb.refFileId) { const f = S5.store.get(nb.refFileId); S5.blobs.url(f?.blobKey, f?.assetId).then((u) => start(u || null)); } else start(null);
    return () => ink && ink.destroy();
  });
  return `<div class="crumbs"><button data-act="back">← Back</button>${nb.subjectId ? ` / <button data-act="open" data-v="subject" data-id="${nb.subjectId}">${H.subj(nb.subjectId)}</button>` : ""}${nb.projectId ? ` / <button data-act="open" data-v="project" data-id="${nb.projectId}">${S5.esc(S5.store.get(nb.projectId)?.name || "")}</button>` : ""}</div>
    <div class="row between" style="margin:8px 0"><h3 dir="auto">${S5.esc(nb.title)}</h3><div class="row">${H.btn("‹", "open", { v: "notebook", id: nb.id, page: Math.max(0, idx - 1) }, "sm")}<span class="mono small">p. ${idx + 1} / ${n}</span>${H.btn("›", "open", { v: "notebook", id: nb.id, page: Math.min(n - 1, idx + 1) }, "sm")}${H.btn("+ Page", "open", { v: "notebook", id: nb.id, page: n }, "sm")}${H.btn("Edit", "edit", { type: "notebook", id: nb.id }, "sm ghost")}</div></div>
    <div id="nb-ink" class="ink-wrap" style="height:calc(100dvh - 190px);min-height:440px"></div>`;
};
S5.views["notebook-page"] = (r) => {
  const pg = S5.store.get(r.id); if (!pg) return H.empty("Page not found", "");
  S5.ui.mount(() => { const ink = new S5.Ink(document.getElementById("pg-ink"), { doc: pg }); return () => ink.destroy(); });
  return `<div class="crumbs"><button data-act="back">← Back</button></div><h3 style="margin:8px 0" dir="auto">${S5.esc(pg.title || "Ink page")}</h3><div id="pg-ink" class="ink-wrap" style="height:calc(100dvh - 190px);min-height:440px"></div>`;
};
