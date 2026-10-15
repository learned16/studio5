/* College M2 — Year-1 problem generators, statics first (docs/COLLEGE_PLAN.md M2). Contract: see 10-problems.js.
   Every key comes from the pure solver next to each generator; parameters come from "nice" grids; each generator
   carries a `kb` instance that re-solves its library lesson's worked example (S5.prob.kbCheck flags a lesson that
   disagrees — the solver is never tuned to match). Text and steps are bilingual and are rendered with data-noi18n. */
(() => {
  try {
    const PR = S5.prob, f = PR.fmt, DEG = Math.PI / 180;
    const CIV = "Engineering Mechanics (Statics & Dynamics)", ARCH_MECH = "Mechanics & Strength of Materials";
    const FORCE = ["N", "kN", "MN"], LEN = ["mm", "cm", "m"], MOM = ["N·m", "kN·m"], ANG = ["deg", "rad"];
    const tr = (lang, en, ar) => (lang === "ar" ? ar : en);
    const fp = (x) => (x < 0 ? `(${f(x)})` : f(x)); // a negative number inside a product or a square
    const sin = (d) => Math.sin(d * DEG), cos = (d) => Math.cos(d * DEG);
    const lab = (en, ar) => ({ en, ar });
    const TC = (lang, F) => (F < 0 ? tr(lang, "compression (C)", "ضغط (C)") : tr(lang, "tension (T)", "شد (T)"));
    /* tiny SVG helpers (language-neutral labels; numbers only where the text already gives them) */
    const n1 = (v) => (+v).toFixed(1);
    const line = (x1, y1, x2, y2, col = "currentColor", w = 2, extra = "") => `<line x1="${n1(x1)}" y1="${n1(y1)}" x2="${n1(x2)}" y2="${n1(y2)}" stroke="${col}" stroke-width="${w}"${extra}/>`;
    const arrow = (x1, y1, x2, y2, col = "var(--cobalt)", w = 2) => { const a = Math.atan2(y2 - y1, x2 - x1), h = 8; return line(x1, y1, x2, y2, col, w) + `<polygon points="${n1(x2)},${n1(y2)} ${n1(x2 - h * Math.cos(a - 0.4))},${n1(y2 - h * Math.sin(a - 0.4))} ${n1(x2 - h * Math.cos(a + 0.4))},${n1(y2 - h * Math.sin(a + 0.4))}" fill="${col}"/>`; };
    const txt = (x, y, s, anchor = "middle") => `<text x="${n1(x)}" y="${n1(y)}" font-size="12" fill="currentColor" text-anchor="${anchor}" font-family="IBM Plex Mono, monospace">${s}</text>`;
    const pin = (x, y) => `<polygon points="${n1(x)},${n1(y)} ${n1(x - 9)},${n1(y + 14)} ${n1(x + 9)},${n1(y + 14)}" fill="none" stroke="currentColor" stroke-width="1.5"/>`;
    const roller = (x, y) => `<circle cx="${n1(x)}" cy="${n1(y + 7)}" r="7" fill="none" stroke="currentColor" stroke-width="1.5"/>`;
    const svg = (w, h, body) => `<svg viewBox="0 0 ${w} ${h}" width="100%" style="max-width:${Math.round(w * 1.5)}px" role="img" direction="ltr">${body}</svg>`;

    /* ---------- objectives (static content; bilingual like problem text) ---------- */
    PR.obj({ id: "statics.forces", en: "Resolve forces into components and find their resultant", ar: "تحليل القوى إلى مركبات وإيجاد محصلتها", subjects: [CIV], program: "civil", lessons: ["c1b-mech-01"] });
    PR.obj({ id: "statics.particle", en: "Equilibrium of a particle (ΣFx = 0, ΣFy = 0)", ar: "اتزان الجسيم (ΣFx = 0 و ΣFy = 0)", subjects: [CIV], program: "civil", lessons: ["c1b-mech-02"] });
    PR.obj({ id: "statics.moment", en: "Moment of a force about a point", ar: "عزم القوة حول نقطة", subjects: [CIV], program: "civil", lessons: ["c1b-mech-03"] });
    PR.obj({ id: "statics.reactions", en: "Support reactions and maximum moment of a simple beam", ar: "ردود أفعال المساند وأقصى عزم في عتبة بسيطة", subjects: [CIV], program: "civil", lessons: ["c1b-mech-04"] });
    PR.obj({ id: "statics.joints", en: "Truss member forces by the method of joints", ar: "قوى أعضاء الجملون بطريقة العقد", subjects: [CIV], program: "civil", lessons: ["c1b-mech-05"] });
    PR.obj({ id: "statics.centroid", en: "Centroid of a composite section", ar: "مركز ثقل المقطع المركب", subjects: [CIV, ARCH_MECH], program: "both", lessons: ["c1b-mech-09", "a2-mec-04"] });

    /* ---------- 1. resultant of 2–3 concurrent forces (c1b-mech-01) ---------- */
    const resXY = (p, trig = DEG) => { let x = 0, y = 0; p.F.forEach((F, i) => { x += F * Math.cos(p.th[i] * trig); y += F * Math.sin(p.th[i] * trig); }); return [x, y]; };
    const resultant = (p) => { const [x, y] = resXY(p); let th = Math.atan2(y, x); if (th < 0) th += 2 * Math.PI; return { x, y, R: Math.hypot(x, y), th }; };
    PR.register({
      id: "mech.resultant", v: 1, obj: "statics.forces", lesson: "c1b-mech-01", subject: CIV, program: "civil", lvl: 1,
      gen(r) {
        const u = r.pick(["N", "kN"]), n = r.pick([2, 2, 3]);
        for (let t = 0; t < 50; t++) {
          const F = [], th = [];
          for (let i = 0; i < n; i++) {
            F.push(u === "N" ? r.grid(100, 900, 50) : r.grid(2, 40, 1));
            let a = r.grid(0, 355, 5); for (let k = 0; k < 30 && th.some((b) => Math.abs(((a - b + 540) % 360) - 180) < 20); k++) a = r.grid(0, 355, 5);
            th.push(a);
          }
          if (resultant({ F, th }).R >= 0.25 * Math.max(...F)) return { u, F, th };
        }
        return { u: "N", F: [500, 300], th: [30, 120] };
      },
      solve(p) { const s = S5.toSI(1, p.u), q = resultant(p); return { R: q.R * s, th: q.th, Rx: q.x * s, Ry: q.y * s }; },
      fields: (p) => [
        { k: "R", sym: "R", dim: "force", units: FORCE, unit: p.u, tol: "def", label: lab("Magnitude of the resultant R", "مقدار المحصلة R") },
        { k: "th", sym: "θ", dim: "angle", units: ANG, unit: "deg", tol: "angMech", wrap: true, label: lab("Direction θ of R, counter-clockwise from +x", "اتجاه المحصلة θ عكس عقارب الساعة من محور x الموجب") },
      ],
      text(p, lang) {
        const list = p.F.map((F, i) => `F${i + 1} = ${F} ${p.u} ${tr(lang, "at", "بزاوية")} ${p.th[i]}°`).join(tr(lang, ", ", "، "));
        return tr(lang,
          `Concurrent forces act at one point: ${list} (angles measured counter-clockwise from the +x axis). Find the magnitude of the resultant R and its direction θ from the +x axis.`,
          `تؤثر قوى متلاقية في نقطة واحدة: ${list} (الزوايا تُقاس عكس عقارب الساعة من محور x الموجب). أوجد مقدار المحصلة R واتجاهها θ من محور x الموجب.`);
      },
      steps(p, lang) {
        const q = resultant(p), u = p.u, quad = q.x >= 0 ? (q.y >= 0 ? 1 : 4) : q.y >= 0 ? 2 : 3;
        return [
          ...p.F.map((F, i) => `${tr(lang, "Resolve", "حلّل")} F${i + 1}: F${i + 1}x = ${F}·cos${p.th[i]}° = ${f(F * cos(p.th[i]))} ${u}${tr(lang, ", ", "، ")}F${i + 1}y = ${F}·sin${p.th[i]}° = ${f(F * sin(p.th[i]))} ${u}`),
          `Rx = ΣFx = ${f(q.x)} ${u}${tr(lang, ", ", "، ")}Ry = ΣFy = ${f(q.y)} ${u}`,
          `R = √(Rx² + Ry²) = √(${fp(q.x)}² + ${fp(q.y)}²) = ${f(q.R)} ${u}`,
          tr(lang, `θ = atan2(Ry, Rx) = ${f(q.th / DEG, 1)}° (quadrant ${["", "I", "II", "III", "IV"][quad]} from the signs of Rx and Ry)`,
            `θ = atan2(Ry, Rx) = ${f(q.th / DEG, 1)}° (الربع ${["", "الأول", "الثاني", "الثالث", "الرابع"][quad]} حسب إشارتي Rx و Ry)`),
        ];
      },
      mis(p) { const [x, y] = resXY(p, 1); return { R: [["deg-rad", Math.hypot(x, y) * S5.toSI(1, p.u)]] }; }, // calculator left in radians
      svg(p) {
        const c = 110, m = Math.max(...p.F);
        return svg(220, 220, line(10, c, 210, c, "var(--rule-strong, #999)", 1) + line(c, 10, c, 210, "var(--rule-strong, #999)", 1) + txt(212, c - 4, "x", "end") + txt(c + 8, 18, "y")
          + p.F.map((F, i) => { const L = 30 + (60 * F) / m; return arrow(c, c, c + L * cos(p.th[i]), c - L * sin(p.th[i])) + txt(c + (L + 14) * cos(p.th[i]), c - (L + 14) * sin(p.th[i]) + 4, "F" + (i + 1)); }).join(""));
      },
      kb: { lesson: "c1b-mech-01", p: { u: "N", F: [500, 300], th: [30, 120] }, expect: { R: [583, "N"], th: [61.0, "deg"] } },
    });

    /* ---------- 2. particle held by two cables (c1b-mech-02) ---------- */
    const cables = (p, trig = DEG) => { const a = p.ref === "v" ? 90 - p.a : p.a, b = p.ref === "v" ? 90 - p.b : p.b, s = Math.sin((a + b) * trig); return { a, b, T1: (p.W * Math.cos(b * trig)) / s, T2: (p.W * Math.cos(a * trig)) / s }; };
    PR.register({
      id: "mech.particle2cable", v: 1, obj: "statics.particle", lesson: "c1b-mech-02", subject: CIV, program: "civil", lvl: 1,
      gen(r) { const u = r.pick(["N", "kN"]); return { u, W: u === "N" ? r.grid(200, 2000, 50) : r.grid(2, 50, 1), a: r.grid(20, 70, 5), b: r.grid(20, 70, 5), ref: r.chance(0.3) ? "v" : "h" }; },
      solve(p) { const s = S5.toSI(1, p.u), c = cables(p); return { TAB: c.T1 * s, TAC: c.T2 * s }; },
      fields: (p) => [
        { k: "TAB", sym: "T_AB", dim: "force", units: FORCE, unit: p.u, tol: "def", label: lab("Tension in cable AB", "الشد في الحبل AB") },
        { k: "TAC", sym: "T_AC", dim: "force", units: FORCE, unit: p.u, tol: "def", label: lab("Tension in cable AC", "الشد في الحبل AC") },
      ],
      text(p, lang) {
        const ref = p.ref === "v" ? tr(lang, "from the vertical", "مع الشاقول") : tr(lang, "above the horizontal", "فوق الأفق");
        return tr(lang,
          `A weight W = ${p.W} ${p.u} hangs from ring A, held by two cables. Cable AB rises to the left at ${p.a}° ${ref}; cable AC rises to the right at ${p.b}° ${ref}. Find the tension in each cable.`,
          `ثقل وزنه W = ${p.W} ${p.u} معلق بالحلقة A ويحمله حبلان. الحبل AB يصعد إلى اليسار بزاوية ${p.a}° ${ref}، والحبل AC يصعد إلى اليمين بزاوية ${p.b}° ${ref}. أوجد الشد في كل حبل.`);
      },
      steps(p, lang) {
        const c = cables(p), u = p.u, out = [];
        if (p.ref === "v") out.push(tr(lang, `Angles from the horizontal: α = 90° − ${p.a}° = ${c.a}°, β = 90° − ${p.b}° = ${c.b}°`, `الزوايا مع الأفق: α = 90° − ${p.a}° = ${c.a}°، β = 90° − ${p.b}° = ${c.b}°`));
        out.push(tr(lang, `Free-body diagram of ring A: T_AB up-left at α = ${c.a}°, T_AC up-right at β = ${c.b}°, W = ${p.W} ${u} down`, `مخطط الجسم الحر للحلقة A: T_AB إلى الأعلى يسارًا بزاوية α = ${c.a}°، و T_AC إلى الأعلى يمينًا بزاوية β = ${c.b}°، والوزن W = ${p.W} ${u} للأسفل`),
          `ΣFx = 0: −T_AB·cos${c.a}° + T_AC·cos${c.b}° = 0`,
          `ΣFy = 0: T_AB·sin${c.a}° + T_AC·sin${c.b}° − ${p.W} = 0`,
          `T_AB = W·cosβ / sin(α + β) = ${p.W}·cos${c.b}° / sin${c.a + c.b}° = ${f(c.T1)} ${u}`,
          `T_AC = W·cosα / sin(α + β) = ${p.W}·cos${c.a}° / sin${c.a + c.b}° = ${f(c.T2)} ${u}`,
          tr(lang, `Check ΣFy: ${f(c.T1)}·sin${c.a}° + ${f(c.T2)}·sin${c.b}° = ${f(c.T1 * sin(c.a) + c.T2 * sin(c.b))} ≈ W ✓`, `تحقق ΣFy: ${f(c.T1)}·sin${c.a}° + ${f(c.T2)}·sin${c.b}° = ${f(c.T1 * sin(c.a) + c.T2 * sin(c.b))} ≈ W ✓`));
        return out;
      },
      mis(p) { const c = cables(p, 1), s = S5.toSI(1, p.u); return { TAB: [["deg-rad", c.T1 * s]], TAC: [["deg-rad", c.T2 * s]] }; },
      svg(p) {
        const c = cables(p), x = 120, y = 110, L = 85, bx = x - L * cos(c.a), by = y - L * sin(c.a), cx = x + L * cos(c.b), cy = y - L * sin(c.b);
        return svg(240, 180, line(x, y, bx, by) + line(x, y, cx, cy) + line(bx - 12, by, bx + 12, by, "currentColor", 3) + line(cx - 12, cy, cx + 12, cy, "currentColor", 3)
          + `<circle cx="${x}" cy="${y}" r="4" fill="currentColor"/>` + arrow(x, y + 6, x, y + 60) + txt(x + 14, y + 4, "A", "start") + txt(bx, by - 8, "B") + txt(cx, cy - 8, "C") + txt(x + 10, y + 58, "W", "start"));
      },
      kb: { lesson: "c1b-mech-02", p: { u: "N", W: 1000, a: 30, b: 60, ref: "h" }, expect: { TAB: [500, "N"], TAC: [866, "N"] } },
    });

    /* ---------- 3. moment of a force about a point (c1b-mech-03) ---------- */
    const mom = (p, trig = DEG) => { const Fx = p.F * Math.cos(p.th * trig), Fy = p.F * Math.sin(p.th * trig), M = p.x * Fy - p.y * Fx; return { Fx, Fy, M, d: Math.abs(M) / p.F }; };
    PR.register({
      id: "mech.moment", v: 1, obj: "statics.moment", lesson: "c1b-mech-03", subject: CIV, program: "civil", lvl: 1,
      gen(r) {
        const u = r.pick(["N", "kN"]);
        for (let t = 0; t < 50; t++) {
          const x = r.grid(-3, 3, 0.5), y = r.grid(-3, 3, 0.5), F = u === "N" ? r.grid(50, 500, 10) : r.grid(2, 40, 1), th = r.grid(0, 345, 15), rr = Math.hypot(x, y);
          if (rr >= 0.5 && Math.abs(mom({ x, y, F, th }).M) >= 0.15 * F * rr) return { u, F, th, x, y };
        }
        return { u: "N", F: 200, th: 60, x: 0.4, y: 0 };
      },
      solve(p) { const m = mom(p), s = S5.toSI(1, p.u); return { d: m.d, M: m.M * s, Fx: m.Fx * s, Fy: m.Fy * s }; },
      fields: (p) => [
        { k: "d", sym: "d", dim: "length", units: LEN, unit: "m", tol: "def", label: lab("Perpendicular distance d from O to the line of action", "البعد العمودي d من O إلى خط تأثير القوة") },
        { k: "M", sym: "M_O", dim: "moment", units: MOM, unit: p.u === "N" ? "N·m" : "kN·m", tol: "def", sense: ["CCW", "CW"], label: lab("Moment of F about O", "عزم القوة F حول O") },
      ],
      text(p, lang) {
        return tr(lang,
          `A force F = ${p.F} ${p.u} acts at point A (x = ${p.x} m, y = ${p.y} m) measured from O, pointing ${p.th}° counter-clockwise from the +x axis. Find the perpendicular distance d from O to the line of action of F, and the moment of F about O (state counter-clockwise or clockwise).`,
          `قوة F = ${p.F} ${p.u} تؤثر في النقطة A (x = ${p.x} m، y = ${p.y} m) مقيسة من O، واتجاهها ${p.th}° عكس عقارب الساعة من محور x الموجب. أوجد البعد العمودي d من O إلى خط تأثير القوة، وعزم القوة حول O مع بيان اتجاهه (عكس عقارب الساعة أو مع عقارب الساعة).`);
      },
      steps(p, lang) {
        const m = mom(p), u = p.u, mu = u === "N" ? "N·m" : "kN·m";
        return [
          `Fx = F·cos${p.th}° = ${f(m.Fx)} ${u}${tr(lang, ", ", "، ")}Fy = F·sin${p.th}° = ${f(m.Fy)} ${u}`,
          tr(lang, "Varignon: ", "نظرية فارينيون: ") + `M_O = x·Fy − y·Fx = ${fp(p.x)}·${fp(m.Fy)} − ${fp(p.y)}·${fp(m.Fx)} = ${f(m.M)} ${mu}`,
          m.M >= 0 ? tr(lang, `M_O is positive → counter-clockwise (CCW), |M_O| = ${f(m.M)} ${mu}`, `M_O موجب ← عكس عقارب الساعة، |M_O| = ${f(m.M)} ${mu}`)
            : tr(lang, `M_O is negative → clockwise (CW), |M_O| = ${f(-m.M)} ${mu}`, `M_O سالب ← مع عقارب الساعة، |M_O| = ${f(-m.M)} ${mu}`),
          `d = |M_O| / F = ${f(Math.abs(m.M))} / ${p.F} = ${f(m.d)} m`,
        ];
      },
      mis(p) { const m = mom(p, 1), s = S5.toSI(1, p.u); return { M: [["deg-rad", m.M * s]], d: [["deg-rad", m.d]] }; },
      svg(p) {
        const o = 110, k = 25, ax = o + k * p.x, ay = o - k * p.y;
        return svg(220, 220, line(10, o, 210, o, "var(--rule-strong, #999)", 1) + line(o, 10, o, 210, "var(--rule-strong, #999)", 1) + `<circle cx="${o}" cy="${o}" r="3.5" fill="currentColor"/>` + txt(o - 10, o + 16, "O")
          + `<circle cx="${n1(ax)}" cy="${n1(ay)}" r="3.5" fill="currentColor"/>` + txt(ax - 10, ay - 8, "A") + arrow(ax, ay, ax + 45 * cos(p.th), ay - 45 * sin(p.th)) + txt(ax + 58 * cos(p.th), ay - 58 * sin(p.th) + 4, "F"));
      },
      kb: { lesson: "c1b-mech-03", p: { u: "N", F: 200, th: 60, x: 0.4, y: 0 }, expect: { M: [69.3, "N·m"] } },
    });

    /* ---------- 4. simply supported beam: UDL + point load (c1b-mech-04; agrees with TOOL_DEFS.beam) ---------- */
    const beam = (p) => {
      const { L, w, a } = p, Pl = p.P, RB = ((w * L * L) / 2 + Pl * a) / L, RA = w * L + Pl - RB;
      const Mx = (x) => RA * x - (w * x * x) / 2 - (x > a ? Pl * (x - a) : 0);
      const xs = [0, a, L]; if (w > 0) { const x1 = RA / w, x2 = (RA - Pl) / w; if (x1 > 0 && x1 < a) xs.push(x1); if (x2 > a && x2 < L) xs.push(x2); }
      let xm = 0, Mm = 0; for (const x of xs) { const m = Mx(x); if (Math.abs(m) > Math.abs(Mm)) { Mm = m; xm = x; } }
      return { RA, RB, Mm, xm, W: w * L };
    };
    PR.register({
      id: "mech.beamReactions", v: 1, obj: "statics.reactions", lesson: "c1b-mech-04", subject: CIV, program: "civil", lvl: 2,
      gen(r) { const L = r.grid(3, 10, 0.5); return { L, w: r.grid(2, 20, 1), P: r.grid(5, 50, 5), a: r.grid(0.5, L - 0.5, 0.5) }; },
      solve(p) { const b = beam(p); return { RA: b.RA * 1e3, RB: b.RB * 1e3, Mmax: b.Mm * 1e3, xm: b.xm }; },
      fields: () => [
        { k: "RA", sym: "R_A", dim: "force", units: FORCE, unit: "kN", tol: "def", label: lab("Vertical reaction at A", "رد الفعل الشاقولي عند A") },
        { k: "RB", sym: "R_B", dim: "force", units: FORCE, unit: "kN", tol: "def", label: lab("Vertical reaction at B", "رد الفعل الشاقولي عند B") },
        { k: "Mmax", sym: "M_max", dim: "moment", units: MOM, unit: "kN·m", tol: "def", label: lab("Maximum bending moment", "أقصى عزم انحناء") },
      ],
      text(p, lang) {
        return tr(lang,
          `A simply supported beam AB (pin at A, roller at B) has a span L = ${p.L} m. It carries a uniformly distributed load w = ${p.w} kN/m over the whole span and a point load P = ${p.P} kN at a = ${p.a} m from A. Find the reactions at A and B and the maximum bending moment.`,
          `عتبة بسيطة الإسناد AB (مسند مفصلي عند A ودحروجي عند B) طولها L = ${p.L} m، تحمل حملًا موزعًا منتظمًا w = ${p.w} kN/m على كامل الطول وحملًا مركزًا P = ${p.P} kN على بعد a = ${p.a} m من A. أوجد ردّي الفعل عند A و B وأقصى عزم انحناء.`);
      },
      steps(p, lang) {
        const b = beam(p), after = b.xm > p.a + 1e-9, atP = Math.abs(b.xm - p.a) < 1e-9;
        return [
          tr(lang, `UDL resultant: W = w·L = ${p.w}·${p.L} = ${f(b.W)} kN, acting at L/2 = ${f(p.L / 2)} m from A`, `محصلة الحمل الموزع: W = w·L = ${p.w}·${p.L} = ${f(b.W)} kN تؤثر عند L/2 = ${f(p.L / 2)} m من A`),
          `ΣM_A = 0: R_B·${p.L} − ${f(b.W)}·${f(p.L / 2)} − ${p.P}·${p.a} = 0 → R_B = ${f(b.RB)} kN`,
          `ΣFy = 0: R_A = ${f(b.W)} + ${p.P} − ${f(b.RB)} = ${f(b.RA)} kN`,
          atP ? tr(lang, `The shear changes sign under the point load, so M is largest at x = a = ${p.a} m`, `تتغير إشارة القص تحت الحمل المركز، لذا يكون العزم أكبر ما يمكن عند x = a = ${p.a} m`)
            : tr(lang, `The shear is zero at x = ${f(b.xm)} m (V = R_A − w·x${after ? " − P" : ""} = 0)`, `القص يساوي صفرًا عند x = ${f(b.xm)} m (V = R_A − w·x${after ? " − P" : ""} = 0)`),
          `M_max = R_A·x − w·x²/2${after ? " − P·(x − a)" : ""} = ${f(b.RA)}·${f(b.xm)} − ${p.w}·${f(b.xm)}²/2${after ? ` − ${p.P}·${f(b.xm - p.a)}` : ""} = ${f(b.Mm)} kN·m`,
          tr(lang, `Check ΣM_B: −R_A·L + W·L/2 + P·(L − a) = −${f(b.RA)}·${p.L} + ${f(b.W)}·${f(p.L / 2)} + ${p.P}·${f(p.L - p.a)} = 0 ✓`, `تحقق ΣM_B: −R_A·L + W·L/2 + P·(L − a) = −${f(b.RA)}·${p.L} + ${f(b.W)}·${f(p.L / 2)} + ${p.P}·${f(p.L - p.a)} = 0 ✓`),
        ];
      },
      svg(p) {
        const x0 = 20, x1 = 240, y = 80, sx = (x) => x0 + ((x1 - x0) * x) / p.L, xp = sx(p.a); let udl = "";
        for (let i = 0; i <= 10; i++) { const x = x0 + ((x1 - x0) * i) / 10; udl += arrow(x, 50, x, y - 2, "var(--cobalt)", 1.2); }
        return svg(260, 140, line(x0, 50, x1, 50, "var(--cobalt)", 1.2) + udl + arrow(xp, 12, xp, y - 2, "var(--redline, #c33)", 2.5) + line(x0, y, x1, y, "currentColor", 4) + pin(x0, y + 2) + roller(x1, y + 2)
          + txt(x0, y + 32, "A") + txt(x1, y + 32, "B") + txt(xp + 6, 18, "P", "start") + txt(x1 + 4, 46, "w", "start") + line(x0, 128, x1, 128, "currentColor", 1) + txt((x0 + x1) / 2, 124, "L"));
      },
      kb: { lesson: "c1b-mech-04", p: { L: 6, w: 4, P: 12, a: 2 }, expect: { RA: [20, "kN"], RB: [16, "kN"] } },
    });

    /* ---------- 5. triangular truss by the method of joints (c1b-mech-05) ---------- */
    const truss = (p) => {
      const { L, c, h, H } = p, Pl = p.P, LAC = Math.hypot(c, h), LBC = Math.hypot(L - c, h);
      const By = (Pl * c + H * h) / L, Ay = Pl - By, Ax = -H;
      const AC = (-Ay * LAC) / h, AB = -Ax - (AC * c) / LAC, BC = (-By * LBC) / h;
      return { LAC, LBC, Ax, Ay, By, AC, AB, BC, angA: Math.atan2(h, c) / DEG, angB: Math.atan2(h, L - c) / DEG };
    };
    PR.register({
      id: "mech.trussJoint3", v: 1, obj: "statics.joints", lesson: "c1b-mech-05", subject: CIV, program: "civil", lvl: 2,
      gen(r) {
        for (let t = 0; t < 80; t++) {
          const L = r.grid(3, 8, 0.5), c = r.grid(1, L - 1, 0.5), h = r.grid(1, 4, 0.5), P = r.grid(4, 40, 2), H = r.chance(0.35) ? r.grid(2, 12, 1) : 0, s = truss({ L, c, h, P, H });
          if (s.angA < 25 || s.angA > 65 || s.angB < 25 || s.angB > 65) continue; // member angles kept between 25° and 65°
          if (Math.min(Math.abs(s.AC), Math.abs(s.BC), Math.abs(s.AB)) < 0.1 * P) continue;
          return { L, c, h, P, H };
        }
        return { L: 4, c: 2, h: 3, P: 10, H: 0 };
      },
      solve(p) { const s = truss(p); return { AC: s.AC * 1e3, BC: s.BC * 1e3, AB: s.AB * 1e3, Ax: s.Ax * 1e3, Ay: s.Ay * 1e3, By: s.By * 1e3 }; },
      fields: () => ["AC", "BC", "AB"].map((m) => ({ k: m, sym: "F_" + m, dim: "force", units: FORCE, unit: "kN", tol: "def", sense: ["T", "C"], label: lab(`Force in member ${m}`, `القوة في العضو ${m}`) })),
      text(p, lang) {
        return tr(lang,
          `A triangular truss ABC has a pin support at A and a roller at B; A and B lie on one horizontal line with AB = ${p.L} m. Joint C is ${p.c} m to the right of A and ${p.h} m above AB. A vertical load P = ${p.P} kN acts downward at C${p.H ? ` and a horizontal load H = ${p.H} kN acts to the right at C` : ""}. Find the force in members AC, BC and AB and state whether each is in tension (T) or compression (C).`,
          `جملون مثلثي ABC بمسند مفصلي عند A ودحروجي عند B؛ النقطتان A و B على خط أفقي واحد و AB = ${p.L} m. العقدة C تقع على بعد ${p.c} m يمين A وترتفع ${p.h} m فوق AB. يؤثر حمل شاقولي P = ${p.P} kN نحو الأسفل عند C${p.H ? ` وحمل أفقي H = ${p.H} kN نحو اليمين عند C` : ""}. أوجد القوة في الأعضاء AC و BC و AB وبيّن هل كلٌّ منها شد (T) أم ضغط (C).`);
      },
      steps(p, lang) {
        const s = truss(p), sep = tr(lang, ", ", "، ");
        return [
          tr(lang, "Assume every member is in tension (pulling away from the joint); a negative result means compression.", "نفترض أن كل الأعضاء في حالة شد (تسحب بعيدًا عن العقدة)؛ الناتج السالب يعني ضغطًا."),
          tr(lang, "Geometry: ", "الهندسة: ") + `AC = √(${p.c}² + ${p.h}²) = ${f(s.LAC)} m${sep}BC = √(${f(p.L - p.c)}² + ${p.h}²) = ${f(s.LBC)} m`,
          `ΣM_A = 0: B_y·${p.L} − ${p.P}·${p.c}${p.H ? ` − ${p.H}·${p.h}` : ""} = 0 → B_y = ${f(s.By)} kN`,
          `ΣFy = 0: A_y = ${p.P} − ${f(s.By)} = ${f(s.Ay)} kN${sep}ΣFx = 0: A_x = ${f(s.Ax)} kN`,
          tr(lang, "Joint A, ", "العقدة A، ") + `ΣFy = 0: A_y + F_AC·(${p.h}/${f(s.LAC)}) = 0 → F_AC = ${f(s.AC)} kN → ${TC(lang, s.AC)}`,
          tr(lang, "Joint A, ", "العقدة A، ") + `ΣFx = 0: A_x + F_AB + F_AC·(${p.c}/${f(s.LAC)}) = 0 → F_AB = ${f(s.AB)} kN → ${TC(lang, s.AB)}`,
          tr(lang, "Joint B, ", "العقدة B، ") + `ΣFy = 0: B_y + F_BC·(${p.h}/${f(s.LBC)}) = 0 → F_BC = ${f(s.BC)} kN → ${TC(lang, s.BC)}`,
          tr(lang, "Check at joint B, ", "تحقق عند العقدة B، ") + `ΣFx = 0: −F_AB + F_BC·(${f(p.c - p.L)}/${f(s.LBC)}) = −${fp(s.AB)} + ${fp((s.BC * (p.c - p.L)) / s.LBC)} = 0 ✓`,
        ];
      },
      svg(p) {
        const k = Math.min(200 / p.L, 90 / p.h), ax = 30, ay = 125, bx = ax + k * p.L, cx = ax + k * p.c, cy = ay - k * p.h;
        return svg(Math.round(bx + 40), 165, line(ax, ay, bx, ay) + line(ax, ay, cx, cy) + line(bx, ay, cx, cy) + pin(ax, ay) + roller(bx, ay)
          + arrow(cx, cy - 34, cx, cy - 3, "var(--redline, #c33)", 2.5) + (p.H ? arrow(cx - 36, cy, cx - 4, cy, "var(--redline, #c33)", 2.5) : "")
          + txt(ax - 12, ay + 4, "A", "end") + txt(bx + 12, ay + 4, "B", "start") + txt(cx + 8, cy + 4, "C", "start") + txt(cx + 6, cy - 26, "P", "start") + (p.H ? txt(cx - 36, cy - 6, "H", "start") : ""));
      },
      kb: { lesson: "c1b-mech-05", p: { L: 4, c: 2, h: 3, P: 10, H: 0 }, expect: { AC: [-6.01, "kN"], BC: [-6.01, "kN"], AB: [3.33, "kN"] } },
    });

    /* ---------- 6. centroid of a composite T-section (c1b-mech-09, also a2-mec-04) ---------- */
    const tsec = (p) => { const A1 = p.bf * p.tf, y1 = p.hw + p.tf / 2, A2 = p.tw * p.hw, y2 = p.hw / 2; return { A1, y1, A2, y2, A: A1 + A2, Ay: A1 * y1 + A2 * y2, yb: (A1 * y1 + A2 * y2) / (A1 + A2) }; };
    PR.register({
      id: "geo.compositeCentroid", v: 1, obj: "statics.centroid", lesson: "c1b-mech-09", lessons: ["c1b-mech-09", "a2-mec-04"], subject: CIV, program: "both", lvl: 1,
      gen(r) { const bf = r.grid(100, 400, 10); return { bf, tf: r.grid(10, 40, 5), tw: r.grid(10, Math.min(40, Math.floor(bf / 15) * 5), 5), hw: r.grid(100, 400, 10) }; },
      solve(p) { const s = tsec(p); return { yb: s.yb * 1e-3, A: s.A * 1e-6 }; },
      fields: () => [{ k: "yb", sym: "ȳ", dim: "length", units: LEN, unit: "mm", tol: "geo", label: lab("Height of the centroid ȳ above the bottom of the web", "ارتفاع المركز ȳ فوق أسفل الجذع") }],
      text(p, lang) {
        return tr(lang,
          `A T-section is made of a flange ${p.bf} mm wide × ${p.tf} mm thick on top of a web ${p.tw} mm thick × ${p.hw} mm high (total height ${p.hw + p.tf} mm). Find the height ȳ of the centroid measured from the bottom of the web.`,
          `مقطع على شكل T يتكون من شفة (Flange) عرضها ${p.bf} mm وسمكها ${p.tf} mm فوق جذع (Web) سمكه ${p.tw} mm وارتفاعه ${p.hw} mm (الارتفاع الكلي ${p.hw + p.tf} mm). أوجد ارتفاع المركز ȳ مقيسًا من أسفل الجذع.`);
      },
      steps(p, lang) {
        const s = tsec(p), sep = tr(lang, ", ", "، ");
        return [
          tr(lang, "Flange: ", "الشفة: ") + `A1 = ${p.bf}·${p.tf} = ${s.A1} mm²${sep}y1 = ${p.hw} + ${p.tf}/2 = ${f(s.y1)} mm`,
          tr(lang, "Web: ", "الجذع: ") + `A2 = ${p.tw}·${p.hw} = ${s.A2} mm²${sep}y2 = ${p.hw}/2 = ${f(s.y2)} mm`,
          `ΣA = ${s.A} mm²${sep}ΣA·y = ${s.A1}·${f(s.y1)} + ${s.A2}·${f(s.y2)} = ${f(s.Ay)} mm³`,
          `ȳ = ΣA·y / ΣA = ${f(s.Ay)} / ${s.A} = ${f(s.yb)} mm` + tr(lang, ` (x̄ = ${p.bf / 2} mm, on the axis of symmetry)`, ` (x̄ = ${p.bf / 2} mm على محور التناظر)`),
        ];
      },
      svg(p) {
        const H = p.hw + p.tf, k = 130 / Math.max(p.bf, H), w = p.bf * k, x0 = 40, y0 = 15, cx = x0 + w / 2, tw = Math.max(p.tw * k, 3);
        return svg(Math.round(w + 90), 175, `<rect x="${n1(x0)}" y="${y0}" width="${n1(w)}" height="${n1(Math.max(p.tf * k, 3))}" fill="var(--cobalt-wash, #dde6f3)" stroke="currentColor"/>`
          + `<rect x="${n1(cx - tw / 2)}" y="${n1(y0 + p.tf * k)}" width="${n1(tw)}" height="${n1(p.hw * k)}" fill="var(--cobalt-wash, #dde6f3)" stroke="currentColor"/>`
          + txt(cx, y0 + H * k + 16, `${p.tw}`) + txt(x0 + w + 6, y0 + (p.tf * k) / 2 + 4, `${p.tf}`, "start") + txt(cx + tw / 2 + 6, y0 + p.tf * k + (p.hw * k) / 2, `${p.hw}`, "start") + txt(cx, y0 - 3, `${p.bf}`));
      },
      kb: [
        { lesson: "c1b-mech-09", p: { bf: 200, tf: 20, tw: 20, hw: 180 }, expect: { yb: [142.6, "mm"] } },
        { lesson: "a2-mec-04", p: { bf: 200, tf: 20, tw: 20, hw: 180 }, expect: { yb: [142.6, "mm"] } },
      ],
    });
  } catch (e) { (S5.COLLEGE_ERRORS = S5.COLLEGE_ERRORS || []).push("20-gens-y1: " + (e && e.message)); console.error(e); }
})();
