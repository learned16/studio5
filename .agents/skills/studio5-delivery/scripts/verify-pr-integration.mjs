import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeRepoPath } from "./verify-scope.mjs";

const SUCCESS_STATES = new Set(["SUCCESS", "NEUTRAL", "SKIPPED"]);
const HELP = `Usage: node verify-pr-integration.mjs --pr <number> --base <branch> --evidence <path> [--evidence <path> ...]

Verify integration using GitHub PR state, GitHub-reported merge commit
reachability, and expected files in origin/<base>. Original PR-head ancestry is
never used as a universal requirement.
`;

export function checksAreSuccessful(statusCheckRollup = []) {
  return statusCheckRollup.length > 0 && statusCheckRollup.every((check) => {
    const state = String(check.conclusion ?? check.state ?? "").toUpperCase();
    return SUCCESS_STATES.has(state);
  });
}

export function assessIntegration({
  pr,
  expectedBase,
  mergeCommitReachable,
  repositoryEvidencePresent,
}) {
  const failures = [];
  if (pr?.state !== "MERGED") failures.push("GitHub PR state is not MERGED.");
  if (pr?.baseRefName !== expectedBase) failures.push(`GitHub PR base is not ${expectedBase}.`);
  if (!pr?.mergedAt) failures.push("GitHub PR mergedAt is absent.");
  if (!pr?.mergeCommit?.oid) failures.push("GitHub merge commit is absent.");
  if (!checksAreSuccessful(pr?.statusCheckRollup)) failures.push("A reported PR check is not successful.");
  if (!mergeCommitReachable) failures.push("GitHub merge commit is not reachable from the current base.");
  if (!repositoryEvidencePresent) failures.push("Expected repository evidence is absent from the current base.");
  return { integrated: failures.length === 0, failures };
}

function run(command, args, cwd = process.cwd()) {
  const commandResult = spawnSync(command, args, { cwd, encoding: "utf8", windowsHide: true });
  if (commandResult.error) throw commandResult.error;
  return commandResult;
}

export function parseArguments(argv) {
  const parsed = { pr: "", base: "", evidence: [], help: false };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--help") parsed.help = true;
    else if (["--pr", "--base", "--evidence"].includes(argument)) {
      const value = argv[++index];
      if (!value || value.startsWith("--")) throw new Error(`${argument} requires a value.`);
      if (argument === "--pr") parsed.pr = value;
      else if (argument === "--base") parsed.base = value;
      else parsed.evidence.push(normalizeRepoPath(value));
    } else throw new Error(`Unknown argument: ${argument}`);
  }
  return parsed;
}

function readPullRequest(prNumber, cwd) {
  const prCommand = run("gh", [
    "pr", "view", prNumber, "--json",
    "number,state,isDraft,mergedAt,mergeCommit,headRefOid,baseRefName,statusCheckRollup",
  ], cwd);
  if (prCommand.status !== 0) throw new Error(prCommand.stderr.trim() || "gh pr view failed.");
  return JSON.parse(prCommand.stdout);
}

function mergeIsReachable(mergeOid, baseRef, cwd) {
  return Boolean(mergeOid)
    && run("git", ["merge-base", "--is-ancestor", mergeOid, baseRef], cwd).status === 0;
}

function evidenceExists(evidencePaths, baseRef, cwd) {
  return evidencePaths.every((filePath) =>
    run("git", ["cat-file", "-e", `${baseRef}:${filePath}`], cwd).status === 0
  );
}

function printFailures(failures) {
  process.stderr.write("Integration verification failed:\n");
  for (const failure of failures) process.stderr.write(`- ${failure}\n`);
}

export function main(argv = process.argv.slice(2), cwd = process.cwd()) {
  let options;
  try {
    options = parseArguments(argv);
    if (options.help) {
      process.stdout.write(HELP);
      return 0;
    }
    if (!options.pr || !options.base || !options.evidence.length) {
      throw new Error("--pr, --base, and at least one --evidence path are required.");
    }

    const pr = readPullRequest(options.pr, cwd);
    const mergeOid = pr?.mergeCommit?.oid ?? "";
    const baseRef = `origin/${options.base}`;
    const integrationAssessment = assessIntegration({
      pr,
      expectedBase: options.base,
      mergeCommitReachable: mergeIsReachable(mergeOid, baseRef, cwd),
      repositoryEvidencePresent: evidenceExists(options.evidence, baseRef, cwd),
    });
    if (!integrationAssessment.integrated) {
      printFailures(integrationAssessment.failures);
      return 1;
    }
    process.stdout.write(`Integration PASS: ${mergeOid} is reachable from ${baseRef} and repository evidence is present.\n`);
    return 0;
  } catch (error) {
    process.stderr.write(`verify-pr-integration: ${error.message}\n${HELP}`);
    return 2;
  }
}

const currentFile = path.resolve(fileURLToPath(import.meta.url));
if (process.argv[1] && currentFile === path.resolve(process.argv[1])) {
  process.exitCode = main();
}
