import { createHash } from "node:crypto";
import {
  lstatSync,
  readFileSync,
  readlinkSync,
  realpathSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HELP = `Usage: node review-mutation-guard.mjs capture --output <path> [--repo <path>]
       node review-mutation-guard.mjs verify --before <path> [--repo <path>]

Capture a deterministic Git repository fingerprint immediately before the
Studio5 B review, then verify the same fingerprint after B finishes. Snapshot
files must be written outside the repository so the guard does not mutate the
state it protects.
`;

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function runGit(args, cwd) {
  const commandResult = spawnSync("git", args, {
    cwd,
    encoding: null,
    windowsHide: true,
  });
  if (commandResult.error) throw commandResult.error;
  if (commandResult.status !== 0) {
    const detail = commandResult.stderr.toString("utf8").trim()
      || commandResult.stdout.toString("utf8").trim()
      || `exit ${commandResult.status}`;
    throw new Error(`git ${args.join(" ")} failed: ${detail}`);
  }
  return commandResult.stdout;
}

function repositoryRoot(cwd) {
  const gitRoot = path.resolve(
    runGit(["rev-parse", "--show-toplevel"], cwd).toString("utf8").trim(),
  );
  return realpathSync.native(gitRoot);
}

function splitNullTerminated(buffer) {
  return buffer.toString("utf8").split("\0").filter(Boolean);
}

function untrackedEntry(root, repositoryPath) {
  const absolutePath = path.join(root, ...repositoryPath.split("/"));
  const stat = lstatSync(absolutePath);
  if (stat.isSymbolicLink()) {
    const target = readlinkSync(absolutePath, "utf8");
    return { path: repositoryPath, type: "symlink", sha256: sha256(target) };
  }
  if (!stat.isFile()) {
    return { path: repositoryPath, type: "other", sha256: sha256(String(stat.mode)) };
  }
  return {
    path: repositoryPath,
    type: "file",
    size: stat.size,
    sha256: sha256(readFileSync(absolutePath)),
  };
}

export function captureRepositoryState(cwd = process.cwd()) {
  const root = repositoryRoot(cwd);
  const head = runGit(["rev-parse", "HEAD"], root).toString("utf8").trim();
  const status = runGit([
    "status",
    "--porcelain=v2",
    "-z",
    "--untracked-files=all",
    "--ignore-submodules=none",
  ], root);
  const diff = runGit(["diff", "--binary", "--no-ext-diff", "HEAD", "--", "."], root);
  const untracked = splitNullTerminated(
    runGit(["ls-files", "--others", "--exclude-standard", "-z"], root),
  )
    .sort((left, right) => left.localeCompare(right))
    .map((repositoryPath) => untrackedEntry(root, repositoryPath));

  const state = {
    schemaVersion: 1,
    repositoryRoot: root,
    head,
    statusSha256: sha256(status),
    diffSha256: sha256(diff),
    untracked,
  };
  return { ...state, fingerprint: sha256(JSON.stringify(state)) };
}

function pathIsInsideRepository(candidatePath, root) {
  const relativePath = path.relative(root, candidatePath);
  return relativePath === ""
    || (!relativePath.startsWith("..") && !path.isAbsolute(relativePath));
}

export function writeSnapshot(outputPath, cwd = process.cwd()) {
  const snapshot = captureRepositoryState(cwd);
  const requestedOutputPath = path.resolve(outputPath);
  const absoluteOutputPath = path.join(
    realpathSync.native(path.dirname(requestedOutputPath)),
    path.basename(requestedOutputPath),
  );
  if (pathIsInsideRepository(absoluteOutputPath, snapshot.repositoryRoot)) {
    throw new Error("Snapshot output must be outside the repository.");
  }
  writeFileSync(absoluteOutputPath, `${JSON.stringify(snapshot, null, 2)}\n`, {
    encoding: "utf8",
    flag: "wx",
  });
  return snapshot;
}

function readSnapshot(snapshotPath) {
  const snapshot = JSON.parse(readFileSync(path.resolve(snapshotPath), "utf8"));
  if (
    snapshot.schemaVersion !== 1
    || typeof snapshot.repositoryRoot !== "string"
    || typeof snapshot.head !== "string"
    || typeof snapshot.statusSha256 !== "string"
    || typeof snapshot.diffSha256 !== "string"
    || !Array.isArray(snapshot.untracked)
    || typeof snapshot.fingerprint !== "string"
  ) {
    throw new Error("Unsupported or invalid mutation-guard snapshot.");
  }
  const snapshotState = {
    schemaVersion: snapshot.schemaVersion,
    repositoryRoot: snapshot.repositoryRoot,
    head: snapshot.head,
    statusSha256: snapshot.statusSha256,
    diffSha256: snapshot.diffSha256,
    untracked: snapshot.untracked,
  };
  if (sha256(JSON.stringify(snapshotState)) !== snapshot.fingerprint) {
    throw new Error("Mutation-guard snapshot integrity check failed.");
  }
  return snapshot;
}

function mutationSummary(before, after) {
  const changes = [];
  if (before.repositoryRoot !== after.repositoryRoot) changes.push("repository root changed");
  if (before.head !== after.head) changes.push("HEAD changed");
  if (before.statusSha256 !== after.statusSha256) changes.push("Git status changed");
  if (before.diffSha256 !== after.diffSha256) changes.push("tracked diff changed");
  if (JSON.stringify(before.untracked) !== JSON.stringify(after.untracked)) {
    changes.push("untracked files changed");
  }
  return changes;
}

export function verifySnapshot(snapshotPath, cwd = process.cwd()) {
  const before = readSnapshot(snapshotPath);
  const after = captureRepositoryState(cwd);
  return {
    pass: before.fingerprint === after.fingerprint,
    before,
    after,
    changes: mutationSummary(before, after),
  };
}

export function parseArguments(argv) {
  const parsed = { command: "", output: "", before: "", repo: process.cwd(), help: false };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--help") parsed.help = true;
    else if (!parsed.command && (argument === "capture" || argument === "verify")) {
      parsed.command = argument;
    } else if (argument === "--output" || argument === "--before" || argument === "--repo") {
      const value = argv[++index];
      if (!value || value.startsWith("--")) throw new Error(`${argument} requires a value.`);
      if (argument === "--output") parsed.output = value;
      else if (argument === "--before") parsed.before = value;
      else parsed.repo = value;
    } else throw new Error(`Unknown argument: ${argument}`);
  }
  return parsed;
}

function validateOptions(options) {
  if (!options.command) throw new Error("Choose capture or verify.");
  if (options.command === "capture" && !options.output) throw new Error("capture requires --output.");
  if (options.command === "verify" && !options.before) throw new Error("verify requires --before.");
}

export function main(argv = process.argv.slice(2)) {
  try {
    const options = parseArguments(argv);
    if (options.help) {
      process.stdout.write(HELP);
      return 0;
    }
    validateOptions(options);
    if (options.command === "capture") {
      const snapshot = writeSnapshot(options.output, options.repo);
      process.stdout.write(`B review baseline captured: ${snapshot.fingerprint}\n`);
      return 0;
    }

    const result = verifySnapshot(options.before, options.repo);
    if (!result.pass) {
      process.stderr.write("B review mutation guard: FAIL\n");
      for (const change of result.changes) process.stderr.write(`- ${change}\n`);
      return 1;
    }
    process.stdout.write(`B review mutation guard: PASS (${result.after.fingerprint})\n`);
    return 0;
  } catch (error) {
    process.stderr.write(`review-mutation-guard: ${error.message}\n${HELP}`);
    return 2;
  }
}

const currentFile = path.resolve(fileURLToPath(import.meta.url));
if (process.argv[1] && currentFile === path.resolve(process.argv[1])) {
  process.exitCode = main();
}
