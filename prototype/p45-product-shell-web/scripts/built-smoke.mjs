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

class SmokeMainContent {
  innerHTML = "";
  focusedHeading = null;

  querySelector(selector) {
    if (selector !== "h1") return null;
    return { focus: () => {
      this.focusedHeading = this.innerHTML.match(/<h1[^>]*>([^<]+)<\/h1>/)?.[1] ?? null;
    } };
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

async function verifyBuiltNavigation() {
  const harness = builtDomHarness();
  globalThis.document = harness.document;
  globalThis.history = harness.history;
  globalThis.indexedDB = smokeIndexedDB();
  globalThis.window = harness.window;
  await import(new URL("../dist/assets/app.mjs", import.meta.url));

  const destinations = ["study", "projects", "practice", "library", "today"];
  for (const destinationId of destinations) {
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
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (harness.mainContent.innerHTML.includes("Your day is clear")) return;
    await new Promise((resolveWaiting) => setTimeout(resolveWaiting, 0));
  }
  throw new Error("Built Today route did not reach its empty ready state");
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
  for (const path of ["/", "/index.html", "/styles.css", "/app.mjs", "/routes.mjs", "/views.mjs"]) {
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
console.log("Built smoke passed: HTTP closure + five-route navigation + canonical Today empty state");
