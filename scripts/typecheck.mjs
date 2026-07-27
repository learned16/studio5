import { readFile } from "node:fs/promises";

const files = [
  "app.mjs",
  "lecture-demo.mjs",
  "core-runtime.mjs",
  "closeout/app.mjs",
  "closeout/closeout-bridge.mjs",
  "closeout/runtime.mjs",
  "library/app.mjs",
  "library/library-demo.mjs",
  "library/library-state.mjs",
  "library/runtime.mjs",
];
for (const file of files) {
  const source = await readFile(new URL(`../${file}`, import.meta.url), "utf8");
  if (!source.startsWith("import")
    && !["lecture-demo.mjs", "closeout/closeout-bridge.mjs", "library/library-state.mjs"].includes(file)) {
    throw new Error(`${file}: expected ES module imports`);
  }
  if (source.includes("\t")) {
    throw new Error(`${file}: tabs are not allowed`);
  }
}
console.log(`Static module contract check passed: ${files.length} modules`);
