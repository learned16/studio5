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
    for (const selector of ["[data-study-retry]", "[data-today-retry]"]) {
      const attribute = selector.slice(1, -1);
      if (markup.includes(attribute)) this.retryButtons.set(selector, new SmokeButton());
    }
  }

  querySelector(selector) {
    if (this.retryButtons.has(selector)) return this.retryButtons.get(selector);
    if (selector === "h1") {
      return { focus: () => {
        this.focusedHeading = this.markup.match(/<h1[^>]*>([^<]+)<\/h1>/)?.[1] ?? null;
      } };
    }
    return null;
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
  throw new Error(`Built Today route did not render: ${expected}`);
}

async function verifyBuiltNavigation() {
  const harness = builtDomHarness();
  const fixedInstant = Date.parse("2026-08-11T08:15:00.000Z");
  const queryOptions = [];
  const subjectCallArguments = [];
  const { AcademicRepository } = await import(
    new URL("../dist/assets/core/academic-repository.mjs", import.meta.url)
  );
  const originalQueryToday = AcademicRepository.prototype.queryToday;
  const originalListSubjects = AcademicRepository.prototype.listSubjects;
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
    for (const navigation of harness.navigations) {
      const studyLinks = navigation.links.filter(
        (link) => link.attributes.get("aria-current") === "page",
      );
      assert.deepEqual(studyLinks.map((link) => link.dataset.route), ["study"]);
    }

    for (const destinationId of ["projects", "practice", "library"]) {
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
    AcademicRepository.prototype.listSubjects = originalListSubjects;
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
    "/routes.mjs",
    "/study-subjects-projection.mjs",
    "/study-subjects-read-facade.mjs",
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
console.log("Built smoke passed: HTTP closure + five routes + Today and Study failure/retry/escaped ready states");
