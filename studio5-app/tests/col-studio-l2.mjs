// The Studio, Level 2 (src/college/40-studio-l2.js — Freehand Drawing Arc 103 weeks 3–13): synthetic drawings built
// from exact geometry are checked by code. A correct one-point box, two-point cube, three ellipses and a symmetric
// vase pass; each named mistake is caught with its note: a receding edge 8° off its vanishing point, a horizontal line
// in two-point perspective, a lemon-shaped (pointed) ellipse, an ellipse that does not fill its box, a tilted ellipse,
// a vase that is too wide, leaning, or lopsided. Hand tremor is simulated (seeded noise). Also: the lessons are in the
// ladder after Level 1, the room opens with no page errors, and Level 1's checkers are unchanged.
import { createRequire } from "node:module"; const require = createRequire("/x/"); const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const BASE = process.env.BASE || "http://localhost:8765/";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const page = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage(); const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto(BASE); await page.waitForTimeout(1500);
const res = await page.evaluate(() => {
  const r = {}, L = (id) => S5.STUDIO_LESSONS.find((l) => l.id === id);
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647 - 0.5);
  const stroke = (pts, jitter = 1.2, n = 40) => { const out = []; for (let i = 0; i < pts.length - 1; i++) for (let k = 0; k < n; k++) { const t = k / n, x = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t, y = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t; out.push(Math.round((x + rnd() * jitter) * 10), Math.round((y + rnd() * jitter) * 10), 50); } const e = pts[pts.length - 1]; out.push(Math.round(e[0] * 10), Math.round(e[1] * 10), 50); return { t: "pen", c: "#000", w: 2, p: out }; };
  const seg = (a, b2, j) => stroke([a, b2], j);
  const along = (p, v, f) => [p[0] + (v[0] - p[0]) * f, p[1] + (v[1] - p[1]) * f];
  const rot = (p, c, d) => { const t = (d * Math.PI) / 180, dx = p[0] - c[0], dy = p[1] - c[1]; return [c[0] + dx * Math.cos(t) - dy * Math.sin(t), c[1] + dx * Math.sin(t) + dy * Math.cos(t)]; };
  const chk = (id, st) => S5.studioCheck(L(id), st);
  // ---- one-point box ----
  const VP = [500, 230], F = [[380, 400], [620, 400], [620, 600], [380, 600]], B = F.map((p) => along(p, VP, 0.3));
  const box = () => [seg(F[0], F[1]), seg(F[1], F[2]), seg(F[2], F[3]), seg(F[3], F[0]), seg(F[0], B[0]), seg(F[1], B[1]), seg(F[2], B[2]), seg(B[0], B[1]), seg(B[1], B[2])];
  const good1 = chk("L11", box()); r.vp1Good = good1.ok === true && good1.notes.length === 0 || good1;
  const off = box(); off[5] = seg(F[1], rot(B[1], F[1], 8)); const bad1 = chk("L11", off);
  r.vp1Off8deg = (bad1.ok === false && bad1.notes.some((n) => /نقطة التلاشي/.test(n))) || bad1;
  // ---- two-point cube ----
  const VL = [40, 210], VR = [960, 210], c0 = [500, 330], c1 = [500, 620], l0 = along(c0, VL, 0.35), r0 = along(c0, VR, 0.35), l1 = along(c1, VL, 0.35), r1 = along(c1, VR, 0.35);
  const cube = () => [seg(c0, c1), seg(l0, l1), seg(r0, r1), seg(c0, l0), seg(c0, r0), seg(c1, l1), seg(c1, r1)];
  const good2 = chk("L12", cube()); r.vp2Good = good2.ok === true || good2;
  const flat = cube(); flat[6] = seg(c1, [c1[0] + 160, c1[1]]); const bad2 = chk("L12", flat);
  r.vp2HorizontalCaught = (bad2.ok === false && bad2.notes.some((n) => /أفقي/.test(n))) || bad2;
  // ---- ellipses ----
  const ellP = (cx, cy, a, b2, n = 64, shape = (t) => [Math.cos(t), Math.sin(t)]) => Array.from({ length: n + 1 }, (_, k) => { const [u, v] = shape((k / n) * 2 * Math.PI); return [cx + a * u, cy + b2 * v]; });
  const boxes = L("L13").check.boxes, ells = (f) => boxes.map(([x, y, w, h], i) => stroke(f(x + w / 2, y + h / 2, w / 2, h / 2, i), 0.8, 3));
  const good3 = chk("L13", ells((cx, cy, a, b2) => ellP(cx, cy, a, b2))); r.ellipsesGood = good3.ok === true || good3;
  const lemon = (t) => { const s = Math.sin(t), c = Math.cos(t); return [Math.sign(c) * Math.abs(c) ** 0.55 * (1 - 0.0), Math.sign(s) * Math.abs(s) ** 2.2]; };
  const bad3 = chk("L13", ells((cx, cy, a, b2, i) => (i === 1 ? ellP(cx, cy, a, b2, 64, (t) => { const s = Math.sin(t); return [Math.cos(t), s * Math.abs(Math.cos(t)) ** 0 * (1 - Math.abs(Math.cos(t)) ** 6) ** 1.6]; }) : ellP(cx, cy, a, b2))));
  r.lemonCaught = (bad3.ok === false && bad3.notes.some((n) => /المستطيل 2/.test(n) && /مدببة/.test(n))) || bad3;
  const small = chk("L13", ells((cx, cy, a, b2, i) => ellP(cx, cy, i === 0 ? a * 0.7 : a, b2)));
  r.notFillingCaught = (small.ok === false && small.notes.some((n) => /المستطيل 1/.test(n) && /يلمس/.test(n))) || small;
  const tilted = chk("L13", ells((cx, cy, a, b2, i) => (i === 2 ? ellP(cx, cy, a, b2).map((p) => rot(p, [cx, cy], 15)) : ellP(cx, cy, a, b2))));
  r.tiltCaught = (tilted.ok === false && tilted.notes.some((n) => /المستطيل 3/.test(n))) || tilted;
  // ---- vase ----
  const V = L("L14").check, H = V.bottom - V.top;
  const vase = (wide = 1, shift = 0, lop = 0) => { const prof = [[0, 0.3], [0.2, 0.28], [0.4, 0.42], [0.6, 0.5], [0.8, 0.44], [1, 0.3]]; const half = (H * V.ratio) / 2 * wide;
    const R = prof.map(([t, w2]) => [V.axis + shift + (w2 / 0.5) * half * (1 + lop), V.top + t * H]), Lf = prof.map(([t, w2]) => [V.axis + shift - (w2 / 0.5) * half, V.top + t * H]);
    return [stroke(R, 0.8, 12), stroke(Lf, 0.8, 12), seg(R[0], Lf[0], 0.5), seg(R[R.length - 1], Lf[Lf.length - 1], 0.5)]; };
  const g4 = chk("L14", vase()); r.vaseGood = g4.ok === true || g4;
  const w4 = chk("L14", vase(1.3)); r.vaseTooWide = (w4.ok === false && w4.notes.some((n) => /عريضة/.test(n))) || w4;
  const s4 = chk("L14", vase(1, 40)); r.vaseLeaning = (s4.ok === false && s4.notes.some((n) => /المحور/.test(n))) || s4;
  const l4 = chk("L14", vase(1, 0, 0.35)); r.vaseLopsided = (l4.ok === false && l4.notes.some((n) => /متناظرتين|عريضة|المحور/.test(n))) || l4;
  // ---- cylinder ----
  const cyl = (o = {}) => { const a = 150, top = ellP(500, 300, a, 40), bot = o.flat ? [[350, 590], [650, 590]] : ellP(o.shift || 500, 590, o.bw || a, o.bb || 62);
    return [stroke(top, 0.8, 3), o.flat ? seg(bot[0], bot[1]) : stroke(bot, 0.8, 3), seg([350 + (o.gap || 0), 300], [350 + (o.gap || 0), 590]), seg([650 - (o.gap || 0), 300], [650 - (o.gap || 0), 590])]; };
  const g5 = chk("L15", cyl()); r.cylinderGood = g5.ok === true || g5;
  const f5 = chk("L15", cyl({ flat: true })); r.cylinderFlatBase = (f5.ok === false && f5.notes.some((n) => /خط مستقيم/.test(n))) || f5;
  const d5 = chk("L15", cyl({ bb: 40 })); r.cylinderSameDegree = (d5.ok === false && d5.notes.some((n) => /أدور/.test(n))) || d5;
  const s5 = chk("L15", cyl({ gap: 30 })); r.cylinderSidesMissEnds = (s5.ok === false && s5.notes.some((n) => /تلمس/.test(n))) || s5;
  // ---- oblique cube (near VP left, far VP right) ----
  const vl = [220, 200], vr = [1400, 200], q0 = [470, 330], q1 = [470, 600], m0 = along(q0, vl, 0.4), m1 = along(q1, vl, 0.4), n0 = along(q0, vr, 0.25), n1 = along(q1, vr, 0.25);
  const ob = () => [seg(q0, q1), seg(m0, m1), seg(n0, n1), seg(q0, m0), seg(q1, m1), seg(q0, n0), seg(q1, n1)];
  const g6 = chk("L16", ob()); r.obliqueGood = g6.ok === true || g6;
  const sym = ob(); sym[5] = seg(q0, along(q0, [960, 210], 0.25)); sym[6] = seg(q1, along(q1, [960, 210], 0.25)); const b6 = chk("L16", sym);
  r.obliqueWrongVPCaught = b6.ok === false || b6;
  // ---- integration ----
  const ids = S5.STUDIO_LESSONS.map((l) => l.id); r.ladderOrder = ids.indexOf("L11") === 10 && ids.slice(10, 16).join() === "L11,L12,L13,L14,L15,L16" || ids;
  r.level1Unchanged = chk("L2", Array.from({ length: 8 }, (_, i) => seg([150, 120 + i * 60], [850, 120 + i * 60], 0.6))).ok === true;
  r.empty = chk("L12", []).ok === false;
  return r;
});
await page.evaluate(() => { S5.settings.set("lang", "ar"); S5.ui.go({ v: "studio", id: "L13" }); }); await page.waitForTimeout(900);
res.roomOpens = await page.evaluate(() => !!document.getElementById("st-ink") && !!document.querySelector(".st-ladder"));
await page.click('[data-act="st-check"]'); await page.waitForTimeout(400);
res.checkEmptyShowsNote = await page.evaluate(() => /ارسم/.test(document.getElementById("st-result").textContent));
res.noPageErrors = errors.length === 0;
const failed = Object.entries(res).filter(([k, v]) => v !== true).map(([k]) => k);
console.log(JSON.stringify({ suite: "col-studio-l2", res, failed, errors }, null, 1));
if (failed.length) process.exitCode = 1;
await b.close();
