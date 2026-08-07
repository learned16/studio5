import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
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
  assert.equal(
    readRepositoryFile(".codex/config.toml").replaceAll("\r\n", "\n").trim(),
    "[agents]\nmax_concurrent_threads_per_session = 3",
  );
});

test("exactly the three approved guards are installed beside studio5-delivery", () => {
  const installedSkills = readdirSync(path.join(repositoryRoot, ".agents/skills"), {
    withFileTypes: true,
  })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  assert.deepEqual(installedSkills, [
    "clean-code-guard",
    "docs-guard",
    "studio5-delivery",
    "test-guard",
  ]);

  const lock = JSON.parse(readRepositoryFile("skills-lock.json"));
  assert.deepEqual(Object.keys(lock.skills).sort(), [
    "clean-code-guard",
    "docs-guard",
    "test-guard",
  ]);
  for (const guard of Object.values(lock.skills)) {
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

test("production package manifests and package locks match the task base", () => {
  for (const relativePath of [
    "package.json",
    "pnpm-lock.yaml",
    "packages/studio5-core/package.json",
    "prototype/p0-ink-web/package.json",
    "prototype/p3-lecture-capture-web/package.json",
    "prototype/p3-lecture-capture-web/pnpm-lock.yaml",
  ]) {
    const packageDiff = spawnSync("git", ["diff", "--quiet", "origin/develop", "--", relativePath], {
      cwd: repositoryRoot,
      encoding: "utf8",
      windowsHide: true,
    });
    assert.equal(packageDiff.status, 0, relativePath);
  }
});
