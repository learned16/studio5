const CACHE_NAME = "studio5-p4-reliability-v2";
const APP_ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.mjs",
  "./lecture-demo.mjs",
  "./core-runtime.mjs",
  "./manifest.webmanifest",
  "./closeout/",
  "./closeout/index.html",
  "./closeout/styles.css",
  "./closeout/app.mjs",
  "./closeout/closeout-bridge.mjs",
  "./closeout/runtime.mjs",
  "./library/",
  "./library/index.html",
  "./library/styles.css",
  "./library/app.mjs",
  "./library/library-demo.mjs",
  "./library/library-state.mjs",
  "./library/pdf-viewer.mjs",
  "./library/runtime.mjs",
  "./reliability/",
  "./reliability/index.html",
  "./reliability/styles.css",
  "./reliability/app.mjs",
  "./reliability/reliability-demo.mjs",
  "./reliability/runtime.mjs",
  "./core/backup.mjs",
  "./vendor/pdfjs/pdf.min.mjs",
  "./vendor/pdfjs/pdf.worker.min.mjs",
  "./core/academic-repository.mjs",
  "./core/file-intake.mjs",
  "./core/ids.mjs",
  "./core/indexeddb-driver.mjs",
  "./core/indexeddb-file-content-store.mjs",
  "./core/ink-format.mjs",
  "./core/lecture-flow.mjs",
  "./core/lecture-inbox.mjs",
  "./core/library-search.mjs",
  "./core/local-database.mjs",
  "./core/model.mjs",
  "./core/offline-queue.mjs",
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
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request)),
  );
});
