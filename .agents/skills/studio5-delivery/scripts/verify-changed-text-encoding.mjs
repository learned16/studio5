import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { collectChangedEntries, normalizeRepoPath } from "./verify-scope.mjs";

const HELP = `Usage: node verify-changed-text-encoding.mjs --base <ref>\n\nValidate only newly introduced UTF-8 or high-confidence mojibake defects in changed text.\n`;
const decoder = new TextDecoder("utf-8", { fatal: true });
const mojibakePatterns = [
  /\u00e2\u20ac\u00a6/g, // UTF-8 ellipsis decoded as Windows-1252.
  /\u00e2\u20ac\u2014/g, // UTF-8 em dash decoded as Windows-1252.
  /\u00c3\u00a2\u00e2\u201a\u00ac(?:\u00a6|\u201d|\u2014|\u0153)/g,
  /\ufffd/g,
];

function git(args, cwd, encoding = null) {
  const command = spawnSync("git", args, { cwd, encoding, windowsHide: true });
  if (command.error) throw command.error;
  if (command.status !== 0) throw new Error(command.stderr?.toString("utf8").trim() || `git ${args.join(" ")} failed`);
  return command.stdout;
}

function parseArguments(argv) {
  const options = { base: "", help: false };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--help") options.help = true;
    else if (argument === "--base") {
      const value = argv[++index];
      if (!value || value.startsWith("--")) throw new Error("--base requires a value.");
      options.base = value;
    } else throw new Error(`Unknown argument: ${argument}`);
  }
  return options;
}

function invalidByteSequences(bytes) {
  const sequences = [];
  for (let index = 0; index < bytes.length;) {
    const first = bytes[index];
    const continuation = (offset) => index + offset < bytes.length && (bytes[index + offset] & 0xc0) === 0x80;
    const length = first <= 0x7f ? 1 : first >= 0xc2 && first <= 0xdf && continuation(1) ? 2
      : first >= 0xe0 && first <= 0xef && continuation(1) && continuation(2) ? 3
        : first >= 0xf0 && first <= 0xf4 && continuation(1) && continuation(2) && continuation(3) ? 4 : 0;
    if (!length) sequences.push(Buffer.from([first]));
    index += length || 1;
  }
  return sequences;
}

function lineAt(text, offset) {
  return text.slice(0, offset).split("\n").length;
}

export function findTextDefects(bytes, baselineBytes = null) {
  if (bytes.includes(0)) return [];
  let text;
  try {
    text = decoder.decode(bytes);
  } catch {
    const baseline = baselineBytes ? invalidByteSequences(baselineBytes).map(String) : [];
    const introduced = invalidByteSequences(bytes).some((sequence) => !baseline.includes(String(sequence)));
    return introduced ? [{ line: 1, category: "invalid-utf8" }] : [];
  }
  const defects = [];
  for (const pattern of mojibakePatterns) {
    pattern.lastIndex = 0;
    for (let match = pattern.exec(text); match; match = pattern.exec(text)) {
      defects.push({ line: lineAt(text, match.index), category: match[0] === "\ufffd" ? "replacement-character" : "mojibake-signature" });
    }
  }
  return defects;
}

function currentBytes(filePath, cwd) {
  return readFileSync(path.join(cwd, filePath));
}

function baseBytes(base, filePath, cwd) {
  const result = spawnSync("git", ["show", `${base}:${filePath}`], { cwd, encoding: null, windowsHide: true });
  return result.status === 0 ? result.stdout : null;
}

function addedLines(base, filePath, cwd, untracked) {
  if (untracked) return decoder.decode(currentBytes(filePath, cwd)).split("\n").map((text, index) => ({ line: index + 1, text }));
  const diff = git(["diff", "--no-ext-diff", "--unified=0", base, "--", filePath], cwd, "utf8");
  const lines = [];
  let nextLine = 0;
  for (const line of diff.split("\n")) {
    const header = /^@@ -\d+(?:,\d+)? \+(\d+)/.exec(line);
    if (header) nextLine = Number(header[1]);
    else if (line.startsWith("+") && !line.startsWith("+++")) lines.push({ line: nextLine++, text: line.slice(1) });
    else if (!line.startsWith("-")) nextLine += line && !line.startsWith("@@") ? 1 : 0;
  }
  return lines;
}

function defectsForEntry(entry, base, cwd) {
  const status = entry.status[0];
  if (status === "D") return [];
  const filePath = normalizeRepoPath(entry.paths.at(-1));
  const bytes = currentBytes(filePath, cwd);
  const baseline = status === "?" || status === "A" ? null : baseBytes(base, filePath, cwd);
  const wholeFileDefects = findTextDefects(bytes, baseline);
  if (wholeFileDefects.some((defect) => defect.category === "invalid-utf8") || bytes.includes(0)) {
    return wholeFileDefects.map((defect) => ({ filePath, ...defect }));
  }
  const introducedLines = new Set(addedLines(base, filePath, cwd, status === "?").filter(({ text }) => findTextDefects(Buffer.from(text)).length).map(({ line }) => line));
  return wholeFileDefects.filter((defect) => introducedLines.has(defect.line)).map((defect) => ({ filePath, ...defect }));
}

export function main(argv = process.argv.slice(2), cwd = process.cwd()) {
  let options;
  try {
    options = parseArguments(argv);
    if (options.help) { process.stdout.write(HELP); return 0; }
    if (!options.base) throw new Error("--base is required.");
  } catch (error) { process.stderr.write(`verify-changed-text-encoding: ${error.message}\n${HELP}`); return 2; }
  try {
    const defects = collectChangedEntries(options.base, cwd).flatMap((entry) => defectsForEntry(entry, options.base, cwd));
    if (!defects.length) { process.stdout.write("Changed text encoding PASS.\n"); return 0; }
    for (const defect of defects) process.stderr.write(`${defect.filePath}:${defect.line}: ${defect.category}\n`);
    return 1;
  } catch (error) { process.stderr.write(`verify-changed-text-encoding: ${error.message}\n`); return 2; }
}

const currentFile = path.resolve(fileURLToPath(import.meta.url));
if (process.argv[1] && currentFile === path.resolve(process.argv[1])) process.exitCode = main();
