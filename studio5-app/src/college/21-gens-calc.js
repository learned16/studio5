/* Principles of Calculus (TECK 102, Architecture Year 1) — weeks 1–10 of the official syllabus (docs/SYLLABUS_ARCH_Y1.md):
   matrices (operations, determinants, inverse, linear systems), lines, circles, limits (algebraic, trigonometric, at
   infinity) and continuity. Every key comes from exact integer/rational arithmetic in the solver; named mistakes
   (mis → code 'mis' with an explanation) are the wrong answers students really produce. Text and steps are bilingual. */
(() => {
  try {
    const PR = S5.prob, SUBJ = "Principles of Calculus", NONE = [""];
    const tr = (lang, en, ar) => (lang === "ar" ? ar : en);
    const lab = (en, ar) => ({ en, ar });
    const note = (en, ar) => ({ en, ar });
    /* exact rationals: [num, den] with den > 0 */
    const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
    const Q = (n, d = 1) => { if (d < 0) { n = -n; d = -d; } const g = gcd(n, d); return [n / g, d / g]; };
    const qs = (q) => (q[1] === 1 ? String(q[0]) : `${q[0]}/${q[1]}`).replace(/^-/, "−");
    const qv = (q) => q[0] / q[1];
    const num = (x) => String(x).replace(/^-/, "−");
    const par = (x) => (x < 0 ? `(${num(x)})` : num(x));
    const fld = (k, sym, en, ar, extra = {}) => ({ k, sym, dim: "none", units: NONE, unit: "", tol: "exact", label: lab(en, ar), ...extra });
    // polynomial text, highest power first: [c2, c1, c0] → "3x² − 2x + 5"
    const poly = (cs, v = "x") => {
      const deg = cs.length - 1, sup = ["", "", "²", "³", "⁴"]; let s = "";
      cs.forEach((c, i) => { const p = deg - i; if (!c) return; const a = Math.abs(c), sign = c < 0 ? (s ? " − " : "−") : s ? " + " : "";
        s += sign + (p === 0 ? String(a) : (a === 1 ? "" : String(a)) + v + sup[p]); });
      return s || "0";
    };
    /* matrices as SVG (language-neutral) */
    const mat = (M, x, y, name) => {
      const r = M.length, c = M[0].length, cw = 30, rh = 22, w = c * cw, h = r * rh;
      const br = (bx, dir) => `<path d="M${bx + 6 * dir} ${y} h${-6 * dir} v${h} h${6 * dir}" fill="none" stroke="currentColor" stroke-width="1.5"/>`;
      let s = `<text x="${x - 8}" y="${y + h / 2 + 4}" font-size="14" text-anchor="end" fill="currentColor" font-family="IBM Plex Mono, monospace">${name} =</text>` + br(x, 1) + br(x + w, -1);
      M.forEach((row, i) => row.forEach((v, j) => { s += `<text x="${x + j * cw + cw / 2}" y="${y + i * rh + 16}" font-size="14" text-anchor="middle" fill="currentColor" font-family="IBM Plex Mono, monospace">${num(v)}</text>`; }));
      return { s, w };
    };
    const svgMats = (list) => {
      let x = 40, s = ""; const H = Math.max(...list.map(([M]) => M.length)) * 22 + 10;
      for (const [M, name] of list) { const m = mat(M, x, 5, name); s += m.s; x += m.w + 70; }
      return `<svg viewBox="0 0 ${x} ${H}" width="100%" style="max-width:${Math.round(x * 1.4)}px" role="img" direction="ltr">${s}</svg>`;
    };
    const mtxt = (M) => "[" + M.map((r) => r.map(num).join("  ")).join(" ; ") + "]";
    const det2 = (m) => m[0][0] * m[1][1] - m[0][1] * m[1][0];
    const det3 = (m) => m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
    const randM = (r, rows, cols, lo = -4, hi = 5) => Array.from({ length: rows }, () => Array.from({ length: cols }, () => r.int(lo, hi)));
    const mul = (A, B) => A.map((row) => B[0].map((_, j) => row.reduce((s, a, k) => s + a * B[k][j], 0)));
    const LESSON_MAT = "a1b-calc-08", LESSON_FN = "a1b-calc-01", LESSON_LIM = "a1b-calc-02";

    /* ---------- objectives (weeks of the official syllabus) ---------- */
    PR.obj({ id: "calc.matrix.ops", en: "Matrix operations: sum, scalar multiple and product (week 1)", ar: "عمليات المصفوفات: الجمع والضرب بعدد وضرب مصفوفتين (الأسبوع 1)", subjects: [SUBJ], program: "arch", lessons: [LESSON_MAT] });
    PR.obj({ id: "calc.matrix.det", en: "Determinants of 2×2 and 3×3 matrices (week 2)", ar: "محددات المصفوفات 2×2 و3×3 (الأسبوع 2)", subjects: [SUBJ], program: "arch", lessons: [LESSON_MAT] });
    PR.obj({ id: "calc.matrix.inverse", en: "The adjoint and the inverse of a matrix (week 2)", ar: "المرافق ومعكوس المصفوفة (الأسبوع 2)", subjects: [SUBJ], program: "arch", lessons: [LESSON_MAT] });
    PR.obj({ id: "calc.matrix.systems", en: "Solving linear systems with matrices — Cramer's rule (week 3)", ar: "حل أنظمة المعادلات الخطية بالمصفوفات — قاعدة كرامر (الأسبوع 3)", subjects: [SUBJ], program: "arch", lessons: [LESSON_MAT] });
    PR.obj({ id: "calc.lines", en: "Slope and equation of a line (week 5)", ar: "الميل ومعادلة المستقيم (الأسبوع 5)", subjects: [SUBJ], program: "arch", lessons: [LESSON_FN] });
    PR.obj({ id: "calc.circles", en: "Circles: centre and radius from the general equation (week 6)", ar: "الدائرة: المركز ونصف القطر من المعادلة العامة (الأسبوع 6)", subjects: [SUBJ], program: "arch", lessons: [LESSON_FN] });
    PR.obj({ id: "calc.limits", en: "Limits: factor and cancel, trigonometric limits, limits at infinity (weeks 7–10)", ar: "الغايات: التحليل والاختصار، الغايات المثلثية، الغايات عند اللانهاية (الأسابيع 7–10)", subjects: [SUBJ], program: "arch", lessons: [LESSON_LIM] });
    PR.obj({ id: "calc.continuity", en: "Continuity of piecewise functions (week 10)", ar: "اتصال الدوال المجزأة (الأسبوع 10)", subjects: [SUBJ], program: "arch", lessons: [LESSON_LIM] });

    /* ---------- 1. product of two matrices ---------- */
    PR.register({
      id: "calc.matProduct", v: 1, obj: "calc.matrix.ops", lesson: LESSON_MAT, subject: SUBJ, program: "arch", lvl: 1,
      gen(r) {
        const n = r.pick([2, 2, 3]);
        for (let t = 0; t < 40; t++) { const A = randM(r, 2, n, -3, 5), B = randM(r, n, 2, -3, 5), C = mul(A, B); if (C.flat().every((x) => x !== 0) && (n === 3 || JSON.stringify(mul(B, A)) !== JSON.stringify(C))) return { A, B }; }
        return { A: [[1, 2], [3, 4]], B: [[2, 0], [1, 3]] };
      },
      solve(p) { const C = mul(p.A, p.B); return { c11: C[0][0], c12: C[0][1], c21: C[1][0], c22: C[1][1] }; },
      fields: () => [["c11", "1", "1"], ["c12", "1", "2"], ["c21", "2", "1"], ["c22", "2", "2"]].map(([k, i, j]) => fld(k, `c${i}${j}`, `Entry (${i},${j}) of C = AB`, `العنصر (${i},${j}) من C = AB`)),
      text: (p, lang) => tr(lang, `A = ${mtxt(p.A)} and B = ${mtxt(p.B)} (rows separated by “;”). Find C = AB.`, `لتكن A = ${mtxt(p.A)} و B = ${mtxt(p.B)} (الصفوف مفصولة بـ «;»). أوجد C = AB.`),
      steps(p, lang) {
        const C = mul(p.A, p.B), n = p.B.length, out = [tr(lang, `A is 2×${n} and B is ${n}×2, so AB is 2×2: entry (i,j) = row i of A · column j of B.`, `A بحجم 2×${n} و B بحجم ${n}×2، فالناتج AB بحجم 2×2: العنصر (i,j) = الصف i من A · العمود j من B.`)];
        for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) out.push(`c${i + 1}${j + 1} = ${p.A[i].map((a, k) => `${par(a)}·${par(p.B[k][j])}`).join(" + ")} = ${num(C[i][j])}`);
        return out;
      },
      mis(p) {
        const out = { c11: [], c12: [], c21: [], c22: [] };
        if (p.B.length === 2) { const BA = mul(p.B, p.A), E = p.A.map((row, i) => row.map((a, j) => a * p.B[i][j]));
          for (const [k, i, j] of [["c11", 0, 0], ["c12", 0, 1], ["c21", 1, 0], ["c22", 1, 1]]) {
            out[k].push(["order", BA[i][j], note("You computed B·A instead of A·B — matrix multiplication is not commutative.", "حسبت B·A بدل A·B — ضرب المصفوفات ليس إبداليًا.")]);
            out[k].push(["elementwise", E[i][j], note("You multiplied entry by entry; multiply row i of A by column j of B and add.", "ضربت عنصرًا بعنصر؛ اضرب الصف i من A في العمود j من B واجمع.")]);
          } }
        return out;
      },
      svg: (p) => svgMats([[p.A, "A"], [p.B, "B"]]),
    });

    /* ---------- 2. determinant 2×2 and 3×3 ---------- */
    PR.register({
      id: "calc.det2", v: 1, obj: "calc.matrix.det", lesson: LESSON_MAT, subject: SUBJ, program: "arch", lvl: 1,
      gen(r) { for (let t = 0; t < 40; t++) { const A = randM(r, 2, 2, -6, 9); const d = det2(A); if (d && A[0][0] * A[1][1] && A[0][1] * A[1][0] && A[0][0] * A[1][1] + A[0][1] * A[1][0] !== d) return { A }; } return { A: [[3, 2], [1, 4]] }; },
      solve: (p) => ({ D: det2(p.A) }),
      fields: () => [fld("D", "det A", "The determinant |A|", "المحدد |A|")],
      text: (p, lang) => tr(lang, `Find the determinant of A = ${mtxt(p.A)}.`, `أوجد محدد المصفوفة A = ${mtxt(p.A)}.`),
      steps: (p, lang) => { const A = p.A; return [tr(lang, "|A| = a·d − b·c (main diagonal minus the other diagonal)", "|A| = a·d − b·c (القطر الرئيسي ناقص القطر الآخر)"), `|A| = ${par(A[0][0])}·${par(A[1][1])} − ${par(A[0][1])}·${par(A[1][0])} = ${num(A[0][0] * A[1][1])} − ${par(A[0][1] * A[1][0])} = ${num(det2(A))}`]; },
      mis: (p) => ({ D: [["plus", p.A[0][0] * p.A[1][1] + p.A[0][1] * p.A[1][0], note("You added the two diagonal products; the determinant is a·d MINUS b·c.", "جمعت حاصلي ضرب القطرين؛ المحدد هو a·d ناقص b·c.")]] }),
      svg: (p) => svgMats([[p.A, "A"]]),
    });
    PR.register({
      id: "calc.det3", v: 1, obj: "calc.matrix.det", lesson: LESSON_MAT, subject: SUBJ, program: "arch", lvl: 2,
      gen(r) {
        for (let t = 0; t < 60; t++) { const A = randM(r, 3, 3, -3, 5), d = det3(A), m = A[0][1] * (A[1][0] * A[2][2] - A[1][2] * A[2][0]);
          if (d && Math.abs(d) <= 150 && m !== 0) return { A }; }
        return { A: [[2, 1, 3], [0, -1, 4], [1, 2, 1]] };
      },
      solve: (p) => ({ D: det3(p.A) }),
      fields: () => [fld("D", "det A", "The determinant |A|", "المحدد |A|")],
      text: (p, lang) => tr(lang, `Find the determinant of the 3×3 matrix A = ${mtxt(p.A)} by cofactor expansion along the first row.`, `أوجد محدد المصفوفة 3×3: A = ${mtxt(p.A)} بالتوسيع على عناصر الصف الأول (المعاملات المرافقة).`),
      steps(p, lang) {
        const A = p.A, M1 = A[1][1] * A[2][2] - A[1][2] * A[2][1], M2 = A[1][0] * A[2][2] - A[1][2] * A[2][0], M3 = A[1][0] * A[2][1] - A[1][1] * A[2][0];
        return [
          tr(lang, "Signs of the first row: + − +. |A| = a11·M11 − a12·M12 + a13·M13 (Mij = 2×2 minor after deleting row i and column j).", "إشارات الصف الأول: + − +. |A| = a11·M11 − a12·M12 + a13·M13 (Mij = محدد 2×2 بعد حذف الصف i والعمود j)."),
          `M11 = ${par(A[1][1])}·${par(A[2][2])} − ${par(A[1][2])}·${par(A[2][1])} = ${num(M1)}`,
          `M12 = ${par(A[1][0])}·${par(A[2][2])} − ${par(A[1][2])}·${par(A[2][0])} = ${num(M2)}`,
          `M13 = ${par(A[1][0])}·${par(A[2][1])} − ${par(A[1][1])}·${par(A[2][0])} = ${num(M3)}`,
          `|A| = ${par(A[0][0])}·${par(M1)} − ${par(A[0][1])}·${par(M2)} + ${par(A[0][2])}·${par(M3)} = ${num(det3(A))}`,
        ];
      },
      mis(p) {
        const A = p.A, M1 = A[1][1] * A[2][2] - A[1][2] * A[2][1], M2 = A[1][0] * A[2][2] - A[1][2] * A[2][0], M3 = A[1][0] * A[2][1] - A[1][1] * A[2][0];
        return { D: [["cofsign", A[0][0] * M1 + A[0][1] * M2 + A[0][2] * M3, note("The middle term needs a minus sign: the cofactor signs along a row are + − +.", "الحد الأوسط يحتاج إشارة سالبة: إشارات المعاملات المرافقة على الصف هي + − +.")]] };
      },
      svg: (p) => svgMats([[p.A, "A"]]),
    });

    /* ---------- 3. inverse of a 2×2 matrix ---------- */
    PR.register({
      id: "calc.inverse2", v: 1, obj: "calc.matrix.inverse", lesson: LESSON_MAT, subject: SUBJ, program: "arch", lvl: 2,
      gen(r) { for (let t = 0; t < 60; t++) { const A = randM(r, 2, 2, -5, 7); const d = det2(A); if (d && Math.abs(d) <= 12 && Math.abs(d) !== 1 && A.flat().every((x) => x !== 0)) return { A }; } return { A: [[4, 3], [1, 2]] }; },
      solve(p) { const [[a, b], [c, d]] = p.A, D = det2(p.A); return { i11: d / D, i12: -b / D, i21: -c / D, i22: a / D, D }; },
      fields: () => [["i11", "1", "1"], ["i12", "1", "2"], ["i21", "2", "1"], ["i22", "2", "2"]].map(([k, i, j]) => fld(k, `(A⁻¹)${i}${j}`, `Entry (${i},${j}) of A⁻¹ (a fraction like −3/5 is fine)`, `العنصر (${i},${j}) من A⁻¹ (يمكنك كتابة كسر مثل ‎−3/5)`)),
      text: (p, lang) => tr(lang, `Find the inverse A⁻¹ of A = ${mtxt(p.A)} using the adjoint.`, `أوجد معكوس المصفوفة A = ${mtxt(p.A)} باستخدام المرافق (adj A).`),
      steps(p, lang) {
        const [[a, b], [c, d]] = p.A, D = det2(p.A);
        return [
          `|A| = ${par(a)}·${par(d)} − ${par(b)}·${par(c)} = ${num(D)} ${tr(lang, "(≠ 0, so A has an inverse)", "(≠ 0 إذن للمصفوفة معكوس)")}`,
          tr(lang, `adj A: swap the main diagonal and change the signs of the other two → [${num(d)}  ${num(-b)} ; ${num(-c)}  ${num(a)}]`, `adj A: نبدّل عنصري القطر الرئيسي ونغيّر إشارة العنصرين الآخرين ← [${num(d)}  ${num(-b)} ; ${num(-c)}  ${num(a)}]`),
          `A⁻¹ = (1/|A|)·adj A = (1/${par(D)})·[${num(d)}  ${num(-b)} ; ${num(-c)}  ${num(a)}] = [${qs(Q(d, D))}  ${qs(Q(-b, D))} ; ${qs(Q(-c, D))}  ${qs(Q(a, D))}]`,
          tr(lang, "Check: A·A⁻¹ = I.", "تحقق: A·A⁻¹ = I."),
        ];
      },
      mis(p) {
        const [[a, b], [c, d]] = p.A, D = det2(p.A), n1 = note("You used adj A without dividing by |A|: A⁻¹ = (1/|A|)·adj A.", "استعملت adj A دون القسمة على |A|: A⁻¹ = (1/|A|)·adj A."), n2 = note("Swap the main diagonal AND change the signs of the other two entries.", "بدّل عنصري القطر الرئيسي وغيّر إشارة العنصرين الآخرين أيضًا.");
        return { i11: [["noDiv", d, n1]], i12: [["noDiv", -b, n1], ["noSignChange", b / D, n2]], i21: [["noDiv", -c, n1], ["noSignChange", c / D, n2]], i22: [["noDiv", a, n1]] };
      },
      svg: (p) => svgMats([[p.A, "A"]]),
    });

    /* ---------- 4. Cramer's rule, 2 or 3 unknowns, integer solution ---------- */
    PR.register({
      id: "calc.cramer", v: 1, obj: "calc.matrix.systems", lesson: LESSON_MAT, subject: SUBJ, program: "arch", lvl: 2,
      gen(r) {
        const n = r.pick([2, 2, 3]);
        for (let t = 0; t < 80; t++) {
          const A = randM(r, n, n, -4, 5), x = Array.from({ length: n }, () => r.int(-5, 6)), d = n === 2 ? det2(A) : det3(A);
          if (!d || Math.abs(d) > 60 || x.some((v) => v === 0) || new Set(x).size < n) continue;
          return { A, b: A.map((row) => row.reduce((s, a, k) => s + a * x[k], 0)) };
        }
        return { A: [[2, 1], [1, -3]], b: [5, -8] };
      },
      solve(p) {
        const n = p.A.length, det = n === 2 ? det2 : det3, D = det(p.A), out = { D };
        ["x", "y", "z"].slice(0, n).forEach((k, j) => { const Aj = p.A.map((row, i) => row.map((a, c) => (c === j ? p.b[i] : a))); out["D" + k] = det(Aj); out[k] = out["D" + k] / D; });
        return out;
      },
      fields: (p) => ["x", "y", "z"].slice(0, p.A.length).map((k) => fld(k, k, `The value of ${k}`, `قيمة ${k}`)),
      text(p, lang) {
        const v = ["x", "y", "z"].slice(0, p.A.length), eq = p.A.map((row, i) => row.map((a, j) => (a === 0 ? "" : `${a < 0 ? "−" : j ? "+" : ""}${Math.abs(a) === 1 ? "" : Math.abs(a)}${v[j]}`)).filter(Boolean).join(" ").replace(/^\+/, "") + ` = ${num(p.b[i])}`).join(tr(lang, ";  ", "؛  "));
        return tr(lang, `Solve the system by Cramer's rule: ${eq}.`, `حل النظام بقاعدة كرامر: ${eq}.`);
      },
      steps(p, lang) {
        const s = this.solve(p), v = ["x", "y", "z"].slice(0, p.A.length);
        return [
          tr(lang, `Δ = |A| = ${num(s.D)} (≠ 0, so there is one solution)`, `Δ = |A| = ${num(s.D)} (≠ 0 إذن للنظام حل وحيد)`),
          ...v.map((k) => tr(lang, `Δ${k}: replace the ${k}-column of A with the constants → Δ${k} = ${num(s["D" + k])}`, `Δ${k}: نضع عمود الثوابت مكان عمود ${k} ← Δ${k} = ${num(s["D" + k])}`)),
          ...v.map((k) => `${k} = Δ${k}/Δ = ${num(s["D" + k])}/${par(s.D)} = ${num(s[k])}`),
          tr(lang, "Check by substituting into every equation.", "تحقق بالتعويض في كل معادلة."),
        ];
      },
      mis(p) {
        const s = this.solve(p), out = {};
        for (const k of ["x", "y", "z"].slice(0, p.A.length)) out[k] = s["D" + k] ? [["inverted", s.D / s["D" + k], note(`Upside down: ${k} = Δ${k}/Δ, not Δ/Δ${k}.`, `مقلوبة: ${k} = Δ${k}/Δ وليس Δ/Δ${k}.`)]] : [];
        return out;
      },
      svg: (p) => svgMats([[p.A, "A"], [p.b.map((x) => [x]), "b"]]),
    });

    /* ---------- 5. slope and intercept of the line through two points ---------- */
    PR.register({
      id: "calc.line2pts", v: 1, obj: "calc.lines", lesson: LESSON_FN, subject: SUBJ, program: "arch", lvl: 1,
      gen(r) { for (let t = 0; t < 60; t++) { const x1 = r.int(-6, 6), y1 = r.int(-6, 6), x2 = r.int(-6, 6), y2 = r.int(-6, 6); if (x1 === x2 || y1 === y2) continue; const m = Q(y2 - y1, x2 - x1), b = qv(Q(y1 * (x2 - x1) - x1 * (y2 - y1), x2 - x1)); if (b !== 0 && Math.abs(qv(m)) !== 1) return { x1, y1, x2, y2 }; } return { x1: 1, y1: 2, x2: 4, y2: 8 }; },
      solve(p) { const dx = p.x2 - p.x1, dy = p.y2 - p.y1; return { m: dy / dx, b: (p.y1 * dx - p.x1 * dy) / dx }; },
      fields: () => [fld("m", "m", "Slope m", "الميل m"), fld("b", "b", "y-intercept b (in y = mx + b)", "المقطع الصادي b (في y = mx + b)")],
      text: (p, lang) => tr(lang, `Find the equation y = mx + b of the line through P1(${num(p.x1)}, ${num(p.y1)}) and P2(${num(p.x2)}, ${num(p.y2)}).`, `أوجد معادلة المستقيم y = mx + b المار بالنقطتين P1(${num(p.x1)}, ${num(p.y1)}) و P2(${num(p.x2)}, ${num(p.y2)}).`),
      steps(p, lang) {
        const dx = p.x2 - p.x1, dy = p.y2 - p.y1, m = Q(dy, dx), b = Q(p.y1 * dx - p.x1 * dy, dx);
        return [`m = (y2 − y1)/(x2 − x1) = (${num(p.y2)} − ${par(p.y1)})/(${num(p.x2)} − ${par(p.x1)}) = ${num(dy)}/${par(dx)} = ${qs(m)}`,
          `b = y1 − m·x1 = ${num(p.y1)} − (${qs(m)})·${par(p.x1)} = ${qs(b)}`,
          `y = ${qs(m)}x ${qv(b) < 0 ? "−" : "+"} ${qs([Math.abs(b[0]), b[1]])}`];
      },
      mis(p) {
        const dx = p.x2 - p.x1, dy = p.y2 - p.y1, m = dy / dx;
        return { m: [["inverted", dx / dy, note("You divided Δx by Δy; the slope is rise over run: m = Δy/Δx.", "قسمت Δx على Δy؛ الميل هو التغير الرأسي على التغير الأفقي: m = Δy/Δx.")]],
          b: [["bSign", p.y1 + m * p.x1, note("b = y1 − m·x1 (from y1 = m·x1 + b); you added m·x1.", "b = y1 − m·x1 (من y1 = m·x1 + b)؛ أنت جمعت m·x1.")]] };
      },
    });

    /* ---------- 6. centre and radius of a circle ---------- */
    PR.register({
      id: "calc.circle", v: 1, obj: "calc.circles", lesson: LESSON_FN, subject: SUBJ, program: "arch", lvl: 1,
      gen(r) { for (let t = 0; t < 40; t++) { const h = r.int(-6, 6), k = r.int(-6, 6), R = r.int(2, 9); if (h && k && Math.abs(h) !== Math.abs(k) && R * R !== h * h + k * k) return { h, k, R }; } return { h: 2, k: -3, R: 4 }; },
      solve: (p) => ({ h: p.h, k: p.k, r: p.R }),
      fields: () => [fld("h", "h", "x-coordinate of the centre", "الإحداثي x للمركز"), fld("k", "k", "y-coordinate of the centre", "الإحداثي y للمركز"), fld("r", "r", "Radius r", "نصف القطر r")],
      text(p, lang) { const D = -2 * p.h, E = -2 * p.k, F = p.h * p.h + p.k * p.k - p.R * p.R, eq = `x² + y²${D ? (D < 0 ? " − " : " + ") + Math.abs(D) + "x" : ""}${E ? (E < 0 ? " − " : " + ") + Math.abs(E) + "y" : ""}${F ? (F < 0 ? " − " : " + ") + Math.abs(F) : ""} = 0`;
        return tr(lang, `Find the centre (h, k) and the radius r of the circle ${eq}.`, `أوجد المركز (h, k) ونصف القطر r للدائرة ${eq}.`); },
      steps(p, lang) { const D = -2 * p.h, E = -2 * p.k, F = p.h * p.h + p.k * p.k - p.R * p.R;
        return [tr(lang, "Complete the squares: (x − h)² + (y − k)² = r², with h = −D/2, k = −E/2 for x² + y² + Dx + Ey + F = 0.", "أكمل المربع: (x − h)² + (y − k)² = r²، حيث h = −D/2 و k = −E/2 للمعادلة x² + y² + Dx + Ey + F = 0."),
          `D = ${num(D)}, E = ${num(E)}, F = ${num(F)} → h = ${num(p.h)}, k = ${num(p.k)}`,
          `r² = h² + k² − F = ${par(p.h)}² + ${par(p.k)}² − ${par(F)} = ${p.R * p.R} → r = ${p.R}`]; },
      mis: (p) => ({ h: [["centreSign", -p.h, note("The centre is (−D/2, −E/2): the sign flips when you complete the square.", "المركز هو (−D/2, −E/2): تنقلب الإشارة عند إكمال المربع.")]],
        k: [["centreSign", -p.k, note("The centre is (−D/2, −E/2): the sign flips when you complete the square.", "المركز هو (−D/2, −E/2): تنقلب الإشارة عند إكمال المربع.")]],
        r: [["rSquared", p.R * p.R, note("That is r²; take the square root for r.", "هذه قيمة r²؛ خذ الجذر التربيعي لتحصل على r.")]] }),
    });

    /* ---------- 7. limits: 0/0 by factoring ---------- */
    PR.register({
      id: "calc.limitFactor", v: 1, obj: "calc.limits", lesson: LESSON_LIM, subject: SUBJ, program: "arch", lvl: 1,
      gen(r) {
        for (let t = 0; t < 80; t++) {
          const a = r.int(-5, 5), p = r.pick([1, 1, 2, 3]), q = r.int(-6, 6), s = r.pick([0, 0, 1, 1, 2]), tt = s === 0 ? 1 : r.int(-6, 6);
          const N = p * a + q, Dn = s * a + tt;
          if (!a || !N || !Dn || p * a + q === 0 || (s && s * a + tt === 0)) continue;
          if (s && s * q === tt * p) continue; // (sx + t) ∝ (px + q) would cancel a second time
          return { a, p, q, s, t: tt };
        }
        return { a: 2, p: 1, q: 2, s: 0, t: 1 };
      },
      solve: (p) => ({ L: (p.p * p.a + p.q) / (p.s * p.a + p.t) }),
      fields: () => [fld("L", "L", "The value of the limit", "قيمة الغاية")],
      text(p, lang) {
        const num2 = poly([p.p, p.q - p.p * p.a, -p.q * p.a]), den = p.s === 0 ? poly([1, -p.a]) : poly([p.s, p.t - p.s * p.a, -p.t * p.a]);
        return tr(lang, `Find lim x→${num(p.a)} of (${num2}) / (${den}).`, `أوجد lim عندما x→${num(p.a)} للدالة (${num2}) / (${den}).`);
      },
      steps(p, lang) {
        const f1 = poly([p.p, p.q]), f2 = p.s === 0 ? "1" : poly([p.s, p.t]), L = Q(p.p * p.a + p.q, p.s * p.a + p.t);
        return [tr(lang, `Direct substitution x = ${num(p.a)} gives 0/0 — indeterminate, so factor.`, `التعويض المباشر x = ${num(p.a)} يعطي 0/0 — صيغة غير محددة، إذن نحلّل.`),
          tr(lang, `Numerator = (${poly([1, -p.a])})(${f1}); denominator = (${poly([1, -p.a])})(${f2})`, `البسط = (${poly([1, -p.a])})(${f1})؛ المقام = (${poly([1, -p.a])})(${f2})`),
          tr(lang, `Cancel (${poly([1, -p.a])}) and substitute: (${p.p}·${par(p.a)} ${p.q < 0 ? "−" : "+"} ${Math.abs(p.q)}) / (${p.s === 0 ? "1" : `${p.s}·${par(p.a)} ${p.t < 0 ? "−" : "+"} ${Math.abs(p.t)}`}) = ${qs(L)}`, `نختصر (${poly([1, -p.a])}) ونعوّض: (${p.p}·${par(p.a)} ${p.q < 0 ? "−" : "+"} ${Math.abs(p.q)}) / (${p.s === 0 ? "1" : `${p.s}·${par(p.a)} ${p.t < 0 ? "−" : "+"} ${Math.abs(p.t)}`}) = ${qs(L)}`)];
      },
      mis: () => ({ L: [["zero", 0, note("0/0 is not 0 — it is indeterminate. Factor, cancel the common factor (x − a), then substitute.", "0/0 ليست صفرًا — إنها صيغة غير محددة. حلّل واختصر العامل المشترك (x − a) ثم عوّض.")]] }),
    });

    /* ---------- 8. trigonometric limits (sin θ/θ → 1) ---------- */
    const TRIG = ["sinOverX", "sinOverSin", "tanOverX", "oneMinusCos", "xOverSin"];
    PR.register({
      id: "calc.limitTrig", v: 1, obj: "calc.limits", lesson: LESSON_LIM, subject: SUBJ, program: "arch", lvl: 2,
      gen(r) { for (let t = 0; t < 40; t++) { const f = r.pick(TRIG), k = r.int(2, 9), m = r.int(1, 9); if (k !== m) return { f, k, m }; } return { f: "sinOverX", k: 3, m: 2 }; },
      solve(p) { const { f, k, m } = p; return { L: f === "oneMinusCos" ? (k * k) / (2 * m) : f === "xOverSin" ? m / k : k / m }; },
      fields: () => [fld("L", "L", "The value of the limit (as a fraction or decimal)", "قيمة الغاية (كسر أو عدد عشري)")],
      text(p, lang) {
        const { f, k, m } = p, mm = m === 1 ? "" : m, e = { sinOverX: `sin(${k}x) / (${mm}x)`, sinOverSin: `sin(${k}x) / sin(${m}x)`, tanOverX: `tan(${k}x) / (${mm}x)`, oneMinusCos: `(1 − cos(${k}x)) / (${mm}x²)`, xOverSin: `(${mm}x) / sin(${k}x)` }[f];
        return tr(lang, `Find lim x→0 of ${e} (x in radians).`, `أوجد lim عندما x→0 للدالة ${e} (x بالراديان).`);
      },
      steps(p, lang) {
        const { f, k, m } = p, L = qs(Q(...{ oneMinusCos: [k * k, 2 * m], xOverSin: [m, k] }[f] || [k, m]));
        const base = tr(lang, "Use lim θ→0 sin θ/θ = 1 (and tan θ/θ = 1, (1 − cos θ)/θ² = 1/2): make the inside of each function appear underneath it.", "استعمل lim عندما θ→0 لـ sin θ/θ = 1 (وكذلك tan θ/θ = 1 و (1 − cos θ)/θ² = 1/2): اجعل ما داخل الدالة يظهر في المقام.");
        const s = {
          sinOverX: [`sin(${k}x)/(${m}x) = (${k}/${m})·[sin(${k}x)/(${k}x)] → (${k}/${m})·1`],
          sinOverSin: [`sin(${k}x)/sin(${m}x) = (${k}x/${m}x)·[sin(${k}x)/(${k}x)]·[(${m}x)/sin(${m}x)] → (${k}/${m})·1·1`],
          tanOverX: [`tan(${k}x)/(${m}x) = (${k}/${m})·[tan(${k}x)/(${k}x)] → (${k}/${m})·1`],
          oneMinusCos: [`(1 − cos(${k}x))/(${m}x²) = (${k}²/${m})·[(1 − cos(${k}x))/(${k}x)²] → (${k * k}/${m})·(1/2)`],
          xOverSin: [`(${m}x)/sin(${k}x) = (${m}/${k})·[(${k}x)/sin(${k}x)] → (${m}/${k})·1`],
        }[f];
        return [base, ...s, `L = ${L}`];
      },
      mis(p) {
        const { f, k, m } = p, L = this.solve(p).L;
        if (f === "oneMinusCos") return { L: [["noHalf", (k * k) / m, note("(1 − cos θ)/θ² → 1/2, not 1: you lost the factor 1/2.", "(1 − cos θ)/θ² تقترب من 1/2 وليس 1: سقط منك المعامل 1/2.")]] };
        return { L: [["inverted", 1 / L, note("Upside down: write the angle under the sine (sin kx / kx → 1) and keep the coefficients where they are.", "مقلوبة: ضع الزاوية تحت الجيب (sin kx / kx → 1) وأبقِ المعاملات في أماكنها.")], ["one", 1, note("sin(kx)/x → k, not 1: the special limit needs the SAME angle on top and bottom.", "sin(kx)/x تقترب من k وليس 1: الغاية الخاصة تحتاج الزاوية نفسها في البسط والمقام.")]] };
      },
    });

    /* ---------- 9. limits at infinity of rational functions ---------- */
    PR.register({
      id: "calc.limitInf", v: 1, obj: "calc.limits", lesson: LESSON_LIM, subject: SUBJ, program: "arch", lvl: 1,
      gen(r) {
        for (let t = 0; t < 60; t++) {
          const n = r.pick([2, 2, 3]), lower = r.chance(0.25), a = r.int(-7, 9), d = r.int(1, 8), b = r.int(-6, 6), c = r.int(-9, 9), e = r.int(-6, 6), g = r.int(-9, 9);
          if (!a || !c || !g || (!lower && Q(a, d)[0] === Q(c, g)[0] && Q(a, d)[1] === Q(c, g)[1]) || (!lower && a === d)) continue;
          return { n, lower, a, b, c, d, e, g };
        }
        return { n: 2, lower: false, a: 3, b: 1, c: 2, d: 5, e: 0, g: -4 };
      },
      solve: (p) => ({ L: p.lower ? 0 : p.a / p.d }),
      fields: () => [fld("L", "L", "The value of the limit", "قيمة الغاية")],
      text(p, lang) {
        const N = p.lower ? poly([p.a, p.c]) : p.n === 3 ? poly([p.a, p.b, 0, p.c]) : poly([p.a, p.b, p.c]);
        const D = p.n === 3 ? poly([p.d, 0, p.e, p.g]) : poly([p.d, p.e, p.g]);
        return tr(lang, `Find lim x→∞ of (${N}) / (${D}).`, `أوجد lim عندما x→∞ للدالة (${N}) / (${D}).`);
      },
      steps(p, lang) {
        const hp = p.n === 3 ? "x³" : "x²";
        if (p.lower) return [tr(lang, `The highest power is in the denominator (${hp}); divide top and bottom by ${hp}.`, `أعلى قوة في المقام (${hp})؛ نقسم البسط والمقام على ${hp}.`), tr(lang, "Every term of the numerator then tends to 0 while the denominator tends to its leading coefficient.", "فتقترب كل حدود البسط من الصفر بينما يقترب المقام من معامله الأعلى."), `L = 0/${p.d} = 0`];
        return [tr(lang, `Same highest power (${hp}) top and bottom: divide every term by ${hp}.`, `القوة العليا نفسها (${hp}) في البسط والمقام: نقسم كل حد على ${hp}.`), tr(lang, "All terms with 1/x, 1/x², … tend to 0, leaving the leading coefficients.", "كل الحدود التي فيها 1/x أو 1/x² … تقترب من الصفر، فتبقى المعاملات العليا."), `L = ${num(p.a)}/${p.d} = ${qs(Q(p.a, p.d))}`];
      },
      mis: (p) => ({ L: p.lower ? [["leadRatio", p.a / p.d, note("The numerator has the LOWER power: the denominator grows faster, so the limit is 0.", "قوة البسط أقل: المقام يكبر أسرع، فالغاية صفر.")]] : [["constRatio", p.c / p.g, note("At infinity the highest powers decide, not the constant terms.", "عند اللانهاية تحسم القوى العليا وليس الحدود الثابتة.")]] }),
    });

    /* ---------- 10. continuity: find k ---------- */
    PR.register({
      id: "calc.continuity", v: 1, obj: "calc.continuity", lesson: LESSON_LIM, subject: SUBJ, program: "arch", lvl: 2,
      gen(r) {
        const kind = r.pick(["piece", "piece", "hole"]);
        for (let t = 0; t < 60; t++) {
          const c = r.pick([-3, -2, -1, 1, 2, 3, 4]), a = r.int(-5, 6), b = r.int(-8, 8);
          if (kind === "hole") return { kind, c };
          if (!a || !b || a * c + b === 0 || (a * c + b) / (c * c) === 1) continue;
          return { kind, c, a, b };
        }
        return { kind: "hole", c: 2 };
      },
      solve: (p) => ({ k: p.kind === "hole" ? 2 * p.c : (p.a * p.c + p.b) / (p.c * p.c) }),
      fields: () => [fld("k", "k", "The value of k", "قيمة k")],
      text(p, lang) {
        if (p.kind === "hole") return tr(lang, `f(x) = (x² − ${p.c * p.c}) / (x ${p.c < 0 ? "+" : "−"} ${Math.abs(p.c)}) for x ≠ ${num(p.c)}, and f(${num(p.c)}) = k. Find k so that f is continuous at x = ${num(p.c)}.`, `لتكن f(x) = (x² − ${p.c * p.c}) / (x ${p.c < 0 ? "+" : "−"} ${Math.abs(p.c)}) عندما x ≠ ${num(p.c)}، و f(${num(p.c)}) = k. أوجد k لتكون f متصلة عند x = ${num(p.c)}.`);
        return tr(lang, `f(x) = ${poly([p.a, p.b])} for x < ${num(p.c)}, and f(x) = k·x² for x ≥ ${num(p.c)}. Find k so that f is continuous at x = ${num(p.c)}.`, `لتكن f(x) = ${poly([p.a, p.b])} عندما x < ${num(p.c)}، و f(x) = k·x² عندما x ≥ ${num(p.c)}. أوجد k لتكون f متصلة عند x = ${num(p.c)}.`);
      },
      steps(p, lang) {
        if (p.kind === "hole") return [tr(lang, "Continuous at c means lim x→c f(x) = f(c).", "الاتصال عند c يعني lim f(x) عندما x→c تساوي f(c)."), tr(lang, `x² − ${p.c * p.c} = (x − ${par(p.c)})(x + ${par(p.c)}); cancel (x − ${par(p.c)}) → x + ${par(p.c)}`, `x² − ${p.c * p.c} = (x − ${par(p.c)})(x + ${par(p.c)})؛ نختصر (x − ${par(p.c)}) ← x + ${par(p.c)}`), `k = ${num(p.c)} + ${par(p.c)} = ${num(2 * p.c)}`];
        const left = p.a * p.c + p.b;
        return [tr(lang, "Continuity at c: the left limit, the right limit and f(c) must be equal.", "الاتصال عند c: الغاية من اليسار والغاية من اليمين و f(c) يجب أن تتساوى."), tr(lang, `Left: ${p.a}·${par(p.c)} ${p.b < 0 ? "−" : "+"} ${Math.abs(p.b)} = ${num(left)}; right: k·${par(p.c)}² = ${p.c * p.c}k`, `من اليسار: ${p.a}·${par(p.c)} ${p.b < 0 ? "−" : "+"} ${Math.abs(p.b)} = ${num(left)}؛ من اليمين: k·${par(p.c)}² = ${p.c * p.c}k`), `${p.c * p.c}k = ${num(left)} → k = ${qs(Q(left, p.c * p.c))}`];
      },
      mis: (p) => (p.kind === "hole" ? { k: [["zero", 0, note("Substituting x = c gives 0/0, not 0 — cancel the common factor first.", "التعويض بـ x = c يعطي 0/0 وليس صفرًا — اختصر العامل المشترك أولًا.")]] } : { k: [["linear", (p.a * p.c + p.b) / p.c, note("The right piece is k·x²: divide by c², not by c.", "القطعة اليمنى k·x²: اقسم على c² وليس على c.")]] }),
    });
  } catch (e) { (S5.COLLEGE_ERRORS = S5.COLLEGE_ERRORS || []).push("21-gens-calc: " + (e && e.message)); console.error(e); }
})();
