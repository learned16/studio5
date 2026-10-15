// Year-1 official syllabus + programme default: a fresh install shows Architecture only (Civil stays switchable and its
// subjects are untouched), the Calculus subject page lists the 16 official weeks, the semester start picks this week's
// topic, "Add as exam topics" creates each topic once (idempotent), matrices lesson a1b-calc-08 is in the kb.
// BASE (default http://localhost:8765/) serves the app; exitCode 1 on any failed check or pageerror.
import { createRequire } from "node:module"; const require = createRequire("/x/"); const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const BASE = process.env.BASE || "http://localhost:8765/";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const res = {}, errors = [], fails = [];
const check = (k, v, detail) => { res[k] = v === true ? true : detail !== undefined ? { ok: false, got: detail } : v; if (v !== true) fails.push(k); };
const p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
p.on("pageerror", (e) => errors.push(e.message));
await p.goto(BASE); await p.waitForTimeout(1800);
const d0 = await p.evaluate(() => ({ stored: "programs" in (S5.store.meta.settings || {}), progs: S5.settings.get("programs"), arch: S5.progOn("arch"), civil: S5.progOn("civil"), civilSubs: S5.store.count("subject", (s) => s.program === "civil") }));
check("fresh install defaults to Architecture only", d0.progs.length === 1 && d0.arch && !d0.civil, d0);
const sid = await p.evaluate(() => S5.store.list("subject").find((s) => s.name === "Principles of Calculus" && s.program === "arch")?.id);
check("calculus subject exists", !!sid, sid);
await p.evaluate(async () => { await S5.settings.set("lang", "en"); await S5.settings.set("semesterStart", S5.addDays(S5.todayISO(), -15)); });
await p.evaluate((id) => S5.ui.go({ v: "subject", id, tab: "lectures" }), sid); await p.waitForTimeout(400);
const v = await p.evaluate(() => ({ n: document.querySelectorAll(".syl-list li").length, bold: [...document.querySelectorAll(".syl-list li")].findIndex((li) => li.style.fontWeight === "700"), week: S5.syllabusWeek(), txt: document.getElementById("view").textContent }));
check("16 official weeks listed", v.n === 16, v.n);
check("day 15 → week 3 highlighted", v.week === 3 && v.bold === 2 && /week 3|الأسبوع 3/.test(v.txt) && /linear equations/.test(v.txt), { week: v.week, bold: v.bold });
check("no integration in calculus syllabus", !/integra/i.test(JSON.stringify(await p.evaluate(() => S5.SYLLABUS["Principles of Calculus"]))));
const add = async () => { await p.click('[data-act="syl-topics"]'); await p.waitForTimeout(500); return p.evaluate((id) => S5.store.count("topic", (t) => t.subjectId === id && t.source === "Official syllabus"), sid); };
const a1 = await add(), a2 = await add();
check("add as exam topics creates 16 once", a1 === 16 && a2 === 16, { a1, a2 });
await p.evaluate(() => S5.settings.set("semesterStart", S5.addDays(S5.todayISO(), 3))); await p.waitForTimeout(300);
check("before start → week 0", (await p.evaluate(() => S5.syllabusWeek())) === 0);
const civ = await p.evaluate(async () => { await S5.settings.set("programs", ["arch", "civil"]); return { civil: S5.progOn("civil"), subs: S5.store.count("subject", (s) => s.program === "civil") }; });
check("civil can still be switched on, subjects untouched", civ.civil && civ.subs === d0.civilSubs, civ);
const civSub = await p.evaluate(() => S5.store.list("subject").find((s) => s.program === "civil"));
if (civSub) { await p.evaluate((id) => S5.ui.go({ v: "subject", id, tab: "lectures" }), civSub.id); await p.waitForTimeout(300); check("no syllabus section on civil subjects", (await p.$$(".syl-list")).length === 0); }
await p.evaluate(async () => { await S5.kb.load(); });
check("matrices lesson in kb", await p.evaluate(() => !!S5.kb.byId.get("a1b-calc-08")));
check("no page errors", errors.length === 0, errors);
console.log(JSON.stringify({ suite: "col-syllabus", res, failed: fails, errors }, null, 1));
if (fails.length) process.exitCode = 1;
await b.close();
