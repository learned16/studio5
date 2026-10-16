import { readFile } from "node:fs/promises";

const files = [
  "app.mjs",
  "ink-core.mjs",
  "ink-coordinate-transforms.mjs",
  "storage.mjs",
  "notebook-bridge.mjs",
  "core-runtime.mjs",
];
for (const file of files) {
  const source = await readFile(new URL(`../${file}`, import.meta.url), "utf8");
  if (!source.startsWith("import")
    && ![
      "ink-core.mjs",
      "ink-coordinate-transforms.mjs",
      "notebook-bridge.mjs",
    ].includes(file)) {
    throw new Error(`${file}: expected ES module imports`);
  }
  if (source.includes("\t")) {
    throw new Error(`${file}: tabs are not allowed`);
  }
}
console.log(`Static module contract check passed: ${files.length} modules`);
