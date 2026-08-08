import assert from "node:assert/strict";
import {
  existsSync,
  readdirSync,
  readFileSync,
} from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const skillRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = path.resolve(skillRoot, "../../..");

function readRepositoryFile(relativePath) {
  return readFileSync(path.join(repositoryRoot, relativePath), "utf8");
}

test("studio5-delivery has exact frontmatter and progressive-disclosure resources", () => {
  const skillText = readRepositoryFile(".agents/skills/studio5-delivery/SKILL.md")
    .replaceAll("\r\n", "\n");
  const expectedFrontmatter = [
    "---",
    "name: studio5-delivery",
    "description: Orchestrate Studio5 repository work from current authority and live Git state through task selection, scoped implementation, independent review, verification, Draft PR delivery, and human gates. Use for Studio5 planning, coding, reviews, fixes, CI failures, prototypes, and selecting the next unblocked task.",
    "---",
  ].join("\n");
  assert.equal(skillText.startsWith(expectedFrontmatter), true);
  assert.equal(skillText.split(/\r?\n/).length < 100, true);

  for (const relativePath of [
    "references/authority-and-freshness.md",
    "references/task-routing.md",
    "references/delivery-loop.md",
    "references/human-gates.md",
    "references/report-contract.md",
    "assets/master-autopilot-prompt.md",
  ]) {
    assert.equal(existsSync(path.join(skillRoot, relativePath)), true, relativePath);
  }
});

test("reusable skill does not pin transient repository state", () => {
  const skillText = readRepositoryFile(".agents/skills/studio5-delivery/SKILL.md");
  assert.doesNotMatch(skillText, /PR #\d+/);
  assert.doesNotMatch(skillText, /\b[0-9a-f]{40}\b/i);
  assert.doesNotMatch(skillText, /\b\d+\/\d+\s+PASS\b/);
  assert.doesNotMatch(skillText, /(?:chore|refactor|test|fix)\/[a-z0-9._/-]+/i);
});

test("A, B, and C custom agents have required fields without model pins or secrets", () => {
  const agents = [
    ["studio5-a-production.toml", "studio5_a_production"],
    ["studio5-b-review.toml", "studio5_b_review"],
    ["studio5-c-architecture.toml", "studio5_c_architecture"],
  ];
  for (const [fileName, expectedName] of agents) {
    const agentText = readRepositoryFile(`.codex/agents/${fileName}`);
    assert.match(agentText, new RegExp(`^name = "${expectedName}"`, "m"));
    assert.match(agentText, /^description = ".+"$/m);
    assert.match(agentText, /^developer_instructions = """$/m);
    assert.doesNotMatch(agentText, /^model(?:_reasoning_effort)?\s*=/m);
    assert.doesNotMatch(agentText, /(?:token|api[_-]?key|credential|secret)\s*=/i);
  }
  assert.match(
    readRepositoryFile(".codex/agents/studio5-b-review.toml"),
    /^sandbox_mode = "read-only"$/m,
  );
  const configText = readRepositoryFile(".codex/config.toml");
  assert.match(configText, /^\[agents\]$/m);
  assert.match(configText, /^max_concurrent_threads_per_session = 3$/m);
});

test("Agent A commits and stops while the parent owns review and remote delivery", () => {
  const agentText = readRepositoryFile(".codex/agents/studio5-a-production.toml");
  assert.match(agentText, /Commit the verified change, report the commit and evidence, then stop\./);
  assert.match(agentText, /parent\/supervisor owns independent B review and all remote delivery/i);
  assert.doesNotMatch(agentText, /\bpush\b|draft\s+pr|open (?:a )?(?:pull request|pr)/i);
});

test("required repository skills are installed with guard provenance", () => {
  const installedSkills = readdirSync(path.join(repositoryRoot, ".agents/skills"), {
    withFileTypes: true,
  })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  const requiredSkills = [
    "clean-code-guard",
    "docs-guard",
    "studio5-delivery",
    "test-guard",
  ];
  for (const requiredSkill of requiredSkills) {
    assert.equal(installedSkills.includes(requiredSkill), true, requiredSkill);
  }

  const lock = JSON.parse(readRepositoryFile("skills-lock.json"));
  const requiredGuards = [
    "clean-code-guard",
    "docs-guard",
    "test-guard",
  ];
  for (const guardName of requiredGuards) {
    const guard = lock.skills[guardName];
    assert.ok(guard, guardName);
    assert.equal(guard.source, "amElnagdy/guard-skills");
    assert.equal(existsSync(path.join(repositoryRoot, ".agents/skills", path.dirname(guard.skillPath).split("/").at(-1), "SKILL.md")), true);
  }
});

test("studio5-delivery Markdown links resolve locally", () => {
  const markdownFiles = [
    "AGENTS.md",
    "PROJECT_STATUS.md",
    "docs/TRACEABILITY.md",
    "docs/ink-engine/INK_EXTRACTION_SEQUENCE_EN.md",
    "docs/tasks/OPS-AUTOPILOT-001.md",
    "docs/tasks/P4-INK-EXTRACT-002.md",
  ].map((relativePath) => path.join(repositoryRoot, relativePath));
  const pending = [skillRoot];
  while (pending.length) {
    const currentDirectory = pending.pop();
    for (const entry of readdirSync(currentDirectory, { withFileTypes: true })) {
      const entryPath = path.join(currentDirectory, entry.name);
      if (entry.isDirectory()) pending.push(entryPath);
      else if (entry.name.endsWith(".md")) markdownFiles.push(entryPath);
    }
  }

  for (const markdownPath of markdownFiles) {
    const markdown = readFileSync(markdownPath, "utf8");
    for (const match of markdown.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
      const target = match[1].split("#", 1)[0];
      if (!target || /^[a-z]+:/i.test(target)) continue;
      assert.equal(existsSync(path.resolve(path.dirname(markdownPath), target)), true, `${markdownPath}: ${target}`);
    }
  }
});
