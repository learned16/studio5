// Principles of Calculus, weeks 11–16 (src/college/22-gens-deriv.js): every key re-derived by an independent numeric
// method (central differences, −F_x/F_y for the implicit curve, time-stepping the ladder and the tank, scanning f for
// local extrema, evaluating f near the pole and at ±10⁶, brute-force search for the optimum), named mistakes graded as
// 'mis' with their explanation, bilingual text/steps, and the Architecture Problem room opening the new objectives.
import { createRequire } from "node:module"; const require = createRequire("/x/"); const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const BASE = process.env.BASE || "http://localhost:8765/", S = process.env.S || "/tmp";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const page = await (await b.newContext({ viewport: { width: 1280, height: 860 } })).newPage(); const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto(BASE); await page.waitForTimeout(1500);
const IDS = ["calc.parabola", "calc.inflection", "calc.derivPoly", "calc.tangent", "calc.quotient", "calc.trigDeriv", "calc.chain", "calc.implicit", "calc.fracPow", "calc.rates", "calc.extrema", "calc.asymptotes", "calc.optimize"];
const res = await page.evaluate((IDS) => {
  const r = { loaded: IDS.every((id) => S5.PROB[id]) && !(S5.COLLEGE_ERRORS || []).length, deterministic: true, finite: true, ownKeyOk: true, independent: true, bilingual: true, namedMistakes: true, variety: true };
  const bad = []; const fail = (k, m) => { r[k] = false; if (bad.length < 15) bad.push(k + ": " + m); };
  const close = (a, b, tol = 1e-5) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
  const dnum = (f, x, h = 1e-5) => (f(x + h) - f(x - h)) / (2 * h);
  const keyStr = (v) => String(v);
  for (const id of IDS) {
    const d = S5.PROB[id], seen = new Set();
    for (let i = 0; i < 300; i++) {
      const seed = S5.hashSeed("calc2:" + id + ":" + i), p = d.gen(S5.rng(seed)), js = JSON.stringify(p); seen.add(js);
      if (js !== JSON.stringify(d.gen(S5.rng(seed)))) fail("deterministic", id);
      const k = d.solve(p), F = d.fields(p);
      if (!F.every((f) => Number.isFinite(k[f.k]))) { fail("finite", id + " " + js); continue; }
      const given = Object.fromEntries(F.map((f) => [f.k, [keyStr(k[f.k]), ""]])), g4 = Object.fromEntries(F.map((f) => [f.k, [String(+k[f.k].toPrecision(5)), ""]]));
      if (!S5.prob.grade(d, p, given).ok || !S5.prob.grade(d, p, g4).ok) fail("ownKeyOk", id + " " + js);
      try {
        if (id === "calc.parabola") { const t = d.text(p, "en").match(/y = (.*)\.$/)[1].replace(/−/g, "-").replace(/\s/g, "").replace(/-/g, "+-").split("+").filter(Boolean).map((u) => { const m = u.match(/^(-?)(\d*)(x?)(²)?$/); return [(m[1] ? -1 : 1) * (m[2] ? +m[2] : 1), m[3] ? (m[4] ? 2 : 1) : 0]; });
          const f = (x) => t.reduce((s, [c, e]) => s + c * x ** e, 0); if (Math.abs(dnum(f, k.h)) > 1e-6 || !close(f(k.h), k.k, 1e-9)) throw new Error("vertex"); }
        if (id === "calc.inflection") { const cs = d.coef(p), f = (x) => cs[0] * x ** 3 + cs[1] * x ** 2 + cs[2] * x + cs[3], f2 = (x) => dnum((z) => dnum(f, z, 1e-4), x, 1e-4);
          if (!close(f(k.x), k.y, 1e-9) || !(Math.sign(f2(k.x - 0.5)) === -Math.sign(f2(k.x + 0.5)))) throw new Error("inflection"); }
        if (id === "calc.derivPoly") { const f = (x) => p.a * x ** 3 + p.b * x ** 2 + p.c * x + p.d; if (!close(dnum(f, p.x0), k.D, 1e-6)) throw new Error("f′"); }
        if (id === "calc.tangent") { const f = (x) => p.a * x * x + p.b * x + p.c, m = dnum(f, p.x0); if (!close(m, k.m, 1e-6) || !close(k.m * p.x0 + k.B, f(p.x0), 1e-9)) throw new Error("tangent"); }
        if (id === "calc.quotient") { const f = (x) => (p.a * x + p.b) / (p.c * x + p.d); if (!close(dnum(f, p.x0, 1e-6), k.D, 1e-5)) throw new Error("quot " + dnum(f, p.x0) + " vs " + k.D); }
        if (id === "calc.trigDeriv") { const f = (x) => p.A * Math.sin(p.k * x) + p.B * Math.cos(p.m * x); if (!close(dnum(f, Math.PI / 2, 1e-6), k.D, 1e-5)) throw new Error("trig"); }
        if (id === "calc.chain") { const f = (x) => (p.a * x + p.b) ** p.n; if (!close(dnum(f, p.x0, 1e-6), k.D, 1e-5)) throw new Error("chain"); }
        if (id === "calc.implicit") { const Fn = (x, y) => x * x + x * y + y * y; const Fx = dnum((x) => Fn(x, p.y0), p.x0), Fy = dnum((y) => Fn(p.x0, y), p.y0); if (!close(-Fx / Fy, k.D, 1e-6)) throw new Error("implicit"); const C = +d.text(p, "en").match(/= (\d+) passes/)[1]; if (Fn(p.x0, p.y0) !== C) throw new Error("point not on curve"); }
        if (id === "calc.fracPow") { const x0 = +d.text(p, "en").match(/at x = (\d+)/)[1], f = (x) => p.a * Math.pow(x, p.p / p.q); if (!close(dnum(f, x0, 1e-6), k.D, 1e-5)) throw new Error("frac"); }
        if (id === "calc.rates") { if (p.kind === "cube") { const V = (t) => (p.s + p.v * t) ** 3; if (!close(dnum(V, 0, 1e-6), k.R, 1e-5)) throw new Error("cube"); } else { const y = (t) => Math.sqrt(p.L ** 2 - (p.x + p.v * t) ** 2); if (p.x ** 2 + p.y ** 2 !== p.L ** 2 || !close(dnum(y, 0, 1e-7), k.R, 1e-5)) throw new Error("ladder"); } }
        if (id === "calc.extrema") { const cs = d.text(p, "en").match(/f\(x\) = (.*)\. Find/)[1].replace(/−/g, "-").replace(/\s/g, "").replace(/-/g, "+-").split("+").filter(Boolean).map((u) => { const m = u.match(/^(-?)(\d*)(x?)(²|³)?$/); return [(m[1] ? -1 : 1) * (m[2] ? +m[2] : 1), m[3] ? (m[4] === "³" ? 3 : m[4] === "²" ? 2 : 1) : 0]; });
          const f = (x) => cs.reduce((s, [c, e]) => s + c * x ** e, 0), h = 1e-3; if (!(f(k.xmax) > f(k.xmax - h) && f(k.xmax) > f(k.xmax + h))) throw new Error("not max"); if (!(f(k.xmin) < f(k.xmin - h) && f(k.xmin) < f(k.xmin + h))) throw new Error("not min"); }
        if (id === "calc.asymptotes") { const f = (x) => (p.a * x + p.b) / (p.c * x + p.d); if (Math.abs(f(k.xv + 1e-9)) < 1e6 || !close(f(1e9), k.yh, 1e-6) || !close(f(-1e9), k.yh, 1e-6)) throw new Error("asym"); }
        if (id === "calc.optimize") { let best = [-1, 0]; if (p.kind === "court") { for (let x = 0; x <= p.L / 2; x += p.L / 4000) { const A = x * (p.L - 2 * x); if (A > best[0]) best = [A, x]; } } else { for (let x = 0; x <= p.a / 2; x += p.a / 6000) { const V = x * (p.a - 2 * x) ** 2; if (V > best[0]) best = [V, x]; } }
          if (!close(best[1], k.x, 1e-3) || !close(best[0], k.A, 1e-6)) throw new Error("optimum " + best + " vs " + k.x + "," + k.A); }
      } catch (e) { fail("independent", id + " " + e.message + " " + js); }
      if (i < 30) for (const l of ["ar", "en"]) { const s = d.text(p, l) + d.steps(p, l).join(" "); if ((l === "ar") !== /[؀-ۿ]/.test(s) || /undefined|NaN/.test(s)) fail("bilingual", id + " " + l + " " + s.slice(0, 80)); }
      const mis = (d.mis && d.mis(p)) || {};
      for (const f of F) for (const [mid, val, note] of mis[f.k] || []) {
        if (!note || Math.abs(val - k[f.k]) <= 0.03 * Math.abs(k[f.k]) + 1e-12) continue;
        const gv = Object.fromEntries(F.map((x) => [x.k, [keyStr(x.k === f.k ? val : k[x.k]), ""]])), out = S5.prob.grade(d, p, gv).results[f.k];
        const other = (mis[f.k] || []).some(([m2, v2]) => m2 !== mid && Math.abs(v2 - val) < 1e-9);
        if (out.code !== "mis" || (!other && (out.mid !== mid || !out.note || !out.note.ar || !out.note.en))) fail("namedMistakes", `${id}.${f.k} ${mid} → ${out.code}/${out.mid}`);
      }
    }
    if (seen.size < 40) fail("variety", id + " only " + seen.size);
  }
  const sc = S5.prob.selfCheck(10); r.selfCheck = sc.ok; if (!sc.ok) bad.push(...sc.bad.slice(0, 5));
  r.bad = bad; return r;
}, IDS);
await page.evaluate(() => { S5.settings.set("lang", "ar"); S5.ui.go({ v: "pset", kind: "arch", id: "calc.deriv.chain" }); }); await page.waitForTimeout(700);
res.chainOpens = await page.evaluate(() => !!S5.pset.cur && S5.PROB[S5.pset.cur.pid].obj === "calc.deriv.chain");
await page.screenshot({ path: S + "/shots/92-calc-chain.png" });
await page.evaluate(() => { S5.ui.go({ v: "pset", kind: "arch", id: "calc.deriv.optim" }); }); await page.waitForTimeout(600);
res.optimOpens = await page.evaluate(() => !!S5.pset.cur && S5.PROB[S5.pset.cur.pid].obj === "calc.deriv.optim");
await page.screenshot({ path: S + "/shots/93-calc-optim.png" });
res.noPageErrors = errors.length === 0;
const failed = Object.entries(res).filter(([k, v]) => v === false).map(([k]) => k);
console.log(JSON.stringify({ ...res, failed, errors }, null, 1));
if (failed.length) process.exitCode = 1;
await b.close();
