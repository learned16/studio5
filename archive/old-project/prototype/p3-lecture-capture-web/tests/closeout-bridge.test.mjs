import assert from "node:assert/strict";
import test from "node:test";
import { AcademicRepository } from "../../../packages/studio5-core/src/academic-repository.mjs";
import { CoreLocalDatabase } from "../../../packages/studio5-core/src/local-database.mjs";
import { LectureCloseoutIncompleteError } from "../../../packages/studio5-core/src/academic-repository.mjs";
import { MemoryCoreDriver } from "../../../packages/studio5-core/tests/helpers/memory-driver.mjs";
import { createLectureCaptureDemo } from "../lecture-demo.mjs";
import { createLectureCloseoutDemo } from "../closeout/closeout-bridge.mjs";

function repositoryFixture() {
  let clock = Date.parse("2026-07-26T12:00:00Z");
  const repository = new AcademicRepository(
    new CoreLocalDatabase(new MemoryCoreDriver(), { now: () => clock++ }),
    { now: () => clock++ },
  );
  return { now: clock, repository };
}

test("closeout bootstrap reuses capture context and start is idempotent", async () => {
  const { now, repository } = repositoryFixture();
  const capture = await createLectureCaptureDemo(repository, { now });
  await capture.capture({ kind: "important", text: "نقطة مهمة" });
  const closeout = await createLectureCloseoutDemo(repository, { now });

  const first = await closeout.start();
  const second = await closeout.start();
  const state = await closeout.snapshot();

  assert.equal(first.status, "created");
  assert.equal(second.status, "existing");
  assert.equal(state.captures.length, 1);
  assert.equal(state.closeout.id, first.closeout.id);
});

test("closeout resolves task and review while preserving raw captures", async () => {
  const { now, repository } = repositoryFixture();
  const capture = await createLectureCaptureDemo(repository, { now });
  const taskCapture = await capture.capture({
    kind: "assignment",
    text: "حل التمرين",
  });
  const reviewCapture = await capture.capture({
    kind: "important",
    text: "مراجعة القانون",
  });
  const closeout = await createLectureCloseoutDemo(repository, { now });
  await closeout.start();

  await closeout.resolve(taskCapture.id, {
    outcome: "task",
    title: "حل تمرين المحاضرة",
    priority: "high",
  });
  await closeout.resolve(reviewCapture.id, { outcome: "review" });
  const completed = await closeout.complete("تم تنظيم النقاط");
  const state = await closeout.snapshot();

  assert.equal(completed.status, "completed");
  assert.equal(state.captures.length, 2);
  assert.ok(state.captures.every(({ resolution }) => resolution));
  assert.equal(
    state.captures.find(({ capture: item }) => item.id === taskCapture.id).task.title,
    "حل تمرين المحاضرة",
  );
  assert.deepEqual(
    (await repository.listLectureCaptures()).map(({ id }) => id).sort(),
    [taskCapture.id, reviewCapture.id].sort(),
  );
});

test("closeout refuses completion while a capture is unresolved", async () => {
  const { now, repository } = repositoryFixture();
  const capture = await createLectureCaptureDemo(repository, { now });
  await capture.capture({ kind: "professor-question", text: "سؤال مفتوح" });
  const closeout = await createLectureCloseoutDemo(repository, { now });
  await closeout.start();

  await assert.rejects(
    closeout.complete(),
    LectureCloseoutIncompleteError,
  );
  assert.equal((await closeout.snapshot()).closeout.status, "in-progress");
});
