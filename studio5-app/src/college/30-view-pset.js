/* College M3 — the Problem room (docs/COLLEGE_PLAN.md §M3). View `pset`: a seeded problem from the M2 engine,
   one input (inputmode=decimal) + unit picker per field (+ a sense picker where the field has a sense), graded by
   S5.prob.grade (code, never the AI), feedback per structured code, the code-made steps revealed after submit,
   "New numbers", and worked-example fading 0–3 (backward fading: level 0 shows every step, each level hides about a
   third more from the end, level 3 shows none; a correct answer climbs one level, any other result drops one).
   Levels 0–2 (or any step revealed on request) record tier E2; level 3 unaided records E3, which is what mastery counts.
   One `attempt` record per submit (additive type). The fade level is derived from the latest practice attempt of
   the objective, so it survives reloads and backups; the current item ({pid, v, seed, hints, t0}) is a per-device
   convenience in S5.ls 'pset_cur_<obj>' so a reload resumes the same numbers. */
(() => {
  try {
    const P = (S5.pset = S5.pset || {});
    const esc = S5.esc, H = S5.h;
    const lang = () => (S5.i18n && S5.i18n.lang ? S5.i18n.lang() : "ar");
    const tr = (en, ar) => (lang() === "ar" ? ar : en);
    const tx = (o) => (o ? o[lang()] || o.en || "" : "");
    const MAXFADE = 3;
    P.KINDS = { civil: ["civil", "both"], arch: ["arch", "both"] };
    const at = (a) => a.at || a.createdAt || "";
    const correct = (a) => !!a && (a.score || 0) >= 0.999;

    /* ---------- pure helpers (no DOM) ---------- */
    P.gens = (kind) => S5.prob.list((d) => (P.KINDS[kind] || P.KINDS.civil).includes(d.program || "civil"));
    P.objs = (kind) => { const out = []; for (const d of P.gens(kind)) if (!out.includes(d.obj)) out.push(d.obj); return out; };
    P.gensOf = (kind, obj) => P.gens(kind).filter((d) => d.obj === obj);
    // steps hidden before submitting at fade level L (backward fading, proportional to the number of steps)
    P.hidden = (L, n) => (L >= MAXFADE ? n : Math.min(n, Math.ceil((n * Math.max(0, L)) / MAXFADE)));
    P.practice = (obj) => S5.store.list("attempt", (a) => !a.deleted && a.obj === obj && a.mode === "practice" && Number.isInteger(a.fade)).sort((a, b) => at(a).localeCompare(at(b)));
    // the fade level for the next item of an objective: the latest practice attempt's level, +1 when correct, −1 otherwise
    P.nextFade = (obj) => { const xs = P.practice(obj); const a = xs[xs.length - 1]; if (!a) return 0; return Math.max(0, Math.min(MAXFADE, a.fade + (correct(a) ? 1 : -1))); };
    P.tierFor = (fade, hints) => (fade >= MAXFADE && !hints ? "E3" : "E2");
    P.attemptFor = (cur) => { const xs = S5.store.list("attempt", (a) => !a.deleted && a.pid === cur.pid && a.v === cur.v && a.seed === cur.seed && a.mode === "practice").sort((a, b) => at(a).localeCompare(at(b))); return xs[xs.length - 1] || null; };
    const usedSeeds = (pid) => new Set(S5.store.list("attempt", (a) => a.pid === pid).map((a) => a.seed));
    const curKey = (obj) => "pset_cur_" + obj;
    P.fresh = (pid, avoid) => { const def = S5.PROB[pid]; const used = usedSeeds(pid); if (avoid != null) used.add(avoid); return { pid, v: def.v, seed: S5.newSeed(used), hints: 0, t0: Date.now() }; };
    P.loadCur = (obj, pid) => {
      let c = S5.ls.get(curKey(obj), null); const def = c && S5.PROB[c.pid];
      if (!c || !def || def.v !== c.v || def.obj !== obj || (pid && c.pid !== pid)) { c = P.fresh(pid || (def && def.obj === obj ? c.pid : S5.prob.forObj(obj)[0].id)); S5.ls.set(curKey(obj), c); }
      return c;
    };
    P.saveCur = (obj, c) => S5.ls.set(curKey(obj), c);

    /* ---------- feedback by code (bilingual, rendered inside [data-noi18n]) ---------- */
    const CODE = { ok: ["Correct", "صحيح"], rounding: ["Rounding — half credit", "تقريب — نصف الدرجة"], unit: ["Unit slip", "خطأ في الوحدة"], sign: ["Wrong sign or sense", "إشارة أو اتجاه خاطئ"],
      x2: ["Off by a factor of 2", "خطأ بمعامل 2"], "deg-rad": ["Degrees/radians mix-up", "خلط بين الدرجات والراديان"], wrong: ["Not correct", "غير صحيح"], empty: ["No answer", "لا توجد إجابة"] };
    P.codeLabel = (c) => { const x = CODE[c] || CODE.wrong; return tr(x[0], x[1]); };
    P.message = (r, f, lang1) => {
      const tr = (en, ar) => ((lang1 || lang()) === "ar" ? ar : en);
      const c = r.code, d = f.dim, u = r.unit;
      if (c === "ok") return tr("Correct — within tolerance of the code's key.", "صحيح — ضمن السماحية من مفتاح الحل المحسوب بالكود.");
      if (c === "rounding") return tr(`Close, but about ${S5.prob.fmt(r.err * 100, 1)}% off — a rounding slip. Half credit; it never counts toward mastery. Keep 3–4 significant figures until the end.`,
        `قريب، لكن الفرق نحو ${S5.prob.fmt(r.err * 100, 1)}% — خطأ تقريب. نصف الدرجة، ولا يُحتسب للإتقان أبدًا. احتفظ بـ 3–4 أرقام معنوية حتى النهاية.`);
      if (c === "unit") {
        if (r.why === "dim") return tr("Unit slip: that unit measures a different quantity.", "خطأ في الوحدة: هذه الوحدة تقيس كمية أخرى.");
        const n = r.scale, U = S5.units, pick = U[u] ? S5.unitsOf(d).find((w) => Math.abs(Math.log10(U[w].toSI) - (Math.log10(U[u].toSI) - n)) < 1e-9) : null;
        const flip = r.flipped ? tr(" The sign is also reversed.", " والإشارة معكوسة أيضًا.") : "";
        if (pick != null && pick !== "") return tr(`Unit slip: you gave ${pick}, asked ${u} — the number you typed is the answer in ${pick}, but the unit picked is ${u}. Convert it or pick ${pick}.${flip}`,
          `خطأ في الوحدة: أعطيت ${pick} والمطلوب ${u} — الرقم الذي كتبته هو الجواب بوحدة ${pick}، لكن الوحدة المختارة ${u}. حوّله أو اختر ${pick}.${flip}`);
        return tr(`Unit slip: your number is about 10^${n} times the answer — check the unit conversion.${flip}`, `خطأ في الوحدة: رقمك يساوي تقريبًا 10^${n} مرة الجواب — راجع تحويل الوحدات.${flip}`);
      }
      if (c === "sign") {
        if (r.mis) return tr("Wrong direction: your angle points the opposite way — fix the quadrant from the signs of the components.", "اتجاه خاطئ: زاويتك تشير إلى الاتجاه المعاكس — حدّد الربع من إشارتي المركبتين.");
        return f.sense ? tr("Wrong sense: the size is right but the sense is reversed (tension/compression or direction of rotation).", "اتجاه خاطئ: المقدار صحيح لكن النوع معكوس (شد/ضغط أو اتجاه الدوران).")
          : tr("Wrong sign: the size is right but the direction is reversed.", "إشارة خاطئة: المقدار صحيح لكن الاتجاه معكوس.");
      }
      if (c === "x2") return r.factor === 0.5 ? tr("Your answer is half the key — a factor of 2 went missing.", "جوابك نصف القيمة الصحيحة — سقط معامل 2.") : tr("Your answer is twice the key — an extra factor of 2 slipped in.", "جوابك ضعف القيمة الصحيحة — دخل معامل 2 زائد.");
      if (c === "deg-rad") {
        if (r.mis) return tr("Degrees/radians mix-up: your calculator seems to be in radians — switch it to degrees.", "خلط بين الدرجات والراديان: يبدو أن الحاسبة على وضع الراديان — حوّلها إلى الدرجات.");
        return r.as === "rad" ? tr("Degrees/radians mix-up: you typed a value in radians but picked deg.", "خلط بين الدرجات والراديان: كتبت قيمة بالراديان لكنك اخترت deg.") : tr("Degrees/radians mix-up: you typed a value in degrees but picked rad.", "خلط بين الدرجات والراديان: كتبت قيمة بالدرجات لكنك اخترت rad.");
      }
      if (c === "empty") return r.bad ? tr("Could not read that number. Use digits, a decimal point or comma, or a fraction like 7/3.", "تعذّرت قراءة الرقم. استخدم الأرقام أو الفاصلة العشرية أو كسرًا مثل 7/3.") : tr("No answer.", "لا توجد إجابة.");
      return tr("Not correct. Compare your working with the steps below.", "غير صحيح. قارن حلك بالخطوات أدناه.");
    };

    /* ---------- current item ---------- */
    const build = (r) => {
      const kind = P.KINDS[r.kind] ? r.kind : "civil", objs = P.objs(kind);
      if (!objs.length) return { kind, objs };
      let obj = null, pid = null;
      if (r.id && S5.PROB[r.id] && objs.includes(S5.PROB[r.id].obj)) { pid = r.id; obj = S5.PROB[r.id].obj; }
      else if (r.id && objs.includes(r.id)) obj = r.id;
      else { const o = S5.ls.get("pset_obj_" + kind, null); obj = objs.includes(o) ? o : objs[0]; }
      if (pid && !P.gensOf(kind, obj).some((d) => d.id === pid)) pid = null;
      let c = P.loadCur(obj, pid);
      if (!P.gensOf(kind, obj).some((d) => d.id === c.pid)) { c = P.fresh(P.gensOf(kind, obj)[0].id); P.saveCur(obj, c); }
      S5.ls.set("pset_obj_" + kind, obj);
      const def = S5.PROB[c.pid], inst = S5.prob.instance(c.pid, c.seed), done = P.attemptFor(c);
      const fade = done && Number.isInteger(done.fade) ? done.fade : P.nextFade(obj);
      return { kind, objs, obj, def, inst, cur: c, done, fade };
    };

    const css = () => {
      if (document.getElementById("ps-css")) return;
      const st = document.createElement("style"); st.id = "ps-css";
      st.textContent = `.ps-chips{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 12px}.ps-chip{border:1px solid var(--rule);border-radius:999px;background:var(--paper);color:var(--ink);padding:5px 10px;font-size:.8rem;cursor:pointer;display:inline-flex;gap:6px;align-items:center}
.ps-chip[aria-pressed="true"]{border-color:var(--cobalt);box-shadow:inset 0 0 0 1px var(--cobalt)}.ps-chip .st{font-size:.7rem;padding:1px 6px;border-radius:999px;background:var(--rule)}.ps-chip[data-state="secure"] .st,.ps-chip[data-state="mastered"] .st{background:var(--green-wash,#dfeedd)}.ps-chip[data-state="practicing"] .st{background:var(--amber-wash,#f6ecd2)}
.ps-text{font-size:1rem;line-height:1.7;margin:8px 0}.ps-fig{margin:8px 0;color:var(--ink)}.ps-field{border-top:1px solid var(--rule);padding:10px 0;display:grid;gap:6px}.ps-row{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.ps-row input{flex:1 1 140px;min-width:0;max-width:240px;font-size:1.05rem}.ps-row select{max-width:140px}.ps-fb{font-size:.88rem;line-height:1.5}.ps-fb[data-code="ok"]{color:var(--green,#2e7d32)}.ps-fb:not([data-code="ok"]):not(:empty){color:var(--redline,#b3261e)}
.ps-steps{margin:6px 0 0;padding-inline-start:22px;line-height:1.7}.ps-steps li{margin:2px 0}.ps-result{font-weight:700;margin:8px 0}.ps-result[data-ok="true"]{color:var(--green,#2e7d32)}`;
      document.head.appendChild(st);
    };

    const chips = (b) => `<div class="ps-chips" id="ps-chips" role="toolbar">${b.objs.map((o) => { const O = S5.OBJ[o] || { en: o, ar: o }, s = S5.mastery.of(o);
      return `<button class="ps-chip" data-act="pset-obj" data-obj="${esc(o)}" data-kind="${b.kind}" data-state="${s}" aria-pressed="${o === b.obj}"><span data-noi18n dir="auto">${esc(tx(O))}</span><span class="st">${esc(S5.mastery.LABEL[s] || s)}</span></button>`; }).join("")}</div>`;

    const fieldHTML = (f, b, given, res) => {
      const g = given || [], dis = b.done ? "disabled" : "", unit = g[1] != null && g[1] !== "" ? g[1] : f.unit, val = g[0] != null ? String(g[0]) : "";
      const units = (f.units || []).length > 1 || (f.units || [])[0] ? `<select id="ps-u-${f.k}" data-k="${f.k}" data-noi18n aria-label="Unit" ${dis}>${f.units.map((u) => `<option value="${esc(u)}" ${u === unit ? "selected" : ""}>${esc(u)}</option>`).join("")}</select>` : "";
      const sense = f.sense ? `<select id="ps-s-${f.k}" data-k="${f.k}" data-noi18n aria-label="Sense" ${dis}><option value="">${esc(tr("sense?", "الاتجاه؟"))}</option>${f.sense.map((s) => `<option value="${esc(s)}" ${g[2] === s ? "selected" : ""}>${esc(s)} · ${esc(tx(S5.prob.SENSE[s] || { en: s, ar: s }))}</option>`).join("")}</select>` : "";
      const fb = res ? `<span class="pill" data-noi18n>${esc(P.codeLabel(res.code))}</span> <span data-noi18n dir="auto">${esc(P.message(res, f))}</span>` : "";
      return `<div class="ps-field" data-k="${f.k}"><label for="ps-in-${f.k}" data-noi18n dir="auto"><b>${esc(f.sym || f.k)}</b> — ${esc(tx(f.label) || f.k)}</label>
        <div class="ps-row"><input id="ps-in-${f.k}" data-k="${f.k}" inputmode="decimal" autocomplete="off" dir="ltr" value="${esc(val)}" ${dis}>${units}${sense}</div>
        <div class="ps-fb" id="ps-fb-${f.k}" data-code="${res ? res.code : ""}">${fb}</div></div>`;
    };

    const itemHTML = (b) => {
      const { def, inst, cur, done, fade } = b, L = lang(), p = inst.p;
      const steps = def.steps(p, L) || [], n = steps.length, hints = cur.hints || 0;
      const g = done ? S5.prob.grade(def, p, done.given || {}) : null;
      const shown = done ? n : Math.min(n, n - P.hidden(fade, n) + hints), tier = done ? done.tier : P.tierFor(fade, hints);
      const other = L === "ar" ? "en" : "ar", fig = def.svg ? `<div class="ps-fig" data-noi18n>${def.svg(p)}</div>` : "";
      const head = `<div class="row" style="gap:6px;flex-wrap:wrap"><span class="pill cobalt" id="ps-fade" data-fade="${fade}"><span>Help level</span> ${fade} / ${MAXFADE}</span><span class="pill ${tier === "E3" ? "green" : "amber"}" id="ps-tier" data-tier="${tier}">${esc((S5.TIERS[tier] || {}).label || tier)}</span>${hints && !done ? `<span class="pill amber">Step revealed — practice only</span>` : ""}</div>`;
      const result = g ? `<div class="ps-result" id="ps-result" data-ok="${g.ok}" data-score="${g.score}" data-noi18n>${esc(g.ok ? tr("Correct", "صحيح") : tr(`Score ${Math.round(g.score * 100)}% — not yet`, `الدرجة ${Math.round(g.score * 100)}% — ليس بعد`))}</div>` : "";
      const stepList = shown ? `<ol class="ps-steps" id="ps-steps" data-shown="${shown}" data-noi18n dir="auto">${steps.slice(0, shown).map((s) => `<li>${esc(s)}</li>`).join("")}</ol>` : `<ol class="ps-steps" id="ps-steps" data-shown="0"></ol>`;
      const left = n - shown;
      const stepsSec = `<div style="margin-top:12px"><h3 style="margin:0 0 4px">${done ? "Solution by code" : fade === 0 ? "Worked example" : "Worked example (partly hidden)"}</h3>${stepList}${left > 0 ? `<p class="tiny muted"><span>Steps hidden:</span> ${left}</p>` : ""}</div>`;
      const btns = done ? `${H.btn("New numbers", "pset-new", { obj: b.obj, kind: b.kind }, "primary")}`
        : `${H.btn("Submit", "pset-submit", { obj: b.obj, kind: b.kind }, "primary")}${left > 0 ? H.btn("Show a step", "pset-steps", { obj: b.obj, kind: b.kind }) : ""}${H.btn("New numbers", "pset-new", { obj: b.obj, kind: b.kind })}`;
      return `<section class="sheet" id="ps-item" data-pid="${esc(cur.pid)}" data-seed="${cur.seed}" data-done="${!!done}">${head}
        <div class="ps-text" data-noi18n dir="auto" id="ps-text">${esc(def.text(p, L))}</div>
        <details class="tiny muted" data-noi18n><summary>${L === "ar" ? "English" : "العربية"}</summary><div dir="auto">${esc(def.text(p, other))}</div></details>${fig}
        <div id="ps-fields">${inst.fields.map((f) => fieldHTML(f, b, done && done.given ? done.given[f.k] : null, g ? g.results[f.k] : null)).join("")}</div>
        ${result}<div class="row" style="margin-top:8px">${btns}</div>${stepsSec}</section>`;
    };

    S5.views.pset = (r) => {
      css();
      const b = build(r || {});
      const crumbs = `<div class="crumbs"><button data-act="open" data-v="practice">Practice</button><button data-act="open" data-v="campus">Campus</button></div>`;
      const title = b.kind === "arch" ? "Architecture · Problem room" : "Civil Engineering · Problem room";
      const intro = `<p class="small muted">Every answer key is computed and graded by code; the AI never marks. Help fades as you get answers right: unaided correct answers on fresh numbers are what count toward mastery.</p>`;
      if (S5.setPlace) S5.setPlace("Problem room", { v: "pset", kind: b.kind, ...(b.obj ? { id: b.obj } : {}) });
      if (!b.objs.length) { P.cur = null; return `${crumbs}<div class="page-head"><div class="titles"><span class="eyebrow">${title}</span><h1>Problem room</h1></div></div>${H.empty("No problems yet", "Graded problems for this department arrive in a later update.")}`; }
      P.cur = { kind: b.kind, obj: b.obj, pid: b.cur.pid, v: b.cur.v, seed: b.cur.seed, p: b.inst.p, keys: b.inst.keys, fields: b.inst.fields, fade: b.fade, hints: b.cur.hints || 0, done: !!b.done, tier: b.done ? b.done.tier : P.tierFor(b.fade, b.cur.hints || 0) };
      S5.ui.mount(() => {
        const view = document.getElementById("view");
        const onKey = (e) => { if (e.key === "Enter" && e.target && e.target.id && e.target.id.startsWith("ps-in-")) { e.preventDefault(); const btn = view.querySelector('[data-act="pset-submit"]'); if (btn) btn.click(); } };
        view.addEventListener("keydown", onKey);
        return () => view.removeEventListener("keydown", onKey);
      });
      const O = S5.OBJ[b.obj] || {};
      return `${crumbs}<div class="page-head"><div class="titles"><span class="eyebrow">${title}</span><h1>Problem room</h1>${intro}</div></div>
        ${chips(b)}<p class="small" data-noi18n dir="auto"><b>${esc(tr("Objective", "الهدف"))}:</b> ${esc(tx(O))}</p>${itemHTML(b)}`;
    };

    /* ---------- actions ---------- */
    P.read = () => {
      const given = {}; let any = false;
      for (const f of (P.cur && P.cur.fields) || []) {
        const i = document.getElementById("ps-in-" + f.k), u = document.getElementById("ps-u-" + f.k), s = document.getElementById("ps-s-" + f.k);
        const v = i ? i.value : ""; if (String(v).trim()) any = true;
        given[f.k] = [v, u ? u.value : f.unit, s ? s.value || null : undefined];
        if (!f.sense) given[f.k].length = 2;
      }
      return { given, any };
    };
    P.submit = async () => {
      const c = P.cur; if (!c || c.done) return null;
      const { given, any } = P.read(); if (!any) { S5.ui.toast("Type an answer first"); return null; }
      const def = S5.PROB[c.pid], inst = S5.prob.instance(c.pid, c.seed), g = S5.prob.grade(def, inst.p, given);
      const cur = S5.ls.get(curKey(c.obj), null) || {}, hints = cur.hints || 0, t0 = cur.t0 || Date.now();
      const rec = await S5.store.create("attempt", S5.prob.record(inst, g, { tier: P.tierFor(c.fade, hints), mode: "practice", fade: c.fade, ms: Math.max(0, Date.now() - t0), hints, kind: c.kind }));
      S5.mastery.clear();
      S5.ui.render();
      return rec;
    };
    S5.act["pset-submit"] = () => P.submit();
    S5.act["pset-new"] = (el) => {
      const c = P.cur; if (!c) return;
      const gens = P.gensOf(c.kind, c.obj), i = gens.findIndex((d) => d.id === c.pid), next = gens[(i + 1) % gens.length] || gens[0];
      P.saveCur(c.obj, P.fresh(next.id, c.seed));
      S5.ui.go({ v: "pset", kind: c.kind, id: c.obj }, true);
    };
    S5.act["pset-steps"] = () => {
      const c = P.cur; if (!c || c.done) return;
      const cur = S5.ls.get(curKey(c.obj), null); if (!cur) return;
      cur.hints = (cur.hints || 0) + 1; P.saveCur(c.obj, cur); S5.ui.render();
    };
    S5.act["pset-obj"] = (el) => { const kind = el.dataset.kind || (P.cur && P.cur.kind) || "civil"; S5.ls.set("pset_obj_" + kind, el.dataset.obj); S5.ui.go({ v: "pset", kind, id: el.dataset.obj }, true); };

    /* ---------- registration (no edits to shared files) ---------- */
    S5.CAMPUS_EXTRA = S5.CAMPUS_EXTRA || [];
    S5.CAMPUS_EXTRA.push(["civil", ["Problem room", { v: "pset", kind: "civil" }]], ["arch", ["Problem room", { v: "pset", kind: "arch" }]]);
    S5.LIVE_EXTRA = S5.LIVE_EXTRA || []; S5.LIVE_EXTRA.push("pset");
    S5.ROOT_EXTRA = Object.assign(S5.ROOT_EXTRA || {}, { pset: "practice" });
  } catch (e) { (S5.COLLEGE_ERRORS = S5.COLLEGE_ERRORS || []).push("30-view-pset: " + (e && e.message)); console.error(e); }
})();
