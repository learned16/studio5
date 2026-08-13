import { readFile, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, relative, resolve, sep } from "node:path";
import assert from "node:assert/strict";

const assets = new URL("../dist/assets/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
};

async function builtFile(pathname) {
  const candidate = resolve(assets, pathname === "/" ? "index.html" : pathname.slice(1));
  const candidateRelativePath = relative(assets, candidate);
  if (candidateRelativePath === ".." || candidateRelativePath.startsWith(`..${sep}`)) return null;
  try {
    if ((await stat(candidate)).isFile()) return candidate;
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  return join(assets, "404.html");
}

class SmokeLink {
  constructor(destinationId) {
    this.dataset = { route: destinationId };
    this.attributes = new Map();
    this.classList = { toggle() {} };
  }

  setAttribute(name, content) {
    this.attributes.set(name, content);
  }

  removeAttribute(name) {
    this.attributes.delete(name);
  }
}

class SmokeNavigation {
  links = [];

  set innerHTML(markup) {
    this.links = [...markup.matchAll(/data-route="([^"]+)"/g)]
      .map((match) => new SmokeLink(match[1]));
  }

  addEventListener() {}

  querySelectorAll(selector) {
    return selector === "[data-route]" ? this.links : [];
  }
}

class SmokeButton {
  listener = null;

  addEventListener(eventName, listener) {
    if (eventName === "click") this.listener = listener;
  }

  click() {
    assert.equal(typeof this.listener, "function", "retry listener was not attached");
    this.listener();
  }
}

class SmokeSearchForm {
  listener = null;

  constructor(value) {
    this.input = { value };
  }

  addEventListener(eventName, listener) {
    if (eventName === "submit") this.listener = listener;
  }

  submit(value) {
    this.input.value = value;
    assert.equal(typeof this.listener, "function", "search listener was not attached");
    this.listener({ preventDefault() {} });
  }
}

class SmokeMainContent {
  markup = "";
  focusedHeading = null;
  retryButtons = new Map();

  get innerHTML() {
    return this.markup;
  }

  set innerHTML(markup) {
    this.markup = markup;
    this.retryButtons = new Map();
    for (const selector of [
      "[data-library-retry]",
      "[data-study-retry]",
      "[data-today-retry]",
    ]) {
      const attribute = selector.slice(1, -1);
      if (markup.includes(attribute)) this.retryButtons.set(selector, new SmokeButton());
    }
    this.noteButtons = [...markup.matchAll(/data-library-note-open="([^"]+)"/g)]
      .map((match) => {
        const button = new SmokeButton();
        button.dataset = { libraryNoteOpen: match[1] };
        return button;
      });
    this.subjectButtons = [...markup.matchAll(/data-study-subject-open="([^"]+)"/g)].map((match) => {
      const button = new SmokeButton();
      button.dataset = { studySubjectOpen: match[1] };
      return button;
    });
    for (const selector of ["[data-library-note-retry]", "[data-library-note-close]", "[data-study-subject-retry]", "[data-study-subject-close]"]) {
      const attribute = selector.slice(1, -1);
      if (markup.includes(attribute)) this.retryButtons.set(selector, new SmokeButton());
    }
    const searchValue = markup.match(/data-library-search-input[^>]*value="([^"]*)"/)?.[1];
    this.searchForm = searchValue === undefined ? null : new SmokeSearchForm(searchValue);
  }

  querySelector(selector) {
    if (this.retryButtons.has(selector)) return this.retryButtons.get(selector);
    if (selector === "h1") {
      return { focus: () => {
        this.focusedHeading = this.markup.match(/<h1[^>]*>([^<]+)<\/h1>/)?.[1] ?? null;
      } };
    }
    if (selector === "[data-library-search]") return this.searchForm;
    if (selector === "[data-library-search-input]") return this.searchForm?.input ?? null;
    return null;
  }

  querySelectorAll(selector) {
    if (selector === "[data-library-note-open]") return this.noteButtons;
    if (selector === "[data-study-subject-open]") return this.subjectButtons;
    return [];
  }
}

class SmokeIndexedDatabase {
  constructor() {
    this.stores = new Map();
    this.objectStoreNames = { contains: (name) => this.stores.has(name) };
  }

  createObjectStore(name) {
    const records = new Map();
    this.stores.set(name, records);
    return records;
  }

  transaction(storeName) {
    const transaction = {
      error: null,
      objectStore: () => ({
        get: (key) => {
          const request = {};
          queueMicrotask(() => {
            request.result = this.stores.get(storeName)?.get(key);
            request.onsuccess?.();
            transaction.oncomplete?.();
          });
          return request;
        },
      }),
    };
    return transaction;
  }

  close() {}
}

function smokeIndexedDB() {
  const databases = new Map();
  return {
    open(name) {
      const request = {};
      queueMicrotask(() => {
        const isNew = !databases.has(name);
        if (isNew) databases.set(name, new SmokeIndexedDatabase());
        request.result = databases.get(name);
        if (isNew) request.onupgradeneeded?.();
        request.onsuccess?.();
      });
      return request;
    },
  };
}

function builtDomHarness() {
  const mainContent = new SmokeMainContent();
  const routeLabel = { textContent: "" };
  const navigations = [new SmokeNavigation(), new SmokeNavigation()];
  const location = { hash: "" };
  const listeners = new Map();
  return {
    document: smokeDocument(mainContent, routeLabel, navigations),
    history: { replaceState: (_state, _title, hash) => { location.hash = hash; } },
    mainContent,
    navigations,
    routeLabel,
    window: {
      location,
      addEventListener: (eventName, listener) => listeners.set(eventName, listener),
    },
    navigate: (hash) => {
      location.hash = hash;
      listeners.get("hashchange")();
    },
  };
}

function smokeDocument(mainContent, routeLabel, navigations) {
  return {
    title: "",
    querySelector: (selector) => ({ "#main-content": mainContent, "#route-label": routeLabel })[selector],
    querySelectorAll: (selector) => selector === "[data-navigation]"
      ? navigations
      : navigations.flatMap((navigation) => navigation.links),
  };
}

async function waitForMarkup(mainContent, expected) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (mainContent.innerHTML.includes(expected)) return;
    await new Promise((resolveWaiting) => setTimeout(resolveWaiting, 0));
  }
  throw new Error(`Built route did not render: ${expected}`);
}

function deferredNoteRead(noteId) {
  let resolve;
  const promise = new Promise((resolveRead) => { resolve = resolveRead; });
  return { noteId, promise, resolve };
}

async function verifyBuiltNavigation() {
  const harness = builtDomHarness();
  const fixedInstant = Date.parse("2026-08-11T08:15:00.000Z");
  const libraryCallArguments = [];
  const queryOptions = [];
  const subjectCallArguments = [];
  const { AcademicRepository } = await import(
    new URL("../dist/assets/core/academic-repository.mjs", import.meta.url)
  );
  const originalQueryToday = AcademicRepository.prototype.queryToday;
  const originalSearchLibrary = AcademicRepository.prototype.searchLibrary;
  const originalGetNote = AcademicRepository.prototype.getNote;
  const originalListSubjects = AcademicRepository.prototype.listSubjects;
  const originalGetSubject = AcademicRepository.prototype.getSubject;
  const originalListLectures = AcademicRepository.prototype.listLectures;
  const originalInitialize = AcademicRepository.prototype.initialize;
  const originalDateNow = Date.now;
  const originalTimezoneOffset = Date.prototype.getTimezoneOffset;
  AcademicRepository.prototype.queryToday = function queryToday(options) {
    queryOptions.push(structuredClone(options));
    if (queryOptions.length === 1) return Promise.reject(new Error("controlled read failure"));
    return Promise.resolve({
      date: "2026-08-11",
      utcOffsetMinutes: options.utcOffsetMinutes,
      agenda: [{
        id: "lecture:hostile",
        title: '<img src=x onerror="unsafe()"> & مراجعة',
        startsAt: "2026-08-11T09:00:00.000Z",
        subject: { title: "Structures & Safety" },
      }],
      tasks: { overdue: [], dueToday: [], unscheduled: [], completedToday: [] },
    });
  };
  AcademicRepository.prototype.listSubjects = function listSubjects(...args) {
    subjectCallArguments.push(structuredClone(args));
    if (subjectCallArguments.length === 1) {
      return Promise.reject(new Error("controlled subject read failure"));
    }
    return Promise.resolve([
      { id: "subject:1", title: "Structures & Safety" },
      { id: "subject:2", title: '<img src=x onerror="unsafe()"> & مراجعة' },
    ]);
  };
  const pendingSubjects = [];
  let failNextSubjectInitialize = false;
  AcademicRepository.prototype.initialize = function initialize(...args) {
    if (failNextSubjectInitialize) {
      failNextSubjectInitialize = false;
      return Promise.reject(new Error("controlled subject detail initialization failure"));
    }
    return originalInitialize.apply(this, args);
  };
  AcademicRepository.prototype.getSubject = function getSubject(id) {
    let resolve;
    const promise = new Promise((resolveRead) => { resolve = resolveRead; });
    pendingSubjects.push({ id, resolve });
    return promise;
  };
  AcademicRepository.prototype.listLectures = function listLectures(options) {
    assert.deepEqual(options, { subjectId: "subject:1" });
    return Promise.resolve([{
      id: "lecture:1",
      title: '<img src=x onerror="unsafe()"> & Lecture',
      startsAt: "2026-09-07T09:00:00+03:00",
      endsAt: "2026-09-07T10:00:00+03:00",
      status: "planned",
    }]);
  };
  AcademicRepository.prototype.searchLibrary = function searchLibrary(options) {
    libraryCallArguments.push(structuredClone(options));
    if (libraryCallArguments.length === 1) {
      return Promise.reject(new Error("controlled library read failure"));
    }
    return Promise.resolve([
      {
        targetKind: "file-artifact",
        targetId: "file-artifact:hostile",
        title: '<img src=x onerror="unsafe()"> & مرجع',
        subtitle: '<script>alert("unsafe")</script> & مصدر',
      },
      {
        targetKind: "note",
        targetId: "note:second",
        title: "Second canonical result",
        subtitle: null,
      },
      {
        targetKind: "note",
        targetId: "note:third",
        title: "Third canonical result",
        subtitle: null,
      },
    ]);
  };
  const pendingNoteReads = [];
  let noteReadCount = 0;
  AcademicRepository.prototype.getNote = function getNote(noteId) {
    noteReadCount += 1;
    if (noteReadCount === 1) return Promise.reject(new Error("controlled note read failure"));
    if (noteReadCount > 2) {
      const pendingRead = deferredNoteRead(noteId);
      pendingNoteReads.push(pendingRead);
      return pendingRead.promise;
    }
    return Promise.resolve({
      id: noteId,
      title: '<img src=x onerror="unsafe()"> & ملاحظة',
      body: '<script>alert("unsafe")</script> & نص',
      pageNumber: 3,
    });
  };
  Date.now = () => fixedInstant;
  Date.prototype.getTimezoneOffset = () => -180;
  globalThis.document = harness.document;
  globalThis.history = harness.history;
  globalThis.indexedDB = smokeIndexedDB();
  globalThis.window = harness.window;
  try {
    await import(new URL("../dist/assets/app.mjs", import.meta.url));
    await waitForMarkup(harness.mainContent, "Today could not be opened");
    harness.mainContent.querySelector("[data-today-retry]").click();
    await waitForMarkup(harness.mainContent, "&lt;img src=x onerror=&quot;unsafe()&quot;&gt;");
    assert.deepEqual(queryOptions, [
      { now: fixedInstant, utcOffsetMinutes: 180 },
      { now: fixedInstant, utcOffsetMinutes: 180 },
    ]);
    assert.doesNotMatch(harness.mainContent.innerHTML, /<img src=x/);
    assert.match(
      harness.mainContent.innerHTML,
      /dir="auto"><strong>&lt;img src=x onerror=&quot;unsafe\(\)&quot;&gt; &amp; مراجعة/,
    );
    for (const navigation of harness.navigations) {
      const todayLinks = navigation.links.filter(
        (link) => link.attributes.get("aria-current") === "page",
      );
      assert.deepEqual(todayLinks.map((link) => link.dataset.route), ["today"]);
    }

    harness.navigate("#/study");
    await waitForMarkup(harness.mainContent, "Subjects could not be opened");
    harness.mainContent.querySelector("[data-study-retry]").click();
    await waitForMarkup(harness.mainContent, "&lt;img src=x onerror=&quot;unsafe()&quot;&gt;");
    assert.deepEqual(subjectCallArguments, [[], []]);
    assert.doesNotMatch(harness.mainContent.innerHTML, /<img src=x/);
    assert.match(
      harness.mainContent.innerHTML,
      /dir="auto">&lt;img src=x onerror=&quot;unsafe\(\)&quot;&gt; &amp; مراجعة/,
    );
    failNextSubjectInitialize = true;
    harness.mainContent.querySelectorAll("[data-study-subject-open]")[0].click();
    await waitForMarkup(harness.mainContent, "Subject could not be opened");
    harness.mainContent.querySelector("[data-study-subject-retry]").click();
    await waitForMarkup(harness.mainContent, "Loading subject");
    await new Promise((resolveWaiting) => setTimeout(resolveWaiting, 0));
    pendingSubjects.shift().resolve({ id: "subject:1", title: "Ready subject", code: "S1" });
    await waitForMarkup(harness.mainContent, "Ready subject");
    await waitForMarkup(harness.mainContent, "2026-09-07T09:00:00+03:00");
    assert.match(harness.mainContent.innerHTML, /dir="auto">&lt;img src=x onerror=&quot;unsafe\(\)&quot;&gt; &amp; Lecture/);
    harness.mainContent.querySelector("[data-study-subject-close]").click();
    harness.mainContent.querySelectorAll("[data-study-subject-open]")[0].click();
    await new Promise((resolveWaiting) => setTimeout(resolveWaiting, 0));
    pendingSubjects.shift().resolve(null);
    await waitForMarkup(harness.mainContent, "Subject is unavailable");
    harness.mainContent.querySelector("[data-study-subject-close]").click();
    harness.mainContent.querySelectorAll("[data-study-subject-open]")[0].click();
    await waitForMarkup(harness.mainContent, "Loading subject");
    harness.mainContent.querySelector("[data-study-subject-close]").click();
    await new Promise((resolveWaiting) => setTimeout(resolveWaiting, 0));
    pendingSubjects.shift().resolve({ id: "subject:1", title: "Stale subject", code: "S1" });
    await new Promise((resolveWaiting) => setTimeout(resolveWaiting, 0));
    assert.doesNotMatch(harness.mainContent.innerHTML, /Stale subject/);
    harness.mainContent.querySelectorAll("[data-study-subject-open]")[0].click();
    harness.mainContent.querySelectorAll("[data-study-subject-open]")[1].click();
    await new Promise((resolveWaiting) => setTimeout(resolveWaiting, 0));
    pendingSubjects.shift().resolve({ id: "subject:1", title: "First stale subject", code: "S1" });
    await new Promise((resolveWaiting) => setTimeout(resolveWaiting, 0));
    assert.doesNotMatch(harness.mainContent.innerHTML, /First stale subject/);
    pendingSubjects.shift().resolve({ id: "subject:2", title: "Current subject", code: "S2" });
    await waitForMarkup(harness.mainContent, "Current subject");
    for (const navigation of harness.navigations) {
      const studyLinks = navigation.links.filter(
        (link) => link.attributes.get("aria-current") === "page",
      );
      assert.deepEqual(studyLinks.map((link) => link.dataset.route), ["study"]);
    }

    harness.navigate("#/library");
    await waitForMarkup(harness.mainContent, "Library could not be opened");
    harness.mainContent.querySelector("[data-library-search]").submit("second");
    await waitForMarkup(harness.mainContent, "Second canonical result");
    assert.deepEqual(libraryCallArguments, [
      { query: "", limit: 50 },
      { query: "second", limit: 50 },
    ]);
    harness.mainContent.querySelectorAll("[data-library-note-open]")[0].click();
    await waitForMarkup(harness.mainContent, "Note could not be opened");
    harness.mainContent.querySelector("[data-library-note-retry]").click();
    await waitForMarkup(harness.mainContent, "Page 3");
    assert.doesNotMatch(harness.mainContent.innerHTML, /<img src=x|<script>/);
    assert.match(harness.mainContent.innerHTML, /class="note-body" dir="auto">&lt;script/);
    harness.mainContent.querySelector("[data-library-note-close]").click();
    await waitForMarkup(harness.mainContent, "Second canonical result");
    harness.mainContent.querySelectorAll("[data-library-note-open]")[0].click();
    await waitForMarkup(harness.mainContent, "Loading note");
    harness.mainContent.querySelector("[data-library-note-close]").click();
    pendingNoteReads.shift().resolve({ id: "note:second", title: "Closed stale note", body: "stale" });
    await new Promise((resolveWaiting) => setTimeout(resolveWaiting, 0));
    assert.doesNotMatch(harness.mainContent.innerHTML, /Closed stale note/);
    assert.match(harness.mainContent.innerHTML, /Second canonical result/);
    harness.mainContent.querySelectorAll("[data-library-note-open]")[0].click();
    await waitForMarkup(harness.mainContent, "Loading note");
    harness.mainContent.querySelectorAll("[data-library-note-open]")[1].click();
    pendingNoteReads.shift().resolve({ id: "note:second", title: "First stale note", body: "stale" });
    await new Promise((resolveWaiting) => setTimeout(resolveWaiting, 0));
    assert.doesNotMatch(harness.mainContent.innerHTML, /First stale note/);
    assert.match(harness.mainContent.innerHTML, /Loading note/);
    pendingNoteReads.shift().resolve({ id: "note:third", title: "Current note", body: "current" });
    await waitForMarkup(harness.mainContent, "Current note");
    assert.doesNotMatch(harness.mainContent.innerHTML, /<img src=x|<script>/);
    assert.match(
      harness.mainContent.innerHTML,
      /dir="auto">&lt;img src=x onerror=&quot;unsafe\(\)&quot;&gt; &amp; مرجع/,
    );
    assert.match(
      harness.mainContent.innerHTML,
      /dir="auto">&lt;script&gt;alert\(&quot;unsafe&quot;\)&lt;\/script&gt; &amp; مصدر/,
    );
    for (const navigation of harness.navigations) {
      const libraryLinks = navigation.links.filter(
        (link) => link.attributes.get("aria-current") === "page",
      );
      assert.deepEqual(libraryLinks.map((link) => link.dataset.route), ["library"]);
    }

    for (const destinationId of ["projects", "practice"]) {
      harness.navigate(`#/${destinationId}`);
      const expectedLabel = `${destinationId[0].toUpperCase()}${destinationId.slice(1)}`;
      assert.match(harness.mainContent.innerHTML, new RegExp(`<h1[^>]*>${expectedLabel}</h1>`));
      assert.equal(harness.routeLabel.textContent, expectedLabel);
      assert.equal(harness.mainContent.focusedHeading, expectedLabel);
      for (const navigation of harness.navigations) {
        const currentLinks = navigation.links.filter(
          (link) => link.attributes.get("aria-current") === "page",
        );
        assert.deepEqual(currentLinks.map((link) => link.dataset.route), [destinationId]);
      }
    }
  } finally {
    AcademicRepository.prototype.queryToday = originalQueryToday;
    AcademicRepository.prototype.searchLibrary = originalSearchLibrary;
    AcademicRepository.prototype.getNote = originalGetNote;
    AcademicRepository.prototype.listSubjects = originalListSubjects;
    AcademicRepository.prototype.getSubject = originalGetSubject;
    AcademicRepository.prototype.listLectures = originalListLectures;
    AcademicRepository.prototype.initialize = originalInitialize;
    Date.now = originalDateNow;
    Date.prototype.getTimezoneOffset = originalTimezoneOffset;
  }
}

const server = createServer(async (request, response) => {
  const pathname = new URL(request.url, "http://localhost").pathname;
  const file = await builtFile(pathname);
  if (!file) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }
  const fallback = file.endsWith("404.html") && pathname !== "/404.html";
  response.writeHead(fallback ? 404 : 200, { "content-type": contentTypes[extname(file)] });
  response.end(await readFile(file));
});

await new Promise((resolveListening) => server.listen(0, "127.0.0.1", resolveListening));
const address = server.address();
const origin = `http://127.0.0.1:${address.port}`;
try {
  for (const path of [
    "/",
    "/index.html",
    "/styles.css",
    "/app.mjs",
    "/library-read-facade.mjs",
    "/library-note-read-facade.mjs",
    "/library-note-detail-projection.mjs",
    "/library-results-projection.mjs",
    "/routes.mjs",
    "/study-subjects-projection.mjs",
    "/study-subjects-read-facade.mjs",
    "/study-subject-detail-read-facade.mjs",
    "/study-subject-detail-projection.mjs",
    "/study-subject-lectures-read-facade.mjs",
    "/study-subject-lectures-projection.mjs",
    "/views.mjs",
  ]) {
    const response = await fetch(`${origin}${path}`);
    if (!response.ok) throw new Error(`Built asset returned ${response.status}: ${path}`);
  }
  const fallback = await fetch(`${origin}/study`);
  if (fallback.status !== 404 || !(await fallback.text()).includes("routeFromPathname")) {
    throw new Error("Static fallback did not preserve a direct route");
  }
} finally {
  await new Promise((resolveClosing, rejectClosing) => {
    server.close((error) => error ? rejectClosing(error) : resolveClosing());
  });
}

await verifyBuiltNavigation();
console.log("Built smoke passed: HTTP closure + five routes + Today, Study, Library, and inline Note failure/retry/escaped ready/close states");
