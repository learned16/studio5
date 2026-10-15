/* Tutor — Studio5 teaches you by itself.
   Three layers, cheapest first:
   1. The library (on this device, free, offline): hundreds of lessons for architecture + civil engineering, each with
      explanation, formulas, a worked example, common mistakes and a quiz. Search runs locally (BM25, Arabic-aware).
   2. The teacher model on YOUR Cloudflare account (Workers AI free daily allowance) — answers free questions,
      grounded on the matching library lessons so answers stay short, correct and cheap. No Claude tokens.
   3. The laptop (through Laptop Remote) only executes: it opens apps/files or shows its screen when the
      teacher asks and you approve. Nothing heavy runs on the laptop. */
S5.kb = {
  topics: null, idx: null, loading: null, failed: false,
  norm(s) { return String(s || "").toLowerCase().replace(/[ً-ْـ]/g, "").replace(/[أإآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/ؤ/g, "و").replace(/ئ/g, "ي"); },
  tokens(s) { return this.norm(s).split(/[^a-z0-9؀-ۿ]+/).filter((t) => t.length > 1).map((t) => (t.length > 4 && /^(وال|بال|كال|فال|لل)/.test(t) ? t.slice(3) : t.length > 3 && t.startsWith("ال") ? t.slice(2) : t)); },
  /* A failed fetch (offline at the first open, a server hiccup) is NOT kept for the session: topics stay [] with
     `failed` set so screens don't spin, and the next load() call fetches again. */
  async load() {
    if (this.topics && !this.failed) return this.topics;
    if (!this.loading) this.loading = (async () => {
      let list = typeof S5_KB !== "undefined" ? S5_KB : null, failed = false;
      if (!list) {
        try { const r = await fetch("/kb/library.json"); if (!r.ok) throw new Error("HTTP " + r.status); list = await r.json(); if (!Array.isArray(list)) throw new Error("not a library"); }
        catch { list = []; failed = true; this.failedAt = Date.now(); }
      }
      if (!failed || !this.topics) { this.topics = list; this.byId = new Map(list.map((t) => [t.id, t])); this.build(); }
      this.failed = failed; if (failed) this.loading = null;
      return this.topics;
    })();
    return this.loading;
  },
  build() { // BM25 index: title ×3, keywords ×2, summary + key points ×1
    const docs = this.topics.map((t) => { const tf = new Map(); const add = (s, w) => { for (const k of this.tokens(s)) tf.set(k, (tf.get(k) || 0) + w); }; add(t.title_en + " " + t.title_ar, 3); add((t.keywords || []).join(" "), 2); add(t.summary_ar + " " + (t.key_points_ar || []).join(" ") + " " + (t.subjects || []).join(" "), 1); let len = 0; tf.forEach((v) => (len += v)); return { tf, len }; });
    const df = new Map(); for (const d of docs) for (const k of d.tf.keys()) df.set(k, (df.get(k) || 0) + 1);
    this.idx = { docs, df, avg: docs.reduce((a, d) => a + d.len, 0) / (docs.length || 1) };
  },
  search(q, { k = 5, program, subject } = {}) {
    if (!this.idx) return []; const qs = [...new Set(this.tokens(q))]; const N = this.topics.length; const out = [];
    this.idx.docs.forEach((d, i) => {
      const t = this.topics[i]; if (program && t.program !== program && t.program !== "both") return; if (subject && !(t.subjects || []).includes(subject)) return;
      let sc = 0; for (const w of qs) { const f = d.tf.get(w); if (!f) continue; const n = this.idx.df.get(w); sc += Math.log(1 + (N - n + 0.5) / (n + 0.5)) * ((f * 2.2) / (f + 1.2 * (0.25 + 0.75 * (d.len / this.idx.avg)))); }
      if (sc > 0) out.push([sc, t]);
    });
    return out.sort((a, b) => b[0] - a[0]).slice(0, k).map((x) => x[1]);
  },
  /* lessons of one subject in order. A subject name can exist in both programs (Engineering Drawing, Building
     Construction…), so pass {program, year} to keep them apart; a lesson with program 'both' belongs to either. */
  forSubject(name, { program, year } = {}) {
    return (this.topics || []).filter((t) => (t.subjects || []).includes(name) && (!program || program === "both" || t.program === program || t.program === "both") && (year == null || +t.year === +year)).sort((a, b) => a.order - b.order);
  },
  /* seeded shuffle: a permutation of 0..n-1 fixed by `key` (FNV-1a hash + murmur3 finaliser → Park-Miller). Quiz
     choices are shown in this order while data-j keeps the stored index, so the stored answer position (often B)
     gives nothing away. The finaliser matters: keys that differ only in their last character (question 0, 1, 2 of
     one view) would otherwise give correlated orders. */
  order(n, key) {
    let h = 2166136261; for (const c of String(key)) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); }
    h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16;
    let s = ((h >>> 0) % 2147483646) + 1; const a = [...Array(n).keys()];
    for (let i = n - 1; i > 0; i--) { s = (s * 48271) % 2147483647; const j = Math.floor((s / 2147483647) * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  },
  brief(t) { // compact excerpt sent to the teacher model (keeps requests small)
    return `### ${t.title_en} — ${t.title_ar} [${t.id}]\n${t.summary_ar}\n• ${(t.key_points_ar || []).join("\n• ")}${(t.formulas || []).length ? "\nFormulas: " + t.formulas.map((f) => `${f.name}: ${f.expr} (${f.vars})`).join("; ") : ""}`;
  },
};

/* ---------- progress & spaced review (Leitner boxes: 1, 3, 7, 16, 35 days) ---------- */
S5.tutorProg = {
  all() { return S5.store.meta.tutorProg || {}; },
  get(id) { return this.all()[id] || null; },
  /* score = graded (MCQ) items only. `self` = the student's own rating of the short answers ({ok, n}); it is kept as
     evidence tier E0 ("self-check") and never moves the score or the Leitner box. */
  async set(id, score, self) {
    const all = { ...this.all() }; const p = { ...(all[id] || { box: 0, seen: 0 }) }; const days = [1, 3, 7, 16, 35];
    p.seen++; p.last = score; p.box = score >= 0.8 ? Math.min(p.box + 1, 5) : score >= 0.5 ? Math.max(p.box, 1) : 0;
    p.due = S5.addDays ? S5.addDays(S5.todayISO(), days[Math.max(0, p.box - 1)]) : S5.todayISO(); p.at = S5.now();
    if (self && self.n) p.self = { ok: self.ok, n: self.n, tier: "E0" };
    all[id] = p;
    await S5.store.setMeta("tutorProg", all);
  },
  // a self-check pressed after the lesson was scored: only the E0 note changes (not the score, box, due or `at`)
  async markSelf(id, self) {
    const all = { ...this.all() }; if (!all[id] || !self || !self.n) return;
    all[id] = { ...all[id], self: { ok: self.ok, n: self.n, tier: "E0" } };
    await S5.store.setMeta("tutorProg", all);
  },
  due() { const t = S5.todayISO(); return Object.entries(this.all()).filter(([, p]) => p.due && p.due <= t).map(([id]) => id); },
};

/* ---------- the teacher model (Cloudflare on the installed app, claude.ai inside the artifact) ---------- */
S5.tutor = {
  history: [], busy: false,
  auth() { const h = { "content-type": "application/json" }; const k = S5.store.meta.tutorKey; if (k) h["x-s5-key"] = k; const p = S5.store.meta.remote; if (p) { h["x-s5-device"] = p.device; h["x-s5-token"] = p.token; } return h; },
  async ensureAccess() {
    if (!S5.standalone || S5.store.meta.tutorKey || S5.store.meta.remote) return true;
    try { const r = await fetch("/api/tutor/claim", { method: "POST" }).then((x) => x.json()); if (r.key) { await S5.store.setMeta("tutorKey", r.key); return true; } } catch {}
    return false;
  },
  available() { return S5.standalone ? true : S5.ai.state === "ready"; },
  /* one request; streams text into onText when given */
  async ask(messages, { onText, json, max_tokens, temperature, signal } = {}) {
    if (!S5.standalone) { // claude.ai artifact: use the built-in model
      const flat = messages.map((m) => `${m.role.toUpperCase()}: ${typeof m.content === "string" ? m.content : m.content.filter((c) => c.type === "text").map((c) => c.text).join("\n")}`).join("\n\n");
      return S5.ai.ask("tutor", flat, { onText: onText ? (t) => onText(t) : undefined, json });
    }
    await this.ensureAccess();
    const r = await fetch("/api/tutor/chat", { method: "POST", headers: this.auth(), body: JSON.stringify({ messages, json: !!json, stream: !!onText && !json, max_tokens, temperature }), signal });
    if (!r.ok) { let e = {}; try { e = await r.json(); } catch {} throw new Error(e.error || "Tutor unavailable (" + r.status + ")"); }
    if (!onText || json) { const d = await r.json(); if (!json) return d.text; try { return JSON.parse(d.text); } catch { const m = /\{[\s\S]*\}/.exec(d.text || ""); if (m) return JSON.parse(m[0]); throw new Error("The tutor's answer could not be read"); } }
    const rd = r.body.getReader(), dec = new TextDecoder(); let buf = "", full = "";
    for (;;) { const { value, done } = await rd.read(); if (done) break; buf += dec.decode(value, { stream: true }); const parts = buf.split("\n\n"); buf = parts.pop(); for (const p of parts) { const v = p.replace(/^data:\s*/, "").trim(); if (!v || v === "[DONE]") continue; try { const o = JSON.parse(v); if (o.t) { full += o.t; onText(full); } } catch {} } }
    return full;
  },
  system(ctxTopics) {
    const S = S5.settings, progs = (S.get("programs") || []).map((p) => (p === "civil" ? "Civil Engineering (University of Kirkuk)" : "Architecture & Building Technologies (Northern Technical University)")).join(" + ");
    const R = S5.remote, laptop = S5.standalone && R && R.pair && R.laptopOnline;
    const apps = laptop && R.info && R.info.apps ? R.info.apps.map((a) => a.id).join(", ") : "";
    return `You are the teacher inside Studio5. Your student is in year ${S.get("activeYear")} of ${progs} in Iraq. Teach like an excellent university tutor:
- Explain step by step, check understanding with one short question at the end, and adapt to the student's answers.
- Use clear Modern Standard Arabic with Iraqi-friendly wording when the student writes Arabic; keep English technical terms in parentheses. Use SI units.
- Ground yourself on the LIBRARY excerpts below. If they don't cover it, say so briefly and teach from standard textbook knowledge; mark uncertain points.
- For calculations: show formula → substitution → result with units. Never invent code clauses.
- Do not write graded work for the student to submit; coach them to do it.
- Keep answers focused (under ~250 words unless asked for more).${laptop ? `
- You can use the student's laptop. To do so put ONE tag on its own line (the student must approve it):
  [[laptop:open_app ID]] (IDs: ${apps}) · [[laptop:open_file PATH]] (inside the Studio5 workspace) · [[laptop:screen]] to look at the laptop screen.
  Use it only when it clearly helps (e.g. open AutoCAD to practise, look at their drawing).` : ""}
- You may suggest a library lesson or quiz with [[lesson:ID]] or [[quiz:ID]] using IDs from the excerpts.
LIBRARY:
${ctxTopics.map((t) => S5.kb.brief(t)).join("\n\n") || "(no matching lesson)"}`;
  },
};

/* ---------- the view ---------- */
S5.views.tutor = (r) => {
  const tab = r.tab || "chat";
  // re-render once when the library arrives — also when an earlier failed load succeeds on this visit. Right after
  // a failed load the screen offers "Try again" instead of fetching again on every render.
  S5.ui.mount(() => { const K = S5.kb, first = !K.topics; if ((K.topics && !K.failed) || (K.failed && Date.now() - K.failedAt < 4000)) return; K.load().then(() => { if (!K.failed || first) S5.ui.render(); }); });
  const tabs = [["chat", "Ask the teacher"], ["learn", "Lessons"], ["review", "Review"]];
  let body = "";
  if (!S5.kb.topics) body = `<p class="small muted">Loading the library…</p>`;
  else if (S5.kb.failed && tab !== "chat") body = `<div class="sheet flat"><p class="small">The library could not be loaded — check the connection.</p><div class="row" style="margin-top:8px">${H.btn("Try again", "kb-retry", {}, "sm primary")}</div></div>`;
  else if (tab === "chat") body = S5.tutorChatHTML(r);
  else if (tab === "learn") body = r.id ? S5.lessonHTML(S5.kb.byId.get(r.id)) : S5.lessonsHTML(r);
  else body = S5.reviewHTML();
  return `<div class="page-head"><div class="titles"><span class="eyebrow">Your teacher · library on this device · AI on your Cloudflare</span><h1>Tutor</h1></div></div>${H.tabs(tabs, tab, "open", { v: "tutor" })}${body}`;
};
S5.tutorChatHTML = () => {
  S5.ui.mount(() => S5.bindTutorChat());
  const R = S5.remote, laptop = S5.standalone && R && R.pair;
  return `<div class="tutor-chat"><div id="tc-log" class="tc-log">${S5.tutor.history.length ? S5.tutor.history.map(S5.tcMsgHTML).join("") : `<div class="tc-empty"><p><b>Ask anything</b> about your subjects — I'll teach it step by step.</p><div class="chips">${["اشرحلي إجهاد الانحناء بمثال", "How do I design a singly reinforced beam?", "شنو الفرق بين الحمل الميت والحي؟", "علمني المنظور بنقطتين", "Explain Bernoulli with a pipe example"].map((q) => `<button class="btn sm" data-act="tc-suggest">${S5.esc(q)}</button>`).join("")}</div></div>`}</div>
    <div class="tc-bar"><textarea id="tc-in" dir="auto" rows="2" placeholder="Write your question… (Arabic or English)"></textarea><div class="col">${H.btn("Send", "tc-send", {}, "primary")}${laptop ? H.btn("👁 Laptop screen", "tc-screen", {}, "sm") : ""}</div></div>
    <p class="tiny muted" id="tc-note">${S5.standalone ? "Answers come from your Cloudflare account's free daily allowance and are grounded on the library. Without internet you still get the library lessons." : "Inside claude.ai the teacher uses the built-in model."}</p></div>`;
};
S5.tcMsgHTML = (m) => m.role === "user" ? `<div class="tc-msg me" dir="auto">${S5.esc(m.show || m.content)}${m.img ? ' <span class="pill">🖼</span>' : ""}</div>` : `<div class="tc-msg ai" dir="auto">${S5.tcRender(m.content)}</div>`;
/* light markdown + action chips */
S5.tcRender = (t) => {
  let h = S5.esc(t);
  h = h.replace(/\[\[laptop:(open_app|open_file|screen)\s*([^\]]*)\]\]/g, (_, a, v) => `<button class="btn sm primary tc-act" data-act="tc-laptop" data-a="${a}" data-v="${v.trim()}">💻 ${a === "open_app" ? "Open " + v.trim() + " on the laptop" : a === "open_file" ? "Open " + v.trim() : "Look at the laptop screen"}</button>`);
  h = h.replace(/\[\[(lesson|quiz):([a-z0-9-]+)\]\]/g, (_, k, id) => { const tp = S5.kb.byId && S5.kb.byId.get(id); return tp ? `<button class="btn sm" data-act="open" data-v="tutor" data-tab="learn" data-id="${id}">${k === "quiz" ? "📝" : "📘"} ${S5.esc(tp.title_ar)}</button>` : ""; });
  h = h.replace(/^### (.*)$/gm, "<b>$1</b>").replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>").replace(/`([^`]+)`/g, '<code dir="ltr">$1</code>').replace(/^[-•*] (.*)$/gm, "• $1").replace(/\n/g, "<br>");
  return h;
};
S5.bindTutorChat = () => {
  const inp = document.getElementById("tc-in"); if (!inp) return;
  inp.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); S5.act["tc-send"](); } });
  const log = document.getElementById("tc-log"); log.scrollTop = log.scrollHeight;
};
S5.tutorSend = async (text, img) => {
  const T = S5.tutor; if (T.busy || !text.trim()) return; T.busy = true;
  await S5.kb.load();
  const ctx = S5.kb.search(text + " " + T.history.slice(-2).map((m) => (typeof m.content === "string" ? m.content : "")).join(" "), { k: 3 });
  T.history.push({ role: "user", content: text, img: !!img });
  const log = document.getElementById("tc-log"); const paint = () => { if (log) { log.innerHTML = T.history.map(S5.tcMsgHTML).join(""); log.scrollTop = log.scrollHeight; } };
  T.history.push({ role: "assistant", content: "…" }); paint();
  const msgs = [{ role: "system", content: T.system(ctx) }, ...T.history.slice(-10, -2).map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: img ? [{ type: "text", text }, { type: "image_url", image_url: { url: img } }] : text }];
  const out = T.history[T.history.length - 1];
  try {
    const t = await T.ask(msgs, { onText: (s) => { out.content = s; paint(); } }); out.content = t || out.content;
  } catch (e) { // offline / allowance used up: teach from the library
    out.content = `⚠️ ${e.message}\n\n` + (ctx.length ? "From the library:\n" + ctx.map((tp) => `[[lesson:${tp.id}]]`).join(" ") + "\n\n" + ctx[0].summary_ar : "No matching lesson in the library yet.");
  }
  T.busy = false; paint();
};
Object.assign(S5.act, {
  "tc-send": () => { const i = document.getElementById("tc-in"); const t = i.value; i.value = ""; S5.tutorSend(t); },
  "tc-suggest": (el) => S5.tutorSend(el.textContent),
  "tc-screen": async () => { try { S5.ui.toast("Looking at the laptop screen…"); const d = await S5.remote.send("screen.shot", { width: 1280, quality: 60 }, { quiet: true, timeout: 20000 }); const q = document.getElementById("tc-in").value || "شوف شاشة اللابتوب مالتي وساعدني بالخطوة الجاية."; document.getElementById("tc-in").value = ""; S5.tutorSend(q, "data:image/jpeg;base64," + d.jpeg); } catch (e) { S5.ui.toast(e.message, true); } },
  "tc-laptop": (el) => {
    const a = el.dataset.a, v = el.dataset.v, R = S5.remote;
    if (a === "screen") return S5.act["tc-screen"]();
    S5.ui.confirm(a === "open_app" ? `Open “${v}” on your laptop?` : `Open “${v}” on your laptop?`, "Open", async () => {
      try { if (a === "open_app") { const r = await R.send("app.open", { id: v }); S5.ui.toast("Opened " + r.opened); } else { await R.send("file.open", { path: v }); S5.ui.toast("Opened on the laptop"); } } catch (e) { S5.ui.toast(e.message, true); }
    }, false);
  },
});

/* lessons: by subject in curriculum order, with progress */
S5.lessonsHTML = (r) => {
  const progs = S5.settings.get("programs") || ["arch", "civil"], y = S5.settings.get("activeYear");
  // one card per subject × program × year (forSubject keeps them apart); a 'both' lesson joins each enabled program's card
  const subs = [...new Set(S5.kb.topics.filter((t) => progs.includes(t.program) || t.program === "both").flatMap((t) => (t.program === "both" ? progs : [t.program]).flatMap((p) => t.subjects.map((s) => s + "|" + p + "|" + t.year))))].map((k) => { const [name, program, year] = k.split("|"); return { name, program, year: +year }; }).sort((a, b) => (a.year === y ? -1 : 0) - (b.year === y ? -1 : 0) || a.year - b.year || a.program.localeCompare(b.program));
  const seen = new Set(); const P = S5.tutorProg.all();
  const card = (s) => { const ts = S5.kb.forSubject(s.name, { program: s.program, year: s.year }); const done = ts.filter((t) => P[t.id] && P[t.id].last >= 0.8).length; const next = ts.find((t) => !(P[t.id] && P[t.id].last >= 0.8)) || ts[0];
    return `<div class="item"><div class="body"><div class="t">${S5.esc(s.name)}</div><div class="s">${s.program === "civil" ? "Civil" : "Architecture"} · Year ${s.year} · ${done}/${ts.length} lessons</div><div class="meter"><i style="width:${Math.round((done / Math.max(1, ts.length)) * 100)}%"></i></div></div>${next ? H.btn(done ? "Continue" : "Start", "open", { v: "tutor", tab: "learn", id: next.id, kind: s.program }, "sm primary") : ""}</div>`; };
  const list = subs.filter((s) => { const k = s.name + "|" + s.program + "|" + s.year; if (seen.has(k)) return false; seen.add(k); return true; });
  const yr = list.filter((s) => s.year === y), other = list.filter((s) => s.year !== y);
  return `${H.section(`Year ${y} — teach me`, yr.length ? `<div class="list">${yr.map(card).join("")}</div>` : H.empty("No lessons for this year yet.", ""))}${H.section("All years", `<div class="list">${other.map(card).join("")}</div>`)}`;
};
S5.lessonHTML = (t) => {
  if (!t) return H.empty("Lesson not found.", "");
  S5.ui.mount(() => S5.bindLesson(t));
  // one nonce per lesson view: re-renders of the same view keep the choice order, opening the lesson again reshuffles
  let V = S5.lessonView; if (!V || V.route !== S5.ui.route || V.id !== t.id) V = S5.lessonView = { route: S5.ui.route, id: t.id, nonce: Date.now().toString(36) + Math.random().toString(36).slice(2, 8) };
  // the lesson's own program and year; a 'both' lesson follows the program it was opened from (route.kind)
  const prog = t.program === "both" ? (["arch", "civil"].includes(S5.ui.route.kind) ? S5.ui.route.kind : undefined) : t.program;
  const sib = S5.kb.forSubject(t.subjects[0], { program: prog, year: t.year }); const i = sib.findIndex((x) => x.id === t.id); const next = sib[i + 1];
  const f = (t.formulas || []).length ? H.section("Formulas", `<div class="list">${t.formulas.map((x) => `<div class="item"><div class="body"><div class="t mono" dir="ltr">${S5.esc(x.expr)}</div><div class="s">${S5.esc(x.name)} — <span dir="ltr">${S5.esc(x.vars)}</span></div></div></div>`).join("")}</div>`) : "";
  const ex = t.example ? H.section("Worked example", `<p dir="auto">${S5.esc(t.example.problem_ar)}</p><ol class="lesson-steps" id="ls-steps">${(t.example.steps_ar || []).map((s, k) => `<li dir="auto" ${k ? "hidden" : ""}>${S5.esc(s)}</li>`).join("")}</ol><p hidden id="ls-ans"><b>Answer:</b> <span dir="auto">${S5.esc(t.example.answer)}</span></p>`, H.btn("Next step", "ls-step", {}, "sm")) : "";
  const quiz = (t.quiz || []).map((q, k) => q.choices ? `<div class="quiz" data-k="${k}"><p dir="auto"><b>${k + 1}.</b> ${S5.esc(q.q_ar)}</p><div class="chips">${S5.kb.order(q.choices.length, `${t.id}|${V.nonce}|${k}`).map((j) => `<button class="btn sm" data-act="ls-choice" data-k="${k}" data-j="${j}" dir="auto">${S5.esc(q.choices[j])}</button>`).join("")}</div><p class="small muted" hidden id="why-${k}" dir="auto"></p></div>` : `<div class="quiz" data-k="${k}" data-self="1"><p dir="auto"><b>${k + 1}.</b> ${S5.esc(q.q_ar)}</p><p class="tiny muted"><span class="pill">self-check</span> <span>Not counted in the lesson score</span></p><details><summary class="small">Show model answer</summary><p class="small" dir="auto">${S5.esc(q.answer_ar || "")}</p></details><div class="chips"><button class="btn sm" data-act="ls-self" data-k="${k}" data-ok="1">✓ I got it</button><button class="btn sm" data-act="ls-self" data-k="${k}" data-ok="0">✗ Not yet</button></div></div>`).join("");
  return `<div class="row" style="margin-bottom:8px">${H.btn("← Lessons", "open", { v: "tutor", tab: "learn" }, "sm")}<span class="small muted">${S5.esc(t.subjects.join(" · "))} · ${i + 1}/${sib.length}</span></div>
    <section class="sheet lesson"><h2 dir="auto">${S5.esc(t.title_ar)}</h2><p class="small muted">${S5.esc(t.title_en)}</p><p dir="auto" class="lesson-text">${S5.esc(t.summary_ar)}</p><ul dir="auto">${(t.key_points_ar || []).map((k) => `<li>${S5.esc(k)}</li>`).join("")}</ul></section>
    ${f}${ex}${(t.mistakes_ar || []).length ? H.section("Common mistakes", `<ul dir="auto">${t.mistakes_ar.map((m) => `<li>${S5.esc(m)}</li>`).join("")}</ul>`) : ""}
    ${H.section("Check yourself", `<div id="ls-quiz">${quiz}</div><p class="small" id="ls-score"></p>`)}
    <div class="row">${H.btn("Ask the teacher about this", "ls-ask", { id: t.id }, "primary")}${next ? H.btn("Next lesson →", "open", { v: "tutor", tab: "learn", id: next.id, ...(prog ? { kind: prog } : {}) }) : ""}</div>`;
};
/* Lesson score = the code-graded (multiple-choice) items only. Short answers are self-rated: they are shown as
   'self-check', kept as E0 evidence and never count toward the score, so "I got it" cannot master a lesson. */
S5.bindLesson = (t) => { const q = t.quiz || []; S5.lessonState = { t, got: {}, self: {}, n: q.filter((x) => x.choices).length, saved: false }; };
S5.lessonSelf = (L) => { const v = Object.values(L.self); return { ok: v.filter(Boolean).length, n: v.length }; };
S5.lessonScore = async () => {
  const L = S5.lessonState; const done = Object.keys(L.got).length; const ok = Object.values(L.got).filter(Boolean).length; const self = S5.lessonSelf(L);
  const el = document.getElementById("ls-score"); if (el) el.textContent = [L.n ? `${ok}/${L.n} correct` : "", self.n ? `self-check ${self.ok}/${self.n}` : ""].filter(Boolean).join(" · ");
  if (L.n && done === L.n && !L.saved) { L.saved = true; const sc = ok / L.n; await S5.tutorProg.set(L.t.id, sc, self); S5.ui.toast(sc >= 0.8 ? "Lesson mastered — it comes back for review later" : "Saved — this lesson comes back soon for practice"); }
};
Object.assign(S5.act, {
  "ls-step": () => { const hid = document.querySelector("#ls-steps li[hidden]"); if (hid) hid.hidden = false; else document.getElementById("ls-ans").hidden = false; },
  "ls-choice": (el) => { const L = S5.lessonState, k = +el.dataset.k, j = +el.dataset.j, q = L.t.quiz[k]; if (k in L.got) return; const ok = j === q.answer; L.got[k] = ok; el.classList.add(ok ? "primary" : "danger"); if (!ok) el.parentNode.querySelector(`[data-j="${q.answer}"]`)?.classList.add("primary"); const w = document.getElementById("why-" + k); if (w && q.why_ar) { w.hidden = false; w.textContent = q.why_ar; } S5.lessonScore(); },
  "ls-self": (el) => { const L = S5.lessonState, k = +el.dataset.k; if (k in L.self) return; L.self[k] = el.dataset.ok === "1"; el.classList.add(el.dataset.ok === "1" ? "primary" : "danger"); S5.lessonScore(); if (L.saved) S5.tutorProg.markSelf(L.t.id, S5.lessonSelf(L)); },
  "kb-retry": () => S5.kb.load().then(() => S5.ui.render()),
  "ls-ask": (el) => { const t = S5.kb.byId.get(el.dataset.id); S5.ui.go({ v: "tutor", tab: "chat" }); setTimeout(() => S5.tutorSend(`علمني درس «${t.title_ar}» (${t.title_en}) خطوة بخطوة، وبعدين اسألني سؤال واحد حتى تتأكد إني فهمت.`), 50); },
});
S5.reviewHTML = () => {
  const due = S5.tutorProg.due().map((id) => S5.kb.byId.get(id)).filter(Boolean); const P = S5.tutorProg.all(); const total = Object.keys(P).length;
  return `${H.section(`Due for review today (${due.length})`, due.length ? `<div class="list">${due.map((t) => H.item({ t: S5.esc(t.title_ar), s: S5.esc(t.subjects[0]), act: "open", data: { v: "tutor", tab: "learn", id: t.id } })).join("")}</div>` : H.empty("Nothing due — learn a new lesson.", ""))}
    ${H.section("Your progress", `<p class="small">${total} lessons studied · ${Object.values(P).filter((p) => p.last >= 0.8).length} mastered · library: ${S5.kb.topics.length} lessons</p>`)}`;
};
