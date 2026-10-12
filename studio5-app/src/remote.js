/* Laptop remote — the phone side of Studio5 Remote Work Orchestration.
   Talks to the Studio5 Companion on your laptop through your own relay (same site, /api).
   End-to-end encrypted: ECDH P-256 → HKDF-SHA256 → AES-GCM, with timestamps + nonces against replay.
   The pairing secret stays on this device (not synced, not in backups). */
S5.remote = {
  ws: null, state: "off", laptopOnline: false, info: null, status: null, pending: new Map(), seq: 0, key: null, seen: new Map(), retry: 1000, available: null,
  get pair() { return S5.store.meta.remote || null; },
  log(action, ok, note) { const l = [{ at: S5.now(), action, ok, note: note || "" }, ...(S5.store.meta.remoteLog || [])].slice(0, 300); S5.store.meta.remoteLog = l; S5.idb.put("meta", "remoteLog", l).catch(() => {}); },
  async checkAvailable() {
    if (this.available != null) return this.available;
    if (!S5.standalone || !/^https?:$/.test(location.protocol)) return (this.available = false);
    try { const r = await fetch("/api/health", { cache: "no-store" }); this.available = r.ok && (await r.json()).service === "studio5-relay"; } catch { this.available = false; }
    return this.available;
  },
  /* crypto */
  b64(buf) { return S5.b64FromBuf(buf instanceof ArrayBuffer ? buf : buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)); },
  unb64(s) { return new Uint8Array(S5.bufFromB64(s)); },
  async deriveKey(privJwk, peerPub, device) {
    const s = crypto.subtle;
    const priv = await s.importKey("jwk", privJwk, { name: "ECDH", namedCurve: "P-256" }, false, ["deriveBits"]);
    const peer = await s.importKey("raw", this.unb64(peerPub), { name: "ECDH", namedCurve: "P-256" }, false, []);
    const bits = await s.deriveBits({ name: "ECDH", public: peer }, priv, 256);
    const hk = await s.importKey("raw", bits, "HKDF", false, ["deriveKey"]);
    return s.deriveKey({ name: "HKDF", hash: "SHA-256", salt: new TextEncoder().encode(device), info: new TextEncoder().encode("studio5-remote-v1") }, hk, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
  },
  async checkCode(aPub, bPub) { const a = this.unb64(aPub), b = this.unb64(bPub); const all = new Uint8Array(a.length + b.length); all.set(a); all.set(b, a.length); const h = new Uint8Array(await crypto.subtle.digest("SHA-256", all)); const n = ((h[0] << 16) | (h[1] << 8) | h[2]) % 1000000; return String(n).padStart(6, "0").replace(/(\d\d)(\d\d)(\d\d)/, "$1 $2 $3"); },
  async seal(body, queue) { const iv = crypto.getRandomValues(new Uint8Array(12)); const n = [...crypto.getRandomValues(new Uint8Array(8))].map((b) => b.toString(16).padStart(2, "0")).join(""); const pt = new TextEncoder().encode(JSON.stringify({ ts: Date.now(), n, from: "phone", body })); const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, this.key, pt); return { t: "msg", iv: this.b64(iv), ct: this.b64(ct), queue: !!queue }; },
  async open(env) { const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: this.unb64(env.iv) }, this.key, this.unb64(env.ct)); const m = JSON.parse(new TextDecoder().decode(pt)); if (m.from !== "laptop") throw new Error("direction"); if (Math.abs(Date.now() - m.ts) > 120000) throw new Error("stale"); if (this.seen.has(m.n)) throw new Error("replay"); this.seen.set(m.n, 1); if (this.seen.size > 2000) this.seen.clear(); return m.body; },
  /* pairing */
  async claim(code) {
    const kp = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
    const pub = this.b64(await crypto.subtle.exportKey("raw", kp.publicKey)); const priv = await crypto.subtle.exportKey("jwk", kp.privateKey);
    const r = await fetch("/api/pair/claim", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code: String(code).replace(/\D/g, ""), pub }) }).then((x) => x.json());
    if (r.error) throw new Error(r.error);
    const check = await this.checkCode(r.laptopPub, pub);
    await S5.store.setMeta("remote", { device: r.device, token: r.token, name: r.name, laptopPub: r.laptopPub, pub, priv, check, pairedAt: S5.now(), confirmed: false });
    this.key = null; this.connect();
    return check;
  },
  async unpair() { try { this.ws && this.ws.close(); } catch {} this.ws = null; this.key = null; this.state = "off"; await S5.store.setMeta("remote", null); S5.audit("remote", "Laptop unpaired on this phone"); },
  async connect() {
    const p = this.pair; if (!p || !(await this.checkAvailable())) return;
    if (this.ws && this.ws.readyState <= 1) return;
    this.key = this.key || (await this.deriveKey(p.priv, p.laptopPub, p.device));
    const proto = location.protocol === "https:" ? "wss:" : "ws:";
    const ws = (this.ws = new WebSocket(`${proto}//${location.host}/api/ws?device=${p.device}&role=phone&token=${p.token}`));
    this.state = "connecting"; this.emit();
    ws.onopen = () => { this.state = "online"; this.retry = 1000; this.emit(); this.hello(); };
    ws.onmessage = async (ev) => {
      let env; try { env = JSON.parse(ev.data); } catch { return; }
      if (env.t === "presence") { const was = this.laptopOnline; this.laptopOnline = env.laptop; this.emit(); if (env.laptop && !was) this.hello(); return; }
      if (env.t === "queued") { S5.ui.toast("Laptop is offline — queued, it runs when the laptop connects"); return; }
      if (env.t !== "msg") return;
      let body; try { body = await this.open(env); } catch { return; }
      if (body.hello && this.pair && !this.pair.confirmed) { await S5.store.setMeta("remote", { ...this.pair, confirmed: true }); S5.ui.toast("Laptop accepted the pairing"); this.hello(); this.emit(); return; }
      const w = this.pending.get(body.re); if (!w) return;
      if (body.partial) { w.onPartial && w.onPartial(body.data); return; }
      this.pending.delete(body.re); clearTimeout(w.timer);
      body.ok ? w.res(body.data) : w.rej(new Error(body.error || "failed"));
    };
    ws.onclose = () => { this.state = "offline"; this.laptopOnline = false; this.emit(); if (this.pair) setTimeout(() => this.connect(), this.retry); this.retry = Math.min(this.retry * 2, 20000); };
  },
  async hello() { try { this.info = await this.send("hello", {}, { quiet: true, timeout: 8000 }); if (this.pair && !this.pair.confirmed) await S5.store.setMeta("remote", { ...this.pair, confirmed: true }); this.status = await this.send("sys.status", {}, { quiet: true }).catch(() => null); this.emit(); } catch {} },
  send(action, args = {}, { onPartial, timeout = 20000, quiet, queue } = {}) {
    return new Promise(async (res, rej) => {
      if (!this.ws || this.ws.readyState !== 1 || !this.key) return rej(new Error("Not connected to the relay"));
      if (!this.laptopOnline && !queue) return rej(new Error("The laptop is offline. Start Studio5 Companion on it."));
      const id = "c" + ++this.seq + "_" + Date.now().toString(36);
      const timer = setTimeout(() => { if (this.pending.has(id)) { this.pending.delete(id); rej(new Error("No answer from the laptop")); } }, timeout);
      this.pending.set(id, { res: (d) => { if (!quiet) this.log(action, true); res(d); }, rej: (e) => { if (!quiet) this.log(action, false, e.message); rej(e); }, onPartial, timer });
      try { this.ws.send(JSON.stringify(await this.seal({ id, action, args }, queue))); } catch (e) { this.pending.delete(id); clearTimeout(timer); rej(e); }
    });
  },
  fire(action, args) { this.send(action, args, { quiet: true, timeout: 5000 }).catch(() => {}); },
  emit: S5.debounce(() => { if (S5.ui.route.v === "remote") S5.remote.refreshStatus(); S5.ui.renderChrome && S5.ui.renderChrome(); }, 60),
  refreshStatus() { const el = document.getElementById("rm-status"); if (el) el.innerHTML = S5.remoteStatusHTML(); },
  /* file transfer */
  async fetchFile(path, onProgress) {
    const parts = []; let meta = null;
    await this.send("file.get", { path }, { timeout: 300000, onPartial: (d) => { parts[d.i] = d.chunk; meta = d; onProgress && onProgress(d.i + 1, d.total); } });
    const bytes = parts.map((p) => this.unb64(p)); return new File(bytes, meta?.name || path.split(/[\\/]/).pop(), { type: S5.mimeOf(meta?.name || path) });
  },
  async putFile(file, onProgress) {
    const buf = new Uint8Array(await file.arrayBuffer()); const size = 300000; const total = Math.ceil(buf.length / size) || 1; const uid = S5.uid("up"); let last;
    for (let i = 0; i < total; i++) { last = await this.send("file.put", { uid, name: file.name, i, total, chunk: this.b64(buf.slice(i * size, (i + 1) * size)) }, { timeout: 60000, quiet: i < total - 1 }); onProgress && onProgress(i + 1, total); }
    return last;
  },
};
S5.mimeOf = (n) => ({ pdf: "application/pdf", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", mp4: "video/mp4", txt: "text/plain", csv: "text/csv", json: "application/json" }[(n.split(".").pop() || "").toLowerCase()] || "application/octet-stream");
S5.remoteStatusHTML = () => {
  const r = S5.remote, p = r.pair, st = r.status;
  if (!p) return "";
  const dot = r.laptopOnline ? "green" : r.state === "online" ? "amber" : "red";
  return `<div class="row between"><div class="row"><span class="health-dot ${dot === "green" ? "" : dot === "amber" ? "warn" : "bad"}"></span><b>${S5.esc(p.name)}</b><span class="small muted">${r.laptopOnline ? "online" : r.state === "online" ? "laptop offline — start the Companion" : r.state}</span></div>
    <div class="row small mono">${st ? `${st.battery != null ? `🔋 ${st.battery}%${st.charging ? "+" : ""}` : ""} · RAM ${Math.round((st.freeMemMB || 0) / 1024 * 10) / 10}/${Math.round((st.totalMemMB || 0) / 1024)} GB · up ${st.uptimeH}h` : ""}${r.info?.simulate ? ` · <span style="color:var(--amber)">simulation</span>` : ""}</div></div>`;
};

/* ---------- the Laptop screen ---------- */
S5.views.remote = (r) => {
  const R = S5.remote, p = R.pair, tab = r.tab || "control";
  if (!S5.standalone) return `<div class="page-head"><div class="titles"><span class="eyebrow">Remote work</span><h1>Laptop</h1></div></div>${H.section("Open the installed Studio5", `<p class="small">Laptop control runs through <b>your own Studio5 site on Cloudflare</b> (the installed app). This claude.ai view cannot reach it. Open your Studio5 site on the phone and pair there.</p>`)}`;
  if (R.available === null) { R.checkAvailable().then(() => S5.ui.render()); return `<p class="small muted">Checking the relay…</p>`; }
  if (!R.available) return `<div class="page-head"><div class="titles"><h1>Laptop</h1></div></div>${H.section("Relay not found", `<p class="small">This site has no Studio5 relay (/api). Deploy the latest version from GitHub to your Cloudflare account, then reload.</p>`)}`;
  if (!p) return S5.remotePairView();
  if (!p.confirmed) return `<div class="page-head"><div class="titles"><span class="eyebrow">Pairing</span><h1>Confirm on the laptop</h1></div></div><section class="sheet now" style="max-width:520px"><p>The check number on your laptop must be identical to this one:</p><p class="clock" style="font-size:3rem;margin:12px 0">${S5.esc(p.check)}</p><p class="small muted">If it matches, type <b>y</b> in the Companion window on the laptop. If it doesn't, cancel — someone else may be trying to pair.</p><div class="row" style="margin-top:12px">${H.btn("Cancel pairing", "rm-unpair", {}, "danger")}</div></section>`;
  R.connect();
  const tabs = [["control", "Touchpad & keys"], ["screen", "Screen"], ["apps", "Apps & files"], ["jobs", "Jobs"], ["system", "System"], ["log", "Activity"]];
  let body = "";
  if (tab === "control") {
    S5.ui.mount(() => S5.bindTouchpad(document.getElementById("touchpad")));
    const keys = [["Esc", ["esc"]], ["Tab", ["tab"]], ["Enter", ["enter"]], ["⌫", ["backspace"]], ["Del", ["delete"]], ["←", ["left"]], ["↑", ["up"]], ["↓", ["down"]], ["→", ["right"]], ["Ctrl+Z", ["ctrl", "z"]], ["Ctrl+Y", ["ctrl", "y"]], ["Ctrl+C", ["ctrl", "c"]], ["Ctrl+V", ["ctrl", "v"]], ["Ctrl+S", ["ctrl", "s"]], ["Alt+Tab", ["alt", "tab"]], ["Win", ["win"]], ["Win+D", ["win", "d"]], ["F5", ["f5"]]];
    body = `<div class="split"><div class="stack">
      <div id="touchpad" style="height:min(52vh,420px);border-radius:12px;border:1px solid var(--rule-strong);background:linear-gradient(var(--paper-2),var(--paper));touch-action:none;display:grid;place-items:center;user-select:none;-webkit-user-select:none;position:relative"><span class="small muted" style="pointer-events:none;text-align:center">Touchpad<br><span class="tiny">1 finger: move · tap: click · double tap: double click<br>2 fingers: scroll · 2-finger tap: right click · long press: drag</span></span></div>
      <div class="row">${H.btn("Left click", "rm-click", { b: "left" })}${H.btn("Right click", "rm-click", { b: "right" })}${H.btn("Double click", "rm-click", { b: "left", dbl: 1 })}<label class="small row" style="gap:4px">Speed <input type="range" id="rm-speed" min="1" max="6" step="0.5" value="${S5.ls.get("rmSpeed", 2.5)}" style="width:90px"></label></div>
    </div><div class="stack">
      ${H.section("Keyboard", `<div class="row nowrap"><input id="rm-text" dir="auto" placeholder="Type here — Arabic works" style="flex:1;min-width:0;padding:10px;border:1px solid var(--rule-strong);border-radius:var(--r);background:var(--paper)">${H.btn("Send", "rm-type")}${H.btn("Send + Enter", "rm-type", { enter: 1 }, "primary")}</div><p class="tiny muted" style="margin-top:4px">“Send + Enter” runs commands in AutoCAD's command line.</p><div class="chips" style="margin-top:10px">${keys.map(([n, k]) => `<button class="btn sm" data-act="rm-keys" data-keys="${k.join(",")}">${n}</button>`).join("")}</div>`)}
      ${H.section("Media & presentation", `<div class="chips">${[["⏮", "prev"], ["⏯", "playpause"], ["⏭", "next"], ["🔉", "voldown"], ["🔇", "mute"], ["🔊", "volup"]].map(([n, k]) => `<button class="btn" data-act="rm-keys" data-keys="${k}">${n}</button>`).join("")}<button class="btn" data-act="rm-keys" data-keys="pageup">◀ Slide</button><button class="btn" data-act="rm-keys" data-keys="pagedown">Slide ▶</button></div>`)}
    </div></div>`;
  } else if (tab === "screen") {
    S5.ui.mount(() => { S5.rmShot(); return () => { S5.rmLive = false; }; });
    body = `<div class="row" style="margin-bottom:8px">${H.btn("Refresh", "rm-shot")}<button class="btn ${S5.rmLive ? "primary" : ""}" data-act="rm-live">${S5.rmLive ? "Live ●" : "Live view"}</button><label class="check small"><input type="checkbox" id="rm-tapclick" ${S5.ls.get("rmTapClick", true) ? "checked" : ""}> Tap the picture to click there</label><span class="tiny muted" id="rm-shot-info"></span></div>
      <div style="overflow:auto;border:1px solid var(--rule-strong);border-radius:var(--r);background:#111;max-height:72vh"><img id="rm-screen" alt="Laptop screen" style="display:block;width:100%;max-width:none;cursor:crosshair"></div>`;
  } else if (tab === "apps") {
    S5.ui.mount(() => { S5.rmFiles(S5.rmPath || ""); });
    const apps = R.info?.apps || [];
    body = `<div class="grid cols-2">${H.section("Open on the laptop", apps.length ? `<div class="chips">${apps.map((a) => `<button class="btn" data-act="rm-app" data-id="${S5.esc(a.id)}">${S5.esc(a.name)}</button>`).join("")}</div>` : H.empty("Waiting for the laptop…", ""), H.btn("Windows", "rm-windows", {}, "sm"))}
      ${H.section("Send to the laptop", `<p class="small">Files go to <span class="mono">Studio5\\From phone</span> in your Documents.</p><div class="row" style="margin-top:8px">${H.btn("Choose files…", "rm-put", {}, "primary sm")}<span id="rm-put-p" class="small muted"></span></div>`)}</div>
      ${H.section(`Workspace <span class="mono small muted" id="rm-path"></span>`, `<div id="rm-files"><p class="small muted">Loading…</p></div>`)}<div id="rm-win"></div>`;
  } else if (tab === "jobs") {
    const jobs = S5.store.list("job").sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    body = `<p class="small muted" style="margin-bottom:10px">A job is a checked sequence: preflight (file exists, app available, battery, memory) → run → verify → result. “Collect” brings the newest file from <span class="mono">Studio5\\Exports</span> into your Library, linked to the project.</p>
      <div class="row" style="margin-bottom:10px">${H.btn("+ Job", "new", { type: "job", defaults: JSON.stringify({ state: "draft", kind: "open" }) }, "primary sm")}${H.btn("Collect newest PDF export", "rm-quickjob", { kind: "collect", ext: ".pdf" }, "sm")}${H.btn("Collect newest image", "rm-quickjob", { kind: "collect", ext: ".jpg" }, "sm")}</div>
      ${jobs.length ? `<div class="list">${jobs.map((j) => H.item({ lead: { done: "green", failed: "red", running: "cobalt", verifying: "cobalt", preflight: "amber" }[j.state] || "", t: S5.esc(j.title), s: `${S5.esc(j.kind || "open")} · ${S5.esc(j.app || "")} ${S5.esc(j.fileRef || "")}${j.projectId ? " · " + S5.esc(S5.store.get(j.projectId)?.name || "") : ""}${j.result ? " · " + S5.esc(j.result) : ""}`, right: H.pill(j.state || "draft") + H.btn("Run", "rm-job", { id: j.id }, "sm primary"), act: "edit", data: { type: "job", id: j.id } })).join("")}</div>` : H.empty("No jobs yet.", "Create one here or from a project's “Sketches & files” tab.")}`;
  } else if (tab === "system") {
    body = `<div class="grid cols-2">${H.section("Power & security", `<div class="chips">${H.btn("Lock screen", "rm-sys", { a: "sys.lock" })}${H.btn("Sleep", "rm-sys", { a: "sys.sleep", confirm: 1 })}${H.btn("Shut down (60 s)", "rm-sys", { a: "sys.shutdown", confirm: 1 }, "danger")}${H.btn("Cancel shutdown", "rm-sys", { a: "sys.shutdown", cancel: 1 })}</div>`)}
      ${H.section("Clipboard", `<textarea id="rm-clip" dir="auto" rows="3" style="width:100%;padding:8px;border:1px solid var(--rule-strong);border-radius:var(--r);background:var(--paper)"></textarea><div class="row" style="margin-top:8px">${H.btn("Get from laptop", "rm-clip-get")}${H.btn("Send to laptop", "rm-clip-set", {}, "primary")}</div>`)}
      ${H.section("This pairing", `<dl class="kv"><dt>Laptop</dt><dd>${S5.esc(p.name)}</dd><dt>Paired</dt><dd>${S5.fmtDateTime(p.pairedAt)}</dd><dt>Check number</dt><dd class="mono">${S5.esc(p.check)}</dd><dt>System</dt><dd>${S5.esc(R.info?.os || "—")}</dd><dt>Workspace</dt><dd class="mono small">${S5.esc(R.info?.workspace || "—")}</dd><dt>Encryption</dt><dd>End-to-end (ECDH P-256 + AES-256-GCM)</dd></dl>`, H.btn("Unpair", "rm-unpair", {}, "sm danger"))}
      ${H.section("Install on another laptop", `<p class="small">Download the installer on the laptop (Windows 10/11). It installs Node.js if needed, starts the Companion at login, and shows a pairing code.</p><div class="row" style="margin-top:8px">${H.btn("Download installer", "rm-installer", {}, "sm")}</div>`)}</div>`;
  } else if (tab === "log") {
    const l = S5.store.meta.remoteLog || [];
    body = l.length ? `<div class="list sheet">${l.map((x) => H.item({ lead: x.ok ? "green" : "red", t: S5.esc(x.action), s: `${S5.fmtDateTime(x.at)}${x.note ? " · " + S5.esc(x.note) : ""}` })).join("")}</div>` : H.empty("No commands yet.", "");
  }
  return `<div class="page-head"><div class="titles"><span class="eyebrow">Remote work · end-to-end encrypted</span><h1>Laptop</h1></div></div>
    <section class="sheet" id="rm-status" style="margin-bottom:12px">${S5.remoteStatusHTML()}</section>${H.tabs(tabs, tab, "open", { v: "remote" })}${body}`;
};
S5.remotePairView = () => `<div class="page-head"><div class="titles"><span class="eyebrow">Remote work</span><h1>Control your laptop</h1></div></div>
  <div class="grid cols-2">
    <section class="sheet"><h3>1 · On the laptop</h3><p class="small" style="margin:6px 0">Open this same site on the laptop (Chrome/Edge), go to <b>Laptop</b> and download the installer. Run it: it installs the Studio5 Companion and shows a 6-digit code.</p>${H.btn("Download installer for Windows", "rm-installer", {}, "primary")}<p class="tiny muted" style="margin-top:8px">The Companion only does what's listed in this app (mouse, keyboard, screen, apps, workspace files, lock/sleep/shutdown). No hidden access, every command is logged on the laptop, and you can stop it any time by closing its window.</p></section>
    <section class="sheet"><h3>2 · On the phone</h3><p class="small" style="margin:6px 0">Enter the code shown on the laptop:</p><div class="row"><input id="rm-code" inputmode="numeric" placeholder="123 456" style="font-size:1.5rem;letter-spacing:.2em;width:180px;padding:8px;border:1px solid var(--rule-strong);border-radius:var(--r);background:var(--paper)">${H.btn("Pair", "rm-pair", {}, "primary")}</div><p class="tiny muted" style="margin-top:8px">Then compare the check number on both screens and accept on the laptop.</p></section>
  </div>`;

/* touchpad gestures */
S5.bindTouchpad = (el) => {
  if (!el) return; const R = S5.remote; const pts = new Map(); let acc = { x: 0, y: 0 }, sc = 0, t0 = 0, moved = 0, maxP = 0, dragging = false, lastTap = 0, lp = null, flushT = null;
  const speed = () => +(document.getElementById("rm-speed")?.value || 2.5);
  const flush = () => { flushT = null; if (Math.abs(acc.x) >= 1 || Math.abs(acc.y) >= 1) { R.fire("mouse.move", { dx: acc.x, dy: acc.y }); acc = { x: 0, y: 0 }; } if (Math.abs(sc) >= 1) { R.fire("mouse.scroll", { dy: -Math.round(sc) * 3 }); sc = 0; } };
  const q = () => { if (!flushT) flushT = setTimeout(flush, 30); };
  el.addEventListener("pointerdown", (e) => { e.preventDefault(); el.setPointerCapture(e.pointerId); pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); maxP = Math.max(maxP, pts.size); if (pts.size === 1) { t0 = Date.now(); moved = 0; lp = setTimeout(() => { if (moved < 8) { dragging = true; R.fire("mouse.down"); el.style.outline = "2px solid var(--cobalt)"; } }, 550); } });
  el.addEventListener("pointermove", (e) => {
    const p = pts.get(e.pointerId); if (!p) return; const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY; moved += Math.abs(dx) + Math.abs(dy);
    if (pts.size >= 2) { sc += dy / 8; q(); return; }
    const v = Math.hypot(dx, dy); const k = speed() * (1 + Math.min(v, 40) / 14); acc.x += dx * k; acc.y += dy * k; q();
  });
  const end = (e) => {
    pts.delete(e.pointerId); clearTimeout(lp); if (pts.size) return;
    const dt = Date.now() - t0;
    if (dragging) { dragging = false; R.fire("mouse.up"); el.style.outline = ""; }
    else if (moved < 10 && dt < 250) { if (maxP >= 2) R.fire("mouse.click", { button: "right" }); else { const now = Date.now(); if (now - lastTap < 300) R.fire("mouse.click", { button: "left", double: true }); else setTimeout(() => { if (Date.now() - lastTap >= 290) R.fire("mouse.click", { button: "left" }); }, 300); lastTap = now; } }
    maxP = 0; flush();
  };
  el.addEventListener("pointerup", end); el.addEventListener("pointercancel", end);
  document.getElementById("rm-speed")?.addEventListener("input", (e) => S5.ls.set("rmSpeed", +e.target.value));
};
S5.rmShot = async () => {
  const img = document.getElementById("rm-screen"); if (!img) return;
  try { const d = await S5.remote.send("screen.shot", { width: Math.min(1600, Math.round(window.innerWidth * (window.devicePixelRatio || 1))), quality: S5.rmLive ? 45 : 65 }, { quiet: true, timeout: 20000 }); img.src = "data:image/jpeg;base64," + d.jpeg; img.dataset.sw = d.sw; img.dataset.sh = d.sh; const i = document.getElementById("rm-shot-info"); if (i) i.textContent = `${d.sw}×${d.sh} · ${new Date().toTimeString().slice(0, 8)}`; }
  catch (e) { S5.ui.toast(e.message, true); S5.rmLive = false; }
  if (!img.dataset.bound) { img.dataset.bound = 1; img.addEventListener("click", (e) => { if (!document.getElementById("rm-tapclick")?.checked) return; const r = img.getBoundingClientRect(); const x = ((e.clientX - r.left) / r.width) * +img.dataset.sw, y = ((e.clientY - r.top) / r.height) * +img.dataset.sh; S5.remote.send("mouse.to", { x, y }, { quiet: true }).then(() => S5.remote.send("mouse.click", { button: "left" }, { quiet: true })).then(() => setTimeout(S5.rmShot, 400)).catch((er) => S5.ui.toast(er.message, true)); }); }
  if (S5.rmLive && document.getElementById("rm-screen")) setTimeout(S5.rmShot, 1200);
};
S5.rmFiles = async (path) => {
  const box = document.getElementById("rm-files"); if (!box) return; S5.rmPath = path;
  const pe = document.getElementById("rm-path"); if (pe) pe.textContent = "\\" + path;
  try {
    const list = await S5.remote.send("file.list", { path }, { quiet: true });
    const up = path ? path.split(/[\\/]/).slice(0, -1).join("\\") : null;
    box.innerHTML = `<div class="list">${up !== null ? H.item({ t: "↑ Up", act: "rm-cd", data: { path: up } }) : ""}${list.map((f) => H.item({ lead: f.dir ? "cobalt" : /\.pdf$/i.test(f.name) ? "red" : "", t: (f.dir ? "📁 " : "") + S5.esc(f.name), s: f.dir ? "" : `${S5.fmtBytes(f.size)} · ${S5.fmtDateTime(new Date(f.mtime).toISOString())}`, right: f.dir ? "" : H.btn("Open on laptop", "rm-open", { path: (path ? path + "\\" : "") + f.name }, "sm") + H.btn("To Library", "rm-get", { path: (path ? path + "\\" : "") + f.name }, "sm"), act: f.dir ? "rm-cd" : "", data: f.dir ? { path: (path ? path + "\\" : "") + f.name } : {} })).join("") || H.empty("Empty folder.", "")}</div>`;
  } catch (e) { box.innerHTML = `<p class="small" style="color:var(--redline)">${S5.esc(e.message)}</p>`; }
};
S5.rmInstaller = () => {
  const origin = location.origin;
  const lines = [
    "@echo off", "setlocal", "title Studio5 Companion setup",
    `set "SERVER=${origin}"`, 'set "DIR=%LOCALAPPDATA%\\Studio5Companion"',
    "echo.", "echo  Studio5 Companion setup", "echo  Server: %SERVER%", "echo.",
    "where node >nul 2>nul",
    "if errorlevel 1 (",
    "  echo Installing Node.js LTS with winget...",
    "  winget install -e --id OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements",
    '  set "PATH=%PATH%;%ProgramFiles%\\nodejs"',
    ")",
    "where node >nul 2>nul",
    "if errorlevel 1 (",
    "  echo Node.js could not be installed automatically. Install it from https://nodejs.org then run this file again.",
    "  pause", "  exit /b 1", ")",
    'if not exist "%DIR%" mkdir "%DIR%"',
    'curl -fsSL "%SERVER%/companion/studio5-companion.mjs" -o "%DIR%\\studio5-companion.mjs"',
    "if errorlevel 1 (", "  echo Download failed. Check your internet connection.", "  pause", "  exit /b 1", ")",
    // package.json pinning the open-source input library, then a normal npm install (downloads prebuilt binaries)
    '> "%DIR%\\package.json" echo {"name":"studio5-companion","version":"1.0.0","type":"module","private":true,"dependencies":{"@nut-tree-fork/nut-js":"4.2.6","jimp":"0.22.10"}}',
    "echo Installing the input library (nut-js) and image tools...",
    'pushd "%DIR%"',
    "call npm install --no-audit --no-fund --loglevel=error",
    "set NPMERR=%errorlevel%",
    "popd",
    "if not %NPMERR%==0 (",
    "  echo.",
    "  echo The input library could not be installed. Mouse/keyboard/screen control will be off,",
    "  echo but files, apps and jobs still work. You can re-run this installer later to add it.",
    "  echo.",
    ")",
    '> "%DIR%\\Studio5 Companion.cmd" echo @echo off',
    '>> "%DIR%\\Studio5 Companion.cmd" echo title Studio5 Companion - phone control is ON while this window is open',
    '>> "%DIR%\\Studio5 Companion.cmd" echo cd /d "%DIR%"',
    '>> "%DIR%\\Studio5 Companion.cmd" echo node "%DIR%\\studio5-companion.mjs" --server %SERVER%',
    'copy /y "%DIR%\\Studio5 Companion.cmd" "%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\Startup\\Studio5 Companion.cmd" >nul',
    "echo.",
    "echo Installed. The Companion starts at login (a visible window - close it to stop phone control).",
    "echo Starting it now for pairing...",
    'start "Studio5 Companion" cmd /k "cd /d "%DIR%" && node "%DIR%\\studio5-companion.mjs" --server %SERVER% --pair"',
  ];
  return lines.join("\r\n") + "\r\n";
};
/* actions */
Object.assign(S5.act, {
  "rm-pair": async () => { const c = document.getElementById("rm-code").value; try { await S5.remote.claim(c); S5.ui.render(); } catch (e) { S5.ui.toast(e.message, true); } },
  "rm-unpair": () => S5.ui.confirm("Unpair this laptop on this phone? To fully revoke, also delete config.json in the Companion folder on the laptop.", "Unpair", async () => { await S5.remote.unpair(); S5.ui.render(); }),
  "rm-click": (el) => S5.remote.fire("mouse.click", { button: el.dataset.b, double: !!el.dataset.dbl }),
  "rm-keys": (el) => S5.remote.send("key.combo", { keys: el.dataset.keys.split(",") }, { quiet: true }).catch((e) => S5.ui.toast(e.message, true)),
  "rm-type": async (el) => { const i = document.getElementById("rm-text"); const t = i.value; if (!t) return; try { await S5.remote.send("key.type", { text: t }); if (el.dataset.enter) await S5.remote.send("key.combo", { keys: ["enter"] }, { quiet: true }); i.value = ""; } catch (e) { S5.ui.toast(e.message, true); } },
  "rm-shot": () => S5.rmShot(),
  "rm-live": () => { S5.rmLive = !S5.rmLive; S5.ui.render(); },
  "rm-app": async (el) => { try { const r = await S5.remote.send("app.open", { id: el.dataset.id }); S5.ui.toast("Opening " + r.opened); } catch (e) { S5.ui.toast(e.message, true); } },
  "rm-windows": async () => { try { const ws = await S5.remote.send("win.list", {}, { quiet: true }); document.getElementById("rm-win").innerHTML = H.section("Open windows", `<div class="list">${ws.map((w) => H.item({ t: S5.esc(w.title), s: S5.esc(w.app), act: "rm-focus", data: { pid: w.pid } })).join("")}</div>`); } catch (e) { S5.ui.toast(e.message, true); } },
  "rm-focus": (el) => S5.remote.send("win.focus", { pid: +el.dataset.pid }).catch((e) => S5.ui.toast(e.message, true)),
  "rm-cd": (el) => S5.rmFiles(el.dataset.path),
  "rm-open": async (el, e) => { e.stopPropagation(); try { await S5.remote.send("file.open", { path: el.dataset.path }); S5.ui.toast("Opened on the laptop"); } catch (er) { S5.ui.toast(er.message, true); } },
  "rm-get": async (el, e) => { e.stopPropagation(); el.disabled = true; try { const f = await S5.remote.fetchFile(el.dataset.path, (i, n) => (el.textContent = `${Math.round((i / n) * 100)}%`)); const rec = await S5.intakeFile(f, { library: true, source: "laptop" }); S5.ui.toast("Added to Library: " + rec.name); el.textContent = "✓"; } catch (er) { S5.ui.toast(er.message, true); el.disabled = false; el.textContent = "To Library"; } },
  "rm-put": async () => { const fs = await S5.ui.pickFile("", true); const p = document.getElementById("rm-put-p"); for (const f of fs) { try { const r = await S5.remote.putFile(f, (i, n) => p && (p.textContent = `${f.name}: ${Math.round((i / n) * 100)}%`)); p && (p.textContent = "✓ " + (r?.saved || f.name)); } catch (e) { S5.ui.toast(e.message, true); } } S5.rmFiles(S5.rmPath || ""); },
  "rm-sys": (el) => { const run = async () => { try { await S5.remote.send(el.dataset.a, { confirmed: true, cancel: !!el.dataset.cancel }); S5.ui.toast("Done"); } catch (e) { S5.ui.toast(e.message, true); } }; el.dataset.confirm ? S5.ui.confirm(`${el.textContent.trim()} on the laptop?`, el.textContent.trim(), run) : run(); },
  "rm-clip-get": async () => { try { const d = await S5.remote.send("clip.get"); document.getElementById("rm-clip").value = d.text || ""; } catch (e) { S5.ui.toast(e.message, true); } },
  "rm-clip-set": async () => { try { await S5.remote.send("clip.set", { text: document.getElementById("rm-clip").value }); S5.ui.toast("Sent to the laptop clipboard"); } catch (e) { S5.ui.toast(e.message, true); } },
  "rm-installer": () => S5.ui.saveFile("Studio5-Companion-Setup.cmd", new Blob([S5.rmInstaller()], { type: "text/plain" })),
  "rm-quickjob": async (el) => { const j = await S5.store.create("job", { title: `Collect newest ${el.dataset.ext} export`, kind: "collect", ext: el.dataset.ext, state: "draft", app: "export" }); S5.runJob(j.id); },
  "rm-job": (el, e) => { e.stopPropagation(); S5.runJob(el.dataset.id); },
});
S5.runJob = async (id) => {
  const j = S5.store.get(id); const upd = (patch) => S5.store.update(id, patch);
  const m = S5.ui.modal(`Job: ${j.title}`, `<div id="job-steps" class="list"></div>`, { footer: `<button class="btn" data-close>Close</button>` });
  const box = m.el.querySelector("#job-steps"); const add = (t, lead = "cobalt") => box.insertAdjacentHTML("beforeend", H.item({ lead, t }));
  try {
    await upd({ state: "queued" }); add("Sent to the laptop");
    const res = await S5.remote.send("job.run", { job: { id: j.id, kind: j.kind || "open", app: j.app, fileRef: j.fileRef, ext: j.ext } }, { timeout: 180000, onPartial: (d) => { if (d.checks) d.checks.forEach(([n, ok]) => add((ok ? "✓ " : "✗ ") + S5.esc(n), ok ? "green" : "red")); else add(S5.esc(d.state) + (d.reason ? " — " + S5.esc(d.reason) : ""), d.state === "failed" ? "red" : "cobalt"); upd({ state: d.state }); } });
    if (res.artifact) { add("Bringing the result to your Library…"); const f = await S5.remote.fetchFile(res.artifact); const rec = await S5.intakeFile(f, { projectId: j.projectId || "", library: !j.projectId, source: "laptop job" }); if (j.versionId) await S5.link(rec.id, "GENERATED_FROM", j.versionId); await upd({ state: "done", result: rec.name, resultFileId: rec.id }); add("✓ " + S5.esc(rec.name) + " saved", "green"); }
    else { await upd({ state: "done" }); add("✓ Done", "green"); }
  } catch (e) { await upd({ state: "failed", result: e.message }); add("✗ " + S5.esc(e.message), "red"); }
};
