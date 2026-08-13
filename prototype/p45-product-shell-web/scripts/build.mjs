import { access, cp, mkdir, readFile, rm } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const assets = join(root, "dist", "assets");
const coreSource = resolve(root, "..", "..", "packages", "studio5-core", "src");
const staticAssets = [
  "index.html",
  "404.html",
  "styles.css",
  "app.mjs",
  "canonical-read-repository.mjs",
  "library-read-facade.mjs",
  "library-note-read-facade.mjs",
  "library-note-detail-projection.mjs",
  "library-results-projection.mjs",
  "routes.mjs",
  "study-subjects-projection.mjs",
  "study-subjects-read-facade.mjs",
  "study-subject-detail-read-facade.mjs",
  "study-subject-detail-projection.mjs",
  "study-subject-lectures-read-facade.mjs",
  "study-subject-lectures-projection.mjs",
  "study-subject-tasks-read-facade.mjs",
  "study-subject-tasks-projection.mjs",
  "study-subject-schedule-read-facade.mjs",
  "study-subject-schedule-projection.mjs",
  "study-subject-notes-read-facade.mjs",
  "study-subject-notes-projection.mjs",
  "today-projection.mjs",
  "today-read-facade.mjs",
  "views.mjs",
];

function relativeImports(source) {
  const patterns = [
    /\bfrom\s+["'](\.[^"']+)["']/g,
    /\bimport\s+["'](\.[^"']+)["']/g,
    /\bimport\(\s*["'](\.[^"']+)["']\s*\)/g,
  ];
  return patterns.flatMap((pattern) => [...source.matchAll(pattern)].map((match) => match[1]));
}

async function moduleClosure(entrypoints) {
  const pending = [...entrypoints];
  const visited = new Set();
  while (pending.length > 0) {
    const modulePath = pending.pop();
    if (visited.has(modulePath)) continue;
    visited.add(modulePath);
    const source = await readFile(modulePath, "utf8");
    for (const specifier of relativeImports(source)) {
      const importedPath = resolve(dirname(modulePath), specifier);
      const importedRelativePath = relative(assets, importedPath);
      if (importedRelativePath === ".." || importedRelativePath.startsWith(`..${sep}`)) {
        throw new Error(`Build import escapes static assets: ${specifier}`);
      }
      await access(importedPath);
      pending.push(importedPath);
    }
  }
  return visited;
}

await rm(join(root, "dist"), { recursive: true, force: true });
await mkdir(assets, { recursive: true });
for (const asset of staticAssets) await cp(join(root, asset), join(assets, asset));
await cp(coreSource, join(assets, "core"), { recursive: true });

const indexHtml = await readFile(join(assets, "index.html"), "utf8");
if (!indexHtml.includes('lang="en" dir="ltr"') || !indexHtml.includes('src="./app.mjs"')) {
  throw new Error("Build verification failed: English LTR shell entrypoint is missing");
}

const closure = await moduleClosure([
  join(assets, "app.mjs"),
  join(assets, "routes.mjs"),
]);
console.log(`Verified Phase 4.5 static build: ${staticAssets.length} assets, ${closure.size} modules`);
