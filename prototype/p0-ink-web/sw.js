const CACHE_NAME = "studio5-notebook-gate-v3";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.mjs",
  "./ink-core.mjs",
  "./storage.mjs",
  "./notebook-bridge.mjs",
  "./core-runtime.mjs",
  "./core/ids.mjs",
  "./core/model.mjs",
  "./core/schema.mjs",
  "./core/store.mjs",
  "./core/local-database.mjs",
  "./core/indexeddb-driver.mjs",
  "./core/file-intake.mjs",
  "./core/indexeddb-file-content-store.mjs",
  "./core/ink-format.mjs",
  "./core/today-query.mjs",
  "./core/academic-repository.mjs",
  "./manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)),
    )),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached
      ?? fetch(event.request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })),
  );
});
