// Tutor: owner claim, streamed answers (mock model), action chips, link code carries tutor access, library lessons + quiz progress.
// Run against: wrangler dev --var TUTOR_MOCK:1
import { createRequire } from "node:module"; const require = createRequire("/x/"); const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const S = process.env.S, SERVER = "http://127.0.0.1:8787";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const A = await (await b.newContext({ viewport: { width: 420, height: 860 } })).newPage(), B = await (await b.newContext({ viewport: { width: 1180, height: 820 } })).newPage();
const errors = []; for (const p of [A, B]) p.on("pageerror", (e) => errors.push(e.message));
const res = {};
await fetch(SERVER + "/api/tutor/reset", { method: "POST" });
await A.goto(SERVER + "/"); await A.waitForTimeout(1500);
res.navHasTutor = await A.evaluate(() => !!document.querySelector('#tabbar [data-v="tutor"]'));
res.aiReadyStandalone = await A.evaluate(() => S5.ai.state === "ready");
await A.evaluate(() => S5.ui.go("tutor")); await A.waitForTimeout(800);
await A.fill("#tc-in", "اشرحلي العزم"); await A.click('[data-act="tc-send"]');
for (let i = 0; i < 30 && !(await A.evaluate(() => /شرح تجريبي/.test(document.getElementById("tc-log").innerText))); i++) await A.waitForTimeout(200);
res.streamed = await A.evaluate(() => document.getElementById("tc-log").innerText.includes("اشرحلي العزم"));
res.actionChip = await A.evaluate(() => !!document.querySelector('[data-act="tc-laptop"][data-a="open_app"][data-v="acad"]'));
res.ownerKey = await A.evaluate(() => !!S5.store.meta.tutorKey);
res.jsonViaAi = await A.evaluate(() => S5.ai.ask("t", "give JSON", { json: true }).then((o) => o && o.ok === true, (e) => e.message));
// second device: claim refused, no access until linked
await B.goto(SERVER + "/"); await B.waitForTimeout(1500);
res.secondRefused = await B.evaluate(() => S5.tutor.ask([{ role: "user", content: "hi" }]).then(() => "allowed!", (e) => e.message));
const code = await A.evaluate(() => S5.remote.makeLink());
await B.evaluate(() => S5.ui.go("system")); await B.waitForTimeout(500); await B.fill("#rm-link", code); await B.click('[data-act="rm-link"]'); await B.waitForTimeout(2500);
res.secondLinked = await B.evaluate(() => S5.tutor.ask([{ role: "user", content: "hi" }]).then((t) => /شرح تجريبي/.test(t), (e) => e.message));
res.noPairingCopied = await B.evaluate(() => !S5.store.meta.remote);
res.wrongKeyRefused = await B.evaluate(() => fetch("/api/tutor/chat", { method: "POST", headers: { "content-type": "application/json", "x-s5-key": "nope" }, body: JSON.stringify({ messages: [{ role: "user", content: "x" }] }) }).then((r) => r.status));
// library: lessons, a quiz answered, progress saved
const n = await A.evaluate(() => S5.kb.load().then((l) => l.length)); res.libraryLessons = n;
if (n) {
  const t = await A.evaluate(() => { const t = S5.kb.topics.find((x) => (x.quiz || []).some((q) => q.choices)); S5.ui.go({ v: "tutor", tab: "learn", id: t.id }); return t.id; }); await A.waitForTimeout(600);
  await A.evaluate(() => { const L = S5.lessonState; L.t.quiz.forEach((q, k) => { if (q.choices) document.querySelector(`[data-act="ls-choice"][data-k="${k}"][data-j="${q.answer}"]`).click(); else document.querySelector(`[data-act="ls-self"][data-k="${k}"][data-ok="1"]`).click(); }); });
  await A.waitForTimeout(500); res.progressSaved = await A.evaluate((id) => S5.tutorProg.get(id)?.last, t);
  res.searchArabic = await A.evaluate(() => S5.kb.search("الخرسانة المسلحة عتبة", { k: 3 }).map((x) => x.id));
  res.searchEnglish = await A.evaluate(() => S5.kb.search("bending moment diagram", { k: 3 }).map((x) => x.id));
  await A.evaluate(() => S5.ui.go({ v: "tutor", tab: "learn" })); await A.waitForTimeout(500); await A.screenshot({ path: S + "/shots/50-tutor-lessons.png" });
}
// the studio teacher looks at the drawing: wrong lines → measured, correction drawn on the board, AI explanation with the image
await A.setViewportSize({ width: 1280, height: 800 }); await A.evaluate(() => S5.ui.go({ v: "studio", id: "L2" })); await A.waitForTimeout(800);
const m = await A.evaluate(() => { const i = S5.studio.ink, r = i.stage.getBoundingClientRect(); return { l: r.left, t: r.top, s: i.s, ox: i.ox, oy: i.oy }; });
for (let i = 0; i < 8; i++) { const P = Array.from({ length: 9 }, (_, k) => [m.l + m.ox + (150 + k * 85) * m.s, m.t + m.oy + (100 + i * 60 + k * 8) * m.s]); await A.mouse.move(...P[0]); await A.mouse.down(); for (const p of P.slice(1)) await A.mouse.move(p[0], p[1], { steps: 2 }); await A.mouse.up(); }
await A.click('[data-act="st-check"]');
for (let i = 0; i < 30 && !(await A.evaluate(() => /شرح تجريبي/.test(document.getElementById("st-ai").innerText))); i++) await A.waitForTimeout(200);
res.studioTeacherSawImage = await A.evaluate(() => /صورة مستلمة/.test(document.getElementById("st-ai").innerText));
res.studioHabitRemembered = await A.evaluate(() => (S5.studioProg.all()._errs || {}).tilt >= 1);
await A.evaluate(() => (document.getElementById("st-ai").innerHTML = "")); await A.fill("#st-q", "ليش خطي يطلع مايل؟"); await A.click('[data-act="st-ask"]');
for (let i = 0; i < 30 && !(await A.evaluate(() => /شرح تجريبي/.test(document.getElementById("st-ai").innerText))); i++) await A.waitForTimeout(200);
res.studioAnswersQuestion = await A.evaluate(() => /شرح تجريبي \[صورة مستلمة\]/.test(document.getElementById("st-ai").innerText));
await A.screenshot({ path: S + "/shots/61-studio-teacher.png" }); await A.setViewportSize({ width: 420, height: 860 });
await A.evaluate(() => S5.ui.go({ v: "tutor", tab: "chat" })); await A.waitForTimeout(400); await A.screenshot({ path: S + "/shots/51-tutor-chat.png" });
console.log(JSON.stringify(res, null, 1)); console.log("errors:", errors); await b.close(); process.exit(0);
