import { access, readFile } from "node:fs/promises";
import { dirname, relative, resolve, sep } from "node:path";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const modules = ["app.mjs", "routes.mjs", "views.mjs", "server.mjs"];

function relativeImports(source) {
  return [...source.matchAll(/(?:from\s+|import\s*)["'](\.[^"']+)["']/g)]
    .map((match) => match[1]);
}

for (const moduleName of modules) {
  const modulePath = resolve(root, moduleName);
  const source = await readFile(modulePath, "utf8");
  if (source.includes("\t")) throw new Error(`${moduleName}: tabs are not allowed`);
  for (const specifier of relativeImports(source)) {
    const importedPath = resolve(dirname(modulePath), specifier);
    const importedRelativePath = relative(root, importedPath);
    if (importedRelativePath === ".." || importedRelativePath.startsWith(`..${sep}`)) {
      throw new Error(`${moduleName}: import escapes the isolated surface: ${specifier}`);
    }
    await access(importedPath);
  }
}

console.log(`Static module boundary check passed: ${modules.length} modules`);
