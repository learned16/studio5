// The virtual campus: 3D scene renders, walking with keys and the stick moves you, tapping the map walks to a
// department, the door card opens and its room enters the right part of the app; coming back keeps your place.
import { createRequire } from "node:module"; const require = createRequire("/x/"); const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const S = process.env.S; const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"] });
const res = {}; const errors = [];
for (const [name, vp] of [["laptop", { width: 1280, height: 800 }], ["tablet", { width: 1280, height: 800, isMobile: true, hasTouch: true }], ["phone", { width: 400, height: 820, isMobile: true, hasTouch: true }]]) {
  const ctx = await b.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.isMobile, hasTouch: vp.hasTouch });
  const page = await ctx.newPage(); page.on("pageerror", (e) => errors.push(name + ": " + e.message));
  await page.goto("http://localhost:8765/"); await page.waitForTimeout(2000);
  if (name !== "laptop") { await page.screenshot({ path: S + `/shots/71-campus-${name}.png` }); continue; }
  res.landsOnCampus = await page.evaluate(() => S5.ui.route.v === "campus" && !!document.querySelector("#cp-3d canvas"));
  res.navFirst = await page.evaluate(() => S5.NAV[0][0] === "campus");
  await page.screenshot({ path: S + "/shots/70-campus-gate.png" });
  const pos = () => page.evaluate(() => ({ x: S5.campusState.x, z: S5.campusState.z, near: S5.campus && S5.campus.near }));
  const p0 = await pos(); await page.keyboard.down("KeyW"); await page.waitForTimeout(900); await page.keyboard.up("KeyW"); const p1 = await pos();
  res.keysWalk = p1.z < p0.z - 3;
  const j = await page.$eval("#cp-joy", (e) => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  await page.mouse.move(j.x, j.y); await page.mouse.down(); await page.mouse.move(j.x, j.y - 50, { steps: 3 }); await page.waitForTimeout(700); await page.mouse.up(); const p2 = await pos();
  res.stickWalk = p2.z < p1.z - 2;
  // tap the architecture department on the map → walks there, card opens
  const m = await page.evaluate(() => { const r = document.getElementById("cp-map").getBoundingClientRect(), b = S5.CAMPUS[0], s = r.width / 180; return { x: r.left + (90 + b.x) * s, y: r.top + (90 + b.z - 12) * s }; });
  await page.mouse.click(m.x, m.y);
  await page.waitForFunction(() => S5.campus && S5.campus.near === "arch", null, { timeout: 30000 }).catch(() => {});
  res.mapWalkArrives = (await pos()).near === "arch"; await page.waitForTimeout(400);
  res.cardShown = await page.evaluate(() => !document.getElementById("cp-card").hidden && document.getElementById("cp-card").innerText);
  await page.screenshot({ path: S + "/shots/72-campus-arch-door.png" });
  await page.click('#cp-card [data-act="campus-room"][data-i="1"]'); await page.waitForTimeout(900);
  res.enteredAtelier = await page.evaluate(() => S5.ui.route.v === "atelier");
  const before = await pos(); await page.evaluate(() => S5.ui.go("campus")); await page.waitForTimeout(800);
  const after = await pos(); res.placeKept = Math.abs(after.x - before.x) < 0.5 && Math.abs(after.z - before.z) < 0.5 && after.near === "arch";
  // tap a building in 3D (civil) → walks there
  await page.evaluate(() => { S5.campusState.x = 0; S5.campusState.z = -6; S5.campusState.yaw = -Math.PI / 2; }); await page.waitForTimeout(300);
  const c = await page.$eval("#cp-3d canvas", (e) => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 - 40 }; });
  await page.mouse.click(c.x, c.y); await page.waitForFunction(() => S5.campus && S5.campus.near === "civil", null, { timeout: 30000 }).catch(() => {});
  res.tapBuildingWalks = (await pos()).near === "civil";
  await page.keyboard.press("Enter"); await page.waitForTimeout(700); res.enterKey = await page.evaluate(() => S5.ui.route.v === "study");
  // the rest of the departments open their rooms
  res.allRooms = await page.evaluate(async () => { const bad = []; for (const b of S5.CAMPUS) for (const [, r] of b.rooms) { S5.ui.go({ ...r }); await new Promise((x) => setTimeout(x, 150)); if (/hit an error/.test(document.getElementById("view").innerText)) bad.push(b.id + ":" + r.v); } return bad.length ? bad : true; });
  await page.evaluate(() => S5.ui.go("campus")); await page.waitForTimeout(600);
  await page.click('[data-act="lang"]').catch(() => {}); await page.waitForTimeout(500);
  res.langToggle = await page.evaluate(() => document.querySelector(".cp-head h1").textContent);
  await page.evaluate(() => { S5.campusState.x = -20; S5.campusState.z = 30; S5.campusState.yaw = 2.3; }); await page.waitForTimeout(400);
  await page.screenshot({ path: S + "/shots/73-campus-plaza.png" });
  await page.evaluate(() => { S5.campusHour = 11; S5.campusState.x = 0; S5.campusState.z = 30; S5.campusState.yaw = 0; S5.ui.go("today"); S5.ui.go("campus"); }); await page.waitForTimeout(900);
  await page.screenshot({ path: S + "/shots/74-campus-day.png" });
  await page.evaluate(() => { S5.campusState.x = -8; S5.campusState.z = -22; S5.campusState.yaw = 0.25; }); await page.waitForTimeout(400);
  await page.screenshot({ path: S + "/shots/75-campus-day-library.png" });
  await page.evaluate(() => S5.campus.walkTo("affairs")); await page.waitForFunction(() => S5.campus && S5.campus.near === "affairs", null, { timeout: 30000 }).catch(() => {}); await page.waitForTimeout(500);
  await page.screenshot({ path: S + "/shots/76-campus-day-affairs.png" });
  // without WebGL the departments show as cards
  await page.evaluate(() => { const h = document.createElement("div"); h.id = "fb"; document.body.appendChild(h); S5.campusFallback(h); });
  res.fallbackCards = await page.evaluate(() => document.querySelectorAll("#fb [data-act='campus-room']").length);
  await ctx.close();
}
console.log(JSON.stringify(res, null, 1)); console.log("errors:", errors); await b.close();
