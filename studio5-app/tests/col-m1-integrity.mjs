// College M1 — honest mastery and durable progress (docs/COLLEGE_PLAN.md, Appendix M1).
// Checks: MCQ choices shuffled at render (stored index kept in data-j) so pressing display position 2 on the 127
// all-B lessons no longer masters them; self-check short answers (E0) never change the lesson score;
// S5.kb.forSubject(name, {program, year}) + Start/Next lesson stay inside one program; the library is precached by
// sw.js and a failed first fetch is retried in the same session; tutorProg/studioProg survive backup → restore and an
// old backup (no progress field) still verifies and restores. Fails (exitCode 1) on any false check or pageerror.
// BASE = the claude.ai build (tests/serve.mjs dist/studio5.html), WBASE = wrangler dev (public/, standalone).
import { createRequire } from "node:module"; const require = createRequire("/x/"); const { chromium } = require("/opt/node22/lib/node_modules/playwright");
import { readFileSync } from "node:fs";
const BASE = process.env.BASE || "http://localhost:8765/";
const WBASE = process.env.WBASE || "http://127.0.0.1:8787/";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const ok = {}, info = {}, errors = [];
const newPage = async (opts = {}) => { const ctx = await b.newContext({ viewport: { width: 1180, height: 820 }, ...opts }); const p = await ctx.newPage(); p.on("pageerror", (e) => errors.push(e.message)); return p; };
const section = async (name, fn) => { try { await fn(); } catch (e) { ok[name + "_ran"] = false; info[name + "_error"] = String(e && e.stack || e).slice(0, 600); } };
// boot finished = the first screen rendered and the translator started (main.js boot), so a route we open is not replaced
const booted = () => window.S5 && S5.store && S5.store.ready && S5.i18n && !!S5.i18n.mo;
const boot = async (p, url = BASE) => { await p.goto(url + "#today"); await p.waitForFunction(booted, null, { timeout: 30000 }); await p.waitForTimeout(400); };
// canonical JSON (sorted keys) so key order never makes equal progress look different
const canon = (v) => JSON.stringify(v, (k, x) => (x && typeof x === "object" && !Array.isArray(x) ? Object.fromEntries(Object.entries(x).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) : x));

const A = await newPage();
await boot(A);
await A.evaluate(async () => { await S5.settings.set("lang", "en"); await S5.settings.set("programs", ["arch", "civil"]); await S5.settings.set("activeYear", 1); await S5.kb.load(); });
await A.waitForTimeout(300);

// ---------- 1. shuffled choices: display position 2 on every MCQ of the all-B lessons ----------
await section("allB", async () => {
  const r = await A.evaluate(async () => {
    const ids = S5.kb.topics.filter((t) => { const m = (t.quiz || []).filter((q) => q.choices); return m.length && m.every((q) => q.answer === 1); }).map((t) => t.id);
    let mcqs = 0, pos2Right = 0, nonIdentity = 0, keptIndex = true, perm = true, highlight = true;
    for (const id of ids) {
      S5.ui.go({ v: "tutor", tab: "learn", id }); const t = S5.kb.byId.get(id);
      for (const box of document.querySelectorAll("#ls-quiz .quiz")) {
        const k = +box.dataset.k, q = t.quiz[k]; if (!q.choices) continue;
        const btns = [...box.querySelectorAll('[data-act="ls-choice"]')], js = btns.map((x) => +x.dataset.j), id0 = q.choices.map((_, i) => i).join();
        if (js.slice().sort((a, c) => a - c).join() !== id0) perm = false;
        if (btns.some((x) => x.textContent !== q.choices[+x.dataset.j])) keptIndex = false;
        if (js.join() !== id0) nonIdentity++;
        mcqs++; const right = +btns[1].dataset.j === q.answer; if (right) pos2Right++;
        btns[1].click(); // display position 2 — what used to be "B" and was right in all of these lessons
        if (!right && !box.querySelector(`[data-j="${q.answer}"]`).classList.contains("primary")) highlight = false;
      }
    }
    for (let i = 0; i < 50 && ids.some((id) => !S5.tutorProg.get(id)); i++) await new Promise((x) => setTimeout(x, 100));
    const mastered = ids.filter((id) => (S5.tutorProg.get(id) || {}).last >= 0.8).length;
    return { lessons: ids.length, recorded: ids.filter((id) => S5.tutorProg.get(id)).length, mastered, rate: mastered / Math.max(1, ids.length), mcqs, pos2Right, nonIdentity, keptIndex, perm, highlight };
  });
  info.allB = { ...r, beforeFixRate: 1 /* stored order: position 2 is the stored answer in every one of these lessons */ };
  ok.allBLessonsFound = r.lessons >= 100;
  ok.allBEveryLessonScored = r.recorded === r.lessons;
  ok.allBMasteredUnder10pct = r.rate < 0.1;
  ok.choicesKeepStoredIndex = r.keptIndex && r.perm;
  ok.choicesShuffled = r.nonIdentity > r.mcqs * 0.75;
  ok.correctAnswerHighlightedByIndex = r.highlight;
});

// ---------- 1b. the order is seeded and stable for one lesson view, reshuffled on the next view ----------
await section("stable", async () => {
  const r = await A.evaluate(() => {
    const t = S5.kb.topics.find((x) => (x.quiz || []).filter((q) => q.choices).length >= 2);
    const read = () => [...document.querySelectorAll("#ls-quiz .quiz:not([data-self])")].map((b) => [...b.querySelectorAll('[data-act="ls-choice"]')].map((x) => x.dataset.j).join("")).join("|");
    S5.ui.go({ v: "tutor", tab: "learn", id: t.id }); const first = read(), nonce = S5.lessonView.nonce;
    const seeded = (t.quiz || []).map((q, k) => (q.choices ? S5.kb.order(q.choices.length, `${t.id}|${nonce}|${k}`).join("") : "")).filter(Boolean).join("|") === first;
    S5.ui.render(); const again = read();
    const views = []; for (let i = 0; i < 8; i++) { S5.ui.go({ v: "tutor", tab: "learn", id: t.id }); views.push(read()); }
    const det = S5.kb.order(4, "x|1").join() === S5.kb.order(4, "x|1").join();
    // independence: keys that differ only in the question number must not give correlated orders (expect 1/16)
    let joint = 0, single = 0; const N = 8000; for (let i = 0; i < N; i++) { const a0 = S5.kb.order(4, `L|n${i}|0`)[1] === 1, a1 = S5.kb.order(4, `L|n${i}|1`)[1] === 1; if (a0) single++; if (a0 && a1) joint++; }
    return { id: t.id, seeded, sameOnRerender: first === again, distinctViews: new Set([first, ...views]).size, det, single: single / N, joint: joint / N };
  });
  info.stable = r;
  ok.orderSeededByLessonAndNonce = r.seeded && r.det;
  ok.orderStableWithinView = r.sameOnRerender;
  ok.orderChangesBetweenViews = r.distinctViews >= 3;
  ok.orderUniformAndIndependent = Math.abs(r.single - 0.25) < 0.03 && Math.abs(r.joint - 0.0625) < 0.015;
});

// ---------- 2. self-check (E0) never moves the score ----------
await section("self", async () => {
  const r = await A.evaluate(async () => {
    const before = JSON.stringify(S5.tutorProg.all()); let pills = true, selfItems = 0;
    // every lesson: press only "I got it" on every short answer → no score is recorded or changed
    for (const t of S5.kb.topics) {
      S5.ui.go({ v: "tutor", tab: "learn", id: t.id });
      for (const box of document.querySelectorAll('#ls-quiz .quiz[data-self="1"]')) { selfItems++; if (!/self-check/.test(box.querySelector(".pill")?.textContent || "")) pills = false; box.querySelector('[data-act="ls-self"][data-ok="1"]').click(); }
    }
    await new Promise((x) => setTimeout(x, 300));
    const unchanged = JSON.stringify(S5.tutorProg.all()) === before;
    // a fresh lesson with 3 MCQs + a short answer
    const fresh = S5.kb.topics.filter((t) => !S5.tutorProg.get(t.id) && (t.quiz || []).filter((q) => q.choices).length === 3 && (t.quiz || []).some((q) => !q.choices));
    const [X, Y] = fresh; const go = (t) => S5.ui.go({ v: "tutor", tab: "learn", id: t.id });
    const pick = (t, k, right) => { const q = t.quiz[k]; const j = right ? q.answer : (q.answer + 1) % q.choices.length; document.querySelector(`.quiz[data-k="${k}"] [data-act="ls-choice"][data-j="${j}"]`).click(); };
    const selfBtn = (t, okv) => t.quiz.forEach((q, k) => { if (!q.choices) document.querySelector(`[data-act="ls-self"][data-k="${k}"][data-ok="${okv}"]`).click(); });
    // X: "I got it" first, then every MCQ wrong → 0 (old rule: 1/4 = 0.25)
    go(X); selfBtn(X, 1); const xMid = S5.tutorProg.get(X.id); X.quiz.forEach((q, k) => q.choices && pick(X, k, false)); await new Promise((x) => setTimeout(x, 100));
    const xp = S5.tutorProg.get(X.id); const xScore = document.getElementById("ls-score").textContent;
    // Y: every MCQ right → 1.0, then "Not yet" on the short answer → still 1.0 (old rule: 3/4 = 0.75), E0 noted
    go(Y); Y.quiz.forEach((q, k) => q.choices && pick(Y, k, true)); await new Promise((x) => setTimeout(x, 100)); const y1 = { ...S5.tutorProg.get(Y.id) };
    selfBtn(Y, 0); await new Promise((x) => setTimeout(x, 100)); const y2 = S5.tutorProg.get(Y.id);
    return { lessons: S5.kb.topics.length, selfItems, pills, unchanged, xMid, xLast: xp && xp.last, xSelf: xp && xp.self, xScore, y1, y2 };
  });
  info.self = r;
  ok.selfCheckLabelOnEveryShortAnswer = r.pills && r.selfItems >= 300;
  ok.gotItAloneNeverScores = r.unchanged;
  ok.gotItBeforeMcqGivesNoScore = r.xMid === null;
  ok.gotItDoesNotLiftScore = r.xLast === 0 && r.xSelf && r.xSelf.tier === "E0" && r.xSelf.ok === 1;
  ok.selfCheckDoesNotChangeScore = r.y1.last === 1 && r.y2.last === 1 && r.y2.box === r.y1.box && r.y2.due === r.y1.due && r.y2.at === r.y1.at && r.y2.self && r.y2.self.ok === 0 && r.y2.self.tier === "E0";
});

// ---------- 3. forSubject program/year filter, Start and Next lesson ----------
await section("subject", async () => {
  const r = await A.evaluate(() => {
    const ind = (name, program, year) => S5.kb.topics.filter((t) => t.subjects.includes(name) && t.program === program && t.year === year).sort((a, b) => a.order - b.order).map((t) => t.id);
    const civ = S5.kb.forSubject("Engineering Drawing", { program: "civil", year: 1 }).map((t) => t.id);
    const arch = S5.kb.forSubject("Engineering Drawing", { program: "arch", year: 1 }).map((t) => t.id);
    const bc = S5.kb.forSubject("Building Construction", { program: "civil", year: 1 }).map((t) => t.id);
    const legacy = S5.kb.forSubject("Engineering Drawing").length;
    S5.ui.go({ v: "tutor", tab: "learn" });
    const cards = [...document.querySelectorAll("#view .item")].map((el) => ({ t: el.querySelector(".t")?.textContent, s: el.querySelector(".s")?.textContent, id: el.querySelector('[data-act="open"][data-id]')?.dataset.id }));
    const card = (name, prog) => (cards.find((c) => c.t === name && (c.s || "").startsWith(prog + " · Year 1")) || {}).id;
    return { civ, civInd: ind("Engineering Drawing", "civil", 1), arch, archInd: ind("Engineering Drawing", "arch", 1), bc, bcInd: ind("Building Construction", "civil", 1), legacy,
      startCivilED: card("Engineering Drawing", "Civil"), startArchED: card("Engineering Drawing", "Architecture"), startCivilBC: card("Building Construction", "Civil") };
  });
  // Next lesson: follow the button from the first civil drawing lesson with real clicks
  const chain = [r.civ[0]];
  await A.evaluate((id) => S5.ui.go({ v: "tutor", tab: "learn", id }), r.civ[0]); await A.waitForTimeout(150);
  for (let i = 0; i < 20; i++) {
    const nx = await A.$('#view .row [data-act="open"][data-v="tutor"][data-id]'); if (!nx) break;
    await nx.click(); await A.waitForTimeout(120); chain.push(await A.evaluate(() => S5.ui.route.id));
  }
  info.subject = { ...r, chain };
  ok.forSubjectCivilDrawingOnly = r.civ.length > 0 && r.civ.every((id) => /^c1b-draw-/.test(id)) && r.civ.join() === r.civInd.join();
  ok.forSubjectArchDrawingOnly = r.arch.length > 0 && r.arch.every((id) => /^a1b-ed-/.test(id)) && r.arch.join() === r.archInd.join();
  ok.forSubjectCivilConstructionOnly = r.bc.length > 0 && r.bc.every((id) => /^c1b-/.test(id)) && r.bc.join() === r.bcInd.join();
  ok.startButtonsStayInProgram = /^c1b-draw-/.test(r.startCivilED || "") && /^a1b-ed-/.test(r.startArchED || "") && /^c1b-bc-/.test(r.startCivilBC || "");
  ok.nextLessonStaysInCivil = chain.join() === r.civ.join() && chain.every((id) => /^c1b-/.test(id));
});

// ---------- 4. the library: a failed first fetch is retried in the same session (no embedded S5_KB) ----------
await section("retry", async () => {
  const R = await newPage(); let kbJson = null, hits = 0;
  await R.route("**/kb/library.json", (route) => { hits++; return hits === 1 ? route.abort("internetdisconnected") : route.fulfill({ status: 200, contentType: "application/json", body: kbJson }); });
  await R.route(BASE, async (route) => {
    const resp = await route.fetch(); let html = await resp.text(); const head = "<script>var S5_KB = ", s = html.indexOf(head), e = html.indexOf(';</script>\n<script>\n"use strict";', s);
    if (s >= 0 && e > s) { kbJson = html.slice(s + head.length, e); html = html.slice(0, s) + html.slice(e + ";</script>\n".length); }
    await route.fulfill({ response: resp, body: html, headers: { ...resp.headers(), "content-type": "text/html; charset=utf-8" } });
  });
  await boot(R); // Arabic (the default): the failure message must be translated too
  const noEmbed = await R.evaluate(() => typeof S5_KB === "undefined");
  await R.evaluate(() => S5.ui.go({ v: "tutor", tab: "learn" })); await R.waitForTimeout(800);
  const failed = await R.evaluate(() => { const box = document.querySelector('#view .sheet.flat'); return { failed: S5.kb.failed, n: (S5.kb.topics || []).length, retryBtn: !!document.querySelector('[data-act="kb-retry"]'), text: box ? box.innerText : "" }; });
  ok.failureMessageInArabic = /[؀-ۿ]/.test(failed.text) && !/[A-Za-z]{3}/.test(failed.text);
  await R.waitForTimeout(600); const hitsAfterFail = hits; // no fetch loop while the failure is shown
  info.retry = { noEmbed, failed, hitsAfterFail };
  await R.click('[data-act="kb-retry"]', { timeout: 5000 }); await R.waitForTimeout(1200);
  const after = await R.evaluate(() => ({ failed: S5.kb.failed, n: S5.kb.topics.length, cards: document.querySelectorAll("#view .item").length, search: S5.kb.search("truss joints", { k: 1 }).length }));
  const expected = kbJson ? JSON.parse(kbJson).length : -1;
  info.retry = { noEmbed, failed, hitsAfterFail, after, expected, hits };
  ok.retryRunsWithoutEmbeddedLibrary = noEmbed && expected > 0;
  ok.failedFetchNotCached = failed.failed === true && failed.n === 0 && failed.retryBtn && hitsAfterFail === 1;
  ok.retryLoadsLibrarySameSession = after.failed === false && after.n === expected && after.cards > 0 && after.search === 1 && hits === 2;
  await R.context().close();
});

// ---------- 5. sw.js precaches /kb/library.json (built file + live install on wrangler) ----------
await section("sw", async () => {
  const shell = (src) => { const m = /const SHELL = (\[[^\]]*\]);/.exec(src); return m ? JSON.parse(m[1]) : []; };
  const disk = shell(readFileSync(new URL("../public/sw.js", import.meta.url), "utf8"));
  info.swShellDisk = disk;
  ok.builtSwShellHasLibrary = disk.some((u) => /(^|\/)kb\/library\.json$/.test(u));
  let live = null; try { live = await (await fetch(WBASE + "sw.js")).text(); } catch {}
  if (!live) { info.swLive = "skipped: " + WBASE + " not reachable"; return; }
  ok.servedSwShellHasLibrary = shell(live).some((u) => /(^|\/)kb\/library\.json$/.test(u));
  // the real install: register on localhost (secure context), wait for the worker, look in Cache Storage
  const W = await newPage(); const lh = WBASE.replace("127.0.0.1", "localhost");
  await W.goto(lh + "#today"); await W.waitForFunction(booted, null, { timeout: 30000 });
  const c = await W.evaluate(async () => {
    const ready = await Promise.race([navigator.serviceWorker.ready.then(() => true), new Promise((x) => setTimeout(() => x(false), 25000))]);
    for (const k of await caches.keys()) { const hit = await (await caches.open(k)).match("/kb/library.json"); if (hit) { const list = await hit.json(); return { ready, cache: k, lessons: list.length }; } }
    return { ready, cache: null, lessons: 0 };
  });
  info.swLive = c;
  ok.swInstallPrecachesLibrary = c.ready && c.lessons > 0;
  await W.context().close();
  // the standalone app (no embedded library) also retries after a failed first fetch
  const P = await newPage({ serviceWorkers: "block" }); let n = 0;
  await P.route("**/kb/library.json", (route) => (++n === 1 ? route.abort("internetdisconnected") : route.continue()));
  await boot(P, WBASE);
  const s = await P.evaluate(async () => { const a = await S5.kb.load(); const f = S5.kb.failed; const b2 = await S5.kb.load(); return { standalone: S5.standalone, first: a.length, failed: f, second: b2.length, failedAfter: S5.kb.failed }; });
  info.standaloneRetry = { ...s, fetches: n };
  ok.standaloneRetryAfterFailedFetch = s.standalone && s.first === 0 && s.failed && s.second > 0 && !s.failedAfter && n === 2;
  await P.context().close();
});

// ---------- 6. progress through backup → restore ----------
await section("backup", async () => {
  const a = await A.evaluate(async () => {
    await S5.studioProg.save("L2", { score: 0.6, ok: false, notes: ["الخطوط مايلة عن الاتجاه"] });
    await S5.studioProg.save("L3", { score: 1, ok: true, notes: [] });
    const pkg = await S5.backup.build({ includeFiles: false });
    const body = JSON.parse(pkg.body);
    // the old format (before M1): the same package without body.progress, checksummed the same way
    const oldJson = JSON.stringify({ records: body.records, settings: body.settings, blobs: body.blobs });
    const old = { ...pkg, body: oldJson, checksum: await S5.sha256(oldJson) };
    return { pkg, old, tutor: S5.store.meta.tutorProg, studio: S5.store.meta.studioProg, hasProgress: !!body.progress, nTutor: Object.keys(S5.store.meta.tutorProg || {}).length };
  });
  info.backupA = { hasProgress: a.hasProgress, tutorEntries: a.nTutor, studioEntries: Object.keys(a.studio || {}).length };
  ok.backupHasProgress = a.hasProgress && a.nTutor > 100 && !!a.studio.L3 && !!a.studio._errs;
  // context B: a fresh device, restore('replace')
  const B = await newPage(); await boot(B);
  const r = await B.evaluate(async (pkg) => {
    const empty = !Object.keys(S5.store.meta.tutorProg || {}).length && !Object.keys(S5.store.meta.studioProg || {}).length;
    const v = await S5.backup.verify(pkg); if (!v.ok) return { empty, verified: false };
    const res = await S5.backup.restore({ ...v.body, schemaVersion: pkg.schemaVersion }, "replace");
    return { empty, verified: true, res, tutor: S5.store.meta.tutorProg, studio: S5.store.meta.studioProg };
  }, a.pkg);
  ok.freshDeviceStartsEmpty = r.empty;
  ok.backupVerifies = r.verified;
  ok.progressIdenticalAfterReplace = r.verified && canon(r.tutor) === canon(a.tutor) && canon(r.studio) === canon(a.studio);
  await B.reload(); await B.waitForFunction(booted, null, { timeout: 30000 });
  const persisted = await B.evaluate(() => ({ tutor: S5.store.meta.tutorProg, studio: S5.store.meta.studioProg }));
  ok.progressPersistsAfterReload = canon(persisted.tutor) === canon(a.tutor) && canon(persisted.studio) === canon(a.studio);
  // merge rule on B: per id the newer `at` wins; a studio pass is never lost
  const m = await B.evaluate(async (pkg) => {
    const ids = Object.keys(S5.store.meta.tutorProg); const [x, y] = ids;
    const t = { ...S5.store.meta.tutorProg, [x]: { ...S5.store.meta.tutorProg[x], last: 0.123, at: "2099-01-01T00:00:00.000Z" }, [y]: { ...S5.store.meta.tutorProg[y], last: 0.456, at: "2000-01-01T00:00:00.000Z" } };
    const s = { ...S5.store.meta.studioProg, L3: { ...S5.store.meta.studioProg.L3, passed: false, best: 0.2, at: "2099-01-01T00:00:00.000Z" } };
    await S5.store.setMeta("tutorProg", t); await S5.store.setMeta("studioProg", s);
    const v = await S5.backup.verify(pkg); const res = await S5.backup.restore({ ...v.body, schemaVersion: pkg.schemaVersion }, "merge");
    const T = S5.store.meta.tutorProg, St = S5.store.meta.studioProg, keep = S5.store.meta.progressBeforeRestore;
    return { x, y, res, xLast: T[x].last, yLast: T[y].last, yAt: T[y].at, l3: St.L3, keepX: keep && keep.tutorProg && keep.tutorProg[y] && keep.tutorProg[y].last };
  }, a.pkg);
  info.merge = m;
  ok.mergeNewerAtWins = m.xLast === 0.123 && m.yLast === a.tutor[m.y].last && m.yAt === a.tutor[m.y].at;
  ok.mergeKeepsStudioPass = m.l3.passed === true && m.l3.best === 1 && m.l3.at === "2099-01-01T00:00:00.000Z";
  ok.mergeKeepsRecoveryCopy = m.keepX === 0.456;
  await B.context().close();
  // context C: an old-format backup restores without error and verifies
  const C = await newPage(); await boot(C);
  const o = await C.evaluate(async (pkg) => {
    const v = await S5.backup.verify(pkg); let res = null, err = null;
    try { res = await S5.backup.restore({ ...v.body, schemaVersion: pkg.schemaVersion }, "merge"); } catch (e) { err = String(e); }
    return { ok: v.ok, problems: v.problems, hasProgress: "progress" in (v.body || {}), res, err, tutor: Object.keys(S5.store.meta.tutorProg || {}).length, records: S5.store.recs.size };
  }, a.old);
  info.oldBackup = o;
  ok.oldBackupChecksumVerifies = o.ok === true && o.hasProgress === false;
  ok.oldBackupRestoresWithoutError = !o.err && o.res && o.res.progress === 0 && o.tutor === 0 && o.records > 0;
  await C.context().close();
});

// ---------- 7. the tutor-e2e style quiz still works (click the shown position of the stored answer) ----------
await section("quiz", async () => {
  const r = await A.evaluate(async () => {
    const t = S5.kb.topics.find((x) => !S5.tutorProg.get(x.id) && (x.quiz || []).some((q) => q.choices));
    S5.ui.go({ v: "tutor", tab: "learn", id: t.id }); const L = S5.lessonState;
    L.t.quiz.forEach((q, k) => { if (q.choices) { const btns = [...document.querySelectorAll(`.quiz[data-k="${k}"] [data-act="ls-choice"]`)]; btns[btns.findIndex((x) => +x.dataset.j === q.answer)].click(); } else document.querySelector(`[data-act="ls-self"][data-k="${k}"][data-ok="1"]`).click(); });
    await new Promise((x) => setTimeout(x, 200)); return S5.tutorProg.get(t.id)?.last;
  });
  ok.quizAllRightScoresOne = r === 1;
});

// ---------- 8. the new lesson strings are translated in Arabic (the default language) ----------
await section("arabic", async () => {
  const P = await newPage(); await boot(P);
  const r = await P.evaluate(async () => {
    await S5.kb.load(); const t = S5.kb.topics.find((x) => (x.quiz || []).some((q) => !q.choices) && (x.quiz || []).some((q) => q.choices));
    S5.ui.go({ v: "tutor", tab: "learn", id: t.id });
    t.quiz.forEach((q, k) => { if (q.choices) document.querySelector(`.quiz[data-k="${k}"] [data-act="ls-choice"]`).click(); else document.querySelector(`[data-act="ls-self"][data-k="${k}"][data-ok="1"]`).click(); });
    await new Promise((x) => setTimeout(x, 400));
    const self = document.querySelector('.quiz[data-self="1"] .tiny').innerText, score = document.getElementById("ls-score").innerText;
    return { lang: S5.i18n.lang(), self, score };
  });
  info.arabic = r;
  const ar = (s) => /[؀-ۿ]/.test(s) && !/[A-Za-z]{3}/.test(s);
  ok.newLessonStringsInArabic = r.lang === "ar" && ar(r.self) && ar(r.score);
  await P.context().close();
});

ok.zeroPageErrors = errors.length === 0;
const failed = Object.entries(ok).filter(([, v]) => v !== true).map(([k]) => k);
console.log(JSON.stringify({ ok, failed, info, errors }, null, 1));
if (failed.length) process.exitCode = 1;
await b.close();
