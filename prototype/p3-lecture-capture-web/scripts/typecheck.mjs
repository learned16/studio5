import { readFile } from "node:fs/promises";

const files = [
  "user-content.mjs",
  "app.mjs",
  "lecture-demo.mjs",
  "core-runtime.mjs",
  "storage-runtime.mjs",
  "closeout/app.mjs",
  "closeout/closeout-bridge.mjs",
  "closeout/runtime.mjs",
  "library/app.mjs",
  "library/library-demo.mjs",
  "library/library-state.mjs",
  "library/runtime.mjs",
  "reliability/app.mjs",
  "reliability/reliability-demo.mjs",
  "reliability/runtime.mjs",
  "scripts/verify-static-preview.mjs",
];
for (const file of files) {
  const source = await readFile(new URL(`../${file}`, import.meta.url), "utf8");
  if (!source.startsWith("import")
    && ![
      "lecture-demo.mjs",
      "storage-runtime.mjs",
      "user-content.mjs",
      "closeout/closeout-bridge.mjs",
      "library/library-state.mjs",
      "reliability/reliability-demo.mjs",
    ].includes(file)) {
    throw new Error(`${file}: expected ES module imports`);
  }
  if (source.includes("\t")) {
    throw new Error(`${file}: tabs are not allowed`);
  }
}
console.log(`Static module contract check passed: ${files.length} modules`);
