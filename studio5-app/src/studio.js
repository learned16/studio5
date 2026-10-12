/* The Studio (المرسم) — a virtual drawing room under Practice.
   A chalkboard where the teacher demonstrates each step, your paper on the desk, a tool tray, and a ladder of
   lessons from "can't hold the pen" upward. Every task is checked on the device (free, unlimited): straightness,
   angle, accuracy to points, evenness, pressure, circularity, proportion. Later levels unlock tools and
   "draw this" commands. Spec: Drawing Coach (15.2 Lite / 15.3 Advanced) on the Shared Ink Engine. */
S5.studio = {};
S5.STUDIO_W = 1000; S5.STUDIO_H = 700;

/* ---------- geometry of strokes (doc units; stroke points are stored ×10 with pressure ×100) ---------- */
S5.sg = {
  pts(s) { const o = []; for (let i = 0; i < s.p.length; i += 3) o.push([s.p[i] / 10, s.p[i + 1] / 10, s.p[i + 2] / 100]); return o; },
  pens(strokes) { return strokes.filter((s) => s.t === "pen" && s.p.length >= 6); },
  len(P) { let l = 0; for (let i = 1; i < P.length; i++) l += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); return l; },
  line(s) { // endpoints, chord, straightness (1 - max deviation / chord), angle 0..180 (0 = horizontal)
    const P = this.pts(s), a = P[0], b = P[P.length - 1], chord = Math.hypot(b[0] - a[0], b[1] - a[1]); let dev = 0;
    for (const p of P) dev = Math.max(dev, S5.segDist(p[0], p[1], a[0], a[1], b[0], b[1]));
    let ang = (Math.atan2(-(b[1] - a[1]), b[0] - a[0]) * 180) / Math.PI; if (ang < 0) ang += 180; if (ang >= 180) ang -= 180;
    return { a, b, chord, len: this.len(P), straight: chord ? 1 - dev / chord : 0, ang, mid: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], pr: P.reduce((m, p) => m + p[2], 0) / P.length };
  },
  angDiff(a, b) { const d = Math.abs(a - b) % 180; return Math.min(d, 180 - d); },
  circle(s) {
    const P = this.pts(s); const cx = P.reduce((m, p) => m + p[0], 0) / P.length, cy = P.reduce((m, p) => m + p[1], 0) / P.length;
    const r = P.map((p) => Math.hypot(p[0] - cx, p[1] - cy)); const mr = r.reduce((a, b) => a + b, 0) / r.length; const sd = Math.sqrt(r.reduce((a, b) => a + (b - mr) ** 2, 0) / r.length);
    const gap = Math.hypot(P[0][0] - P[P.length - 1][0], P[0][1] - P[P.length - 1][1]);
    return { cx, cy, r: mr, round: mr ? 1 - sd / mr : 0, closed: mr ? gap / (2 * Math.PI * mr) : 1, len: this.len(P) };
  },
  bbox(list) { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const s of list) for (const p of this.pts(s)) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); } return [x0, y0, x1, y1]; },
  clusters(strokes, gap = 18) { // strokes whose boxes touch form one drawn shape
    const items = strokes.map((s) => ({ s: [s], b: this.bbox([s]) })); let merged = true;
    while (merged) { merged = false; for (let i = 0; i < items.length && !merged; i++) for (let j = i + 1; j < items.length; j++) { const A = items[i].b, B = items[j].b; if (A[0] - gap <= B[2] && B[0] - gap <= A[2] && A[1] - gap <= B[3] && B[1] - gap <= A[3]) { items[i].s.push(...items[j].s); items[i].b = [Math.min(A[0], B[0]), Math.min(A[1], B[1]), Math.max(A[2], B[2]), Math.max(A[3], B[3])]; items.splice(j, 1); merged = true; break; } } }
    return items;
  },
  rectness(c) { // share of drawn points lying near the cluster's bounding box edges
    const [x0, y0, x1, y1] = c.b, w = x1 - x0, h = y1 - y0, tol = Math.max(8, 0.1 * Math.min(w, h)); let n = 0, near = 0;
    for (const s of c.s) for (const p of this.pts(s)) { n++; if (Math.min(Math.abs(p[0] - x0), Math.abs(p[0] - x1), Math.abs(p[1] - y0), Math.abs(p[1] - y1)) <= tol) near++; }
    return n ? near / n : 0;
  },
};
/* guide marks drawn faintly on the paper (as ink "ghost" strokes) */
S5.guideDot = (x, y, r = 5) => { const p = []; for (let k = 0; k <= 12; k++) { const t = (k / 12) * Math.PI * 2; p.push(Math.round((x + r * Math.cos(t)) * 10), Math.round((y + r * Math.sin(t)) * 10), 60); } return { t: "pen", c: "#1f4fa8", w: 3, p }; };
S5.guideRect = (x, y, w, h) => ({ t: "pen", c: "#1f4fa8", w: 1.5, p: [[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]].flatMap(([a, b]) => [a * 10, b * 10, 50]) });
const sline = (x1, y1, x2, y2) => [[x1, y1], [x2, y2]];
const scircle = (cx, cy, r) => Array.from({ length: 41 }, (_, k) => [cx + r * Math.cos((k / 40) * Math.PI * 2), cy + r * Math.sin((k / 40) * Math.PI * 2)]);

/* ---------- the curriculum: level 1 — the basics (each task has a board demo, guides and a checker) ---------- */
const CONNECT = [[120, 110, 420, 130], [560, 90, 880, 230], [140, 300, 380, 520], [620, 330, 900, 300], [180, 610, 520, 640], [640, 600, 860, 420]];
const VALUE_BOXES = [[90, 250, 170, 200], [300, 250, 170, 200], [510, 250, 170, 200], [720, 250, 170, 200]];
S5.STUDIO_LESSONS = [
  { id: "L1", title: "Hold the pen & warm up", ar: "مسكة القلم والإحماء",
    say: "امسك القلم بعيد عن الرأس شوية، وخلي معصمك مرتاح. ارسم خطوط حرة طويلة بحركة من الكتف مو من الأصابع. ما يهم الشكل — المهم الحركة السلسة.",
    tip: "الخط السريع الواثق أحسن من البطيء المرتجف.",
    demo: [[[150, 150], [300, 110], [480, 170], [650, 120], [850, 160]], [[160, 330], [400, 260], [620, 380], [860, 300]], [[180, 520], [420, 600], [700, 480], [880, 560]]],
    check: { type: "free", n: 12, minLen: 150 } },
  { id: "L2", title: "Horizontal lines", ar: "الخطوط الأفقية",
    say: "ارسم 8 خطوط أفقية طويلة، كل وحدة بحركة وحدة سريعة. انظر لنهاية الخط وانت ترسم، مو لرأس القلم.",
    tip: "حرّك ذراعك كلها، والمعصم ثابت.",
    demo: [0, 1, 2, 3].map((i) => sline(150, 160 + i * 120, 850, 160 + i * 120)),
    check: { type: "lines", n: 8, angle: 0, tol: 4, minLen: 300, straight: 0.95 } },
  { id: "L3", title: "Vertical lines", ar: "الخطوط العمودية",
    say: "هسه 8 خطوط عمودية من فوك لجوّا. ممكن تدوّر الورقة شوية إذا يريحك، بس الخط لازم يطلع عمودي.",
    tip: "ابدأ من نقطة فوك وعينك على المكان اللي توصله.",
    demo: [0, 1, 2, 3, 4].map((i) => sline(200 + i * 150, 120, 200 + i * 150, 580)),
    check: { type: "lines", n: 8, angle: 90, tol: 4, minLen: 300, straight: 0.95 } },
  { id: "L4", title: "Diagonals", ar: "الخطوط المائلة 45°",
    say: "ارسم 4 خطوط مائلة 45° لليمين و4 لليسار. تخيّل قطر مربع.",
    tip: "الزاوية 45 تعني الخط يصعد بقدر ما يمشي.",
    demo: [sline(150, 600, 450, 300), sline(250, 600, 550, 300), sline(550, 300, 850, 600), sline(450, 300, 750, 600)],
    check: { type: "diagonals", n: 4, tol: 6, minLen: 200, straight: 0.94 } },
  { id: "L5", title: "Connect the dots", ar: "وصل النقاط",
    say: "على ورقتك أكو 6 أزواج نقاط. وصّل كل نقطتين بخط مستقيم وحد. ركّز على النقطة اللي رايح لها.",
    tip: "حرّك القلم بالهوا فوك الخط مرتين قبل ما ترسم (Ghosting).",
    demo: CONNECT.map(([a, b, c, d]) => sline(a, b, c, d)),
    guides: CONNECT.flatMap(([a, b, c, d]) => [S5.guideDot(a, b), S5.guideDot(c, d)]),
    check: { type: "connect", pairs: CONNECT, tol: 14, straight: 0.94 } },
  { id: "L6", title: "Even parallel lines", ar: "خطوط متوازية بمسافات متساوية",
    say: "ارسم 10 خطوط متوازية (أفقية أو مائلة، بكيفك) والمسافة بينها متساوية. هذا أساس التهشير.",
    tip: "خلي عينك على الخط اللي قبله حتى تحافظ على المسافة.",
    demo: Array.from({ length: 8 }, (_, i) => sline(200, 150 + i * 55, 800, 150 + i * 55)),
    check: { type: "parallel", n: 10, spread: 4, cv: 0.3, minLen: 200 } },
  { id: "L7", title: "Pressure control", ar: "التحكم بالضغط",
    say: "ارسم أول 3 خطوط خفيفة جداً (لمسة)، وبعدها 3 خطوط غامقة بضغط أقوى. هذا يعلمك تفرّق بين خط البناء والخط النهائي.",
    tip: "خطوط البناء خفيفة دائماً — الغامق للنهاية بس.",
    demo: [sline(200, 180, 800, 180), sline(200, 250, 800, 250), sline(200, 320, 800, 320), sline(200, 440, 800, 440), sline(200, 510, 800, 510), sline(200, 580, 800, 580)],
    check: { type: "pressure", light: 3, dark: 3 } },
  { id: "L8", title: "Circles", ar: "الدوائر",
    say: "ارسم 5 دوائر بحجم كف اليد تقريباً. دوّر بالهوا مرتين وبعدين انزل بالقلم وارسمها بحركة وحدة.",
    tip: "الدائرة السريعة أدور من البطيئة.",
    demo: [scircle(250, 230, 110), scircle(550, 230, 110), scircle(400, 480, 110), scircle(750, 470, 90)],
    check: { type: "circles", n: 5, round: 0.86, closed: 0.12, minR: 40 } },
  { id: "L9", title: "Squares & rectangles", ar: "المربعات والمستطيلات",
    say: "ارسم 3 مربعات (أضلاعها متساوية) و2 مستطيل طوله ضعف عرضه. كل شكل لحاله، وبينها مسافة.",
    tip: "ارسم الضلعين الأفقيين أول، وبعدين العموديين.",
    demo: [[[150, 150], [330, 150], [330, 330], [150, 330], [150, 150]], [[420, 150], [600, 150], [600, 330], [420, 330], [420, 150]], [[150, 420], [510, 420], [510, 600], [150, 600], [150, 420]]],
    check: { type: "shapes", squares: 3, rects2: 2, tol: 0.15, rect: 0.8 } },
  { id: "L10", title: "Value scale (hatching)", ar: "سلّم القيم بالتهشير",
    say: "أكو 4 مربعات على ورقتك. هشّرها من الفاتح للغامق: الأول خطوط قليلة متباعدة، وكل مربع بعده خطوط أكثر وأقرب.",
    tip: "القيمة (الظل) تجي من كثافة الخطوط، مو من الضغط بس.",
    demo: VALUE_BOXES.flatMap(([x, y, w, h], k) => [[[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]], ...Array.from({ length: 3 + k * 4 }, (_, i) => sline(x + 6, y + ((i + 1) * h) / (4 + k * 4), x + w - 6, y + ((i + 1) * h) / (4 + k * 4)))]),
    guides: VALUE_BOXES.map(([x, y, w, h]) => S5.guideRect(x, y, w, h)),
    check: { type: "values", boxes: VALUE_BOXES } },
];

/* ---------- the checkers: return { ok, score 0..1, notes[] } with concrete Arabic feedback ---------- */
S5.studioCheck = (lesson, strokes) => {
  const G = S5.sg, c = lesson.check, pens = G.pens(strokes), notes = []; const deg = (x) => Math.round(x * 10) / 10;
  if (!pens.length) return { ok: false, score: 0, notes: ["ارسم على الورقة أول."] };
  if (c.type === "free") {
    const long = pens.filter((s) => G.len(G.pts(s)) >= c.minLen).length;
    if (long < c.n) notes.push(`رسمت ${long} خط طويل من ${c.n}. خليها أطول (حركة من الكتف).`);
    return { ok: long >= c.n, score: Math.min(1, long / c.n), notes };
  }
  if (c.type === "lines" || c.type === "diagonals") {
    const L = pens.map((s) => G.line(s)).filter((l) => l.chord >= c.minLen * 0.5);
    const target = c.type === "lines" ? [c.angle] : [45, 135];
    const good = L.filter((l) => l.chord >= c.minLen && l.straight >= c.straight && Math.min(...target.map((t) => G.angDiff(l.ang, t))) <= c.tol);
    const avgOff = L.length ? L.reduce((m, l) => m + Math.min(...target.map((t) => G.angDiff(l.ang, t))), 0) / L.length : 0;
    const avgSt = L.length ? L.reduce((m, l) => m + l.straight, 0) / L.length : 0;
    if (L.length < c.n) notes.push(`رسمت ${L.length} من ${c.n} خطوط.`);
    if (avgOff > c.tol) notes.push(`خطوطك مايلة بالمعدل ${deg(avgOff)}° عن المطلوب (المسموح ${c.tol}°). صحّح وضع الورقة أو اتجاه ذراعك.`);
    if (avgSt < c.straight) notes.push(`الاستقامة ${Math.round(avgSt * 100)}% (المطلوب ${Math.round(c.straight * 100)}%). ارسم أسرع وبحركة وحدة — البطء يخلي الخط يرجف.`);
    if (L.some((l) => l.chord < c.minLen)) notes.push("بعض الخطوط قصيرة — خليها تمتد على عرض الورقة تقريباً.");
    if (c.type === "diagonals") { const r = good.filter((l) => G.angDiff(l.ang, 45) <= c.tol).length, lft = good.filter((l) => G.angDiff(l.ang, 135) <= c.tol).length; if (r < c.n || lft < c.n) notes.push(`المائل لليمين: ${r}/${c.n} · المائل لليسار: ${lft}/${c.n}.`); const ok = r >= c.n && lft >= c.n; return { ok, score: Math.min(1, (r + lft) / (2 * c.n)), notes }; }
    return { ok: good.length >= c.n, score: Math.min(1, good.length / c.n), notes };
  }
  if (c.type === "connect") {
    const L = pens.map((s) => G.line(s)); let hit = 0, worst = 0;
    for (const [x1, y1, x2, y2] of c.pairs) {
      let best = 1e9, bl = null; for (const l of L) { const e = Math.min(Math.max(Math.hypot(l.a[0] - x1, l.a[1] - y1), Math.hypot(l.b[0] - x2, l.b[1] - y2)), Math.max(Math.hypot(l.a[0] - x2, l.a[1] - y2), Math.hypot(l.b[0] - x1, l.b[1] - y1))); if (e < best) { best = e; bl = l; } }
      if (bl && best <= c.tol && bl.straight >= c.straight) hit++; worst = Math.max(worst, Math.min(best, 999));
    }
    if (hit < c.pairs.length) notes.push(`وصلت ${hit} من ${c.pairs.length} بدقة. أكبر ابتعاد عن النقطة ${Math.round(worst)} وحدة (المسموح ${c.tol}). انظر للنقطة الهدف مو للقلم.`);
    return { ok: hit === c.pairs.length, score: hit / c.pairs.length, notes };
  }
  if (c.type === "parallel") {
    const L = pens.map((s) => G.line(s)).filter((l) => l.chord >= c.minLen);
    if (L.length < c.n) { notes.push(`رسمت ${L.length} من ${c.n} خطوط طويلة.`); return { ok: false, score: L.length / c.n * 0.5, notes }; }
    const m = L.reduce((a, l) => a + l.ang, 0) / L.length; const spread = Math.sqrt(L.reduce((a, l) => a + G.angDiff(l.ang, m) ** 2, 0) / L.length);
    const th = (m * Math.PI) / 180, nx = Math.sin(th), ny = Math.cos(th); // offset along the normal
    const off = L.map((l) => l.mid[0] * nx + l.mid[1] * ny).sort((a, b) => a - b); const gaps = off.slice(1).map((v, i) => v - off[i]); const gm = gaps.reduce((a, b) => a + b, 0) / gaps.length; const cv = gm ? Math.sqrt(gaps.reduce((a, g) => a + (g - gm) ** 2, 0) / gaps.length) / gm : 1;
    if (spread > c.spread) notes.push(`الخطوط مو متوازية تماماً: الفرق بالاتجاه ${deg(spread)}° (المسموح ${c.spread}°).`);
    if (cv > c.cv) notes.push(`المسافات بين الخطوط مو متساوية (تذبذب ${Math.round(cv * 100)}%، المسموح ${Math.round(c.cv * 100)}%).`);
    const ok = spread <= c.spread && cv <= c.cv; return { ok, score: ok ? 1 : Math.max(0, 1 - Math.max(spread / (c.spread * 3), cv / (c.cv * 3))), notes };
  }
  if (c.type === "pressure") {
    const L = pens.map((s) => G.line(s)); if (L.length < c.light + c.dark) { notes.push(`ارسم ${c.light} خطوط خفيفة ثم ${c.dark} غامقة.`); return { ok: false, score: 0, notes }; }
    const flat = L.every((l) => Math.abs(l.pr - 0.5) < 0.02);
    if (flat) { notes.push("جهازك ما دز ضغط القلم (أو رسمت بالإصبع). جرّب بالـ M-Pencil — هسه أعدّيه لك على أساس عدد الخطوط."); return { ok: true, score: 0.7, notes, noPressure: true }; }
    const light = L.slice(0, c.light).reduce((a, l) => a + l.pr, 0) / c.light, dark = L.slice(c.light, c.light + c.dark).reduce((a, l) => a + l.pr, 0) / c.dark;
    const ok = dark - light >= 0.15; if (!ok) notes.push(`الفرق بالضغط قليل: الخفيف ${Math.round(light * 100)}% والغامق ${Math.round(dark * 100)}%. خفّف أكثر بالأولى واضغط أكثر بالأخيرة.`);
    return { ok, score: ok ? 1 : Math.max(0, (dark - light) / 0.15), notes };
  }
  if (c.type === "circles") {
    const C = pens.map((s) => G.circle(s)).filter((x) => x.r >= c.minR * 0.6); const good = C.filter((x) => x.round >= c.round && x.closed <= c.closed && x.r >= c.minR);
    if (C.length < c.n) notes.push(`رسمت ${C.length} من ${c.n} دوائر.`);
    const avgR = C.length ? C.reduce((a, x) => a + x.round, 0) / C.length : 0; if (C.length && avgR < c.round) notes.push(`الاستدارة ${Math.round(avgR * 100)}% (المطلوب ${Math.round(c.round * 100)}%). الدائرة طالعة بيضوية — ارسمها أسرع ومن الكتف.`);
    if (C.some((x) => x.closed > c.closed)) notes.push("بعض الدوائر ما مسكّرة — خلي النهاية ترجع للبداية.");
    return { ok: good.length >= c.n, score: Math.min(1, good.length / c.n), notes };
  }
  if (c.type === "shapes") {
    const K = G.clusters(pens).filter((k) => k.b[2] - k.b[0] > 60 && k.b[3] - k.b[1] > 40); let sq = 0, rc = 0;
    for (const k of K) { const w = k.b[2] - k.b[0], h = k.b[3] - k.b[1], r = Math.max(w, h) / Math.min(w, h), rect = G.rectness(k); if (rect < c.rect) continue; if (Math.abs(r - 1) <= c.tol) sq++; else if (Math.abs(r - 2) <= c.tol * 2) rc++; }
    if (sq < c.squares) notes.push(`مربعات صحيحة: ${sq}/${c.squares} — الأضلاع لازم تكون متساوية (الفرق أقل من ${Math.round(c.tol * 100)}%).`);
    if (rc < c.rects2) notes.push(`مستطيلات 2:1 صحيحة: ${rc}/${c.rects2} — الطول ضعف العرض.`);
    if (K.some((k) => G.rectness(k) < c.rect)) notes.push("بعض الأشكال أضلاعها مو مستقيمة أو الزوايا مدوّرة.");
    return { ok: sq >= c.squares && rc >= c.rects2, score: Math.min(1, (Math.min(sq, c.squares) + Math.min(rc, c.rects2)) / (c.squares + c.rects2)), notes };
  }
  if (c.type === "values") {
    const L = pens.map((s) => G.line(s)); const cnt = c.boxes.map(([x, y, w, h]) => L.filter((l) => l.mid[0] > x && l.mid[0] < x + w && l.mid[1] > y && l.mid[1] < y + h).length);
    const inc = cnt.every((n, i) => i === 0 || n > cnt[i - 1]); const ok = inc && cnt[0] >= 2 && cnt[3] >= cnt[0] * 2.5;
    if (!ok) notes.push(`عدد الخطوط بكل مربع: ${cnt.join(" ← ")}. لازم يزيد بوضوح من الأول للأخير (الأخير ضعفين ونص الأول على الأقل).`);
    return { ok, score: ok ? 1 : cnt.filter((n, i) => i === 0 || n > cnt[i - 1]).length / 4, notes };
  }
  return { ok: false, score: 0, notes: ["?"] };
};

/* ---------- progress ---------- */
S5.studioProg = {
  all() { return S5.store.meta.studioProg || {}; },
  async save(id, res) { const all = { ...this.all() }; const p = all[id] || { tries: 0, best: 0 }; p.tries++; p.best = Math.max(p.best, res.score); p.passed = p.passed || res.ok; p.at = S5.now(); all[id] = p; await S5.store.setMeta("studioProg", all); },
  unlocked(i) { return i === 0 || !!(this.all()[S5.STUDIO_LESSONS[i - 1].id] || {}).passed; },
  level1Done() { return S5.STUDIO_LESSONS.every((l) => (this.all()[l.id] || {}).passed); },
};

/* ---------- the room ---------- */
S5.STUDIO_TOOLS = [
  { k: "2H", ar: "قلم 2H", c: "#7d838d", w: 1.3, kind: "pencil" }, { k: "HB", ar: "قلم HB", c: "#3b4049", w: 2, kind: "pencil" }, { k: "2B", ar: "قلم 2B", c: "#15181e", w: 2.9, kind: "pencil" },
  { k: "0.1", ar: "حبر 0.1", c: "#000", w: 1, kind: "pen" }, { k: "0.3", ar: "حبر 0.3", c: "#000", w: 2.2, kind: "pen" }, { k: "0.5", ar: "حبر 0.5", c: "#000", w: 3.4, kind: "pen" },
];
S5.STUDIO_LOCKED = [["T", "مسطرة T"], ["◺", "مثلث 45°"], ["◿", "مثلث 30/60"], ["⌖", "فرجال"], ["📏", "مسطرة مقياس"]];
S5.views.studio = (r) => {
  const P = S5.studioProg; const i = Math.max(0, S5.STUDIO_LESSONS.findIndex((l) => l.id === r.id)); const L = S5.STUDIO_LESSONS[r.id ? i : Math.max(0, S5.STUDIO_LESSONS.findIndex((l, k) => !(P.all()[l.id] || {}).passed && P.unlocked(k)))] || S5.STUDIO_LESSONS[0];
  const idx = S5.STUDIO_LESSONS.indexOf(L); const all = P.all(); const tool = S5.ls.get("studioTool", "HB");
  S5.ui.mount(() => S5.bindStudio(L));
  const ladder = S5.STUDIO_LESSONS.map((l, k) => { const p = all[l.id] || {}; const open = P.unlocked(k); return `<button class="st-step${l === L ? " on" : ""}${p.passed ? " done" : ""}" ${open ? `data-act="open" data-v="studio" data-id="${l.id}"` : "disabled"} title="${S5.esc(l.ar)}">${p.passed ? "✓" : open ? k + 1 : "🔒"}</button>`; }).join("");
  return `<div class="studio" id="studio">
    <div class="st-wall">
      <div class="st-window" aria-hidden="true"></div>
      <div class="st-board"><div class="st-board-frame"><canvas id="st-board"></canvas><div class="st-chalk-label">${S5.esc(L.ar)}</div></div>
        <div class="st-teacher"><div class="st-avatar" aria-hidden="true">👨‍🏫</div><div class="st-bubble" dir="rtl"><b>${S5.esc(L.ar)}</b><p id="st-say">${S5.esc(L.say)}</p><p class="st-tip">💡 ${S5.esc(L.tip)}</p><div class="row">${H.btn("▶ Show me again", "st-demo", {}, "sm")}${H.btn("🔊", "st-voice", {}, "sm")}</div></div></div>
      </div>
      <div class="st-ladder" dir="ltr"><span class="tiny">Level 1 — Basics</span>${ladder}<span class="tiny muted">${P.level1Done() ? "Level 2 unlocked ✓" : "Level 2: perspective & “draw this” — after the basics"}</span></div>
    </div>
    <div class="st-desk">
      <div class="st-tray" dir="ltr">${S5.STUDIO_TOOLS.map((t) => `<button class="st-tool ${t.kind}${t.k === tool ? " on" : ""}" data-st-tool="${t.k}" title="${S5.esc(t.ar)}"><i style="background:${t.c};height:${Math.max(2, t.w * 1.6)}px"></i><span>${t.k}</span></button>`).join("")}<button class="st-tool eraser" data-st-tool="eraser" title="ممحاة"><i></i><span>⌫</span></button><span class="st-sep"></span>${S5.STUDIO_LOCKED.map(([g, n]) => `<button class="st-tool locked" disabled title="${S5.esc(n)} — تنفتح بالمرحلة الثانية"><span class="g">${g}</span><span>🔒</span></button>`).join("")}<span class="st-sep"></span><button class="btn sm" data-act="st-undo">↶</button><button class="btn sm" data-act="st-clear">Clear</button><span class="tiny" id="st-pen"></span></div>
      <div class="st-paper"><div id="st-ink" class="ink-wrap"></div></div>
      <div class="st-result" id="st-result"></div>
      <div class="row st-actions">${H.btn("✓ Check my drawing", "st-check", { id: L.id }, "primary")}${idx < S5.STUDIO_LESSONS.length - 1 && P.unlocked(idx + 1) ? H.btn("Next lesson →", "open", { v: "studio", id: S5.STUDIO_LESSONS[idx + 1].id }) : ""}${H.btn("← Practice", "go", { v: "practice" }, "sm")}</div>
    </div>
  </div>`;
};
S5.bindStudio = (L) => {
  const doc = { id: S5.uid("ink"), type: "inkpage", title: L.ar, strokes: [], layers: [{ n: "Paper", v: true }], template: "blank", width: S5.STUDIO_W, height: S5.STUDIO_H, createdAt: S5.now() };
  S5.studio = { L, doc };
  const ink = new S5.Ink(document.getElementById("st-ink"), { doc, noToolbar: true, ghost: L.guides || null, onChange: (st) => { doc.strokes = st; } });
  ink.ghostAlpha = 0.55; ink.drawBg && ink.drawBg(); S5.studio.ink = ink;
  const setTool = (k) => { const t = S5.STUDIO_TOOLS.find((x) => x.k === k); if (k === "eraser") S5.inkState.tool = "eraser"; else if (t) Object.assign(S5.inkState, { tool: "pen", color: t.c, width: t.w }); S5.ls.set("studioTool", k); document.querySelectorAll("[data-st-tool]").forEach((b) => b.classList.toggle("on", b.dataset.stTool === k)); };
  setTool(S5.ls.get("studioTool", "HB"));
  document.querySelector(".st-tray").addEventListener("click", (e) => { const b = e.target.closest("[data-st-tool]"); if (b) setTool(b.dataset.stTool); });
  // pen check: show that the pencil and its pressure are read
  const penEl = document.getElementById("st-pen"); const onPen = (e) => { if (!penEl) return; penEl.textContent = e.pointerType === "pen" ? `✎ pen · pressure ${Math.round((e.pressure || 0) * 100)}%` : e.pointerType === "touch" ? "☝ finger (use the pencil for drawing)" : "🖱 mouse"; };
  document.getElementById("st-ink").addEventListener("pointerdown", onPen, true); document.getElementById("st-ink").addEventListener("pointermove", (e) => { if (e.pressure && e.pointerType === "pen") onPen(e); }, true);
  S5.studioDemo(L);
  const ro = new ResizeObserver(() => S5.studioDemo(L, true)); ro.observe(document.querySelector(".st-board-frame"));
  return () => { ro.disconnect(); cancelAnimationFrame(S5.studio.raf); try { ink.destroy(); } catch {} speechSynthesis && speechSynthesis.cancel && speechSynthesis.cancel(); };
};
/* the teacher draws the example on the chalkboard, stroke by stroke */
S5.studioDemo = (L, still) => {
  const cv = document.getElementById("st-board"); if (!cv || !cv.isConnected) return; const fr = cv.parentNode; const w = fr.clientWidth, h = fr.clientHeight; if (w < 4) return;
  const dpr = devicePixelRatio || 1; cv.width = w * dpr; cv.height = h * dpr; cv.style.width = w + "px"; cv.style.height = h + "px";
  const x = cv.getContext("2d"); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.direction = "ltr"; const s = Math.min(w / S5.STUDIO_W, h / S5.STUDIO_H) * 0.92, ox = (w - S5.STUDIO_W * s) / 2, oy = (h - S5.STUDIO_H * s) / 2;
  const paths = L.demo; const total = paths.reduce((a, p) => a + p.length - 1, 0) || 1; const dots = (L.guides || []).length ? (L.check.pairs || []).flatMap(([a, b, c, d]) => [[a, b], [c, d]]) : [];
  const draw = (prog) => {
    x.clearRect(0, 0, w, h); x.save(); x.translate(ox, oy); x.scale(s, s); x.lineCap = "round"; x.lineJoin = "round";
    x.fillStyle = "rgba(255,255,255,.55)"; for (const [a, b] of dots) { x.beginPath(); x.arc(a, b, 7, 0, Math.PI * 2); x.fill(); }
    x.strokeStyle = "rgba(245,245,235,.92)"; x.lineWidth = 4 / Math.max(s, 0.4) * 0.5 + 2; x.shadowColor = "rgba(255,255,255,.35)"; x.shadowBlur = 2;
    let left = prog * total;
    for (const p of paths) { if (left <= 0) break; x.beginPath(); x.moveTo(p[0][0], p[0][1]); for (let k = 1; k < p.length && left > 0; k++) { const f = Math.min(1, left); x.lineTo(p[k - 1][0] + (p[k][0] - p[k - 1][0]) * f, p[k - 1][1] + (p[k][1] - p[k - 1][1]) * f); left -= 1; } x.stroke(); }
    x.restore();
  };
  cancelAnimationFrame(S5.studio.raf);
  if (still) return draw(1);
  const t0 = performance.now(), dur = Math.min(6000, 900 + total * 260); const step = (t) => { const k = Math.min(1, (t - t0) / dur); draw(k); if (k < 1) S5.studio.raf = requestAnimationFrame(step); }; S5.studio.raf = requestAnimationFrame(step);
};
Object.assign(S5.act, {
  "st-demo": () => S5.studioDemo(S5.studio.L),
  "st-voice": () => { try { const u = new SpeechSynthesisUtterance(S5.studio.L.say + " " + S5.studio.L.tip); u.lang = "ar"; u.rate = 0.95; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch { S5.ui.toast("Voice is not available on this device", true); } },
  "st-undo": () => S5.studio.ink && S5.studio.ink.undo(),
  "st-clear": () => { const ink = S5.studio.ink; if (!ink || !ink.strokes.length) return; ink.commit({ op: "delete", removed: ink.strokes.slice(), added: [] }); document.getElementById("st-result").innerHTML = ""; },
  "st-check": async () => {
    const { L, ink } = S5.studio; if (!ink) return; await ink.flush?.(); const res = S5.studioCheck(L, ink.strokes);
    await S5.studioProg.save(L.id, res);
    const el = document.getElementById("st-result");
    el.innerHTML = `<div class="st-verdict ${res.ok ? "ok" : "no"}" dir="rtl"><b>${res.ok ? "👏 أحسنت — نجحت بهذا الدرس" : "حاول مرة ثانية"}</b> <span class="mono">${Math.round(res.score * 100)}%</span>${res.notes.length ? `<ul>${res.notes.map((n) => `<li>${S5.esc(n)}</li>`).join("")}</ul>` : ""}${res.ok ? "" : `<p class="small">اضغط «Clear» وارسم من جديد — كل محاولة تتسجل.</p>`}</div>`;
    if (res.ok) { S5.ui.toast("Lesson passed ✓"); setTimeout(() => { const i = S5.STUDIO_LESSONS.indexOf(L); const nx = S5.STUDIO_LESSONS[i + 1]; const bar = document.querySelector(".st-actions"); if (nx && bar && !bar.querySelector('[data-id="' + nx.id + '"]')) bar.insertAdjacentHTML("afterbegin", H.btn("Next lesson →", "open", { v: "studio", id: nx.id }, "primary")); if (!nx) S5.ui.toast("Level 1 complete — level 2 (perspective & “draw this”) is next"); }, 50); }
  },
});
