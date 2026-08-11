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

test("maps P0 changes without unrelated checks", () => {
  assert.deepEqual(names(["prototype/p0-ink-web/app.mjs"]), ["P0"]);
});

test("maps every P3 path to both P3 and Worker checks", () => {
  for (const filePath of [
    "prototype/p3-lecture-capture-web/app.mjs",
    "prototype/p3-lecture-capture-web/pnpm-lock.yaml",
  ]) {
    assert.deepEqual(names([filePath]), ["P3", "Worker"], filePath);
  }
});

test("escalates Worker, Service Worker, and build-closure paths", () => {
  assert.deepEqual(names(["prototype/p0-ink-web/sw.js"]), ["P0", "Worker", "Full regression"]);
  assert.deepEqual(names(["prototype/p3-lecture-capture-web/worker/index.mjs"]), ["P3", "Worker", "Full regression"]);
  assert.deepEqual(names(["scripts/verify-build.mjs"]), ["Worker", "Full regression"]);
});

test("maps docs and Codex tooling with Windows separators", () => {
  assert.deepEqual(names([
    "docs\\tasks\\OPS-AUTOPILOT-001.md",
    ".agents\\skills\\studio5-delivery\\SKILL.md",
    "skills-lock.json",
  ]), ["Docs", "Tooling"]);
});

test("routine status, traceability, and task evidence select Docs only", () => {
  assert.deepEqual(names(["PROJECT_STATUS.md"]), ["Docs"]);
  assert.deepEqual(names(["docs/TRACEABILITY.md"]), ["Docs"]);
  assert.deepEqual(names(["docs/tasks/OPS-AUTOPILOT-006.md"]), ["Docs"]);
});

test("authority remains conservative", () => {
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

test("escalates backup and browser-persistence paths", () => {
  for (const filePath of [
    "packages/studio5-core/src/backup.mjs",
    "prototype/p3-lecture-capture-web/storage.mjs",
    "prototype/p0-ink-web/indexeddb-storage.mjs",
    "prototype/p0-ink-web/data-persistence.mjs",
  ]) {
    assert.equal(names([filePath]).includes("Full regression"), true, filePath);
  }
});

test("unknown paths conservatively select full regression", () => {
  assert.deepEqual(names(["unexpected/new-surface.txt"]), ["Full regression"]);
});

test("maps P4.5 to direct local commands with deterministic reasons", () => {
  const first = selectChecks(["prototype/p45-product-shell-web/app.mjs"]);
  const second = selectChecks(["prototype/p45-product-shell-web/app.mjs"]);
  assert.deepEqual(first, second);
  assert.deepEqual(names(["prototype/p45-product-shell-web/app.mjs"]), ["P4.5"]);
  assert.deepEqual(first[0].commands, [
    "npm --prefix prototype/p45-product-shell-web run build",
    "npm --prefix prototype/p45-product-shell-web run lint",
    "npm --prefix prototype/p45-product-shell-web run typecheck",
    "npm --prefix prototype/p45-product-shell-web test",
  ]);
  assert.match(first[0].reasons[0], /isolated P4\.5 product-shell prototype/);
});

test("adds narrow documentation checks for P4.5 evidence", () => {
  assert.deepEqual(names([
    "prototype/p45-product-shell-web/views.mjs",
    "PROJECT_STATUS.md",
    "docs/TRACEABILITY.md",
  ]), ["P4.5", "Docs"]);
});

test("keeps adjacent P3 and Worker dependencies for P4.5 changes", () => {
  assert.deepEqual(names([
    "prototype/p45-product-shell-web/app.mjs",
    "prototype/p3-lecture-capture-web/pnpm-lock.yaml",
  ]), ["P3", "Worker", "P4.5"]);
});

test("escalates P4.5 plus high-risk Core or schema changes", () => {
  for (const adjacentPath of [
    "packages/studio5-core/src/model.mjs",
    "packages/studio5-core/migrations/v3.mjs",
  ]) {
    assert.equal(names([
      "prototype/p45-product-shell-web/app.mjs",
      adjacentPath,
    ]).includes("Full regression"), true, adjacentPath);
  }
});

test("reasons are deterministic and no command is executed", () => {
  const first = selectChecks(["PROJECT_STATUS.md", ".codex/config.toml"]);
  const second = selectChecks([".codex/config.toml", "PROJECT_STATUS.md"]);
  assert.deepEqual(first, second);
  assert.match(first.find((check) => check.name === "Tooling").reasons[0], /Codex tooling/);
});
