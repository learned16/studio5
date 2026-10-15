// College M8 — the Jury room: rubrics, the campus room, pin-up (photo ≤1280 px JPEG 0.85, or an ink page), intent,
// self-first gate, the AI juror through the governed path (json, temperature 0.2, the board image), a malformed reply
// shown as "juror unavailable", a hand-injected reply validated by code (unknown id dropped, level 7 → 4, weighted
// total), professor scores typed verbatim, calibration deltas, persistence, backup, Arabic strings, mastery untouched.
// BASE (default http://localhost:8765/) serves the app. The AI juror runs against the Worker mock (TUTOR_MOCK=1):
// BASE itself when it is the standalone app, else WBASE (default http://127.0.0.1:8787/ only when BASE is not set).
// With no reachable Worker the same AI checks run with an in-page stand-in that answers exactly like the mock.
import { createRequire } from "node:module"; const require = createRequire("/x/"); const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const BASE = process.env.BASE || "http://localhost:8765/", S = process.env.S;
const WBASE = process.env.WBASE || (process.env.BASE ? "" : "http://127.0.0.1:8787/");
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const res = {}, errors = [], fails = [];
const check = (k, v, detail) => { res[k] = v === true ? true : detail !== undefined ? { ok: false, got: detail } : v; if (v !== true) fails.push(k); };
const shot = async (p, name) => { if (S) await p.screenshot({ path: `${S}/shots/${name}.png`, fullPage: true }).catch(() => {}); };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const until = async (p, fn, arg, ms = 10000) => { for (let t = 0; t < ms; t += 150) { if (await p.evaluate(fn, arg)) return true; await wait(150); } return false; };
const newPage = async (url) => {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } }); const p = await ctx.newPage();
  p.on("pageerror", (e) => errors.push(url + ": " + e.message)); await p.goto(url); await p.waitForTimeout(1800); return p;
};
const rec = (p, id) => p.evaluate((i) => JSON.parse(JSON.stringify(S5.store.get(i))), id);
const leftovers = (p) => p.evaluate(() => { const out = new Set(); const w = document.createTreeWalker(document.getElementById("view"), NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) { if (S5.i18n.skip(n.parentElement)) continue; const t = n.nodeValue.trim(); if (/[A-Za-z]{3}/.test(t) && !/[؀-ۿ]/.test(t)) out.add(t); } return [...out]; });
const guardSnap = (p) => p.evaluate(() => JSON.stringify({ attempts: S5.store.count("attempt"), tutorProg: S5.store.meta.tutorProg || {}, studioProg: S5.store.meta.studioProg || {},
  mastery: S5.mastery && S5.OBJ ? Object.keys(S5.OBJ).map((o) => [o, S5.mastery.of(o)]) : null }));
// the self, AI and professor levels used below (rubric "comp"); totals are recomputed here from the weights the page exposes
const SELF = { order: 3, relate: 2, propor: 4, void: 3, intent: 2, craft: 3 };
const VALID = { criteria: [{ id: "order", level: 4, evidence: "dominant cylinder on the axis" }, { id: "relate", level: 7, evidence: "interlocking joints" }, { id: "bogus", level: 3, evidence: "x" },
  { id: "propor", level: 2, evidence: "sizes look arbitrary" }, { id: "void", level: "3", evidence: "court between forms" }, { id: "intent", level: 0, evidence: "hard to find" }, { id: "craft", level: 2.6, evidence: "clean cuts" }], questions: ["Why is the cone subordinate?", "What does the base do?", 5] };
const AI_EXPECT = { order: 4, relate: 4, propor: 2, void: 3, intent: 1, craft: 3 };
const PROF = { order: 3, relate: 3, propor: 3, void: 2, intent: 2, craft: 3 };
const wtotal = (W, sc) => Object.keys(W).reduce((a, k) => a + W[k] * sc[k], 0) / (4 * Object.values(W).reduce((a, x) => a + x, 0)) * 100;

// a Worker answers /api/tutor/status with JSON; the mock's owner claim is reset BEFORE a page loads (a page may claim at boot)
const isWorker = async (u) => { try { const q = await fetch(u + "api/tutor/status"); return q.ok && typeof (await q.json()).claimed === "boolean"; } catch { return false; } };
const resetWorker = (u) => fetch(u + "api/tutor/reset", { method: "POST" }).catch(() => {});
if (await isWorker(BASE)) await resetWorker(BASE);

/* ---------- A: the app at BASE ---------- */
const A = await newPage(BASE);
await A.evaluate(() => S5.settings.set("lang", "ar")); await A.waitForTimeout(200);
const modeA = await A.evaluate(() => ({ standalone: S5.standalone, ai: S5.ai.state }));
const guardA0 = await guardSnap(A);
// rubrics: 3 Year-1 rubrics, 4–6 criteria each, 4 bilingual levels, weights add up to 100
const shape = await A.evaluate(() => { const ar = (s) => /[؀-ۿ]/.test(s || ""), en = (s) => /[A-Za-z]{3}/.test(s || ""); const R = S5.RUBRICS || {};
  return ["comp", "bubble", "persp"].map((k) => { const r = R[k]; if (!r) return k + ": missing"; const ids = new Set(r.criteria.map((c) => c.id));
    const ok = r.criteria.length >= 4 && r.criteria.length <= 6 && ids.size === r.criteria.length && r.criteria.reduce((a, c) => a + c.w, 0) === 100 && en(r.en) && ar(r.ar) && en(r.brief.en) && ar(r.brief.ar)
      && r.criteria.every((c) => en(c.en) && ar(c.ar) && c.lv.length === 4 && c.lv.every((l) => en(l.en) && ar(l.ar))) && S5.jury.LEVELS.length === 4;
    return ok ? true : k + ": bad shape"; }); });
check("rubrics3x4to6bilingualWeights100", shape.every((x) => x === true), shape);
const W = await A.evaluate(() => Object.fromEntries(S5.RUBRICS.comp.criteria.map((c) => [c.id, c.w])));
// campus room → the jury view, a live view under Practice
const room = await A.evaluate(() => { const b = S5.CAMPUS.find((x) => x.id === "studio"); const i = b.rooms.findIndex((r) => r[0] === "Jury room"); return { i, route: i >= 0 ? b.rooms[i][1] : null }; });
check("studioHasJuryRoom", room.i >= 0 && room.route.v === "jury", room);
await A.evaluate((i) => S5.act["campus-room"]({ dataset: { b: "studio", i: String(i) } }), room.i); await A.waitForTimeout(800);
check("campusRoomOpensJury", await A.evaluate(() => S5.ui.route.v === "jury" && !!document.getElementById("jy-home") && S5.ui.root() === "practice" && S5.LIVE.has("jury") && S5.ui.isLive()));
const leftHome = await leftovers(A); check("arabicHomeNoLeftovers", leftHome.length === 0, leftHome);
await shot(A, "80-jury-home");
// start a pin-up
await A.click('[data-act="jury-new"][data-rubric="comp"]'); await A.waitForTimeout(600);
const idA = await A.evaluate(() => S5.ui.route.id);
let r = await rec(A, idA);
check("pinupRecordCreated", !!r && r.type === "jury" && r.rubric === "comp" && !r.boardKey, r);
check("gateNoBoard", await A.evaluate((i) => S5.jury.gate(S5.store.get(i)).code === "no-board" && document.getElementById("jy-gate").dataset.code === "no-board" && document.getElementById("jy-ask").disabled, idA));
// pin up a 3000×2000 photo through the file input → stored ≤1280 px JPEG 0.85
const png = await A.evaluate(() => { const c = document.createElement("canvas"); c.width = 3000; c.height = 2000; const x = c.getContext("2d"); x.fillStyle = "#f4efe4"; x.fillRect(0, 0, 3000, 2000);
  x.fillStyle = "#2a5fa8"; x.fillRect(600, 500, 800, 800); x.fillStyle = "#b5651d"; x.beginPath(); x.arc(1900, 1000, 450, 0, 7); x.fill(); x.strokeStyle = "#111"; x.lineWidth = 12; x.strokeRect(300, 300, 2400, 1400); return c.toDataURL("image/png").split(",")[1]; });
await A.setInputFiles("#jy-file", { name: "board.png", mimeType: "image/png", buffer: Buffer.from(png, "base64") });
await until(A, (i) => !!S5.store.get(i).boardKey, idA);
const board = await A.evaluate(async ({ i, png }) => {
  const r = S5.store.get(i), blob = await S5.blobs.get(r.boardKey); const bm = await createImageBitmap(new Blob([blob.data], { type: blob.mime }));
  // the same pipeline done independently: 1280-px long side, white ground, JPEG at quality 0.85 → identical bytes
  const src = await createImageBitmap(new Blob([Uint8Array.from(atob(png), (ch) => ch.charCodeAt(0))], { type: "image/png" }));
  const c = document.createElement("canvas"); c.width = 1280; c.height = Math.round((2000 * 1280) / 3000); const x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height); x.drawImage(src, 0, 0, c.width, c.height);
  const ref = await new Promise((ok) => c.toBlob(ok, "image/jpeg", 0.85));
  await new Promise((ok) => setTimeout(ok, 300)); const img = document.getElementById("jy-board-img");
  return { mime: blob.mime, w: bm.width, h: bm.height, recW: r.boardW, recH: r.boardH, bytes: blob.size, refBytes: ref.size, shown: !!(img && img.src && img.naturalWidth === 1280), src: r.boardSrc };
}, { i: idA, png });
check("boardDownscaledJpeg1280", board.mime === "image/jpeg" && board.w === 1280 && board.h === 853 && board.recW === 1280 && board.recH === 853 && board.src === "photo", board);
check("boardJpegQuality085", board.bytes === board.refBytes, board);
check("boardShown", board.shown, board);
check("gateNoIntent", await A.evaluate((i) => S5.jury.gate(S5.store.get(i)).code === "no-intent", idA));
await A.fill("#jy-intent", "أردتُ أن تهيمن الأسطوانة على المحور، وأن يتراجع المكعب والمخروط حولها."); await A.waitForTimeout(700);
r = await rec(A, idA); check("intentSaved", /الأسطوانة/.test(r.intent || ""), r.intent);
// self-first gate: with 3 of 6 self-scores the juror cannot be called by any route
const ids = Object.keys(SELF);
for (const k of ids.slice(0, 3)) { await A.click(`[data-act="jury-self"][data-crit="${k}"][data-lv="${SELF[k]}"]`); await A.waitForTimeout(150); }
const gate = await A.evaluate(async (i) => {
  const n0 = S5.ai.log().length; const btn = document.getElementById("jy-ask"); const disabled = btn.disabled; btn.click();
  let viaApi = null; try { await S5.jury.askAI(i); viaApi = "called!"; } catch (e) { viaApi = e.code; }
  await S5.act["jury-ai"]({ dataset: { id: i } });
  let prof = null; try { await S5.jury.setProf(i, "order", 3); prof = "allowed!"; } catch (e) { prof = e.code; }
  const profLocked = [...document.querySelectorAll("[data-jy-prof]")].every((s) => s.disabled);
  return { disabled, viaApi, prof, profLocked, gate: S5.jury.gate(S5.store.get(i)).code, aiCalls: S5.ai.log().length - n0 };
}, idA);
check("selfFirstGate", gate.disabled && gate.viaApi === "self-first" && gate.gate === "self-first" && gate.aiCalls === 0 && gate.prof === "self-first" && gate.profLocked, gate);
for (const k of ids.slice(3)) { await A.click(`[data-act="jury-self"][data-crit="${k}"][data-lv="${SELF[k]}"]`); await A.waitForTimeout(150); }
r = await rec(A, idA);
const selfExp = wtotal(W, SELF);
check("selfSavedAndTotal", JSON.stringify(r.self) === JSON.stringify(SELF) && Math.abs(r.total.self - selfExp) < 1e-9 && (await A.textContent("#jy-self-total")).includes(String(selfExp)), { self: r.self, total: r.total, selfExp });
await shot(A, "81-jury-self");

/* ---------- the AI juror: the Worker mock when reachable, else an in-page stand-in with the mock's reply ---------- */
let P = A, id = idA, aiMode;
if (modeA.standalone && modeA.ai === "ready") aiMode = "worker@BASE";
else {
  if (WBASE && (await isWorker(WBASE))) {
    aiMode = "worker@" + WBASE; await resetWorker(WBASE); P = await newPage(WBASE);
    id = await P.evaluate(async (SELF) => { const r = await S5.jury.create("comp"); const c = document.createElement("canvas"); c.width = 1600; c.height = 1100; const x = c.getContext("2d"); x.fillStyle = "#eee"; x.fillRect(0, 0, 1600, 1100); x.fillStyle = "#333"; x.fillRect(300, 300, 500, 500);
      await S5.jury.pin(r.id, c); await S5.jury.save(r.id, { intent: "The cylinder leads; the cube yields." }); for (const k in SELF) await S5.jury.setSelf(r.id, k, SELF[k]); S5.ui.go({ v: "jury", id: r.id }); return r.id; }, SELF);
    await P.waitForTimeout(500);
  } else aiMode = "stand-in (no Worker reachable)";
}
const worker = aiMode.startsWith("worker");
if (!worker) await A.evaluate(() => { // claude.ai-flavour page: S5.ai.fn behaves like the Worker mock ({ok, echo} for JSON prompts)
  S5.__calls = []; S5.__reply = null;
  const fn = async (input, opts) => { S5.__calls.push({ json: false, opts }); return { text: "شرح تجريبي" }; };
  fn.json = async (input, opts) => { S5.__calls.push({ json: true, temperature: opts.temperature, max_tokens: opts.max_tokens, images: (opts.images || []).length, imageType: opts.images && opts.images[0] && opts.images[0].type });
    const r = S5.__reply; S5.__reply = null; if (r === "garbage") throw { code: "invalid_json" }; return r || { ok: true, echo: input.slice(-40) }; };
  S5.ai.fn = fn; S5.ai.state = "ready";
});
res.aiMode = aiMode;
const guardP0 = P === A ? guardA0 : await guardSnap(P);
// with the AI ready, a pin-up that has 5 of 6 self-scores still cannot reach the juror (button, API and action)
const readyGate = await P.evaluate(async (SELF) => {
  const r = await S5.jury.create("comp"); const c = document.createElement("canvas"); c.width = 400; c.height = 300; c.getContext("2d").fillRect(50, 50, 100, 100);
  await S5.jury.pin(r.id, c); await S5.jury.save(r.id, { intent: "test intent" }); for (const k of Object.keys(SELF).slice(0, 5)) await S5.jury.setSelf(r.id, k, SELF[k]);
  S5.ui.go({ v: "jury", id: r.id }); await new Promise((ok) => setTimeout(ok, 300));
  const n0 = S5.ai.log().length, disabled = document.getElementById("jy-ask").disabled, ready = S5.ai.on();
  let api = null; try { await S5.jury.askAI(r.id); api = "called!"; } catch (e) { api = e.code; }
  await S5.act["jury-ai"]({ dataset: { id: r.id } });
  return { ready, disabled, api, calls: S5.ai.log().length - n0, rid: r.id };
}, SELF);
check("selfFirstGateWithAiReady", readyGate.ready && readyGate.disabled && readyGate.api === "self-first" && readyGate.calls === 0, readyGate);
await P.evaluate(async ({ rid, i }) => { await S5.store.remove(rid); S5.ui.go({ v: "jury", id: i }); }, { rid: readyGate.rid, i: id }); await P.waitForTimeout(400);
await P.evaluate((i) => S5.jury.refresh(i), id);
check("gateOpenAfterSelf", await P.evaluate((i) => S5.jury.gate(S5.store.get(i)) === null && !document.getElementById("jy-ask").disabled, id));
const bodies = [], replies = [];
P.on("request", (q) => { if (q.url().includes("/api/tutor/chat") && q.method() === "POST") { try { bodies.push(q.postDataJSON()); } catch {} } });
P.on("response", async (q) => { if (q.url().includes("/api/tutor/chat")) { try { replies.push(await q.text()); } catch {} } });
const ask = async (n) => { const before = await P.evaluate((i) => (S5.store.get(i).aiStatus || {}).at || "", id); await P.click("#jy-ask"); return until(P, ({ i, before }) => { const s = S5.store.get(i).aiStatus; return !!(s && s.at !== before && !S5.jury.busy); }, { i: id, before }); };
// 1) the mock's wrong-shape reply {ok, echo}
const log0 = await P.evaluate(() => S5.ai.log().length);
await ask();
r = await rec(P, id);
const mock = await P.evaluate((i) => ({ shown: !!document.querySelector('#jy-ai [data-status="unavailable"]'), log: S5.ai.log()[0], calls: S5.__calls || null, locked: S5.jury.selfLocked(S5.store.get(i)) }), id);
// the reply arrived (aiLog ok) but had the wrong shape: code "no-criteria", not a transport error
check("mockReplyJurorUnavailable", r.aiStatus && r.aiStatus.ok === false && r.aiStatus.code === "no-criteria" && !r.ai && mock.shown && !mock.locked, { aiStatus: r.aiStatus, ai: r.ai, shown: mock.shown });
check("aiLogJuryImages1", mock.log && mock.log.purpose === "Jury" && mock.log.images === 1 && mock.log.ok === true && (await P.evaluate(() => S5.ai.log().length)) === log0 + 1, mock.log);
if (worker) {
  const bd = bodies[0] || {}; const parts = (bd.messages && bd.messages[0] && bd.messages[0].content) || [];
  check("requestJsonTemp02WithImage", bd.json === true && bd.temperature === 0.2 && Array.isArray(parts) && parts.some((c) => c.type === "image_url" && /^data:image\/jpeg;base64,/.test(c.image_url.url)) && parts.some((c) => c.type === "text" && /"criteria"/.test(c.text)), { json: bd.json, temperature: bd.temperature, parts: parts.map((c) => c.type) });
  check("workerMockRepliedOkEcho", /\\"ok\\":true|"ok":true/.test(replies[0] || ""), replies[0]);
} else {
  const c0 = (mock.calls || [])[0] || {};
  check("requestJsonTemp02WithImage", c0.json === true && c0.temperature === 0.2 && c0.images === 1 && c0.imageType === "image/jpeg", c0);
}
await shot(P, "82-jury-unavailable");
// 2) a valid reply hand-injected through the same path: unknown id dropped, 7 → 4, 0 → 1, 2.6 → 3, "3" → 3
if (worker) await P.route("**/api/tutor/chat", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ text: JSON.stringify(VALID) }) }));
else await P.evaluate((v) => (S5.__reply = v), VALID);
await ask(); if (worker) await P.unroute("**/api/tutor/chat");
r = await rec(P, id);
const aiExp = wtotal(W, AI_EXPECT);
check("validReplyValidatedByCode", r.ai && r.ai.ok && JSON.stringify(r.ai.scores) === JSON.stringify(AI_EXPECT) && r.ai.dropped.includes("bogus") && r.ai.clamped.some((c) => c.id === "relate" && c.from === 7 && c.to === 4) && JSON.stringify(r.ai.questions) === JSON.stringify(VALID.questions.slice(0, 2)) && r.ai.tier === "E1", r.ai);
check("aiWeightedTotalByCode", Math.abs(r.total.ai - aiExp) < 1e-9 && (await P.textContent("#jy-ai-total")).includes(String(Math.round(aiExp * 10) / 10)), { total: r.total, aiExp });
check("aiLabelledNotAGrade", await P.evaluate(() => /AI reading, not a grade|قراءة ذكاء اصطناعي/.test(document.querySelector("#jy-ai .ai-label").textContent) && !document.querySelector('#jy-ai [data-status="unavailable"]')));
const lock = await P.evaluate(async (i) => { let e = null; try { await S5.jury.setSelf(i, "order", 1); e = "allowed!"; } catch (x) { e = x.code; } return { e, btns: [...document.querySelectorAll('[data-act="jury-self"]')].every((x) => x.disabled), file: !document.getElementById("jy-file"), order: S5.store.get(i).self.order }; }, id);
check("selfAndBoardLockedAfterReading", lock.e === "locked" && lock.btns && lock.file && lock.order === SELF.order, lock);
// pure validation on another rubric: unknown id dropped, level 7 clamped, weighted total computed by code
const pure = await P.evaluate(() => { const R = S5.RUBRICS.persp; const v = S5.jury.validate(R, JSON.stringify({ criteria: [{ id: "constr", level: 7 }, { id: "nope", level: 2 }, { id: "fore", level: 2 }, { id: "line", level: 3 }, { id: "tone", level: 1 }, { id: "scale", level: 4 }, { id: "sheet", level: 3 }] }));
  return { v, t: S5.jury.total(R, v.scores), bad: [S5.jury.validate(R, { ok: true, echo: "x" }).ok, S5.jury.validate(R, null).ok, S5.jury.validate(R, "nonsense").ok, S5.jury.validate(R, [1, 2]).ok, S5.jury.validate(R, { criteria: "x" }).ok, S5.jury.validate(R, { criteria: [{ id: "constr", level: "high" }] }).ok] }; });
check("pureValidateClampDropTotal", pure.v.scores.constr === 4 && !("nope" in pure.v.scores) && pure.t.pct === (25 * 4 + 20 * 2 + 20 * 3 + 15 * 1 + 10 * 4 + 10 * 3) / 4 && !pure.t.partial && pure.bad.every((x) => x === false), pure);
// 3) malformed transports: non-JSON text and a top-level array → unavailable, the earlier reading is kept
for (const [k, text] of [["garbage", "I cannot grade this board."], ["array", '[{"id":"order","level":3}]']]) {
  if (worker) await P.route("**/api/tutor/chat", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ text }) }));
  else await P.evaluate((x) => (S5.__reply = x), k === "garbage" ? "garbage" : [{ id: "order", level: 3 }]);
  await ask(); if (worker) await P.unroute("**/api/tutor/chat");
  r = await rec(P, id);
  check("malformed_" + k + "_unavailableKeepsReading", r.aiStatus.ok === false && r.ai && Math.abs(r.total.ai - aiExp) < 1e-9 && (await P.evaluate(() => !!document.querySelector('#jy-ai [data-status="unavailable"]'))), r.aiStatus);
}
// 4) the jury budget (6 a day): a 7th request is refused before any AI call
const budget = await P.evaluate(async (i) => {
  const today = S5.todayISO(); const used = S5.jury.usedToday(); const fake = Array.from({ length: Math.max(0, 6 - used) }, () => ({ at: today + "T12:00:00.000Z", purpose: "Jury", chars: 1, records: [], images: 1, ok: true }));
  S5.store.meta.aiLog = [...fake, ...S5.ai.log()]; const n0 = S5.ai.log().length; S5.jury.refresh(i, ["ai"]);
  let e = null; try { await S5.jury.askAI(i); e = "called!"; } catch (x) { e = x.code; }
  return { used: S5.jury.usedToday(), e, disabled: document.getElementById("jy-ask").disabled, gate: document.getElementById("jy-gate").dataset.code, calls: S5.ai.log().length - n0 };
}, id);
check("juryBudget6", budget.used === 6 && budget.e === "budget" && budget.disabled && budget.gate === "budget" && budget.calls === 0, budget);
// professor scores typed verbatim (EP) and the calibration
for (const k of ids) { await P.selectOption(`[data-jy-prof="${k}"]`, String(PROF[k])); await P.waitForTimeout(120); }
await P.fill("#jy-verbatim", "الكتل واضحة، لكن الفراغ بين الأسطوانة والمكعب غير مدروس."); await P.waitForTimeout(700);
r = await rec(P, id);
const profExp = wtotal(W, PROF);
const dExp = Object.fromEntries(ids.map((k) => [k, { aiSelf: AI_EXPECT[k] - SELF[k], profSelf: PROF[k] - SELF[k], profAi: PROF[k] - AI_EXPECT[k] }]));
check("profScoresVerbatim", JSON.stringify(r.prof) === JSON.stringify(PROF) && /الفراغ/.test(r.profVerbatim) && Math.abs(r.total.prof - profExp) < 1e-9, { prof: r.prof, total: r.total, profExp });
check("deltasComputed", JSON.stringify(r.deltas.crit) === JSON.stringify(dExp) && Math.abs(r.deltas.total.aiSelf - (aiExp - selfExp)) < 1e-9 && Math.abs(r.deltas.total.profSelf - (profExp - selfExp)) < 1e-9 && Math.abs(r.deltas.total.profAi - (profExp - aiExp)) < 1e-9, r.deltas);
check("recordHoldsThreeColumns", r.rubric === "comp" && !!r.boardKey && !!r.intent && Object.keys(r.self).length === 6 && r.ai && r.ai.scores && Array.isArray(r.ai.questions) && Object.keys(r.prof).length === 6 && r.total.self != null && r.total.ai != null && r.total.prof != null && r.tiers.self === "E0" && r.tiers.ai === "E1" && r.tiers.prof === "EP", r);
const calib = await P.evaluate(() => { const row = document.querySelector('#jy-calib tr[data-crit="order"]'); return { cells: [...row.querySelectorAll("td")].slice(2).map((t) => t.textContent.trim()), tp: document.getElementById("jy-t-prof").textContent.trim(), ta: document.getElementById("jy-t-ai").textContent.trim(), ts: document.getElementById("jy-t-self").textContent.trim() }; });
check("calibrationTable", JSON.stringify(calib.cells) === JSON.stringify(["3", "4", "3", "+1", "0", "-1"]) && calib.tp === profExp + "%" && calib.ts === selfExp + "%", calib);
await shot(P, "83-jury-calibration");
// no jury score ever changes mastery (no attempts, tutorProg, studioProg or mastery state touched)
check("masteryUnaffected", (await guardSnap(P)) === guardP0, { before: guardP0, after: await guardSnap(P) });
// persistence and backup
await P.reload(); await P.waitForTimeout(1800); await P.evaluate((i) => S5.ui.go({ v: "jury", id: i }), id); await P.waitForTimeout(800);
const after = await P.evaluate((i) => { const r = S5.store.get(i); return { self: r.self, ai: r.ai && r.ai.scores, prof: r.prof, tp: (document.getElementById("jy-t-prof") || {}).textContent, img: !!document.getElementById("jy-board-img") }; }, id);
check("persistsAfterReload", JSON.stringify(after.self) === JSON.stringify(SELF) && JSON.stringify(after.ai) === JSON.stringify(AI_EXPECT) && JSON.stringify(after.prof) === JSON.stringify(PROF) && after.tp === profExp + "%" && after.img, after);
const bk = await P.evaluate(async (i) => { const pkg = await S5.backup.build(); const body = JSON.parse(pkg.body); const r = body.records.find((x) => x.id === i); return { inBackup: !!r && r.type === "jury", blob: !!(r && body.blobs[r.boardKey]), verify: (await S5.backup.verify(pkg)).ok }; }, id);
check("backupCarriesJuryAndBoard", bk.inBackup && bk.blob && bk.verify, bk);
if (worker) await resetWorker(aiMode.slice(7)); // leave the mock unclaimed for the next test

/* ---------- back on A: ink-page board, English rendering, unknown/partial records, Arabic leftovers ---------- */
const ink = await A.evaluate(async () => {
  const pts = []; for (let k = 0; k <= 40; k++) pts.push(1000 + k * 150, 2000 + Math.round(Math.sin(k / 5) * 900), 60);
  const p = await S5.store.create("inkpage", { title: "Bubble sketch", strokes: [{ id: "s1", t: "pen", c: "#1b2130", w: 3, l: 0, p: pts, d: 900 }, { id: "s2", t: "ell", c: "#1f4fa8", w: 2, l: 0, p: [2000, 3000, 50, 6000, 6000, 50] }], layers: [{ n: "Layer 1", v: true }], template: "blank", width: 1000, height: 1414 });
  const j = await S5.jury.create("bubble"); S5.ui.go({ v: "jury", id: j.id }); return { ink: p.id, id: j.id };
});
await A.waitForTimeout(500); await A.click('[data-act="jury-ink"]'); await A.waitForTimeout(400);
await A.click(`[data-act="jury-ink-pick"][data-ink="${ink.ink}"]`);
await until(A, (i) => !!S5.store.get(i).boardKey, ink.id);
const inkRec = await rec(A, ink.id);
const inkBlob = await A.evaluate(async (k) => { const b = await S5.blobs.get(k); const bm = await createImageBitmap(new Blob([b.data], { type: b.mime })); return { mime: b.mime, w: bm.width, h: bm.height }; }, inkRec.boardKey);
check("inkPageBoard", inkRec.boardSrc === "ink" && inkRec.inkId === ink.ink && inkBlob.mime === "image/jpeg" && inkBlob.h === 1280 && inkBlob.w === Math.round(1000 * 1280 / 1414), { inkRec: { src: inkRec.boardSrc, w: inkRec.boardW, h: inkRec.boardH }, inkBlob });
const leftSession = await (async () => { await A.evaluate((i) => S5.ui.go({ v: "jury", id: i }), idA); await A.waitForTimeout(600); return leftovers(A); })();
check("arabicSessionNoLeftovers", leftSession.length === 0, leftSession);
await A.evaluate(() => S5.settings.set("lang", "en")); await A.waitForTimeout(200); await A.evaluate(() => S5.ui.render()); await A.waitForTimeout(400);
check("englishRendering", await A.evaluate(() => document.querySelector("h1").textContent.trim() === "Composition of primary forms" && /the forms read as separate objects/.test(document.getElementById("jy-self").textContent)));
await A.evaluate(() => S5.settings.set("lang", "ar")); await A.waitForTimeout(200);
const odd = await A.evaluate(async () => { const u = await S5.store.create("jury", { rubric: "zzz-future" }); S5.ui.go({ v: "jury", id: u.id }); await new Promise((r) => setTimeout(r, 300)); const a = !!document.querySelector("#view .empty");
  const p = await S5.store.create("jury", { rubric: "persp" }); S5.ui.go({ v: "jury", id: p.id }); await new Promise((r) => setTimeout(r, 300)); const b2 = !!document.getElementById("jy-calib");
  S5.ui.go({ v: "jury" }); await new Promise((r) => setTimeout(r, 300)); return { unknown: a, partialOld: b2, home: document.querySelectorAll("#jy-home .item").length >= 3 }; });
check("oldOrUnknownRecordsSafe", odd.unknown && odd.partialOld && odd.home, odd);
check("masteryUnaffectedA", (await guardSnap(A)) === guardA0);
await shot(A, "84-jury-home-after");
check("noPageErrors", errors.length === 0, errors);
console.log(JSON.stringify({ base: BASE, ...res, failed: fails }, null, 1));
if (fails.length) process.exitCode = 1;
await b.close();
