// Studio5 offline cache — version 202610162134
const CACHE = "studio5-202610162134";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "/remote/", "/remote/manifest.webmanifest", "./kb/library.json"];
const CDN = ["https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js", "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js", "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then(async (c) => { await c.addAll(SHELL); for (const u of CDN) { try { await c.add(new Request(u, { mode: "no-cors" })); } catch {} } }).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === location.origin && (url.pathname.startsWith("/api/") || url.pathname.startsWith("/companion/") || url.pathname === "/version.json")) return; // relay, companion, version: always live
  if (req.mode === "navigate" || (url.origin === location.origin && url.pathname.endsWith("/"))) {
    // the app page: network first so updates arrive, cache when offline
    const key = url.pathname.startsWith("/remote/") ? "/remote/" : "./index.html";
    e.respondWith(fetch(req).then((r) => { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(key, copy)); return r; }).catch(() => caches.match(key)));
    return;
  }
  // everything else (icons, pdf.js, fonts): cache first
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((r) => { if (r.ok || r.type === "opaque") { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); } return r; })));
});
