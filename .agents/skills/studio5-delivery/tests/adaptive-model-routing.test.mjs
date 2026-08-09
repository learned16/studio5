import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const skillRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = path.resolve(skillRoot, "../../..");

function read(relativePath) {
  return readFileSync(path.join(repositoryRoot, relativePath), "utf8");
}

const routingPath = ".agents/skills/studio5-delivery/references/adaptive-model-routing.md";

test("routing classifies every required dimension before an A B or C spawn", () => {
  const routing = read(routingPath);
  for (const dimension of [
    "complexity",
    "ambiguity",
    "production risk",
    "code and context volume",
    "architectural judgment",
    "review or security sensitivity",
    "mechanicality",
  ]) assert.match(routing, new RegExp(dimension, "i"));
  assert.match(routing, /before each\s+A, B, or C invocation/i);
});

test("routing uses cost-aware tiers without making trivial documentation maximum effort", () => {
  const routing = read(routingPath);
  for (const tier of ["R0 — economy", "R1 — balanced", "R2 — deep implementation", "R3 — assurance review", "R4 — architecture"]) {
    assert.match(routing, new RegExp(tier.replace("—", "[—-]"), "i"));
  }
  assert.match(routing, /routine documentation correction,[\s\S]*economical/i);
  assert.match(routing, /volume\s+alone does not require maximum reasoning/i);
  assert.match(routing, /highest safety-relevant dimension/i);
});

test("routing falls back safely and keeps quality gates invariant", () => {
  const routing = read(routingPath);
  assert.match(routing, /same capability tier,[\s\S]*next stronger tier/i);
  assert.match(routing, /target,[\s\S]*nearest higher[\s\S]*highest available lower/i);
  assert.match(routing, /unavailability\s+alone\s+is\s+not\s+a\s+task\s+failure/i);
  for (const gate of ["tests", "B review", "scope guards", "human gates"]) {
    assert.match(routing, new RegExp(gate, "i"));
  }
});

test("routing records explicit and inherited invocation truth without reusable pins", () => {
  const routing = read(routingPath);
  assert.match(routing, /fork_turns: "none"/);
  assert.match(routing, /finite positive/i);
  assert.match(routing, /inherits the parent model and reasoning/i);
  assert.match(routing, /NOT EXPOSED/);
  assert.match(routing, /selection_mode/);
  assert.match(routing, /quality_gates_unchanged:\s*true/);
  assert.doesNotMatch(routing, /\bgpt-[\w.-]+\b/i);
  assert.doesNotMatch(routing, /(?:^|\n)\s*model(?:_reasoning_effort)?\s*=/im);
});

test("each critical surface retains its own adaptive-routing contract", () => {
  const surfaces = [
    ["skill", ".agents/skills/studio5-delivery/SKILL.md", ["adaptive-model-routing.md", "lowest sufficient"]],
    ["task routing", ".agents/skills/studio5-delivery/references/task-routing.md", ["adaptive-model-routing.md", "requested/effective", "fallback", "owner override"]],
    ["delivery loop", ".agents/skills/studio5-delivery/references/delivery-loop.md", ["adaptive-model-routing.md", "requested/effective", "fallback", "human gates"]],
    ["report contract", ".agents/skills/studio5-delivery/references/report-contract.md", ["requested/effective", "NOT EXPOSED", "owner override"]],
    ["master prompt", ".agents/skills/studio5-delivery/assets/master-autopilot-prompt.md", ["lowest sufficient", "requested/effective", "fallback", "owner override", "NOT EXPOSED"]],
  ];
  for (const [label, relativePath, requiredPhrases] of surfaces) {
    const text = read(relativePath);
    for (const phrase of requiredPhrases) {
      assert.match(text, new RegExp(phrase, "i"), `${label}: ${phrase}`);
    }
    assert.doesNotMatch(text, /\bgpt-[\w.-]+\b/i, `${label}: reusable model pin`);
  }
});

test("master prompt stays free of transient delivery state and stale phase routing", () => {
  const prompt = read(".agents/skills/studio5-delivery/assets/master-autopilot-prompt.md");
  assert.doesNotMatch(prompt, /PR #\d+/i);
  assert.doesNotMatch(prompt, /\b[0-9a-f]{40}\b/i);
  assert.doesNotMatch(prompt, /\b\d+\/\d+\s+PASS\b/i);
  assert.doesNotMatch(prompt, /(?:chore|feat|fix|test|docs)\/[a-z0-9._/-]+/i);
  assert.doesNotMatch(prompt, /\borigin\/[\w.-]+/i);
  assert.doesNotMatch(prompt, /Phase 4\.5/i);
  assert.match(prompt, /stage unless authority and its task card authorize it/i);
  assert.match(prompt, /Phase 5 remains blocked/i);
});
