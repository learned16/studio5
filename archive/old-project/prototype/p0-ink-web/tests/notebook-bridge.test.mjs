import assert from "node:assert/strict";
import test from "node:test";
import { AcademicRepository } from "../../../packages/studio5-core/src/academic-repository.mjs";
import { CoreLocalDatabase } from "../../../packages/studio5-core/src/local-database.mjs";
import { MemoryCoreDriver } from "../../../packages/studio5-core/tests/helpers/memory-driver.mjs";
import {
  MemoryFileContentStore,
} from "../../../packages/studio5-core/tests/helpers/memory-file-content-store.mjs";
import { createNotebookDemo } from "../notebook-bridge.mjs";

function repositoryFixture() {
  let clock = Date.parse("2026-07-25T12:00:00Z");
  const repository = new AcademicRepository(
    new CoreLocalDatabase(new MemoryCoreDriver(), { now: () => clock++ }),
    {
      now: () => clock++,
      fileContentStore: new MemoryFileContentStore(),
    },
  );
  return { now: clock, repository };
}

function stroke(x = 1) {
  return {
    id: `stroke-${x}`,
    color: "#14221c",
    baseWidth: 5,
    pointerType: "pen",
    points: [
      { x, y: 2, pressure: 0.5, time: 1 },
      { x: x + 1, y: 3, pressure: 0.6, time: 2 },
    ],
  };
}

test("demo bootstrap is idempotent and reuses one academic notebook context", async () => {
  const { now, repository } = repositoryFixture();
  const first = await createNotebookDemo(repository, {
    now,
    documentWidth: 1600,
    documentHeight: 1000,
  });
  const second = await createNotebookDemo(repository, {
    now,
    documentWidth: 1600,
    documentHeight: 1000,
  });

  assert.equal(second.subject.id, first.subject.id);
  assert.equal(second.notebook.id, first.notebook.id);
  assert.equal(second.inkDocument.id, first.inkDocument.id);
  assert.equal((await repository.listNotebooks()).length, 1);
  assert.equal((await repository.listInkDocuments()).length, 1);
});

test("demo bootstrap resumes safely after a partial profile-only write", async () => {
  const { now, repository } = repositoryFixture();
  await repository.createSubjectProfile({
    key: "studio5-notebook-gate",
    label: "Partial",
  });

  const demo = await createNotebookDemo(repository, {
    now,
    documentWidth: 1600,
    documentHeight: 1000,
  });

  assert.ok(demo.notebook.id);
  assert.equal((await repository.listSubjectProfiles()).length, 1);
  assert.equal((await repository.listSubjects()).length, 1);
});

test("demo saves changed revisions, rejects duplicate history, and restores latest strokes", async () => {
  const { now, repository } = repositoryFixture();
  const demo = await createNotebookDemo(repository, {
    now,
    documentWidth: 1600,
    documentHeight: 1000,
  });
  const first = await demo.save([stroke(1)]);
  const duplicate = await demo.save([stroke(1)]);
  const second = await demo.save([stroke(20)]);
  const revisions = await demo.listRevisions();
  const firstLoaded = await demo.loadRevision(first.revision.id);
  const restored = await demo.restoreLatest();

  assert.equal(first.status, "created");
  assert.equal(duplicate.status, "duplicate");
  assert.equal(second.revisionCount, 2);
  assert.equal(await demo.revisionCount(), 2);
  assert.deepEqual(
    revisions.map(({ revisionNumber }) => revisionNumber),
    [1, 2],
  );
  assert.equal(firstLoaded.revision.id, first.revision.id);
  assert.equal(firstLoaded.strokes[0].id, "stroke-1");
  assert.equal(restored.strokes[0].id, "stroke-20");
  assert.equal(restored.strokes[0].layerId, "layer-1");
  assert.deepEqual(restored.strokes[0].points, stroke(20).points);
  assert.equal(await demo.loadRevision("ink-revision_00000000-0000-4000-8000-000000000000"), null);
});
