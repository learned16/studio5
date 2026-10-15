// Principles of Calculus, weeks 1–10 (src/college/21-gens-calc.js): every key re-derived here by an independent method
// (elimination for determinants, A·A⁻¹ = I, substitution into the system, points on the line, points on the circle
// parsed from the problem text, numeric limits evaluated from the polynomials parsed out of the text), named mistakes
// graded as 'mis' with their explanation, pure numbers never coded as unit slips, and the Architecture Problem room.
import { createRequire } from "node:module"; const require = createRequire("/x/"); const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const BASE = process.env.BASE || "http://localhost:8765/", S = process.env.S || "/tmp";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const page = await (await b.newContext({ viewport: { width: 1280, height: 860 } })).newPage(); const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto(BASE); await page.waitForTimeout(1500);
const IDS = ["calc.matProduct", "calc.det2", "calc.det3", "calc.inverse2", "calc.cramer", "calc.line2pts", "calc.circle", "calc.limitFactor", "calc.limitTrig", "calc.limitInf", "calc.continuity"];
const res = await page.evaluate((IDS) => {
  const r = { loaded: IDS.every((id) => S5.PROB[id]) && !(S5.COLLEGE_ERRORS || []).length, deterministic: true, finite: true, ownKeyOk: true, independent: true, bilingual: true, namedMistakes: true, variety: true };
  const bad = []; const fail = (k, m) => { r[k] = false; if (bad.length < 15) bad.push(k + ": " + m); };
  // --- independent helpers ---
  const detElim = (M) => { const a = M.map((x) => x.slice()), n = a.length; let d = 1; for (let i = 0; i < n; i++) { let p = i; for (let j = i + 1; j < n; j++) if (Math.abs(a[j][i]) > Math.abs(a[p][i])) p = j; if (Math.abs(a[p][i]) < 1e-12) return 0; if (p !== i) { [a[p], a[i]] = [a[i], a[p]]; d = -d; } d *= a[i][i]; for (let j = i + 1; j < n; j++) { const f = a[j][i] / a[i][i]; for (let k = i; k < n; k++) a[j][k] -= f * a[i][k]; } } return d; };
  const parsePoly = (s) => { // "3x² − 2x + 5" → f(x)
    const t = s.replace(/−/g, "-").replace(/\s+/g, "").replace(/-/g, "+-").split("+").filter(Boolean);
    const terms = t.map((u) => { const m = u.match(/^(-?)(\d*)(x?)(²|³)?$/); if (!m) throw new Error("poly " + s); const c = (m[1] ? -1 : 1) * (m[2] ? +m[2] : 1), pw = m[3] ? (m[4] === "²" ? 2 : m[4] === "³" ? 3 : 1) : 0; return [m[3] || m[2] ? c : NaN, pw]; });
    return (x) => terms.reduce((s, [c, p]) => s + c * x ** p, 0);
  };
  const close = (a, b, tol = 1e-6) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
  const keyStr = (v) => String(v);
  for (const id of IDS) {
    const d = S5.PROB[id], seen = new Set();
    for (let i = 0; i < 300; i++) {
      const seed = S5.hashSeed("calc:" + id + ":" + i), p = d.gen(S5.rng(seed)), js = JSON.stringify(p); seen.add(js);
      if (js !== JSON.stringify(d.gen(S5.rng(seed)))) fail("deterministic", id);
      const k = d.solve(p), F = d.fields(p);
      if (!F.every((f) => Number.isFinite(k[f.k]))) { fail("finite", id + " " + js); continue; }
      const given = Object.fromEntries(F.map((f) => [f.k, [keyStr(k[f.k]), ""]])), g4 = Object.fromEntries(F.map((f) => [f.k, [String(+k[f.k].toPrecision(5)), ""]]));
      if (!S5.prob.grade(d, p, given).ok || !S5.prob.grade(d, p, g4).ok) fail("ownKeyOk", id + " " + js);
      try { // ---- independent re-derivation ----
        const t = d.text(p, "en");
        if (id === "calc.matProduct") { for (let a = 0; a < 2; a++) for (let c = 0; c < 2; c++) { let s = 0; for (let m = 0; m < p.B.length; m++) s += p.A[a][m] * p.B[m][c]; if (s !== k[`c${a + 1}${c + 1}`]) throw new Error("product"); } }
        if (id === "calc.det2" || id === "calc.det3") { if (!close(detElim(p.A), k.D, 1e-9)) throw new Error("det " + detElim(p.A) + " vs " + k.D); }
        if (id === "calc.inverse2") { const I = [[k.i11, k.i12], [k.i21, k.i22]]; for (let a = 0; a < 2; a++) for (let c = 0; c < 2; c++) { const s = p.A[a][0] * I[0][c] + p.A[a][1] * I[1][c]; if (!close(s, a === c ? 1 : 0, 1e-12)) throw new Error("A·A⁻¹"); } }
        if (id === "calc.cramer") { const x = ["x", "y", "z"].slice(0, p.A.length).map((v) => k[v]); p.A.forEach((row, a) => { if (!close(row.reduce((s, c, j) => s + c * x[j], 0), p.b[a], 1e-12)) throw new Error("Ax=b"); }); if (!x.every(Number.isInteger)) throw new Error("integer solution"); }
        if (id === "calc.line2pts") { const m = t.match(/P1\((−?\d+), (−?\d+)\) and P2\((−?\d+), (−?\d+)\)/).slice(1).map((s) => +s.replace("−", "-")); if (!close(k.m * m[0] + k.b, m[1], 1e-12) || !close(k.m * m[2] + k.b, m[3], 1e-12)) throw new Error("points"); }
        if (id === "calc.circle") { const eq = t.match(/circle (.*) = 0/)[1].replace(/−/g, "-").replace(/\s/g, ""); const D = +((eq.match(/([+-]\d+)x(?!²)/) || [0, 0])[1]), E = +((eq.match(/([+-]\d+)y(?!²)/) || [0, 0])[1]), C = +((eq.match(/([+-]\d+)$/) || [0, 0])[1]);
          for (const [x, y] of [[k.h + k.r, k.k], [k.h - k.r, k.k], [k.h, k.k + k.r], [k.h, k.k - k.r]]) if (!close(x * x + y * y + D * x + E * y + C, 0, 1e-9)) throw new Error("not on circle " + eq);
          if (!close(k.h * k.h + k.k * k.k + D * k.h + E * k.k + C, -k.r * k.r, 1e-9)) throw new Error("radius"); }
        if (id === "calc.limitFactor") { const [, a, N, Dn] = t.match(/x→(−?\d+) of \((.*)\) \/ \((.*)\)\./); const x0 = +a.replace("−", "-"), fN = parsePoly(N), fD = parsePoly(Dn);
          if (Math.abs(fN(x0)) > 1e-9 || Math.abs(fD(x0)) > 1e-9) throw new Error("not 0/0"); const L = (fN(x0 + 1e-6) / fD(x0 + 1e-6) + fN(x0 - 1e-6) / fD(x0 - 1e-6)) / 2; if (!close(L, k.L, 1e-5)) throw new Error("limit " + L + " vs " + k.L); }
        if (id === "calc.limitTrig") { const x = 1e-4, { f, k: kk, m } = p, v = { sinOverX: Math.sin(kk * x) / (m * x), sinOverSin: Math.sin(kk * x) / Math.sin(m * x), tanOverX: Math.tan(kk * x) / (m * x), oneMinusCos: (1 - Math.cos(kk * x)) / (m * x * x), xOverSin: (m * x) / Math.sin(kk * x) }[f]; if (!close(v, k.L, 1e-5)) throw new Error("trig " + f + " " + v + " vs " + k.L); }
        if (id === "calc.limitInf") { const [, N, Dn] = t.match(/x→∞ of \((.*)\) \/ \((.*)\)\./); const fN = parsePoly(N), fD = parsePoly(Dn), X = 1e7; if (!close(fN(X) / fD(X), k.L, 1e-5) && !(k.L === 0 && Math.abs(fN(X) / fD(X)) < 1e-5)) throw new Error("inf " + fN(X) / fD(X) + " vs " + k.L); }
        if (id === "calc.continuity") { if (p.kind === "hole") { const c = p.c, x = c + 1e-7; if (!close((x * x - c * c) / (x - c), k.k, 1e-5)) throw new Error("hole"); } else { if (!close(p.a * p.c + p.b, k.k * p.c * p.c, 1e-12)) throw new Error("piece"); } }
      } catch (e) { fail("independent", id + " " + e.message + " " + js); }
      if (i < 30) for (const l of ["ar", "en"]) { const s = d.text(p, l) + d.steps(p, l).join(" "); if ((l === "ar") !== /[؀-ۿ]/.test(s)) fail("bilingual", id + " " + l); }
      // named mistakes → code 'mis' with the explanation (unless the wrong value happens to equal the key)
      const mis = (d.mis && d.mis(p)) || {};
      for (const f of F) for (const [mid, val, note] of mis[f.k] || []) {
        if (!note || Math.abs(val - k[f.k]) <= 0.03 * Math.abs(k[f.k]) + 1e-12) continue;
        const gv = Object.fromEntries(F.map((x) => [x.k, [keyStr(x.k === f.k ? val : k[x.k]), ""]])), out = S5.prob.grade(d, p, gv).results[f.k];
        const other = (mis[f.k] || []).some(([m2, v2]) => m2 !== mid && Math.abs(v2 - val) < 1e-9); // two mistakes giving the same number: either note is right
        if (out.code !== "mis" || (!other && (out.mid !== mid || !out.note || !out.note.ar || !out.note.en))) fail("namedMistakes", `${id}.${f.k} ${mid} → ${out.code}/${out.mid}`);
      }
    }
    if (seen.size < 60) fail("variety", id + " only " + seen.size);
  }
  // pure numbers: ×10 is plainly wrong, never a "unit slip"; fractions and Arabic digits accepted
  const F = { dim: "none", units: [""], unit: "", tol: "exact" };
  r.noUnitForPureNumbers = S5.grade("30", "", 3, F).code === "wrong" && S5.grade("0.3", "", 3, F).code === "wrong";
  r.fractionsExact = S5.grade("7/3", "", 7 / 3, F).code === "ok" && S5.grade("2.333", "", 7 / 3, F).code === "ok" && S5.grade("٧/٣", "", 7 / 3, F).code === "ok" && S5.grade("−3/5", "", -0.6, F).code === "ok";
  r.signStillDetected = S5.grade("-4", "", 4, F).code === "sign";
  const sc = S5.prob.selfCheck(10); r.selfCheck = sc.ok; if (!sc.ok) bad.push(...sc.bad.slice(0, 5));
  r.bad = bad; return r;
}, IDS);
// the Architecture Problem room shows the calculus objectives; a named mistake shows its explanation
await page.evaluate(() => { S5.settings.set("lang", "ar"); S5.ui.go({ v: "pset", kind: "arch", id: "calc.matrix.det" }); }); await page.waitForTimeout(700);
res.archRoomHasCalc = await page.evaluate(() => ["calc.matrix.ops", "calc.matrix.det", "calc.limits"].every((o) => document.querySelector(`[data-obj="${o}"], [data-id="${o}"]`) || document.body.innerHTML.includes(o)));
const ui = await page.evaluate(async () => {
  const c = S5.pset.cur, d = S5.PROB[c.pid], mis = d.mis(c.p).D[0];
  document.getElementById("ps-in-D").value = String(mis[1]); await S5.pset.submit(); await new Promise((x) => setTimeout(x, 400));
  const fb = document.getElementById("ps-fb-D");
  return { pid: c.pid, code: fb && fb.dataset.code, text: fb && fb.innerText, arabic: /[؀-ۿ]/.test(fb ? fb.innerText : "") };
});
res.uiNamedMistake = ui.code === "mis" && ui.arabic && ui.text.includes(ui.pid === "calc.det3" ? "+ − +" : "a·d");
await page.screenshot({ path: S + "/shots/90-calc-det.png" });
await page.evaluate(() => { S5.ui.go({ v: "pset", kind: "arch", id: "calc.limits" }); }); await page.waitForTimeout(600);
res.limitsOpens = await page.evaluate(() => !!S5.pset.cur && S5.PROB[S5.pset.cur.pid].obj === "calc.limits");
await page.screenshot({ path: S + "/shots/91-calc-limit.png" });
res.noPageErrors = errors.length === 0;
const failed = Object.entries(res).filter(([k, v]) => v === false).map(([k]) => k);
console.log(JSON.stringify({ ...res, ui, failed, errors }, null, 1));
if (failed.length) process.exitCode = 1;
await b.close();
