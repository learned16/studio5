// Builds two outputs from src/:
//   dist/studio5.html  — page content for the claude.ai artifact (the viewer adds the document skeleton)
//   public/            — the installable app for Cloudflare (full document, manifest, service worker, icons)
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
const order = ["core.js", "curriculum.js", "ink.js", "pdf.js", "ai.js", "ui.js", "tools.js",
  "view-today.js", "view-study.js", "view-projects.js", "view-practice.js", "studio.js", "lab.js", "atelier.js", "view-library.js",
  "view-system.js", "remote.js", "tutor.js", ...readdirSync(new URL("./src/college/", import.meta.url)).filter((f) => f.endsWith(".js")).sort().map((f) => "college/" + f), "campus.js", "selftest.js", "i18n.js", "main.js"];
const read = (f) => readFileSync(new URL("./src/" + f, import.meta.url), "utf8");
const out = (p, s) => writeFileSync(new URL(p, import.meta.url), s);
const dict = {};
for (const f of readdirSync(new URL("./src/", import.meta.url)).filter((f) => /^i18n-ar-.+\.txt$/.test(f)).sort()) for (const line of read(f).split("\n")) { const i = line.indexOf("\t"); if (i > 0) dict[line.slice(0, i)] = line.slice(i + 1).trim(); }
const js = `var S5_I18N_PENDING = ${JSON.stringify(dict)};\n` + order.map((f) => `// ---- ${f} ----\n${read(f)}`).join("\n");
// the teaching library: kb/*.json merged (installed app loads it on demand; the claude.ai page embeds it)
const kb = readdirSync(new URL("./kb/", import.meta.url)).filter((f) => f.endsWith(".json")).sort().flatMap((f) => JSON.parse(readFileSync(new URL("./kb/" + f, import.meta.url), "utf8")));
const kbIds = new Set(); for (const t of kb) { if (kbIds.has(t.id)) throw new Error("duplicate library id " + t.id); kbIds.add(t.id); }
const content = read("head.html") + `<style>\n${read("styles.css")}\n</style>\n` + read("body.html") + `<script>\n"use strict";\n${js}\n</script>\n`;
mkdirSync(new URL("./dist/", import.meta.url), { recursive: true });
mkdirSync(new URL("./public/", import.meta.url), { recursive: true });
out("./dist/studio5.html", content.replace("<script>\n\"use strict\";", `<script>var S5_KB = ${JSON.stringify(kb)};</script>\n<script>\n"use strict";`));
mkdirSync(new URL("./public/kb/", import.meta.url), { recursive: true });
out("./public/kb/library.json", JSON.stringify(kb));

const version = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 12);
const doc = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<link rel="manifest" href="./manifest.webmanifest"><link rel="icon" href="./icon-192.png"><link rel="apple-touch-icon" href="./icon-192.png">
<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font-size:14px}img{max-width:100%}[hidden]{display:none!important}</style>
<script>var S5_BUILD = "${version}";</script>
</head><body>
${content}</body></html>`;
out("./public/index.html", doc);
// the separate Laptop Remote app (same pairing, nothing else of Studio5 on screen) + the laptop's video page
mkdirSync(new URL("./public/remote/", import.meta.url), { recursive: true });
out("./public/remote/index.html", doc.replace('<link rel="manifest" href="./manifest.webmanifest"><link rel="icon" href="./icon-192.png"><link rel="apple-touch-icon" href="./icon-192.png">', '<link rel="manifest" href="./manifest.webmanifest"><link rel="icon" href="/icon-192.png"><link rel="apple-touch-icon" href="/icon-192.png"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="black"><title>Laptop Remote</title>').replace('<script>var S5_BUILD', '<script>var S5_APP = "remote";</script><script>var S5_BUILD'));
out("./public/remote/manifest.webmanifest", JSON.stringify({ name: "Laptop Remote", short_name: "Laptop", description: "Control your laptop from the phone or iPad — video, keyboard, mouse.", start_url: "/remote/", scope: "/remote/", display: "fullscreen", orientation: "any", background_color: "#15181e", theme_color: "#15181e", icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }, { src: "/icon-512.png", sizes: "512x512", type: "image/png" }] }, null, 2));
out("./public/remote/host.html", read("host.html"));
out("./public/manifest.webmanifest", JSON.stringify({
  name: "Studio5", short_name: "Studio5", description: "Study, drawing and project studio — architecture & civil engineering.",
  start_url: "./", scope: "./", display: "standalone", background_color: "#e9ebe7", theme_color: "#1f3a68",
  icons: [{ src: "./icon-192.png", sizes: "192x192", type: "image/png" }, { src: "./icon-512.png", sizes: "512x512", type: "image/png" }, { src: "./icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" }],
}, null, 2));
out("./public/sw.js", `// Studio5 offline cache — version ${version}
const CACHE = "studio5-${version}";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "/remote/", "/remote/manifest.webmanifest"];
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
`);
mkdirSync(new URL("./public/companion/", import.meta.url), { recursive: true });
out("./public/companion/studio5-companion.mjs", readFileSync(new URL("./companion/studio5-companion.mjs", import.meta.url), "utf8"));
out("./public/version.json", JSON.stringify({ v: version }));
out("./public/_headers", `/version.json\n  Cache-Control: no-store\n/companion/*\n  Cache-Control: no-cache\n/sw.js\n  Cache-Control: no-cache\n/index.html\n  Cache-Control: no-cache\n/\n  Cache-Control: no-cache\n`);
console.log("built dist/studio5.html and public/ —", (content.length / 1024).toFixed(0) + " KB · library", kb.length, "lessons");
