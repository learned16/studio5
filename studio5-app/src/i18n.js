/* Bilingual interface (English / العربية). The interface is written in English and translated in place:
   every text node and placeholder/title is looked up in the dictionary (numbers are matched as #).
   User content is never touched: anything inside [dir="auto"], .verbatim, .ai-out, inputs or [data-noi18n]. */
S5.I18N_AR = typeof S5_I18N_PENDING !== "undefined" ? S5_I18N_PENDING : {};
S5.i18n = {
  dict: null,
  lang() { const l = S5.settings.get("lang"); return l === "en" || l === "ar" ? l : (navigator.language || "").toLowerCase().startsWith("ar") ? "ar" : "ar"; },
  build() {
    if (this.dict) return this.dict;
    const d = Object.assign({}, S5.I18N_AR || {});
    for (const c of S5.CURRICULUM) d[c[3]] = c[2];
    for (const c of S5.CIVIL || []) d[c[3]] = c[2];
    for (const y of S5.YEARS) d[y.name] = y.ar;
    for (const y of S5.YEARS_CIVIL || []) d[y.name] = y.ar;
    for (const p of Object.values(S5.PROGRAMS || {})) d[p.name] = p.ar;
    for (const [k, v] of Object.entries(S5.PROFILES)) if (!d[v.label]) d[v.label] = v.label;
    for (const [k, v] of Object.entries({ ...d })) if (/\d/.test(k)) d[k.replace(/\d+(?:[.,]\d+)?/g, "#")] = v;
    return (this.dict = d);
  },
  PREFIX: [["Formula: ", "المعادلة: "], ["Next: ", "التالي: "], ["why: ", "السبب: "], ["affects: ", "يؤثر على: "], ["error: ", "الخطأ: "], ["packs: ", "الحزم: "], ["Tools that switch on with this year: ", "أدوات هذه السنة: "], ["Next time focus on: ", "المرة القادمة ركّز على: "], ["Now in timetable: ", "الآن بالجدول: "], ["from ", "من "], ["est. ", "تقدير "], ["actual ", "فعلي "], ["Stage: ", "المرحلة: "], ["Opening ", "فتح "], ["Added to Library: ", "أضيف للمكتبة: "], ["Saved ", "حُفظ "], ["Edit ", "تعديل "], ["New ", "جديد: "], ["Year ", "السنة "], ["Stage ", "المرحلة "], ["Semester ", "الفصل "], ["Due ", "مستحق "], ["Overdue: ", "متأخر: "], ["Due today: ", "مستحق اليوم: "], ["Retry problem: ", "أعد المسألة: "], ["Job: ", "مهمة: "], ["Apply feedback: ", "طبّق الملاحظة: "], ["due ", "الموعد "], ["Project: ", "مشروع: "], ["L1 · ", "م1 · "], ["Last full backup ", "آخر نسخة كاملة "], ["restore test ", "اختبار استعادة "], ["records", "سجلات"], ["Not ready: ", "غير جاهز: "], ["Explanation failed twice: ", "فشل الشرح مرتين: "], ["Enter the result for ", "أدخل نتيجة "], ["Last full backup was ", "آخر نسخة كاملة كانت "], ["output: ", "المخرَج: "], ["Next time focus on: ", "المرة القادمة ركّز على: "], ["Selected: ", "المحدد: "]],
  tr(text) {
    const t = text.trim(); if (!t || !/[A-Za-z]{2}/.test(t)) return null;
    const d = this.build();
    const one = (s) => {
      if (!s) return s;
      const nums = s.match(/\d+(?:[.,]\d+)?/g) || []; const key = s.replace(/\d+(?:[.,]\d+)?/g, "#");
      if (d[key] != null) { let i = 0; return d[key].replace(/#/g, () => (nums[i] != null ? nums[i++] : "#")); }
      return null;
    };
    let r = one(t); if (r != null) return text.replace(t, r);
    const parts = (sep) => { const ps = t.split(sep); if (ps.length < 2) return null; const out = ps.map((p) => one(p.trim()) ?? this.prefixed(p.trim(), one) ?? p.trim()); return out.join(sep); };
    r = parts(" · ") ?? this.prefixed(t, one) ?? parts(" — ") ?? parts(" / ");
    return r != null && r !== t ? text.replace(t, r) : null;
  },
  prefixed(t, one) { for (const [en, ar] of this.PREFIX) if (t.startsWith(en)) { const rest = t.slice(en.length); return ar + (one(rest) ?? rest); } return null; },
  skip(el) { return !el || el.closest('.verbatim,.ai-out,[data-noi18n],[data-uc],textarea,script,style,.ink-stage,.clock'); },
  apply(root) {
    const ar = this.lang() === "ar";
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n; const nodes = [];
    while ((n = w.nextNode())) nodes.push(n);
    for (const node of nodes) {
      const p = node.parentElement; if (this.skip(p)) continue;
      if (ar) { if (node.__ar === node.nodeValue) continue; const tr = this.tr(node.nodeValue); if (tr != null) { node.__en = node.nodeValue; node.__ar = tr; node.nodeValue = tr; } }
      else if (node.__en != null && node.nodeValue === node.__ar) { node.nodeValue = node.__en; node.__ar = null; }
    }
    const els = root.nodeType === 1 ? [root, ...root.querySelectorAll("[placeholder],[title],[aria-label]")] : [];
    for (const el of els) for (const a of ["placeholder", "title", "aria-label"]) {
      if (!el.hasAttribute || !el.hasAttribute(a) || this.skip(el.parentElement || el)) continue;
      const v = el.getAttribute(a), store = "data-en-" + a;
      if (ar) { if (el.getAttribute("data-ar-" + a) === v) continue; const tr = this.tr(v); if (tr != null) { el.setAttribute(store, v); el.setAttribute("data-ar-" + a, tr); el.setAttribute(a, tr); } }
      else if (el.hasAttribute(store) && el.getAttribute("data-ar-" + a) === v) { el.setAttribute(a, el.getAttribute(store)); el.removeAttribute("data-ar-" + a); }
    }
  },
  setDir() { const ar = this.lang() === "ar"; document.documentElement.lang = ar ? "ar" : "en"; document.documentElement.dir = ar ? "rtl" : "ltr"; },
  start() {
    this.setDir();
    let q = new Set(), sched = false;
    const run = () => { sched = false; const roots = [...q]; q = new Set(); for (const r of roots) if (r.isConnected) this.apply(r); };
    this.mo = new MutationObserver((ms) => {
      if (this.lang() !== "ar") return;
      for (const m of ms) { if (m.type === "characterData") { const p = m.target.parentElement; if (p) q.add(p); } else m.addedNodes.forEach((x) => q.add(x.nodeType === 1 ? x : x.parentElement || document.body)); }
      if (!sched) { sched = true; requestAnimationFrame(run); }
    });
    this.mo.observe(document.body, { childList: true, subtree: true, characterData: true });
    this.apply(document.body);
  },
  async toggle() { await S5.settings.set("lang", this.lang() === "ar" ? "en" : "ar"); this.setDir(); this.apply(document.body); S5.ui.render(); },
};
S5.locale = () => (S5.i18n.lang() === "ar" ? "ar-IQ-u-nu-latn" : "en-GB");
S5.fmtDate = (iso) => { if (!iso) return ""; const d = new Date(iso.length <= 10 ? iso + "T12:00:00" : iso); return d.toLocaleDateString(S5.locale(), { day: "numeric", month: "short", year: d.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined }); };
S5.fmtDateTime = (iso) => (iso ? new Date(iso).toLocaleString(S5.locale(), { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "");
S5.act.lang = () => S5.i18n.toggle();
