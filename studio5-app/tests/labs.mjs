import { createRequire } from "node:module"; const require = createRequire("/x/");
const { chromium } = require("/opt/node22/lib/node_modules/playwright"); const S = process.env.S;
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"] });
const page = await (await b.newContext({ viewport: { width: 1300, height: 900 } })).newPage(); const errors = [];
page.on("pageerror", (e) => errors.push(e.message)); page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
await page.goto("http://127.0.0.1:8787/"); await page.waitForTimeout(1800);
await page.evaluate(() => S5.settings.set("lang", "en")); await page.waitForTimeout(300);
console.log("three:", await page.evaluate(() => !!window.THREE));
for (const k of ["truss", "beam", "concrete", "steel", "soil", "channel"]) { await page.evaluate((k) => S5.ui.go({ v: "lab", id: k }), k); await page.waitForTimeout(900); if (k === "concrete") { await page.click('[data-c="crush"]'); await page.waitForTimeout(6500); } if (k === "steel") { await page.click("#lab-stage .btn.primary"); await page.waitForTimeout(3000); } await page.screenshot({ path: `${S}/shots/50-lab-${k}.png` }); console.log(k, JSON.stringify(await page.evaluate((k) => S5.labState[k]?.summary, k))); }
// save a report
await page.evaluate(() => S5.ui.go({ v: "lab", id: "truss" })); await page.waitForTimeout(500); await page.click('[data-act="lab-save"]'); await page.waitForTimeout(200); await page.click("[data-save]"); await page.waitForTimeout(300);
console.log("reports:", await page.evaluate(() => S5.store.list("labReport").length));
for (const k of ["massing", "persp", "compose"]) { await page.evaluate((k) => S5.ui.go({ v: "atelier", id: k }), k); await page.waitForTimeout(1800); await page.screenshot({ path: `${S}/shots/51-atelier-${k}.png` }); }
await page.evaluate(() => S5.ui.go({ v: "atelier", id: "massing" })); await page.waitForTimeout(1200);
await page.selectOption("#m-proj", { index: 1 }); await page.click("#m-prog"); await page.waitForTimeout(600); await page.fill("#m-time", "16"); await page.dispatchEvent("#m-time", "input"); await page.waitForTimeout(600);
await page.screenshot({ path: `${S}/shots/52-massing-program.png` }); await page.click("#m-save"); await page.waitForTimeout(300);
console.log("massing saved:", await page.evaluate(() => S5.store.list("massing").map((m) => m.boxes.length)));
console.log("errors:", errors); await b.close();
