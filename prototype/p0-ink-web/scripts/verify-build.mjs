import { access, mkdir, readFile, rm, cp } from "node:fs/promises";
import { join } from "node:path";

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
  "storage.mjs",
  "notebook-bridge.mjs",
  "core-runtime.mjs",
  "sw.js",
  "manifest.webmanifest",
];

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
console.log(`Verified static worker build: ${files.length} assets + Studio5 Core + server entrypoint`);
