import { createServer } from "node:http";
import { access, cp, mkdir, readFile, rm, stat } from "node:fs/promises";
import {
  dirname,
  extname,
  join,
  relative,
  resolve,
  sep,
} from "node:path";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const dist = join(root, "dist");
const assets = join(dist, "assets");
const server = join(dist, "server");
const coreSource = join(root, "..", "..", "packages", "studio5-core", "src");
const coreAssets = join(assets, "core");
const files = [
  "index.html",
  "styles.css",
  "app.mjs",
  "ink-core.mjs",
  "ink-coordinate-transforms.mjs",
  "storage.mjs",
  "notebook-bridge.mjs",
  "core-runtime.mjs",
  "sw.js",
  "manifest.webmanifest",
];

function relativeImportSpecifiers(source) {
  const specifiers = [];
  const patterns = [
    /\bfrom\s+["'](\.[^"']+)["']/g,
    /\bimport\s*["'](\.[^"']+)["']/g,
    /\bimport\s*\(\s*["'](\.[^"']+)["']\s*\)/g,
  ];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) specifiers.push(match[1]);
  }
  return specifiers;
}

async function moduleClosure(entrypoint) {
  const pending = [entrypoint];
  const visited = new Set();
  while (pending.length) {
    const modulePath = pending.pop();
    if (visited.has(modulePath)) continue;
    visited.add(modulePath);
    const source = await readFile(modulePath, "utf8");
    for (const specifier of relativeImportSpecifiers(source)) {
      const cleanSpecifier = specifier.split(/[?#]/, 1)[0];
      const importedPath = resolve(dirname(modulePath), cleanSpecifier);
      const importedRelativePath = relative(assets, importedPath);
      if (importedRelativePath.startsWith(`..${sep}`) || importedRelativePath === "..") {
        throw new Error(`Build import escapes static assets: ${specifier} from ${modulePath}`);
      }
      await access(importedPath);
      pending.push(importedPath);
    }
  }
  return visited;
}

function serviceWorkerAssets(source) {
  const block = source.match(/const ASSETS = \[([\s\S]*?)\];/)?.[1];
  if (!block) throw new Error("Build verification failed: Service Worker ASSETS missing");
  return new Set([...block.matchAll(/["'](\.\/[^"']*)["']/g)].map((match) => match[1]));
}

async function verifyHttpFiles(paths) {
  const contentTypes = {
    ".css": "text/css; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".mjs": "text/javascript; charset=utf-8",
    ".webmanifest": "application/manifest+json; charset=utf-8",
  };
  const staticServer = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
      const candidate = resolve(assets, pathname === "/" ? "index.html" : pathname.slice(1));
      const candidateRelativePath = relative(assets, candidate);
      if (candidateRelativePath.startsWith(`..${sep}`) || candidateRelativePath === "..") {
        response.writeHead(403);
        response.end("Forbidden");
        return;
      }
      const metadata = await stat(candidate);
      if (!metadata.isFile()) throw new Error("Not a file");
      response.writeHead(200, {
        "cache-control": "no-store",
        "content-type": contentTypes[extname(candidate)] ?? "application/octet-stream",
      });
      response.end(await readFile(candidate));
    } catch {
      response.writeHead(404);
      response.end("Not found");
    }
  });
  await new Promise((resolveListening) => staticServer.listen(0, "127.0.0.1", resolveListening));
  const address = staticServer.address();
  try {
    for (const path of paths) {
      const response = await fetch(`http://127.0.0.1:${address.port}/${path}`);
      if (!response.ok) throw new Error(`Built HTTP module returned ${response.status}: ${path}`);
    }
  } finally {
    await new Promise((resolveClosing, rejectClosing) => {
      staticServer.close((error) => error ? rejectClosing(error) : resolveClosing());
    });
  }
}

await rm(dist, { recursive: true, force: true });
await mkdir(assets, { recursive: true });
await mkdir(server, { recursive: true });
for (const file of files) {
  await access(join(root, file));
  await cp(join(root, file), join(assets, file));
}
await cp(coreSource, coreAssets, { recursive: true });
await cp(join(root, "worker", "index.mjs"), join(server, "index.js"));

const html = await readFile(join(assets, "index.html"), "utf8");
if (!html.includes("ink-canvas")
  || !html.includes("app.mjs")
  || !html.includes("revision-history-button")
  || !html.includes("revision-history-dialog")
  || !html.includes("revision-preview-bar")) {
  throw new Error("Build verification failed: canvas entrypoint missing");
}
await access(join(server, "index.js"));
await access(join(coreAssets, "academic-repository.mjs"));
await access(join(coreAssets, "ink-format.mjs"));
await access(join(assets, "ink-coordinate-transforms.mjs"));

const closure = await moduleClosure(join(assets, "app.mjs"));
const closureAssets = [...closure].map(
  (modulePath) => `./${relative(assets, modulePath).replaceAll("\\", "/")}`,
);
const precache = serviceWorkerAssets(await readFile(join(assets, "sw.js"), "utf8"));
for (const requiredAsset of [
  "./",
  "./index.html",
  "./styles.css",
  "./manifest.webmanifest",
  ...closureAssets,
]) {
  if (!precache.has(requiredAsset)) {
    throw new Error(`Build verification failed: precache misses ${requiredAsset}`);
  }
}

await verifyHttpFiles([
  "index.html",
  ...closureAssets.map((asset) => asset.slice(2)),
]);

console.log(
  `Verified static worker build: ${files.length} assets + ${closure.size} module import closure + Studio5 Core + server entrypoint`,
);
