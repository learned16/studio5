import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const files = [
  "studio5-app/src/college/40-studio-l2.js",
  "studio5-app/src/i18n-ar-studio2.txt",
];
let failed = false;
const current = new Map();
for (const file of files) {
  const before = execFileSync("git", ["show", `claude/zen-bell-oqcqtr:${file}`], { encoding: "utf8" });
  const after = readFileSync(file, "utf8");
  current.set(file, after);
  const stripArabic = (s) => s.replace(/[\u0600-\u06ff،؛؟«»]+/g, "").replace(/\s+/g, " ").trim();
  if (stripArabic(before) !== stripArabic(after)) {
    console.error(`Non-Arabic content changed in ${file}`);
    failed = true;
  }
}

const src = current.get("studio5-app/src/college/40-studio-l2.js");
const required = [
  "نقطة التلاشي", "أفقي", "المستطيل ${n}", "مدببة", "يلمس", "عريضة", "المحور",
  "متناظرتين", "ارسم", "خط مستقيم", "أدور", "تلمس", "الشريط 1", "الشريط 2",
  "الشريط 3", "متقطع", "الفراغ أطول", "متساوية", "المربع ${k}", "مسكّر",
];
for (const phrase of required) {
  if (!src.includes(phrase)) {
    console.error(`Required Arabic note text is missing: ${phrase}`);
    failed = true;
  }
}
const lineTypes = src.slice(src.indexOf("// 2 — hidden line"), src.indexOf("// 3 — centre line"));
if (!lineTypes.includes("الفراغ أطول") || !lineTypes.includes("الشريط 2")) {
  console.error("The hidden-line note must retain its strip label and gap guidance together.");
  failed = true;
}
if (failed) process.exitCode = 1;
else console.log("EX-004 Arabic-only checks passed (lesson wording and required checker terms)");
