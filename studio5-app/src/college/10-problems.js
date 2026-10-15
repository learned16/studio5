/* College M2 — exact-grading problem engine (docs/COLLEGE_PLAN.md §1, §2, M2). Pure and headless: no UI here.
   Seeded generators, answer keys computed by code, unit-aware grading with tolerances and structured misconception
   codes, mastery computed from attempt records (never stored), and a guard that flags numbers in AI text.
   Rule: every number that affects a mark comes from a generator's solve(); the AI never produces a key.

   Generator contract (S5.prob.register(def) → S5.PROB[def.id]):
     { id, v,                     // v: bump when gen() changes, so pid + v + seed always reproduces the same params
       obj, lesson, lessons?,     // objective id (S5.OBJ), main library lesson id, all linked lesson ids
       subject, program, lvl,     // exact curriculum subject name, 'civil' | 'arch' | 'both', difficulty 1–3
       gen(rng) → params,         // only randomness: the rng argument (S5.rng); params are plain JSON
       solve(p) → {k: SI number}, // keys for every field (extra SI numbers allowed, e.g. reactions used by steps)
       fields(p) → [{k, sym, dim, units[], unit, tol, sense?, wrap?, w?, label:{en, ar}}],
       text(p, lang) → string, steps(p, lang) → [string],   // lang 'ar' | 'en'; render inside [data-noi18n]
       svg?(p) → string,
       mis?(p) → {k: [[code, SI value]]},  // optional code-computed misconceptions (e.g. calculator in radians)
       kb?: {lesson, p, expect:{k:[printed value, unit]}} | [...] }  // reproduces the lesson's worked example
   Field: dim is a key of the unit table below; tol is a S5.TOL preset name or {rel?, abs?(SI), frac?};
   sense: [positive, negative] labels (e.g. ['T','C'], ['CCW','CW']) — the key is signed, the student gives a
   magnitude plus a sense; wrap: angle compared modulo 360°.
   Attempt record (written by later milestones, one per submit): {pid, v, seed, obj, lesson, given:{k:[num, unit,
   sense?]}, codes:{k:code}, score, tier, mode, fade, ms, examId?, inkId?} — see S5.prob.record(). */
(() => {
  try {
    const M = 2147483647, DEG = Math.PI / 180;

    /* ---------- seeds ---------- */
    S5.hashSeed = (str) => { let h = 2166136261; const s = String(str ?? ""); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return ((h >>> 0) % (M - 1)) + 1; };
    const normSeed = (seed) => (typeof seed === "number" && Number.isFinite(seed) ? Math.floor(Math.abs(seed)) % M || 1 : S5.hashSeed(seed));
    const decimals = (step) => { const s = String(step), i = s.indexOf("."); return i < 0 ? 0 : s.length - i - 1; };
    // Park-Miller (the campus.js tree pattern), warmed up so small seeds do not start near 0.
    S5.rng = (seed) => {
      let s = normSeed(seed);
      const next = () => (s = (s * 16807) % M) / M;
      for (let i = 0; i < 4; i++) next();
      const r = () => next();
      r.seed = normSeed(seed);
      r.int = (a, b) => a + Math.floor(next() * (b - a + 1));
      r.pick = (xs) => xs[Math.floor(next() * xs.length)];
      r.grid = (a, b, step = 1) => +(a + step * r.int(0, Math.round((b - a) / step))).toFixed(decimals(step));
      r.chance = (p = 0.5) => next() < p;
      r.shuffle = (xs) => { const a = xs.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(next() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
      return r;
    };
    // a fresh seed (not in `avoid`, a Set or an array of earlier seeds)
    S5.newSeed = (avoid) => {
      const has = !avoid ? () => false : avoid instanceof Set ? (x) => avoid.has(x) : (x) => avoid.includes(x);
      for (let i = 0; i < 200; i++) {
        let x; try { x = crypto.getRandomValues(new Uint32Array(1))[0]; } catch { x = Math.floor(Math.random() * 4294967295); }
        x = (x % (M - 1)) + 1; if (!has(x)) return x;
      }
      return (Date.now() % (M - 1)) + 1;
    };

    /* ---------- units: {sym: {dim, toSI}} ---------- */
    const U = {};
    const dim = (d, list) => { for (const [sym, k] of list) U[sym] = { dim: d, toSI: k }; };
    dim("force", [["N", 1], ["kN", 1e3], ["MN", 1e6]]);
    dim("length", [["mm", 1e-3], ["cm", 1e-2], ["m", 1]]);
    dim("moment", [["N·m", 1], ["kN·m", 1e3]]);
    dim("stress", [["Pa", 1], ["kPa", 1e3], ["MPa", 1e6], ["GPa", 1e9]]);
    dim("inertia", [["mm⁴", 1e-12], ["cm⁴", 1e-8], ["m⁴", 1]]);
    dim("angle", [["deg", DEG], ["rad", 1]]);
    dim("area", [["mm²", 1e-6], ["cm²", 1e-4], ["m²", 1]]);
    dim("lineLoad", [["N/m", 1], ["kN/m", 1e3]]);
    dim("mass", [["kg", 1], ["t", 1e3]]);
    dim("volume", [["L", 1e-3], ["m³", 1]]);
    dim("none", [["", 1]]);
    S5.units = U;
    // later generators add their own units here, e.g. S5.addUnits("density", [["kg/m³", 1]]); an existing symbol is never redefined
    S5.addUnits = (d, list) => { for (const [sym, k] of list) if (!U[sym] && k > 0) U[sym] = { dim: d, toSI: k }; return S5.unitsOf(d); };
    const ALIAS = { kNm: "kN·m", "kN.m": "kN·m", "kN-m": "kN·m", "kN m": "kN·m", Nm: "N·m", "N.m": "N·m", "N-m": "N·m", "N m": "N·m", "°": "deg", degree: "deg", degrees: "deg",
      mm4: "mm⁴", cm4: "cm⁴", m4: "m⁴", mm2: "mm²", cm2: "cm²", m2: "m²", m3: "m³", "N/mm²": "MPa", "N/mm2": "MPa", "1": "" };
    S5.unitNorm = (sym) => { if (sym == null) return null; const s = String(sym).trim(); return U[s] ? s : ALIAS[s] != null ? ALIAS[s] : null; };
    S5.unitsOf = (d) => Object.keys(U).filter((k) => U[k].dim === d);
    S5.toSI = (v, sym) => { const u = U[S5.unitNorm(sym)]; return u ? v * u.toSI : NaN; };
    S5.fromSI = (v, sym) => { const u = U[S5.unitNorm(sym)]; return u ? v / u.toSI : NaN; };

    /* ---------- numbers as typed on a MatePad (Arabic-Indic digits, ٫ and comma decimals, fractions) ---------- */
    const SUP = { "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9", "⁻": "-", "⁺": "+" };
    const latinDigits = (s) => s.replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 0x660)).replace(/[۰-۹]/g, (c) => String(c.charCodeAt(0) - 0x6f0));
    const decimal = (t) => { // one decimal number, separators resolved; returns {v, amb, alt} or null
      t = t.replace(/^\+/, ""); let neg = false; if (t.startsWith("-")) { neg = true; t = t.slice(1); }
      let amb = false, alt = null, exp = "";
      const e = t.match(/^(.*?)e([+-]?\d+)$/i); if (e) { t = e[1]; exp = "e" + e[2]; }
      const hasC = t.includes(","), hasD = t.includes(".");
      if (hasC && hasD) { if (t.lastIndexOf(",") > t.lastIndexOf(".")) t = t.replace(/\./g, "").replace(",", "."); else t = t.replace(/,/g, ""); }
      else if (hasC) { const parts = t.split(","); if (parts.length > 2) { if (!parts.slice(1).every((g) => /^\d{3}$/.test(g))) return null; t = parts.join(""); } else { amb = /^\d{1,3},\d{3}$/.test(t); if (amb) alt = Number(t.replace(",", "") + exp); t = t.replace(",", "."); } } // 1,500: decimal comma first (MatePad), 1500 kept as alt
      else if ((t.match(/\./g) || []).length > 1) { const parts = t.split("."); if (!parts.slice(1).every((g) => /^\d{3}$/.test(g))) return null; t = parts.join(""); }
      if (!/^(\d+\.?\d*|\.\d+)$/.test(t)) return null;
      const v = Number(t + exp); return Number.isFinite(v) ? { v: neg ? -v : v, amb, alt: alt == null ? null : neg ? -alt : alt } : null;
    };
    S5.parseNumInfo = (raw) => {
      if (typeof raw === "number") return Number.isFinite(raw) ? { ok: true, v: raw, frac: false, empty: false } : { ok: false, v: NaN, empty: false };
      let s = latinDigits(String(raw ?? "")).replace(/[‎‏؜‪-‮⁦-⁩]/g, "").replace(/[\s ]+/g, " ").trim();
      if (!s) return { ok: false, v: NaN, empty: true };
      s = s.replace(/[−–‒﹣－]/g, "-").replace(/＋/g, "+").replace(/٫/g, ".").replace(/[،]/g, ",").replace(/٬/g, "").replace(/[⁄∕÷]/g, "/").replace(/\s*\/\s*/g, "/").replace(/^([+-])\s+/, "$1");
      // 28.8 × 10^6, 28.8x10⁶, 28.8*10^-3
      const sci = s.match(/^(.*?)\s*[×xX*]\s*10\s*(?:\^\s*([+-]?\d+)|([⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]+))$/);
      if (sci) s = sci[1] + "e" + (sci[2] != null ? sci[2] : [...sci[3]].map((c) => SUP[c]).join(""));
      const bad = { ok: false, v: NaN, empty: false };
      const mixed = s.match(/^([+-]?)(\d+) (\d+)\/(\d+)$/); // 2 1/3
      if (mixed) { const d = +mixed[4]; if (!d) return bad; const v = (+mixed[2] + +mixed[3] / d) * (mixed[1] === "-" ? -1 : 1); return { ok: true, v, frac: true, empty: false }; }
      if (/^[+-]?\d{1,3}( \d{3})+([.,]\d+)?$/.test(s)) s = s.replace(/ /g, ""); // 12 345 (space as thousands separator)
      if (s.includes(" ")) return bad;
      const sl = s.split("/");
      if (sl.length === 2) {
        const a = decimal(sl[0]), b = decimal(sl[1]); if (!a || !b || b.v === 0) return bad;
        return { ok: true, v: a.v / b.v, frac: Number.isInteger(a.v) && Number.isInteger(b.v), empty: false };
      }
      if (sl.length > 2) return bad;
      const d = decimal(s); return d ? { ok: true, v: d.v, frac: false, empty: false, ...(d.amb ? { ambiguous: true, alt: d.alt } : {}) } : bad;
    };
    S5.parseNum = (s) => S5.parseNumInfo(s).v;

    /* ---------- tolerances, tiers, codes ---------- */
    // rel: relative tolerance; floor: absolute floor as a fraction of the largest key of the same dimension in the problem
    // (default rel/2, i.e. 0.5% for the 1% default); abs: absolute (SI); frac: tolerance when the answer is typed as a fraction
    S5.TOL = { def: { rel: 0.01, floor: 0.005 }, geo: { rel: 0.005, floor: 0.0025 }, exact: { rel: 0.001, frac: 1e-9, floor: 0 }, angMech: { abs: 0.5 * DEG }, angMath: { abs: 0.1 * DEG } };
    const ROUND = 0.03; // 1–3% off = rounding (half credit, never mastery)
    const tolOf = (f) => { let t = f.tol; if (typeof t === "string") t = S5.TOL[t]; if (typeof t === "number") t = { rel: t }; return t || (f.dim === "angle" ? S5.TOL.angMech : S5.TOL.def); };
    S5.TIERS = {
      E0: { id: "E0", rank: 0, label: "Self-check", mastery: false },
      E1: { id: "E1", rank: 1, label: "AI opinion · verify", mastery: false },
      E2: { id: "E2", rank: 2, label: "Practice with help", mastery: false, practice: true },
      E3: { id: "E3", rank: 3, label: "Graded by code", mastery: true },
      E4: { id: "E4", rank: 4, label: "Retrieval or exam", mastery: true },
      EP: { id: "EP", rank: 5, label: "Professor or jury score", mastery: false, authoritative: true },
    };
    S5.GRADE_CODES = { ok: "Correct", rounding: "Rounding — half credit", unit: "Unit slip", sign: "Wrong sign or sense", x2: "Off by a factor of 2", "deg-rad": "Degrees/radians mix-up", wrong: "Not correct", empty: "No answer" };
    const SCALES = [3, -3, 6, -6, 9, -9, 1, -1, 2, -2, 4, -4, 5, -5, 7, -7, 8, -8, 10, -10, 11, -11, 12, -12];
    const wrapAng = (d) => { const t = 2 * Math.PI; return ((((d + Math.PI) % t) + t) % t) - Math.PI; };

    /* S5.grade(input, unit, keySI, field, opt) → {ok, score, code, got, key, v, unit, frac, err, tol}
       input: string or number as typed; unit: the picked unit symbol; opt: {sense, max: largest |key| of the same dimension
       in the problem (for the absolute floor), mis:[[code, SI]]}.
       Codes: ok | rounding (half credit) | unit (10ⁿ slip) | sign | x2 | deg-rad | wrong | empty (bad:true when unreadable).
       Detail for feedback: unit → scale n (the answer is about key × 10ⁿ), x2 → factor 2 | 0.5, sign → factor −1,
       deg-rad → as ('rad' typed under deg, or the reverse), a generator misconception → mis:true; unit with why:'dim' when
       the picked unit measures another quantity; ambiguous:true when "1,500"-style input was graded both ways. */
    S5.grade = (input, unit, key, field = {}, opt = {}) => {
      const info = S5.parseNumInfo(input), base = { ok: false, score: 0, key };
      if (info.empty) return { ...base, code: "empty" };
      if (!info.ok) return { ...base, code: "empty", bad: true };
      if (info.ambiguous && Number.isFinite(info.alt)) { // "1,500": graded both ways (decimal comma and thousands); the better reading counts, ties go to the decimal comma
        const a = S5.grade(info.v, unit, key, field, opt), b = S5.grade(info.alt, unit, key, field, opt);
        return { ...(b.score > a.score ? b : a), ambiguous: true };
      }
      const d = field.dim || (U[S5.unitNorm(unit)] || {}).dim || "none", u = S5.unitNorm(unit != null && unit !== "" ? unit : field.unit != null ? field.unit : S5.unitsOf(d)[0]);
      if (u == null || U[u].dim !== d) return { ...base, code: "unit", v: info.v, why: "dim" };
      let got = info.v * U[u].toSI;
      if (field.sense && opt.sense != null && opt.sense !== "" && field.sense.includes(opt.sense)) got = (opt.sense === field.sense[1] ? -1 : 1) * Math.abs(got);
      if (!Number.isFinite(key)) return { ...base, code: "wrong", why: "no-key", v: info.v };
      const t = tolOf(field), k = Math.abs(key), fl = t.floor != null ? t.floor : t.rel ? t.rel / 2 : 0, floor = fl * Math.max(opt.max || 0, k);
      let tolAbs = Math.max((t.rel || 0) * k, t.abs || 0, floor);
      if (t.frac && info.frac) tolAbs = t.frac * Math.max(1, k);
      const roundAbs = t.rel ? Math.max(Math.max(ROUND, 3 * t.rel) * k, tolAbs) : 3 * (t.abs || 0); // half credit stops at ~3% of the key (the floor only widens 'ok')
      const dist = (a, b) => (field.wrap ? Math.abs(wrapAng(a - b)) : Math.abs(a - b));
      const near = (a, b, tol) => dist(a, b) <= tol * (1 + 1e-9) + 1e-12 * Math.max(1, Math.abs(b));
      const out = (code, score, why) => ({ ok: code === "ok", score, code, key, got, v: info.v, unit: u, frac: !!info.frac, err: k ? dist(got, key) / k : dist(got, key), tol: tolAbs, ...(why || {}) });
      if (near(got, key, tolAbs)) return out("ok", 1);
      if (near(got, key, roundAbs)) return out("rounding", 0.5);
      // misconceptions: every explanation that reproduces the key within its band competes; the closest one wins.
      // `why` tells the feedback what was detected: scale (got ≈ key × 10^scale), factor (got ≈ key × factor), as, mis.
      let best = null;
      const consider = (code, alt, target, tol, why) => { if (!Number.isFinite(alt) || !(tol > 0)) return; const e = dist(alt, target); if (e <= tol * (1 + 1e-9) + 1e-12 * Math.max(1, Math.abs(target)) && (!best || e / tol < best[0])) best = [e / tol, code, why]; };
      if (k > tolAbs) { // a key that is effectively zero has no sign or scale to slip
        consider("sign", -got, key, roundAbs, { factor: -1 });
        // degrees/radians mix-up, judged from the unit actually picked: 'deg' picked but a radian value typed, or the reverse
        if (d === "angle") { const alt = u === "deg" ? info.v : u === "rad" ? info.v * DEG : NaN; if (Math.abs(alt) <= 4 * Math.PI) consider("deg-rad", alt, key, roundAbs, { as: u === "deg" ? "rad" : "deg" }); }
        else {
          for (const n of SCALES) { consider("unit", got / 10 ** n, key, roundAbs, { scale: n }); consider("unit", -got / 10 ** n, key, roundAbs, { scale: n, flipped: true }); }
          consider("x2", got / 2, key, roundAbs, { factor: 2 }); consider("x2", got * 2, key, roundAbs, { factor: 0.5 });
        }
      }
      // generator misconceptions (code-computed wrong answers): matched as tightly as a correct answer would be
      for (const [code, val] of opt.mis || []) if (Number.isFinite(val) && !near(val, key, roundAbs)) consider(code, got, val, Math.max((t.rel || 0) * Math.abs(val), t.abs || 0), { mis: true });
      return best ? out(best[1], 0, best[2]) : out("wrong", 0);
    };

    /* ---------- registries ---------- */
    S5.PROB = S5.PROB || {};
    S5.OBJ = S5.OBJ || {};
    S5.COLLEGE_ERRORS = S5.COLLEGE_ERRORS || [];
    const fmt = (x, d) => { // display number: fewer decimals for bigger numbers, trailing zeros trimmed
      if (!Number.isFinite(x)) return "?"; const a = Math.abs(x);
      if (d == null) { if (a !== 0 && a < 0.01) return String(+x.toPrecision(3)); d = a >= 1000 ? 0 : a >= 100 ? 1 : a >= 10 ? 2 : 3; }
      let s = x.toFixed(d); if (s.includes(".")) s = s.replace(/0+$/, "").replace(/\.$/, ""); return s === "-0" ? "0" : s;
    };
    S5.prob = {
      fmt,
      SENSE: { T: { en: "Tension", ar: "شد" }, C: { en: "Compression", ar: "ضغط" }, CCW: { en: "Counter-clockwise", ar: "عكس عقارب الساعة" }, CW: { en: "Clockwise", ar: "مع عقارب الساعة" } },
      register(def) {
        const need = ["gen", "solve", "fields", "text", "steps"].filter((k) => typeof def[k] !== "function");
        if (!def.id || need.length || !def.obj || !def.v) { S5.COLLEGE_ERRORS.push("bad generator " + (def.id || "?") + ": " + need.join(",")); return null; }
        S5.PROB[def.id] = def; return def;
      },
      obj(o) { S5.OBJ[o.id] = { ...(S5.OBJ[o.id] || {}), ...o }; return S5.OBJ[o.id]; },
      list(pred) { return Object.values(S5.PROB).filter((d) => !pred || pred(d)); },
      forLesson(id) { return this.list((d) => d.lesson === id || (d.lessons || []).includes(id)); },
      forObj(id) { return this.list((d) => d.obj === id); },
      params(pid, seed) { const def = S5.PROB[pid]; return def ? def.gen(S5.rng(seed)) : null; },
      instance(pid, seed) {
        const def = S5.PROB[pid]; if (!def) return null; const p = def.gen(S5.rng(seed));
        return { pid, v: def.v, seed, obj: def.obj, lesson: def.lesson, p, keys: def.solve(p), fields: def.fields(p) };
      },
      // the same instance again from an attempt record (null when the generator version changed since)
      reproduce(a) { const def = a && S5.PROB[a.pid]; return def && def.v === a.v ? this.instance(a.pid, a.seed) : null; },
      /* grade a whole item: given = {k: [input, unit, sense?]} (or {v, unit, sense}) →
         {ok, score, codes, results, keys, given:{k:[num|null, unit, sense?]}} */
      grade(pidOrDef, p, given = {}) {
        const def = typeof pidOrDef === "string" ? S5.PROB[pidOrDef] : pidOrDef;
        const keys = def.solve(p), fields = def.fields(p), mis = (def.mis && def.mis(p)) || {};
        const maxBy = {}; for (const f of fields) maxBy[f.dim] = Math.max(maxBy[f.dim] || 0, Math.abs(keys[f.k]) || 0);
        const results = {}, codes = {}, giv = {}; let sum = 0, wsum = 0;
        for (const f of fields) {
          const g = given[f.k]; const [inp, unit, sense] = Array.isArray(g) ? g : g && typeof g === "object" ? [g.v, g.unit, g.sense] : [g, f.unit];
          const r = S5.grade(inp, unit != null && unit !== "" ? unit : f.unit, keys[f.k], f, { sense, max: maxBy[f.dim] || 0, mis: mis[f.k] });
          results[f.k] = r; codes[f.k] = r.code;
          giv[f.k] = [Number.isFinite(r.v) ? r.v : null, r.unit != null ? r.unit : unit != null ? unit : f.unit]; if (f.sense) giv[f.k].push(sense != null ? sense : null);
          const w = f.w || 1; sum += w * r.score; wsum += w;
        }
        return { ok: fields.every((f) => results[f.k].ok), score: wsum ? Math.round((sum / wsum) * 1e4) / 1e4 : 0, codes, results, keys, given: giv };
      },
      // the fields of an attempt record for an instance + a grade result (the caller saves it with S5.store.create('attempt', …))
      record(inst, g, extra = {}) {
        return { pid: inst.pid, v: inst.v, seed: inst.seed, obj: inst.obj, lesson: inst.lesson, given: g.given, codes: g.codes, score: g.score, tier: extra.tier || "E2", mode: extra.mode || "practice", fade: extra.fade != null ? extra.fade : null, ms: extra.ms != null ? extra.ms : null, ...extra };
      },
      // every generator over n deterministic seeds: finite keys, reproducible params, own key graded ok (also at 4 s.f.)
      selfCheck(n = 20) {
        const bad = []; let items = 0; const ids = Object.keys(S5.PROB);
        const finite = (x) => (typeof x === "number" ? Number.isFinite(x) : Array.isArray(x) ? x.every(finite) : x && typeof x === "object" ? Object.values(x).every(finite) : true);
        for (const pid of ids) {
          const def = S5.PROB[pid];
          for (let i = 0; i < n; i++) {
            const seed = S5.hashSeed(pid + "#" + i); items++;
            try {
              const p = def.gen(S5.rng(seed)); if (JSON.stringify(p) !== JSON.stringify(def.gen(S5.rng(seed)))) throw new Error("same seed, different params");
              if (!finite(p)) throw new Error("non-finite params");
              const keys = def.solve(p), fields = def.fields(p); if (!fields.length) throw new Error("no fields");
              if (!Object.values(keys).every((k) => Number.isFinite(k))) throw new Error("non-finite key");
              for (const f of fields) if (!(f.units || []).length || !f.units.concat(f.unit).every((u) => U[u] && U[u].dim === f.dim)) throw new Error("bad units on " + f.k);
              for (const prec of [15, 4]) {
                const given = {}; for (const f of fields) { const v = S5.fromSI(keys[f.k], f.unit); given[f.k] = f.sense ? [String(+Math.abs(v).toPrecision(prec)), f.unit, v < 0 ? f.sense[1] : f.sense[0]] : [String(+v.toPrecision(prec)), f.unit]; }
                const g = this.grade(def, p, given); if (!g.ok) throw new Error("own key graded " + JSON.stringify(g.codes));
              }
              for (const l of ["ar", "en"]) { if (!String(def.text(p, l) || "").trim()) throw new Error("no text " + l); if (!(def.steps(p, l) || []).length) throw new Error("no steps " + l); }
            } catch (e) { bad.push(pid + "@" + seed + ": " + (e && e.message)); }
          }
        }
        const kb = ids.flatMap((pid) => this.kbCheck(pid)); const agree = kb.filter((x) => x.ok).length;
        return { ok: !bad.length && ids.length > 0, gens: ids.length, items, bad, kb, flagged: kb.filter((x) => x.flagged).map((x) => x.lesson),
          note: `${ids.length} generators × ${n} seeds · ${agree}/${kb.length} lesson examples agree` };
      },
      // the generator re-solves its library lesson's worked example; a disagreement flags the lesson for review (neither side is trusted)
      kbCheck(pid) {
        const def = S5.PROB[pid]; if (!def || !def.kb) return [];
        return [].concat(def.kb).map((kb) => {
          const keys = def.solve(kb.p), fields = def.fields(kb.p);
          const diffs = Object.entries(kb.expect).map(([k, [val, unit]]) => { const f = fields.find((x) => x.k === k) || { dim: (U[unit] || {}).dim }; const r = S5.grade(val, unit, keys[k], { ...f, sense: null }); return { k, printed: val, unit, solved: S5.fromSI(keys[k], unit), code: r.code }; });
          const ok = diffs.length > 0 && diffs.every((x) => x.code === "ok");
          return { pid, lesson: kb.lesson, ok, flagged: !ok, diffs };
        });
      },
    };

    /* ---------- mastery: a pure function of attempts (never stored) ---------- */
    const at = (a) => a.at || a.createdAt || "";
    const correct = (a) => (a.score || 0) >= 0.999; // half credit (rounding) never counts
    const unaided = (a) => a.tier === "E3" || a.tier === "E4";
    S5.mastery = {
      LEITNER: [1, 3, 7, 16, 35],
      STATES: ["new", "practicing", "secure", "mastered", "due", "fragile"],
      LABEL: { new: "New", practicing: "Practicing", secure: "Secure", mastered: "Mastered", due: "Due for retrieval", fragile: "Fragile" },
      isCorrect: correct,
      /* info(attempts of ONE objective, nowISO) → {state, n, correct, seeds, days, e4, e4n, streak, box, dueAt, last}
         secure:   ≥3 correct E3/E4 on distinct seeds and the latest unaided attempt correct
         mastered: secure + correct evidence on ≥2 calendar days + ≥1 correct E4 (the latest E4 passed)
         due:      mastered and the Leitner interval (1/3/7/16/35 days by consecutive E4 passes) has passed
         fragile:  the latest E4 (retrieval or exam) failed on a skill that had been secured (≥3 distinct-seed unaided
                   correct answers before it); an E4 miss on a skill never secured leaves it 'practicing'. Only a passed
                   E4 clears 'fragile'. */
      info(attempts, nowISO) {
        const xs = (attempts || []).filter((a) => a && !a.deleted).slice().sort((a, b) => at(a).localeCompare(at(b)));
        const res = { state: "new", n: xs.length, correct: 0, seeds: 0, days: 0, e4: 0, e4n: 0, streak: 0, box: 0, dueAt: null, last: xs.length ? at(xs[xs.length - 1]) : null };
        if (!xs.length) return res;
        const un = xs.filter(unaided), good = un.filter(correct), e4 = xs.filter((a) => a.tier === "E4");
        const seedKey = (a) => (a.pid || "") + "|" + a.seed;
        const seeds = new Set(good.map(seedKey)), days = new Set(good.map((a) => S5.dateISO(at(a))));
        let streak = 0; const passDays = new Set(); for (let i = e4.length - 1; i >= 0 && correct(e4[i]); i--) { streak++; passDays.add(S5.dateISO(at(e4[i]))); }
        // the Leitner box climbs once per calendar day of passed E4 retrieval, so several exam items in one sitting count once
        Object.assign(res, { correct: good.length, seeds: seeds.size, days: days.size, e4: e4.filter(correct).length, e4n: e4.length, streak, box: Math.min(passDays.size, this.LEITNER.length) });
        if (streak) res.dueAt = S5.addDays(S5.dateISO(at(e4[e4.length - 1])), this.LEITNER[res.box - 1]);
        if (e4.length && !streak) {
          const miss = xs.lastIndexOf(e4[e4.length - 1]), before = new Set();
          for (let i = 0; i < miss; i++) if (unaided(xs[i]) && correct(xs[i])) before.add(seedKey(xs[i]));
          if (before.size >= 3) { res.state = "fragile"; return res; }
        }
        const lastUn = un[un.length - 1];
        if (!(seeds.size >= 3 && lastUn && correct(lastUn))) { res.state = "practicing"; return res; }
        if (days.size >= 2 && streak >= 1) { res.state = S5.dateISO(nowISO || S5.now()) >= res.dueAt ? "due" : "mastered"; return res; }
        res.state = "secure"; return res;
      },
      state(attempts, nowISO) { return this.info(attempts, nowISO).state; },
      attemptsOf(objId) { return S5.store.list("attempt", (a) => a.obj === objId); },
      _cache: new Map(), _day: "", _size: -1,
      clear() { this._cache.clear(); },
      infoOf(objId, nowISO) {
        if (nowISO) return this.info(this.attemptsOf(objId), nowISO);
        const day = S5.todayISO(), size = S5.store.recs.size; // a new day or a purge also invalidates
        if (day !== this._day || size !== this._size) { this._cache.clear(); this._day = day; this._size = size; }
        let r = this._cache.get(objId); if (!r) { r = this.info(this.attemptsOf(objId), S5.now()); this._cache.set(objId, r); }
        return r;
      },
      of(objId, nowISO) { return this.infoOf(objId, nowISO).state; },
      /* objectives that need retrieval now → [{obj, state, dueAt, info}]: fragile first, then by due date.
         Listed: due, fragile, secure with a passed E4 whose interval has run out (a second day toward mastered);
         opts.secure also lists secure objectives with no passed E4 yet (first retrieval). */
      dueList(nowISO, opts = {}) {
        const now = nowISO || S5.now(), today = S5.dateISO(now), by = new Map();
        for (const a of S5.store.list("attempt")) if (a.obj) (by.get(a.obj) || by.set(a.obj, []).get(a.obj)).push(a);
        const out = [];
        for (const [obj, xs] of by) {
          const i = this.info(xs, now);
          if (i.state === "due" || i.state === "fragile" || (i.state === "secure" && (i.dueAt ? today >= i.dueAt : !!opts.secure))) out.push({ obj, state: i.state, dueAt: i.dueAt, info: i });
        }
        return out.sort((a, b) => (a.state === "fragile" ? 0 : 1) - (b.state === "fragile" ? 0 : 1) || String(a.dueAt || "9999").localeCompare(String(b.dueAt || "9999")));
      },
    };
    S5.bus.on("change", (rec) => { if (!rec || rec.type === "attempt") S5.mastery.clear(); });

    /* ---------- numGuard: numbers in AI text that code did not produce ---------- */
    const SMALL = new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 90, 180, 270, 360]);
    const scan = (text) => {
      const s = String(text || ""), out = [], re = /[0-9٠-٩۰-۹]+(?:[.,٫٬][0-9٠-٩۰-۹]+)*/g; let m;
      while ((m = re.exec(s))) {
        const prev = s[m.index - 1] || ""; if (/[A-Za-z_]/.test(prev)) continue; // identifiers: F1, E3, c1b
        if (/[ء-ي]/.test(prev) && !(/[وبلكف]/.test(prev) && !/[ء-ي]/.test(s[m.index - 2] || ""))) continue; // Arabic identifiers (م1) — but a one-letter proclitic (و٣٠، ب٢٠) still counts as a number
        const tok = latinDigits(m[0]).replace(/٫/g, "."), cands = [];
        const dec = tok.replace(/٬/g, ""), i = Math.max(dec.lastIndexOf("."), dec.lastIndexOf(","));
        const ulp = (str) => { const j = Math.max(str.lastIndexOf("."), 0); return str.includes(".") ? 0.5 * 10 ** -(str.length - j - 1) : 0.5; };
        if (/^\d+$/.test(dec)) cands.push([+dec, 0.5]);
        else {
          const a = dec.replace(/,/g, ""); if (/^\d+(\.\d+)?$/.test(a)) cands.push([+a, ulp(a)]);           // commas as thousands
          if (i > 0) { const b = dec.slice(0, i).replace(/[.,]/g, "") + "." + dec.slice(i + 1); if (/^\d+\.\d+$/.test(b)) cands.push([+b, ulp(b)]); } // last separator as decimal
        }
        const neg = /[-−]/.test(prev);
        out.push({ s: (neg ? "-" : "") + m[0], i: m.index - (neg ? 1 : 0), v: cands.length ? cands[cands.length - 1][0] * (neg ? -1 : 1) : NaN, cands });
      }
      return out;
    };
    /* S5.numGuard(text, allowed[], {scales=true, small=true}) → [{s, i, v}] numbers not traceable to code.
       allowed: numbers from code (params, steps, keys, the student's values). Each is also accepted ×10^±3k
       (unit changes) and to its display rounding (±half a unit in the token's last digit, or ±0.5%). */
    S5.numGuard = (text, allowed = [], opts = {}) => {
      const base = []; const walk = (x) => { if (typeof x === "number" && Number.isFinite(x)) base.push(Math.abs(x)); else if (Array.isArray(x)) x.forEach(walk); else if (x && typeof x === "object") Object.values(x).forEach(walk); };
      walk(allowed);
      const vals = opts.scales === false ? base : base.flatMap((a) => [-9, -6, -3, 0, 3, 6, 9].map((n) => a * 10 ** n));
      return scan(text).filter((t) => !t.cands.some(([c, ulp]) => (opts.small !== false && SMALL.has(c)) || vals.some((a) => Math.abs(c - a) <= Math.max(ulp, 0.005 * a) + 1e-12))).map(({ s, i, v }) => ({ s, i, v }));
    };
    S5.numGuard.scan = scan;
    // everything code knows about one instance: params, keys in every unit of their field, numbers printed in text and steps
    S5.numGuard.allowedFrom = (pid, p, extra = []) => {
      const out = [], walk = (x) => { if (typeof x === "number" && Number.isFinite(x)) out.push(x); else if (Array.isArray(x)) x.forEach(walk); else if (x && typeof x === "object") Object.values(x).forEach(walk); };
      walk(p); walk(extra); const def = S5.PROB[pid]; if (!def) return out;
      const keys = def.solve(p); for (const f of def.fields(p)) for (const u of f.units) walk(S5.fromSI(keys[f.k], u));
      for (const l of ["en", "ar"]) for (const s of [def.text(p, l), ...def.steps(p, l)]) for (const t of scan(s)) for (const c of t.cands) walk(c[0]);
      return out;
    };
  } catch (e) { (S5.COLLEGE_ERRORS = S5.COLLEGE_ERRORS || []).push("10-problems: " + (e && e.message)); console.error(e); }
})();
