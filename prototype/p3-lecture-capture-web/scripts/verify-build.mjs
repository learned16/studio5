import { access, mkdir, readFile, rm, cp } from "node:fs/promises";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const dist = join(root, "dist");
const assets = join(dist, "assets");
const server = join(dist, "server");
const coreSource = join(root, "..", "..", "packages", "studio5-core", "src");
const coreAssets = join(assets, "core");
const closeoutAssets = join(assets, "closeout");
const files = [
  "index.html",
  "styles.css",
  "app.mjs",
  "lecture-demo.mjs",
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
await cp(join(root, "closeout"), closeoutAssets, { recursive: true });
await cp(join(root, "worker", "index.mjs"), join(server, "index.js"));

const html = await readFile(join(assets, "index.html"), "utf8");
if (!html.includes("capture-form")
  || !html.includes("capture-types")
  || !html.includes("capture-list")
  || !html.includes("app.mjs")) {
  throw new Error("Build verification failed: Lecture Capture entrypoint missing");
}
await access(join(server, "index.js"));
await access(join(coreAssets, "academic-repository.mjs"));
await access(join(coreAssets, "lecture-flow.mjs"));
await access(join(coreAssets, "lecture-inbox.mjs"));
const closeoutHtml = await readFile(join(closeoutAssets, "index.html"), "utf8");
if (!closeoutHtml.includes("closeout-list")
  || !closeoutHtml.includes("complete-closeout")
  || !closeoutHtml.includes("app.mjs")) {
  throw new Error("Build verification failed: Lecture Closeout entrypoint missing");
}
await access(join(closeoutAssets, "closeout-bridge.mjs"));
console.log(`Verified Lecture Capture + Closeout build: ${files.length} root assets + isolated Closeout + Studio5 Core`);
