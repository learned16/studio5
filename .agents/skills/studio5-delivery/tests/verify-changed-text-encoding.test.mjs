import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync, renameSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { main } from "../scripts/verify-changed-text-encoding.mjs";

const windows1252 = new TextDecoder("windows-1252");
const utf8 = new TextEncoder();
const ellipsisMojibake = windows1252.decode(utf8.encode("\u2026"));
const dashMojibake = windows1252.decode(utf8.encode("\u2014"));
const replacement = String.fromCodePoint(0xfffd);

function fixture(baseText = "base\n") {
  const cwd = mkdtempSync(path.join(os.tmpdir(), "studio5-utf8-"));
  execFileSync("git", ["init", "-q"], { cwd });
  execFileSync("git", ["config", "user.email", "test@example.invalid"], { cwd });
  execFileSync("git", ["config", "user.name", "Test"], { cwd });
  writeFileSync(path.join(cwd, "sample.txt"), baseText);
  execFileSync("git", ["add", "."], { cwd }); execFileSync("git", ["commit", "-qm", "base"], { cwd });
  return cwd;
}
function run(cwd) { return main(["--base", "HEAD"], cwd); }
function withFixture(callback) { const cwd = fixture(); try { callback(cwd); } finally { rmSync(cwd, { recursive: true, force: true }); } }

test("valid ASCII, Arabic, mixed text, and typography pass", () => withFixture((cwd) => {
  writeFileSync(path.join(cwd, "sample.txt"), "English\nمرحبا\nArabic and English\nLoading file versions\u2026 — “quoted”\n");
  assert.equal(run(cwd), 0);
}));
test("known ellipsis mojibake fails", () => withFixture((cwd) => { writeFileSync(path.join(cwd, "sample.txt"), `bad ${ellipsisMojibake}\n`); assert.equal(run(cwd), 1); }));
test("Windows-1252 decoding maps UTF-8 em dash to the actual mojibake code points", () => {
  assert.deepEqual([...dashMojibake].map((character) => character.codePointAt(0)), [0x00e2, 0x20ac, 0x201d]);
});
test("actual Windows-1252 em dash mojibake fails while a valid em dash passes", () => withFixture((cwd) => {
  writeFileSync(path.join(cwd, "sample.txt"), "valid \u2014\n"); assert.equal(run(cwd), 0);
  writeFileSync(path.join(cwd, "sample.txt"), `bad ${dashMojibake}\n`); assert.equal(run(cwd), 1);
}));
test("replacement character fails", () => withFixture((cwd) => { writeFileSync(path.join(cwd, "sample.txt"), `bad ${replacement}\n`); assert.equal(run(cwd), 1); }));
test("legitimate Latin Unicode passes", () => withFixture((cwd) => { writeFileSync(path.join(cwd, "sample.txt"), "François and Ãƒ are valid text\n"); assert.equal(run(cwd), 0); }));
test("large context does not alter a clean result", () => withFixture((cwd) => { writeFileSync(path.join(cwd, "sample.txt"), `${"context\n".repeat(2000)}مرحبا\n`); assert.equal(run(cwd), 0); }));
test("unchanged historical mojibake does not block an unrelated changed line", () => withFixture((cwd) => {
  writeFileSync(path.join(cwd, "sample.txt"), `old ${ellipsisMojibake}\nbase\n`); execFileSync("git", ["add", "."], { cwd }); execFileSync("git", ["commit", "-qm", "historical"], { cwd });
  writeFileSync(path.join(cwd, "sample.txt"), `old ${ellipsisMojibake}\nchanged\n`); assert.equal(run(cwd), 0);
}));
test("unchanged historical mojibake on a modified line remains non-blocking", () => withFixture((cwd) => {
  writeFileSync(path.join(cwd, "sample.txt"), `old ${ellipsisMojibake} label\n`); execFileSync("git", ["add", "."], { cwd }); execFileSync("git", ["commit", "-qm", "historical"], { cwd });
  writeFileSync(path.join(cwd, "sample.txt"), `old ${ellipsisMojibake} renamed label\n`); assert.equal(run(cwd), 0);
}));
test("new mojibake on a modified line fails", () => withFixture((cwd) => {
  writeFileSync(path.join(cwd, "sample.txt"), "clean label\n");
  writeFileSync(path.join(cwd, "sample.txt"), `changed ${ellipsisMojibake} label\n`); assert.equal(run(cwd), 1);
}));
test("additional mojibake beside a preserved historical defect fails", () => withFixture((cwd) => {
  writeFileSync(path.join(cwd, "sample.txt"), `old ${ellipsisMojibake} label\n`); execFileSync("git", ["add", "."], { cwd }); execFileSync("git", ["commit", "-qm", "historical"], { cwd });
  writeFileSync(path.join(cwd, "sample.txt"), `old ${ellipsisMojibake} and new ${ellipsisMojibake}\n`); assert.equal(run(cwd), 1);
}));
test("deleted file passes", () => withFixture((cwd) => { rmSync(path.join(cwd, "sample.txt")); assert.equal(run(cwd), 0); }));
test("binary content is skipped", () => withFixture((cwd) => { writeFileSync(path.join(cwd, "sample.txt"), Buffer.from([0, 0xff])); assert.equal(run(cwd), 0); }));
test("NUL-free JPEG binary content is skipped", () => withFixture((cwd) => { writeFileSync(path.join(cwd, "sample.txt"), Buffer.from([0xff, 0xd8, 0xff, 0xc3])); assert.equal(run(cwd), 0); }));
test("intentional fixture construction catches malformed data without a bypass", () => withFixture((cwd) => { writeFileSync(path.join(cwd, "sample.txt"), `fixture ${ellipsisMojibake}\n`); assert.equal(run(cwd), 1); }));
test("failure evidence names repository-relative path, line, and category", () => withFixture((cwd) => {
  writeFileSync(path.join(cwd, "sample.txt"), `ok\nbad ${ellipsisMojibake}\n`); const writes = []; const original = process.stderr.write; process.stderr.write = (text) => { writes.push(String(text)); return true; };
  try { assert.equal(run(cwd), 1); } finally { process.stderr.write = original; } assert.match(writes.join(""), /sample\.txt:2: mojibake-signature/);
}));
test("added and modified files are scanned", () => withFixture((cwd) => { writeFileSync(path.join(cwd, "sample.txt"), "modified\n"); writeFileSync(path.join(cwd, "added.txt"), `bad ${ellipsisMojibake}\n`); assert.equal(run(cwd), 1); }));
test("pure working-tree rename preserves historical mojibake baseline", () => withFixture((cwd) => {
  writeFileSync(path.join(cwd, "sample.txt"), `old ${ellipsisMojibake}\n`); execFileSync("git", ["add", "."], { cwd }); execFileSync("git", ["commit", "-qm", "historical"], { cwd });
  renameSync(path.join(cwd, "sample.txt"), path.join(cwd, "renamed.txt")); assert.equal(run(cwd), 0);
}));
test("working-tree renamed file with new mojibake fails", () => withFixture((cwd) => {
  writeFileSync(path.join(cwd, "sample.txt"), `old ${ellipsisMojibake}\n`); execFileSync("git", ["add", "."], { cwd }); execFileSync("git", ["commit", "-qm", "historical"], { cwd });
  renameSync(path.join(cwd, "sample.txt"), path.join(cwd, "renamed.txt")); writeFileSync(path.join(cwd, "renamed.txt"), `old ${ellipsisMojibake} new ${ellipsisMojibake}\n`); assert.equal(run(cwd), 1);
}));
test("tracked rename preserves historical mojibake baseline", () => withFixture((cwd) => {
  writeFileSync(path.join(cwd, "sample.txt"), `old ${ellipsisMojibake}\n`); execFileSync("git", ["add", "."], { cwd }); execFileSync("git", ["commit", "-qm", "historical"], { cwd });
  renameSync(path.join(cwd, "sample.txt"), path.join(cwd, "renamed.txt")); execFileSync("git", ["add", "-N", "renamed.txt"], { cwd }); assert.equal(run(cwd), 0);
}));
test("tracked renamed file with new mojibake fails", () => withFixture((cwd) => {
  writeFileSync(path.join(cwd, "sample.txt"), `old ${ellipsisMojibake}\n`); execFileSync("git", ["add", "."], { cwd }); execFileSync("git", ["commit", "-qm", "historical"], { cwd });
  renameSync(path.join(cwd, "sample.txt"), path.join(cwd, "renamed.txt")); writeFileSync(path.join(cwd, "renamed.txt"), `old ${ellipsisMojibake} new ${ellipsisMojibake}\n`); execFileSync("git", ["add", "-N", "renamed.txt"], { cwd }); assert.equal(run(cwd), 1);
}));
test("new invalid UTF-8 bytes fail deterministically", () => withFixture((cwd) => { writeFileSync(path.join(cwd, "sample.txt"), Buffer.from([0x61, 0xc3, 0x28])); assert.equal(run(cwd), 1); }));
test("overlong UTF-8 sequences fail deterministically", () => withFixture((cwd) => { writeFileSync(path.join(cwd, "sample.txt"), Buffer.from([0xe0, 0x80, 0x80])); assert.equal(run(cwd), 1); }));
test("a different invalid byte is introduced despite an invalid baseline", () => withFixture((cwd) => {
  writeFileSync(path.join(cwd, "sample.txt"), Buffer.from([0x61, 0xc3])); execFileSync("git", ["add", "."], { cwd }); execFileSync("git", ["commit", "-qm", "invalid baseline"], { cwd });
  writeFileSync(path.join(cwd, "sample.txt"), Buffer.from([0x61, 0xc2])); assert.equal(run(cwd), 1);
}));
test("an additional identical invalid sequence exceeds the baseline count", () => withFixture((cwd) => {
  writeFileSync(path.join(cwd, "sample.txt"), Buffer.from([0x61, 0xc3])); execFileSync("git", ["add", "."], { cwd }); execFileSync("git", ["commit", "-qm", "invalid baseline"], { cwd });
  writeFileSync(path.join(cwd, "sample.txt"), Buffer.from([0x61, 0xc3, 0x62, 0xc3])); assert.equal(run(cwd), 1);
}));
