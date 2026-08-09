import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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

test("bare continue reconciles live state and stops when the previous delivery is unmerged", () => {
  const contract = readRepositoryFile(
    ".agents/skills/studio5-delivery/references/continue-control-plane.md",
  );
  const prompt = readRepositoryFile(
    ".agents/skills/studio5-delivery/assets/master-autopilot-prompt.md",
  );

  for (const text of [contract, prompt]) {
    assert.match(text, /live repository truth/i);
    assert.match(text, /Do not use conversation memory as repository state/i);
    assert.match(text, /previous (?:delivery|Pull Request).*not integrated.*stop.*human merge gate/s);
    assert.match(text, /merge-method-aware/i);
    assert.match(text, /current `origin\/develop`/i);
  }
});

test("continue selects one eligible task with blockers before dependents and no routine owner routing", () => {
  const contract = readRepositoryFile(
    ".agents/skills/studio5-delivery/references/continue-control-plane.md",
  );
  const routing = readRepositoryFile(
    ".agents/skills/studio5-delivery/references/task-routing.md",
  );

  for (const text of [contract, routing]) {
    assert.match(text, /exactly one highest\s+eligible(?: uncompleted)? and unblocked task/i);
    assert.match(text, /Resolve blockers before dependents/i);
    assert.match(text, /Do not\s+ask the owner.*ordinary (?:engineering|technical)/is);
  }
  assert.match(contract, /single `continue` never starts multiple\s+tasks/i);
});

test("continue preserves A stop, independent B mutation verification, and delivery ordering", () => {
  const contract = readRepositoryFile(
    ".agents/skills/studio5-delivery/references/continue-control-plane.md",
  );

  assertOrdered(contract, [
    "Supervisor establishes live truth and selects one task",
    "A implements only the allowed scope",
    "A commits and stops before remote delivery",
    "independent behaviorally no-write B review",
    "supervisor verifies the mutation guard",
    "supervisor pushes",
    "supervisor opens a Draft PR",
    "current GitHub CI passes",
    "stop before the owner merge gate",
  ]);
  assert.match(contract, /must not occur before both B review and mutation\s+verification pass/i);
  assert.match(contract, /writable\s+parent.*not an enforced per-agent read-only sandbox/s);
  assert.match(contract, /repository mutation invalidates B's verdict/i);
});

test("continue stays subscription-only and cannot default C or later product phases", () => {
  const contract = readRepositoryFile(
    ".agents/skills/studio5-delivery/references/continue-control-plane.md",
  );
  const task = readRepositoryFile("docs/tasks/OPS-AUTOPILOT-004.md");

  assert.match(contract, /does not request or require an `OPENAI_API_KEY`/i);
  assert.match(contract, /does not invoke the OpenAI API or Codex GitHub Action/i);
  assert.match(contract, /does not use Full access/i);
  assert.match(contract, /does not enable automatic merge/i);
  assert.match(contract, /does not start Phase 4\.5 or Phase 5/i);
  assert.match(contract, /C is not a default loop step/i);
  assert.match(contract, /Production scope.*eligible task card/i);
  assert.match(task, /No API key, Codex GitHub Action, Full access, unsafe bypass, automatic merge/s);
  assert.match(task, /Phase 4\.5, Phase 5, or Production change is introduced/i);
});
