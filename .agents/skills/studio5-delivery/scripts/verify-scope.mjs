import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HELP = `Usage: node verify-scope.mjs --base <ref> --allow <prefix> [--allow <prefix> ...]

Read changed tracked and untracked repository paths without modifying files.
Rename sources and destinations are both checked. Exits non-zero when a path
falls outside every allowed prefix.

Options:
  --base <ref>      Required Git base ref.
  --allow <prefix>  Allowed repository path or directory prefix; repeatable.
  --help            Show this help.
`;

export function normalizeRepoPath(value) {
  return String(value)
    .trim()
    .replaceAll("\\", "/")
    .replace(/^\.\/+/, "")
    .replace(/\/{2,}/g, "/")
    .replace(/\/$/, "");
}

export function isSafeRepoPath(value) {
  const normalized = normalizeRepoPath(value);
  if (!normalized || normalized.startsWith("/") || /^[A-Za-z]:\//.test(normalized)) {
    return false;
  }
  return !normalized.split("/").includes("..");
}

export function pathIsAllowed(filePath, allowedPrefixes) {
  const normalizedPath = normalizeRepoPath(filePath);
  if (!isSafeRepoPath(normalizedPath)) return false;

  return allowedPrefixes.some((prefix) => {
    const normalizedPrefix = normalizeRepoPath(prefix);
    if (!isSafeRepoPath(normalizedPrefix)) return false;
    return normalizedPath === normalizedPrefix || normalizedPath.startsWith(`${normalizedPrefix}/`);
  });
}

export function parseNameStatus(output) {
  const tokens = String(output).split("\0");
  if (tokens.at(-1) === "") tokens.pop();

  const entries = [];
  for (let index = 0; index < tokens.length;) {
    const status = tokens[index++];
    if (!status) continue;
    const pathCount = /^[RC]/.test(status) ? 2 : 1;
    const paths = tokens.slice(index, index + pathCount).map(normalizeRepoPath);
    if (paths.length !== pathCount || paths.some((item) => !item)) {
      throw new Error(`Could not parse git --name-status output near status ${status}.`);
    }
    entries.push({ status, paths });
    index += pathCount;
  }
  return entries;
}

function runGit(args, cwd) {
  const commandResult = spawnSync("git", args, {
    cwd,
    encoding: "utf8",
    windowsHide: true,
  });
  if (commandResult.error) throw commandResult.error;
  if (commandResult.status !== 0) {
    const detail = commandResult.stderr.trim()
      || commandResult.stdout.trim()
      || `exit ${commandResult.status}`;
    throw new Error(`git ${args.join(" ")} failed: ${detail}`);
  }
  return commandResult.stdout;
}

export function collectChangedEntries(baseRef, cwd = process.cwd()) {
  if (!baseRef) throw new Error("A base ref is required.");

  const tracked = parseNameStatus(
    runGit(["diff", "--name-status", "-z", "--find-renames", baseRef, "--"], cwd),
  );
  const untrackedPaths = runGit(
    ["ls-files", "--others", "--exclude-standard", "-z"],
    cwd,
  )
    .split("\0")
    .filter(Boolean)
    .map(normalizeRepoPath)
    .map((filePath) => ({ status: "?", paths: [filePath] }));

  return [...tracked, ...untrackedPaths];
}

export function collectChangedPaths(baseRef, cwd = process.cwd()) {
  return [...new Set(collectChangedEntries(baseRef, cwd).flatMap((entry) => entry.paths))]
    .sort((left, right) => left.localeCompare(right));
}

export function verifyAllowedPaths(paths, allowedPrefixes) {
  if (!allowedPrefixes.length) throw new Error("At least one --allow prefix is required.");
  return paths
    .filter((filePath) => !pathIsAllowed(filePath, allowedPrefixes))
    .sort((left, right) => left.localeCompare(right));
}

export function parseArguments(argv) {
  const parsed = { base: "", allows: [], help: false };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--help") {
      parsed.help = true;
    } else if (argument === "--base" || argument === "--allow") {
      const value = argv[++index];
      if (!value || value.startsWith("--")) throw new Error(`${argument} requires a value.`);
      if (argument === "--base") parsed.base = value;
      else parsed.allows.push(value);
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }
  return parsed;
}

function validateOptions(options) {
  if (!options.base) throw new Error("--base is required.");
  if (!options.allows.length) throw new Error("At least one --allow prefix is required.");
}

function printViolations(violations) {
  process.stderr.write("Scope violations:\n");
  for (const violation of violations) process.stderr.write(`- ${violation}\n`);
}

export function main(argv = process.argv.slice(2), cwd = process.cwd()) {
  let options;
  try {
    options = parseArguments(argv);
    if (options.help) {
      process.stdout.write(HELP);
      return 0;
    }
    validateOptions(options);
  } catch (error) {
    process.stderr.write(`verify-scope: ${error.message}\n${HELP}`);
    return 2;
  }

  try {
    const paths = collectChangedPaths(options.base, cwd);
    const violations = verifyAllowedPaths(paths, options.allows);
    if (violations.length) {
      printViolations(violations);
      return 1;
    }
    process.stdout.write(`Scope PASS: ${paths.length} changed path(s) are allowed.\n`);
    return 0;
  } catch (error) {
    process.stderr.write(`verify-scope: ${error.message}\n`);
    return 1;
  }
}

const currentFile = path.resolve(fileURLToPath(import.meta.url));
if (process.argv[1] && currentFile === path.resolve(process.argv[1])) {
  process.exitCode = main();
}
