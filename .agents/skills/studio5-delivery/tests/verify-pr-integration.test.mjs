import assert from "node:assert/strict";
import test from "node:test";
import { assessIntegration } from "../scripts/verify-pr-integration.mjs";

function mergedPr(overrides = {}) {
  return {
    state: "MERGED",
    baseRefName: "develop",
    mergedAt: "present",
    mergeCommit: { oid: "merge-commit" },
    headRefOid: "original-head",
    statusCheckRollup: [{ conclusion: "SUCCESS" }],
    ...overrides,
  };
}

test("normal merge passes when merge commit, checks, and tree evidence pass", () => {
  const result = assessIntegration({
    pr: mergedPr(),
    expectedBase: "develop",
    mergeCommitReachable: true,
    repositoryEvidencePresent: true,
    headReachable: true,
  });
  assert.equal(result.integrated, true);
});

test("squash merge passes even when the original head is unreachable", () => {
  const result = assessIntegration({
    pr: mergedPr(),
    expectedBase: "develop",
    mergeCommitReachable: true,
    repositoryEvidencePresent: true,
    headReachable: false,
  });
  assert.equal(result.integrated, true);
});

test("rebase-style rewritten history passes without original-head ancestry", () => {
  const result = assessIntegration({
    pr: mergedPr({ headRefOid: "rewritten-away" }),
    expectedBase: "develop",
    mergeCommitReachable: true,
    repositoryEvidencePresent: true,
    headReachable: false,
  });
  assert.equal(result.integrated, true);
});

test("unreachable GitHub merge commit remains a real blocker", () => {
  const result = assessIntegration({
    pr: mergedPr(),
    expectedBase: "develop",
    mergeCommitReachable: false,
    repositoryEvidencePresent: true,
    headReachable: true,
  });
  assert.equal(result.integrated, false);
  assert.match(result.failures.join(" "), /merge commit is not reachable/i);
});

for (const scenario of [
  {
    name: "wrong base fails",
    pr: mergedPr({ baseRefName: "main" }),
    repositoryEvidencePresent: true,
  },
  {
    name: "failed required check fails",
    pr: mergedPr({ statusCheckRollup: [{ conclusion: "FAILURE" }] }),
    repositoryEvidencePresent: true,
  },
  {
    name: "missing current-tree evidence fails",
    pr: mergedPr(),
    repositoryEvidencePresent: false,
  },
]) {
  test(scenario.name, () => {
    const integrationAssessment = assessIntegration({
      pr: scenario.pr,
      expectedBase: "develop",
      mergeCommitReachable: true,
      repositoryEvidencePresent: scenario.repositoryEvidencePresent,
    });
    assert.equal(integrationAssessment.integrated, false);
    assert.equal(integrationAssessment.failures.length, 1);
  });
}
