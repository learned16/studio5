import assert from "node:assert/strict";
import test from "node:test";
import { AcademicRepository } from "../../../packages/studio5-core/src/academic-repository.mjs";
import { CoreLocalDatabase } from "../../../packages/studio5-core/src/local-database.mjs";
import { MemoryCoreDriver } from "../../../packages/studio5-core/tests/helpers/memory-driver.mjs";
import { createLectureCaptureDemo } from "../lecture-demo.mjs";

function repositoryFixture() {
  let clock = Date.parse("2026-07-25T12:00:00Z");
  const repository = new AcademicRepository(
    new CoreLocalDatabase(new MemoryCoreDriver(), { now: () => clock++ }),
    { now: () => clock++ },
  );
  return { now: clock, repository };
}

test("capture demo bootstrap is idempotent", async () => {
  const { now, repository } = repositoryFixture();
  const first = await createLectureCaptureDemo(repository, { now });
  const second = await createLectureCaptureDemo(repository, { now });

  assert.equal(second.subject.id, first.subject.id);
  assert.equal(second.lecture.id, first.lecture.id);
  assert.equal((await repository.listSubjectProfiles()).length, 1);
  assert.equal((await repository.listLectures()).length, 1);
});

test("all five capture kinds persist in the lecture inbox", async () => {
  const { now, repository } = repositoryFixture();
  const demo = await createLectureCaptureDemo(repository, { now });
  const kinds = [
    "understanding-gap",
    "important",
    "assignment",
    "professor-question",
    "professor-feedback",
  ];

  for (const kind of kinds) {
    await demo.capture({ kind, text: `capture ${kind}` });
  }

  const captures = await demo.listCaptures();
  const inbox = await demo.inbox();
  assert.deepEqual(
    [...captures.map(({ captureKind }) => captureKind)].sort(),
    [...kinds].sort(),
  );
  assert.equal(inbox.length, kinds.length);
  assert.ok(inbox.every(({ state }) => state === "unprocessed"));
});

test("capture rejects empty text without mutating the repository", async () => {
  const { now, repository } = repositoryFixture();
  const demo = await createLectureCaptureDemo(repository, { now });

  await assert.rejects(
    demo.capture({ kind: "important", text: "   " }),
    /text is required/,
  );
  assert.equal((await demo.listCaptures()).length, 0);
});
