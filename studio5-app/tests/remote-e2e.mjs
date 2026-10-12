import { createRequire } from "node:module"; import { spawn } from "node:child_process"; import { writeFileSync, mkdirSync, rmSync, readFileSync, existsSync } from "node:fs";
const require = createRequire("/x/"); const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const S = process.env.S, SERVER = "http://127.0.0.1:8787", HOME = S + "/comp-home", WS_DIR = S + "/comp-ws";
rmSync(HOME, { recursive: true, force: true }); rmSync(WS_DIR, { recursive: true, force: true }); mkdirSync(HOME, { recursive: true });
writeFileSync(HOME + "/config.json", JSON.stringify({ workspace: WS_DIR, disabled: ["sys.sleep"] }));
const comp = spawn("node", [new URL("../companion/studio5-companion.mjs", import.meta.url).pathname, "--server", SERVER, "--home", HOME, "--simulate", "--pair", "--auto-accept", "--name", "Test-Laptop"], { env: { ...process.env, S5_TRACE: "1" } });
let out = ""; comp.stdout.on("data", (d) => (out += d)); comp.stderr.on("data", (d) => (out += d));
const waitFor = async (re, ms = 20000) => { const t = Date.now(); while (Date.now() - t < ms) { const m = out.match(re); if (m) return m; await new Promise((r) => setTimeout(r, 200)); } throw new Error("timeout waiting for " + re + "\n" + out); };
const code = (await waitFor(/pairing code:\s+(\d{3}) (\d{3})/)).slice(1).join("");
console.log("pairing code from laptop:", code);
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const page = await (await b.newContext({ viewport: { width: 400, height: 860 }, hasTouch: true })).newPage(); const errors = [];
page.on("pageerror", (e) => errors.push(e.message)); page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
await page.goto(SERVER + "/"); await page.waitForTimeout(1500);
await page.evaluate(() => S5.ui.go("remote")); await page.waitForTimeout(800);
await page.fill("#rm-code", code.slice(0, 3) + " " + code.slice(3)); await page.click('[data-act="rm-pair"]');
await page.waitForTimeout(500);
const phoneCheck = await page.evaluate(() => S5.store.meta.remote.check);
const lapCheck = (await waitFor(/Check number on this laptop:\s+(\d\d \d\d \d\d)/))[1];
console.log("check numbers match:", phoneCheck === lapCheck, phoneCheck);
await waitFor(/Connected to/);
for (let i = 0; i < 30 && !(await page.evaluate(() => S5.store.meta.remote.confirmed && S5.remote.laptopOnline)); i++) await page.waitForTimeout(300);
console.log("paired+online:", await page.evaluate(() => S5.store.meta.remote.confirmed && S5.remote.laptopOnline));
const call = (a, args) => page.evaluate(([a, args]) => S5.remote.send(a, args).then((d) => ({ ok: true, d }), (e) => ({ ok: false, e: e.message })), [a, args]);
const res = {};
res.hello = (await call("hello", {})).d?.name;
res.status = (await call("sys.status", {})).d?.battery;
res.move = (await call("mouse.move", { dx: 10, dy: -4 })).ok;
res.combo = (await call("key.combo", { keys: ["ctrl", "s"] })).ok;
res.badKey = (await call("key.combo", { keys: ["nokey"] })).e;
res.type = (await call("key.type", { text: "مرحبا LINE" })).ok;
res.shot = !!(await call("screen.shot", { width: 800 })).d?.jpeg;
res.app = (await call("app.open", { id: "acad" })).d?.opened;
res.unknownApp = (await call("app.open", { id: "evil" })).e;
res.clip = (await call("clip.set", { text: "abc" })).ok && (await call("clip.get", {})).d?.text;
res.traversal = (await call("file.list", { path: "../../etc" })).e;
res.sleepDisabled = (await call("sys.sleep", { confirmed: true })).e;
res.shutdownNeedsConfirm = (await call("sys.shutdown", {})).e;
res.unknownAction = (await call("rm.rf", {})).e;
// phone → laptop file
const put = await page.evaluate(async () => { const f = new File([new Uint8Array(700000).fill(65)], "board.pdf", { type: "application/pdf" }); return S5.remote.putFile(f); });
res.put = put?.saved; res.putSize = existsSync(WS_DIR + "/From phone/board.pdf") && readFileSync(WS_DIR + "/From phone/board.pdf").length;
// laptop → phone into library via a collect job
mkdirSync(WS_DIR + "/Exports", { recursive: true }); writeFileSync(WS_DIR + "/Exports/plan-A1.pdf", "%PDF-1.4 test export");
const jobId = await page.evaluate(async () => (await S5.store.create("job", { title: "Collect", kind: "collect", ext: ".pdf", state: "draft", app: "export" })).id);
await page.evaluate((id) => S5.runJob(id), jobId);
for (let i = 0; i < 40; i++) { const st = await page.evaluate((id) => S5.store.get(id).state, jobId); if (st === "done" || st === "failed") break; await page.waitForTimeout(250); }
res.job = await page.evaluate((id) => ({ state: S5.store.get(id).state, result: S5.store.get(id).result }), jobId);
res.inLibrary = await page.evaluate(() => S5.store.list("file", (f) => f.name === "plan-A1.pdf").length);
await page.keyboard.press("Escape");
res.files = (await call("file.list", { path: "" })).d?.map((f) => f.name);
// touchpad gesture produces mouse moves
await page.evaluate(() => S5.ui.go({ v: "remote", tab: "control" })); await page.waitForTimeout(500);
const tp = await page.$eval("#touchpad", (e) => { const r = e.getBoundingClientRect(); return { x: r.x + 100, y: r.y + 100 }; });
await page.mouse.move(tp.x, tp.y); await page.mouse.down(); for (let i = 0; i < 8; i++) await page.mouse.move(tp.x + i * 10, tp.y + i * 4); await page.mouse.up(); await page.waitForTimeout(300);
await page.screenshot({ path: S + "/shots/30-remote-control.png" });
await page.evaluate(() => S5.ui.go({ v: "remote", tab: "apps" })); await page.waitForTimeout(800); await page.screenshot({ path: S + "/shots/31-remote-apps.png" });
// the laptop view: live stream frames arrive, tap = click at that spot, keyboard, phone keyboard, drag order
await page.evaluate(() => S5.ui.go({ v: "remote", tab: "laptop" })); await page.waitForTimeout(2500);
res.streamFps = await page.evaluate(() => !!document.getElementById("rm-screen").src && document.getElementById("lap-info").textContent);
const sc = await page.$eval("#lap-screen", (e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
await page.touchscreen.tap(sc.x + sc.w * 0.25, sc.y + sc.h * 0.5); await page.waitForTimeout(500);
res.tapClickAt = /SIM movefrac \{"fx":0\.2[45]\d*,"fy":0\.(49|5)\d*\}[\s\S]*SIM click \{"b":"left"/.test(out);
await page.dispatchEvent('.kb-key[data-k="ctrl"]', "pointerdown"); await page.dispatchEvent('.kb-key[data-k="c"]', "pointerdown"); await page.waitForTimeout(400);
res.kbCtrlC = out.includes('SIM keys {"keys":["ctrl","c"]}');
await page.dispatchEvent('.kb-key[data-k="a"]', "pointerdown"); await page.waitForTimeout(400);
res.kbModReleased = out.includes('SIM keys {"keys":["a"]}');
await page.evaluate(() => { const t = document.getElementById("lap-ime"); t.value = "_hi"; t.dispatchEvent(new Event("input")); }); await page.waitForTimeout(700);
res.imeType = out.includes('SIM type {"text":"hi"}');
const before = out.length;
await page.mouse.move(sc.x + 50, sc.y + 40); await page.mouse.down(); for (let i = 1; i < 6; i++) { await page.mouse.move(sc.x + 50 + i * 12, sc.y + 40 + i * 6); await page.waitForTimeout(40); } await page.mouse.up(); await page.waitForTimeout(500);
const seq = out.slice(before).match(/SIM (down|up|movefrac)/g) || []; res.dragOrder = seq[0] === "SIM movefrac" && seq[1] === "SIM down" && seq[seq.length - 1] === "SIM up";
await page.screenshot({ path: S + "/shots/32-remote-laptop.png" });
res.update = (await call("sys.update", {})).d;
// replay protection: resend the exact same envelope must be rejected by the laptop
res.replay = await page.evaluate(async () => { const env = await S5.remote.seal({ id: "replay1", action: "mouse.move", args: { dx: 1, dy: 1 } }); S5.remote.ws.send(JSON.stringify(env)); S5.remote.ws.send(JSON.stringify(env)); return true; });
await page.waitForTimeout(600); res.replayRejected = /Rejected message: replayed/.test(out);
// tampered ciphertext must be rejected
await page.evaluate(async () => { const env = await S5.remote.seal({ id: "t1", action: "mouse.move", args: {} }); env.ct = env.ct.slice(0, -4) + "AAAA"; S5.remote.ws.send(JSON.stringify(env)); }); await page.waitForTimeout(600);
res.tamperRejected = (out.match(/Rejected message/g) || []).length >= 2;
// wrong token cannot join the room
res.badToken = await page.evaluate(() => new Promise((r) => { const w = new WebSocket(`ws://${location.host}/api/ws?device=${S5.store.meta.remote.device}&role=phone&token=wrong`); w.onopen = () => r("opened!"); w.onerror = () => r("refused"); w.onclose = () => r("refused"); }));
console.log(JSON.stringify(res, null, 1));
console.log("browser errors:", errors);
console.log("--- companion log tail ---\n" + out.split("\n").slice(-12).join("\n"));
comp.kill(); await b.close();
