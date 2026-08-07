import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  collectChangedEntries,
  collectChangedPaths,
  normalizeRepoPath,
  pathIsAllowed,
  verifyAllowedPaths,
} from "../scripts/verify-scope.mjs";

const scriptPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../scripts/verify-scope.mjs",
);

function git(cwd, args) {
  const result = spawnSync("git", args, { cwd, encoding: "utf8", windowsHide: true });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result.stdout.trim();
}

function makeRepo() {
  const cwd = mkdtempSync(path.join(tmpdir(), "studio5-scope-"));
  git(cwd, ["init", "-q"]);
  git(cwd, ["config", "user.email", "scope@example.invalid"]);
  git(cwd, ["config", "user.name", "Scope Test"]);
  mkdirSync(path.join(cwd, "docs"), { recursive: true });
  mkdirSync(path.join(cwd, "src"), { recursive: true });
  mkdirSync(path.join(cwd, "tooling"), { recursive: true });
  writeFileSync(path.join(cwd, "docs", "inside.txt"), "baseline\n");
  writeFileSync(path.join(cwd, "src", "outside.txt"), "baseline\n");
  writeFileSync(path.join(cwd, "tooling", "config.txt"), "baseline\n");
  git(cwd, ["add", "."]);
  git(cwd, ["commit", "-qm", "baseline"]);
  return { cwd, base: git(cwd, ["rev-parse", "HEAD"]) };
}

function runScript(cwd, args) {
  return spawnSync(process.execPath, [scriptPath, ...args], {
    cwd,
    encoding: "utf8",
    windowsHide: true,
  });
}

test("prints help without requiring a repository", () => {
  const scriptRun = runScript(process.cwd(), ["--help"]);
  assert.equal(scriptRun.status, 0, scriptRun.stderr);
  assert.match(scriptRun.stdout, /Usage: node verify-scope\.mjs/);
});

test("rejects a missing base ref before reading Git", () => {
  const scriptRun = runScript(process.cwd(), ["--allow", "docs"]);
  assert.equal(scriptRun.status, 2);
  assert.match(scriptRun.stderr, /--base is required/);
});

test("accepts a changed path inside the allowed prefix", () => {
  const { cwd, base } = makeRepo();
  writeFileSync(path.join(cwd, "docs", "inside.txt"), "changed\n");

  const result = runScript(cwd, ["--base", base, "--allow", "docs"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Scope PASS: 1 changed path/);
});

test("fails and prints a changed path outside scope", () => {
  const { cwd, base } = makeRepo();
  writeFileSync(path.join(cwd, "src", "outside.txt"), "changed\n");

  const result = runScript(cwd, ["--base", base, "--allow", "docs"]);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /src\/outside\.txt/);
});

test("normalizes Windows separators and enforces prefix boundaries", () => {
  assert.equal(normalizeRepoPath(".\\docs\\tasks\\one.md"), "docs/tasks/one.md");
  assert.equal(pathIsAllowed("docs\\tasks\\one.md", ["docs/tasks"]), true);
  assert.equal(pathIsAllowed("docs\\tasks-extra\\one.md", ["docs/tasks"]), false);
});

test("checks both source and destination of a rename", () => {
  const { cwd, base } = makeRepo();
  git(cwd, ["mv", "docs/inside.txt", "src/moved.txt"]);

  const entries = collectChangedEntries(base, cwd);
  const rename = entries.find((entry) => entry.status.startsWith("R"));
  assert.deepEqual(rename?.paths, ["docs/inside.txt", "src/moved.txt"]);
  assert.deepEqual(
    verifyAllowedPaths(collectChangedPaths(base, cwd), ["docs"]),
    ["src/moved.txt"],
  );
});

test("checks a deleted tracked file", () => {
  const { cwd, base } = makeRepo();
  git(cwd, ["rm", "docs/inside.txt"]);

  assert.deepEqual(collectChangedPaths(base, cwd), ["docs/inside.txt"]);
  assert.deepEqual(verifyAllowedPaths(collectChangedPaths(base, cwd), ["tooling"]), ["docs/inside.txt"]);
});

test("supports multiple allowed prefixes", () => {
  const { cwd, base } = makeRepo();
  writeFileSync(path.join(cwd, "docs", "inside.txt"), "changed\n");
  writeFileSync(path.join(cwd, "tooling", "config.txt"), "changed\n");

  const result = runScript(cwd, [
    "--base", base,
    "--allow", "docs",
    "--allow", "tooling",
  ]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /2 changed path/);
});

test("includes untracked files so new out-of-scope files cannot escape", () => {
  const { cwd, base } = makeRepo();
  writeFileSync(path.join(cwd, "outside-new.txt"), "new\n");

  assert.deepEqual(collectChangedPaths(base, cwd), ["outside-new.txt"]);
  const result = runScript(cwd, ["--base", base, "--allow", "docs"]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /outside-new\.txt/);
});
