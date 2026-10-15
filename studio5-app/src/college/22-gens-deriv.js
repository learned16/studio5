/* Principles of Calculus (TECK 102, Architecture Year 1) — weeks 11–16 of the official syllabus (docs/SYLLABUS_ARCH_Y1.md):
   derivatives and tangent lines, differentiation rules and trigonometric derivatives, the chain rule, implicit
   differentiation and fractional powers, related rates, maxima/minima with y′ and y″, asymptotes and optimization.
   Keys come from exact integer/rational arithmetic; named mistakes (mis → code 'mis') are the wrong answers students
   really produce. Text and steps are bilingual. Same conventions as 21-gens-calc.js. */
(() => {
  try {
    const PR = S5.prob, SUBJ = "Principles of Calculus", NONE = [""];
    const tr = (lang, en, ar) => (lang === "ar" ? ar : en);
    const note = (en, ar) => ({ en, ar });
    const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
    const Q = (n, d = 1) => { if (d < 0) { n = -n; d = -d; } const g = gcd(n, d); return [n / g, d / g]; };
    const qs = (q) => (q[1] === 1 ? String(q[0]) : `${q[0]}/${q[1]}`).replace(/^-/, "−");
    const num = (x) => String(x).replace(/^-/, "−");
    const par = (x) => (x < 0 ? `(${num(x)})` : num(x));
    const fld = (k, sym, en, ar, extra = {}) => ({ k, sym, dim: "none", units: NONE, unit: "", tol: "exact", label: { en, ar }, ...extra });
    const poly = (cs, v = "x") => {
      const deg = cs.length - 1, sup = ["", "", "²", "³", "⁴", "⁵"]; let s = "";
      cs.forEach((c, i) => { const p = deg - i; if (!c) return; const a = Math.abs(c), sign = c < 0 ? (s ? " − " : "−") : s ? " + " : "";
        s += sign + (p === 0 ? String(a) : (a === 1 ? "" : String(a)) + v + sup[p]); });
      return s || "0";
    };
    const lin = (a, b) => poly([a, b]); // "ax + b"
    const L_DER = "a1b-calc-03", L_APP = "a1b-calc-04";

    PR.obj({ id: "calc.deriv.rules", en: "Derivatives: power, product and quotient rules (weeks 11–12)", ar: "المشتقات: قاعدة القوة والضرب والقسمة (الأسبوعان 11–12)", subjects: [SUBJ], program: "arch", lessons: [L_DER] });
    PR.obj({ id: "calc.deriv.tangent", en: "Slopes and tangent lines (week 11)", ar: "الميل والمماس (الأسبوع 11)", subjects: [SUBJ], program: "arch", lessons: [L_DER] });
    PR.obj({ id: "calc.deriv.trig", en: "Derivatives of trigonometric functions (week 12)", ar: "مشتقات الدوال المثلثية (الأسبوع 12)", subjects: [SUBJ], program: "arch", lessons: [L_DER] });
    PR.obj({ id: "calc.deriv.chain", en: "Chain rule, implicit differentiation and fractional powers (week 13)", ar: "قاعدة السلسلة والاشتقاق الضمني والقوى الكسرية (الأسبوع 13)", subjects: [SUBJ], program: "arch", lessons: [L_DER] });
    PR.obj({ id: "calc.deriv.rates", en: "Related rates of change (week 14)", ar: "المعدلات الزمنية المرتبطة (الأسبوع 14)", subjects: [SUBJ], program: "arch", lessons: [L_APP] });
    PR.obj({ id: "calc.deriv.extrema", en: "Maxima and minima with y′ and y″ (week 15)", ar: "القيم العظمى والصغرى باستعمال y′ و y″ (الأسبوع 15)", subjects: [SUBJ], program: "arch", lessons: [L_APP] });
    PR.obj({ id: "calc.deriv.graph", en: "Rational functions: asymptotes (week 16)", ar: "الدوال النسبية: المحاذيات (الأسبوع 16)", subjects: [SUBJ], program: "arch", lessons: [L_APP] });
    PR.obj({ id: "calc.deriv.optim", en: "Optimization problems (week 16)", ar: "مسائل الأمثلية (الأسبوع 16)", subjects: [SUBJ], program: "arch", lessons: [L_APP] });

    /* ---------- 1. power rule at a point ---------- */
    PR.register({
      id: "calc.derivPoly", v: 1, obj: "calc.deriv.rules", lesson: L_DER, subject: SUBJ, program: "arch", lvl: 1,
      gen(r) { for (let t = 0; t < 40; t++) { const a = r.int(-4, 5), b = r.int(-6, 6), c = r.int(-9, 9), d = r.int(-9, 9), x0 = r.pick([-3, -2, -1, 1, 2, 3]); if (a && b && 3 * a * x0 * x0 + 2 * b * x0 + c !== 0) return { a, b, c, d, x0 }; } return { a: 2, b: -3, c: 1, d: 4, x0: 2 }; },
      solve: (p) => ({ D: 3 * p.a * p.x0 ** 2 + 2 * p.b * p.x0 + p.c }),
      fields: () => [fld("D", "f′", "f′ at the given point", "f′ عند النقطة المعطاة")],
      text: (p, lang) => tr(lang, `f(x) = ${poly([p.a, p.b, p.c, p.d])}. Find f′(${num(p.x0)}).`, `لتكن f(x) = ${poly([p.a, p.b, p.c, p.d])}. أوجد f′(${num(p.x0)}).`),
      steps(p, lang) {
        const { a, b, c, x0 } = p;
        return [tr(lang, "Power rule: d/dx xⁿ = n·xⁿ⁻¹; the constant term disappears.", "قاعدة القوة: d/dx xⁿ = n·xⁿ⁻¹؛ والحد الثابت يختفي."),
          `f′(x) = ${poly([3 * a, 2 * b, c])}`,
          `f′(${num(x0)}) = ${3 * a}·${par(x0)}² ${2 * b < 0 ? "−" : "+"} ${Math.abs(2 * b)}·${par(x0)} ${c < 0 ? "−" : "+"} ${Math.abs(c)} = ${num(this.solve(p).D)}`];
      },
      mis: (p) => ({ D: [["noPower", p.a * p.x0 ** 2 + p.b * p.x0 + p.c, note("You lowered each power but did not multiply by it: d/dx x³ = 3x², not x².", "أنزلت القوة لكنك لم تضرب بها: مشتقة x³ هي 3x² وليست x².")], ["fValue", p.a * p.x0 ** 3 + p.b * p.x0 ** 2 + p.c * p.x0 + p.d, note("That is f(x₀), the height of the curve — the question asks for the slope f′(x₀).", "هذه f(x₀) أي ارتفاع المنحني — المطلوب الميل f′(x₀).")]] }),
    });

    /* ---------- 2. tangent line ---------- */
    PR.register({
      id: "calc.tangent", v: 1, obj: "calc.deriv.tangent", lesson: L_DER, subject: SUBJ, program: "arch", lvl: 1,
      gen(r) { for (let t = 0; t < 40; t++) { const a = r.pick([-3, -2, -1, 1, 2, 3]), b = r.int(-6, 6), c = r.int(-8, 8), x0 = r.pick([-3, -2, -1, 1, 2, 3]); if (2 * a * x0 + b !== 0 && a * x0 * x0 !== 0) return { a, b, c, x0 }; } return { a: 1, b: 2, c: -3, x0: 1 }; },
      solve(p) { const m = 2 * p.a * p.x0 + p.b, y0 = p.a * p.x0 ** 2 + p.b * p.x0 + p.c; return { m, B: y0 - m * p.x0 }; },
      fields: () => [fld("m", "m", "Slope m of the tangent", "ميل المماس m"), fld("B", "b", "y-intercept b of the tangent (y = mx + b)", "المقطع الصادي b للمماس (y = mx + b)")],
      text: (p, lang) => tr(lang, `Find the tangent line y = mx + b to the curve y = ${poly([p.a, p.b, p.c])} at x = ${num(p.x0)}.`, `أوجد معادلة المماس y = mx + b للمنحني y = ${poly([p.a, p.b, p.c])} عند x = ${num(p.x0)}.`),
      steps(p, lang) {
        const { a, b, c, x0 } = p, { m, B } = this.solve(p), y0 = a * x0 ** 2 + b * x0 + c;
        return [tr(lang, `Point of contact: y₀ = f(${num(x0)}) = ${num(y0)}, so the point is (${num(x0)}, ${num(y0)}).`, `نقطة التماس: y₀ = f(${num(x0)}) = ${num(y0)}، فالنقطة (${num(x0)}, ${num(y0)}).`),
          tr(lang, `Slope = derivative at the point: y′ = ${poly([2 * a, b])} → m = ${num(m)}`, `الميل = المشتقة عند النقطة: y′ = ${poly([2 * a, b])} ← m = ${num(m)}`),
          tr(lang, `y − y₀ = m(x − x₀): b = y₀ − m·x₀ = ${num(y0)} − ${par(m)}·${par(x0)} = ${num(B)}`, `y − y₀ = m(x − x₀): b = y₀ − m·x₀ = ${num(y0)} − ${par(m)}·${par(x0)} = ${num(B)}`)];
      },
      mis(p) { const y0 = p.a * p.x0 ** 2 + p.b * p.x0 + p.c; return { m: [["noPower", p.a * p.x0 + p.b, note("d/dx ax² = 2ax: you forgot the factor 2.", "مشتقة ax² هي 2ax: نسيت المعامل 2.")]], B: [["y0", y0, note("y₀ is the y-coordinate of the point of contact, not the intercept: b = y₀ − m·x₀.", "y₀ هو الإحداثي الصادي لنقطة التماس وليس المقطع: b = y₀ − m·x₀.")]] }; },
    });

    /* ---------- 3. quotient rule ---------- */
    PR.register({
      id: "calc.quotient", v: 1, obj: "calc.deriv.rules", lesson: L_DER, subject: SUBJ, program: "arch", lvl: 2,
      gen(r) { for (let t = 0; t < 60; t++) { const a = r.int(-5, 5), b = r.int(-6, 6), c = r.pick([-3, -2, -1, 1, 2, 3]), d = r.int(-6, 6), x0 = r.int(-3, 3), den = c * x0 + d; if (a && a * d - b * c !== 0 && den !== 0 && Math.abs(den) !== 1) return { a, b, c, d, x0 }; } return { a: 2, b: 1, c: 1, d: 3, x0: 1 }; },
      solve: (p) => ({ D: (p.a * p.d - p.b * p.c) / (p.c * p.x0 + p.d) ** 2 }),
      fields: () => [fld("D", "f′", "f′ at the given point (fraction allowed)", "f′ عند النقطة المعطاة (يُقبل الكسر)")],
      text: (p, lang) => tr(lang, `f(x) = (${lin(p.a, p.b)}) / (${lin(p.c, p.d)}). Use the quotient rule to find f′(${num(p.x0)}).`, `لتكن f(x) = (${lin(p.a, p.b)}) / (${lin(p.c, p.d)}). استعمل قاعدة القسمة لإيجاد f′(${num(p.x0)}).`),
      steps(p, lang) {
        const { a, b, c, d, x0 } = p, den = c * x0 + d, n = a * d - b * c;
        return [tr(lang, "Quotient rule: (u/v)′ = (u′v − uv′) / v².", "قاعدة القسمة: (u/v)′ = (u′v − uv′) / v²."),
          `u = ${lin(a, b)}, u′ = ${a}; v = ${lin(c, d)}, v′ = ${c}`,
          tr(lang, `u′v − uv′ = ${a}(${lin(c, d)}) − ${c}(${lin(a, b)}) = ${num(n)} (the x terms cancel)`, `u′v − uv′ = ${a}(${lin(c, d)}) − ${c}(${lin(a, b)}) = ${num(n)} (تختصر حدود x)`),
          `f′(${num(x0)}) = ${num(n)} / (${num(den)})² = ${qs(Q(n, den * den))}`];
      },
      mis(p) { const den = p.c * p.x0 + p.d, n = p.a * p.d - p.b * p.c; return { D: [["quotSign", -n / den ** 2, note("The order matters: u′v − uv′ (top derivative first), not uv′ − u′v.", "الترتيب مهم: u′v − uv′ (مشتقة البسط أولًا) وليس uv′ − u′v.")], ["noSquare", n / den, note("The denominator of the quotient rule is v², not v.", "مقام قاعدة القسمة هو v² وليس v.")], ["uOverV", p.a / p.c, note("(u/v)′ is not u′/v′ — use (u′v − uv′)/v².", "مشتقة u/v ليست u′/v′ — استعمل (u′v − uv′)/v².")]] }; },
    });

    /* ---------- 4. trigonometric derivatives at x = π/2 ---------- */
    PR.register({
      id: "calc.trigDeriv", v: 1, obj: "calc.deriv.trig", lesson: L_DER, subject: SUBJ, program: "arch", lvl: 2,
      gen(r) { for (let t = 0; t < 40; t++) { const A = r.int(-5, 5), B = r.int(-5, 5), k = r.pick([2, 4, 6]), m = r.pick([1, 3, 5]); if (A && B && this.solve({ A, B, k, m }).D !== 0) return { A, B, k, m }; } return { A: 3, B: 2, k: 2, m: 3 }; },
      solve(p) { const ck = (-1) ** (p.k / 2), sm = (-1) ** ((p.m - 1) / 2); return { D: p.A * p.k * ck - p.B * p.m * sm }; },
      fields: () => [fld("D", "y′", "y′ at x = π/2", "y′ عند x = π/2")],
      text: (p, lang) => { const e = `${p.A === 1 ? "" : p.A === -1 ? "−" : num(p.A)}sin(${p.k}x) ${p.B < 0 ? "−" : "+"} ${Math.abs(p.B) === 1 ? "" : Math.abs(p.B)}cos(${p.m === 1 ? "" : p.m}x)`; return tr(lang, `y = ${e}. Find y′ at x = π/2.`, `لتكن y = ${e}. أوجد y′ عند x = π/2.`); },
      steps(p, lang) {
        const { A, B, k, m } = p, ck = (-1) ** (k / 2), sm = (-1) ** ((m - 1) / 2);
        return [tr(lang, "d/dx sin(kx) = k·cos(kx) and d/dx cos(mx) = −m·sin(mx) (chain rule: multiply by the inner derivative).", "مشتقة sin(kx) = k·cos(kx) ومشتقة cos(mx) = −m·sin(mx) (قاعدة السلسلة: نضرب في مشتقة الداخل)."),
          `y′ = ${num(A * k)}·cos(${k}x) ${B * m < 0 ? "+" : "−"} ${Math.abs(B * m)}·sin(${m}x)`,
          `cos(${k}·π/2) = cos(${k / 2}π) = ${num(ck)}, sin(${m}·π/2) = ${num(sm)}`,
          `y′(π/2) = ${num(A * k)}·${par(ck)} − ${par(B * m)}·${par(sm)} = ${num(this.solve(p).D)}`];
      },
      mis(p) { const { A, B, k, m } = p, ck = (-1) ** (k / 2), sm = (-1) ** ((m - 1) / 2); return { D: [["noChain", A * ck - B * sm, note("Chain rule: the derivative of sin(kx) is k·cos(kx) — you forgot to multiply by k (and by m for cos).", "قاعدة السلسلة: مشتقة sin(kx) هي k·cos(kx) — نسيت الضرب في k (وفي m لـ cos).")], ["cosSign", A * k * ck + B * m * sm, note("d/dx cos = −sin: the derivative of cosine carries a minus sign.", "مشتقة cos هي −sin: مشتقة جيب التمام فيها إشارة سالبة.")]] }; },
    });

    /* ---------- 5. chain rule (ax + b)ⁿ ---------- */
    PR.register({
      id: "calc.chain", v: 1, obj: "calc.deriv.chain", lesson: L_DER, subject: SUBJ, program: "arch", lvl: 1,
      gen(r) { for (let t = 0; t < 60; t++) { const a = r.pick([-3, -2, 2, 3, 4]), n = r.int(2, 5), x0 = r.int(-2, 2), u = r.pick([-2, -1, 1, 2, 3]), b = u - a * x0; if (Math.abs(n * a * u ** (n - 1)) <= 600) return { a, b, n, x0 }; } return { a: 2, b: 1, n: 3, x0: 0 }; },
      solve: (p) => ({ D: p.n * p.a * (p.a * p.x0 + p.b) ** (p.n - 1) }),
      fields: () => [fld("D", "y′", "y′ at the given point", "y′ عند النقطة المعطاة")],
      text: (p, lang) => tr(lang, `y = (${lin(p.a, p.b)})${["", "", "²", "³", "⁴", "⁵"][p.n]}. Find y′ at x = ${num(p.x0)}.`, `لتكن y = (${lin(p.a, p.b)})${["", "", "²", "³", "⁴", "⁵"][p.n]}. أوجد y′ عند x = ${num(p.x0)}.`),
      steps(p, lang) {
        const { a, b, n, x0 } = p, u = a * x0 + b;
        return [tr(lang, "Chain rule: d/dx uⁿ = n·uⁿ⁻¹·u′ with u = ax + b, u′ = a.", "قاعدة السلسلة: d/dx uⁿ = n·uⁿ⁻¹·u′ حيث u = ax + b و u′ = a."),
          `y′ = ${n}(${lin(a, b)})${["", "", "", "²", "³", "⁴"][n] || ""}·${par(a)}`,
          `u(${num(x0)}) = ${num(u)} → y′ = ${n}·${par(u)}${n - 1 > 1 ? ["", "", "²", "³", "⁴"][n - 1] : ""}·${par(a)} = ${num(this.solve(p).D)}`];
      },
      mis: (p) => { const u = p.a * p.x0 + p.b; return { D: [["noInner", p.n * u ** (p.n - 1), note("Chain rule: multiply by the derivative of the inside, (ax + b)′ = a.", "قاعدة السلسلة: اضرب في مشتقة ما بداخل القوس، (ax + b)′ = a.")], ["keepPower", p.n * p.a * u ** p.n, note("Lower the power by one: n·uⁿ⁻¹, not n·uⁿ.", "انقص القوة واحدًا: n·uⁿ⁻¹ وليس n·uⁿ.")]] }; },
    });

    /* ---------- 6. implicit differentiation x² + xy + y² = C ---------- */
    PR.register({
      id: "calc.implicit", v: 1, obj: "calc.deriv.chain", lesson: L_DER, subject: SUBJ, program: "arch", lvl: 3,
      gen(r) { for (let t = 0; t < 60; t++) { const x0 = r.int(-4, 4), y0 = r.int(-4, 4); if (x0 && y0 && x0 + 2 * y0 !== 0 && 2 * x0 + y0 !== 0) return { x0, y0 }; } return { x0: 1, y0: 2 }; },
      solve: (p) => ({ D: -(2 * p.x0 + p.y0) / (p.x0 + 2 * p.y0) }),
      fields: () => [fld("D", "dy/dx", "dy/dx at the point (fraction allowed)", "dy/dx عند النقطة (يُقبل الكسر)")],
      text(p, lang) { const C = p.x0 ** 2 + p.x0 * p.y0 + p.y0 ** 2; return tr(lang, `The curve x² + xy + y² = ${C} passes through (${num(p.x0)}, ${num(p.y0)}). Find dy/dx there.`, `المنحني x² + xy + y² = ${C} يمر بالنقطة (${num(p.x0)}, ${num(p.y0)}). أوجد dy/dx عندها.`); },
      steps(p, lang) {
        const { x0, y0 } = p, n = 2 * x0 + y0, d = x0 + 2 * y0;
        return [tr(lang, "Differentiate both sides with respect to x; y is a function of x, so d/dx y² = 2y·y′ and d/dx (xy) = y + x·y′ (product rule).", "نشتق الطرفين بالنسبة لـ x؛ y دالة في x، فمشتقة y² = 2y·y′ ومشتقة xy = y + x·y′ (قاعدة الضرب)."),
          "2x + y + x·y′ + 2y·y′ = 0 → y′ = −(2x + y)/(x + 2y)",
          `y′ = −(2·${par(x0)} + ${par(y0)}) / (${par(x0)} + 2·${par(y0)}) = −(${num(n)})/(${num(d)}) = ${qs(Q(-n, d))}`];
      },
      mis: (p) => ({ D: [["noProduct", -(2 * p.x0 + p.y0) / (2 * p.y0), note("d/dx (xy) needs the product rule: y + x·y′ — you dropped the x·y′ term.", "مشتقة xy تحتاج قاعدة الضرب: y + x·y′ — أسقطت الحد x·y′.")], ["noProduct2", -2 * p.x0 / (p.x0 + 2 * p.y0), note("d/dx (xy) = y + x·y′ — you dropped the y term.", "مشتقة xy = y + x·y′ — أسقطت الحد y.")], ["flip", -(p.x0 + 2 * p.y0) / (2 * p.x0 + p.y0), note("Upside down: collect the y′ terms on one side, then divide by their coefficient (x + 2y).", "مقلوبة: اجمع حدود y′ في طرف ثم اقسم على معاملها (x + 2y).")]] }),
    });

    /* ---------- 7. fractional powers ---------- */
    PR.register({
      id: "calc.fracPow", v: 1, obj: "calc.deriv.chain", lesson: L_DER, subject: SUBJ, program: "arch", lvl: 1,
      gen(r) { for (let t = 0; t < 60; t++) { const q = r.pick([2, 3]), pp = r.int(1, 5), a = r.pick([1, 2, 3, 4, 6, -2, -3]), tt = r.pick([2, 3]); if (pp % q !== 0 && (q === 2 || tt === 2 || pp <= 4)) return { a, p: pp, q, t: tt }; } return { a: 2, p: 3, q: 2, t: 2 }; },
      solve: (p) => ({ D: (p.a * p.p / p.q) * p.t ** (p.p - p.q) }),
      fields: () => [fld("D", "y′", "y′ at the given point (fraction allowed)", "y′ عند النقطة المعطاة (يُقبل الكسر)")],
      text: (p, lang) => { const x0 = p.t ** p.q; return tr(lang, `y = ${p.a === 1 ? "" : num(p.a)}x^(${p.p}/${p.q}). Find y′ at x = ${x0}.`, `لتكن y = ${p.a === 1 ? "" : num(p.a)}x^(${p.p}/${p.q}). أوجد y′ عند x = ${x0}.`); },
      steps(p, lang) {
        const { a, q, t } = p, pp = p.p, x0 = t ** q, e = Q(pp - q, q), c = Q(a * pp, q);
        return [tr(lang, "Power rule for fractional powers: d/dx x^r = r·x^(r − 1).", "قاعدة القوة للأسس الكسرية: d/dx x^r = r·x^(r − 1)."),
          `y′ = ${qs(c)}·x^(${qs(e)})`,
          tr(lang, `x = ${x0} = ${t}^${q}, so x^(1/${q}) = ${t} and x^(${qs(e)}) = ${t}^(${pp - q}) → y′ = ${qs(c)}·${t}^(${pp - q}) = ${qs(Q(a * pp * (pp >= q ? t ** (pp - q) : 1), q * (pp >= q ? 1 : t ** (q - pp))))}`, `x = ${x0} = ${t}^${q}، إذن x^(1/${q}) = ${t} و x^(${qs(e)}) = ${t}^(${pp - q}) ← y′ = ${qs(c)}·${t}^(${pp - q}) = ${qs(Q(a * pp * (pp >= q ? t ** (pp - q) : 1), q * (pp >= q ? 1 : t ** (q - pp))))}`)];
      },
      mis: (p) => ({ D: [["noMinusOne", (p.a * p.p / p.q) * p.t ** p.p, note("Subtract one from the exponent: x^(p/q) → (p/q)·x^(p/q − 1).", "اطرح واحدًا من الأس: x^(p/q) ← (p/q)·x^(p/q − 1).")], ["noCoef", p.a * p.t ** (p.p - p.q), note("Bring the exponent p/q down as a factor.", "أنزل الأس p/q كمعامل ضرب.")]] }),
    });

    /* ---------- 8. related rates ---------- */
    PR.register({
      id: "calc.rates", v: 1, obj: "calc.deriv.rates", lesson: L_APP, subject: SUBJ, program: "arch", lvl: 2,
      gen(r) {
        const kind = r.pick(["ladder", "ladder", "cube"]);
        if (kind === "cube") return { kind, s: r.int(2, 9), v: r.pick([0.5, 1, 2, 3]) };
        const [a, b, c] = r.pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15]]), swap = r.chance(0.5);
        return { kind, x: swap ? b : a, y: swap ? a : b, L: c, v: r.pick([0.5, 1, 1.5, 2]) };
      },
      solve: (p) => (p.kind === "cube" ? { R: 3 * p.s * p.s * p.v } : { R: (-p.x * p.v) / p.y }),
      fields: (p) => [p.kind === "cube" ? fld("R", "dV/dt", "dV/dt (m³/min)", "dV/dt (م³/دقيقة)") : fld("R", "dy/dt", "dy/dt of the top (m/s, negative when it moves down)", "dy/dt للطرف العلوي (م/ثا، سالبة إذا نزل)")],
      text(p, lang) {
        if (p.kind === "cube") return tr(lang, `A cubic water tank is being built so that its side grows at ${p.v} m/min. How fast is its volume growing when the side is ${p.s} m?`, `يُبنى خزان ماء مكعب يزداد طول ضلعه بمعدل ${p.v} م/دقيقة. ما معدل زيادة حجمه عندما يكون طول الضلع ${p.s} م؟`);
        return tr(lang, `A ${p.L} m ladder leans against a wall. Its foot slides away from the wall at ${p.v} m/s. How fast is the top moving when the foot is ${p.x} m from the wall?`, `سلّم طوله ${p.L} م يستند إلى جدار. ينزلق أسفله مبتعدًا عن الجدار بمعدل ${p.v} م/ثا. ما معدل تحرك أعلاه عندما يكون أسفله على بعد ${p.x} م من الجدار؟`);
      },
      steps(p, lang) {
        if (p.kind === "cube") return [tr(lang, "V = s³; differentiate with respect to time t: dV/dt = 3s²·ds/dt.", "V = s³؛ نشتق بالنسبة للزمن t: dV/dt = 3s²·ds/dt."), `dV/dt = 3·${p.s}²·${p.v} = ${3 * p.s * p.s * p.v}`];
        return [tr(lang, "x² + y² = L² (foot distance x, height y). Differentiate with respect to t: 2x·dx/dt + 2y·dy/dt = 0.", "x² + y² = L² (x بعد القاعدة، y الارتفاع). نشتق بالنسبة لـ t: 2x·dx/dt + 2y·dy/dt = 0."),
          tr(lang, `When x = ${p.x}: y = √(${p.L}² − ${p.x}²) = ${p.y}`, `عندما x = ${p.x}: y = √(${p.L}² − ${p.x}²) = ${p.y}`),
          `dy/dt = −x·(dx/dt)/y = −${p.x}·${p.v}/${p.y} = ${num(+((-p.x * p.v) / p.y).toFixed(4))}`];
      },
      mis(p) {
        if (p.kind === "cube") return { R: [["noChain", 3 * p.s * p.s, note("Differentiate with respect to time: multiply 3s² by ds/dt.", "الاشتقاق بالنسبة للزمن: اضرب 3s² في ds/dt.")], ["volume", p.s ** 3, note("That is the volume itself, not its rate of change.", "هذا هو الحجم نفسه وليس معدل تغيّره.")]] };
        return { R: [["sameRate", -p.v, note("The top does not move at the same speed as the foot: use 2x·dx/dt + 2y·dy/dt = 0.", "الطرف العلوي لا يتحرك بسرعة الأسفل نفسها: استعمل 2x·dx/dt + 2y·dy/dt = 0.")], ["flipXY", (-p.y * p.v) / p.x, note("x and y are swapped: dy/dt = −(x/y)·dx/dt with x the foot distance.", "تبادلت x و y: dy/dt = −(x/y)·dx/dt حيث x بعد القاعدة.")]] };
      },
    });

    /* ---------- 9. local maximum and minimum ---------- */
    PR.register({
      id: "calc.extrema", v: 1, obj: "calc.deriv.extrema", lesson: L_APP, subject: SUBJ, program: "arch", lvl: 2,
      gen(r) { for (let t = 0; t < 60; t++) { const p = r.int(-4, 3), q = r.int(-3, 5), s = r.pick([1, 1, -1]), d = r.int(-6, 6); if (q > p && (p + q) % 2 === 0) return { p, q, s, d }; } return { p: -1, q: 3, s: 1, d: 2 }; },
      solve: (p) => (p.s > 0 ? { xmax: p.p, xmin: p.q } : { xmax: p.q, xmin: p.p }),
      fields: () => [fld("xmax", "x_max", "x of the local maximum", "x للقيمة العظمى المحلية"), fld("xmin", "x_min", "x of the local minimum", "x للقيمة الصغرى المحلية")],
      coef: (p) => [p.s, (-3 * p.s * (p.p + p.q)) / 2, 3 * p.s * p.p * p.q, p.d],
      text(p, lang) { return tr(lang, `f(x) = ${poly(this.coef(p))}. Find the x-values of the local maximum and the local minimum.`, `لتكن f(x) = ${poly(this.coef(p))}. أوجد قيم x للنهاية العظمى المحلية والنهاية الصغرى المحلية.`); },
      steps(p, lang) {
        const c = this.coef(p), f1 = [3 * c[0], 2 * c[1], c[2]], { xmax, xmin } = this.solve(p);
        const f2 = (x) => 6 * c[0] * x + 2 * c[1];
        return [`f′(x) = ${poly(f1)} = ${p.s < 0 ? "−" : ""}3(${poly([1, -p.p])})(${poly([1, -p.q])})`,
          tr(lang, `Critical points (f′ = 0): x = ${num(p.p)} and x = ${num(p.q)}`, `النقاط الحرجة (f′ = 0): x = ${num(p.p)} و x = ${num(p.q)}`),
          tr(lang, `Second-derivative test: f″(x) = ${poly([6 * c[0], 2 * c[1]])}; f″(${num(xmax)}) = ${num(f2(xmax))} < 0 → maximum; f″(${num(xmin)}) = ${num(f2(xmin))} > 0 → minimum`, `اختبار المشتقة الثانية: f″(x) = ${poly([6 * c[0], 2 * c[1]])}؛ f″(${num(xmax)}) = ${num(f2(xmax))} < 0 ← عظمى؛ f″(${num(xmin)}) = ${num(f2(xmin))} > 0 ← صغرى`)];
      },
      mis: (p) => { const { xmax, xmin } = p.s > 0 ? { xmax: p.p, xmin: p.q } : { xmax: p.q, xmin: p.p }; const n = note("Swapped: f″ < 0 means the curve bends down — a MAXIMUM; f″ > 0 is a minimum.", "تبادل: f″ < 0 يعني أن المنحني مقعر للأسفل — نهاية عظمى؛ و f″ > 0 نهاية صغرى."); return { xmax: [["swapped", xmin, n]], xmin: [["swapped", xmax, n]] }; },
    });

    /* ---------- 10. asymptotes of (ax + b)/(cx + d) ---------- */
    PR.register({
      id: "calc.asymptotes", v: 1, obj: "calc.deriv.graph", lesson: L_APP, subject: SUBJ, program: "arch", lvl: 1,
      gen(r) { for (let t = 0; t < 60; t++) { const a = r.int(-6, 6), b = r.int(-8, 8), c = r.pick([-3, -2, -1, 1, 2, 3, 4]), d = r.int(-8, 8); if (a && d && a * d - b * c !== 0) return { a, b, c, d }; } return { a: 2, b: 1, c: 1, d: -3 }; },
      solve: (p) => ({ xv: -p.d / p.c, yh: p.a / p.c }),
      fields: () => [fld("xv", "x =", "Vertical asymptote x = …", "المحاذي العمودي x = …"), fld("yh", "y =", "Horizontal asymptote y = …", "المحاذي الأفقي y = …")],
      text: (p, lang) => tr(lang, `f(x) = (${lin(p.a, p.b)}) / (${lin(p.c, p.d)}). Find the vertical and horizontal asymptotes.`, `لتكن f(x) = (${lin(p.a, p.b)}) / (${lin(p.c, p.d)}). أوجد المحاذي العمودي والمحاذي الأفقي.`),
      steps: (p, lang) => [tr(lang, `Vertical: the denominator is zero (and the numerator is not): ${lin(p.c, p.d)} = 0 → x = ${qs(Q(-p.d, p.c))}`, `العمودي: حيث المقام صفر (والبسط ليس صفرًا): ${lin(p.c, p.d)} = 0 ← x = ${qs(Q(-p.d, p.c))}`),
        tr(lang, `Horizontal: same degree top and bottom, so y = ratio of the leading coefficients = ${p.a}/${p.c} = ${qs(Q(p.a, p.c))}`, `الأفقي: الدرجة نفسها في البسط والمقام، إذن y = نسبة المعاملين الأعليين = ${p.a}/${p.c} = ${qs(Q(p.a, p.c))}`)],
      mis: (p) => ({ xv: [["vSign", p.d / p.c, note("Solve cx + d = 0: x = −d/c (mind the sign).", "حل cx + d = 0: x = −d/c (انتبه للإشارة).")]], yh: [["constRatio", p.b / p.d, note("At infinity the leading coefficients decide: y = a/c, not the constants b/d.", "عند اللانهاية تحسم المعاملات العليا: y = a/c وليس الثوابت b/d.")]] }),
    });

    /* ---------- 11. optimization ---------- */
    PR.register({
      id: "calc.optimize", v: 1, obj: "calc.deriv.optim", lesson: L_APP, subject: SUBJ, program: "arch", lvl: 2,
      gen(r) { const kind = r.pick(["court", "box"]); return kind === "court" ? { kind, L: 4 * r.int(8, 40) } : { kind, a: 6 * r.int(2, 10) }; },
      solve: (p) => (p.kind === "court" ? { x: p.L / 4, A: (p.L * p.L) / 8 } : { x: p.a / 6, A: (2 * p.a ** 3) / 27 }),
      fields: (p) => p.kind === "court" ? [fld("x", "x", "Depth x of the courtyard (m, the two sides perpendicular to the wall)", "عمق الفناء x (م، الضلعان العموديان على الجدار)"), fld("A", "A", "Largest area (m²)", "أكبر مساحة (م²)")] : [fld("x", "x", "Side x of the corner squares (cm)", "ضلع المربعات المقطوعة x (سم)"), fld("A", "V", "Largest volume (cm³)", "أكبر حجم (سم³)")],
      text(p, lang) {
        if (p.kind === "court") return tr(lang, `A rectangular courtyard is built against a long building wall, so only three sides need a fence. There are ${p.L} m of fence. Find the depth x that gives the largest area, and that area.`, `يُنشأ فناء مستطيل ملاصق لجدار مبنى طويل، فلا يحتاج السياج إلا لثلاثة أضلاع. طول السياج المتوفر ${p.L} م. أوجد العمق x الذي يعطي أكبر مساحة، وقيمة هذه المساحة.`);
        return tr(lang, `An open box for a site model is made from a square card of side ${p.a} cm by cutting equal squares of side x from the corners and folding up the sides. Find x for the largest volume, and that volume.`, `يُصنع صندوق مفتوح لمجسم موقع من ورق مقوى مربع طول ضلعه ${p.a} سم بقطع مربعات متساوية ضلعها x من الأركان وثني الجوانب. أوجد x التي تعطي أكبر حجم، وقيمة هذا الحجم.`);
      },
      steps(p, lang) {
        if (p.kind === "court") { const L = p.L; return [tr(lang, `Sides: x, x (perpendicular to the wall) and ${L} − 2x (parallel). A(x) = x(${L} − 2x) = ${L}x − 2x²`, `الأضلاع: x و x (عموديان على الجدار) و ${L} − 2x (موازٍ له). A(x) = x(${L} − 2x) = ${L}x − 2x²`), `A′(x) = ${L} − 4x = 0 → x = ${L / 4}`, tr(lang, `A″ = −4 < 0 → maximum. A = ${L / 4}·${L / 2} = ${(L * L) / 8}`, `A″ = −4 < 0 ← عظمى. A = ${L / 4}·${L / 2} = ${(L * L) / 8}`)]; }
        const a = p.a, x = a / 6;
        return [`V(x) = x(${a} − 2x)²`, tr(lang, `V′(x) = (${a} − 2x)² − 4x(${a} − 2x) = (${a} − 2x)(${a} − 6x) = 0 → x = ${a / 2} (no box) or x = ${x}`, `V′(x) = (${a} − 2x)² − 4x(${a} − 2x) = (${a} − 2x)(${a} − 6x) = 0 ← x = ${a / 2} (لا صندوق) أو x = ${x}`), tr(lang, `V = ${x}·(${a - 2 * x})² = ${(2 * a ** 3) / 27}`, `V = ${x}·(${a - 2 * x})² = ${(2 * a ** 3) / 27}`)];
      },
      mis(p) {
        if (p.kind === "court") return { x: [["third", p.L / 3, note("The three sides are not equal at the optimum: maximise A(x) = x(L − 2x) with A′ = 0.", "الأضلاع الثلاثة ليست متساوية عند الأمثل: عظّم A(x) = x(L − 2x) بجعل A′ = 0.")]], A: [["fourSides", (p.L * p.L) / 16, note("That is the square with fence on four sides; here the wall is the fourth side.", "هذا مربع مسيّج من أربع جهات؛ هنا الجدار هو الضلع الرابع.")]] };
        return { x: [["quarter", p.a / 4, note("Set V′(x) = 0 and solve; x = a/4 is a guess, not the stationary point.", "اجعل V′(x) = 0 وحل؛ x = a/4 تخمين وليست نقطة حرجة.")]], A: [["quarterV", p.a ** 3 / 16, note("This volume uses x = a/4; the maximum is at x = a/6.", "هذا الحجم عند x = a/4؛ أما الأعظم فعند x = a/6.")]] };
      },
    });
  } catch (e) { (S5.COLLEGE_ERRORS = S5.COLLEGE_ERRORS || []).push("22-gens-deriv: " + (e && e.message)); console.error(e); }
})();
