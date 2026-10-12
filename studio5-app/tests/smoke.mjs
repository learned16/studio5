import { createRequire } from "node:module"; const require = createRequire("/usr/local/lib/node_modules/");
const { chromium } = require(process.env.PW || "playwright");
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 } });
const page = await ctx.newPage(); const errors = [];
page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text()); });
await page.goto("http://localhost:8765/"); await page.waitForTimeout(1500);
const shot = async (n) => page.screenshot({ path: `${process.env.OUT}/${n}.png`, fullPage: false });
await shot("01-today");
const routes = [["study"], ["study", "timetable"], ["study", "curriculum"], ["study", "grades"], ["study", "review"], ["projects"], ["practice"], ["practice", "tools"], ["practice", "lab"], ["library"], ["library", "skills"], ["library", "memory"], ["system"], ["system", "backup"], ["system", "years"], ["system", "privacy"], ["inbox"], ["notifications"]];
for (const [v, tab] of routes) { await page.evaluate(([v, tab]) => S5.ui.go(tab ? { v, tab } : { v }), [v, tab]); await page.waitForTimeout(250); const txt = await page.$eval("#view", (e) => e.innerText.slice(0, 80)); if (/hit an error/.test(txt)) errors.push(`route ${v}/${tab}: ${txt}`); }
// subject tabs
for (const tab of ["lectures", "materials", "tasks", "understanding", "exams", "problems", "professor", "about"]) { await page.evaluate((tab) => S5.ui.go({ v: "subject", id: "sub_03", tab }), tab); await page.waitForTimeout(200); const txt = await page.$eval("#view", (e) => e.innerText); if (/hit an error/.test(txt)) errors.push(`subject/${tab}: ${txt.slice(0, 200)}`); }
await shot("02-subject-exams");
const pid = await page.evaluate(() => S5.store.list("project")[0].id);
for (const [tab] of await page.evaluate(() => S5.PROJECT_TABS)) { await page.evaluate(([id, tab]) => S5.ui.go({ v: "project", id, tab }), [pid, tab]); await page.waitForTimeout(200); const txt = await page.$eval("#view", (e) => e.innerText); if (/hit an error/.test(txt)) errors.push(`project/${tab}: ${txt.slice(0, 200)}`); if (tab === "alternatives") await shot("03-alternatives"); if (tab === "gate") await shot("04-gate"); }
// tools
for (const k of await page.evaluate(() => Object.keys(S5.TOOL_DEFS))) { await page.evaluate((k) => S5.ui.go({ v: "tool", id: k }), k); await page.waitForTimeout(120); const txt = await page.$eval("#view", (e) => e.innerText); if (/hit an error|Check the inputs/.test(txt)) errors.push(`tool ${k}: ${txt.slice(0, 300)}`); if (k === "beam") await shot("05-beam"); }
// lecture workspace + capture
const lecId = await page.evaluate(async () => (await S5.ensureLecture("sub_01")).id);
await page.evaluate((id) => S5.ui.go({ v: "lecture", id }), lecId); await page.waitForTimeout(300);
await page.fill("#qcap", "Test capture from smoke"); await page.press("#qcap", "Enter"); await page.waitForTimeout(300);
await page.click('[data-act="lec-notebook"]'); await page.waitForTimeout(500);
// draw a stroke on the notebook
const box = await page.$eval("#lec-nb .ink-stage", (e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
await page.mouse.move(box.x + 60, box.y + 80); await page.mouse.down(); for (let i = 0; i < 20; i++) await page.mouse.move(box.x + 60 + i * 10, box.y + 80 + i * 3); await page.mouse.up(); await page.waitForTimeout(900);
const strokes = await page.evaluate((id) => { const nb = S5.store.get(S5.store.get(id).notebookId); return S5.store.get(nb.pages[0]).strokes.length; }, lecId);
if (strokes !== 1) errors.push("ink stroke not saved: " + strokes);
await shot("06-lecture");
await page.evaluate((id) => S5.ui.go({ v: "lecture", id, tab: "closeout" }), lecId); await page.waitForTimeout(300); await shot("07-closeout");
// drill
await page.evaluate(() => S5.ui.go({ v: "drill", id: "drl_p1" })); await page.waitForTimeout(500);
const b2 = await page.$eval("#drill-ink .ink-stage", (e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y }; });
for (let k = 0; k < 4; k++) { await page.mouse.move(b2.x + 50 + k * 40, b2.y + 300); await page.mouse.down(); for (let i = 0; i < 15; i++) await page.mouse.move(b2.x + 50 + k * 40 + i * 12, b2.y + 300 - i * (k - 1.5) * 4); await page.mouse.up(); }
await page.waitForTimeout(400); await shot("08-drill");
// rescue modal
const gid = await page.evaluate(async () => (await S5.store.create("gap", { subjectId: "sub_03", text: "Chain rule", stage: 0, attempts: [] })).id);
await page.evaluate((id) => S5.rescue(id), gid); await page.waitForTimeout(200); await page.click('[data-m="visual"]'); await page.click("#rq-save"); await page.waitForTimeout(200);
// capture modal
await page.evaluate(() => S5.ui.go("today")); await page.click("#fab"); await page.waitForTimeout(150); await page.fill("#cap-text", "Bring A3 paper Thursday"); await page.click("#cap-save"); await page.waitForTimeout(300);
// backup round trip
const rt = await page.evaluate(async () => { const pkg = await S5.backup.build(); const v = await S5.backup.verify(pkg); const bad = await S5.backup.verify({ ...pkg, body: pkg.body.replace("Studio", "Xtudio") }); const t = await S5.backup.restoreTest(); return { ok: v.ok, n: v.counts.records, badRejected: !bad.ok, test: t.ok }; });
if (!rt.ok || !rt.badRejected || !rt.test) errors.push("backup: " + JSON.stringify(rt));
// search
await page.evaluate(() => S5.ui.go({ v: "search", q: "limit" })); await page.waitForTimeout(500); const sr = await page.$eval("#search-results", (e) => e.innerText.slice(0, 100)); if (/Nothing found/.test(sr)) errors.push("search found nothing");
// persistence after reload
await page.reload(); await page.waitForTimeout(1200); const persisted = await page.evaluate(() => S5.store.list("capture", (c) => c.text === "Bring A3 paper Thursday").length); if (persisted !== 1) errors.push("not persisted after reload");
// phone viewport
await page.setViewportSize({ width: 390, height: 844 }); await page.evaluate(() => S5.ui.go("today")); await page.waitForTimeout(300); await shot("09-phone-today");
const ow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth); if (ow > 1) errors.push("horizontal overflow on phone: " + ow);
await page.emulateMedia({ colorScheme: "dark" }); await page.setViewportSize({ width: 1280, height: 860 }); await page.evaluate(() => S5.ui.go({ v: "project", id: S5.store.list("project")[0].id })); await page.waitForTimeout(300); await shot("10-dark-project");
console.log(JSON.stringify({ errors, rt }, null, 1));
await browser.close();
