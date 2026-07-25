const CACHE_NAME = "studio5-p3-capture-v1";
const APP_ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.mjs",
  "./lecture-demo.mjs",
  "./core-runtime.mjs",
  "./manifest.webmanifest",
  "./core/academic-repository.mjs",
  "./core/ids.mjs",
  "./core/indexeddb-driver.mjs",
  "./core/lecture-flow.mjs",
  "./core/lecture-inbox.mjs",
  "./core/local-database.mjs",
  "./core/model.mjs",
  "./core/schema.mjs",
  "./core/store.mjs",
  "./core/today-query.mjs"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)),
      )),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => (
      cached
      ?? fetch(event.request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
    )),
  );
});
