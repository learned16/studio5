import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { collectChangedEntries, normalizeRepoPath } from "./verify-scope.mjs";

const HELP = `Usage: node verify-changed-text-encoding.mjs --base <ref>\n\nValidate only newly introduced UTF-8 or high-confidence mojibake defects in changed text.\n`;
const decoder = new TextDecoder("utf-8", { fatal: true });
const mojibakePatterns = [
  /\u00e2\u20ac\u00a6/g, // UTF-8 ellipsis decoded as Windows-1252.
  /\u00e2\u20ac\u201d/g, // UTF-8 em dash decoded as Windows-1252.
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
    const continuation = (offset) => index + offset < bytes.length
      && bytes[index + offset] >= 0x80 && bytes[index + offset] <= 0xbf;
    const expectedLength = first >= 0xc2 && first <= 0xdf ? 2
      : first >= 0xe0 && first <= 0xef ? 3
        : first >= 0xf0 && first <= 0xf4 ? 4 : 0;
    const valid = first <= 0x7f || (expectedLength === 2 && continuation(1))
      || (expectedLength === 3 && continuation(1) && continuation(2)
        && !(first === 0xe0 && bytes[index + 1] < 0xa0)
        && !(first === 0xed && bytes[index + 1] > 0x9f))
      || (expectedLength === 4 && continuation(1) && continuation(2) && continuation(3)
        && !(first === 0xf0 && bytes[index + 1] < 0x90)
        && !(first === 0xf4 && bytes[index + 1] > 0x8f));
    if (valid) index += expectedLength || 1;
    else {
      const length = expectedLength || 1;
      sequences.push({ bytes: bytes.subarray(index, Math.min(bytes.length, index + length)), offset: index });
      index += length;
    }
  }
  return sequences;
}

function hasPrefix(bytes, signature) {
  return signature.every((byte, index) => bytes[index] === byte);
}

function isBinaryBytes(bytes) {
  return bytes.includes(0)
    || hasPrefix(bytes, [0xff, 0xd8, 0xff])
    || hasPrefix(bytes, [0x89, 0x50, 0x4e, 0x47]);
}

function isBinaryDiff(base, filePath, cwd) {
  return git(["diff", "--numstat", "--no-ext-diff", base, "--", filePath], cwd, "utf8")
    .split("\n")
    .some((line) => line.startsWith("-\t-\t"));
}

function lineAt(text, offset) {
  return text.slice(0, offset).split("\n").length;
}

function byteLineAt(bytes, offset) {
  let line = 1;
  for (let index = 0; index < offset; index += 1) if (bytes[index] === 0x0a) line += 1;
  return line;
}

function columnAt(text, offset) {
  return offset - text.lastIndexOf("\n", offset - 1);
}

function byteColumnAt(bytes, offset) {
  let start = offset;
  while (start > 0 && bytes[start - 1] !== 0x0a) start -= 1;
  return offset - start + 1;
}

function collectTextDefects(bytes) {
  const text = decoder.decode(bytes);
  const defects = [];
  for (const pattern of mojibakePatterns) {
    pattern.lastIndex = 0;
    for (let match = pattern.exec(text); match; match = pattern.exec(text)) {
      const category = match[0] === "\ufffd" ? "replacement-character" : "mojibake-signature";
      defects.push({ line: lineAt(text, match.index), column: columnAt(text, match.index), category, signature: `${category}:${match[0]}`, token: match[0] });
    }
  }
  return defects;
}

function introducedOccurrences(current, baseline, baselineText, currentText) {
  const historical = new Map();
  for (const defect of baseline) {
    const key = `${defect.line}:${defect.signature}`;
    historical.set(key, (historical.get(key) ?? 0) + 1);
  }
  const baselineLines = baselineText.split("\n");
  const baselineLineNumbers = new Map();
  for (const [index, line] of baselineLines.entries()) {
    const entries = baselineLineNumbers.get(line) ?? [];
    entries.push(index + 1); baselineLineNumbers.set(line, entries);
  }
  const unchangedLines = new Map();
  for (const [index, line] of currentText.split("\n").entries()) {
    unchangedLines.set(index + 1, baselineLineNumbers.get(line) ?? []);
  }
  return current.filter((defect) => {
    const candidates = [defect.line, ...(unchangedLines.get(defect.line) ?? [])];
    for (const baselineLine of candidates) {
      const key = `${baselineLine}:${defect.signature}`;
      const count = historical.get(key) ?? 0;
      if (count && sameOccurrenceContext(baselineLines[baselineLine - 1], currentText.split("\n")[defect.line - 1], defect.token)) {
        historical.set(key, count - 1); return false;
      }
    }
    return true;
  });
}

function sameOccurrenceContext(baselineLine, currentLine, token) {
  if (baselineLine === currentLine) return true;
  const [historicalBefore, historicalAfter] = baselineLine.split(token);
  const [currentBefore, currentAfter] = currentLine.split(token);
  const overlaps = (left, right) => {
    const normalizedLeft = left.replace(/[\r\n]/g, "");
    const normalizedRight = right.replace(/[\r\n]/g, "");
    return normalizedLeft.length > 0 && normalizedRight.length > 0
      && (normalizedLeft.includes(normalizedRight) || normalizedRight.includes(normalizedLeft));
  };
  return overlaps(historicalBefore, currentBefore) || overlaps(historicalAfter, currentAfter);
}

function introducedTextDefects(bytes, baselineBytes) {
  const defects = collectTextDefects(bytes);
  if (!baselineBytes) return defects;

  let historical;
  try {
    historical = collectTextDefects(baselineBytes);
  } catch {
    return defects;
  }
  return introducedOccurrences(defects, historical, decoder.decode(baselineBytes), decoder.decode(bytes));
}

export function findTextDefects(bytes, baselineBytes = null) {
  if (bytes.includes(0)) return [];
  try {
    return introducedTextDefects(bytes, baselineBytes).map(({ line, category }) => ({ line, category }));
  } catch {
    const occurrences = (source) => invalidByteSequences(source).map((sequence) => ({
      line: byteLineAt(source, sequence.offset), column: byteColumnAt(source, sequence.offset), signature: sequence.bytes.toString("hex"), token: sequence.bytes.toString("latin1"), category: "invalid-utf8",
    }));
    const current = occurrences(bytes);
    if (!baselineBytes) return current.map(({ line, category }) => ({ line, category }));
    const baseline = occurrences(baselineBytes);
    return introducedOccurrences(current, baseline, Buffer.from(baselineBytes).toString("latin1"), Buffer.from(bytes).toString("latin1"))
      .map(({ line, category }) => ({ line, category }));
  }
}

function currentBytes(filePath, cwd) {
  return readFileSync(path.join(cwd, filePath));
}

function baseBytes(base, filePath, cwd) {
  const result = spawnSync("git", ["show", `${base}:${filePath}`], { cwd, encoding: null, windowsHide: true });
  return result.status === 0 ? result.stdout : null;
}

function baselinePaths(entries, base, cwd) {
  const paths = new Map();
  const deleted = entries.filter((entry) => entry.status[0] === "D").map((entry) => entry.paths[0]);
  for (const entry of entries) {
    const status = entry.status[0];
    const currentPath = normalizeRepoPath(entry.paths.at(-1));
    if (status === "R") paths.set(currentPath, entry.paths[0]);
    if (status !== "?") continue;
    const current = currentBytes(currentPath, cwd);
    const matches = deleted.filter((sourcePath) => {
      const historical = baseBytes(base, sourcePath, cwd);
      return historical && preservesBaselineIdentity(historical, current);
    });
    if (matches.length === 1) paths.set(currentPath, matches[0]);
  }
  return paths;
}

function preservesBaselineIdentity(historical, current) {
  if (Buffer.compare(historical, current) === 0) return true;
  try {
    const historicalText = decoder.decode(historical);
    const currentText = decoder.decode(current);
    const historicalDefects = collectTextDefects(historical);
    const currentDefects = collectTextDefects(current);
    const historicalLines = historicalText.split("\n");
    const currentLines = currentText.split("\n");
    return historicalDefects.length > 0
      && historicalDefects.every((defect) => currentDefects.some((candidate) => candidate.signature === defect.signature
        && sameOccurrenceContext(historicalLines[defect.line - 1], currentLines[candidate.line - 1], defect.token)))
      && historicalLines.some((line) => line !== "" && currentLines.includes(line));
  } catch {
    return false;
  }
}

function defectsForEntry(entry, base, cwd, baselinePath) {
  const status = entry.status[0];
  if (status === "D") return [];
  const filePath = normalizeRepoPath(entry.paths.at(-1));
  const bytes = currentBytes(filePath, cwd);
  if (isBinaryBytes(bytes) || (status !== "?" && isBinaryDiff(base, filePath, cwd))) return [];
  const baseline = baselinePath ? baseBytes(base, baselinePath, cwd) : status === "?" || status === "A" ? null : baseBytes(base, filePath, cwd);
  const wholeFileDefects = findTextDefects(bytes, baseline);
  return wholeFileDefects.map((defect) => ({ filePath, ...defect }));
}

function defectsForEntries(entries, base, cwd) {
  const baselines = baselinePaths(entries, base, cwd);
  return entries.flatMap((entry) => defectsForEntry(entry, base, cwd, baselines.get(normalizeRepoPath(entry.paths.at(-1)))));
}

export function main(argv = process.argv.slice(2), cwd = process.cwd()) {
  let options;
  try {
    options = parseArguments(argv);
    if (options.help) { process.stdout.write(HELP); return 0; }
    if (!options.base) throw new Error("--base is required.");
  } catch (error) { process.stderr.write(`verify-changed-text-encoding: ${error.message}\n${HELP}`); return 2; }
  try {
    const defects = defectsForEntries(collectChangedEntries(options.base, cwd), options.base, cwd);
    if (!defects.length) { process.stdout.write("Changed text encoding PASS.\n"); return 0; }
    for (const defect of defects) process.stderr.write(`${defect.filePath}:${defect.line}: ${defect.category}\n`);
    return 1;
  } catch (error) { process.stderr.write(`verify-changed-text-encoding: ${error.message}\n`); return 2; }
}

const currentFile = path.resolve(fileURLToPath(import.meta.url));
if (process.argv[1] && currentFile === path.resolve(process.argv[1])) process.exitCode = main();
