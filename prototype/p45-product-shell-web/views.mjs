function statusBadge(tone, symbol, label) {
  return `<span class="status-badge status-${tone}"><span aria-hidden="true">${symbol}</span>${label}</span>`;
}

function pageIntroduction(eyebrow, title, description) {
  return `<header class="page-introduction">
    <div><span class="eyebrow">${eyebrow}</span><h1 tabindex="-1">${title}</h1><p>${description}</p></div>
    ${statusBadge("neutral", "◇", "Representative state")}
  </header>`;
}

function todayView() {
  return `<section class="screen">
    ${pageIntroduction("Sunday, 9 August", "Today", "A calm starting point for the next useful academic action.")}
    <div class="feature-grid">
      <article class="paper-card priority-card">
        <span class="section-number">01</span><p class="eyebrow">Continue studying</p>
        <h2 dir="auto">Load paths and structural systems</h2>
        <p dir="auto">Building Structures · Week 04 · Last opened yesterday</p>
        <a class="primary-action" href="#/study">Open Study <span aria-hidden="true">→</span></a>
      </article>
      <article class="paper-card">
        <span class="section-number">02</span><p class="eyebrow">Next session</p>
        <h2 dir="auto">Architectural Drawing</h2>
        <p dir="auto">Studio 3 · Bring A3 sheets</p>
        ${statusBadge("info", "→", "Today at 12:30")}
      </article>
    </div>
    <section class="paper-card task-section" aria-labelledby="today-priorities">
      <div class="section-heading"><div><span class="section-number">03</span><h2 id="today-priorities">Top priorities</h2></div><span>2 items</span></div>
      <ul class="content-list">
        <li><span class="list-marker" aria-hidden="true">1</span><span dir="auto"><strong>Finish section line weights</strong><small>Design Project · due 18:00</small></span>${statusBadge("warning", "!", "Due today")}</li>
        <li><span class="list-marker" aria-hidden="true">2</span><span dir="auto"><strong>مراجعة أمثلة الأحمال — Load-path examples</strong><small>Building Structures · 25 min</small></span>${statusBadge("neutral", "○", "Planned")}</li>
      </ul>
    </section>
  </section>`;
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

export function destinationView(destinationId) {
  return (viewByDestination[destinationId] ?? todayView)();
}
