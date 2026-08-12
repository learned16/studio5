import { destinations, routeFromHash, routeHash } from "./routes.mjs";
import { openCanonicalLibraryReadFacade } from "./library-read-facade.mjs";
import { openCanonicalLibraryNoteReadFacade } from "./library-note-read-facade.mjs";
import { openCanonicalStudySubjectsReadFacade } from "./study-subjects-read-facade.mjs";
import { openCanonicalTodayReadFacade } from "./today-read-facade.mjs";
import { destinationView } from "./views.mjs";

const mainContent = document.querySelector("#main-content");
const routeLabel = document.querySelector("#route-label");
const navigationRegions = [...document.querySelectorAll("[data-navigation]")];
let renderVersion = 0;
let libraryDetailRequestVersion = 0;
let librarySearchQuery = "";
let libraryFacadePromise = null;
let libraryNoteFacadePromise = null;
let studyFacadePromise = null;
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
  } catch {
    if (version !== renderVersion || routeFromHash(window.location.hash).id !== "study") return;
    updateRouteContent(destination, destinationView("study", { status: "error" }), focusHeading);
    mainContent.querySelector("[data-study-retry]")?.addEventListener("click", () => {
      renderRoute({ focusHeading: true });
    });
  }
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
