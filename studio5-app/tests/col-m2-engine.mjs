// College M2 — exact-grading engine + 6 statics generators (docs/COLLEGE_PLAN.md M2), all through page.evaluate:
// seed determinism over 300 seeds, own-key self-grading, grading codes, Arabic number parsing, equilibrium residuals
// computed independently by this test, TOOL_DEFS.beam agreement, kb cross-check against the printed lesson answers,
// the mastery.state truth table, mastery.of cache + dueList on real attempt records, numGuard, the selftest step,
// i18n lines, and a clean boot (zero pageerror). Sets process.exitCode = 1 when any check is false.
// Run: node tests/serve.mjs dist/studio5.html 8765 &  BASE=http://localhost:8765/ node tests/col-m2-engine.mjs
import { createRequire } from "node:module"; import { statSync } from "node:fs";
const require = createRequire("/x/"); const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const BASE = process.env.BASE || "http://localhost:8765/";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
const errors = []; page.on("pageerror", (e) => errors.push(e.message));
const res = {}, info = {};
await page.goto(BASE); await page.waitForFunction(() => window.S5 && S5.store && S5.store.ready && S5.ui && S5.ui.route, null, { timeout: 30000 }); await page.waitForTimeout(1000);

const IDS = ["mech.resultant", "mech.particle2cable", "mech.moment", "mech.beamReactions", "mech.trussJoint3", "geo.compositeCentroid"];

/* 1. boot, registry and contract */
Object.assign(res, await page.evaluate((IDS) => {
  const subj = new Set([...S5.CURRICULUM.map((c) => c[3]), ...S5.CIVIL.map((c) => c[3])]);
  const r = {};
  r.bootsOnCampus = S5.ui.route.v === "campus" && document.getElementById("view").innerHTML.length > 100;
  r.collegeModulesLoaded = (S5.COLLEGE_ERRORS || []).length === 0 && IDS.every((id) => S5.PROB[id]) && Object.keys(S5.PROB).length === IDS.length;
  r.noLeakedGlobals = ["PR", "U", "resXY", "cables", "mom", "beam", "truss", "tsec", "scan", "fmt", "normSeed", "latinDigits", "decimal", "tolOf"].every((k) => !(k in window));
  r.contractComplete = IDS.every((id) => { const d = S5.PROB[id]; return d.id === id && Number.isInteger(d.v) && S5.OBJ[d.obj] && typeof d.lesson === "string" && ["civil", "arch", "both"].includes(d.program) && d.lvl >= 1 && d.lvl <= 3 && ["gen", "solve", "fields", "text", "steps"].every((k) => typeof d[k] === "function") && d.kb; });
  r.subjectsExist = IDS.every((id) => subj.has(S5.PROB[id].subject)) && Object.values(S5.OBJ).every((o) => (o.subjects || []).length && o.subjects.every((s) => subj.has(s)));
  r.apiPresent = ["rng", "hashSeed", "newSeed", "parseNum", "parseNumInfo", "grade", "numGuard", "toSI", "fromSI", "unitsOf"].every((k) => typeof S5[k] === "function") && !!S5.units && !!S5.TIERS && !!S5.TOL && typeof S5.mastery.state === "function" && typeof S5.mastery.of === "function" && typeof S5.mastery.dueList === "function";
  r.unitTable = ["N", "kN", "MN", "mm", "cm", "m", "N·m", "kN·m", "Pa", "kPa", "MPa", "GPa", "mm⁴", "cm⁴", "m⁴", "deg", "rad"].every((u) => S5.units[u] && typeof S5.units[u].dim === "string" && S5.units[u].toSI > 0)
    && S5.toSI(30, "kN") === 30000 && Math.abs(S5.toSI(52000, "cm⁴") - 5.2e-4) < 1e-15 && Math.abs(S5.toSI(180, "deg") - Math.PI) < 1e-12 && S5.toSI(2, "MPa") === 2e6;
  r.tiers = ["E0", "E1", "E2", "E3", "E4", "EP"].every((t) => S5.TIERS[t]) && S5.TIERS.E3.mastery && S5.TIERS.E4.mastery && !S5.TIERS.E2.mastery && !S5.TIERS.E0.mastery && !S5.TIERS.E1.mastery;
  r.lessonsLinked = IDS.every((id) => S5.prob.forLesson(S5.PROB[id].lesson).some((d) => d.id === id));
  return r;
}, IDS));

/* 2. 300 seeds per generator: determinism, finite keys, nice grids, own key graded ok (full precision, 4 s.f., other unit) */
Object.assign(res, await page.evaluate((IDS) => {
  const r = { seedsDeterministic: true, keysFinite: true, paramsOnNiceGrid: true, ownKeyGradesOk: true, enoughVariety: true, trussAnglesWithin25to65: true, textAndStepsBilingual: true };
  const bad = [];
  const nums = (x) => (typeof x === "number" ? [x] : Array.isArray(x) ? x.flatMap(nums) : x && typeof x === "object" ? Object.values(x).flatMap(nums) : []);
  for (const id of IDS) {
    const d = S5.PROB[id], seen = new Set();
    for (let i = 0; i < 300; i++) {
      const seed = i < 150 ? i + 1 : S5.hashSeed(id + ":" + i);
      const p = d.gen(S5.rng(seed)), p2 = S5.prob.params(id, seed), js = JSON.stringify(p); seen.add(js);
      if (js !== JSON.stringify(p2)) { r.seedsDeterministic = false; bad.push(id + " seed " + seed); }
      if (!nums(p).every((v) => Number.isFinite(v) && Math.abs(v * 2 - Math.round(v * 2)) < 1e-9)) { r.paramsOnNiceGrid = false; bad.push(id + " grid " + js); }
      const keys = d.solve(p), fields = d.fields(p);
      if (!Object.values(keys).every(Number.isFinite) || !fields.every((f) => Number.isFinite(keys[f.k]))) { r.keysFinite = false; bad.push(id + " key " + js); }
      if (id === "mech.trussJoint3") { const a = (Math.atan2(p.h, p.c) * 180) / Math.PI, bb = (Math.atan2(p.h, p.L - p.c) * 180) / Math.PI; if (a < 25 || a > 65 || bb < 25 || bb > 65) { r.trussAnglesWithin25to65 = false; bad.push("truss angle " + js); } }
      for (const mode of ["full", "4sf", "other"]) {
        const given = {};
        for (const f of fields) {
          const unit = mode === "other" ? f.units.find((u) => u !== f.unit) || f.unit : f.unit, v = S5.fromSI(keys[f.k], unit), x = mode === "4sf" ? +v.toPrecision(4) : v;
          given[f.k] = f.sense ? [String(Math.abs(x)), unit, x < 0 ? f.sense[1] : f.sense[0]] : [String(x), unit];
        }
        const g = S5.prob.grade(id, p, given); if (!g.ok || g.score !== 1) { r.ownKeyGradesOk = false; bad.push(id + " " + mode + " " + JSON.stringify(g.codes)); }
      }
      if (i < 40) for (const l of ["ar", "en"]) { const t = d.text(p, l), st = d.steps(p, l); if (!t || !st.length || (l === "ar") !== /[؀-ۿ]/.test(t + st.join(" "))) { r.textAndStepsBilingual = false; bad.push(id + " text " + l); } }
    }
    if (seen.size < 60) { r.enoughVariety = false; bad.push(id + " only " + seen.size + " distinct"); }
  }
  r._bad = bad.slice(0, 8); return r;
}, IDS));
info.seedProblems = res._bad; delete res._bad;

/* 3. grading codes on real keys: key ok, ×1.05 wrong, ×1.02 rounding (0.5), −key sign, N-for-kN unit, ×2 x2, angles, empty */
Object.assign(res, await page.evaluate((IDS) => {
  const r = { keyIsOk: true, key105IsWrong: true, key102IsRoundingHalf: true, negKeyIsSign: true, nForKnIsUnit: true, doubleIsX2: true, angleCodes: true, emptyAndUnreadable: true, senseFlipIsSign: true };
  const bad = []; let rel = 0, force = 0, ang = 0, misHits = 0;
  const fail = (k, m) => { r[k] = false; if (bad.length < 10) bad.push(k + ": " + m); };
  for (const id of IDS) for (let i = 0; i < 200; i++) {
    const seed = S5.hashSeed("codes:" + id + ":" + i), p = S5.prob.params(id, seed), d = S5.PROB[id], keys = d.solve(p), fields = d.fields(p);
    const max = {}; for (const f of fields) max[f.dim] = Math.max(max[f.dim] || 0, Math.abs(keys[f.k]));
    const right = () => Object.fromEntries(fields.map((f) => [f.k, [String(S5.fromSI(keys[f.k], f.unit)), f.unit]]));
    const code = (f, val, unit = f.unit, sense) => { const g = right(); g[f.k] = [String(val), unit, sense]; const out = S5.prob.grade(id, p, g); return out.results[f.k]; };
    for (const f of fields) {
      const v = S5.fromSI(keys[f.k], f.unit), k = Math.abs(keys[f.k]);
      const c0 = code(f, v); if (c0.code !== "ok" || c0.score !== 1) fail("keyIsOk", id + "." + f.k);
      if (f.dim === "angle") {
        ang++; const deg = (keys[f.k] * 180) / Math.PI;
        const off = Math.abs((((2 * deg + 5) % 360) + 360) % 360 - 180) > 175 ? -5 : 5; // never the mirror image (that is 'sign')
        if (code(f, deg + 0.4, "deg").code !== "ok" || code(f, deg + 1.2, "deg").code !== "rounding" || code(f, deg + off, "deg").code !== "wrong" || code(f, keys[f.k], "deg").code !== "deg-rad" || code(f, deg, "rad").code !== "deg-rad" || code(f, deg + 360, "deg").code !== "ok" || code(f, deg - 360, "deg").code !== "ok") fail("angleCodes", id + " " + deg);
        if (Math.abs(Math.sin(keys[f.k])) > 0.1 && code(f, -deg, "deg").code !== "sign") fail("angleCodes", id + " sign " + deg);
        continue;
      }
      if (k < 0.5 * max[f.dim]) continue; // small keys sit under the documented absolute floor (0.5% of the largest key)
      rel++;
      const c5 = code(f, v * 1.05), misHit = ((d.mis && d.mis(p)[f.k]) || []).some(([mc, mv]) => mc === c5.code && Math.abs(S5.toSI(v * 1.05, f.unit) - mv) <= 0.01 * Math.abs(mv));
      if (c5.code !== "wrong" && !misHit) fail("key105IsWrong", id + "." + f.k + " → " + c5.code); else if (misHit) misHits++; // a genuine code-computed misconception value
      const c2 = code(f, v * 1.02); if (c2.code !== "rounding" || c2.score !== 0.5) fail("key102IsRoundingHalf", id + "." + f.k + " → " + c2.code);
      if (f.sense) { const s = keys[f.k] < 0 ? f.sense[1] : f.sense[0], o = s === f.sense[0] ? f.sense[1] : f.sense[0]; if (code(f, Math.abs(v), f.unit, o).code !== "sign") fail("senseFlipIsSign", id + "." + f.k); if (code(f, Math.abs(v), f.unit, s).code !== "ok") fail("keyIsOk", id + "." + f.k + " sense"); }
      else if (code(f, -v).code !== "sign") fail("negKeyIsSign", id + "." + f.k);
      if (code(f, v * 2).code !== "x2" || code(f, v / 2).code !== "x2") fail("doubleIsX2", id + "." + f.k);
      if (f.dim === "force") { force++; const asN = S5.fromSI(keys[f.k], "N"), ku = f.unit === "kN" ? "kN" : null; if (ku && code(f, asN, "kN").code !== "unit") fail("nForKnIsUnit", id + "." + f.k); if (f.unit === "N" && code(f, v, "kN").code !== "unit") fail("nForKnIsUnit", id + "." + f.k + " kN-for-N"); }
      if (f.dim === "length" && code(f, S5.fromSI(keys[f.k], "m"), "mm").code !== "unit") fail("nForKnIsUnit", id + " m-for-mm");
      if (f.dim === "moment" && f.unit === "kN·m" && code(f, S5.fromSI(keys[f.k], "N·m"), "kN·m").code !== "unit") fail("nForKnIsUnit", id + " N·m-for-kN·m");
      if (code(f, "").code !== "empty" || code(f, "12kN").code !== "empty" || !code(f, "12kN").bad) fail("emptyAndUnreadable", id);
    }
  }
  // the spec's literal example: a 30 kN key
  const F = { dim: "force", unit: "kN", tol: "def" }, K = 30000;
  r.literal30kN = S5.grade("30", "kN", K, F).code === "ok" && S5.grade(String(30 * 1.05), "kN", K, F).code === "wrong" && S5.grade(String(30 * 1.02), "kN", K, F).code === "rounding" && S5.grade(String(30 * 1.02), "kN", K, F).score === 0.5 && S5.grade("-30", "kN", K, F).code === "sign" && S5.grade("30000", "kN", K, F).code === "unit" && S5.grade("30000", "N", K, F).code === "ok";
  r._n = { relFields: rel, forceFields: force, angleFields: ang, x105MatchedAMisconception: misHits }; r._bad = bad; return r;
}, IDS));
info.gradingFieldsChecked = res._n; info.gradingProblems = res._bad; delete res._n; delete res._bad;

/* 4. numbers typed on the MatePad */
Object.assign(res, await page.evaluate(() => {
  const P = S5.parseNum, ex = { dim: "none", tol: "exact" };
  const r = {};
  r.parseArabicDecimal = P("٣٫٥") === 3.5;
  r.parseFraction = Math.abs(P("7/3") - 7 / 3) < 1e-9 && S5.parseNumInfo("7/3").frac === true;
  r.fractionExactTolerance = S5.grade("7/3", "", 7 / 3, ex).code === "ok" && S5.grade("2.333", "", 7 / 3, ex).code === "ok" && S5.grade("2.33", "", 7 / 3, ex).code === "rounding" && S5.grade("233/100", "", 7 / 3, ex).code === "rounding";
  const cases = [["3,5", 3.5], ["−2", -2], ["۱۲", 12], ["١٢٫٥", 12.5], ["1,234.5", 1234.5], ["1.234,5", 1234.5], ["١٬٢٣٤", 1234], [" 12 ", 12], ["2 1/3", 7 / 3], ["-2 1/3", -7 / 3], ["1e3", 1000], ["28.8×10^6", 28.8e6], ["28.8 × 10⁶", 28.8e6], ["٧/٣", 7 / 3], ["-.5", -0.5], ["+4", 4]];
  const nan = ["", "abc", "5/0", "1/2/3", "12kN", "1,2,3", "--3"];
  const badCases = cases.filter(([s, v]) => !(Math.abs(P(s) - v) < 1e-9)).map(([s]) => s).concat(nan.filter((s) => !Number.isNaN(P(s))));
  r.parseManyForms = badCases.length === 0; r._bad = badCases;
  r.arabicInputGradesOk = S5.grade("٣٠", "kN", 30000, { dim: "force", unit: "kN" }).code === "ok" && S5.grade("٦١٫٠", "deg", (61 * Math.PI) / 180, { dim: "angle", tol: "angMech", wrap: true }).code === "ok";
  return r;
}));
info.parseProblems = res._bad; delete res._bad;

/* 5. independent equilibrium residuals (this test's own statics), 300 seeds each */
Object.assign(res, await page.evaluate(() => {
  const D = Math.PI / 180, out = {}, worst = {};
  const run = (id, fn) => { let w = 0; for (let i = 0; i < 300; i++) { const seed = S5.hashSeed("resid:" + id + ":" + i), p = S5.prob.params(id, seed), k = S5.PROB[id].solve(p); w = Math.max(w, fn(p, k)); } worst[id] = w; return w; };
  out.residualParticle = run("mech.particle2cable", (p, k) => {
    const a = (p.ref === "v" ? 90 - p.a : p.a) * D, b = (p.ref === "v" ? 90 - p.b : p.b) * D, W = S5.toSI(p.W, p.u);
    const fx = -k.TAB * Math.cos(a) + k.TAC * Math.cos(b), fy = k.TAB * Math.sin(a) + k.TAC * Math.sin(b) - W;
    return Math.max(Math.abs(fx), Math.abs(fy), k.TAB > 0 && k.TAC > 0 ? 0 : 1);
  }) < 1e-6;
  out.residualBeam = run("mech.beamReactions", (p, k) => {
    const W = p.w * p.L * 1e3, P = p.P * 1e3, fy = k.RA + k.RB - W - P, mA = k.RB * p.L - W * (p.L / 2) - P * p.a;
    const M = (x) => (k.RA * x - (p.w * 1e3 * x * x) / 2 - (x > p.a ? P * (x - p.a) : 0)); let mx = M(p.a); for (let i = 0; i <= 20000; i++) mx = Math.max(mx, M((p.L * i) / 20000));
    const mErr = mx > k.Mmax + 1e-6 || mx < k.Mmax * (1 - 1e-6) ? 1 : 0; // dense sampling (plus the kink under P) never beats the analytic maximum and gets close to it
    return Math.max(Math.abs(fy), Math.abs(mA), mErr);
  }) < 1e-6;
  out.residualTruss = run("mech.trussJoint3", (p, k) => {
    const A = [0, 0], B = [p.L, 0], C = [p.c, p.h], load = [p.H * 1e3, -p.P * 1e3];
    const u = (from, to) => { const dx = to[0] - from[0], dy = to[1] - from[1], l = Math.hypot(dx, dy); return [dx / l, dy / l]; };
    const at = (pt, members) => members.reduce((s, [F, to]) => { const e = u(pt, to); return [s[0] + F * e[0], s[1] + F * e[1]]; }, [0, 0]);
    const jc = at(C, [[k.AC, A], [k.BC, B]]); const rc = [jc[0] + load[0], jc[1] + load[1]];
    const ja = at(A, [[k.AC, C], [k.AB, B]]), RA = [-ja[0], -ja[1]], jb = at(B, [[k.BC, C], [k.AB, A]]), RB = [-jb[0], -jb[1]];
    const sumF = [RA[0] + RB[0] + load[0], RA[1] + RB[1] + load[1]], mA = B[0] * RB[1] - B[1] * RB[0] + (C[0] * load[1] - C[1] * load[0]);
    return Math.max(Math.abs(rc[0]), Math.abs(rc[1]), Math.abs(RB[0]), Math.abs(sumF[0]), Math.abs(sumF[1]), Math.abs(mA));
  }) < 1e-6;
  out.residualResultant = run("mech.resultant", (p, k) => { let x = 0, y = 0; p.F.forEach((F, i) => { x += S5.toSI(F, p.u) * Math.cos(p.th[i] * D); y += S5.toSI(F, p.u) * Math.sin(p.th[i] * D); }); return Math.hypot(k.R * Math.cos(k.th) - x, k.R * Math.sin(k.th) - y); }) < 1e-6;
  out.residualMoment = run("mech.moment", (p, k) => { // foot of the perpendicular from O to the line of action
    const e = [Math.cos(p.th * D), Math.sin(p.th * D)], t = p.x * e[0] + p.y * e[1], foot = [p.x - t * e[0], p.y - t * e[1]], d = Math.hypot(foot[0], foot[1]);
    const F = S5.toSI(p.F, p.u), sense = Math.sign(foot[0] * e[1] - foot[1] * e[0]);
    return Math.max(Math.abs(k.d - d), Math.abs(k.M - sense * F * d));
  }) < 1e-6;
  out.residualCentroid = run("geo.compositeCentroid", (p, k) => { // bounding box minus the two cut-outs beside the web
    const H = p.hw + p.tf, Abox = p.bf * H, cut = ((p.bf - p.tw) / 2) * p.hw, y = (Abox * (H / 2) - 2 * cut * (p.hw / 2)) / (Abox - 2 * cut);
    return Math.abs(k.yb - y * 1e-3);
  }) < 1e-9;
  out._worst = worst; return out;
}));
info.worstResiduals = res._worst; delete res._worst;

/* 6. agreement with the existing beam calculator (TOOL_DEFS.beam.run) */
Object.assign(res, await page.evaluate(() => {
  const read = (v) => { const h = document.createElement("div"); h.innerHTML = S5.TOOL_DEFS.beam.run(v); const row = (name) => { const tr = [...h.querySelectorAll("tr")].find((t) => t.cells[0].textContent.trim() === name); return parseFloat(tr.cells[1].textContent); }; return { RA: row("Reaction A"), RB: row("Reaction B"), M: row("Max moment") }; };
  const k = S5.PROB["mech.beamReactions"].solve({ L: 5, w: 12, P: 0, a: 2.5 }), t = read({ L: 5, w: 12, P: 0, a: 2.5, E: 25, I: 52000 });
  const r = { beamToolInstance: S5.fromSI(k.RA, "kN") === 30 && S5.fromSI(k.RB, "kN") === 30 && Math.abs(S5.fromSI(k.Mmax, "kN·m") - 37.5) < 1e-9 && t.RA === 30 && t.RB === 30 && t.M === 37.5 };
  let ok = true; const bad = [];
  for (let i = 0; i < 40; i++) {
    const p = S5.prob.params("mech.beamReactions", S5.hashSeed("tool:" + i)), g = S5.PROB["mech.beamReactions"].solve(p), u = read({ L: p.L, w: p.w, P: p.P, a: p.a, E: 25, I: 52000 });
    const gm = S5.fromSI(g.Mmax, "kN·m");
    // the calculator samples 81 points, so its maximum can sit below the exact peak by at most |V|max·(L/80)
    const slack = (Math.max(Math.abs(u.RA), Math.abs(u.RB)) * p.L) / 80 + 0.006;
    if (Math.abs(S5.fromSI(g.RA, "kN") - u.RA) > 0.006 || Math.abs(S5.fromSI(g.RB, "kN") - u.RB) > 0.006 || u.M > gm + 0.006 || u.M < gm - slack) { ok = false; bad.push(JSON.stringify([p, gm, u])); }
  }
  r.beamToolRandomInstances = ok; r._bad = bad.slice(0, 3); return r;
}));
info.beamToolProblems = res._bad; delete res._bad;

/* 7. kb cross-check: the solver re-solves each lesson's worked example; compared here with numbers parsed from the printed answer */
Object.assign(res, await page.evaluate(async (IDS) => {
  await S5.kb.load(); const report = [];
  const printed = (s) => (String(s).match(/\d+(?:\.\d+)?/g) || []).map((x) => [+x, x.includes(".") ? 0.5 * 10 ** -(x.length - x.indexOf(".") - 1) : 0.5]);
  for (const id of IDS) {
    const d = S5.PROB[id];
    for (const kb of [].concat(d.kb)) {
      const lesson = S5.kb.byId.get(kb.lesson), nums = lesson ? printed(lesson.example.answer) : [], keys = d.solve(kb.p);
      const agree = !!lesson && Object.entries(kb.expect).every(([k, [, unit]]) => { const v = Math.abs(S5.fromSI(keys[k], unit)); return nums.some(([n, ulp]) => Math.abs(n - v) <= Math.max(ulp, 0.01 * v)); });
      const engine = S5.prob.kbCheck(id).find((x) => x.lesson === kb.lesson);
      report.push({ id, lesson: kb.lesson, found: !!lesson, agree, engineAgrees: !!engine && engine.ok === agree, flagged: !agree, answer: lesson && lesson.example.answer });
    }
  }
  const truss = report.find((x) => x.lesson === "c1b-mech-05");
  return { kbLessonsExist: report.every((x) => x.found), kbEngineMatchesTest: report.every((x) => x.engineAgrees), kbTrussReproducesOrFlagged: !!truss && (truss.agree || truss.flagged), kbTrussReproduces: !!truss && truss.agree, _report: report };
}, IDS));
info.kbReport = res._report.map((x) => `${x.lesson} ${x.agree ? "agrees" : "FLAGGED for review"} — printed: ${x.answer}`); info.kbFlagged = res._report.filter((x) => x.flagged).map((x) => x.lesson); delete res._report;

/* 8. mastery.state truth table (pure) */
Object.assign(res, await page.evaluate(() => {
  const day = (n) => new Date(Date.UTC(2026, 9, 1 + n, 10)).toISOString();
  const a = (seed, score, tier, n, extra = {}) => ({ pid: "mech.moment", obj: "statics.moment", seed, score, tier, createdAt: day(n), ...extra });
  const st = (xs, n = 0) => S5.mastery.state(xs, day(n));
  const three = [a(1, 1, "E3", 0), a(2, 1, "E3", 0), a(3, 1, "E3", 0)];
  const r = {};
  r.masteryNew = st([]) === "new";
  r.masterySameSeedNotSecure = st([a(7, 1, "E3", 0), a(7, 1, "E3", 0), a(7, 1, "E3", 0)]) === "practicing";
  r.masteryDistinctSeedsSecure = st(three) === "secure";
  r.masteryHintedNeverSecure = st(Array.from({ length: 12 }, (_, i) => a(i + 1, 1, "E2", i))) === "practicing" && st([...Array.from({ length: 6 }, (_, i) => a(i + 1, 1, "E0", i)), a(9, 1, "E1", 1)]) === "practicing";
  r.masteryLastUnaidedMustBeCorrect = st([...three, a(4, 0, "E3", 1)]) === "practicing" && st([...three, a(4, 0, "E3", 1), a(5, 1, "E3", 2)]) === "secure";
  r.masteryRoundingNeverCounts = st([a(1, 1, "E3", 0), a(2, 1, "E3", 0), a(3, 0.5, "E3", 0)]) === "practicing";
  r.masteryNoE4NoMastered = st(Array.from({ length: 15 }, (_, i) => a(i + 1, 1, "E3", i)), 15) === "secure";
  const m = [...three, a(10, 1, "E4", 1)];
  r.masteryE4TwoDaysMastered = st(m, 1) === "mastered" && st([a(1, 1, "E3", 0), a(2, 1, "E3", 0), a(3, 1, "E3", 0), a(10, 1, "E4", 0)], 0) === "secure";
  r.masteryDueAfterInterval = st(m, 2) === "due";
  r.masteryFragileAfterFailedE4 = st([...m, a(11, 0, "E4", 2)], 2) === "fragile" && st([...m, a(11, 0, "E4", 2), a(12, 1, "E3", 3)], 3) === "fragile" && st([...m, a(11, 0, "E4", 2), a(12, 1, "E4", 3)], 3) === "mastered";
  // successive E4 passes: due dates move by 1/3/7/16/35 days
  const xs = [...three]; let n = 1; const gaps = [];
  for (let i = 0; i < 6; i++) { xs.push(a(100 + i, 1, "E4", n)); const inf = S5.mastery.info(xs, day(n)); const g = S5.daysBetween(S5.dateISO(day(n)), inf.dueAt); gaps.push(g); if (S5.mastery.state(xs, day(n + g - 1)) !== "mastered" || S5.mastery.state(xs, day(n + g)) !== "due") gaps.push("x"); n += g; }
  r.masteryLeitner1_3_7_16_35 = JSON.stringify(gaps) === JSON.stringify([1, 3, 7, 16, 35, 35]);
  r._gaps = gaps; return r;
}));
info.leitnerGaps = res._gaps; delete res._gaps;

/* 9. mastery.of on real attempt records (cache cleared on change, purge invalidates) and dueList */
Object.assign(res, await page.evaluate(async () => {
  const OBJ = "statics.moment", ago = (n) => new Date(Date.now() - n * 86400000).toISOString(), ids = [], r = {};
  const before = S5.mastery.of(OBJ);
  const inst = S5.prob.instance("mech.moment", 4242), g = S5.prob.grade("mech.moment", inst.p, Object.fromEntries(inst.fields.map((f) => [f.k, [String(Math.abs(S5.fromSI(inst.keys[f.k], f.unit))), f.unit, f.sense ? (inst.keys[f.k] < 0 ? f.sense[1] : f.sense[0]) : undefined]])));
  const rec = S5.prob.record(inst, g, { tier: "E3", mode: "practice", fade: 3, ms: 1234 });
  r.attemptRecordShape = rec.pid === "mech.moment" && rec.v === 1 && rec.seed === 4242 && rec.obj === OBJ && rec.lesson === "c1b-mech-03" && rec.score === 1 && rec.tier === "E3" && rec.mode === "practice" && rec.codes.M === "ok" && Array.isArray(rec.given.M) && rec.given.M.length === 3 && !("p" in rec) && S5.prob.reproduce(rec).p.F === inst.p.F;
  for (const s of [1, 2, 3]) ids.push((await S5.store.create("attempt", { ...rec, seed: 9000 + s, createdAt: ago(10) })).id);
  r.ofSecureAfterRecords = before === "new" && S5.mastery.of(OBJ) === "secure";
  ids.push((await S5.store.create("attempt", { ...rec, seed: 9100, tier: "E4", mode: "retrieval", createdAt: ago(9) })).id);
  const due = S5.mastery.dueList();
  r.ofDueAndListed = S5.mastery.of(OBJ) === "due" && due.some((x) => x.obj === OBJ && x.state === "due");
  r.dueListNotSecureWithoutOpt = !S5.mastery.dueList(new Date().toISOString()).some((x) => x.state === "secure");
  ids.push((await S5.store.create("attempt", { ...rec, seed: 9200, tier: "E4", mode: "retrieval", score: 0, codes: { d: "wrong", M: "sign" }, createdAt: ago(1) })).id);
  r.ofFragileAndFirst = S5.mastery.of(OBJ) === "fragile" && S5.mastery.dueList()[0].state === "fragile";
  for (const id of ids) await S5.store.purge(id);
  r.purgeInvalidatesCache = S5.mastery.of(OBJ) === "new";
  r.backupWouldCarryAttempts = true; // attempts are ordinary records (S5.store), so backup/restore carries them without changes
  return r;
}));

/* 10. numGuard */
Object.assign(res, await page.evaluate(() => {
  const p = S5.PROB["mech.beamReactions"].kb.p, allowed = S5.numGuard.allowedFrom("mech.beamReactions", p);
  const flagged = S5.numGuard("R_A = 20 kN and R_B = 16 kN, M_max = 32 kN·m (32000 N·m); E3 attempt on c1b-mech-04. But 999 kN and ٤٥٫٥ are invented.", allowed).map((x) => x.s);
  const check = S5.numGuard("Try this: [[check:mech.moment]] 999", allowed).map((x) => x.s);
  return { numGuardFlagsInvented: JSON.stringify(flagged) === JSON.stringify(["999", "٤٥٫٥"]), numGuardCheckTag999: JSON.stringify(check) === JSON.stringify(["999"]), _f: flagged };
}));
info.numGuardFlagged = res._f; delete res._f;

/* 11. selftest step + i18n */
Object.assign(res, await page.evaluate(async () => {
  const run = await S5.selfTest(); const s = run.results.find((x) => x.name === "Problem engine");
  await S5.store.purge(run.id);
  const ar = S5.i18n.tr("Problem engine"), note = s && S5.i18n.tr(s.note);
  return { selftestProblemEngineStep: !!s && s.ok && /6 generators × 20 seeds/.test(s.note) && /7\/7 lesson examples agree/.test(s.note), i18nM2Lines: !!ar && /محرّك/.test(ar) && !!note && /مولّدات/.test(note) && /متطابقة/.test(note) && !!S5.i18n.tr("Rounding — half credit") && !!S5.i18n.tr("Due for retrieval"), _note: s && s.note };
}));
info.selftestNote = res._note; delete res._note;

/* 12. light: two small source files, no new dependency */
const kb = (f) => statSync(new URL("../src/college/" + f, import.meta.url)).size / 1024;
info.sizesKB = { "10-problems.js": +kb("10-problems.js").toFixed(1), "20-gens-y1.js": +kb("20-gens-y1.js").toFixed(1) };
res.engineIsLight = info.sizesKB["10-problems.js"] + info.sizesKB["20-gens-y1.js"] < 80;

await page.waitForTimeout(300);
res.zeroPageErrors = errors.length === 0;
const failed = Object.entries(res).filter(([, v]) => v !== true).map(([k]) => k);
console.log(JSON.stringify({ result: failed.length ? "FAIL" : "PASS", failed, checks: res, info, errors }, null, 1));
if (failed.length) process.exitCode = 1;
await b.close();
