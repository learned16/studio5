import { createRequire } from "node:module"; const require = createRequire("/x/");
const { chromium } = require("/opt/node22/lib/node_modules/playwright"); const S = process.env.S;
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const page = await (await b.newContext({ viewport: { width: 1280, height: 860 } })).newPage(); const errors = [];
page.on("pageerror", (e) => errors.push(e.message)); page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
await page.goto("http://127.0.0.1:8787/"); await page.waitForTimeout(1800);
console.log("lang:", await page.evaluate(() => [S5.i18n.lang(), document.documentElement.dir]));
await page.screenshot({ path: S + "/shots/40-ar-today.png" });
await page.evaluate(() => S5.ui.go({ v: "study" })); await page.waitForTimeout(500); await page.screenshot({ path: S + "/shots/41-ar-study.png" });
await page.evaluate(() => S5.ui.go({ v: "project", id: S5.store.list("project")[0].id, tab: "gate" })); await page.waitForTimeout(500); await page.screenshot({ path: S + "/shots/42-ar-gate.png" });
// untranslated leftovers on main screens
const left = await page.evaluate(async () => { const out = new Set(); const routes = [{ v: "today" }, { v: "study" }, { v: "projects" }, { v: "practice" }, { v: "library" }, { v: "system" }]; for (const r of routes) { S5.ui.go(r); await new Promise((x) => setTimeout(x, 300)); const w = document.createTreeWalker(document.getElementById("view"), NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) { if (S5.i18n.skip(n.parentElement)) continue; const t = n.nodeValue.trim(); if (/[A-Za-z]{3}/.test(t) && !/[؀-ۿ]/.test(t)) out.add(t); } } return [...out]; });
console.log("leftover:", left.length, left.slice(0, 40));
await page.click('[data-act="lang"]'); await page.waitForTimeout(400);
console.log("after toggle:", await page.evaluate(() => [S5.i18n.lang(), document.documentElement.dir, document.querySelector("h1").textContent]));
console.log("errors:", errors); await b.close();
