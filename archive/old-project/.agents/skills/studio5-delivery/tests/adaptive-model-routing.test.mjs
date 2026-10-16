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

test("R1 is eligible, but not forced, for bounded low-ambiguity repeated proven patterns", () => {
  const routing = read(routingPath);
  assert.match(routing, /R1[^\n]*eligible, but never forced/i);
  assert.match(routing, /bounded, low-ambiguity,[\s\S]*repeated proven pattern/i);
});

test("medium or large context alone does not require R2", () => {
  assert.match(read(routingPath), /Medium or large context volume alone does not require `R2`/i);
});

test("schema or migration changes retain deep-work escalation", () => {
  const routing = read(routingPath);
  assert.match(routing, /A new schema or migration/i);
  assert.match(routing, /reason for `R2` or a stronger route/i);
});

test("storage persistence and recovery changes retain deep-work escalation", () => {
  const routing = read(routingPath);
  assert.match(routing, /storage or persistence semantics, backup or recovery/i);
  assert.match(routing, /actual deep-work\s+reason/i);
});

test("significant new architecture remains eligible for architecture escalation", () => {
  const routing = read(routingPath);
  assert.match(routing, /Significant new\s+architecture judgment is a reason to consider `R4` and C/i);
  assert.match(routing, /reuse of an approved\s+architecture is not architecture escalation/i);
});

test("a production label or read-only existing Core projection alone does not require R2", () => {
  const routing = read(routingPath);
  assert.match(routing, /PRODUCTION`?\s+label/i);
  assert.match(routing, /read-only projection of an existing Core contract alone also does\s+not require `R2`/i);
});

test("mechanicality is a downward routing signal", () => {
  const routing = read(routingPath);
  assert.match(routing, /Mechanicality is also a downward signal/i);
  assert.match(routing, /repetitive implementation is not, by itself, a reason to request `R2`/i);
});

test("R2 retains concrete deep-implementation reasons", () => {
  const routing = read(routingPath);
  assert.match(routing, /Use `R2` only when concrete deep-implementation reasons remain/i);
  assert.match(routing, /complex production behavior, difficult correctness/i);
});

test("routine low-risk B review is not R3 solely because of its role", () => {
  assert.match(read(routingPath), /B role does not itself require `R3`/i);
});

test("high-risk regression assurance review remains R3 while regression alone does not", () => {
  const routing = read(routingPath);
  assert.match(routing, /Use `R3` for high-risk regression, security-sensitive,\s+or risky-logic assurance review/i);
  assert.match(routing, /R3[^\n]*review of high-risk regressions or edge cases, security-sensitive logic, or risky logic/i);
  assert.doesNotMatch(routing, /Use `R3` for high-risk, security-sensitive, regression,/i);
  assert.doesNotMatch(routing, /R3[^\n]*review of regressions, edge cases, security, or risky logic/i);
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
