import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const scriptPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../scripts/review-mutation-guard.mjs",
);

function run(cwd, args) {
  return spawnSync(process.execPath, [scriptPath, ...args], {
    cwd,
    encoding: "utf8",
    windowsHide: true,
  });
}

function git(cwd, args) {
  const result = spawnSync("git", args, { cwd, encoding: "utf8", windowsHide: true });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result.stdout.trim();
}

function makeRepo() {
  const cwd = mkdtempSync(path.join(tmpdir(), "studio5-review-guard-repo-"));
  const records = mkdtempSync(path.join(tmpdir(), "studio5-review-guard-records-"));
  git(cwd, ["init", "-q"]);
  git(cwd, ["config", "user.email", "guard@example.invalid"]);
  git(cwd, ["config", "user.name", "Mutation Guard Test"]);
  writeFileSync(path.join(cwd, "tracked.txt"), "baseline\n");
  writeFileSync(path.join(cwd, "untracked.txt"), "untracked baseline\n");
  git(cwd, ["add", "tracked.txt"]);
  git(cwd, ["commit", "-qm", "baseline"]);
  const snapshot = path.join(records, "before.json");
  const captured = run(cwd, ["capture", "--output", snapshot]);
  assert.equal(captured.status, 0, captured.stderr);
  return { cwd, records, snapshot };
}

function cleanUp(fixture) {
  rmSync(fixture.cwd, { recursive: true, force: true });
  rmSync(fixture.records, { recursive: true, force: true });
}

function verify(fixture) {
  return run(fixture.cwd, ["verify", "--before", fixture.snapshot]);
}

test("prints help without requiring a repository", () => {
  const result = run(process.cwd(), ["--help"]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /capture --output/);
});

test("passes when B leaves repository state unchanged", () => {
  const fixture = makeRepo();
  try {
    const result = verify(fixture);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /mutation guard: PASS/);
  } finally {
    cleanUp(fixture);
  }
});

test("fails when a tracked file is edited", () => {
  const fixture = makeRepo();
  try {
    writeFileSync(path.join(fixture.cwd, "tracked.txt"), "changed\n");
    const result = verify(fixture);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /tracked diff changed/);
  } finally {
    cleanUp(fixture);
  }
});

test("fails when a tracked file is deleted", () => {
  const fixture = makeRepo();
  try {
    rmSync(path.join(fixture.cwd, "tracked.txt"));
    const result = verify(fixture);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Git status changed/);
  } finally {
    cleanUp(fixture);
  }
});

test("fails when an untracked file is created", () => {
  const fixture = makeRepo();
  try {
    writeFileSync(path.join(fixture.cwd, "created.txt"), "created\n");
    const result = verify(fixture);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /untracked or ignored files changed/);
  } finally {
    cleanUp(fixture);
  }
});

test("fails when existing untracked content changes", () => {
  const fixture = makeRepo();
  try {
    writeFileSync(path.join(fixture.cwd, "untracked.txt"), "changed untracked content\n");
    const result = verify(fixture);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /untracked or ignored files changed/);
  } finally {
    cleanUp(fixture);
  }
});

test("fails when HEAD changes even if the worktree is clean", () => {
  const fixture = makeRepo();
  try {
    writeFileSync(path.join(fixture.cwd, "tracked.txt"), "committed by reviewer\n");
    git(fixture.cwd, ["add", "tracked.txt"]);
    git(fixture.cwd, ["commit", "-qm", "forbidden reviewer commit"]);
    const result = verify(fixture);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /HEAD changed/);
  } finally {
    cleanUp(fixture);
  }
});

test("fails when symbolic HEAD detaches at the same commit", () => {
  const fixture = makeRepo();
  try {
    git(fixture.cwd, ["switch", "--detach", "HEAD"]);
    const result = verify(fixture);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /symbolic HEAD changed/);
  } finally {
    cleanUp(fixture);
  }
});

test("fails when an ignored file is created", () => {
  const fixture = makeRepo();
  try {
    writeFileSync(path.join(fixture.cwd, ".gitignore"), "ignored.txt\n");
    git(fixture.cwd, ["add", ".gitignore"]);
    git(fixture.cwd, ["commit", "-qm", "ignore fixture"]);
    const refreshed = path.join(fixture.records, "ignored-before.json");
    const captured = run(fixture.cwd, ["capture", "--output", refreshed]);
    assert.equal(captured.status, 0, captured.stderr);
    writeFileSync(path.join(fixture.cwd, "ignored.txt"), "created\n");
    const result = run(fixture.cwd, ["verify", "--before", refreshed]);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /untracked or ignored files changed/);
  } finally {
    cleanUp(fixture);
  }
});

test("fails when existing ignored content changes", () => {
  const fixture = makeRepo();
  try {
    writeFileSync(path.join(fixture.cwd, ".gitignore"), "ignored.txt\n");
    writeFileSync(path.join(fixture.cwd, "ignored.txt"), "baseline ignored\n");
    git(fixture.cwd, ["add", ".gitignore"]);
    git(fixture.cwd, ["commit", "-qm", "ignore fixture"]);
    const refreshed = path.join(fixture.records, "ignored-before.json");
    const captured = run(fixture.cwd, ["capture", "--output", refreshed]);
    assert.equal(captured.status, 0, captured.stderr);
    writeFileSync(path.join(fixture.cwd, "ignored.txt"), "changed ignored\n");
    const result = run(fixture.cwd, ["verify", "--before", refreshed]);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /untracked or ignored files changed/);
  } finally {
    cleanUp(fixture);
  }
});

test("rejects a tampered baseline record", () => {
  const fixture = makeRepo();
  try {
    const snapshot = JSON.parse(readFileSync(fixture.snapshot, "utf8"));
    snapshot.head = "0".repeat(40);
    writeFileSync(fixture.snapshot, `${JSON.stringify(snapshot)}\n`);
    const result = verify(fixture);
    assert.equal(result.status, 2);
    assert.match(result.stderr, /integrity check failed/);
  } finally {
    cleanUp(fixture);
  }
});

test("rejects a baseline path inside the protected repository", () => {
  const cwd = mkdtempSync(path.join(tmpdir(), "studio5-review-guard-inside-"));
  try {
    git(cwd, ["init", "-q"]);
    git(cwd, ["config", "user.email", "guard@example.invalid"]);
    git(cwd, ["config", "user.name", "Mutation Guard Test"]);
    writeFileSync(path.join(cwd, "tracked.txt"), "baseline\n");
    git(cwd, ["add", "."]);
    git(cwd, ["commit", "-qm", "baseline"]);
    const result = run(cwd, ["capture", "--output", path.join(cwd, "before.json")]);
    assert.equal(result.status, 2);
    assert.match(result.stderr, /outside the repository/);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
