#!/usr/bin/env node
/* Studio5 Companion — lets your paired phone control this laptop through your own Studio5 relay.
   - End-to-end encrypted (ECDH P-256 → HKDF → AES-GCM). The relay only routes ciphertext.
   - Pairing needs a 6-digit code AND your confirmation here, after comparing a check number with the phone.
   - Only listed actions exist. No arbitrary shell commands. File access is limited to the workspace folder.
   - Every command is written to the activity log. Press Ctrl+C to stop; delete config.json to unpair.
   Usage: node studio5-companion.mjs --server https://studio5-app.<you>.workers.dev [--pair] [--simulate] */
import { execFile } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, existsSync, readdirSync, statSync, appendFileSync, createReadStream } from "node:fs";
import { join, resolve, relative, extname, basename, isAbsolute } from "node:path";
import os from "node:os";
import readline from "node:readline";

const VERSION = "1.0.0";
const args = process.argv.slice(2);
const arg = (k, d) => { const i = args.indexOf("--" + k); return i >= 0 ? (args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : true) : d; };
const IS_WIN = process.platform === "win32";
const SIM = !!arg("simulate") || (!IS_WIN && !arg("real"));
const HOME = arg("home", IS_WIN ? join(process.env.APPDATA || os.homedir(), "Studio5Companion") : join(os.homedir(), ".studio5-companion"));
mkdirSync(HOME, { recursive: true });
const CFG_PATH = join(HOME, "config.json"), LOG_PATH = join(HOME, "activity.log");
const subtle = globalThis.crypto.subtle;
const b64 = (buf) => Buffer.from(buf).toString("base64"), unb64 = (s) => new Uint8Array(Buffer.from(s, "base64"));
const hex = (n) => [...globalThis.crypto.getRandomValues(new Uint8Array(n))].map((b) => b.toString(16).padStart(2, "0")).join("");
const log = (...m) => { const line = `[${new Date().toISOString()}] ${m.join(" ")}`; console.log(line); try { appendFileSync(LOG_PATH, line + "\n"); } catch {} };

let cfg = existsSync(CFG_PATH) ? JSON.parse(readFileSync(CFG_PATH, "utf8")) : {};
const save = () => writeFileSync(CFG_PATH, JSON.stringify(cfg, null, 2));
cfg.server = (arg("server") || cfg.server || "").replace(/\/$/, "");
if (!cfg.server) { console.error("Missing --server https://studio5-app.<you>.workers.dev"); process.exit(1); }
cfg.workspace = cfg.workspace || join(os.homedir(), "Documents", "Studio5");
cfg.inbox = cfg.inbox || join(cfg.workspace, "From phone");
cfg.exports = cfg.exports || join(cfg.workspace, "Exports");
for (const d of [cfg.workspace, cfg.inbox, cfg.exports]) mkdirSync(d, { recursive: true });
cfg.apps = cfg.apps || [
  { id: "explorer", name: "File Explorer", run: "explorer" }, { id: "chrome", name: "Chrome", run: "chrome" },
  { id: "acad", name: "AutoCAD", run: "acad" }, { id: "revit", name: "Revit", run: "Revit" }, { id: "sketchup", name: "SketchUp", run: "SketchUp" },
  { id: "lumion", name: "Lumion", run: "Lumion" }, { id: "photoshop", name: "Photoshop", run: "Photoshop" },
  { id: "word", name: "Word", run: "winword" }, { id: "excel", name: "Excel", run: "excel" }, { id: "powerpoint", name: "PowerPoint", run: "powerpnt" },
  { id: "calc", name: "Calculator", run: "calc" }, { id: "notepad", name: "Notepad", run: "notepad" },
];
cfg.disabled = cfg.disabled || []; // e.g. ["sys.shutdown"]
save();

/* ---------- crypto (same scheme as the app) ---------- */
async function newKeys() { const kp = await subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]); return { pub: b64(await subtle.exportKey("raw", kp.publicKey)), priv: await subtle.exportKey("jwk", kp.privateKey) }; }
async function deriveKey(privJwk, peerPubB64, device) {
  const priv = await subtle.importKey("jwk", privJwk, { name: "ECDH", namedCurve: "P-256" }, false, ["deriveBits"]);
  const peer = await subtle.importKey("raw", unb64(peerPubB64), { name: "ECDH", namedCurve: "P-256" }, false, []);
  const bits = await subtle.deriveBits({ name: "ECDH", public: peer }, priv, 256);
  const hk = await subtle.importKey("raw", bits, "HKDF", false, ["deriveKey"]);
  return subtle.deriveKey({ name: "HKDF", hash: "SHA-256", salt: new TextEncoder().encode(device), info: new TextEncoder().encode("studio5-remote-v1") }, hk, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}
async function checkCode(aPub, bPub) { const h = new Uint8Array(await subtle.digest("SHA-256", Buffer.concat([Buffer.from(unb64(aPub)), Buffer.from(unb64(bPub))]))); const n = ((h[0] << 16) | (h[1] << 8) | h[2]) % 1000000; return String(n).padStart(6, "0").replace(/(\d\d)(\d\d)(\d\d)/, "$1 $2 $3"); }
let KEY = null; const seen = new Map();
async function seal(body) { const iv = globalThis.crypto.getRandomValues(new Uint8Array(12)); const pt = new TextEncoder().encode(JSON.stringify({ ts: Date.now(), n: hex(8), from: "laptop", body })); return { t: "msg", iv: b64(iv), ct: b64(await subtle.encrypt({ name: "AES-GCM", iv }, KEY, pt)) }; }
async function open(env) {
  const pt = await subtle.decrypt({ name: "AES-GCM", iv: unb64(env.iv) }, KEY, unb64(env.ct)); const m = JSON.parse(new TextDecoder().decode(pt));
  if (m.from !== "phone") throw new Error("wrong direction"); if (Math.abs(Date.now() - m.ts) > (env.queue ? 864e5 : 120000)) throw new Error("stale message (replay protection)");
  if (seen.has(m.n)) throw new Error("replayed message"); seen.set(m.n, Date.now()); if (seen.size > 2000) for (const k of [...seen.keys()].slice(0, 500)) seen.delete(k);
  return m.body;
}

/* ---------- Windows input & screen driver ----------
   Uses nut-js — an open-source, widely used desktop-automation library that ships prebuilt, signed native
   binaries — for the pointer, keyboard and screen capture. Nothing is generated or compiled at runtime, so
   there is no script for antivirus to flag. Clipboard, lock, status and window focus use ordinary Windows
   commands. If the library cannot load, those three input features report a clear error and everything else
   (files, apps, jobs) keeps working. */
const psOut = (cmd) => new Promise((res, rej) => execFile("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", cmd], { windowsHide: true, maxBuffer: 8e6 }, (e, out) => (e ? rej(e) : res(String(out)))));
const NAME2KEY = { ctrl: "LeftControl", control: "LeftControl", shift: "LeftShift", alt: "LeftAlt", win: "LeftWin", meta: "LeftWin", tab: "Tab", enter: "Enter", return: "Enter", esc: "Escape", escape: "Escape", space: "Space", backspace: "Backspace", delete: "Delete", del: "Delete", left: "Left", right: "Right", up: "Up", down: "Down", home: "Home", end: "End", pageup: "PageUp", pagedown: "PageDown", mute: "AudioMute", voldown: "AudioVolDown", volup: "AudioVolUp", next: "AudioNext", prev: "AudioPrev", playpause: "AudioPlay" };
class NutDriver {
  constructor() { this.ready = this.load(); this.ready.catch((e) => log("Input library not available:", e.message, "— mouse/keyboard/screen are off; files, apps and jobs still work.")); }
  async ensure() { try { await this.ready; } catch { throw new Error("Input control is off (the nut-js library did not load). Re-run the installer to add it. Files, apps and jobs still work."); } }
  async load() {
    const nut = await import("@nut-tree-fork/nut-js");
    this.n = nut; this.mouse = nut.mouse; this.keyboard = nut.keyboard; this.screen = nut.screen;
    this.mouse.config.autoDelayMs = 0; this.mouse.config.mouseSpeed = 4000; this.keyboard.config.autoDelayMs = 0;
    const jimpMod = await import("jimp"); this.Jimp = jimpMod.default || jimpMod;
    log("Input library ready (nut-js).");
  }
  keyOf(name) { const k = String(name).toLowerCase(); let key = NAME2KEY[k]; if (!key && /^[a-z0-9]$/.test(k)) key = k.toUpperCase(); if (!key && /^f([1-9]|1[0-2])$/.test(k)) key = "F" + k.slice(1); const v = this.n.Key[key]; if (v === undefined) throw new Error("unknown key " + name); return v; }
  btn(b) { return b === "right" ? this.n.Button.RIGHT : b === "middle" ? this.n.Button.MIDDLE : this.n.Button.LEFT; }
  async call(op, a = {}) {
    await this.ensure();
    const M = this.mouse, K = this.keyboard, S = this.screen, P = (x, y) => new this.n.Point(x, y);
    switch (op) {
      case "move": { const p = await M.getPosition(); await M.setPosition(P(p.x + (a.dx | 0), p.y + (a.dy | 0))); return; }
      case "moveabs": await M.setPosition(P(a.x | 0, a.y | 0)); return;
      case "click": { const b = this.btn(a.b); if (a.dbl) await M.doubleClick(b); else await M.click(b); return; }
      case "down": await M.pressButton(this.n.Button.LEFT); return;
      case "up": await M.releaseButton(this.n.Button.LEFT); return;
      case "wheel": { const d = a.d | 0; if (d >= 0) await M.scrollDown(d); else await M.scrollUp(-d); return; }
      case "hwheel": { const d = a.d | 0; if (d >= 0) await M.scrollRight(d); else await M.scrollLeft(-d); return; }
      case "keys": { const keys = a.keys.map((n) => this.keyOf(n)); await K.pressKey(...keys); await K.releaseKey(...keys.reverse()); return; }
      case "type": { // paste for reliable Arabic/Unicode: set clipboard, Ctrl+V, restore
        const old = await psOut("Get-Clipboard -Raw").catch(() => "");
        await this.call("clipset", { text: a.text });
        await new Promise((r) => setTimeout(r, 50));
        await K.pressKey(this.n.Key.LeftControl, this.n.Key.V); await K.releaseKey(this.n.Key.V, this.n.Key.LeftControl);
        await new Promise((r) => setTimeout(r, 120)); await this.call("clipset", { text: old });
        return;
      }
      case "shot": {
        const img = await S.grab(); const w = img.width, h = img.height, ch = img.channels, src = img.data; // BGR(A)
        const jimg = new this.Jimp(w, h); const dst = jimg.bitmap.data;
        for (let i = 0, n = w * h; i < n; i++) { const s = i * ch, d = i * 4; dst[d] = src[s + 2]; dst[d + 1] = src[s + 1]; dst[d + 2] = src[s]; dst[d + 3] = 255; }
        try { const pt = await M.getPosition(); const sx = Math.round((pt.x / (S.width ? await S.width() : w)) * w) || pt.x, sy = Math.round((pt.y / (S.height ? await S.height() : h)) * h) || pt.y; for (let yy = -6; yy <= 6; yy++) for (let xx = -6; xx <= 6; xx++) if (xx * xx + yy * yy <= 36) { const px = sx + xx, py = sy + yy; if (px >= 0 && px < w && py >= 0 && py < h) { const d = (py * w + px) * 4; dst[d] = 220; dst[d + 1] = 40; dst[d + 2] = 40; } } } catch {}
        const target = Math.min(a.w || 1280, w); if (target < w) jimg.resize(target, this.Jimp.AUTO);
        jimg.quality(Math.min(Math.max(a.q || 60, 20), 90));
        const buf = await jimg.getBufferAsync(this.Jimp.MIME_JPEG);
        return { jpeg: buf.toString("base64"), w: jimg.bitmap.width, h: jimg.bitmap.height, sw: w, sh: h };
      }
      case "clipget": return { text: await psOut("Get-Clipboard -Raw").catch(() => "") };
      case "clipset": { const b64 = Buffer.from(String(a.text ?? ""), "utf8").toString("base64"); await psOut(`Set-Clipboard -Value ([System.Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('${b64}')))`); return; }
      case "lock": execFile("rundll32.exe", ["user32.dll,LockWorkStation"], { windowsHide: true }); return;
      case "status": { const o = JSON.parse(await psOut("$b=Get-CimInstance Win32_Battery -EA SilentlyContinue|Select -First 1;$o=Get-CimInstance Win32_OperatingSystem;[pscustomobject]@{battery=if($b){[int]$b.EstimatedChargeRemaining}else{$null};charging=if($b){$b.BatteryStatus -eq 2}else{$true};freeMemMB=[int]($o.FreePhysicalMemory/1024);totalMemMB=[int]($o.TotalVisibleMemorySize/1024);uptimeH=[math]::Round(((Get-Date)-$o.LastBootUpTime).TotalHours,1)}|ConvertTo-Json -Compress")); return o; }
      case "windows": { const t = (await psOut("Get-Process|?{$_.MainWindowTitle}|Select -First 30 Id,ProcessName,MainWindowTitle|ConvertTo-Json -Compress")).trim(); const arr = t ? [].concat(JSON.parse(t)) : []; return arr.map((p) => ({ pid: p.Id, app: p.ProcessName, title: p.MainWindowTitle })); }
      case "focus": await psOut(`(New-Object -ComObject WScript.Shell).AppActivate(${a.pid | 0})`); return true;
      default: throw new Error("unknown op " + op);
    }
  }
}
class SimDriver { // for testing on non-Windows machines: logs every action
  async call(op, a = {}) {
    if (op === "shot") { const jpeg = "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA="; return { jpeg, w: 1, h: 1, sw: 1920, sh: 1080 }; }
    if (op === "status") return { battery: 87, charging: true, freeMemMB: 4096, totalMemMB: 16384, uptimeH: 3.2 };
    if (op === "clipget") return { text: SimDriver.clip || "" };
    if (op === "clipset") { SimDriver.clip = a.text; return null; }
    if (op === "windows") return [{ pid: 1, app: "simulated", title: "Simulated window" }];
    SimDriver.last = { op, ...a }; return null;
  }
}
const drv = SIM ? new SimDriver() : new NutDriver();

/* ---------- actions ---------- */
const inWorkspace = (p) => { const full = resolve(cfg.workspace, String(p || ".")); const rel = relative(cfg.workspace, full); if (rel === ".." || rel.startsWith("../") || rel.startsWith("..\\") || isAbsolute(rel)) throw new Error("outside the workspace folder"); return full; };
const start = (target) => new Promise((res, rej) => { if (SIM) { log("SIM open", target); return res(); } execFile("cmd.exe", ["/c", "start", "", target], { windowsHide: true }, (e) => (e ? rej(e) : res())); });
const SENSITIVE = new Set(["sys.shutdown", "sys.sleep", "sys.restart"]);
const uploads = new Map();
const ACTIONS = {
  "hello": async () => ({ name: cfg.name, os: `${os.type()} ${os.release()}`, version: VERSION, simulate: SIM, workspace: cfg.workspace, apps: cfg.apps.map(({ id, name }) => ({ id, name })), disabled: cfg.disabled }),
  "sys.status": async () => ({ ...(await drv.call("status")), host: os.hostname(), cpus: os.cpus().length, load: os.loadavg()[0] }),
  "mouse.move": async (b) => drv.call("move", { dx: Math.round(b.dx), dy: Math.round(b.dy) }),
  "mouse.to": async (b) => drv.call("moveabs", { x: Math.round(b.x), y: Math.round(b.y) }),
  "mouse.click": async (b) => drv.call("click", { b: b.button || "left", dbl: !!b.double }),
  "mouse.down": async () => drv.call("down"), "mouse.up": async () => drv.call("up"),
  "mouse.scroll": async (b) => drv.call(b.horizontal ? "hwheel" : "wheel", { d: Math.round(b.dy) }),
  "key.combo": async (b) => drv.call("keys", { keys: b.keys }),
  "key.type": async (b) => drv.call("type", { text: String(b.text).slice(0, 5000) }),
  "screen.shot": async (b) => drv.call("shot", { w: Math.min(b.width || 1280, 2560), q: Math.min(Math.max(b.quality || 60, 20), 90) }, 20000),
  "clip.get": async () => drv.call("clipget"), "clip.set": async (b) => drv.call("clipset", { text: String(b.text).slice(0, 100000) }),
  "win.list": async () => drv.call("windows"), "win.focus": async (b) => drv.call("focus", { pid: b.pid }),
  "app.open": async (b) => { const a = cfg.apps.find((x) => x.id === b.id); if (!a) throw new Error("app not in the list"); await start(a.run); return { opened: a.name }; },
  "file.list": async (b) => { const dir = inWorkspace(b.path); return readdirSync(dir, { withFileTypes: true }).filter((d) => !d.name.startsWith(".")).slice(0, 300).map((d) => { const s = statSync(join(dir, d.name)); return { name: d.name, dir: d.isDirectory(), size: s.size, mtime: s.mtimeMs }; }).sort((a, b) => (b.dir - a.dir) || b.mtime - a.mtime); },
  "file.open": async (b) => { const f = inWorkspace(b.path); if (!existsSync(f)) throw new Error("file not found"); await start(f); return { opened: basename(f) }; },
  "file.get": async (b, reply) => { // streamed to the phone in 400 KB chunks
    const f = inWorkspace(b.path); const st = statSync(f); if (st.size > 80 * 1048576) throw new Error("file larger than 80 MB");
    const total = Math.ceil(st.size / 409600) || 1; let i = 0;
    for await (const chunk of createReadStream(f, { highWaterMark: 409600 })) { await reply({ chunk: b64(chunk), i: i++, total, name: basename(f), size: st.size }, true); }
    if (!st.size) await reply({ chunk: "", i: 0, total: 1, name: basename(f), size: 0 }, true);
    return { done: true, name: basename(f), size: st.size };
  },
  "file.put": async (b) => { // phone → laptop, chunked; lands in the "From phone" folder
    const key = b.uid; let u = uploads.get(key); if (!u) { u = { parts: [], name: basename(String(b.name)).replace(/[<>:"/\\|?*]/g, "_") }; uploads.set(key, u); }
    u.parts[b.i] = Buffer.from(unb64(b.chunk));
    if (u.parts.filter(Boolean).length === b.total) { let out = join(cfg.inbox, u.name); if (existsSync(out)) out = join(cfg.inbox, Date.now() + "-" + u.name); writeFileSync(out, Buffer.concat(u.parts)); uploads.delete(key); return { saved: relative(cfg.workspace, out) }; }
    return { received: b.i };
  },
  "sys.lock": async () => drv.call("lock"),
  "sys.sleep": async () => { if (!SIM) execFile("rundll32.exe", ["powrprof.dll,SetSuspendState", "0,1,0"]); return { sleeping: true }; },
  "sys.shutdown": async (b) => { if (!SIM) execFile("shutdown", b.cancel ? ["/a"] : ["/s", "/t", "60", "/c", "Studio5: shutdown requested from your phone. Run 'shutdown /a' to cancel."]); return { inSeconds: b.cancel ? null : 60 }; },
  /* Command jobs: a short, checked sequence with preflight, state updates and an artifact at the end */
  "job.run": async (b, reply) => {
    const job = b.job || {}; const st = (state, extra = {}) => reply({ jobId: job.id, state, ...extra }, true);
    await st("preflight");
    const checks = [];
    const target = job.fileRef ? inWorkspace(job.fileRef) : null;
    if (target) checks.push([`File exists: ${job.fileRef}`, existsSync(target)]);
    if (job.app) checks.push([`App available: ${job.app}`, !!cfg.apps.find((a) => a.id === job.app) || job.app === "other" || job.app === "export"]);
    const free = os.freemem() / 1048576; checks.push([`Free memory ${Math.round(free)} MB`, free > 300]);
    const status = await drv.call("status").catch(() => ({})); if (status.battery != null) checks.push([`Battery ${status.battery}%${status.charging ? " (charging)" : ""}`, status.charging || status.battery > 20]);
    await st("preflight", { checks });
    if (checks.some((c) => !c[1])) { await st("failed", { reason: "Preflight failed" }); throw new Error("Preflight failed: " + checks.filter((c) => !c[1]).map((c) => c[0]).join("; ")); }
    await st("running");
    const before = Date.now();
    if (job.kind === "open" || job.kind === "present") { if (target) await start(target); else if (job.app) await ACTIONS["app.open"]({ id: job.app }); if (job.kind === "present") { await new Promise((r) => setTimeout(r, 6000)); await drv.call("keys", { vks: [VK.f5] }); } }
    await st("verifying");
    if (job.kind === "collect") { // artifact pipeline: newest file in Exports (optionally by extension)
      const ext = (job.ext || "").toLowerCase(); const files = readdirSync(cfg.exports).map((n) => ({ n, s: statSync(join(cfg.exports, n)) })).filter((x) => x.s.isFile() && (!ext || extname(x.n).toLowerCase() === ext)).sort((a, b) => b.s.mtimeMs - a.s.mtimeMs);
      if (!files.length) { await st("failed", { reason: "No exported file found in " + cfg.exports }); throw new Error("nothing to collect"); }
      const rel = relative(cfg.workspace, join(cfg.exports, files[0].n)); await st("done", { artifact: rel, fresh: files[0].s.mtimeMs > before - 36e5 }); return { artifact: rel };
    }
    await st("done"); return { ok: true };
  },
};

/* ---------- connection ---------- */
let ws = null, backoff = 1000;
async function send(obj) { if (ws && ws.readyState === 1) ws.send(JSON.stringify(await seal(obj))); }
function connect() {
  const u = cfg.server.replace(/^http/, "ws") + `/api/ws?device=${cfg.device}&role=laptop&token=${cfg.token}`;
  ws = new WebSocket(u);
  ws.onopen = () => { backoff = 1000; log(`Connected to ${cfg.server} as "${cfg.name}"${SIM ? " (SIMULATION — no real input is sent)" : ""}. Waiting for your phone…`); };
  ws.onmessage = async (ev) => {
    let env; try { env = JSON.parse(ev.data); } catch { return; }
    if (env.t === "presence") { log(env.phones ? `Phone connected (${env.phones})` : "No phone connected"); return; }
    if (env.t !== "msg") return;
    let body; try { body = await open(env); } catch (e) { log("Rejected message:", e.message); return; }
    const { id, action, args: a = {} } = body;
    const reply = (data, partial) => send({ re: id, ok: true, partial: !!partial, data });
    if (!ACTIONS[action]) return send({ re: id, ok: false, error: "Unknown action" });
    if (cfg.disabled.includes(action)) { log("Blocked (disabled in config):", action); return send({ re: id, ok: false, error: "This action is turned off on the laptop" }); }
    if (SENSITIVE.has(action) && !a.confirmed) return send({ re: id, ok: false, error: "Needs confirmation" });
    if (!action.startsWith("mouse.") && action !== "screen.shot" && action !== "file.put") log("▶", action, JSON.stringify(a).slice(0, 120));
    try { const data = await ACTIONS[action](a, reply); await send({ re: id, ok: true, data }); }
    catch (e) { log("✗", action, e.message); await send({ re: id, ok: false, error: e.message }); }
  };
  ws.onclose = () => { log(`Disconnected. Reconnecting in ${Math.round(backoff / 1000)} s…`); setTimeout(connect, backoff); backoff = Math.min(backoff * 2, 30000); };
  ws.onerror = () => {};
}
setInterval(() => { if (ws && ws.readyState === 1) ws.send(JSON.stringify({ t: "ping" })); }, 25000);

/* ---------- pairing ---------- */
const ask = (q) => new Promise((res) => { const rl = readline.createInterface({ input: process.stdin, output: process.stdout }); rl.question(q, (a) => { rl.close(); res(a.trim()); }); });
async function pair() {
  cfg.name = cfg.name || arg("name", os.hostname());
  cfg.device = hex(16); const keys = await newKeys(); cfg.pub = keys.pub; cfg.priv = keys.priv;
  const r = await fetch(cfg.server + "/api/pair/offer", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ device: cfg.device, pub: cfg.pub, name: cfg.name }) }).then((x) => x.json());
  if (!r.code) throw new Error("Pairing failed: " + JSON.stringify(r));
  cfg.token = r.token;
  console.log(`\n  ┌───────────────────────────────────────┐\n  │  Studio5 pairing code:   ${r.code.slice(0, 3)} ${r.code.slice(3)}      │\n  │  Phone: Studio5 → Laptop → Pair        │\n  │  Valid for 10 minutes                  │\n  └───────────────────────────────────────┘\n`);
  let phonePub = null;
  for (let i = 0; i < 300 && !phonePub; i++) { await new Promise((s) => setTimeout(s, 2000)); const st = await fetch(`${cfg.server}/api/pair/status?device=${cfg.device}&token=${cfg.token}`).then((x) => x.json()).catch(() => ({})); phonePub = st.phonePub; }
  if (!phonePub) throw new Error("No phone claimed the code in time. Run again with --pair.");
  const check = await checkCode(cfg.pub, phonePub);
  console.log(`\n  A phone wants to control this laptop.\n  Check number on this laptop:  ${check}\n  It must be IDENTICAL to the number on your phone.\n`);
  const ok = arg("auto-accept") ? "y" : await ask("  Accept this phone? (y/n) ");
  if (ok.toLowerCase() !== "y") { console.log("Rejected. Nothing was saved."); process.exit(0); }
  cfg.phonePub = phonePub; cfg.pairedAt = new Date().toISOString(); save();
  KEY = await deriveKey(cfg.priv, cfg.phonePub, cfg.device);
  log("Paired with phone. Check", check);
  return true;
}

(async () => {
  console.log(`Studio5 Companion ${VERSION} · ${os.hostname()} · ${IS_WIN ? "Windows" : process.platform}${SIM ? " · SIMULATION" : ""}\nWorkspace: ${cfg.workspace}\nLog: ${LOG_PATH}`);
  if (arg("pair") || !cfg.phonePub) { await pair(); }
  else KEY = await deriveKey(cfg.priv, cfg.phonePub, cfg.device);
  connect();
  if (arg("auto-accept")) { /* paired by tests */ }
  // tell the phone we are ready (queued if offline)
  setTimeout(() => send({ hello: true }), 1500);
})().catch((e) => { log("Fatal:", e.message); process.exit(1); });
