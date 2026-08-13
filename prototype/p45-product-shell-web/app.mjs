import { destinations, routeFromHash, routeHash } from "./routes.mjs";
import { openCanonicalLibraryReadFacade } from "./library-read-facade.mjs";
import { openCanonicalLibraryNoteReadFacade } from "./library-note-read-facade.mjs";
import { openCanonicalStudySubjectsReadFacade } from "./study-subjects-read-facade.mjs";
import { openCanonicalStudySubjectDetailReadFacade } from "./study-subject-detail-read-facade.mjs";
import { openCanonicalStudySubjectLecturesReadFacade } from "./study-subject-lectures-read-facade.mjs";
import { openCanonicalStudySubjectTasksReadFacade } from "./study-subject-tasks-read-facade.mjs";
import { openCanonicalStudySubjectScheduleReadFacade } from "./study-subject-schedule-read-facade.mjs";
import { openCanonicalStudySubjectNotesReadFacade } from "./study-subject-notes-read-facade.mjs";
import { openCanonicalStudySubjectFilesReadFacade } from "./study-subject-files-read-facade.mjs";
import { openCanonicalTodayReadFacade } from "./today-read-facade.mjs";
import { destinationView } from "./views.mjs";

const mainContent = document.querySelector("#main-content");
const routeLabel = document.querySelector("#route-label");
const navigationRegions = [...document.querySelectorAll("[data-navigation]")];
let renderVersion = 0;
let libraryDetailRequestVersion = 0;
let librarySearchQuery = "";
let studyDetailRequestVersion = 0;
let studyTasksRequestVersion = 0;
let studyScheduleRequestVersion = 0;
let studyNotesRequestVersion = 0;
let studyFilesRequestVersion = 0;
let libraryFacadePromise = null;
let libraryNoteFacadePromise = null;
let studyFacadePromise = null;
let studyDetailFacadePromise = null;
let studyLecturesFacadePromise = null;
let studyTasksFacadePromise = null;
let studyScheduleFacadePromise = null;
let studyNotesFacadePromise = null;
let studyFilesFacadePromise = null;
let todayFacadePromise = null;

function navigationLink(destination) {
  return `<a class="navigation-item" href="${routeHash(destination.id)}" data-route="${destination.id}">
    <span class="navigation-glyph" aria-hidden="true">${destination.glyph}</span>
    <span>${destination.label}</span>
  </a>`;
}

function renderNavigation() {
  const navigationMarkup = destinations.map(navigationLink).join("");
  for (const navigation of navigationRegions) navigation.innerHTML = navigationMarkup;
}

function updateSelectedDestination(destinationId) {
  for (const link of document.querySelectorAll("[data-route]")) {
    const isCurrent = link.dataset.route === destinationId;
    link.classList.toggle("is-selected", isCurrent);
    if (isCurrent) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  }
}

function todayFacade() {
  if (!todayFacadePromise) {
    todayFacadePromise = openCanonicalTodayReadFacade().catch((error) => {
      todayFacadePromise = null;
      throw error;
    });
  }
  return todayFacadePromise;
}

function studyFacade() {
  if (!studyFacadePromise) {
    studyFacadePromise = openCanonicalStudySubjectsReadFacade().catch((error) => {
      studyFacadePromise = null;
      throw error;
    });
  }
  return studyFacadePromise;
}

function studyDetailFacade() {
  if (!studyDetailFacadePromise) {
    studyDetailFacadePromise = openCanonicalStudySubjectDetailReadFacade().catch((error) => {
      studyDetailFacadePromise = null;
      throw error;
    });
  }
  return studyDetailFacadePromise;
}

function studyLecturesFacade() {
  if (!studyLecturesFacadePromise) {
    studyLecturesFacadePromise = openCanonicalStudySubjectLecturesReadFacade().catch((error) => {
      studyLecturesFacadePromise = null;
      throw error;
    });
  }
  return studyLecturesFacadePromise;
}

function studyTasksFacade() {
  if (!studyTasksFacadePromise) {
    studyTasksFacadePromise = openCanonicalStudySubjectTasksReadFacade().catch((error) => {
      studyTasksFacadePromise = null;
      throw error;
    });
  }
  return studyTasksFacadePromise;
}

function studyScheduleFacade() {
  if (!studyScheduleFacadePromise) {
    studyScheduleFacadePromise = openCanonicalStudySubjectScheduleReadFacade().catch((error) => {
      studyScheduleFacadePromise = null;
      throw error;
    });
  }
  return studyScheduleFacadePromise;
}

function studyNotesFacade() {
  if (!studyNotesFacadePromise) {
    studyNotesFacadePromise = openCanonicalStudySubjectNotesReadFacade().catch((error) => {
      studyNotesFacadePromise = null;
      throw error;
    });
  }
  return studyNotesFacadePromise;
}

function studyFilesFacade() {
  if (!studyFilesFacadePromise) {
    studyFilesFacadePromise = openCanonicalStudySubjectFilesReadFacade().catch((error) => {
      studyFilesFacadePromise = null;
      throw error;
    });
  }
  return studyFilesFacadePromise;
}

function libraryFacade() {
  if (!libraryFacadePromise) {
    libraryFacadePromise = openCanonicalLibraryReadFacade().catch((error) => {
      libraryFacadePromise = null;
      throw error;
    });
  }
  return libraryFacadePromise;
}

function libraryNoteFacade() {
  if (!libraryNoteFacadePromise) {
    libraryNoteFacadePromise = openCanonicalLibraryNoteReadFacade().catch((error) => {
      libraryNoteFacadePromise = null;
      throw error;
    });
  }
  return libraryNoteFacadePromise;
}

function todayQueryOptions() {
  const now = Date.now();
  return {
    now,
    utcOffsetMinutes: -new Date(now).getTimezoneOffset(),
  };
}

function updateRouteContent(destination, content, focusHeading) {
  mainContent.innerHTML = content;
  routeLabel.textContent = destination.label;
  document.title = `${destination.label} — Studio5`;
  updateSelectedDestination(destination.id);
  if (focusHeading) mainContent.querySelector("h1")?.focus();
}

async function renderToday(destination, version, focusHeading) {
  try {
    const facade = await todayFacade();
    const projection = await facade.query(todayQueryOptions());
    if (version !== renderVersion || routeFromHash(window.location.hash).id !== "today") return;
    updateRouteContent(destination, destinationView("today", {
      status: "ready",
      projection,
    }), focusHeading);
  } catch {
    if (version !== renderVersion || routeFromHash(window.location.hash).id !== "today") return;
    updateRouteContent(destination, destinationView("today", { status: "error" }), focusHeading);
    mainContent.querySelector("[data-today-retry]")?.addEventListener("click", () => {
      renderRoute({ focusHeading: true });
    });
  }
}

async function renderStudy(destination, version, focusHeading) {
  try {
    const facade = await studyFacade();
    const subjects = await facade.list();
    if (version !== renderVersion || routeFromHash(window.location.hash).id !== "study") return;
    updateRouteContent(destination, destinationView("study", {
      status: "ready",
      subjects,
    }), focusHeading);
    bindStudyDetailActions(destination, version, focusHeading, subjects);
  } catch {
    if (version !== renderVersion || routeFromHash(window.location.hash).id !== "study") return;
    updateRouteContent(destination, destinationView("study", { status: "error" }), focusHeading);
    mainContent.querySelector("[data-study-retry]")?.addEventListener("click", () => {
      renderRoute({ focusHeading: true });
    });
  }
}

function bindStudyDetailActions(destination, version, focusHeading, subjects) {
  for (const button of mainContent.querySelectorAll("[data-study-subject-open]")) {
    button.addEventListener("click", () => void renderStudyDetail(destination, version, focusHeading, subjects, button.dataset.studySubjectOpen));
  }
}

function bindStudyDetailControls(destination, version, focusHeading, subjects, subjectId, studyDetailContext) {
  mainContent.querySelector("[data-study-subject-close]")?.addEventListener("click", () => {
    studyDetailRequestVersion += 1;
    studyTasksRequestVersion += 1;
    studyScheduleRequestVersion += 1;
    studyNotesRequestVersion += 1;
    studyFilesRequestVersion += 1;
    updateRouteContent(destination, destinationView("study", { status: "ready", subjects }), focusHeading);
    bindStudyDetailActions(destination, version, focusHeading, subjects);
  });
  mainContent.querySelector("[data-study-subject-retry]")?.addEventListener("click", () => void renderStudyDetail(destination, version, focusHeading, subjects, subjectId));
  mainContent.querySelector("[data-study-subject-tasks-retry]")?.addEventListener("click", () => {
    void renderStudyTasks(studyDetailContext);
  });
  mainContent.querySelector("[data-study-subject-schedule-retry]")?.addEventListener("click", () => {
    void renderStudySchedule(studyDetailContext);
  });
  mainContent.querySelector("[data-study-subject-notes-retry]")?.addEventListener("click", () => {
    void renderStudyNotes(studyDetailContext);
  });
  mainContent.querySelector("[data-study-subject-files-retry]")?.addEventListener("click", () => {
    void renderStudyFiles(studyDetailContext);
  });
}

function renderStudyDetailState(studyDetailContext) {
  const { destination, version, focusHeading, subjects, subjectId, detail } = studyDetailContext;
  updateRouteContent(destination, destinationView("study", {
    status: "ready",
    subjects,
    detail,
  }), focusHeading);
  bindStudyDetailActions(destination, version, focusHeading, subjects);
  bindStudyDetailControls(destination, version, focusHeading, subjects, subjectId, studyDetailContext);
}

async function renderStudyDetail(destination, version, focusHeading, subjects, subjectId) {
  const requestVersion = studyDetailRequestVersion + 1;
  studyDetailRequestVersion = requestVersion;
  updateRouteContent(destination, destinationView("study", { status: "ready", subjects, detail: { status: "loading" } }), focusHeading);
  bindStudyDetailActions(destination, version, focusHeading, subjects);
  bindStudyDetailControls(destination, version, focusHeading, subjects, subjectId);
  try {
    const subject = await (await studyDetailFacade()).getSubject(subjectId);
    if (requestVersion !== studyDetailRequestVersion || version !== renderVersion || routeFromHash(window.location.hash).id !== "study") return;
    if (!subject) {
      updateRouteContent(destination, destinationView("study", { status: "ready", subjects, detail: { status: "missing" } }), focusHeading);
      bindStudyDetailActions(destination, version, focusHeading, subjects);
      bindStudyDetailControls(destination, version, focusHeading, subjects, subjectId);
      return;
    }
    const studyDetailContext = {
      destination, version, focusHeading, subjects, subjectId, subject, requestVersion,
      detail: { status: "ready", subject, lectures: { status: "loading" }, tasks: { status: "loading" }, schedule: { status: "loading" }, notes: { status: "loading" }, files: { status: "loading" } },
    };
    renderStudyDetailState(studyDetailContext);
    void renderStudyTasks(studyDetailContext);
    void renderStudySchedule(studyDetailContext);
    void renderStudyNotes(studyDetailContext);
    void renderStudyFiles(studyDetailContext);
    await renderStudyLectures(studyDetailContext);
  } catch {
    if (requestVersion !== studyDetailRequestVersion || version !== renderVersion || routeFromHash(window.location.hash).id !== "study") return;
    updateRouteContent(destination, destinationView("study", { status: "ready", subjects, detail: { status: "error" } }), focusHeading);
    bindStudyDetailActions(destination, version, focusHeading, subjects);
    bindStudyDetailControls(destination, version, focusHeading, subjects, subjectId);
  }
}

async function renderStudyLectures(studyDetailContext) {
  const { destination, version, focusHeading, subjects, subjectId, subject, requestVersion, detail } = studyDetailContext;
  try {
    const lectures = await (await studyLecturesFacade()).listLectures({ subjectId: subject.id });
    if (requestVersion !== studyDetailRequestVersion || version !== renderVersion || routeFromHash(window.location.hash).id !== "study") return;
    detail.lectures = { status: "ready", lectures };
  } catch {
    if (requestVersion !== studyDetailRequestVersion || version !== renderVersion || routeFromHash(window.location.hash).id !== "study") return;
    detail.lectures = { status: "error" };
  }
  renderStudyDetailState(studyDetailContext);
}

async function renderStudyTasks(studyDetailContext) {
  const { destination, version, focusHeading, subjects, subjectId, subject, requestVersion, detail } = studyDetailContext;
  const tasksRequestVersion = studyTasksRequestVersion + 1;
  studyTasksRequestVersion = tasksRequestVersion;
  detail.tasks = { status: "loading" };
  renderStudyDetailState(studyDetailContext);
  try {
    const tasks = await (await studyTasksFacade()).listTasks({ subjectId: subject.id });
    if (tasksRequestVersion !== studyTasksRequestVersion || requestVersion !== studyDetailRequestVersion || version !== renderVersion || routeFromHash(window.location.hash).id !== "study") return;
    detail.tasks = { status: "ready", tasks };
  } catch {
    if (tasksRequestVersion !== studyTasksRequestVersion || requestVersion !== studyDetailRequestVersion || version !== renderVersion || routeFromHash(window.location.hash).id !== "study") return;
    detail.tasks = { status: "error" };
  }
  renderStudyDetailState(studyDetailContext);
}

async function renderStudySchedule(studyDetailContext) {
  const { destination, version, focusHeading, subjects, subject, requestVersion, detail } = studyDetailContext;
  const scheduleRequestVersion = studyScheduleRequestVersion + 1;
  studyScheduleRequestVersion = scheduleRequestVersion;
  detail.schedule = { status: "loading" };
  renderStudyDetailState(studyDetailContext);
  try {
    const entries = await (await studyScheduleFacade()).listScheduleEntries({ subjectId: subject.id });
    if (scheduleRequestVersion !== studyScheduleRequestVersion || requestVersion !== studyDetailRequestVersion || version !== renderVersion || routeFromHash(window.location.hash).id !== "study") return;
    detail.schedule = { status: "ready", entries };
  } catch {
    if (scheduleRequestVersion !== studyScheduleRequestVersion || requestVersion !== studyDetailRequestVersion || version !== renderVersion || routeFromHash(window.location.hash).id !== "study") return;
    detail.schedule = { status: "error" };
  }
  renderStudyDetailState(studyDetailContext);
}

async function renderStudyNotes(studyDetailContext) {
  const { destination, version, focusHeading, subjects, subject, requestVersion, detail } = studyDetailContext;
  const notesRequestVersion = studyNotesRequestVersion + 1;
  studyNotesRequestVersion = notesRequestVersion;
  detail.notes = { status: "loading" };
  renderStudyDetailState(studyDetailContext);
  try {
    const notes = await (await studyNotesFacade()).listNotes({ subjectId: subject.id });
    if (notesRequestVersion !== studyNotesRequestVersion || requestVersion !== studyDetailRequestVersion || version !== renderVersion || routeFromHash(window.location.hash).id !== "study") return;
    detail.notes = { status: "ready", notes };
  } catch {
    if (notesRequestVersion !== studyNotesRequestVersion || requestVersion !== studyDetailRequestVersion || version !== renderVersion || routeFromHash(window.location.hash).id !== "study") return;
    detail.notes = { status: "error" };
  }
  renderStudyDetailState(studyDetailContext);
}

async function renderStudyFiles(studyDetailContext) {
  const { destination, version, focusHeading, subjects, subject, requestVersion, detail } = studyDetailContext;
  const filesRequestVersion = studyFilesRequestVersion + 1;
  studyFilesRequestVersion = filesRequestVersion;
  detail.files = { status: "loading" };
  renderStudyDetailState(studyDetailContext);
  try {
    const files = await (await studyFilesFacade()).listFiles({ subjectId: subject.id });
    if (filesRequestVersion !== studyFilesRequestVersion || requestVersion !== studyDetailRequestVersion || version !== renderVersion || routeFromHash(window.location.hash).id !== "study") return;
    detail.files = { status: "ready", files };
  } catch {
    if (filesRequestVersion !== studyFilesRequestVersion || requestVersion !== studyDetailRequestVersion || version !== renderVersion || routeFromHash(window.location.hash).id !== "study") return;
    detail.files = { status: "error" };
  }
  renderStudyDetailState(studyDetailContext);
}

async function renderLibrary(destination, version, focusHeading, query = librarySearchQuery) {
  try {
    const facade = await libraryFacade();
    const results = await facade.searchLibrary({ query, limit: 50 });
    if (version !== renderVersion || routeFromHash(window.location.hash).id !== "library") return;
    updateRouteContent(destination, destinationView("library", {
      status: "ready",
      results,
      query,
    }), focusHeading);
    bindLibraryNoteActions(destination, version, focusHeading, results);
    bindLibrarySearch(destination, focusHeading);
  } catch {
    if (version !== renderVersion || routeFromHash(window.location.hash).id !== "library") return;
    updateRouteContent(destination, destinationView("library", { status: "error", query }), focusHeading);
    bindLibrarySearch(destination, focusHeading);
    mainContent.querySelector("[data-library-retry]")?.addEventListener("click", () => {
      renderLibrarySearch(destination, focusHeading, query);
    });
  }
}

function bindLibrarySearch(destination, focusHeading) {
  mainContent.querySelector("[data-library-search]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const query = mainContent.querySelector("[data-library-search-input]")?.value ?? "";
    renderLibrarySearch(destination, focusHeading, query);
  });
}

function renderLibrarySearch(destination, focusHeading, query) {
  librarySearchQuery = query;
  renderVersion += 1;
  updateRouteContent(destination, destinationView("library", { status: "loading", query }), focusHeading);
  bindLibrarySearch(destination, focusHeading);
  void renderLibrary(destination, renderVersion, focusHeading, query);
}

function bindLibraryNoteActions(destination, version, focusHeading, results) {
  for (const button of mainContent.querySelectorAll("[data-library-note-open]")) {
    button.addEventListener("click", () => {
      void renderLibraryNoteDetail(destination, version, focusHeading, results, button.dataset.libraryNoteOpen);
    });
  }
}

function bindLibraryDetailControls(destination, version, focusHeading, results, noteId) {
  mainContent.querySelector("[data-library-note-close]")?.addEventListener("click", () => {
    libraryDetailRequestVersion += 1;
    updateRouteContent(destination, destinationView("library", { status: "ready", results, query: librarySearchQuery }), focusHeading);
    bindLibraryNoteActions(destination, version, focusHeading, results);
    bindLibrarySearch(destination, focusHeading);
  });
  mainContent.querySelector("[data-library-note-retry]")?.addEventListener("click", () => {
    void renderLibraryNoteDetail(destination, version, focusHeading, results, noteId);
  });
}

async function renderLibraryNoteDetail(destination, version, focusHeading, results, noteId) {
  if (version !== renderVersion || routeFromHash(window.location.hash).id !== "library") return;
  const requestVersion = libraryDetailRequestVersion + 1;
  libraryDetailRequestVersion = requestVersion;
  updateRouteContent(destination, destinationView("library", { status: "ready", results, query: librarySearchQuery, detail: { status: "loading" } }), focusHeading);
  bindLibraryNoteActions(destination, version, focusHeading, results);
  bindLibrarySearch(destination, focusHeading);
  bindLibraryDetailControls(destination, version, focusHeading, results, noteId);
  try {
    const note = await (await libraryNoteFacade()).getNote(noteId);
    if (requestVersion !== libraryDetailRequestVersion || version !== renderVersion || routeFromHash(window.location.hash).id !== "library") return;
    updateRouteContent(destination, destinationView("library", { status: "ready", results, query: librarySearchQuery, detail: { status: note ? "ready" : "missing", note } }), focusHeading);
  } catch {
    if (requestVersion !== libraryDetailRequestVersion || version !== renderVersion || routeFromHash(window.location.hash).id !== "library") return;
    updateRouteContent(destination, destinationView("library", { status: "ready", results, query: librarySearchQuery, detail: { status: "error" } }), focusHeading);
  }
  bindLibraryNoteActions(destination, version, focusHeading, results);
  bindLibrarySearch(destination, focusHeading);
  bindLibraryDetailControls(destination, version, focusHeading, results, noteId);
}

function renderRoute({ focusHeading = false } = {}) {
  const destination = routeFromHash(window.location.hash);
  renderVersion += 1;
  studyDetailRequestVersion += 1;
  studyTasksRequestVersion += 1;
  studyScheduleRequestVersion += 1;
  studyNotesRequestVersion += 1;
  studyFilesRequestVersion += 1;
  if (destination.id === "today") {
    updateRouteContent(destination, destinationView("today", { status: "loading" }), focusHeading);
    void renderToday(destination, renderVersion, focusHeading);
    return;
  }
  if (destination.id === "study") {
    updateRouteContent(destination, destinationView("study", { status: "loading" }), focusHeading);
    void renderStudy(destination, renderVersion, focusHeading);
    return;
  }
  if (destination.id === "library") {
    librarySearchQuery = "";
    updateRouteContent(destination, destinationView("library", { status: "loading", query: librarySearchQuery }), focusHeading);
    bindLibrarySearch(destination, focusHeading);
    void renderLibrary(destination, renderVersion, focusHeading, librarySearchQuery);
    return;
  }
  updateRouteContent(destination, destinationView(destination.id), focusHeading);
}

function focusAdjacentLink(event) {
  const activeLink = event.target.closest("[data-route]");
  if (!activeLink) return;
  const links = [...event.currentTarget.querySelectorAll("[data-route]")];
  const currentIndex = links.indexOf(activeLink);
  const indexByKey = {
    ArrowDown: (currentIndex + 1) % links.length,
    ArrowRight: (currentIndex + 1) % links.length,
    ArrowUp: (currentIndex - 1 + links.length) % links.length,
    ArrowLeft: (currentIndex - 1 + links.length) % links.length,
    Home: 0,
    End: links.length - 1,
  };
  if (!(event.key in indexByKey)) return;
  event.preventDefault();
  links[indexByKey[event.key]].focus();
}

renderNavigation();
for (const navigation of navigationRegions) navigation.addEventListener("keydown", focusAdjacentLink);

if (!window.location.hash) history.replaceState(null, "", routeHash("today"));
renderRoute();
window.addEventListener("hashchange", () => renderRoute({ focusHeading: true }));
