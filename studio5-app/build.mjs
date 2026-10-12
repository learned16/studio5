// Builds two outputs from src/:
//   dist/studio5.html  — page content for the claude.ai artifact (the viewer adds the document skeleton)
//   public/            — the installable app for Cloudflare (full document, manifest, service worker, icons)
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
const order = ["core.js", "curriculum.js", "ink.js", "pdf.js", "ai.js", "ui.js", "tools.js",
  "view-today.js", "view-study.js", "view-projects.js", "view-practice.js", "view-library.js",
  "view-system.js", "main.js"];
const read = (f) => readFileSync(new URL("./src/" + f, import.meta.url), "utf8");
const out = (p, s) => writeFileSync(new URL(p, import.meta.url), s);
const js = order.map((f) => `// ---- ${f} ----\n${read(f)}`).join("\n");
const content = read("head.html") + `<style>\n${read("styles.css")}\n</style>\n` + read("body.html") + `<script>\n"use strict";\n${js}\n</script>\n`;
mkdirSync(new URL("./dist/", import.meta.url), { recursive: true });
mkdirSync(new URL("./public/", import.meta.url), { recursive: true });
out("./dist/studio5.html", content);

const version = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 12);
const doc = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<link rel="manifest" href="./manifest.webmanifest"><link rel="icon" href="./icon-192.png"><link rel="apple-touch-icon" href="./icon-192.png">
<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font-size:14px}img{max-width:100%}[hidden]{display:none!important}</style>
</head><body>
${content}</body></html>`;
out("./public/index.html", doc);
out("./public/manifest.webmanifest", JSON.stringify({
  name: "Studio5", short_name: "Studio5", description: "Study, drawing and project studio — architecture & civil engineering.",
  start_url: "./", scope: "./", display: "standalone", background_color: "#e9ebe7", theme_color: "#1f3a68",
  icons: [{ src: "./icon-192.png", sizes: "192x192", type: "image/png" }, { src: "./icon-512.png", sizes: "512x512", type: "image/png" }, { src: "./icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" }],
}, null, 2));
out("./public/sw.js", `// Studio5 offline cache — version ${version}
const CACHE = "studio5-${version}";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];
const CDN = ["https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js", "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then(async (c) => { await c.addAll(SHELL); for (const u of CDN) { try { await c.add(new Request(u, { mode: "no-cors" })); } catch {} } }).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (req.mode === "navigate" || (url.origin === location.origin && url.pathname.endsWith("/"))) {
    // the app page: network first so updates arrive, cache when offline
    e.respondWith(fetch(req).then((r) => { const copy = r.clone(); caches.open(CACHE).then((c) => c.put("./index.html", copy)); return r; }).catch(() => caches.match("./index.html")));
    return;
  }
  // everything else (icons, pdf.js, fonts): cache first
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((r) => { if (r.ok || r.type === "opaque") { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); } return r; })));
});
`);
out("./public/_headers", `/sw.js\n  Cache-Control: no-cache\n/index.html\n  Cache-Control: no-cache\n/\n  Cache-Control: no-cache\n`);
console.log("built dist/studio5.html and public/ —", (content.length / 1024).toFixed(0) + " KB");
