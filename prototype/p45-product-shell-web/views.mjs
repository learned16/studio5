import { projectLibraryResults } from "./library-results-projection.mjs";
import { projectLibraryNoteDetail } from "./library-note-detail-projection.mjs";
import { projectStudySubjects } from "./study-subjects-projection.mjs";
import { projectStudySubjectDetail } from "./study-subject-detail-projection.mjs";
import { projectStudySubjectLectures } from "./study-subject-lectures-projection.mjs";
import { projectStudySubjectTasks } from "./study-subject-tasks-projection.mjs";
import { projectStudySubjectSchedule } from "./study-subject-schedule-projection.mjs";
import { projectStudySubjectNotes } from "./study-subject-notes-projection.mjs";
import { projectStudySubjectFiles } from "./study-subject-files-projection.mjs";
import { projectStudySubjectFileMetadata } from "./study-subject-file-metadata-projection.mjs";
import { projectStudySubjectFileVersions } from "./study-subject-file-versions-projection.mjs";
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

function studyLoadingView() {
  return `<section class="screen" aria-busy="true">
    ${pageIntroduction("Local academic data", "Study", "Your canonical subjects, read from this device without changing them.", "Reading local data")}
    <article class="paper-card study-state" role="status"><h2>Loading subjects…</h2><p>Reading your subject list from local academic data.</p></article>
  </section>`;
}

function studyErrorView() {
  return `<section class="screen">
    ${pageIntroduction("Local academic data", "Study", "Your canonical subjects, read from this device without changing them.", "Read unavailable")}
    <article class="paper-card study-state" role="alert"><h2>Subjects could not be opened</h2><p>Study did not create or edit subjects. Try the local read again.</p><button class="primary-action" type="button" data-study-retry>Try again</button></article>
  </section>`;
}

function studyReadyView(subjects) {
  const projectedSubjects = projectStudySubjects(subjects);
  if (projectedSubjects.length === 0) {
    return `<section class="screen">${pageIntroduction("Local academic data", "Study", "Your canonical subjects, read from this device without changing them.", "Local data")}<article class="paper-card empty-state"><span class="empty-symbol" aria-hidden="true">＋</span><div><h2>No subjects yet</h2><p>No subjects are available in local academic data.</p></div></article></section>`;
  }
  const cards = projectedSubjects.map((subject, index) => {
    const headingId = `study-subject-${index + 1}`;
    return `<li><article class="paper-card subject-card" aria-labelledby="${headingId}"><span class="section-number" aria-hidden="true">${String(index + 1).padStart(2, "0")}</span><h3 id="${headingId}" dir="auto">${escaped(subject.title)}</h3><button class="secondary-action" type="button" data-study-subject-open="${escaped(subject.id)}">Open subject</button></article></li>`;
  }).join("");
  return `<section class="screen">${pageIntroduction("Local academic data", "Study", "Your canonical subjects, read from this device without changing them.", "Local data")}<section aria-labelledby="study-subjects"><div class="section-heading"><div><span class="section-number">01</span><h2 id="study-subjects">Subjects</h2></div><span>${projectedSubjects.length} ${projectedSubjects.length === 1 ? "subject" : "subjects"}</span></div><ul class="subject-grid">${cards}</ul></section></section>`;
}

function studyDetailView(detail) {
  if (!detail) return "";
  const close = `<button class="secondary-action" type="button" data-study-subject-close>Close</button>`;
  if (detail.status === "loading") return `<article class="paper-card study-detail" aria-busy="true" role="status"><h2>Loading subject…</h2>${close}</article>`;
  if (detail.status === "missing") return `<article class="paper-card study-detail" role="alert"><h2>Subject is unavailable</h2>${close}</article>`;
  if (detail.status === "error") return `<article class="paper-card study-detail" role="alert"><h2>Subject could not be opened</h2><button class="primary-action" type="button" data-study-subject-retry>Retry</button>${close}</article>`;
  const subject = projectStudySubjectDetail(detail.subject);
  return `<article class="paper-card study-detail" aria-labelledby="study-detail-title"><h2 id="study-detail-title" dir="auto">${escaped(subject.title)}</h2>${subject.code ? `<p dir="auto">${escaped(subject.code)}</p>` : ""}${studyLecturesView(detail.lectures)}${studyTasksView(detail.tasks)}${studyScheduleView(detail.schedule)}${studyNotesView(detail.notes)}${studyFilesView(detail.files)}${studyFileMetadataView(detail.fileMetadata)}${close}</article>`;
}

function studyLecturesView(lectures) {
  if (!lectures || lectures.status === "loading") return `<section aria-labelledby="study-lectures"><h3 id="study-lectures">Lectures</h3><p role="status" aria-busy="true">Loading lectures…</p></section>`;
  if (lectures.status === "error") return `<section aria-labelledby="study-lectures"><h3 id="study-lectures">Lectures</h3><p role="alert">Lectures could not be opened. <button class="primary-action" type="button" data-study-subject-retry>Retry</button></p></section>`;
  const projectedLectures = projectStudySubjectLectures(lectures.lectures);
  if (projectedLectures.length === 0) return `<section aria-labelledby="study-lectures"><h3 id="study-lectures">Lectures</h3><p>No lectures are available in local academic data.</p></section>`;
  return `<section aria-labelledby="study-lectures"><h3 id="study-lectures">Lectures</h3><ul class="content-list">${projectedLectures.map((lecture) => `<li><span dir="auto">${escaped(lecture.title)}</span><dl><dt>Starts</dt><dd>${escaped(lecture.startsAt)}</dd><dt>Ends</dt><dd>${escaped(lecture.endsAt)}</dd><dt>Status</dt><dd>${escaped(lecture.status)}</dd></dl></li>`).join("")}</ul></section>`;
}

function studyTasksView(tasks) {
  if (!tasks || tasks.status === "loading") return `<section aria-labelledby="study-tasks"><h3 id="study-tasks">Tasks</h3><p role="status" aria-busy="true">Loading tasks…</p></section>`;
  if (tasks.status === "error") return `<section aria-labelledby="study-tasks"><h3 id="study-tasks">Tasks</h3><p role="alert">Tasks could not be opened. <button class="primary-action" type="button" data-study-subject-tasks-retry>Retry</button></p></section>`;
  const projectedTasks = projectStudySubjectTasks(tasks.tasks);
  if (projectedTasks.length === 0) return `<section aria-labelledby="study-tasks"><h3 id="study-tasks">Tasks</h3><p>No tasks are available in local academic data.</p></section>`;
  return `<section aria-labelledby="study-tasks"><h3 id="study-tasks">Tasks</h3><ul class="content-list">${projectedTasks.map((task) => `<li><span dir="auto">${escaped(task.title)}</span><dl><dt>Due</dt><dd>${escaped(String(task.dueAt))}</dd><dt>Status</dt><dd>${escaped(String(task.status))}</dd></dl></li>`).join("")}</ul></section>`;
}

const weekdayLabels = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function studyScheduleView(schedule) {
  if (!schedule || schedule.status === "loading") return `<section aria-labelledby="study-schedule"><h3 id="study-schedule">Schedule entries</h3><p role="status" aria-busy="true">Loading schedule entries…</p></section>`;
  if (schedule.status === "error") return `<section aria-labelledby="study-schedule"><h3 id="study-schedule">Schedule entries</h3><p role="alert">Schedule entries could not be opened. <button class="primary-action" type="button" data-study-subject-schedule-retry>Retry</button></p></section>`;
  const projectedEntries = projectStudySubjectSchedule(schedule.entries);
  if (projectedEntries.length === 0) return `<section aria-labelledby="study-schedule"><h3 id="study-schedule">Schedule entries</h3><p>No schedule entries are available in local academic data.</p></section>`;
  return `<section aria-labelledby="study-schedule"><h3 id="study-schedule">Schedule entries</h3><ul class="content-list">${projectedEntries.map((entry) => `<li><dl><dt>Day</dt><dd>${escaped(weekdayLabels[entry.dayOfWeek])}</dd><dt>Starts</dt><dd>${escaped(entry.startTime)}</dd><dt>Ends</dt><dd>${escaped(entry.endTime)}</dd><dt>Effective from</dt><dd>${escaped(String(entry.effectiveFrom))}</dd><dt>Effective until</dt><dd>${escaped(String(entry.effectiveUntil))}</dd><dt>Location</dt><dd dir="auto">${escaped(String(entry.location))}</dd></dl></li>`).join("")}</ul></section>`;
}

function studyNotesView(notes) {
  if (!notes || notes.status === "loading") return `<section aria-labelledby="study-notes"><h3 id="study-notes">Notes</h3><p role="status" aria-busy="true">Loading notes…</p></section>`;
  if (notes.status === "error") return `<section aria-labelledby="study-notes"><h3 id="study-notes">Notes</h3><p role="alert">Notes could not be opened. <button class="primary-action" type="button" data-study-subject-notes-retry>Retry</button></p></section>`;
  const projectedNotes = projectStudySubjectNotes(notes.notes);
  if (projectedNotes.length === 0) return `<section aria-labelledby="study-notes"><h3 id="study-notes">Notes</h3><p>No notes are available in local academic data.</p></section>`;
  return `<section aria-labelledby="study-notes"><h3 id="study-notes">Notes</h3><ul class="content-list">${projectedNotes.map((note) => `<li><h4 dir="auto">${escaped(note.title)}</h4><p dir="auto">${escaped(note.body)}</p></li>`).join("")}</ul></section>`;
}

function studyFilesView(files) {
  if (!files || files.status === "loading") return `<section aria-labelledby="study-files"><h3 id="study-files">Files</h3><p role="status" aria-busy="true">Loading files…</p></section>`;
  if (files.status === "error") return `<section aria-labelledby="study-files"><h3 id="study-files">Files</h3><p role="alert">Files could not be opened. <button class="primary-action" type="button" data-study-subject-files-retry>Retry</button></p></section>`;
  const projectedFiles = projectStudySubjectFiles(files.files);
  if (projectedFiles.length === 0) return `<section aria-labelledby="study-files"><h3 id="study-files">Files</h3><p>No files are available in local academic data.</p></section>`;
  return `<section aria-labelledby="study-files"><h3 id="study-files">Files</h3><ul class="content-list">${projectedFiles.map((file) => `<li><h4 dir="auto">${escaped(file.title)}</h4>${file.subtitle ? `<p dir="auto">${escaped(file.subtitle)}</p>` : ""}<button class="secondary-action" type="button" data-study-subject-file-metadata-open="${escaped(file.targetId)}">File information</button></li>`).join("")}</ul></section>`;
}

function studyFileMetadataView(metadata) {
  if (!metadata) return "";
  const close = `<button class="secondary-action" type="button" data-study-subject-file-metadata-close>Close file information</button>`;
  if (metadata.status === "loading") return `<section aria-labelledby="study-file-metadata" aria-busy="true"><h3 id="study-file-metadata">File information</h3><p role="status">Loading file information…</p>${close}</section>`;
  if (metadata.status === "missing") return `<section aria-labelledby="study-file-metadata" role="alert"><h3 id="study-file-metadata">File information</h3><p>File information is unavailable.</p>${close}</section>`;
  if (metadata.status === "error") return `<section aria-labelledby="study-file-metadata" role="alert"><h3 id="study-file-metadata">File information</h3><p>File information could not be opened. <button class="primary-action" type="button" data-study-subject-file-metadata-retry>Retry</button></p>${close}</section>`;
  const file = projectStudySubjectFileMetadata(metadata.fileArtifact);
  return `<section aria-labelledby="study-file-metadata"><h3 id="study-file-metadata">File information</h3><dl><dt>Display name</dt><dd dir="auto">${escaped(file.displayName)}</dd><dt>Original name</dt><dd dir="auto">${escaped(file.originalName)}</dd><dt>Source type</dt><dd dir="auto">${escaped(file.sourceType)}</dd><dt>Archived at</dt><dd>${escaped(String(file.archivedAt))}</dd></dl>${studyFileVersionsView(metadata.versions)}${close}</section>`;
}

function studyFileVersionsView(versions) {
  if (!versions || versions.status === "loading") return `<section aria-labelledby="study-file-versions"><h4 id="study-file-versions">File versions</h4><p role="status" aria-busy="true">Loading file versionsâ€¦</p></section>`;
  if (versions.status === "error") return `<section aria-labelledby="study-file-versions" role="alert"><h4 id="study-file-versions">File versions</h4><p>File versions could not be opened. <button class="primary-action" type="button" data-study-subject-file-versions-retry>Retry</button></p></section>`;
  const projectedVersions = projectStudySubjectFileVersions(versions.versions);
  if (projectedVersions.length === 0) return `<section aria-labelledby="study-file-versions"><h4 id="study-file-versions">File versions</h4><p>No file versions are available.</p></section>`;
  return `<section aria-labelledby="study-file-versions"><h4 id="study-file-versions">File versions</h4><ul class="content-list">${projectedVersions.map((version) => `<li><dl><dt>Version</dt><dd>${escaped(String(version.versionNumber))}</dd><dt>Media type</dt><dd>${escaped(String(version.mediaType))}</dd><dt>Byte size</dt><dd>${escaped(String(version.byteSize))}</dd><dt>Original modified at</dt><dd>${escaped(String(version.originalModifiedAt))}</dd></dl></li>`).join("")}</ul></section>`;
}

function studyView(state = { status: "loading" }) {
  if (state.status === "error") return studyErrorView();
  if (state.status === "ready") return `${studyReadyView(state.subjects)}${studyDetailView(state.detail)}`;
  return studyLoadingView();
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

function librarySearchMarkup(query = "") {
  return `<form class="library-search" data-library-search><label for="library-search-input">Search Library</label><div><input id="library-search-input" data-library-search-input name="query" type="search" value="${escaped(query)}" autocomplete="off"><button class="primary-action" type="submit">Search</button></div></form>`;
}

function libraryLoadingView() {
  return `<section class="screen" aria-busy="true">
    ${pageIntroduction("Local academic data", "Library", "Your canonical resource index, read from this device without opening or changing items.", "Reading local data")}
    <article class="paper-card library-state" role="status"><h2>Loading library…</h2><p>Reading the local resource index without opening files.</p></article>
  </section>`;
}

function libraryErrorView() {
  return `<section class="screen">
    ${pageIntroduction("Local academic data", "Library", "Your canonical resource index, read from this device without opening or changing items.", "Read unavailable")}
    <article class="paper-card library-state" role="alert"><h2>Library could not be opened</h2><p>Library did not open files or create notes. Try the local read again.</p><button class="primary-action" type="button" data-library-retry>Try again</button></article>
  </section>`;
}

function libraryKindLabel(targetKind) {
  return String(targetKind ?? "resource").replaceAll("-", " ");
}

function libraryReadyView(results) {
  const projectedResults = projectLibraryResults(results);
  if (projectedResults.length === 0) {
    return `<section class="screen">${pageIntroduction("Local academic data", "Library", "Your canonical resource index, read from this device without opening or changing items.", "Local data")}<article class="paper-card empty-state"><span class="empty-symbol" aria-hidden="true">＋</span><div><h2>No library items yet</h2><p>No resources are available in the local library index.</p></div></article></section>`;
  }
  const cards = projectedResults.map((result, index) => {
    const headingId = `library-result-${index + 1}`;
    const subtitle = result.subtitle
      ? `<p dir="auto">${escaped(result.subtitle)}</p>`
      : "";
    const openControl = result.targetKind === "note"
      ? `<button class="secondary-action" type="button" data-library-note-open="${escaped(result.targetId)}">Open note</button>`
      : "";
    return `<li><article class="paper-card library-card" aria-labelledby="${headingId}"><span class="eyebrow">${escaped(libraryKindLabel(result.targetKind))}</span><h3 id="${headingId}" dir="auto">${escaped(result.title)}</h3>${subtitle}${openControl}</article></li>`;
  }).join("");
  return `<section class="screen">${pageIntroduction("Local academic data", "Library", "Your canonical resource index, read from this device without opening or changing items.", "Local data")}<section aria-labelledby="library-items"><div class="section-heading"><div><span class="section-number">01</span><h2 id="library-items">Library index</h2></div><span>${projectedResults.length} ${projectedResults.length === 1 ? "item" : "items"}</span></div><ul class="library-grid">${cards}</ul></section></section>`;
}

function libraryNoteDetailView(detail) {
  if (!detail) return "";
  const close = `<button class="secondary-action" type="button" data-library-note-close>Close</button>`;
  if (detail.status === "loading") return `<article class="paper-card library-note-detail" aria-busy="true" role="status"><h2>Loading note…</h2><p>Reading this note without changing it.</p>${close}</article>`;
  if (detail.status === "missing") return `<article class="paper-card library-note-detail" role="alert"><h2>Note is unavailable</h2><p>This note is no longer available in local academic data.</p>${close}</article>`;
  if (detail.status === "error") return `<article class="paper-card library-note-detail" role="alert"><h2>Note could not be opened</h2><p>Try the local read again without changing the note.</p><button class="primary-action" type="button" data-library-note-retry>Retry</button>${close}</article>`;
  const note = projectLibraryNoteDetail(detail.note);
  return `<article class="paper-card library-note-detail" aria-labelledby="library-note-title"><span class="eyebrow">Read-only note${note.pageNumber ? ` · Page ${escaped(note.pageNumber)}` : ""}</span><h2 id="library-note-title" dir="auto">${escaped(note.title)}</h2><p class="note-body" dir="auto">${escaped(note.body)}</p>${close}</article>`;
}

function libraryView(state = { status: "loading" }) {
  const search = librarySearchMarkup(state.query);
  if (state.status === "error") return `${search}${libraryErrorView()}`;
  if (state.status === "ready") return `${search}${libraryReadyView(state.results)}${libraryNoteDetailView(state.detail)}`;
  return `${search}${libraryLoadingView()}`;
}

const viewByDestination = Object.freeze({
  today: todayView,
  study: studyView,
  projects: projectsView,
  practice: practiceView,
  library: libraryView,
});

export function destinationView(destinationId, state) {
  if (destinationId === "today") return todayView(state);
  if (destinationId === "study") return studyView(state);
  if (destinationId === "library") return libraryView(state);
  return (viewByDestination[destinationId] ?? todayView)();
}
