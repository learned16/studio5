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

test("skill delivery report and master prompt require auditable adaptive evidence", () => {
  const texts = [
    read(".agents/skills/studio5-delivery/SKILL.md"),
    read(".agents/skills/studio5-delivery/references/task-routing.md"),
    read(".agents/skills/studio5-delivery/references/delivery-loop.md"),
    read(".agents/skills/studio5-delivery/references/report-contract.md"),
    read(".agents/skills/studio5-delivery/assets/master-autopilot-prompt.md"),
  ].join("\n");
  for (const requiredPhrase of [
    "adaptive-model-routing.md",
    "lowest sufficient",
    "requested/effective",
    "fallback",
    "owner override",
  ]) assert.match(texts, new RegExp(requiredPhrase, "i"));
  assert.doesNotMatch(texts, /\bgpt-[\w.-]+\b/i);
});
