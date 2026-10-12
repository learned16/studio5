/* System — health, backup/restore, settings, years & feature flags, privacy & AI log, change ledger, trash.
   Also the global Search, Inbox and Notifications screens. */
S5.views.system = (r) => {
  const tab = r.tab || "health";
  const tabs = [["health", "Health"], ["backup", "Backup & restore"], ["settings", "Settings"], ["years", "Years & tools"], ["privacy", "Privacy & AI"], ["ledger", "Change ledger"], ["trash", "Trash", S5.store.trash().length]];
  let body = "";
  if (tab === "health") {
    S5.health.refresh().then(() => { const el = document.getElementById("health-list"); if (el) el.innerHTML = S5.healthHTML(); });
    const counts = {}; for (const x of S5.store.recs.values()) if (!x.deleted) counts[x.type] = (counts[x.type] || 0) + 1;
    body = `<div class="split"><div class="stack">${H.section("System health", `<div class="list" id="health-list">${S5.healthHTML()}</div>`)}
      ${S5.standalone ? H.section("Install on this computer", window.matchMedia("(display-mode: standalone)").matches ? `<p class="small">✓ Running as an installed app. It opens from your Start menu / dock and works offline.</p>` : S5.installPrompt ? `<p class="small">Install Studio5 as a desktop app: its own window and icon, works offline.</p><div class="row" style="margin-top:8px">${H.btn("Install Studio5", "install", {}, "primary")}</div>` : `<p class="small">In Chrome or Edge, use the install icon in the address bar (or menu → “Install Studio5”) to add it as a desktop app that works offline.</p>`) : ""}
      ${S5.standalone ? H.section("Laptop control", `<p class="small">${S5.store.meta.remote ? `Paired with <b>${S5.esc(S5.store.meta.remote.name)}</b>.` : "Control your laptop from this phone: touchpad, keyboard, live screen, apps, files and jobs."}</p><div class="row" style="margin-top:8px">${H.btn(S5.store.meta.remote ? "Open Laptop" : "Set up", "go", { v: "remote" }, "primary sm")}</div>`) : ""}
      ${H.section("Academic Safe Mode", `<p class="small">Near exams and submissions: hides experimental tools and non-critical alerts, increases backup reminders, blocks big changes. Critical fixes only.</p><div class="row" style="margin-top:8px">${S5.settings.get("safeMode") ? H.btn("Turn off Safe Mode", "safe-off", {}, "") : H.btn("Turn on Safe Mode", "safe-on", {}, "primary")}</div>`)}</div>
      <div class="stack">${H.section("What's stored", `<div class="tbl-wrap"><table class="tbl"><tbody>${Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([k, n]) => `<tr><td>${S5.esc(S5.typeLabel(k))}</td><td class="num mono">${n}</td></tr>`).join("")}</tbody></table></div>`)}
      ${H.section("Recent activity log", `<div class="list" style="max-height:300px;overflow:auto">${(S5.store.meta.audit || []).slice(0, 40).map((a) => H.item({ t: S5.esc(a.text), s: `${S5.esc(a.kind)} · ${S5.fmtDateTime(a.at)}` })).join("") || H.empty("Nothing yet.", "")}</div>`)}</div></div>`;
  } else if (tab === "backup") {
    const snaps = S5.store.meta.snapshots || [];
    body = `<div class="grid cols-2">${H.section("Full backup", `<p class="small">One file with every record, setting and original file (PDFs, images), plus a SHA-256 checksum. Keep copies off this device.</p><dl class="kv" style="margin-top:8px"><dt>Last backup</dt><dd>${S5.store.meta.lastBackupAt ? S5.fmtDateTime(S5.store.meta.lastBackupAt) : "never"}</dd><dt>Last restore test</dt><dd>${S5.store.meta.lastRestoreTestAt ? S5.fmtDateTime(S5.store.meta.lastRestoreTestAt) : "never — a backup without a restore test is not proven"}</dd></dl><div class="row" style="margin-top:10px">${H.btn("Export full backup", "backup-export", {}, "primary")}${H.btn("Without files (small)", "backup-export", { nofiles: 1 })}${H.btn("Run restore test", "restore-test")}</div><div id="bk-out"></div>`)}
      ${H.section("Restore", `<p class="small">Choose a Studio5 backup file. It is verified first (checksum, schema, relations). A snapshot of your current data is taken before anything changes.</p><div class="row" style="margin-top:10px">${H.btn("Choose backup file…", "restore-pick", {}, "")}</div><div id="rs-out"></div>`)}
      ${H.section("On-device snapshots", snaps.length ? `<div class="list">${snaps.map((s) => H.item({ t: S5.esc(s.reason), s: `${S5.fmtDateTime(s.at)} · ${s.count} records`, right: H.btn("Restore", "snap-restore", { key: s.key }, "sm") })).join("")}</div>` : H.empty("No snapshots yet.", "Taken automatically before migrations, restores, year switches and submission freezes."), H.btn("Take snapshot", "snap-take", {}, "sm"))}
      ${H.section("Export for other tools", `<p class="small">Readable exports. They are not backups.</p><div class="row" style="margin-top:8px">${H.btn("Tasks (CSV)", "export-csv", { type: "task" }, "sm")}${H.btn("Grades (CSV)", "export-csv", { type: "assessment" }, "sm")}${H.btn("Sources (citations)", "export-cites", {}, "sm")}${H.btn("Experience memory (Markdown)", "export-memory", {}, "sm")}</div>`)}</div>`;
  } else if (tab === "settings") {
    const s = S5.settings.all();
    const f = (k, label, type = "number", extra = "") => `<label class="field"><span>${label}</span><input data-setting="${k}" type="${type}" value="${S5.esc(s[k])}" ${extra}></label>`;
    body = `<div class="grid cols-2">${H.section("You", `<div class="form-grid">${f("studentName", "Name", "text", 'dir="auto"')}${f("university", "University", "text")}${f("city", "City", "text")}${f("lat", "Latitude (sun tools)")}</div>`)}
      ${H.section("Daily planning", `<div class="form-grid">${f("energyMin", "Realistic study capacity per day (min)")}${f("dailySessionCap", "Max study sessions per day")}<label class="field"><span>Week starts on</span><select data-setting="weekStart">${S5.DAYS.map((d, i) => `<option value="${i}" ${+s.weekStart === i ? "selected" : ""}>${d}</option>`).join("")}</select></label>${f("backupEveryDays", "Remind me to back up every (days)")}</div>`)}
      ${H.section("Pen & display", `<label class="check"><input type="checkbox" data-setting="penOnly" ${s.penOnly ? "checked" : ""}> Pen-only drawing (fingers pan and zoom; palms never draw)</label><label class="field" style="margin-top:10px"><span>Theme</span><select data-setting="theme">${[["system", "Follow device"], ["light", "Light"], ["dark", "Dark"]].map(([k, n]) => `<option value="${k}" ${s.theme === k ? "selected" : ""}>${n}</option>`).join("")}</select></label>`)}
      ${H.section("AI", `<label class="check"><input type="checkbox" data-setting="aiEnabled" ${s.aiEnabled ? "checked" : ""}> Allow AI features</label><div class="form-grid" style="margin-top:10px">${f("aiDailyCap", "Max AI requests per day")}</div><p class="small muted" style="margin-top:6px">Status: ${S5.ai.state === "ready" ? "available" : "not available in this view"}. Studio5 never needs AI to work.</p>`)}</div>`;
  } else if (tab === "years") {
    const flags = S5.settings.get("flags") || {};
    body = `<p class="small muted" style="margin-bottom:10px">All five years are implemented. Implemented does not mean enabled: your current year is on, later years stay off until you need them. Disabled never means missing, and nothing is deleted when you switch.</p>
      <div class="year-strip" style="margin-bottom:14px">${S5.YEARS.map((y) => `<button class="year-cell ${y.n === S5.settings.get("activeYear") ? "active" : ""} ${S5.yearActive(y.n) ? "" : "off"}" data-act="year-info" data-v="${y.n}"><span class="eyebrow">Year ${y.n}</span><b class="small">${S5.esc(y.name)}</b><span class="tiny muted">${S5.CURRICULUM.filter((c) => c[0] === y.n).length} subjects · ${S5.CURRICULUM.filter((c) => c[0] === y.n).reduce((a, c) => a + c[4], 0)} ECTS</span></button>`).join("")}</div>
      ${H.section("Tools & feature flags", `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Tool</th><th>Year</th><th>State</th><th>Override</th></tr></thead><tbody>${Object.entries(S5.TOOLS).map(([k, t]) => `<tr><td>${S5.esc(t.name)}</td><td class="mono">${t.y}</td><td>${S5.toolOn(k) ? H.pill("on", "green") : H.pill("off")}</td><td><select data-flag="tool_${k}"><option value="" ${flags["tool_" + k] == null ? "selected" : ""}>By year</option><option value="on" ${flags["tool_" + k] === true ? "selected" : ""}>Always on</option><option value="off" ${flags["tool_" + k] === false ? "selected" : ""}>Off</option></select></td></tr>`).join("")}</tbody></table></div>`)}`;
  } else if (tab === "privacy") {
    const log = S5.ai.log(); const noAI = [...S5.store.recs.values()].filter((x) => x.noAI && !x.deleted);
    body = `<div class="grid cols-2">${H.section("Where your data lives", `<dl class="kv"><dt>This device</dt><dd>Everything, in the browser's private database for this page (${S5.idb.mode}).</dd><dt>Cloud mirror</dt><dd>${S5.sync.state === "local" ? "Off — sign in to claude.ai to mirror to your private store" : "Your private per-user store on claude.ai. Records only you can read; other viewers of this page cannot see them."}</dd><dt>Files</dt><dd>${S5.sync.assets ? "Originals are also uploaded to this page's private asset store so your other devices can open them." : "Only on this device (and in backups)."}</dd><dt>AI</dt><dd>Only the text shown in the log below is sent, only when you press an AI button. Project files are never sent automatically.</dd></dl>`)}
      ${H.section("Records excluded from AI", noAI.length ? `<div class="list">${noAI.map((x) => H.item({ t: S5.esc(S5.title(x)), s: S5.typeLabel(x.type) })).join("")}</div>` : `<p class="small muted">None. Use “Never send this record to AI” when editing any record.</p>`)}
      ${H.section(`AI request log <span class="muted small">${log.length}</span>`, log.length ? `<div class="list" style="max-height:340px;overflow:auto">${log.map((l) => H.item({ lead: l.ok ? "green" : "red", t: S5.esc(l.purpose), s: `${S5.fmtDateTime(l.at)} · ${l.chars} characters${l.images ? ` · ${l.images} image(s)` : ""}${l.err ? " · " + S5.esc(l.err) : ""}` })).join("")}</div>` : H.empty("No AI requests yet.", ""), log.length ? H.btn("Clear log", "ai-log-clear", {}, "sm") : "")}
      ${H.section("Academic integrity", `<p class="small">AI in Studio5 explains, quizzes and suggests. It does not write work you submit. Research records keep an honest line between your contribution and AI's. During real exams, follow the exam rules — Exam Day mode shows only your own notes.</p>`)}</div>`;
  } else if (tab === "ledger") {
    const ch = S5.store.list("change").sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    body = `<div class="row between" style="margin-bottom:10px"><p class="small muted">Every change to how Studio5 works: proposal, reason, impact, alternatives, decision. Proposed → under review → approved / deferred / rejected → implemented / replaced.</p>${H.btn("+ Proposal", "new", { type: "change", defaults: JSON.stringify({ status: "proposed" }) }, "sm primary")}</div>
      ${ch.length ? `<div class="list">${ch.map((c) => H.item({ lead: { implemented: "green", approved: "cobalt", rejected: "red", deferred: "amber" }[c.status] || "", t: S5.esc(c.title), s: [c.reason, c.decision].filter(Boolean).map(S5.esc).join(" · "), right: H.pill(c.status), act: "edit", data: { type: "change", id: c.id } })).join("")}</div>` : H.empty("No changes recorded.", "")}`;
  } else if (tab === "trash") {
    const tr = S5.store.trash().sort((a, b) => (b.deletedAt || "").localeCompare(a.deletedAt || ""));
    body = `<p class="small muted" style="margin-bottom:10px">Nothing is deleted automatically. Items stay here until you restore them or delete them for good.</p>${tr.length ? `<div class="list">${tr.map((x) => H.item({ t: S5.esc(S5.title(x)), s: `${S5.typeLabel(x.type)} · deleted ${S5.fmtDateTime(x.deletedAt)}`, right: H.btn("Restore", "trash-restore", { id: x.id }, "sm") + H.btn("Delete forever", "trash-purge", { id: x.id }, "sm danger") })).join("")}</div>` : H.empty("Trash is empty.", "")}`;
  }
  return `<div class="page-head"><div class="titles"><span class="eyebrow">Studio5 ${S5.APP_VERSION} · schema v${S5.SCHEMA_VERSION} · device ${S5.esc((S5.store.meta.deviceId || "").slice(-6))}</span><h1>System</h1></div></div>${H.tabs(tabs, tab, "open", { v: "system" })}${body}`;
};
S5.healthHTML = () => S5.health.report().map((i) => H.item({ lead: i.level === "ok" ? "green" : i.level === "warn" ? "amber" : "red", t: S5.esc(i.k), s: S5.esc(i.v) })).join("");
document.addEventListener("change", async (e) => {
  const t = e.target;
  if (t.dataset.setting) { const k = t.dataset.setting; const v = t.type === "checkbox" ? t.checked : t.type === "number" ? +t.value : k === "weekStart" ? +t.value : t.value; await S5.settings.set(k, v); if (k === "theme") S5.applyTheme(); S5.ui.toast("Saved"); }
  if (t.dataset.flag) { const f = { ...(S5.settings.get("flags") || {}) }; if (t.value === "") delete f[t.dataset.flag]; else f[t.dataset.flag] = t.value === "on"; await S5.settings.set("flags", f); }
});
S5.applyTheme = () => { const th = S5.settings.get("theme"); if (th === "system") document.documentElement.removeAttribute("data-theme"); else document.documentElement.setAttribute("data-theme", th); };
S5.act["safe-on"] = async () => { await S5.settings.set("safeMode", true); await S5.settings.set("backupEveryDays", 1); await S5.store.snapshot("Safe Mode turned on"); S5.ui.toast("Safe Mode on"); };
S5.act["safe-off"] = async () => { await S5.settings.set("safeMode", false); await S5.settings.set("backupEveryDays", 7); S5.ui.toast("Safe Mode off"); };
S5.act["backup-export"] = async (el) => {
  const out = document.getElementById("bk-out"); out.innerHTML = `<p class="small muted" style="margin-top:8px">Building backup…</p>`;
  try { const pkg = await S5.backup.build({ includeFiles: !el.dataset.nofiles }); const json = JSON.stringify(pkg); const name = `studio5-backup-${S5.todayISO()}${el.dataset.nofiles ? "-nofiles" : ""}.json`;
    const ok = await S5.ui.saveFile(name, new Blob([json], { type: "application/json" }));
    if (ok) { await S5.store.setMeta("lastBackupAt", S5.now()); S5.audit("backup", `Exported ${pkg.counts.records} records, ${pkg.counts.files} files (${S5.fmtBytes(json.length)})`); }
    out.innerHTML = `<p class="small" style="margin-top:8px">${ok ? "✓ Saved" : "Not saved"} · ${pkg.counts.records} records · ${pkg.counts.files} files · ${S5.fmtBytes(json.length)} · checksum <span class="mono">${pkg.checksum.slice(0, 16)}</span></p>`;
  } catch (e) { out.innerHTML = `<p class="small" style="color:var(--redline)">Backup failed: ${S5.esc(e.message)}</p>`; }
};
S5.act["restore-test"] = async () => { const out = document.getElementById("bk-out"); out.innerHTML = `<p class="small muted" style="margin-top:8px">Testing…</p>`; const r = await S5.backup.restoreTest(); out.innerHTML = `<p class="small" style="margin-top:8px;color:${r.ok ? "var(--green)" : "var(--redline)"}">${r.ok ? "✓ Restore test passed" : "✗ Restore test failed"}: ${S5.esc(r.detail)}</p>`; S5.audit("restore-test", r.detail); };
S5.act["restore-pick"] = async () => {
  const [file] = await S5.ui.pickFile("application/json,.json"); if (!file) return; const out = document.getElementById("rs-out");
  out.innerHTML = `<p class="small muted">Verifying ${S5.esc(file.name)}…</p>`;
  let pkg; try { pkg = JSON.parse(await file.text()); } catch { out.innerHTML = `<p class="small" style="color:var(--redline)">Not a readable JSON file. Nothing changed.</p>`; return; }
  const v = await S5.backup.verify(pkg);
  if (!v.ok) { out.innerHTML = `<p class="small" style="color:var(--redline)">✗ ${v.problems.map(S5.esc).join(" ")} Nothing changed.</p>`; S5.audit("restore", "Rejected damaged backup"); return; }
  out.innerHTML = `<div class="sheet flat" style="margin-top:8px"><p class="small">✓ Verified: ${v.counts.records} records, ${v.counts.files} files, exported ${S5.fmtDateTime(pkg.exportedAt)}.${v.problems.length ? `<br><span style="color:var(--amber)">${v.problems.map(S5.esc).join("<br>")}</span>` : ""}</p><div class="row" style="margin-top:8px"><button class="btn primary sm" id="rs-merge">Merge (newer wins, nothing deleted)</button><button class="btn danger sm" id="rs-replace">Replace everything</button></div></div>`;
  const go = async (mode) => { const body = { ...v.body, schemaVersion: pkg.schemaVersion }; const res = await S5.backup.restore(body, mode); out.innerHTML = `<p class="small" style="color:var(--green)">Restored: ${res.added} new, ${res.updated} updated, ${res.kept} kept. A snapshot of the previous state is in On-device snapshots.</p>`; };
  out.querySelector("#rs-merge").onclick = () => go("merge");
  out.querySelector("#rs-replace").onclick = () => S5.ui.confirm("Replace all current data with this backup? A snapshot of the current state is taken first.", "Replace", () => go("replace"));
};
S5.act["snap-take"] = async () => { await S5.store.snapshot("Manual snapshot"); S5.ui.render(); };
S5.act["snap-restore"] = (el) => S5.ui.confirm("Restore this snapshot? Your current state is snapshotted first.", "Restore snapshot", async () => { await S5.store.restoreSnapshot(el.dataset.key); S5.ui.toast("Snapshot restored"); });
S5.act["export-csv"] = async (el) => {
  const type = el.dataset.type; const fields = S5.SCHEMA[type].fields.map((f) => f.k); const rows = S5.store.list(type);
  const val = (r, k) => { let v = r[k]; if (k.endsWith("Id") && v) v = S5.title(S5.store.get(v)); return `"${String(v ?? "").replace(/"/g, '""')}"`; };
  const csv = "﻿" + [fields.join(","), ...rows.map((r) => fields.map((k) => val(r, k)).join(","))].join("\n");
  S5.ui.saveFile(`studio5-${type}s-${S5.todayISO()}.csv`, new Blob([csv], { type: "text/csv" }));
};
S5.act["export-cites"] = () => S5.ui.saveFile(`studio5-citations-${S5.todayISO()}.txt`, new Blob([S5.store.list("source", (s) => s.kind !== "ai").map((s) => s.citation || S5.cite(s)).join("\n")], { type: "text/plain" }));
S5.act["export-memory"] = () => { const md = "# Experience memory\n\n" + S5.store.list("memory").map((m) => `- **${m.kind}** (${S5.MEM_STAGES[m.stage || 0]}) ${m.text}${m.context ? ` — _${m.context}_` : ""}`).join("\n"); S5.ui.saveFile(`studio5-memory-${S5.todayISO()}.md`, new Blob([md], { type: "text/markdown" })); };
S5.act["ai-log-clear"] = async () => { S5.store.meta.aiLog = []; await S5.idb.put("meta", "aiLog", []); S5.ui.render(); };
S5.act["trash-restore"] = async (el) => { await S5.store.restore(el.dataset.id); S5.ui.toast("Restored"); S5.ui.render(); };
S5.act["trash-purge"] = (el) => S5.ui.confirm("Delete this item forever? This cannot be undone.", "Delete forever", async () => { await S5.store.purge(el.dataset.id); S5.ui.render(); });

/* ---------- search ---------- */
S5.views.search = (r) => { setTimeout(S5.renderSearchResults, 0); return `<div class="page-head"><div class="titles"><span class="eyebrow">Everything: lectures, PDF pages, feedback, errors, projects, site notes, exercises</span><h1>Search</h1></div></div><div id="search-results"><p class="small muted">Searching…</p></div>`; };
S5.renderSearchResults = async () => {
  const q = S5.ui.route.q || ""; const el = document.getElementById("search-results"); if (!el) return;
  const res = await S5.search(q); if (S5.ui.route.q !== q) return;
  if (!res.length) { el.innerHTML = H.empty(`Nothing found for “${q}”.`, "Try fewer words or another spelling. Arabic and English are both searched."); return; }
  const groups = {}; res.forEach((x) => (groups[x.r.type] = groups[x.r.type] || []).push(x));
  const hl = (s) => { let out = S5.esc(s); for (const t of q.trim().split(/\s+/)) if (t.length > 1) out = out.replace(new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), (m) => `<mark class="hl">${m}</mark>`); return out; };
  el.innerHTML = Object.entries(groups).map(([type, xs]) => H.section(`${S5.esc(S5.typeLabel(type))} <span class="muted small">${xs.length}</span>`, `<div class="list">${xs.slice(0, 30).map((x, i) => H.item({ t: S5.esc(S5.title(x.r)) + (x.page ? ` · p.${x.page}` : ""), s: `<span dir="auto">${hl(x.snip)}</span>${x.r.subjectId ? " · " + H.subj(x.r.subjectId) : ""}`, act: "open-search", data: { id: x.r.id, page: x.page || "" } })).join("")}</div>`)).join("");
};
S5.act["open-search"] = (el) => { const r = S5.store.get(el.dataset.id); if (r) S5.openRecord(r, el.dataset.page ? +el.dataset.page : undefined); };

/* ---------- inbox ---------- */
S5.views.inbox = () => {
  const items = S5.inboxItems();
  return `<div class="page-head"><div class="titles"><span class="eyebrow">Everything captured but not organised</span><h1>Inbox</h1></div>${H.btn("Capture", "capture", {}, "primary")}</div>
    ${items.length ? `<div class="list sheet">${items.map(({ r, why }) => {
      if (r.type === "capture") return `<div class="item" style="grid-template-columns:auto minmax(0,1fr)"><span class="lead ${r.kind === "gap" || r.kind === "verbatim" ? "red" : r.kind === "deadline" ? "amber" : "cobalt"}"></span><div style="min-width:0"><div class="t" dir="auto">${r.kind === "verbatim" ? `<span class="verbatim">${S5.esc(r.text)}</span>` : S5.esc(r.text || "(photo)")}</div><div class="s">${S5.CAPTURE_KINDS.find((k) => k[0] === r.kind)?.[1] || r.kind} · ${S5.fmtDateTime(r.createdAt)}${r.subjectId ? " · " + H.subj(r.subjectId) : " · no subject"}${r.page ? " · p." + r.page : ""}</div><div class="row" style="margin-top:6px">${!r.subjectId && !r.projectId ? `<select data-assign="${r.id}"><option value="">Assign subject…</option>${S5.store.list("subject", (s) => S5.yearActive(s.year)).map((s) => `<option value="${s.id}">${S5.esc(s.name)}</option>`).join("")}</select>` : ""}${[["task", "→ Task"], ["gap", "→ Rescue"], ["question", "→ Ask professor"], ["feedback", "→ Feedback"], ["memory", "→ Remember"], ["note", "→ Note"], ["keep", "Done"]].map(([k, n]) => `<button class="btn sm" data-act="resolve" data-id="${r.id}" data-v="${k}">${n}</button>`).join("")}</div></div></div>`;
      return H.item({ lead: "amber", t: S5.esc(S5.title(r)), s: `${S5.typeLabel(r.type)} · ${why}`, right: H.btn("File it", "edit", { type: r.type, id: r.id }, "sm") });
    }).join("")}</div>` : H.empty("Inbox zero.", "Every capture has been turned into a task, a gap, a question, a memory or a note.")}`;
};
document.addEventListener("change", async (e) => { if (e.target.dataset.assign && e.target.value) { await S5.store.update(e.target.dataset.assign, { subjectId: e.target.value }); S5.ui.render(); } });
S5.views.notifications = () => {
  const ns = S5.notifications(); const label = ["Critical", "Today", "This week", "Information"];
  return `<div class="page-head"><div class="titles"><span class="eyebrow">Every alert has an action</span><h1>Alerts</h1></div></div>${[0, 1, 2, 3].map((p) => { const xs = ns.filter((n) => n.p === p); return xs.length ? H.section(label[p], `<div class="list">${xs.map((n) => H.item({ lead: p === 0 ? "red" : p === 1 ? "amber" : p === 2 ? "cobalt" : "", t: S5.esc(n.text), act: n.act, data: n.data })).join("")}</div>`) : ""; }).join("") || H.empty("Nothing needs you right now.", "")}`;
};
