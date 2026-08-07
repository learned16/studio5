import assert from "node:assert/strict";
import test from "node:test";
import { selectChecks } from "../scripts/select-checks.mjs";

function names(paths) {
  return selectChecks(paths).map((check) => check.name);
}

test("empty diff recommends no checks", () => {
  assert.deepEqual(selectChecks([]), []);
});

test("maps Core changes", () => {
  assert.deepEqual(names(["packages/studio5-core/src/model.mjs"]), ["Core"]);
});

test("maps P0 and P3 changes independently", () => {
  assert.deepEqual(names([
    "prototype/p0-ink-web/app.mjs",
    "prototype/p3-lecture-capture-web/app.mjs",
  ]), ["P0", "P3"]);
});

test("adds Worker for worker and Service Worker paths", () => {
  assert.deepEqual(names(["prototype/p0-ink-web/sw.js"]), ["P0", "Worker"]);
  assert.deepEqual(names(["prototype/p3-lecture-capture-web/worker/index.mjs"]), ["P3", "Worker"]);
});

test("maps docs and Codex tooling with Windows separators", () => {
  assert.deepEqual(names([
    "docs\\tasks\\OPS-AUTOPILOT-001.md",
    ".agents\\skills\\studio5-delivery\\SKILL.md",
    "skills-lock.json",
  ]), ["Docs", "Tooling"]);
});

test("critical governance selects a safe full regression", () => {
  assert.deepEqual(names(["PROJECT_STATUS.md"]), ["Docs", "Full regression"]);
  assert.deepEqual(names(["docs/authority/STUDIO5_AUTHORITY_CURRENT_EN.md"]), ["Docs", "Full regression"]);
});

test("root package, CI, schema, migration, and shared runtime select full regression", () => {
  for (const filePath of [
    "package.json",
    ".github/workflows/ci.yml",
    "packages/studio5-core/src/schema.mjs",
    "packages/studio5-core/migrations/v2.mjs",
    "prototype/p0-ink-web/core-runtime.mjs",
  ]) {
    assert.equal(names([filePath]).includes("Full regression"), true, filePath);
  }
});

test("unknown paths conservatively select full regression", () => {
  assert.deepEqual(names(["unexpected/new-surface.txt"]), ["Full regression"]);
});

test("reasons are deterministic and no command is executed", () => {
  const first = selectChecks(["PROJECT_STATUS.md", ".codex/config.toml"]);
  const second = selectChecks([".codex/config.toml", "PROJECT_STATUS.md"]);
  assert.deepEqual(first, second);
  assert.match(first.find((check) => check.name === "Tooling").reasons[0], /Codex tooling/);
});
