import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const context = vm.createContext({
  S5: { act: {} },
  document: { addEventListener() {} }
});

for (const file of ["src/college/05-syllabus.js", "src/college/06-syllabus-ar.js"]) {
  vm.runInContext(readFileSync(file, "utf8"), context, { filename: file });
}

const source = context.S5.SYLLABUS;
const translated = context.S5.SYLLABUS_AR;
const arabicLetters = /[\u0600-\u06FF]/;
const failures = [];

for (const [subject, topics] of Object.entries(source)) {
  const arabicTopics = translated[subject];
  if (!arabicTopics) {
    failures.push(`${subject}: missing Arabic subject entry`);
    continue;
  }
  if (arabicTopics.length !== topics.length) {
    failures.push(`${subject}: expected ${topics.length} topics, found ${arabicTopics.length}`);
  }

  for (const [index, [week, englishTopic]] of topics.entries()) {
    const entry = arabicTopics[index];
    if (!entry) {
      failures.push(`${subject} week ${week}: missing Arabic topic`);
      continue;
    }
    if (entry[0] !== week) {
      failures.push(`${subject} topic ${index + 1}: expected week ${week}, found ${entry[0]}`);
    }
    if (typeof entry[1] !== "string" || !entry[1].trim() || !arabicLetters.test(entry[1])) {
      failures.push(`${subject} week ${week} (${englishTopic}): Arabic name is empty or has no Arabic letters`);
    }
  }
}

for (const subject of Object.keys(translated)) {
  if (!Object.hasOwn(source, subject)) failures.push(`${subject}: no matching English subject entry`);
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  const count = Object.values(source).reduce((sum, topics) => sum + topics.length, 0);
  console.log(`Arabic syllabus coverage passed: ${Object.keys(source).length} subjects, ${count} topics.`);
}
