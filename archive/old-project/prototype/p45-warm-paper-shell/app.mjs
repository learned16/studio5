const navItems = [...document.querySelectorAll("[data-destination]")];
const main = document.querySelector("#main-content");
const headerTitle = document.querySelector("#header-title");
const backdrop = document.querySelector("#dialog-backdrop");
const searchDialog = document.querySelector("#search-dialog");
const settingsDialog = document.querySelector("#settings-dialog");
const searchInput = document.querySelector("#global-search");
const searchResults = document.querySelector("#search-results");
const toast = document.querySelector("#toast");

const state = {
  destination: "today",
  libraryView: "list",
  libraryFilter: "All",
  subjectTab: "Overview",
  workspaceMode: "Read",
  leftPanelOpen: true,
  contextPanelOpen: true,
};

const resources = [
  { type: "PDF", title: "Structures — Week 04", detail: "Building Structures · 28 pages", meta: "12 min ago", favorite: true },
  { type: "Note", title: "Lecture 6 — القوى والعزوم", detail: "Statics · Note", meta: "Yesterday", favorite: false },
  { type: "Drawing", title: "تفاصيل درج — Stair Detail 01", detail: "Architectural Drawing · A3", meta: "Yesterday", favorite: true },
  { type: "Image", title: "Site visit — واجهة المبنى", detail: "Construction Materials · JPG", meta: "Jul 29", favorite: false },
  { type: "Assignment", title: "Studio Massing Study — نسخة 03", detail: "Design Project · Due Aug 6", meta: "Jul 28", favorite: false },
  { type: "PDF", title: "محاضرة 05 — Concrete Basics", detail: "Construction Materials · 42 pages", meta: "Jul 26", favorite: false },
  { type: "Drawing", title: "Axonometric Practice — تمرين", detail: "Unassigned · A4", meta: "Jul 24", favorite: false },
];

const icons = {
  PDF: "PD",
  Note: "NT",
  Drawing: "DR",
  Image: "IM",
  Assignment: "AS",
};

function todayView() {
  return `
    <div class="screen today-screen">
      <section class="welcome-row" aria-labelledby="today-heading">
        <div>
          <span class="eyebrow" id="today-date">Saturday, August 1</span>
          <h1 id="today-heading">Good morning, Harith.</h1>
          <p>Your studio is calm. One deadline needs attention today.</p>
        </div>
        <button class="primary-button" type="button" data-action="quick-add"><span aria-hidden="true">＋</span> Quick Add</button>
      </section>

      <section class="continue-strip section-block" aria-labelledby="continue-heading">
        <div class="section-heading compact-heading">
          <div><span class="section-index">01</span><h2 id="continue-heading">Continue Studying</h2></div>
          <button class="text-button" type="button" data-destination-link="study">View Study</button>
        </div>
        <button class="continue-card" type="button" data-open-workspace="Structures — Week 04">
          <span class="document-preview" aria-hidden="true"><i></i><i></i><i></i><b>04</b></span>
          <span class="continue-copy">
            <small>BUILDING STRUCTURES · PDF</small>
            <strong>Load paths and structural systems</strong>
            <span>Page 18 of 28 · Last opened 12 minutes ago</span>
            <span class="progress-track" aria-label="64 percent complete"><i style="width:64%"></i></span>
          </span>
          <span class="continue-action">Resume <span aria-hidden="true">→</span></span>
        </button>
      </section>

      <div class="today-columns">
        <section class="section-block schedule-block" aria-labelledby="schedule-heading">
          <div class="section-heading"><div><span class="section-index">02</span><h2 id="schedule-heading">Today’s Schedule</h2></div><span class="muted">3 sessions</span></div>
          <ol class="timeline">
            <li><time>09:00</time><span class="timeline-mark subject-blue" aria-hidden="true"></span><div><strong>Building Structures</strong><small>Lecture hall B · 90 min</small></div><span class="tag">Next</span></li>
            <li><time>12:30</time><span class="timeline-mark subject-rust" aria-hidden="true"></span><div><strong>Architectural Drawing</strong><small>Studio 3 · Bring A3 sheets</small></div></li>
            <li><time>16:00</time><span class="timeline-mark subject-olive" aria-hidden="true"></span><div><strong>Project desk review</strong><small>Mass model and plans</small></div></li>
          </ol>
        </section>

        <section class="section-block priorities-block" aria-labelledby="priorities-heading">
          <div class="section-heading"><div><span class="section-index">03</span><h2 id="priorities-heading">Top Priorities</h2></div><button class="text-button" type="button" data-action="quick-add">Add task</button></div>
          <div class="task-list">
            <label class="task-row"><input type="checkbox" /><span><strong>Finish section line weights</strong><small>Design Project · due 18:00</small></span><span class="priority high">High</span></label>
            <label class="task-row"><input type="checkbox" /><span><strong>Review load-path examples</strong><small>Building Structures · 25 min</small></span><span class="priority">Study</span></label>
            <label class="task-row"><input type="checkbox" /><span><strong>Photograph model version 03</strong><small>Design Project</small></span><span class="priority">Project</span></label>
          </div>
        </section>
      </div>

      <div class="today-lower-grid">
        <section class="section-block" aria-labelledby="deadlines-heading">
          <div class="section-heading"><div><span class="section-index">04</span><h2 id="deadlines-heading">Upcoming Deadlines</h2></div></div>
          <div class="deadline-list">
            <div><time><strong>06</strong><span>AUG</span></time><span><strong>Spatial Sequence Study</strong><small>Design Project · 5 days</small></span></div>
            <div><time><strong>09</strong><span>AUG</span></time><span><strong>Statics problem set 04</strong><small>Building Structures · 8 days</small></span></div>
          </div>
        </section>
        <section class="section-block" aria-labelledby="recent-heading">
          <div class="section-heading"><div><span class="section-index">05</span><h2 id="recent-heading">Recent Work</h2></div><button class="text-button" type="button" data-destination-link="library">Open Library</button></div>
          <div class="mini-resource-list">
            ${resourceButton(resources[2], true)}
            ${resourceButton(resources[1], true)}
          </div>
        </section>
      </div>
    </div>`;
}

function studyView() {
  const subjects = [
    ["Building Structures", "8 lectures · 3 notes · 1 task", "blue", "64%"],
    ["Architectural Drawing", "6 lectures · 12 drawings · 2 tasks", "rust", "48%"],
    ["Construction Materials", "7 lectures · 18 files", "olive", "55%"],
    ["Design Fundamentals", "9 lectures · 4 notes · 3 tasks", "sand", "71%"],
    ["Applied Mathematics", "11 lectures · 2 tasks", "slate", "38%"],
    ["Academic English", "5 lectures · 7 notes", "ink", "82%"],
  ];
  return `
    <div class="screen study-screen">
      <section class="page-intro">
        <div><span class="eyebrow">Academic overview</span><h1>Study</h1><p>Subjects, lectures, working notes, and course tasks in one quiet place.</p></div>
        <label class="select-control"><span>Semester</span><select aria-label="Choose semester"><option>Semester 1 · 2026</option><option>Semester 2 · 2026</option></select></label>
      </section>
      <div class="study-layout">
        <section class="subject-directory" aria-labelledby="subjects-heading">
          <div class="section-heading"><div><span class="section-index">01</span><h2 id="subjects-heading">Subjects</h2></div><span class="muted">6 active</span></div>
          <div class="subject-list">
            ${subjects.map(([name, detail, color, progress], index) => `
              <button class="subject-row ${index === 0 ? "is-selected" : ""}" type="button" data-subject="${name}">
                <span class="subject-swatch subject-${color}" aria-hidden="true"></span>
                <span class="subject-copy"><strong>${name}</strong><small>${detail}</small></span>
                <span class="subject-progress"><span>${progress}</span><i><b style="width:${progress}"></b></i></span>
                <span aria-hidden="true">›</span>
              </button>`).join("")}
          </div>
        </section>
        <section class="subject-detail" id="subject-detail" aria-live="polite">
          ${subjectDetail("Building Structures")}
        </section>
      </div>
    </div>`;
}

function subjectDetail(name) {
  const tabs = ["Overview", "Lectures", "Notes", "Files", "Drawings", "Tasks"];
  return `
    <div class="subject-title-row"><div><span class="eyebrow">Selected subject</span><h2>${name}</h2></div><button class="secondary-button" type="button" data-open-workspace="${name} — Week 04">Open workspace</button></div>
    <div class="tab-list" role="tablist" aria-label="Subject sections">
      ${tabs.map((tab) => `<button type="button" role="tab" aria-selected="${tab === state.subjectTab}" class="${tab === state.subjectTab ? "is-active" : ""}" data-subject-tab="${tab}">${tab}</button>`).join("")}
    </div>
    <div class="subject-tab-panel">${subjectTabContent(name)}</div>`;
}

function subjectTabContent(name) {
  if (state.subjectTab === "Overview") {
    return `<div class="subject-overview-grid">
      <article class="metric-paper"><span>Course progress</span><strong>64%</strong><small>4 of 8 lectures reviewed</small></article>
      <article class="metric-paper"><span>Next session</span><strong>Tue 09:00</strong><small>Shear and bending</small></article>
      <article class="metric-paper"><span>Open tasks</span><strong>2</strong><small>One due this week</small></article>
    </div>
    <div class="detail-section"><div class="section-heading"><h3>Continue in ${name}</h3></div>${resourceButton(resources[0])}</div>
    <div class="detail-section"><div class="section-heading"><h3>Tasks</h3></div><label class="task-row"><input type="checkbox" /><span><strong>Review load-path examples</strong><small>Due today · 25 min</small></span><span class="priority">Study</span></label></div>`;
  }
  if (state.subjectTab === "Tasks") {
    return `<div class="detail-section"><div class="section-heading"><h3>Course tasks</h3><button class="text-button" data-action="quick-add">Add task</button></div>
      <label class="task-row"><input type="checkbox" /><span><strong>Review load-path examples</strong><small>Due today · Lecture 04</small></span><span class="priority high">High</span></label>
      <label class="task-row"><input type="checkbox" /><span><strong>Complete problem set 04</strong><small>Due Aug 9</small></span><span class="priority">Course</span></label></div>`;
  }
  const map = { Lectures: resources[0], Notes: resources[1], Files: resources[5], Drawings: resources[6] };
  return `<div class="detail-section"><div class="section-heading"><h3>${state.subjectTab}</h3><span class="muted">Prototype sample</span></div>${resourceButton(map[state.subjectTab] || resources[0])}</div>`;
}

function projectsView() {
  return `
    <div class="screen projects-screen">
      <section class="page-intro"><div><span class="eyebrow">Design work</span><h1>Projects</h1><p>Assignments, iterations, critique, and submission readiness.</p></div><button class="secondary-button" type="button" data-action="quick-add">New project note</button></section>
      <div class="project-grid">
        <article class="project-feature">
          <div class="project-band"><span class="eyebrow light">Active assignment</span><span class="tag dark">Due Aug 6</span></div>
          <div class="project-body">
            <div class="project-heading"><div><span class="project-number">P.03</span><h2>Spatial Sequence Study</h2><p>Explore compression, release, and framed views through a compact pavilion.</p></div><span class="project-score"><small>Checklist</small><strong>3/5</strong></span></div>
            <div class="project-columns">
              <section><h3>Versions</h3><button class="version-row" data-open-workspace="Spatial Sequence — Version 03"><span><strong>Version 03</strong><small>Plans + section · edited yesterday</small></span><span class="tag">Current</span></button><button class="version-row" data-open-workspace="Spatial Sequence — Version 02"><span><strong>Version 02</strong><small>Massing study · Jul 27</small></span><span>›</span></button></section>
              <section><h3>Professor feedback</h3><blockquote>“The central threshold is stronger. Clarify how the roof plane guides the final turn.”</blockquote><small>Desk review · Jul 30</small></section>
              <section><h3>Submission checklist</h3><label><input type="checkbox" checked /> Site diagram</label><label><input type="checkbox" checked /> Ground plan</label><label><input type="checkbox" checked /> Long section</label><label><input type="checkbox" /> Final model photos</label><label><input type="checkbox" /> PDF export check</label></section>
            </div>
          </div>
        </article>
        <article class="project-compact"><span class="subject-swatch subject-rust"></span><div><span class="eyebrow">Assignment P.02</span><h2>Material & Joint Study</h2><p>2 versions · feedback added</p></div><time><strong>12</strong><span>AUG</span></time><button class="text-button" data-open-workspace="Material and Joint Study">Open</button></article>
        <article class="project-compact"><span class="subject-swatch subject-olive"></span><div><span class="eyebrow">Assignment P.01</span><h2>Measured Room Drawing</h2><p>Submitted · archived for reference</p></div><span class="tag">Complete</span><button class="text-button" data-open-workspace="Measured Room Drawing">Review</button></article>
      </div>
    </div>`;
}

function practiceView() {
  const tracks = [
    ["Freehand", "Line confidence, proportion, and observation", "12 sessions", 68],
    ["Engineering Drawing", "Projection, sections, and conventions", "8 sessions", 52],
    ["Architectural Design Basics", "Space, order, threshold, and sequence", "6 sessions", 41],
  ];
  return `
    <div class="screen practice-screen">
      <section class="page-intro"><div><span class="eyebrow">Drawing practice</span><h1>Practice</h1><p>Short deliberate sessions that build a steadier architectural hand.</p></div><button class="secondary-button" type="button" data-action="coach">Open Drawing Coach</button></section>
      <section class="practice-today section-block">
        <div class="practice-brief"><span class="section-index">Today’s Practice · 18 min</span><h2>Continuous contour: everyday object</h2><p>Draw one object without lifting the pen. Keep your eyes on the object more than the page.</p><div><span class="tag">Freehand</span><span class="tag">Pen recommended</span></div><button class="primary-button" type="button" data-open-workspace="Continuous Contour Practice">Start on canvas</button></div>
        <div class="practice-sheet" aria-label="Exercise preview"><span>01</span><i></i><i></i><i></i><strong>Look slowly.<br />Draw continuously.</strong></div>
      </section>
      <section class="section-block tracks-section"><div class="section-heading"><div><span class="section-index">Practice areas</span><h2>Build your foundation</h2></div><span class="muted">26 sessions total</span></div>
        <div class="practice-tracks">${tracks.map(([title, copy, sessions, progress], index) => `<button class="practice-track" type="button" data-action="practice-track"><span class="track-number">0${index + 1}</span><span><strong>${title}</strong><small>${copy}</small></span><span class="track-progress"><small>${sessions}</small><i><b style="width:${progress}%"></b></i><em>${progress}%</em></span><span aria-hidden="true">→</span></button>`).join("")}</div>
      </section>
      <section class="progress-section"><div><span class="eyebrow">Progress</span><h2>4-day practice rhythm</h2><p>Consistency matters more than session length.</p></div><div class="week-strip" aria-label="Practice activity this week">${["M", "T", "W", "T", "F", "S", "S"].map((day, i) => `<span class="${i < 4 ? "is-done" : ""}"><i>${day}</i><b>${i < 4 ? "✓" : "·"}</b></span>`).join("")}</div></section>
    </div>`;
}

function libraryView() {
  const filters = ["All", "PDFs", "Notes", "Drawings", "Images", "Assignments"];
  const singular = { PDFs: "PDF", Notes: "Note", Drawings: "Drawing", Images: "Image", Assignments: "Assignment" };
  const visible = state.libraryFilter === "All" ? resources : resources.filter((resource) => resource.type === singular[state.libraryFilter]);
  return `
    <div class="screen library-screen">
      <section class="page-intro library-intro"><div><span class="eyebrow">Reference collection</span><h1>Library</h1><p>Course files and work, organized without leaving the studio.</p></div><div class="view-toggle" role="group" aria-label="Library view"><button class="${state.libraryView === "list" ? "is-active" : ""}" type="button" data-library-view="list">List</button><button class="${state.libraryView === "grid" ? "is-active" : ""}" type="button" data-library-view="grid">Grid</button></div></section>
      <div class="library-toolbar">
        <div class="filter-chips" aria-label="Resource type filters">${filters.map((filter) => `<button class="${filter === state.libraryFilter ? "is-active" : ""}" type="button" data-library-filter="${filter}">${filter}</button>`).join("")}</div>
        <div class="library-selectors">
          <label><span class="sr-only">Subject filter</span><select><option>All subjects</option><option>Building Structures</option><option>Architectural Drawing</option><option>Unassigned</option></select></label>
          <label><span class="sr-only">Semester filter</span><select><option>Semester 1 · 2026</option><option>All semesters</option></select></label>
          <button class="filter-button" type="button" data-action="filter-more">Favorite · Recent · Unassigned</button>
        </div>
      </div>
      <section class="library-list ${state.libraryView === "grid" ? "is-grid" : ""}" aria-label="Library resources">
        <div class="library-list-header"><span>Name</span><span>Subject / collection</span><span>Updated</span><span></span></div>
        ${visible.length ? visible.map((resource) => resourceButton(resource)).join("") : `<div class="empty-state"><strong>No resources in this filter.</strong><p>Choose another resource type to continue browsing.</p></div>`}
      </section>
    </div>`;
}

function resourceButton(resource, compact = false) {
  if (!resource) return "";
  return `<button class="resource-row ${compact ? "is-compact" : ""}" type="button" data-open-workspace="${resource.title}">
    <span class="file-symbol type-${resource.type.toLowerCase()}" aria-hidden="true">${icons[resource.type]}</span>
    <span class="resource-name"><strong dir="auto">${resource.title}</strong><small>${resource.type}${resource.favorite ? " · Favorite" : ""}</small></span>
    <span class="resource-detail" dir="auto">${resource.detail}</span><span class="resource-meta">${resource.meta}</span><span class="resource-open" aria-hidden="true">→</span>
  </button>`;
}

function workspaceView(title) {
  const modes = ["Read", "Annotate", "Notes", "Canvas", "Split"];
  return `
    <div class="workspace" data-unified-workspace>
      <header class="workspace-header">
        <button class="icon-button" type="button" data-action="close-workspace" aria-label="Close workspace">←</button>
        <div class="workspace-title"><span class="eyebrow">Unified Workspace</span><strong dir="auto">${title}</strong></div>
        <div class="workspace-modes" role="tablist" aria-label="Workspace modes">${modes.map((mode) => `<button type="button" role="tab" aria-selected="${mode === state.workspaceMode}" class="${mode === state.workspaceMode ? "is-active" : ""}" data-workspace-mode="${mode}">${mode}</button>`).join("")}</div>
        <div class="workspace-actions"><span class="saved-state"><i></i>Prototype</span><button class="icon-button" type="button" data-action="toggle-context" aria-label="Toggle context panel">▤</button></div>
      </header>
      <div class="workspace-body ${state.leftPanelOpen ? "" : "left-collapsed"} ${state.contextPanelOpen ? "" : "context-collapsed"}">
        <aside class="resource-panel" aria-label="Resource pages">
          <div class="panel-heading"><strong>Pages</strong><button class="icon-button small" type="button" data-action="toggle-left" aria-label="Collapse pages panel">‹</button></div>
          <div class="page-thumbnails">${[1, 2, 3, 4, 5].map((page) => `<button type="button" class="page-thumbnail ${page === 3 ? "is-active" : ""}"><span><i></i><i></i><i></i></span><small>${page}</small></button>`).join("")}</div>
        </aside>
        <button class="panel-restore left-restore" type="button" data-action="toggle-left" aria-label="Open pages panel">›</button>
        <section class="workspace-stage" aria-label="Main PDF, note, or canvas area">
          <div class="ink-toolbar" aria-label="Ink toolbar placeholder">
            <button type="button" class="is-active" aria-label="Pen tool placeholder">Pen</button><button type="button" aria-label="Highlighter placeholder">Mark</button><button type="button" aria-label="Eraser placeholder">Erase</button><span class="ink-color" aria-label="Ink color: architectural blue"></span><button type="button" aria-label="More ink tools placeholder">•••</button>
          </div>
          <article class="paper-canvas">
            <div class="paper-kicker"><span>STUDIO5 / BUILDING STRUCTURES</span><span>04</span></div>
            <h1>Load Paths & Structural Order</h1>
            <p>A load path describes how forces move from the point of application through structural elements and finally into the ground.</p>
            <div class="diagram-placeholder" aria-label="Structural diagram placeholder"><span class="load-arrow">LOAD ↓</span><i class="beam"></i><i class="column left"></i><i class="column right"></i><i class="ground"></i><small>Trace each force to a stable support.</small></div>
            <div class="annotation-stroke" aria-hidden="true"></div>
            <p class="margin-note" dir="auto">راجع اتجاه القوى عند نقطة الاتصال</p>
          </article>
          <div class="stage-controls"><button type="button" aria-label="Zoom out">−</button><span>84%</span><button type="button" aria-label="Zoom in">＋</button><button type="button">Fit page</button></div>
        </section>
        <button class="panel-restore context-restore" type="button" data-action="toggle-context" aria-label="Open context panel">‹</button>
        <aside class="context-panel" aria-label="Optional context panel">
          <div class="panel-heading"><strong>Context</strong><button class="icon-button small" type="button" data-action="toggle-context" aria-label="Collapse context panel">›</button></div>
          <section><span class="eyebrow">Linked subject</span><strong>Building Structures</strong><small>Lecture 04 · Week 4</small></section>
          <section><span class="eyebrow">Working note</span><p dir="auto">القوة تنتقل من البلاطة إلى الجسر ثم العمود والأساس.</p><button class="text-button" type="button">Open note</button></section>
          <section><span class="eyebrow">Related task</span><label class="task-row mini"><input type="checkbox" /><span><strong>Review examples</strong><small>Due today</small></span></label></section>
        </aside>
      </div>
    </div>`;
}

const views = { today: todayView, study: studyView, projects: projectsView, practice: practiceView, library: libraryView };

function render(destination = state.destination) {
  state.destination = destination;
  main.className = destination === "workspace" ? "workspace-main" : "";
  main.innerHTML = views[destination]();
  headerTitle.textContent = destination[0].toUpperCase() + destination.slice(1);
  document.title = `Studio5 — ${headerTitle.textContent}`;
  navItems.forEach((item) => {
    const active = item.dataset.destination === destination;
    item.classList.toggle("is-active", active);
    if (active) item.setAttribute("aria-current", "page"); else item.removeAttribute("aria-current");
  });
  main.scrollTop = 0;
}

function openWorkspace(title) {
  state.previousDestination = state.destination;
  state.destination = "workspace";
  main.className = "workspace-main";
  main.innerHTML = workspaceView(title);
  headerTitle.textContent = "Workspace";
  document.querySelector(".top-header").classList.add("is-workspace-hidden");
  document.querySelector(".navigation-rail").classList.add("is-workspace-hidden");
}

function closeWorkspace() {
  document.querySelector(".top-header").classList.remove("is-workspace-hidden");
  document.querySelector(".navigation-rail").classList.remove("is-workspace-hidden");
  render(state.previousDestination || "today");
}

function rerenderWorkspace() {
  const title = document.querySelector(".workspace-title strong")?.textContent || "Studio workspace";
  main.innerHTML = workspaceView(title);
}

function showDialog(dialog) {
  backdrop.hidden = false;
  dialog.hidden = false;
  requestAnimationFrame(() => dialog.classList.add("is-open"));
  const focusTarget = dialog === searchDialog ? searchInput : dialog.querySelector("input, button");
  setTimeout(() => focusTarget?.focus(), 30);
}

function closeDialogs() {
  document.querySelectorAll(".dialog").forEach((dialog) => {
    dialog.classList.remove("is-open");
    dialog.hidden = true;
  });
  backdrop.hidden = true;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("is-visible"), 2600);
}

function populateSearch(query = "") {
  const normalized = query.trim().toLowerCase();
  const matches = resources.filter((resource) => !normalized || `${resource.title} ${resource.detail}`.toLowerCase().includes(normalized)).slice(0, 5);
  searchResults.innerHTML = `<span class="eyebrow">${normalized ? `${matches.length} results` : "Recent resources"}</span>${matches.map((resource) => resourceButton(resource, true)).join("") || `<p class="muted">No matching prototype resources.</p>`}`;
}

document.addEventListener("click", (event) => {
  const destinationButton = event.target.closest("[data-destination]");
  const destinationLink = event.target.closest("[data-destination-link]");
  const workspaceButton = event.target.closest("[data-open-workspace]");
  const actionButton = event.target.closest("[data-action]");
  const subjectButton = event.target.closest("[data-subject]");
  const subjectTab = event.target.closest("[data-subject-tab]");
  const libraryView = event.target.closest("[data-library-view]");
  const libraryFilter = event.target.closest("[data-library-filter]");
  const workspaceMode = event.target.closest("[data-workspace-mode]");

  if (destinationButton) render(destinationButton.dataset.destination);
  if (destinationLink) render(destinationLink.dataset.destinationLink);
  if (workspaceButton) {
    if (workspaceButton.closest(".dialog")) closeDialogs();
    openWorkspace(workspaceButton.dataset.openWorkspace);
  }
  if (subjectButton) {
    document.querySelectorAll("[data-subject]").forEach((button) => button.classList.toggle("is-selected", button === subjectButton));
    state.subjectTab = "Overview";
    document.querySelector("#subject-detail").innerHTML = subjectDetail(subjectButton.dataset.subject);
  }
  if (subjectTab) {
    state.subjectTab = subjectTab.dataset.subjectTab;
    const name = document.querySelector(".subject-detail h2")?.textContent || "Subject";
    document.querySelector("#subject-detail").innerHTML = subjectDetail(name);
  }
  if (libraryView) { state.libraryView = libraryView.dataset.libraryView; render("library"); }
  if (libraryFilter) { state.libraryFilter = libraryFilter.dataset.libraryFilter; render("library"); }
  if (workspaceMode) { state.workspaceMode = workspaceMode.dataset.workspaceMode; rerenderWorkspace(); showToast(`${state.workspaceMode} mode selected — visual prototype only`); }

  if (!actionButton) return;
  const action = actionButton.dataset.action;
  if (action === "search") { populateSearch(); showDialog(searchDialog); }
  if (action === "settings") showDialog(settingsDialog);
  if (action === "close-dialog") closeDialogs();
  if (action === "go-today") render("today");
  if (action === "close-workspace") closeWorkspace();
  if (action === "toggle-left") { state.leftPanelOpen = !state.leftPanelOpen; rerenderWorkspace(); }
  if (action === "toggle-context") { state.contextPanelOpen = !state.contextPanelOpen; rerenderWorkspace(); }
  if (["quick-add", "profile", "coach", "practice-track", "filter-more"].includes(action)) showToast({ quick_add: "Quick Add is represented as a prototype action.", profile: "Profile is secondary to the five study destinations.", coach: "Drawing Coach entry point opened — assessment is not implemented.", practice_track: "Practice track selected — navigation prototype only.", filter_more: "Favorite, Recent, and Unassigned filters are represented here." }[action.replaceAll("-", "_")]);
});

searchInput.addEventListener("input", () => populateSearch(searchInput.value));
backdrop.addEventListener("click", closeDialogs);
document.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); populateSearch(); showDialog(searchDialog); }
  if (event.key === "Escape") {
    if (!backdrop.hidden) closeDialogs();
    else if (state.destination === "workspace") closeWorkspace();
  }
});

const currentDate = new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric" }).format(new Date());
render("today");
document.querySelector("#today-date").textContent = currentDate;
