import { projectTodayQuery } from "./today-projection.mjs";

function statusBadge(tone, symbol, label) {
  return `<span class="status-badge status-${tone}"><span aria-hidden="true">${symbol}</span>${label}</span>`;
}

function pageIntroduction(eyebrow, title, description, stateLabel = "Representative state") {
  return `<header class="page-introduction">
    <div><span class="eyebrow">${eyebrow}</span><h1 tabindex="-1">${title}</h1><p>${description}</p></div>
    ${statusBadge("neutral", "◇", stateLabel)}
  </header>`;
}

function escaped(content) {
  return String(content ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

function todayLoadingView() {
  return `<section class="screen" aria-busy="true">
    ${pageIntroduction("Local academic data", "Today", "A calm starting point for the next useful academic action.", "Reading local data")}
    <article class="paper-card today-state" role="status"><h2>Loading today…</h2><p>Reading your current schedule and tasks from this device.</p></article>
  </section>`;
}

function todayErrorView() {
  return `<section class="screen">
    ${pageIntroduction("Local academic data", "Today", "A calm starting point for the next useful academic action.", "Read unavailable")}
    <article class="paper-card today-state" role="alert"><h2>Today could not be opened</h2><p>Today did not create or edit academic items. Try the local read again.</p><button class="primary-action" type="button" data-today-retry>Try again</button></article>
  </section>`;
}

function agendaMarkup(agenda) {
  if (agenda.length === 0) return "";
  return `<section class="paper-card" aria-labelledby="today-agenda"><div class="section-heading"><div><span class="section-number">01</span><h2 id="today-agenda">Agenda</h2></div><span>${agenda.length} ${agenda.length === 1 ? "item" : "items"}</span></div><ul class="content-list">${agenda.map((entry) => `<li><span class="list-marker" aria-hidden="true">→</span><span dir="auto"><strong>${escaped(entry.title)}</strong><small>${escaped(entry.context)}</small></span>${statusBadge("info", "○", escaped(entry.time))}</li>`).join("")}</ul></section>`;
}

function taskMarkup(tasks) {
  if (tasks.length === 0) return "";
  return `<section class="paper-card task-section" aria-labelledby="today-priorities"><div class="section-heading"><div><span class="section-number">02</span><h2 id="today-priorities">Priorities</h2></div><span>${tasks.length} ${tasks.length === 1 ? "item" : "items"}</span></div><ul class="content-list">${tasks.map((task, index) => `<li><span class="list-marker" aria-hidden="true">${index + 1}</span><span dir="auto"><strong>${escaped(task.title)}</strong><small>${escaped(task.context)}${task.time ? ` · ${escaped(task.time)}` : ""}</small></span>${statusBadge(task.tone, task.tone === "danger" ? "!" : "○", task.status)}</li>`).join("")}</ul></section>`;
}

function todayReadyView(projection) {
  const today = projectTodayQuery(projection);
  if (today.isEmpty) {
    return `<section class="screen">${pageIntroduction(today.date, "Today", "A calm starting point for the next useful academic action.", "Local data")}<article class="paper-card empty-state"><span class="empty-symbol" aria-hidden="true">＋</span><div><h2>Your day is clear</h2><p>No scheduled sessions or open tasks are due today.</p></div><a class="secondary-action" href="#/study">Open Study</a></article></section>`;
  }
  return `<section class="screen">${pageIntroduction(today.date, "Today", "A calm starting point for the next useful academic action.", "Local data")}${agendaMarkup(today.agenda)}${taskMarkup(today.tasks)}${today.completedCount > 0 ? `<p class="today-completed">${today.completedCount} completed today</p>` : ""}</section>`;
}

function todayView(state = { status: "loading" }) {
  if (state.status === "error") return todayErrorView();
  if (state.status === "ready") return todayReadyView(state.projection);
  return todayLoadingView();
}

function studyView() {
  return `<section class="screen">
    ${pageIntroduction("Academic workspace", "Study", "Subjects remain contextual without hard-coded Core data.")}
    <div class="feature-grid">
      <article class="paper-card">
        <span class="section-number">01</span><p class="eyebrow">Active subject</p>
        <h2 dir="auto">Building Structures</h2><p dir="auto">8 lectures · 3 notes · 1 open task</p>
        ${statusBadge("success", "✓", "Ready to continue")}
      </article>
      <article class="paper-card empty-state">
        <span class="empty-symbol" aria-hidden="true">＋</span>
        <div><h2>No additional subjects yet</h2><p>This empty state explains the next step without pretending to create live records.</p></div>
        <button class="secondary-action" type="button" disabled aria-describedby="subject-disabled">Add subject</button>
        <small id="subject-disabled">Unavailable until a later data-adapter slice.</small>
      </article>
    </div>
  </section>`;
}

function projectsView() {
  return `<section class="screen">
    ${pageIntroduction("Design work", "Projects", "Assignments, iterations, and feedback stay visible as a primary destination.")}
    <article class="paper-card project-card">
      <div><span class="section-number">P.03</span><p class="eyebrow">Active assignment</p></div>
      <div><h2 dir="auto">Spatial Sequence Study</h2><p dir="auto">Explore compression, release, and framed views through a compact pavilion.</p></div>
      <div class="project-meta">${statusBadge("warning", "!", "Due 12 August")} ${statusBadge("neutral", "3/5", "Checklist")}</div>
    </article>
    <article class="inline-notice" aria-labelledby="project-notice-title">
      <span aria-hidden="true">i</span><div><h2 id="project-notice-title">Project editing is not connected</h2><p>This shell preserves the destination and state language without changing project data or schema.</p></div>
    </article>
  </section>`;
}

function practiceView() {
  return `<section class="screen">
    ${pageIntroduction("Future practice entry", "Practice", "The navigation position is ready; Drawing Coach remains outside this Phase 4.5 slice.")}
    <article class="paper-card unavailable-state" aria-labelledby="practice-unavailable">
      <span class="unavailable-symbol" aria-hidden="true">×</span>
      <div><p class="eyebrow">Unavailable</p><h2 id="practice-unavailable">Drawing Coach is not started</h2><p>Practice behavior, exercises, rubrics, assessment, and Phase 5 data are intentionally absent.</p></div>
      <button class="primary-action" type="button" disabled aria-describedby="practice-reason">Start exercise</button>
      <small id="practice-reason">Available only after Phase 4.5 gates and an explicit owner decision.</small>
    </article>
  </section>`;
}

function libraryView() {
  return `<section class="screen">
    ${pageIntroduction("Reference collection", "Library", "Representative files show automatic direction without reading or changing user storage.")}
    <section class="paper-card" aria-labelledby="library-items">
      <div class="section-heading"><div><span class="section-number">01</span><h2 id="library-items">Recent items</h2></div><span>3 examples</span></div>
      <ul class="content-list resource-list">
        <li><span class="file-mark" aria-hidden="true">PDF</span><span dir="auto"><strong>Structures — Week 04</strong><small>Building Structures · 28 pages</small></span>${statusBadge("success", "✓", "Available")}</li>
        <li><span class="file-mark" aria-hidden="true">NT</span><span dir="auto"><strong>Lecture 6 — القوى والعزوم</strong><small>Statics · Note</small></span>${statusBadge("neutral", "○", "Recent")}</li>
        <li><span class="file-mark" aria-hidden="true">DR</span><span dir="auto"><strong>تفاصيل درج — Stair Detail 01</strong><small>Architectural Drawing · A3</small></span>${statusBadge("danger", "×", "Unavailable")}</li>
      </ul>
    </section>
  </section>`;
}

const viewByDestination = Object.freeze({
  today: todayView,
  study: studyView,
  projects: projectsView,
  practice: practiceView,
  library: libraryView,
});

export function destinationView(destinationId, todayState) {
  if (destinationId === "today") return todayView(todayState);
  return (viewByDestination[destinationId] ?? todayView)();
}
