import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const skillRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = path.resolve(skillRoot, "../../..");

function readRepositoryFile(relativePath) {
  return readFileSync(path.join(repositoryRoot, relativePath), "utf8");
}

function assertOrdered(text, fragments) {
  let previousIndex = -1;
  for (const fragment of fragments) {
    const currentIndex = text.indexOf(fragment);
    assert.notEqual(currentIndex, -1, `Missing sequence fragment: ${fragment}`);
    assert.ok(currentIndex > previousIndex, `Out-of-order sequence fragment: ${fragment}`);
    previousIndex = currentIndex;
  }
}

test("subscription-only delivery blocks review bypass and remote delivery before B verification", () => {
  const contract = readRepositoryFile(
    ".agents/skills/studio5-delivery/references/subscription-only-loop.md",
  );

  assertOrdered(contract, [
    "Establish live repository truth",
    "A commits and stops",
    "capture the mutation baseline outside the repository",
    "independent behaviorally no-write B review",
    "verify the mutation guard",
    "supervisor pushes",
    "supervisor opens a Draft PR",
    "inspect current GitHub CI",
    "stop before the owner merge gate",
  ]);
  assert.match(contract, /must not occur before both B review and mutation verification pass/i);
  assert.match(contract, /never mutates\s+the repository or performs delivery actions/i);
  assert.match(contract, /No agent\s+may merge or enable automatic merge/i);
});

test("subscription-only B contract discloses behavioral isolation under a writable parent", () => {
  const contract = readRepositoryFile(
    ".agents/skills/studio5-delivery/references/subscription-only-loop.md",
  );
  const task = readRepositoryFile("docs/tasks/OPS-AUTOPILOT-003.md");

  for (const text of [contract, task]) {
    assert.match(text, /writable (?:parent|supervisor)/i);
    assert.match(text, /behavioral(?:ly)? no-write/i);
    assert.match(text, /not\s+(?:an\s+)?enforced\s+(?:per-agent\s+)?read-only sandbox/i);
    assert.match(text, /mutation guard/i);
  }
});

test("subscription-only validation keeps API spending, agent C, and later phases out of scope", () => {
  const contract = readRepositoryFile(
    ".agents/skills/studio5-delivery/references/subscription-only-loop.md",
  );
  const task = readRepositoryFile("docs/tasks/OPS-AUTOPILOT-003.md");

  assert.match(contract, /does not request an API key/i);
  assert.match(contract, /does not authorize Phase 4\.5 or Phase 5/i);
  assert.match(contract, /C — Prototype & Architecture.*only for a genuine architecture/s);
  assert.match(task, /C.*NOT REQUIRED.*no architecture or research\s+decision is needed/s);
  assert.match(task, /does not use the OpenAI API or Codex GitHub Action/i);
  assert.match(task, /does not use Full access/i);
});

test("current workflows do not add paid Codex execution, secrets, unsafe access, or merge automation", () => {
  const workflowDirectory = path.join(repositoryRoot, ".github/workflows");
  const workflows = readdirSync(workflowDirectory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.ya?ml$/i.test(entry.name))
    .map((entry) => readFileSync(path.join(workflowDirectory, entry.name), "utf8"))
    .join("\n");

  assert.doesNotMatch(workflows, /openai\/codex-action/i);
  assert.doesNotMatch(workflows, /OPENAI_API_KEY/i);
  assert.doesNotMatch(workflows, /danger-full-access|dangerously-bypass|full[- ]access/i);
  assert.doesNotMatch(workflows, /gh\s+pr\s+merge|enablePullRequestAutoMerge|auto[-_ ]merge/i);
});
