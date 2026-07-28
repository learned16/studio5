import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const runtimeFiles = [
  "core-runtime.mjs",
  "closeout/runtime.mjs",
  "library/runtime.mjs",
  "reliability/runtime.mjs",
];

test("all Phase 3 routes open storage through the shared adapter", async () => {
  for (const file of runtimeFiles) {
    const source = await readFile(new URL(file, root), "utf8");
    assert.match(source, /openStudio5BrowserStorage/);
    assert.doesNotMatch(source, /studio5-p3-lecture-capture-core/);
    assert.doesNotMatch(source, /studio5-p3-library-content/);
  }
});

test("storage adapter uses the canonical profile and safe migration entrypoint", async () => {
  const source = await readFile(new URL("storage-runtime.mjs", root), "utf8");
  assert.match(source, /CANONICAL_BROWSER_STORAGE_PROFILE/);
  assert.match(source, /openCanonicalBrowserStorage/);
  assert.match(source, /studio5:browser-storage:canonical-v1/);
});

test("reliability UI waits for storage migration before reading a summary", async () => {
  const source = await readFile(new URL("reliability/app.mjs", root), "utf8");
  assert.match(source, /await openBrowserReliabilityDemo\(\)/);
});
