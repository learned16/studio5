/* Studio5 Core — local-first record store, typed relations, migrations, sync, backup.
   Every record: {id, type, createdAt, updatedAt, rev, status?, source?, confidence?, deleted?, demo?, noAI?}
   Storage: IndexedDB (records, blobs, meta). Optional cloud mirror through the artifact `db`
   capability (private per-user subtree) and `assets` for file bytes. */
const S5 = (window.S5 = {});
S5.SCHEMA_VERSION = 3;
S5.APP_VERSION = "1.0.0";

/* ---------- small utilities ---------- */
S5.uid = (p = "r") => p + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
S5.now = () => new Date().toISOString();
S5.esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
S5.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
S5.num = (v, d = 0) => { const n = parseFloat(v); return Number.isFinite(n) ? n : d; };
S5.round = (v, p = 1) => { const m = 10 ** p; return Math.round(v * m) / m; };
S5.todayISO = () => S5.dateISO(new Date());
S5.dateISO = (d) => { const z = new Date(d); return `${z.getFullYear()}-${String(z.getMonth() + 1).padStart(2, "0")}-${String(z.getDate()).padStart(2, "0")}`; };
S5.addDays = (iso, n) => { const d = new Date(iso + "T12:00:00"); d.setDate(d.getDate() + n); return S5.dateISO(d); };
S5.daysBetween = (a, b) => Math.round((new Date(b + "T12:00:00") - new Date(a + "T12:00:00")) / 86400000);
S5.fmtDate = (iso) => { if (!iso) return ""; const d = new Date(iso.length <= 10 ? iso + "T12:00:00" : iso); return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: d.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined }); };
S5.fmtDateTime = (iso) => iso ? new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "";
S5.fmtMin = (m) => { m = Math.round(m || 0); if (m < 60) return m + "m"; const h = Math.floor(m / 60), r = m % 60; return h + "h" + (r ? " " + r + "m" : ""); };
S5.fmtBytes = (b) => b < 1024 ? b + " B" : b < 1048576 ? (b / 1024).toFixed(1) + " KB" : (b / 1048576).toFixed(1) + " MB";
S5.relDay = (iso) => { if (!iso) return ""; const n = S5.daysBetween(S5.todayISO(), iso.slice(0, 10)); if (n === 0) return "today"; if (n === 1) return "tomorrow"; if (n === -1) return "yesterday"; return n > 0 ? `in ${n} days` : `${-n} days ago`; };
S5.DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
S5.debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
S5.hasArabic = (s) => /[؀-ۿ]/.test(s || "");
S5.ls = { get(k, d) { try { const v = localStorage.getItem("s5:" + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem("s5:" + k, JSON.stringify(v)); } catch {} },
  del(k) { try { localStorage.removeItem("s5:" + k); } catch {} } };
S5.sha256 = async (data) => {
  const buf = typeof data === "string" ? new TextEncoder().encode(data) : data instanceof ArrayBuffer ? data : await data.arrayBuffer();
  try { const h = await crypto.subtle.digest("SHA-256", buf); return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, "0")).join(""); }
  catch { let h = 2166136261; const u = new Uint8Array(buf); for (let i = 0; i < u.length; i++) { h ^= u[i]; h = Math.imul(h, 16777619); } return "fnv-" + (h >>> 0).toString(16); }
};
S5.b64FromBuf = (buf) => { const u = new Uint8Array(buf); let s = ""; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); };
S5.bufFromB64 = (b64) => { const s = atob(b64); const u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u.buffer; };

/* ---------- event bus ---------- */
S5.bus = { m: new Map(), on(e, f) { (this.m.get(e) || this.m.set(e, new Set()).get(e)).add(f); return () => this.m.get(e).delete(f); }, emit(e, d) { (this.m.get(e) || []).forEach((f) => { try { f(d); } catch (err) { console.error(err); } }); } };

/* ---------- IndexedDB wrapper with memory fallback ---------- */
S5.idb = {
  db: null, mode: "memory", mem: { records: new Map(), blobs: new Map(), meta: new Map() },
  open() {
    return new Promise((resolve) => {
      let req;
      try { req = indexedDB.open("studio5", 1); } catch { return resolve(false); }
      req.onupgradeneeded = () => { const db = req.result; ["records", "blobs", "meta"].forEach((s) => { if (!db.objectStoreNames.contains(s)) db.createObjectStore(s); }); };
      req.onsuccess = () => { this.db = req.result; this.mode = "indexeddb"; resolve(true); };
      req.onerror = () => resolve(false);
      req.onblocked = () => resolve(false);
      setTimeout(() => resolve(false), 4000);
    });
  },
  tx(store, mode, fn) {
    if (!this.db) { return Promise.resolve(fn(null)); }
    return new Promise((resolve, reject) => {
      const t = this.db.transaction(store, mode); const os = t.objectStore(store); let out;
      try { out = fn(os); } catch (e) { reject(e); return; }
      t.oncomplete = () => resolve(out && out.result !== undefined && out instanceof IDBRequest ? out.result : out);
      t.onerror = () => reject(t.error); t.onabort = () => reject(t.error || new Error("aborted"));
    });
  },
  async get(store, key) { if (!this.db) return this.mem[store].get(key); return new Promise((res, rej) => { const r = this.db.transaction(store).objectStore(store).get(key); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); },
  async put(store, key, val) { if (!this.db) { this.mem[store].set(key, val); return; } return this.tx(store, "readwrite", (os) => { os.put(val, key); }); },
  async putMany(store, entries) { if (!this.db) { entries.forEach(([k, v]) => this.mem[store].set(k, v)); return; } return this.tx(store, "readwrite", (os) => { entries.forEach(([k, v]) => os.put(v, k)); }); },
  async del(store, key) { if (!this.db) { this.mem[store].delete(key); return; } return this.tx(store, "readwrite", (os) => { os.delete(key); }); },
  async clear(store) { if (!this.db) { this.mem[store].clear(); return; } return this.tx(store, "readwrite", (os) => { os.clear(); }); },
  async all(store) {
    if (!this.db) return [...this.mem[store].entries()];
    return new Promise((res, rej) => { const out = []; const r = this.db.transaction(store).objectStore(store).openCursor(); r.onsuccess = () => { const c = r.result; if (c) { out.push([c.key, c.value]); c.continue(); } else res(out); }; r.onerror = () => rej(r.error); });
  },
  async keys(store) { if (!this.db) return [...this.mem[store].keys()]; return new Promise((res, rej) => { const r = this.db.transaction(store).objectStore(store).getAllKeys(); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); },
};

/* ---------- migrations ---------- */
S5.migrations = {
  // v1 -> v2: lectures gain `status`; tasks gain `origin`.
  2(records) { for (const r of records) { if (r.type === "lecture" && !r.status) r.status = r.summary ? "closed" : "captured"; if (r.type === "task" && !r.origin) r.origin = "manual"; } },
  // v2 -> v3: gaps carry an explicit ladder stage (0..5) and attempts array.
  3(records) { for (const r of records) { if (r.type === "gap") { if (typeof r.stage !== "number") r.stage = 0; if (!Array.isArray(r.attempts)) r.attempts = []; } } },
};

/* ---------- the record store ---------- */
S5.store = {
  recs: new Map(),
  meta: {},
  ready: false,
  async init() {
    await S5.idb.open();
    const metaEntries = await S5.idb.all("meta");
    for (const [k, v] of metaEntries) this.meta[k] = v;
    const rows = await S5.idb.all("records");
    let records = rows.map(([, v]) => v);
    const from = this.meta.schemaVersion || (records.length ? 1 : S5.SCHEMA_VERSION);
    if (from < S5.SCHEMA_VERSION && records.length) {
      await this.snapshot(`Before migration v${from}→v${S5.SCHEMA_VERSION}`, records);
      for (let v = from + 1; v <= S5.SCHEMA_VERSION; v++) { if (S5.migrations[v]) S5.migrations[v](records); }
      await S5.idb.putMany("records", records.map((r) => [r.id, r]));
      S5.audit("migration", `Schema v${from} → v${S5.SCHEMA_VERSION} (${records.length} records)`);
    }
    await this.setMeta("schemaVersion", S5.SCHEMA_VERSION);
    for (const r of records) this.recs.set(r.id, r);
    // crash journal: an ink page or text draft that did not reach IndexedDB
    const journal = S5.ls.get("journal", null);
    if (journal && journal.rec) {
      const cur = this.recs.get(journal.rec.id);
      if (!cur || (cur.updatedAt || "") < journal.rec.updatedAt) { await this.put(journal.rec, { silent: true, keepTime: true }); S5.audit("recovery", `Recovered unsaved ${journal.rec.type} from crash journal`); this.recovered = true; }
      S5.ls.del("journal");
    }
    if (!this.meta.deviceId) await this.setMeta("deviceId", S5.uid("dev"));
    this.ready = true;
  },
  async setMeta(k, v) { this.meta[k] = v; await S5.idb.put("meta", k, v); },
  get(id) { const r = this.recs.get(id); return r && !r.deleted ? r : null; },
  raw(id) { return this.recs.get(id) || null; },
  list(type, pred) { const out = []; for (const r of this.recs.values()) if (r.type === type && !r.deleted && (!pred || pred(r))) out.push(r); return out; },
  where(type, field, value) { return this.list(type, (r) => r[field] === value); },
  count(type, pred) { return this.list(type, pred).length; },
  trash() { return [...this.recs.values()].filter((r) => r.deleted); },
  async create(type, fields = {}) {
    const t = S5.now();
    const rec = { id: S5.uid(type.slice(0, 3)), type, createdAt: t, updatedAt: t, rev: 0, ...fields };
    await this.put(rec);
    return rec;
  },
  async update(id, patch) {
    const cur = this.recs.get(id); if (!cur) return null;
    const rec = { ...cur, ...patch };
    await this.put(rec);
    return rec;
  },
  async put(rec, opts = {}) {
    if (!opts.keepTime) { rec.updatedAt = S5.now(); rec.rev = (rec.rev || 0) + 1; rec.dev = this.meta.deviceId; }
    this.recs.set(rec.id, rec);
    try { await S5.idb.put("records", rec.id, rec); }
    catch (e) { S5.health.lastWriteError = String(e); S5.ui?.toast("Could not save to device storage. Export a backup now.", true); throw e; }
    if (!opts.fromSync) S5.sync.queue(rec);
    if (!opts.silent) S5.bus.emit("change", rec);
    return rec;
  },
  // soft delete: nothing is purged automatically; Trash keeps it until the user empties it.
  async remove(id) { const r = this.recs.get(id); if (!r) return; await this.put({ ...r, deleted: true, deletedAt: S5.now() }); S5.audit("delete", `${r.type} “${S5.title(r)}” moved to Trash`); },
  async restore(id) { const r = this.recs.get(id); if (!r) return; const c = { ...r }; delete c.deleted; delete c.deletedAt; await this.put(c); },
  async purge(id) { const r = this.recs.get(id); if (!r) return; this.recs.delete(id); await S5.idb.del("records", id); if (r.blobKey) await S5.idb.del("blobs", r.blobKey); S5.sync.removeRemote(id); S5.audit("purge", `${r.type} “${S5.title(r)}” permanently deleted`); },
  // recovery snapshots (records only) kept inside the device, last 6
  async snapshot(reason, records) {
    const list = (await S5.idb.get("meta", "snapshots")) || [];
    const data = records || [...this.recs.values()];
    const key = "snap_" + Date.now();
    await S5.idb.put("meta", key, data);
    list.unshift({ key, reason, at: S5.now(), count: data.length });
    while (list.length > 6) { const old = list.pop(); await S5.idb.del("meta", old.key); }
    await this.setMeta("snapshots", list);
    return key;
  },
  async restoreSnapshot(key) {
    const data = await S5.idb.get("meta", key); if (!data) throw new Error("Snapshot not found");
    await this.snapshot("Before restoring an older snapshot");
    await S5.idb.clear("records");
    this.recs.clear();
    await S5.idb.putMany("records", data.map((r) => [r.id, r]));
    data.forEach((r) => this.recs.set(r.id, r));
    S5.audit("restore", `Snapshot restored (${data.length} records)`);
    S5.bus.emit("change", null);
  },
};

/* ---------- blobs (immutable originals) ---------- */
S5.blobs = {
  async put(file) {
    const buf = await file.arrayBuffer();
    const hash = await S5.sha256(buf);
    const key = "b_" + hash.slice(0, 40);
    const existing = await S5.idb.get("blobs", key);
    if (!existing) await S5.idb.put("blobs", key, { mime: file.type || "application/octet-stream", data: buf, size: buf.byteLength, at: S5.now() });
    return { key, hash, size: buf.byteLength, mime: file.type || "application/octet-stream", dup: !!existing };
  },
  async get(key, assetId) {
    let b = await S5.idb.get("blobs", key);
    if (!b && assetId) {
      try { const r = await fetch("/_blob/" + assetId); if (r.ok) { const buf = await r.arrayBuffer(); b = { mime: r.headers.get("content-type") || "", data: buf, size: buf.byteLength, at: S5.now() }; await S5.idb.put("blobs", key, b); } } catch {}
    }
    return b || null;
  },
  async url(key, assetId) { const b = await this.get(key, assetId); return b ? URL.createObjectURL(new Blob([b.data], { type: b.mime })) : null; },
};

/* ---------- intake of a user file → FileRecord ---------- */
S5.intakeFile = async (file, fields = {}) => {
  const info = await S5.blobs.put(file);
  const dup = S5.store.list("file", (r) => r.hash === info.hash)[0];
  if (dup) { S5.ui?.toast(`Already in your library: ${dup.name}`); return dup; }
  const kind = info.mime === "application/pdf" ? "pdf" : info.mime.startsWith("image/") ? "image" : info.mime.startsWith("video/") ? "video" : "other";
  const rec = await S5.store.create("file", { name: file.name, mime: info.mime, size: info.size, hash: info.hash, blobKey: info.key, kind, immutable: true, ...fields });
  S5.sync.uploadBlob(rec);
  return rec;
};

/* ---------- typed relations ---------- */
S5.REL = ["CONTAINS", "APPLIES_TO", "IMPLEMENTS", "PROVES", "GENERATED_FROM", "SEEKS_CLARIFICATION_FROM", "DERIVED_FROM", "SATISFIES", "REFERENCES", "PRACTICES", "SUPERSEDES", "CONFLICTS_WITH"];
S5.link = async (from, rel, to, note) => {
  if (!from || !to || from === to) return null;
  const dup = S5.store.list("link", (l) => l.from === from && l.to === to && l.rel === rel)[0];
  if (dup) return dup;
  return S5.store.create("link", { from, rel, to, note: note || "" });
};
S5.linksOf = (id) => S5.store.list("link", (l) => l.from === id || l.to === id);

/* ---------- audit log (sensitive actions), capped, device-local ---------- */
S5.audit = (kind, text) => {
  const log = S5.store.meta.audit || [];
  log.unshift({ at: S5.now(), kind, text });
  if (log.length > 400) log.length = 400;
  S5.store.meta.audit = log;
  S5.idb.put("meta", "audit", log).catch(() => {});
};

/* ---------- settings ---------- */
S5.settings = {
  defaults: { programs: ["arch"], activeYear: 1, activeSemester: 1, theme: "system", penOnly: true, aiEnabled: true, aiDailyCap: 60, safeMode: false, dailySessionCap: 4, energyMin: 300, studentName: "", university: "Northern Technical University", city: "Kirkuk", lat: 35.47, flags: {}, backupEveryDays: 7, weekStart: 6 },
  get(k) { const s = S5.store.meta.settings || {}; return k in s ? s[k] : this.defaults[k]; },
  async set(k, v) { const s = { ...(S5.store.meta.settings || {}) }; s[k] = v; await S5.store.setMeta("settings", s); S5.sync.pushSettings(); S5.bus.emit("settings", { k, v }); },
  all() { return { ...this.defaults, ...(S5.store.meta.settings || {}) }; },
};

/* ---------- cloud mirror (artifact db + assets) ---------- */
S5.sync = {
  db: null, col: null, assets: null, uid: null, state: "local", pending: new Map(), lastSync: null, errors: 0, localOnly: new Set(), unsub: null, flushing: false,
  async init() {
    if (!window.claude || typeof window.claude.use !== "function") { this.state = "local"; return; }
    try {
      const [db, user] = await Promise.all([window.claude.use("db"), window.claude.use("user")]);
      if (!db || !user) { this.state = "local"; S5.bus.emit("sync", this.state); return; }
      const uid = await user.id();
      if (!uid) { this.state = "local"; S5.bus.emit("sync", this.state); return; }
      this.db = db; this.uid = uid; this.col = db.collection("data/users/" + uid);
      this.state = "connecting"; S5.bus.emit("sync", this.state);
      // queue everything the cloud has not acknowledged yet
      const acked = S5.store.meta.syncAck || {};
      for (const r of S5.store.recs.values()) if ((acked[r.id] || "") < r.updatedAt) this.pending.set(r.id, r);
      this.unsub = this.col.onSnapshot((snap) => this.onRemote(snap), (e) => { this.state = e.code === "revoked" ? "local" : "error"; this.errors++; S5.bus.emit("sync", this.state); });
      this.flush();
    } catch (e) { console.warn("sync init", e); this.state = "local"; S5.bus.emit("sync", this.state); }
    try { this.assets = await window.claude.use("assets"); } catch { this.assets = null; }
  },
  async onRemote(snap) {
    let applied = 0;
    const acked = { ...(S5.store.meta.syncAck || {}) };
    for (const ch of snap.docChanges()) {
      if (ch.type === "removed") continue;
      const d = ch.doc.data(); if (!d) continue;
      if (ch.doc.id === "settings") { if (d.settings && (d.at || "") > (S5.store.meta.settingsAt || "")) { await S5.store.setMeta("settings", d.settings); await S5.store.setMeta("settingsAt", d.at); S5.bus.emit("settings", {}); } continue; }
      if (!d.rec) continue;
      const remote = typeof d.rec === "string" ? JSON.parse(d.rec) : d.rec;
      const local = S5.store.recs.get(remote.id);
      if (!local || remote.updatedAt > local.updatedAt) {
        if (local && this.pending.has(local.id) && local.dev !== remote.dev && local.rev > 0 && !local.deleted && !remote.deleted && local.type !== "inkpage") {
          // both sides changed: keep both, never silently drop one
          const copy = { ...local, id: S5.uid(local.type.slice(0, 3)), conflictOf: local.id, title: (local.title || local.name || "") + " (conflict copy)", name: local.name ? local.name + " (conflict copy)" : local.name };
          await S5.store.put(copy, { silent: true });
          S5.audit("conflict", `Conflict on ${local.type} “${S5.title(local)}” — kept both versions`);
          this.pending.delete(local.id);
        }
        await S5.store.put(remote, { fromSync: true, keepTime: true, silent: true });
        acked[remote.id] = remote.updatedAt; applied++;
      } else if (remote.updatedAt === local.updatedAt) { acked[remote.id] = remote.updatedAt; this.pending.delete(remote.id); }
    }
    await S5.store.setMeta("syncAck", acked);
    this.state = "synced"; this.lastSync = S5.now(); S5.bus.emit("sync", this.state);
    if (applied) S5.bus.emit("change", null);
  },
  queue(rec) { if (!this.col) { return; } this.pending.set(rec.id, rec); this.flushSoon(); },
  flushSoon: null,
  async flush() {
    if (!this.col || this.flushing) return;
    this.flushing = true;
    const acked = { ...(S5.store.meta.syncAck || {}) };
    try {
      for (const [id, rec] of [...this.pending]) {
        const json = JSON.stringify(rec);
        if (json.length > 240000) { this.localOnly.add(id); this.pending.delete(id); continue; }
        try {
          await this.col.doc(id).set({ rec: json, u: rec.updatedAt, t: rec.type });
          acked[id] = rec.updatedAt; this.pending.delete(id); this.localOnly.delete(id);
        } catch (e) {
          if (e && (e.code === "unavailable" || e.code === "resource_exhausted")) { this.errors++; break; }
          if (e && e.code === "quota_exceeded") { this.state = "full"; this.pending.delete(id); this.localOnly.add(id); continue; }
          this.pending.delete(id); this.localOnly.add(id);
        }
      }
      await S5.store.setMeta("syncAck", acked);
      if (this.state !== "full") this.state = this.pending.size ? "pending" : "synced";
      this.lastSync = S5.now();
    } finally { this.flushing = false; S5.bus.emit("sync", this.state); }
    if (this.pending.size) setTimeout(() => this.flush(), 5000);
  },
  async removeRemote(id) { if (!this.col) return; try { await this.col.doc(id).delete(); } catch {} },
  async pushSettings() { if (!this.col) return; const at = S5.now(); await S5.store.setMeta("settingsAt", at); try { await this.col.doc("settings").set({ settings: S5.store.meta.settings || {}, at }); } catch {} },
  async uploadBlob(rec) {
    if (!this.assets || rec.assetId || !rec.blobKey) return;
    const b = await S5.idb.get("blobs", rec.blobKey); if (!b || b.size > 19 * 1048576) return;
    try { const res = await this.assets.upload(new Blob([b.data], { type: b.mime }), { contentType: b.mime }); await S5.store.update(rec.id, { assetId: res.id }); }
    catch (e) { console.warn("asset upload", e && e.code); }
  },
};
S5.sync.flushSoon = S5.debounce(() => S5.sync.flush(), 1200);

/* ---------- health ---------- */
S5.health = {
  lastWriteError: null, storage: null,
  async refresh() { try { if (navigator.storage?.estimate) this.storage = await navigator.storage.estimate(); } catch {} },
  report() {
    const s = S5.store; const items = [];
    items.push({ k: "Local database", v: S5.idb.mode === "indexeddb" ? `Healthy · ${s.recs.size} records · schema v${s.meta.schemaVersion}` : "Memory only — data is lost when you close this page. Export a backup.", level: S5.idb.mode === "indexeddb" ? "ok" : "bad" });
    if (this.lastWriteError) items.push({ k: "Last write", v: "Failed: " + this.lastWriteError, level: "bad" });
    const sy = S5.sync;
    const syncText = { local: S5.standalone ? "This computer only — move data between devices with Backup → Restore" : "Device only (sign in to mirror to the cloud)", connecting: "Connecting…", synced: `Synced${sy.lastSync ? " · " + S5.fmtDateTime(sy.lastSync) : ""}`, pending: `${sy.pending.size} change(s) waiting`, error: "Sync interrupted — changes stay on this device", full: "Cloud storage full — new records stay local" }[sy.state] || sy.state;
    items.push({ k: "Sync", v: syncText + (sy.localOnly.size ? ` · ${sy.localOnly.size} large record(s) device-only` : ""), level: sy.state === "error" || sy.state === "full" ? "warn" : "ok" });
    const lb = s.meta.lastBackupAt; const every = S5.settings.get("backupEveryDays");
    const age = lb ? S5.daysBetween(lb.slice(0, 10), S5.todayISO()) : null;
    items.push({ k: "Backup", v: lb ? `Last full backup ${S5.relDay(lb.slice(0, 10))}${s.meta.lastRestoreTestAt ? " · restore test " + S5.relDay(s.meta.lastRestoreTestAt.slice(0, 10)) : " · no restore test yet"}` : "No full backup yet", level: lb == null || age > every ? "warn" : "ok" });
    if (this.storage) { const pct = this.storage.quota ? this.storage.usage / this.storage.quota : 0; items.push({ k: "Storage", v: `${S5.fmtBytes(this.storage.usage || 0)} used of ${S5.fmtBytes(this.storage.quota || 0)}`, level: pct > 0.85 ? "bad" : pct > 0.6 ? "warn" : "ok" }); }
    items.push({ k: "AI", v: !S5.settings.get("aiEnabled") ? "Turned off by you" : S5.ai.state === "ready" ? `Available · ${S5.ai.usedToday()} of ${S5.settings.get("aiDailyCap")} requests today` : S5.ai.state === "none" ? (S5.standalone ? "Not available in the installed app — open the claude.ai version for AI" : "Not available in this view — everything else works") : "Checking…", level: "ok" });
    items.push({ k: "Windows companion", v: "Not connected — remote jobs are queued as plans until a companion exists", level: "ok" });
    return items;
  },
  level() { const r = this.report(); return r.some((i) => i.level === "bad") ? "bad" : r.some((i) => i.level === "warn") ? "warn" : "ok"; },
};

/* ---------- full backup / verify / restore ---------- */
S5.backup = {
  async build({ includeFiles = true } = {}) {
    const records = [...S5.store.recs.values()];
    const blobs = {};
    if (includeFiles) {
      for (const [k, v] of await S5.idb.all("blobs")) blobs[k] = { mime: v.mime, size: v.size, b64: S5.b64FromBuf(v.data) };
    }
    // progress: learning history kept in device meta (tutor lessons, studio drawing lessons), so it moves with the backup
    const body = { records, settings: S5.store.meta.settings || {}, blobs, progress: { tutorProg: S5.store.meta.tutorProg || {}, studioProg: S5.store.meta.studioProg || {} } };
    const json = JSON.stringify(body);
    const checksum = await S5.sha256(json);
    return { format: "studio5-backup", appVersion: S5.APP_VERSION, schemaVersion: S5.SCHEMA_VERSION, exportedAt: S5.now(), device: S5.store.meta.deviceId, counts: { records: records.length, files: Object.keys(blobs).length }, checksum, body: json };
  },
  async verify(pkg) {
    const problems = [];
    if (!pkg || pkg.format !== "studio5-backup") return { ok: false, problems: ["This is not a Studio5 backup file."] };
    if (pkg.schemaVersion > S5.SCHEMA_VERSION) problems.push(`Backup is from a newer schema (v${pkg.schemaVersion}). Update Studio5 first.`);
    const sum = await S5.sha256(pkg.body || "");
    if (sum !== pkg.checksum) return { ok: false, problems: ["Checksum mismatch — the file is damaged or was edited. Nothing was restored."] };
    let body; try { body = JSON.parse(pkg.body); } catch { return { ok: false, problems: ["Backup body is unreadable."] }; }
    const ids = new Set(body.records.map((r) => r.id));
    let broken = 0;
    for (const r of body.records) { if (!r.id || !r.type) problems.push("A record without id/type"); if (r.blobKey && !body.blobs[r.blobKey] && !r.assetId) broken++; }
    const danglingLinks = body.records.filter((r) => r.type === "link" && (!ids.has(r.from) || !ids.has(r.to))).length;
    if (broken) problems.push(`${broken} file record(s) without their bytes (exported without files).`);
    if (danglingLinks) problems.push(`${danglingLinks} relation(s) point to missing records.`);
    return { ok: !problems.some((p) => p.startsWith("Backup is from")), problems, body, counts: { records: body.records.length, files: Object.keys(body.blobs).length } };
  },
  async restore(body, mode) {
    await S5.store.snapshot(`Before ${mode} restore`);
    if (mode === "replace") { await S5.idb.clear("records"); S5.store.recs.clear(); }
    let added = 0, updated = 0, kept = 0;
    let recs = body.records.map((r) => ({ ...r }));
    // migrate older backups forward
    const v = body.schemaVersion || 1;
    for (let i = v + 1; i <= S5.SCHEMA_VERSION; i++) if (S5.migrations[i]) S5.migrations[i](recs);
    const toWrite = [];
    for (const r of recs) {
      const cur = S5.store.recs.get(r.id);
      if (!cur) { added++; toWrite.push(r); } else if (r.updatedAt > cur.updatedAt) { updated++; toWrite.push(r); } else kept++;
    }
    await S5.idb.putMany("records", toWrite.map((r) => [r.id, r]));
    toWrite.forEach((r) => { S5.store.recs.set(r.id, r); S5.sync.queue(r); });
    for (const [k, b] of Object.entries(body.blobs || {})) { if (!(await S5.idb.get("blobs", k))) await S5.idb.put("blobs", k, { mime: b.mime, size: b.size, data: S5.bufFromB64(b.b64), at: S5.now() }); }
    if (mode === "replace" && body.settings) await S5.store.setMeta("settings", body.settings);
    // learning progress (backups made before it was included have no `progress` and skip this)
    const progress = body.progress && typeof body.progress === "object" ? await this.restoreProgress(body.progress) : 0;
    S5.audit("restore", `${mode} restore: +${added} new, ${updated} updated, ${kept} kept${progress ? `, ${progress} progress entries` : ""}`);
    S5.bus.emit("change", null);
    return { added, updated, kept, progress };
  },
  /* Progress is merged in both restore modes: per lesson id the entry with the newer `at` wins, so no device loses
     newer learning. Studio passes are sticky (passed stays true, best is the higher score), as studio.js keeps them,
     and recurring-mistake counters (_errs) keep the larger count per habit. The values before the merge are kept in
     meta.progressBeforeRestore for recovery. Pure: returns {merged, changed}. */
  mergeProgress(cur, inc, kind) {
    const out = { ...(cur || {}) }; let changed = 0;
    for (const [id, p] of Object.entries(inc || {})) {
      if (!p || typeof p !== "object" || Array.isArray(p)) continue;
      if (id === "_errs") { const e = { ...(out._errs || {}) }; for (const [h, n] of Object.entries(p)) if (Number.isFinite(+n) && +n > (+e[h] || 0)) { e[h] = +n; changed++; } out._errs = e; continue; }
      const c = out[id] && typeof out[id] === "object" ? out[id] : null;
      const newer = !c || String(p.at || "") > String(c.at || "");
      let w = newer ? { ...p } : c;
      if (kind === "studioProg" && c) { const o = newer ? c : p; if (o.passed && !w.passed) w = { ...w, passed: true }; if (typeof o.best === "number" && !(w.best >= o.best)) w = { ...w, best: o.best }; }
      if (w !== c) { out[id] = w; changed++; }
    }
    return { merged: out, changed };
  },
  async restoreProgress(progress) {
    let n = 0; const before = { at: S5.now() }, writes = [];
    for (const k of ["tutorProg", "studioProg"]) {
      const inc = progress[k]; if (!inc || typeof inc !== "object" || Array.isArray(inc)) continue;
      const { merged, changed } = this.mergeProgress(S5.store.meta[k], inc, k);
      if (changed) { before[k] = S5.store.meta[k] || {}; writes.push([k, merged]); n += changed; }
    }
    if (!n) return 0;
    await S5.store.setMeta("progressBeforeRestore", before); // recovery copy first, then the merged progress
    for (const [k, v] of writes) await S5.store.setMeta(k, v);
    return n;
  },
  // restore test: rebuilds the package, re-verifies it, and replays it into a throwaway map
  async restoreTest() {
    const pkg = await this.build({ includeFiles: true });
    const v = await this.verify(pkg);
    if (!v.ok) return { ok: false, detail: v.problems.join(" ") };
    const sim = new Map(); v.body.records.forEach((r) => sim.set(r.id, r));
    const ok = sim.size === S5.store.recs.size && [...S5.store.recs.keys()].every((k) => sim.has(k));
    if (ok) await S5.store.setMeta("lastRestoreTestAt", S5.now());
    return { ok, detail: ok ? `${sim.size} records and ${v.counts.files} files verified` : "Record count differs after replay" };
  },
};

/* ---------- display title for any record ---------- */
S5.title = (r) => {
  if (!r) return "";
  return r.title || r.name || r.text?.slice(0, 80) || r.question?.slice(0, 80) || r.verbatim?.slice(0, 80) || r.kind || r.type;
};
