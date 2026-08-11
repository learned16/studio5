import path from "node:path";
import { fileURLToPath } from "node:url";
import { collectChangedPaths, normalizeRepoPath } from "./verify-scope.mjs";

const ORDER = ["Core", "P0", "P3", "Worker", "P4.5", "Docs", "Tooling", "Full regression"];
const HELP = `Usage: node select-checks.mjs --base <ref>
       node select-checks.mjs --file <path> [--file <path> ...]

Recommend checks for changed files. This command never executes checks.
`;

function isMarkdown(filePath) {
  return filePath.endsWith(".md") || filePath.startsWith("docs/");
}

function isWorkerPath(filePath) {
  return filePath === "wrangler.jsonc"
    || /(^|\/)worker\//.test(filePath)
    || /(^|\/)sw\.js$/.test(filePath)
    || filePath.includes("verify-static-preview")
    || filePath.includes("verify-build");
}

function isCriticalPath(filePath) {
  const baseName = filePath.split("/").at(-1);
  return filePath === "package.json"
    || /^(pnpm-lock\.yaml|package-lock\.json|yarn\.lock)$/.test(filePath)
    || filePath.startsWith(".github/")
    || filePath === "wrangler.jsonc"
    || filePath === "AGENTS.md"
    || filePath.startsWith("docs/authority/")
    || isWorkerPath(filePath)
    || /(^|\/)(schema|migrations)(\/|$)/.test(filePath)
    || /(^|\/)schema\.[^/]+$/.test(filePath)
    || baseName === "core-runtime.mjs"
    || baseName === "storage-runtime.mjs"
    || baseName === "backup.mjs"
    || baseName === "storage.mjs"
    || /(^|\/)(storage|backup|persistence|indexeddb)(?:[.-]|\/|$)/i.test(filePath)
    || /(^|\/)browser-(storage|backup|persistence|indexeddb|migration)(?:[.-]|\/|$)/i.test(filePath)
    || /(^|\/)data-(store|persistence)\.[^/]+$/i.test(filePath);
}

const P45_PREFIX = "prototype/p45-product-shell-web/";
const P45_COMMANDS = [
  "npm --prefix prototype/p45-product-shell-web run lint",
  "npm --prefix prototype/p45-product-shell-web run typecheck",
  "npm --prefix prototype/p45-product-shell-web test",
  "npm --prefix prototype/p45-product-shell-web run build",
];

const CHECK_RULES = [
  {
    name: "Core",
    matches: (filePath) => filePath.startsWith("packages/studio5-core/"),
    reason: (filePath) => `${filePath} affects Studio5 Core.`,
  },
  {
    name: "P0",
    matches: (filePath) => filePath.startsWith("prototype/p0-ink-web/"),
    reason: (filePath) => `${filePath} affects the P0 Ink prototype.`,
  },
  {
    name: "P3",
    matches: (filePath) => filePath.startsWith("prototype/p3-lecture-capture-web/"),
    reason: (filePath) => `${filePath} affects the P3 prototype.`,
  },
  {
    name: "Worker",
    matches: (filePath) => filePath.startsWith("prototype/p3-lecture-capture-web/")
      || isWorkerPath(filePath),
    reason: (filePath) => filePath.startsWith("prototype/p3-lecture-capture-web/")
      ? `${filePath} feeds the Worker static build through the P3 application.`
      : `${filePath} affects Worker, Service Worker, or static build closure.`,
  },
  {
    name: "P4.5",
    matches: (filePath) => filePath.startsWith(P45_PREFIX),
    reason: (filePath) => `${filePath} affects the isolated P4.5 product-shell prototype.`,
    commands: P45_COMMANDS,
  },
  {
    name: "Docs",
    matches: (filePath) => isMarkdown(filePath)
      || filePath === "AGENTS.md"
      || filePath === "PROJECT_STATUS.md",
    reason: (filePath) => `${filePath} requires documentation and link checks.`,
  },
  {
    name: "Tooling",
    matches: (filePath) => filePath === "skills-lock.json"
      || filePath.startsWith(".agents/")
      || filePath.startsWith(".codex/"),
    reason: (filePath) => `${filePath} affects Codex tooling or repository automation guidance.`,
  },
  {
    name: "Full regression",
    matches: isCriticalPath,
    reason: (filePath) => `${filePath} is shared, authority-critical, or integration-critical.`,
  },
];

function addRecommendation(checks, rule, filePath) {
  if (!checks.has(rule.name)) checks.set(rule.name, { reasons: new Set(), commands: new Set() });
  const recommendation = checks.get(rule.name);
  recommendation.reasons.add(rule.reason(filePath));
  for (const command of rule.commands ?? []) recommendation.commands.add(command);
}

function addReason(checks, name, reason) {
  if (!checks.has(name)) checks.set(name, { reasons: new Set(), commands: new Set() });
  checks.get(name).reasons.add(reason);
}

export function selectChecks(inputPaths) {
  const checks = new Map();
  const normalizedPaths = [...new Set(inputPaths.map(normalizeRepoPath).filter(Boolean))]
    .sort((left, right) => left.localeCompare(right));

  for (const filePath of normalizedPaths) {
    const matchingRules = CHECK_RULES.filter((rule) => rule.matches(filePath));
    for (const rule of matchingRules) addRecommendation(checks, rule, filePath);
    if (!matchingRules.length) addReason(
      checks,
      "Full regression",
      `${filePath} has no narrower verified mapping; use the safe superset.`,
    );
  }

  const includesP45 = normalizedPaths.some((filePath) => filePath.startsWith(P45_PREFIX));
  const includesSharedCoreOrSchema = normalizedPaths.some((filePath) => filePath.startsWith("packages/studio5-core/")
    || /(^|\/)(schema|migrations)(\/|$)/.test(filePath)
    || /(^|\/)schema\.[^/]+$/.test(filePath));
  if (includesP45 && includesSharedCoreOrSchema) addReason(
    checks,
    "Full regression",
    "P4.5 mixed with shared Core, schema, or migration paths requires the safe superset.",
  );

  return ORDER
    .filter((name) => checks.has(name))
    .map((name) => ({
      name,
      reasons: [...checks.get(name).reasons].sort((left, right) => left.localeCompare(right)),
      commands: [...checks.get(name).commands].sort((left, right) => left.localeCompare(right)),
    }));
}

function changedPathsForOptions(options, cwd) {
  if (!options.base) return options.files;
  return [...new Set([...collectChangedPaths(options.base, cwd), ...options.files])];
}

function printChecks(checks) {
  process.stdout.write("Recommended checks:\n");
  for (const check of checks) {
    process.stdout.write(`- ${check.name}\n`);
    for (const reason of check.reasons) process.stdout.write(`  - ${reason}\n`);
    for (const command of check.commands) process.stdout.write(`  - run: ${command}\n`);
  }
}

export function parseArguments(argv) {
  const parsed = { base: "", files: [], help: false };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--help") parsed.help = true;
    else if (argument === "--base" || argument === "--file") {
      const value = argv[++index];
      if (!value || value.startsWith("--")) throw new Error(`${argument} requires a value.`);
      if (argument === "--base") parsed.base = value;
      else parsed.files.push(value);
    } else throw new Error(`Unknown argument: ${argument}`);
  }
  return parsed;
}

export function main(argv = process.argv.slice(2), cwd = process.cwd()) {
  let options;
  try {
    options = parseArguments(argv);
    if (options.help) {
      process.stdout.write(HELP);
      return 0;
    }
    if (!options.base && !options.files.length) {
      throw new Error("Provide --base or at least one --file.");
    }
    const checks = selectChecks(changedPathsForOptions(options, cwd));
    if (!checks.length) {
      process.stdout.write("No changed files; no checks recommended.\n");
      return 0;
    }
    printChecks(checks);
    return 0;
  } catch (error) {
    process.stderr.write(`select-checks: ${error.message}\n${HELP}`);
    return 2;
  }
}

const currentFile = path.resolve(fileURLToPath(import.meta.url));
if (process.argv[1] && currentFile === path.resolve(process.argv[1])) {
  process.exitCode = main();
}
