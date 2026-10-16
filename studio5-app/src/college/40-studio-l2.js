/* The Studio — Level 2: Freehand Drawing (Arc 103) weeks 3–13 of the official syllabus — cubes in one- and two-point
   perspective, circles/cylinders (ellipses), pottery and irregular forms (proportion and symmetry). Every drawing is
   measured by code (COLLEGE_PLAN §8.4 drawing checkers): each receding edge is tested against its vanishing point,
   each ellipse against the box it must fill (axes, closure, smoothness, pointed ends), each vase against its axis and
   its height:width ratio. Named mistakes come back as concrete notes. The Arabic wording is a first draft for Codex. */
(() => {
  try {
    const G = S5.sg, W = S5.STUDIO_W;
    const sline = (x1, y1, x2, y2) => [[x1, y1], [x2, y2]];
    const ell = (cx, cy, a, b, n = 48) => Array.from({ length: n + 1 }, (_, k) => [cx + a * Math.cos((k / n) * 2 * Math.PI), cy + b * Math.sin((k / n) * 2 * Math.PI)]);
    const guideLine = (x1, y1, x2, y2) => ({ t: "pen", c: "#1f4fa8", w: 1.2, p: [x1 * 10, y1 * 10, 50, x2 * 10, y2 * 10, 50] });
    const deg = (x) => Math.round(x * 10) / 10;

    /* geometry: how far (in degrees) a drawn segment is from pointing at a vanishing point */
    const toVP = (l, vp) => {
      const far = Math.hypot(l.a[0] - vp[0], l.a[1] - vp[1]) > Math.hypot(l.b[0] - vp[0], l.b[1] - vp[1]) ? l.a : l.b;
      let a1 = (Math.atan2(-(vp[1] - far[1]), vp[0] - far[0]) * 180) / Math.PI; if (a1 < 0) a1 += 180; if (a1 >= 180) a1 -= 180;
      return G.angDiff(l.ang, a1);
    };
    S5.studioGeo = { toVP };
    /* ellipse measured against its box: centre, half-axes from the extremes, smoothness and the shape of the ends */
    const ellipseFit = (s) => {
      const P = G.pts(s); const xs = P.map((p) => p[0]), ys = P.map((p) => p[1]);
      const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, a = (x1 - x0) / 2, b = (y1 - y0) / 2;
      if (a < 5 || b < 3) return null;
      let res = 0; for (const p of P) res += Math.abs(Math.hypot((p[0] - cx) / a, (p[1] - cy) / b) - 1); res /= P.length;
      let endY = 0; for (const p of P) if (Math.abs(p[0] - cx) >= 0.9 * a) endY = Math.max(endY, Math.abs(p[1] - cy)); // a true ellipse: ≈ 0.44·b at 0.9·a
      // principal axis tilt from second moments (0 = major axis horizontal)
      let sxx = 0, syy = 0, sxy = 0; for (const p of P) { const dx = p[0] - cx, dy = p[1] - cy; sxx += dx * dx; syy += dy * dy; sxy += dx * dy; }
      const tilt = Math.abs((0.5 * Math.atan2(2 * sxy, sxx - syy) * 180) / Math.PI);
      const gap = Math.hypot(P[0][0] - P[P.length - 1][0], P[0][1] - P[P.length - 1][1]) / (Math.PI * (a + b));
      return { cx, cy, a, b, res, ends: endY / b, tilt, gap };
    };
    S5.studioGeo.ellipseFit = ellipseFit;

    /* ---------- lessons ---------- */
    const HY = 230, VP1 = [500, HY], VPL = [40, 210], VPR = [960, 210];
    const ELL_BOXES = [[90, 330, 240, 60], [380, 300, 240, 120], [670, 270, 240, 180]]; // x, y, w, h — flat → round
    const VASE = { axis: 500, top: 130, bottom: 630, ratio: 2 / 3 }; // width : height
    const box1 = [[[380, 400], [620, 400], [620, 600], [380, 600], [380, 400]], sline(380, 400, 450, 330), sline(620, 400, 550, 330), sline(450, 330, 550, 330), sline(620, 600, 557, 520), sline(550, 330, 557, 520)];
    const corner = [500, 330], cTop = [500, 620];
    const along = (p, vp, f) => [p[0] + (vp[0] - p[0]) * f, p[1] + (vp[1] - p[1]) * f];
    const L2 = along(corner, VPL, 0.35), R2 = along(corner, VPR, 0.35), L2b = along(cTop, VPL, 0.35), R2b = along(cTop, VPR, 0.35);
    const meet = (p1, v1, p2, v2) => { const d = (p1[0] - v1[0]) * (p2[1] - v2[1]) - (p1[1] - v1[1]) * (p2[0] - v2[0]); const t = ((p1[0] - p2[0]) * (p2[1] - v2[1]) - (p1[1] - p2[1]) * (p2[0] - v2[0])) / d; return [p1[0] + t * (v1[0] - p1[0]), p1[1] + t * (v1[1] - p1[1])]; };
    const BACK = meet(L2, VPR, R2, VPL); // hidden back corner of the top face
    const vaseDemo = (() => { const prof = [[0, 0.32], [0.08, 0.36], [0.2, 0.3], [0.35, 0.42], [0.55, 0.5], [0.75, 0.46], [0.92, 0.34], [1, 0.3]]; const H = VASE.bottom - VASE.top, half = (H * VASE.ratio) / 2;
      const right = prof.map(([t, w]) => [VASE.axis + (w / 0.5) * half, VASE.top + t * H]); const left = right.map(([x, y]) => [2 * VASE.axis - x, y]).reverse(); return [right, left, sline(right[0][0], right[0][1], left[left.length - 1][0], left[left.length - 1][1]), sline(right[right.length - 1][0], right[right.length - 1][1], left[0][0], left[0][1])]; })();

    const LESSONS = [
      { id: "L11", level: 2, week: "3–4", title: "Box in one-point perspective", ar: "صندوق بمنظور نقطة واحدة",
        say: "على ورقتك خط الأفق ونقطة التلاشي بالنص. ارسم صندوق تحت الأفق: الوجه الأمامي مستطيل (خطوط أفقية وعمودية)، وكل الحافات اللي ترجع لورا لازم تروح لنقطة التلاشي.",
        tip: "قبل ما ترسم الحافة الراجعة، حط المسطرة بعينك من الزاوية لنقطة التلاشي.",
        demo: box1, guides: [guideLine(0, HY, W, HY), S5.guideDot(VP1[0], VP1[1], 7)],
        check: { type: "vp1", vp: VP1, tol: 4, minH: 2, minV: 2, minR: 3 } },
      { id: "L12", level: 2, week: "4–5", title: "Cube in two-point perspective", ar: "مكعب بمنظور نقطتين",
        say: "هسه نقطتين تلاشي على طرفي الأفق. ارسم مكعب: الحافات العمودية عمودية تماماً، وكل حافة ثانية تروح لنقطة التلاشي اليسرى أو اليمنى. ماكو خطوط أفقية بمنظور النقطتين.",
        tip: "ابدأ بالحافة العمودية الأقرب لك، وبعدين وصّل طرفيها للنقطتين.",
        demo: [sline(corner[0], corner[1], cTop[0], cTop[1]), sline(corner[0], corner[1], L2[0], L2[1]), sline(corner[0], corner[1], R2[0], R2[1]), sline(cTop[0], cTop[1], L2b[0], L2b[1]), sline(cTop[0], cTop[1], R2b[0], R2b[1]), sline(L2[0], L2[1], L2b[0], L2b[1]), sline(R2[0], R2[1], R2b[0], R2b[1]), sline(L2[0], L2[1], BACK[0], BACK[1]), sline(R2[0], R2[1], BACK[0], BACK[1])],
        guides: [guideLine(0, 210, W, 210), S5.guideDot(VPL[0], VPL[1], 7), S5.guideDot(VPR[0], VPR[1], 7)],
        check: { type: "vp2", vps: [VPL, VPR], tol: 4, minV: 3, minEach: 2 } },
      { id: "L13", level: 2, week: "6–8", title: "Ellipses (circles in perspective)", ar: "القطوع الناقصة (الدائرة بالمنظور)",
        say: "الدائرة بالمنظور تصير قطع ناقص. ارسم بكل مستطيل قطع ناقص يلمس أضلاعه الأربعة: الأول مسطّح (قريب من مستوى العين) والأخير أدور. الأطراف مدوّرة مو مدببة.",
        tip: "دوّر بالهوا فوك المستطيل مرتين، وبعدين ارسم بحركة وحدة سريعة.",
        demo: ELL_BOXES.map(([x, y, w, h]) => ell(x + w / 2, y + h / 2, w / 2, h / 2)), guides: ELL_BOXES.map(([x, y, w, h]) => S5.guideRect(x, y, w, h)),
        check: { type: "ellipses", boxes: ELL_BOXES, fit: 0.12, res: 0.07, ends: 0.27, tilt: 5, gap: 0.08 } },
      { id: "L14", level: 2, week: "11–13", title: "Pottery: proportion and symmetry", ar: "الفخاريات: النسبة والتناظر",
        say: "على ورقتك محور عمودي وخطين للأعلى والأسفل. ارسم مزهرية متناظرة حول المحور: الجهة اليسرى صورة مرآة لليمنى، وعرضها الأكبر ثلثين ارتفاعها.",
        tip: "علّم أعرض نقطة على الجهتين بنفس البعد عن المحور قبل ما ترسم المنحني.",
        demo: vaseDemo, guides: [guideLine(VASE.axis, VASE.top - 30, VASE.axis, VASE.bottom + 30), guideLine(VASE.axis - 260, VASE.top, VASE.axis + 260, VASE.top), guideLine(VASE.axis - 260, VASE.bottom, VASE.axis + 260, VASE.bottom)],
        check: { type: "vase", ...VASE, ratioTol: 0.1, sym: 0.035, lean: 0.04, fill: 0.06 } },
      { id: "L15", level: 2, week: "6–8", title: "Cylinder", ar: "الأسطوانة",
        say: "ارسم أسطوانة واقفة تحت خط الأفق: قطع ناقص فوق وقطع ناقص تحت بنفس العرض ونفس المحور، وخطين عموديين يلمسون أطرافهم. القاعدة أبعد عن الأفق فتطلع أدور من الوجه العلوي.",
        tip: "القاعدة منحنية دائماً — لا ترسمها خط مستقيم.",
        demo: [ell(500, 300, 150, 40), ell(500, 590, 150, 62), sline(350, 300, 350, 590), sline(650, 300, 650, 590)],
        guides: [guideLine(0, 150, W, 150)],
        check: { type: "cylinder", horizon: 150, tol: 4, axis: 0.05, width: 0.1, side: 0.07 } },
      { id: "L16", level: 2, week: "9–10, 15–16", title: "Oblique cube", ar: "المكعب المائل",
        say: "المكعب مدوّر بزاوية: نقطة تلاشي قريبة يسار وأخرى بعيدة يمين. الوجه اللي يروح للنقطة القريبة يقصر بسرعة. نفس القواعد: العمودي عمودي، والباقي لنقطة التلاشي.",
        tip: "النقطة القريبة تخلي الوجه حاد التقاصر — لا تخلي الوجهين متساويين.",
        demo: (() => { const vl = [220, 200], vr = [1400, 200], a = [470, 330], b2 = [470, 600], f = 0.4, l0 = along(a, vl, f), l1 = along(b2, vl, f), r0 = along(a, vr, 0.25), r1 = along(b2, vr, 0.25), bk = meet(l0, vr, r0, vl); return [sline(a[0], a[1], b2[0], b2[1]), sline(a[0], a[1], l0[0], l0[1]), sline(b2[0], b2[1], l1[0], l1[1]), sline(l0[0], l0[1], l1[0], l1[1]), sline(a[0], a[1], r0[0], r0[1]), sline(b2[0], b2[1], r1[0], r1[1]), sline(r0[0], r0[1], r1[0], r1[1]), sline(l0[0], l0[1], bk[0], bk[1]), sline(r0[0], r0[1], bk[0], bk[1])]; })(),
        guides: [guideLine(0, 200, W, 200), S5.guideDot(220, 200, 7)],
        check: { type: "vp2", vps: [[220, 200], [1400, 200]], tol: 4, minV: 3, minEach: 2 } },
    ];
    for (const l of LESSONS) if (!S5.STUDIO_LESSONS.some((x) => x.id === l.id)) S5.STUDIO_LESSONS.push(l);

    /* ---------- checkers ---------- */
    const baseCheck = S5.studioCheck;
    S5.studioCheck = (lesson, strokes) => {
      const c = lesson.check, T = c.type;
      if (!["vp1", "vp2", "ellipses", "vase", "cylinder"].includes(T)) return baseCheck(lesson, strokes);
      const pens = G.pens(strokes), notes = [];
      if (!pens.length) return { ok: false, score: 0, notes: ["ارسم على الورقة أول."] };
      if (T === "vp1" || T === "vp2") {
        const L = pens.map((s) => G.line(s)).filter((l) => l.chord >= 40);
        const wobbly = L.filter((l) => l.straight < 0.9).length; if (wobbly) notes.push(`${wobbly} من خطوطك مو مستقيمة كفاية — ارسم الحافة بحركة وحدة.`);
        const S = L.filter((l) => l.straight >= 0.9);
        const vert = S.filter((l) => G.angDiff(l.ang, 90) <= c.tol), horiz = S.filter((l) => G.angDiff(l.ang, 0) <= c.tol);
        if (T === "vp1") {
          const rec = S.filter((l) => !vert.includes(l) && !horiz.includes(l)).map((l) => ({ l, e: toVP(l, c.vp) }));
          const good = rec.filter((r) => r.e <= c.tol), bad = rec.filter((r) => r.e > c.tol);
          if (horiz.length < c.minH || vert.length < c.minV) notes.push(`الوجه الأمامي: ${horiz.length} خط أفقي و${vert.length} عمودي (المطلوب ${c.minH} و${c.minV} على الأقل). الوجه المواجه لك بمنظور النقطة الواحدة مستطيل حقيقي.`);
          if (good.length < c.minR) notes.push(`الحافات الراجعة الصحيحة: ${good.length} من ${c.minR}.`);
          if (bad.length) notes.push(`${bad.length} حافة راجعة ما تروح لنقطة التلاشي (أكبر انحراف ${deg(Math.max(...bad.map((r) => r.e)))}°، المسموح ${c.tol}°). مدّها بعينك — لازم تمر بالنقطة.`);
          const parts = [Math.min(1, horiz.length / c.minH), Math.min(1, vert.length / c.minV), Math.min(1, good.length / c.minR)], score = (parts.reduce((a, b) => a + b, 0) / 3) * (bad.length ? 0.7 : 1) * (wobbly ? 0.85 : 1);
          return { ok: !bad.length && !wobbly && parts.every((p) => p === 1), score, notes, detail: { horiz: horiz.length, vert: vert.length, rec: rec.map((r) => deg(r.e)) } };
        }
        const rest = S.filter((l) => !vert.includes(l)).map((l) => { const e = c.vps.map((v) => toVP(l, v)); const k = e[0] <= e[1] ? 0 : 1; return { l, k, e: e[k] }; });
        const good = rest.filter((r) => r.e <= c.tol), bad = rest.filter((r) => r.e > c.tol), each = [0, 1].map((k) => good.filter((r) => r.k === k).length);
        const flat = bad.filter((r) => G.angDiff(r.l.ang, 0) <= c.tol).length;
        if (vert.length < c.minV) notes.push(`الحافات العمودية: ${vert.length} من ${c.minV}. بالمكعب ثلاث حافات عمودية تظهر.`);
        if (each[0] < c.minEach || each[1] < c.minEach) notes.push(`للنقطة اليسرى ${each[0]} حافة وللنقطة اليمنى ${each[1]} (المطلوب ${c.minEach} لكل وحدة).`);
        if (flat) notes.push(`رسمت ${flat} خط أفقي — بمنظور النقطتين ما أكو خطوط أفقية، كل حافة غير عمودية تروح لنقطة تلاشي.`);
        if (bad.length - flat > 0) notes.push(`${bad.length - flat} حافة ما تروح لأي نقطة تلاشي (أكبر انحراف ${deg(Math.max(...bad.map((r) => r.e)))}°، المسموح ${c.tol}°).`);
        const parts = [Math.min(1, vert.length / c.minV), Math.min(1, each[0] / c.minEach), Math.min(1, each[1] / c.minEach)], score = (parts.reduce((a, b) => a + b, 0) / 3) * (bad.length ? 0.7 : 1) * (wobbly ? 0.85 : 1);
        return { ok: !bad.length && !wobbly && parts.every((p) => p === 1), score, notes, detail: { vert: vert.length, each, bad: bad.map((r) => deg(r.e)) } };
      }
      if (T === "ellipses") {
        const fits = pens.map((s) => ellipseFit(s)).filter(Boolean); let pass = 0; const per = [];
        c.boxes.forEach(([x, y, w, h], i) => {
          const f = fits.filter((e) => e.cx > x && e.cx < x + w && e.cy > y && e.cy < y + h).sort((p, q) => Math.hypot(p.cx - x - w / 2, p.cy - y - h / 2) - Math.hypot(q.cx - x - w / 2, q.cy - y - h / 2))[0];
          const n = i + 1; if (!f) { notes.push(`المستطيل ${n}: ما لگيت قطع ناقص بداخله.`); per.push(0); return; }
          const errW = Math.abs(2 * f.a - w) / w, errH = Math.abs(2 * f.b - h) / h, issues = [];
          if (errW > c.fit || errH > c.fit) issues.push(`ما يلمس أضلاع المستطيل (العرض ${Math.round(2 * f.a)} من ${w}، الارتفاع ${Math.round(2 * f.b)} من ${h})`);
          if (f.ends < c.ends) issues.push("أطرافه مدببة مثل الليمونة — طرف القطع الناقص مدوّر دائماً");
          if (f.tilt > c.tilt) issues.push(`مايل ${deg(f.tilt)}° — محوره الكبير لازم يكون أفقي`);
          if (f.res > c.res) issues.push("المنحني مو منتظم — ارسمه بحركة وحدة أسرع");
          if (f.gap > c.gap) issues.push("مو مسكّر");
          if (issues.length) notes.push(`المستطيل ${n}: ${issues.join("؛ ")}.`); else pass++;
          per.push(issues.length ? Math.max(0, 1 - 0.3 * issues.length) : 1);
        });
        return { ok: pass === c.boxes.length, score: per.reduce((a, b) => a + b, 0) / c.boxes.length, notes, detail: { fits } };
      }
      if (T === "cylinder") {
        const items = pens.map((s) => ({ s, l: G.line(s), e: ellipseFit(s) }));
        const ells = items.filter((it) => it.e && it.e.gap <= 0.12 && it.e.b > 8).map((it) => it.e).sort((p, q) => p.cy - q.cy);
        const vert = items.filter((it) => it.l.chord >= 60 && it.l.straight >= 0.9 && G.angDiff(it.l.ang, 90) <= c.tol).map((it) => it.l);
        const flatBase = items.some((it) => it.l.chord >= 60 && it.l.straight >= 0.95 && G.angDiff(it.l.ang, 0) <= c.tol);
        const issues = [];
        if (ells.length < 2) { notes.push(flatBase ? "القاعدة مرسومة خط مستقيم — قاعدة الأسطوانة قطع ناقص (منحنية) مثل الوجه العلوي." : `رسمت ${ells.length} قطع ناقص من 2 (فوق وتحت).`); return { ok: false, score: 0.2 * ells.length, notes }; }
        const top = ells[0], bot = ells[ells.length - 1], H = bot.cy - top.cy || 1;
        if (Math.abs(top.cx - bot.cx) / H > c.axis) issues.push("القطعين مو على نفس المحور — الأسطوانة طالعة مايلة.");
        if (Math.abs(top.a - bot.a) / Math.max(top.a, bot.a) > c.width) issues.push(`عرض القطعين مو متساوي (${Math.round(2 * top.a)} و${Math.round(2 * bot.a)}).`);
        if (bot.b / bot.a <= top.b / top.a * 1.05) issues.push("القاعدة لازم تكون أدور من الوجه العلوي لأنها أبعد عن خط الأفق — رسمتهم بنفس الانفتاح أو بالعكس.");
        if (vert.length < 2) issues.push(`الجوانب العمودية: ${vert.length} من 2.`);
        else { const xs = vert.map((l) => l.mid[0]).sort((p, q) => p - q), L0 = xs[0], R0 = xs[xs.length - 1], a = (top.a + bot.a) / 2, cx = (top.cx + bot.cx) / 2;
          if (Math.abs(L0 - (cx - a)) / a > c.side || Math.abs(R0 - (cx + a)) / a > c.side) issues.push("الجوانب ما تلمس أطراف القطعين — الخط العمودي يبدأ من أعرض نقطة بالقطع الناقص."); }
        notes.push(...issues);
        return { ok: !issues.length, score: Math.max(0, 1 - 0.25 * issues.length), notes, detail: { top, bot, vert: vert.length } };
      }
      // vase: proportion, lean and mirror symmetry about the axis
      const P = pens.flatMap((s) => G.pts(s)).map((p) => [p[0], p[1]]); const xs = P.map((p) => p[0]), ys = P.map((p) => p[1]);
      const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), H = y1 - y0, Wd = x1 - x0, target = c.bottom - c.top;
      if (H < 0.5 * target) return { ok: false, score: 0.1, notes: ["المزهرية صغيرة — خليها تملأ المسافة بين الخطين."] };
      const ratio = Wd / H, lean = Math.abs((x0 + x1) / 2 - c.axis) / H;
      let sum = 0; const step = Math.max(1, Math.floor(P.length / 300)); let n = 0;
      for (let i = 0; i < P.length; i += step) { const m = [2 * c.axis - P[i][0], P[i][1]]; let best = 1e9; for (let j = 0; j < P.length; j += step) best = Math.min(best, Math.hypot(P[j][0] - m[0], P[j][1] - m[1])); sum += best; n++; }
      const sym = sum / n / H, fill = Math.max(Math.abs(y0 - c.top), Math.abs(y1 - c.bottom)) / target, issues = [];
      if (Math.abs(ratio - c.ratio) > c.ratioTol * c.ratio) issues.push(`نسبة العرض للارتفاع ${ratio.toFixed(2)} والمطلوب ${c.ratio.toFixed(2)} (ثلثين) — ${ratio > c.ratio ? "عريضة زيادة" : "نحيفة زيادة"}.`);
      if (lean > c.lean) issues.push(`مزاحة عن المحور ${Math.round(lean * 100)}% من ارتفاعها — خلي المحور بالنص بالضبط.`);
      if (sym > c.sym) issues.push(`الجهتين مو متناظرتين (فرق ${Math.round(sym * 1000) / 10}% من الارتفاع، المسموح ${c.sym * 100}%). قيس كل نقطة يمين المحور ويساره.`);
      if (fill > c.fill) issues.push("ما تبدي من الخط العلوي وتنتهي بالخط السفلي.");
      notes.push(...issues);
      return { ok: !issues.length, score: Math.max(0, 1 - 0.25 * issues.length), notes, detail: { ratio, lean, sym, fill } };
    };

    /* the board shows the correction: each edge redrawn through its vanishing point, the ideal ellipse, the mirrored half */
    const baseCorr = S5.studioCorrection;
    S5.studioCorrection = (L, strokes) => {
      const T = L.check.type; if (!["vp1", "vp2", "ellipses", "vase", "cylinder"].includes(T)) return baseCorr(L, strokes);
      const cv = document.getElementById("st-board"); if (!cv) return; const pens = G.pens(strokes); if (!pens.length) return;
      cancelAnimationFrame(S5.studio.raf);
      const w = cv.clientWidth, h = cv.clientHeight, dpr = devicePixelRatio || 1, x = cv.getContext("2d"); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, w, h);
      const s = Math.min(w / S5.STUDIO_W, h / S5.STUDIO_H) * 0.92; x.save(); x.translate((w - S5.STUDIO_W * s) / 2, (h - S5.STUDIO_H * s) / 2); x.scale(s, s); x.lineCap = "round";
      const path = (P, col, wd, dash) => { x.strokeStyle = col; x.lineWidth = wd; x.setLineDash(dash || []); x.beginPath(); P.forEach((p, i) => (i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]))); x.stroke(); };
      const WHITE = "rgba(245,245,235,.9)", YEL = "rgba(255,214,90,.95)", c = L.check;
      for (const st of pens) path(G.pts(st), WHITE, 3);
      if (T === "vp1" || T === "vp2") {
        const vps = T === "vp1" ? [c.vp] : c.vps; path([[0, vps[0][1]], [S5.STUDIO_W, vps[vps.length - 1][1]]], YEL, 1.5, [6, 6]);
        for (const st of pens) { const l = G.line(st); if (l.chord < 40 || G.angDiff(l.ang, 90) <= c.tol || (T === "vp1" && G.angDiff(l.ang, 0) <= c.tol)) continue; const v = vps.reduce((b, q) => (toVP(l, q) < toVP(l, b) ? q : b)); const near = Math.hypot(l.a[0] - v[0], l.a[1] - v[1]) < Math.hypot(l.b[0] - v[0], l.b[1] - v[1]) ? l.b : l.a; path([near, v], YEL, 2, [10, 7]); }
      }
      if (T === "ellipses") for (const [bx, by, bw, bh] of c.boxes) path(ell(bx + bw / 2, by + bh / 2, bw / 2, bh / 2), YEL, 2.5, [10, 7]);
      if (T === "cylinder") { const E = pens.map((st) => ellipseFit(st)).filter((e) => e && e.gap <= 0.12 && e.b > 8).sort((p, q) => p.cy - q.cy); if (E.length >= 2) { const t = E[0], bt = E[E.length - 1], cx = (t.cx + bt.cx) / 2, a = (t.a + bt.a) / 2, bb = Math.max(bt.b, (t.b / t.a) * a * 1.4); path(ell(cx, t.cy, a, t.b), YEL, 2, [10, 7]); path(ell(cx, bt.cy, a, bb), YEL, 2, [10, 7]); path([[cx - a, t.cy], [cx - a, bt.cy]], YEL, 2, [10, 7]); path([[cx + a, t.cy], [cx + a, bt.cy]], YEL, 2, [10, 7]); } }
      if (T === "vase") { path([[c.axis, c.top - 30], [c.axis, c.bottom + 30]], YEL, 1.5, [6, 6]); for (const st of pens) path(G.pts(st).map((p) => [2 * c.axis - p[0], p[1]]), YEL, 2, [8, 6]); }
      x.restore(); x.setLineDash([]); x.fillStyle = "rgba(245,245,235,.85)"; x.font = "600 13px sans-serif"; x.direction = "rtl"; x.fillText(T === "vase" ? "أبيض = رسمتك · أصفر = صورتها بالمرآة" : "أبيض = رسمتك · أصفر = الصحيح", w - 12, h - 10);
    };
  } catch (e) { (S5.COLLEGE_ERRORS = S5.COLLEGE_ERRORS || []).push("40-studio-l2: " + (e && e.message)); console.error(e); }
})();
