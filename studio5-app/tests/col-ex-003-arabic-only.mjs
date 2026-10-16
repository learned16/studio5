import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const files = [
  "studio5-app/src/college/21-gens-calc.js",
  "studio5-app/src/college/22-gens-deriv.js",
];
let failed = false;
for (const file of files) {
  const before = execFileSync("git", ["show", `claude/zen-bell-oqcqtr:${file}`], { encoding: "utf8" });
  const after = readFileSync(file, "utf8");
  const stripArabic = (s) => s.replace(/[\u0600-\u06ff،؛؟]+/g, "").replace(/\s+/g, " ").trim();
  if (stripArabic(before) !== stripArabic(after)) {
    console.error(`Non-Arabic content changed in ${file}`);
    failed = true;
  }
}
if (failed) process.exitCode = 1;
else console.log("EX-003 Arabic-only checks passed (both generator files)");
