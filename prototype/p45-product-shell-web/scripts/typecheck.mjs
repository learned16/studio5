import { access, readFile } from "node:fs/promises";
import { dirname, relative, resolve, sep } from "node:path";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const coreSource = resolve(root, "..", "..", "packages", "studio5-core", "src");
const modules = [
  "app.mjs",
  "routes.mjs",
  "today-projection.mjs",
  "today-read-facade.mjs",
  "views.mjs",
  "server.mjs",
];

function relativeImports(source) {
  const patterns = [
    /\bfrom\s+["'](\.[^"']+)["']/g,
    /\bimport\s+["'](\.[^"']+)["']/g,
    /\bimport\(\s*["'](\.[^"']+)["']\s*\)/g,
  ];
  return patterns.flatMap((pattern) => [...source.matchAll(pattern)].map((match) => match[1]));
}

for (const moduleName of modules) {
  const modulePath = resolve(root, moduleName);
  const source = await readFile(modulePath, "utf8");
  if (source.includes("\t")) throw new Error(`${moduleName}: tabs are not allowed`);
  for (const specifier of relativeImports(source)) {
    const importedPath = specifier.startsWith("./core/")
      ? resolve(coreSource, specifier.slice("./core/".length))
      : resolve(dirname(modulePath), specifier);
    if (specifier.startsWith("./core/")) {
      await access(importedPath);
      continue;
    }
    const importedRelativePath = relative(root, importedPath);
    if (importedRelativePath === ".." || importedRelativePath.startsWith(`..${sep}`)) {
      throw new Error(`${moduleName}: import escapes the isolated surface: ${specifier}`);
    }
    await access(importedPath);
  }
}

console.log(`Static module boundary check passed: ${modules.length} modules`);
