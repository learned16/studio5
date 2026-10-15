// College M3 — the Problem room: campus rooms (civil + arch), problem text Arabic-first, code grading with feedback by
// code (correct / unit slip N-for-kN / sign / wrong), code-made steps after submit, attempt records (score, tier, fade,
// codes), worked-example fading 0→3 (correct climbs, wrong drops), E3 only at level 3 unaided ("Show a step" makes it E2),
// 3 unaided distinct-seed correct → objective chip 'secure' (never 'mastered'), reload resumes the same seed, typed input
// survives a store change (LIVE), backup contains the attempts, no untranslated English on the pset screen in Arabic.
// BASE (default http://localhost:8765/) serves the app; exitCode 1 on any failed check or pageerror.
import { createRequire } from "node:module"; const require = createRequire("/x/"); const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const BASE = process.env.BASE || "http://localhost:8765/", S = process.env.S;
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const res = {}, errors = [], fails = [];
const check = (k, v, detail) => { res[k] = v === true ? true : detail !== undefined ? { ok: false, got: detail } : v; if (v !== true) fails.push(k); };
const shot = async (p, name) => { if (S) await p.screenshot({ path: `${S}/shots/${name}.png`, fullPage: true }).catch(() => {}); };
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } }); const p = await ctx.newPage();
p.on("pageerror", (e) => errors.push(e.message));
await p.goto(BASE); await p.waitForTimeout(1800);
await p.evaluate(() => S5.settings.set("lang", "ar")); await p.waitForTimeout(300);
const leftovers = () => p.evaluate(() => { const out = new Set(); const w = document.createTreeWalker(document.getElementById("view"), NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) { if (S5.i18n.skip(n.parentElement)) continue; const t = n.nodeValue.trim(); if (/[A-Za-z]{3}/.test(t) && !/[؀-ۿ]/.test(t)) out.add(t); } return [...out]; });
const cur = () => p.evaluate(() => { const c = S5.pset.cur; return c && { pid: c.pid, seed: c.seed, fade: c.fade, tier: c.tier, done: c.done, obj: c.obj, kind: c.kind, n: S5.PROB[c.pid].steps(c.p, "ar").length,
  shown: +(document.getElementById("ps-steps") || { dataset: {} }).dataset.shown || 0, fadePill: (document.getElementById("ps-fade") || { dataset: {} }).dataset.fade, tierPill: (document.getElementById("ps-tier") || { dataset: {} }).dataset.tier }; });
// fill every field with the code's key (in the field's default unit), then apply a twist to the first force field
const fill = (mode) => p.evaluate((mode) => {
  const c = S5.pset.cur; const set = (id, v) => { const el = document.getElementById(id); if (el) { el.value = v; el.dispatchEvent(new Event("input", { bubbles: true })); } };
  let target = null;
  for (const f of c.fields) {
    const v = S5.fromSI(c.keys[f.k], f.unit);
    set("ps-in-" + f.k, String(+(f.sense ? Math.abs(v) : v).toPrecision(6))); set("ps-u-" + f.k, f.unit);
    if (f.sense) set("ps-s-" + f.k, v < 0 ? f.sense[1] : f.sense[0]);
    if (!target && f.dim === "force" && !f.sense) target = f;
  }
  const f = target || c.fields[0], key = c.keys[f.k];
  if (mode === "nkn") { set("ps-u-" + f.k, "kN"); set("ps-in-" + f.k, String(+S5.fromSI(key, "N").toPrecision(6))); }
  if (mode === "neg") set("ps-in-" + f.k, String(+(-S5.fromSI(key, f.unit)).toPrecision(6)));
  if (mode === "wrong") set("ps-in-" + f.k, String(+(1.5 * S5.fromSI(key, f.unit)).toPrecision(6)));
  return f.k;
}, mode);
const submit = async () => { const n0 = await p.evaluate(() => S5.store.count("attempt")); await p.click('[data-act="pset-submit"]'); for (let t = 0; t < 40; t++) { await p.waitForTimeout(100); if ((await p.evaluate(() => S5.store.count("attempt"))) > n0 && (await p.$("#ps-result"))) break; } await p.waitForTimeout(150); };
const lastAttempt = () => p.evaluate(() => { const xs = S5.store.list("attempt").sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || "")); return JSON.parse(JSON.stringify(xs[xs.length - 1] || null)); });
const newNumbers = async () => { await p.click('[data-act="pset-new"]'); await p.waitForTimeout(350); };
const fb = (k) => p.evaluate((k) => { const el = document.getElementById("ps-fb-" + k); return el ? { code: el.dataset.code, text: el.textContent } : null; }, k);

/* ---------- campus rooms ---------- */
const rooms = await p.evaluate(() => Object.fromEntries(["civil", "arch"].map((id) => { const bd = S5.CAMPUS.find((x) => x.id === id); const i = bd.rooms.findIndex((r) => r[0] === "Problem room"); return [id, { i, route: i >= 0 ? bd.rooms[i][1] : null }]; })));
check("civilAndArchHaveProblemRoom", rooms.civil.i >= 0 && rooms.civil.route.v === "pset" && rooms.civil.route.kind === "civil" && rooms.arch.i >= 0 && rooms.arch.route.v === "pset" && rooms.arch.route.kind === "arch", rooms);
await p.evaluate((i) => S5.act["campus-room"]({ dataset: { b: "civil", i: String(i) } }), rooms.civil.i); await p.waitForTimeout(900);
const civ = await p.evaluate(() => ({ v: S5.ui.route.v, kind: S5.ui.route.kind, item: !!document.getElementById("ps-item"), root: S5.ui.root(), live: S5.LIVE.has("pset") && S5.ui.isLive(),
  pid: S5.pset.cur && S5.pset.cur.pid, statics: S5.pset.cur && /^(mech|geo)\./.test(S5.pset.cur.pid), program: S5.pset.cur && S5.PROB[S5.pset.cur.pid].program,
  textAr: /[؀-ۿ]/.test((document.getElementById("ps-text") || {}).textContent || ""), noi18n: !!document.querySelector("#ps-text[data-noi18n]"),
  inputs: [...document.querySelectorAll("#ps-fields input")].map((i) => i.getAttribute("inputmode")), units: document.querySelectorAll("#ps-fields select[id^='ps-u-']").length }));
check("campusCivilRoomOpensPset", civ.v === "pset" && civ.kind === "civil" && civ.item && civ.root === "practice" && civ.live && civ.statics && ["civil", "both"].includes(civ.program), civ);
check("problemTextArabicFirstNoi18n", civ.textAr && civ.noi18n, civ);
check("oneDecimalInputAndUnitPickerPerField", civ.inputs.length > 0 && civ.inputs.every((m) => m === "decimal") && civ.units === civ.inputs.length, civ);
const left0 = await leftovers(); check("arabicNoLeftoversFresh", left0.length === 0, left0);
await shot(p, "m3-01-civil-room");
await p.evaluate((i) => S5.act["campus-room"]({ dataset: { b: "arch", i: String(i) } }), rooms.arch.i); await p.waitForTimeout(900);
const arch = await p.evaluate(() => ({ v: S5.ui.route.v, kind: S5.ui.route.kind, pid: S5.pset.cur && S5.pset.cur.pid, gens: S5.pset.gens("arch").map((d) => [d.id, d.program]), chips: [...document.querySelectorAll(".ps-chip")].map((c) => c.dataset.obj) }));
check("archRoomShowsArchOrBothOnly", arch.v === "pset" && arch.kind === "arch" && arch.gens.length > 0 && arch.gens.every(([, pr]) => pr === "arch" || pr === "both") && arch.gens.some(([id]) => id === "geo.compositeCentroid") && arch.chips.includes("statics.centroid") && !arch.chips.includes("statics.reactions"), arch);

/* ---------- the beam-reactions objective: feedback by code ---------- */
await p.evaluate(() => S5.ui.go({ v: "pset", kind: "civil", id: "statics.reactions" })); await p.waitForTimeout(500);
let c = await cur();
check("startsAtFade0WithAllSteps", c.pid === "mech.beamReactions" && c.fade === 0 && c.tier === "E2" && c.shown === c.n && c.fadePill === "0", c);
const seeds = [c.seed];
// N given where kN is asked
let k = await fill("nkn"); await submit();
let f1 = await fb(k), a = await lastAttempt();
check("nForKnGivesUnitCodeAndMessage", f1 && f1.code === "unit" && /kN/.test(f1.text) && /\bN\b/.test(f1.text.replace(/kN/g, "")) && a.codes[k] === "unit" && a.score < 1, { f1, codes: a && a.codes });
const enMsg = await p.evaluate((k) => { const c = S5.pset.cur, f = c.fields.find((x) => x.k === k); const r = S5.grade(String(S5.fromSI(c.keys[k], "N")), "kN", c.keys[k], f, {}); return S5.pset.message(r, f, "en"); }, k);
check("unitMessageEnglishYouGaveNAskedKn", /you gave N, asked kN/.test(enMsg), enMsg);
check("stepsRevealedAfterSubmit", (await cur()).shown === c.n && (await cur()).done === true);
const leftFb = await leftovers(); check("arabicNoLeftoversAfterFeedback", leftFb.length === 0, leftFb);
await shot(p, "m3-02-unit-feedback");
// negated → sign
await newNumbers(); c = await cur(); seeds.push(c.seed);
check("newNumbersDrawsFreshSeed", c.seed !== seeds[0] && !c.done, c);
k = await fill("neg"); await submit(); f1 = await fb(k); a = await lastAttempt();
check("negatedGivesSign", f1 && f1.code === "sign" && a.codes[k] === "sign", { f1, codes: a && a.codes });

/* ---------- correct answer + fading ---------- */
await newNumbers(); c = await cur(); seeds.push(c.seed);
check("fadeStaysAt0AfterErrors", c.fade === 0, c);
await fill("ok"); await submit(); a = await lastAttempt();
const okUI = await p.evaluate(() => { const r = document.getElementById("ps-result"); return { ok: r && r.dataset.ok, text: r && r.textContent, steps: document.querySelectorAll("#ps-steps li").length, codes: [...document.querySelectorAll(".ps-fb")].map((x) => x.dataset.code) }; });
check("correctShowsCorrectAndSteps", okUI.ok === "true" && /صحيح/.test(okUI.text) && okUI.steps === c.n && okUI.codes.every((x) => x === "ok"), okUI);
check("attemptRecordCorrect", a && a.type === "attempt" && a.pid === "mech.beamReactions" && a.seed === c.seed && a.v === 1 && a.obj === "statics.reactions" && a.lesson === "c1b-mech-04" && a.score === 1 && a.tier === "E2" && a.mode === "practice" && a.fade === 0
  && Object.values(a.codes).every((x) => x === "ok") && Object.keys(a.given).length === 3 && typeof a.ms === "number", a);
await newNumbers(); c = await cur(); seeds.push(c.seed);
const fade1 = c; check("fade1HidesSomeSteps", c.fade === 1 && c.shown < c.n && c.shown > 0 && c.tier === "E2", c);
await fill("ok"); await submit();
await newNumbers(); c = await cur(); seeds.push(c.seed);
check("twoCorrectMoveFade0to2", c.fade === 2 && c.shown < fade1.shown && c.tier === "E2", c);
k = await fill("wrong"); await submit(); a = await lastAttempt();
check("wrongStoresCodeAndFade", a.codes[k] === "wrong" && a.fade === 2 && a.score < 1, a && { codes: a.codes, fade: a.fade });
await newNumbers(); c = await cur(); seeds.push(c.seed);
check("wrongDropsOneLevel", c.fade === 1, c);
await fill("ok"); await submit(); await newNumbers(); await fill("ok"); await submit(); await newNumbers();
c = await cur(); seeds.push(c.seed);
check("level3ShowsNoStepsAndIsE3", c.fade === 3 && c.shown === 0 && c.tier === "E3" && c.tierPill === "E3", c);
await shot(p, "m3-03-level3");

/* ---------- LIVE: typed input survives a store change ---------- */
await p.fill("#ps-fields input", "123.4");
await p.evaluate(() => S5.bus.emit("change", { type: "task" })); await p.waitForTimeout(500);
check("typedInputSurvivesStoreChange", (await p.inputValue("#ps-fields input")) === "123.4");

/* ---------- 3 unaided correct on distinct seeds → secure ---------- */
const states = [];
for (let i = 0; i < 3; i++) {
  if (i) { await newNumbers(); }
  c = await cur(); if (i) seeds.push(c.seed);
  await fill("ok"); await submit(); a = await lastAttempt();
  states.push({ tier: a.tier, fade: a.fade, score: a.score, chip: await p.evaluate(() => document.querySelector('.ps-chip[data-obj="statics.reactions"]').dataset.state) });
}
check("threeUnaidedAreE3", states.every((s) => s.tier === "E3" && s.fade === 3 && s.score === 1), states);
check("chipPracticingThenSecure", states[1].chip === "practicing" && states[2].chip === "secure", states);
check("secureNotMastered", await p.evaluate(() => S5.mastery.of("statics.reactions") === "secure"));
check("distinctSeeds", new Set(seeds).size === seeds.length, seeds);
const leftSec = await leftovers(); check("arabicNoLeftoversSecure", leftSec.length === 0, leftSec);
await shot(p, "m3-04-secure");

/* ---------- asking for a step at level 3 makes the item aided (E2) ---------- */
await newNumbers(); c = await cur();
await p.fill("#ps-fields input", "77.5");
await p.click('[data-act="pset-steps"]'); await p.waitForTimeout(300);
const hinted = await cur();
check("typedInputSurvivesShowStep", (await p.inputValue("#ps-fields input")) === "77.5");
check("showStepAtLevel3MakesE2", c.tier === "E3" && hinted.fade === 3 && hinted.shown === 1 && hinted.tier === "E2" && hinted.tierPill === "E2", { c, hinted });

/* ---------- reload resumes the same seed; attempts persist; backup has them ---------- */
const before = { seed: hinted.seed, n: await p.evaluate(() => S5.store.count("attempt")) };
await p.reload(); await p.waitForTimeout(1800);
await p.evaluate(() => S5.ui.go({ v: "pset", kind: "civil", id: "statics.reactions" })); await p.waitForTimeout(500);
const after = await cur(); const nAfter = await p.evaluate(() => S5.store.count("attempt"));
check("reloadKeepsSeedAndHint", after.seed === before.seed && after.pid === "mech.beamReactions" && after.tier === "E2" && after.shown === 1, { before, after });
check("attemptsPersistAfterReload", nAfter === before.n && nAfter === 10, { before: before.n, nAfter });
const bk = await p.evaluate(async () => { const pkg = await S5.backup.build({ includeFiles: false }); return JSON.parse(pkg.body).records.filter((r) => r.type === "attempt").length; });
check("backupContainsAttempts", bk === nAfter, { bk, nAfter });
check("chipStillSecureAfterReload", await p.evaluate(() => document.querySelector('.ps-chip[data-obj="statics.reactions"]').dataset.state === "secure"));
const leftR = await leftovers(); check("arabicNoLeftoversAfterReload", leftR.length === 0, leftR);

/* ---------- entry points: the Practice page card and 'Graded practice' on mapped lessons ---------- */
const leftIn = (sel) => p.evaluate((sel) => { const out = new Set(), root = document.querySelector(sel); if (!root) return ["(missing " + sel + ")"]; const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) { if (S5.i18n.skip(n.parentElement)) continue; const t = n.nodeValue.trim(); if (/[A-Za-z]{3}/.test(t) && !/[؀-ۿ]/.test(t)) out.add(t); } return [...out]; }, sel);
await p.evaluate(() => S5.ui.go({ v: "practice" })); await p.waitForTimeout(500);
const card = await p.evaluate(() => [...document.querySelectorAll('#ps-card [data-act="open"][data-v="pset"]')].map((x) => x.dataset.kind));
check("practicePageHasProblemRoomCard", card.includes("civil") && card.includes("arch"), card);
const leftCard = await leftIn("#ps-card"); check("arabicNoLeftoversPracticeCard", leftCard.length === 0, leftCard);
await p.evaluate(async () => { if (S5.kb.load) await S5.kb.load(); }); await p.waitForTimeout(300);
await p.evaluate(() => S5.ui.go({ v: "tutor", tab: "learn", id: "c1b-mech-04" })); await p.waitForTimeout(800);
const lb = await p.evaluate(() => { const x = document.querySelector('#view [data-act="open"][data-v="pset"]'); return x && { kind: x.dataset.kind, id: x.dataset.id, text: x.textContent }; });
check("lessonHasGradedPracticeButton", !!lb && lb.kind === "civil" && lb.id === "statics.reactions" && /[؀-ۿ]/.test(lb.text), lb);
const rt = await p.evaluate(() => [S5.pset.lessonRoute(S5.kb.byId.get("a2-mec-04"), "arch"), S5.pset.lessonRoute(S5.kb.byId.get("c1b-mech-09")), S5.pset.lessonRoute(S5.kb.byId.get("c1b-mech-06") || { id: "none" })]);
check("archLessonRoutesToArchRoom", !!rt[0] && rt[0].kind === "arch" && rt[0].id === "statics.centroid" && !!rt[1] && rt[1].kind === "civil" && rt[2] === null, rt);
if (lb) { await p.click('#view [data-act="open"][data-v="pset"]'); await p.waitForTimeout(500); }
check("lessonButtonOpensPset", await p.evaluate(() => S5.ui.route.v === "pset" && S5.pset.cur && S5.pset.cur.obj === "statics.reactions"));

/* ---------- the arch room grades its own (shared) objective; English rendering ---------- */
await p.evaluate(() => S5.ui.go({ v: "pset", kind: "arch" })); await p.waitForTimeout(500);
c = await cur(); await fill("ok"); await submit(); a = await lastAttempt();
check("archRoomCorrectAttempt", c.kind === "arch" && c.pid === "geo.compositeCentroid" && a.pid === "geo.compositeCentroid" && a.obj === "statics.centroid" && a.kind === "arch" && a.score === 1 && a.tier === "E2", { c, a });
await p.evaluate(() => S5.settings.set("lang", "en")); await p.waitForTimeout(300);
await p.evaluate(() => S5.ui.go({ v: "pset", kind: "civil", id: "statics.reactions" })); await p.waitForTimeout(500);
const en = await p.evaluate(() => ({ text: document.getElementById("ps-text").textContent, h1: document.querySelector("#view h1").textContent, btn: (document.querySelector('[data-act="pset-submit"],[data-act="pset-new"]') || {}).textContent }));
check("englishRendering", /[A-Za-z]{4}/.test(en.text) && !/[؀-ۿ]/.test(en.text) && en.h1 === "Problem room" && /Submit|New numbers/.test(en.btn || ""), en);
await p.evaluate(() => S5.settings.set("lang", "ar")); await p.waitForTimeout(200);

check("noPageErrors", errors.length === 0, errors);
check("noCollegeErrors", (await p.evaluate(() => (S5.COLLEGE_ERRORS || []).length)) === 0, await p.evaluate(() => S5.COLLEGE_ERRORS));
console.log(JSON.stringify({ ok: fails.length === 0, fails, res, errors }, null, 1));
if (fails.length || errors.length) process.exitCode = 1;
await b.close();
