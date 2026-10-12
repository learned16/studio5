/* Today — the daily execution board. Renders from local data only (never waits for AI). */
S5.views = S5.views || {};
const H = S5.h;
S5.todaySlots = (dayIdx = new Date().getDay()) => S5.store.list("slot", (s) => +s.day === dayIdx && S5.yearActive(S5.store.get(s.subjectId)?.year || 1) && (S5.store.get(s.subjectId)?.semester || 0) % 2 === (S5.settings.get("activeSemester") % 2)).sort((a, b) => a.start.localeCompare(b.start));
S5.setPlace = (label, route) => { S5.store.setMeta("lastPlace", { label, route, at: S5.now() }); };

S5.views.today = () => {
  const T = S5.todayISO(); const now = new Date(); const hm = now.toTimeString().slice(0, 5);
  const slots = S5.todaySlots(); const cur = slots.find((s) => s.start <= hm && s.end >= hm); const next = slots.find((s) => s.start > hm);
  const y = S5.settings.get("activeYear"); const sem = S5.settings.get("activeSemester");
  const notes = S5.notifications().filter((n) => n.p <= 1).slice(0, 6);
  const sessions = S5.store.list("session", (s) => s.date === T).sort((a, b) => (a.done === b.done ? 0 : a.done ? 1 : -1));
  const cap = S5.settings.get("dailySessionCap");
  const tasks = S5.store.list("task", (t) => (t.status === "open" || t.status === "doing") && t.due && S5.daysBetween(T, t.due) <= 3).sort((a, b) => a.due.localeCompare(b.due) || (a.priority === "critical" ? -1 : 1));
  const load = tasks.filter((t) => t.due <= T).reduce((a, t) => a + (t.estimateMin || 45), 0) + sessions.filter((s) => !s.done).reduce((a, s) => a + (s.plannedMin || 45), 0) + slots.filter((s) => s.end > hm).reduce((a, s) => a + S5.minsBetween(s.start, s.end), 0);
  const energy = S5.settings.get("energyMin");
  const projects = S5.store.list("project", (p) => !["frozen", "evaluated"].includes(p.phase)).map((p) => ({ p, r: S5.projectRisk(p) })).sort((a, b) => b.r.score - a.r.score);
  const nextAssess = S5.store.list("assessment", (a) => a.date && a.date >= T && a.score == null).sort((a, b) => a.date.localeCompare(b.date))[0];
  const place = S5.store.meta.lastPlace;
  const demo = S5.store.meta.demoSeeded && !S5.store.meta.demoCleared && [...S5.store.recs.values()].some((r) => r.demo && !r.deleted);
  const lectureCard = (s, label) => { const sub = S5.store.get(s.subjectId); return `<div class="row between"><div class="stack" style="gap:2px"><span class="eyebrow">${label} · ${s.start}–${s.end}${s.room ? " · " + S5.esc(s.room) : ""}</span><h2>${S5.esc(sub?.name || "")}</h2>${H.subjAr(s.subjectId)}</div><div class="row">${H.btn("Open lecture workspace", "lecture-now", { subject: s.subjectId }, "primary")}${H.btn("Capture", "capture", { subject: s.subjectId })}</div></div>`; };
  return `
  ${demo ? `<div class="sheet flat" style="margin-bottom:14px;border-style:dashed"><div class="row between"><p class="small"><strong>You're looking at example data.</strong> A sample week (timetable, a project, an exam) shows how Studio5 works. Your curriculum for all five years is real.</p>${H.btn("Remove examples", "clear-demo", {}, "sm")}</div></div>` : ""}
  <div class="page-head"><div class="titles"><span class="eyebrow">${now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })} · Year ${y} · Semester ${sem}</span><h1>Today</h1></div>
    <div class="row">${H.btn("Plan a session", "new-session")}${H.btn("End-of-day review", "day-review")}</div></div>
  <div class="split">
    <div class="stack">
      <section class="sheet ${cur ? "now" : ""}">${cur ? lectureCard(cur, "Now") : next ? lectureCard(next, "Next") : H.empty(slots.length ? "No more lectures today." : "No lectures in your timetable today.", slots.length ? "Use the time for your sessions below." : `Add your timetable in <button class="btn ghost sm" data-act="open" data-v="study" data-tab="timetable">Study → Timetable</button>.`)}</section>
      ${slots.length ? H.section("Lectures today", `<div class="list">${slots.map((s) => { const lec = S5.store.list("lecture", (l) => l.subjectId === s.subjectId && l.date === T)[0]; const caps = lec ? S5.store.list("capture", (c) => c.lectureId === lec.id).length : 0; const st = s.end < hm ? (lec?.status === "closed" ? H.pill("closed", "green") : caps ? H.pill("closeout pending", "amber") : H.pill("done")) : s.start <= hm ? H.pill("now", "cobalt") : H.pill("upcoming"); return H.item({ lead: s === cur ? "cobalt" : "", t: S5.esc(S5.store.get(s.subjectId)?.name || ""), s: `${s.start}–${s.end} ${S5.esc(s.room || "")}${caps ? ` · ${caps} captures` : ""}`, right: st, act: "lecture-now", data: { subject: s.subjectId } }); }).join("")}</div>`) : ""}
      ${H.section(`Study sessions <span class="muted small">${sessions.filter((s) => !s.done).length} of max ${cap}</span>`, sessions.length ? `<div class="list">${sessions.map((s) => H.item({ lead: s.done ? "green" : "cobalt", t: S5.esc(s.reason || "Session") + H.demo(s), s: `${H.subj(s.subjectId)} · ${S5.fmtMin(s.plannedMin)} planned${s.actualMin ? " · " + S5.fmtMin(s.actualMin) + " actual" : ""}${s.output ? " · output: " + S5.esc(s.output) : ""}`, right: s.done ? H.pill(s.met === false ? "criterion missed" : "done", s.met === false ? "amber" : "green") : H.btn("Start", "focus", { id: s.id }, "sm primary") })).join("")}</div>${sessions.filter((s) => !s.done).length > cap ? `<p class="small" style="color:var(--amber);margin-top:8px">More than ${cap} open sessions today. Move one to tomorrow so the plan stays realistic.</p>` : ""}` : H.empty("No sessions planned.", "A session has a reason, a time, an output and a done-criterion.", H.btn("Plan a session", "new-session", {}, "sm primary")), H.btn("+", "new-session", {}, "sm"))}
      ${H.section("Due in the next 3 days", tasks.length ? `<div class="list">${tasks.slice(0, 10).map((t) => H.item({ lead: t.priority === "critical" || t.due < T ? "red" : t.priority === "high" ? "amber" : "", t: S5.esc(t.title) + H.demo(t), s: [H.subj(t.subjectId), t.projectId ? S5.esc(S5.store.get(t.projectId)?.name || "") : "", t.estimateMin ? S5.fmtMin(t.estimateMin) : ""].filter(Boolean).join(" · "), right: H.due(t.due) + H.btn("Done", "task-done", { id: t.id }, "sm"), act: "edit", data: { type: "task", id: t.id } })).join("")}</div>` : H.empty("Nothing due in the next three days.", ""), H.btn("+ Task", "new", { type: "task" }, "sm"))}
    </div>
    <div class="stack">
      ${notes.length ? H.section("Needs action", `<div class="list">${notes.map((n) => H.item({ lead: n.p === 0 ? "red" : "amber", t: S5.esc(n.text), act: n.act, data: n.data })).join("")}</div>`, "", "alert") : ""}
      ${H.section("Today's load", `<div class="row between"><div class="stat"><span class="v">${S5.fmtMin(load)}</span><span class="l">planned for the rest of today</span></div><div class="stat" style="text-align:right"><span class="v">${S5.fmtMin(energy)}</span><span class="l">your realistic capacity</span></div></div><div style="margin-top:10px">${H.meter((load / energy) * 100, load > energy ? "red" : load > energy * 0.8 ? "amber" : "green")}</div>${load > energy ? `<p class="small" style="margin-top:8px;color:var(--redline)">Over capacity by ${S5.fmtMin(load - energy)}. Move a low-priority item or shorten a session.</p>` : ""}<p class="tiny muted" style="margin-top:6px">Capacity is set in System → Settings. Includes remaining lectures, open sessions and tasks due today.</p>`)}
      ${place ? H.section("Return to where you were", H.item({ lead: "cobalt", t: S5.esc(place.label), s: S5.fmtDateTime(place.at), act: "open-route", data: { route: JSON.stringify(place.route) } })) : ""}
      ${H.section("Highest risk", (projects[0] ? H.item({ lead: projects[0].r.level === "high" ? "red" : projects[0].r.level === "medium" ? "amber" : "green", t: S5.esc(projects[0].p.name), s: S5.esc(projects[0].r.reason) + (projects[0].p.nextAction ? `<br>Next: ${S5.esc(projects[0].p.nextAction)}` : ""), right: H.due(projects[0].p.deadline), act: "open", data: { v: "project", id: projects[0].p.id } }) : "") + (nextAssess ? H.item({ lead: S5.daysBetween(T, nextAssess.date) <= 7 ? "amber" : "", t: S5.esc(nextAssess.kind), s: `${H.subj(nextAssess.subjectId)} · weight ${nextAssess.confirmed ? nextAssess.weight + "%" : (nextAssess.weightMin ?? "?") + "–" + (nextAssess.weightMax ?? "?") + "% (unconfirmed)"}`, right: H.due(nextAssess.date), act: "open", data: { v: "subject", id: nextAssess.subjectId, tab: "exams" } }) : "") || H.empty("No open projects or upcoming assessments.", ""))}
    </div>
  </div>`;
};
S5.minsBetween = (a, b) => { const [h1, m1] = a.split(":").map(Number), [h2, m2] = b.split(":").map(Number); return h2 * 60 + m2 - (h1 * 60 + m1); };

/* ---------- focus screen ---------- */
S5.views.focus = (r) => {
  const s = S5.store.get(r.id); if (!s) return H.empty("Session not found", "");
  S5.setPlace(`Focus: ${s.reason || "session"}`, r);
  const run = S5.focusRun && S5.focusRun.id === s.id ? S5.focusRun : null;
  S5.ui.mount(() => {
    const clock = document.getElementById("focus-clock"); let wake = null;
    try { navigator.wakeLock?.request("screen").then((w) => (wake = w)).catch(() => {}); } catch {}
    const tick = () => { const f = S5.focusRun; const el = f && f.id === s.id ? f.acc + (f.running ? Date.now() - f.t0 : 0) : (s.actualMin || 0) * 60000; const m = Math.floor(el / 60000), sec = Math.floor((el % 60000) / 1000); if (clock) clock.textContent = `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`; const bar = document.getElementById("focus-bar"); if (bar) bar.style.width = Math.min(100, (el / 60000 / (s.plannedMin || 45)) * 100) + "%"; };
    tick(); const iv = setInterval(tick, 500);
    return () => { clearInterval(iv); try { wake && wake.release(); } catch {} };
  });
  return `<div class="crumbs"><button data-act="back">← Back</button></div>
  <div class="focus-screen">
    <span class="eyebrow">${H.subj(s.subjectId) || "Study session"} · planned ${S5.fmtMin(s.plannedMin)}</span>
    <h2 dir="auto" style="max-width:40ch">${S5.esc(s.reason || "")}</h2>
    <div class="clock" id="focus-clock">00:00</div>
    <div style="width:min(420px,90%)"><div class="meter"><i id="focus-bar" style="width:0"></i></div></div>
    <div class="row" style="justify-content:center">${run && run.running ? H.btn("Pause", "focus-pause", { id: s.id }) : H.btn(run ? "Resume" : "Start", "focus-start", { id: s.id }, "primary")}${H.btn("Finish session", "focus-finish", { id: s.id })}</div>
    <dl class="kv" style="text-align:left;max-width:520px"><dt>Output</dt><dd dir="auto">${S5.esc(s.output || "—")}</dd><dt>Done when</dt><dd dir="auto">${S5.esc(s.criterion || "—")}</dd></dl>
    <p class="tiny muted">Non-critical alerts are hidden while you focus. The screen stays awake when your device allows it.</p>
  </div>`;
};
S5.act["focus-start"] = (el) => { const f = S5.focusRun && S5.focusRun.id === el.dataset.id ? S5.focusRun : { id: el.dataset.id, acc: 0 }; f.t0 = Date.now(); f.running = true; S5.focusRun = f; S5.ui.render(); };
S5.act["focus-pause"] = () => { const f = S5.focusRun; if (f) { f.acc += Date.now() - f.t0; f.running = false; } S5.ui.render(); };
S5.act["focus-finish"] = (el) => {
  const s = S5.store.get(el.dataset.id); const f = S5.focusRun && S5.focusRun.id === s.id ? S5.focusRun : null;
  const ms = f ? f.acc + (f.running ? Date.now() - f.t0 : 0) : 0; const mins = Math.max(1, Math.round(ms / 60000));
  const m = S5.ui.modal("Finish session", `<div class="form-grid"><label class="field"><span>Actual minutes</span><input id="fin-min" type="number" value="${mins}"></label><label class="field"><span>Criterion met?</span><select id="fin-met"><option value="yes">Yes — ${S5.esc(s.criterion || "done")}</option><option value="no">No</option></select></label><label class="field wide"><span>What got in the way (blocker)</span><input id="fin-block" dir="auto" placeholder="Optional — helps future estimates"></label></div>`, { footer: `<button class="btn" data-close>Cancel</button><button class="btn primary" id="fin-ok">Save</button>` });
  m.el.querySelector("#fin-ok").onclick = async () => { await S5.store.update(s.id, { done: true, actualMin: +m.el.querySelector("#fin-min").value || mins, met: m.el.querySelector("#fin-met").value === "yes", blocker: m.el.querySelector("#fin-block").value }); S5.focusRun = null; m.close(); S5.ui.toast("Session saved"); S5.ui.go("today", true); };
};
S5.act["new-session"] = (el) => S5.ui.edit("session", { date: S5.todayISO(), plannedMin: 45, subjectId: el.dataset.subject || "" });
S5.act.focus = (el) => S5.ui.go({ v: "focus", id: el.dataset.id });
S5.act["task-done"] = async (el, e) => { e.stopPropagation(); const t = S5.store.get(el.dataset.id); const m = S5.ui.modal("Mark done", `<label class="field"><span>Actual time (min) — improves future estimates</span><input id="td-min" type="number" value="${t.estimateMin || ""}"></label>`, { footer: `<button class="btn" data-close>Cancel</button><button class="btn primary" id="td-ok">Done</button>` }); m.el.querySelector("#td-ok").onclick = async () => { await S5.store.update(t.id, { status: "done", doneAt: S5.now(), actualMin: +m.el.querySelector("#td-min").value || null }); m.close(); S5.ui.toast("Done ✓"); }; };
S5.act["lecture-now"] = async (el) => { const lec = await S5.ensureLecture(el.dataset.subject); S5.ui.go({ v: "lecture", id: lec.id }); };
S5.act["day-review"] = () => {
  const T = S5.todayISO();
  const doneT = S5.store.list("task", (t) => t.status === "done" && (t.doneAt || "").slice(0, 10) === T);
  const sess = S5.store.list("session", (s) => s.date === T); const plan = sess.reduce((a, s) => a + (s.plannedMin || 0), 0), act = sess.filter((s) => s.done).reduce((a, s) => a + (s.actualMin || 0), 0);
  const left = S5.store.list("task", (t) => t.status === "open" && t.due && t.due <= T);
  const prev = S5.store.list("dayReview", (d) => d.date === T)[0];
  const m = S5.ui.modal("End-of-day review", `<div class="grid cols-3"><div class="stat"><span class="v">${doneT.length}</span><span class="l">tasks done</span></div><div class="stat"><span class="v">${sess.filter((s) => s.done).length}/${sess.length}</span><span class="l">sessions</span></div><div class="stat"><span class="v">${S5.fmtMin(act)}</span><span class="l">actual of ${S5.fmtMin(plan)} planned</span></div></div>
    ${left.length ? `<div><h4>Still open (due today or earlier)</h4><div class="list">${left.map((t) => H.item({ lead: "amber", t: S5.esc(t.title), right: H.btn("Move to tomorrow", "task-tomorrow", { id: t.id }, "sm") })).join("")}</div></div>` : ""}
    <label class="field"><span>What worked / what got in the way</span><textarea id="dr-note" dir="auto">${S5.esc(prev?.note || "")}</textarea></label>
    <label class="field"><span>First step tomorrow</span><input id="dr-first" dir="auto" value="${S5.esc(prev?.firstStep || "")}"></label>`, { footer: `<button class="btn" data-close>Close</button><button class="btn primary" id="dr-save">Save review</button>` });
  m.el.querySelector("#dr-save").onclick = async () => { const data = { date: T, note: m.el.querySelector("#dr-note").value, firstStep: m.el.querySelector("#dr-first").value, planned: plan, actual: act, tasksDone: doneT.length }; prev ? await S5.store.update(prev.id, data) : await S5.store.create("dayReview", data); if (data.firstStep) await S5.store.create("task", { title: data.firstStep, due: S5.addDays(T, 1), priority: "high", status: "open", origin: "dayReview", personal: true }); m.close(); S5.ui.toast("Review saved"); };
};
S5.act["task-tomorrow"] = async (el) => { await S5.store.update(el.dataset.id, { due: S5.addDays(S5.todayISO(), 1) }); el.closest(".item").remove(); };
S5.act["clear-demo"] = () => S5.ui.confirm("Remove all example records? Your own entries and the curriculum stay.", "Remove examples", async () => { await S5.clearDemo(); S5.ui.toast("Examples removed"); });
S5.act["open-route"] = (el) => { try { S5.ui.go(JSON.parse(el.dataset.route)); } catch {} };
