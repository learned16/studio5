import assert from "node:assert/strict";
import test from "node:test";
import {
  AcademicRepository,
  AcademicRepositoryRecoveryRequiredError,
  LectureCloseoutIncompleteError,
} from "../src/academic-repository.mjs";
import {
  createCaptureResolution,
  createLectureCapture,
} from "../src/lecture-flow.mjs";
import { CoreLocalDatabase, CorePersistenceError } from "../src/local-database.mjs";
import { CoreRelationError, CoreStore } from "../src/store.mjs";
import { MemoryCoreDriver } from "./helpers/memory-driver.mjs";

function repositoryFixture(nowStart = 10_000) {
  let clock = nowStart;
  const driver = new MemoryCoreDriver();
  const database = new CoreLocalDatabase(driver, { now: () => clock++ });
  const repository = new AcademicRepository(database, { now: () => clock++ });
  return { driver, repository };
}

async function createLectureGraph(repository, suffix = "أ") {
  const year = await repository.createAcademicYear({
    label: `سنة ${suffix}`,
    startDate: "2026-09-01",
    endDate: "2027-06-30",
  });
  const semester = await repository.createSemester({
    academicYearId: year.id,
    label: `فصل ${suffix}`,
    order: 1,
    startDate: "2026-09-01",
    endDate: "2027-01-31",
  });
  const profile = await repository.createSubjectProfile({
    key: `lecture-flow-${suffix}`,
    label: `ملف ${suffix}`,
  });
  const subject = await repository.createSubject({
    semesterId: semester.id,
    subjectProfileId: profile.id,
    title: `مادة ${suffix}`,
  });
  const lecture = await repository.createLecture({
    subjectId: subject.id,
    title: `محاضرة ${suffix}`,
    startsAt: "2026-09-07T09:00:00+03:00",
    endsAt: "2026-09-07T10:30:00+03:00",
  });
  return { lecture, profile, semester, subject, year };
}

test("lecture flow models validate capture kinds, instants, and task outcomes", () => {
  const lectureId = "lecture_00000000-0000-4000-8000-000000000001";
  const capture = createLectureCapture({
    lectureId,
    kind: "understanding-gap",
    text: "لم أفهم هذه الخطوة",
    capturedAt: "2026-09-07T09:15:00+03:00",
    now: 1,
  });

  assert.equal(capture.captureKind, "understanding-gap");
  assert.equal(capture.capturedAt, "2026-09-07T06:15:00.000Z");
  assert.throws(
    () => createLectureCapture({ lectureId, kind: "random", text: "x" }),
    /kind/,
  );
  assert.throws(
    () => createLectureCapture({
      lectureId,
      kind: "important",
      text: "وقت غامض",
      capturedAt: "2026-09-07T09:15:00",
    }),
    /explicit timezone/,
  );
  assert.throws(
    () => createCaptureResolution({
      captureId: capture.id,
      closeoutId: "lecture-closeout_00000000-0000-4000-8000-000000000002",
      outcome: "task",
    }),
    /requires taskId/,
  );
});

test("capture filters and closeout start are stable and idempotent", async () => {
  const { repository } = repositoryFixture();
  const { lecture } = await createLectureGraph(repository);
  const important = await repository.createLectureCapture({
    lectureId: lecture.id,
    kind: "important",
    text: "هذه نقطة امتحان",
    capturedAt: "2026-09-07T09:20:00+03:00",
  });
  await repository.createLectureCapture({
    lectureId: lecture.id,
    kind: "professor-question",
    text: "أسأل الأستاذ عن المثال",
    capturedAt: "2026-09-07T09:10:00+03:00",
  });
  const first = await repository.startLectureCloseout(lecture.id);
  const repeated = await repository.startLectureCloseout(lecture.id);

  assert.equal(first.status, "created");
  assert.equal(repeated.status, "existing");
  assert.equal(repeated.closeout.id, first.closeout.id);
  assert.equal((await repository.listLectureCloseouts()).length, 1);
  assert.deepEqual(
    (await repository.listLectureCaptures({ lectureId: lecture.id }))
      .map(({ captureKind }) => captureKind),
    ["professor-question", "important"],
  );
  assert.deepEqual(
    (await repository.listLectureCaptures({ kind: "important" })).map(({ id }) => id),
    [important.id],
  );
});

test("closeout cannot complete until every capture has a resolution", async () => {
  const { repository } = repositoryFixture();
  const { lecture, subject } = await createLectureGraph(repository);
  const firstCapture = await repository.createLectureCapture({
    lectureId: lecture.id,
    kind: "assignment",
    text: "حل تمرين",
  });
  const secondCapture = await repository.createLectureCapture({
    lectureId: lecture.id,
    kind: "understanding-gap",
    text: "راجع القانون",
  });
  const { closeout } = await repository.startLectureCloseout(lecture.id);
  const task = await repository.createTask({
    subjectId: subject.id,
    lectureId: lecture.id,
    title: "حل تمرين المحاضرة",
  });
  await repository.resolveLectureCapture(firstCapture.id, {
    closeoutId: closeout.id,
    outcome: "task",
    taskId: task.id,
  });

  await assert.rejects(
    () => repository.completeLectureCloseout(closeout.id),
    (error) => (
      error instanceof LectureCloseoutIncompleteError
      && error.unresolvedCaptureIds.includes(secondCapture.id)
    ),
  );

  await repository.resolveLectureCapture(secondCapture.id, {
    closeoutId: closeout.id,
    outcome: "review",
    note: "إعادة المثال مساءً",
  });
  const completed = await repository.completeLectureCloseout(closeout.id, {
    summary: "تحول التكليف إلى مهمة والفجوة إلى مراجعة",
  });

  assert.equal(completed.status, "completed");
  assert.ok(completed.completedAt);
  assert.equal(completed.summary, "تحول التكليف إلى مهمة والفجوة إلى مراجعة");
  assert.equal((await repository.listCaptureResolutions({
    closeoutId: closeout.id,
  })).length, 2);
});

test("resolution rejects cross-lecture closeouts and tasks", async () => {
  const { repository } = repositoryFixture();
  const first = await createLectureGraph(repository, "أ");
  const second = await createLectureGraph(repository, "ب");
  const capture = await repository.createLectureCapture({
    lectureId: first.lecture.id,
    kind: "assignment",
    text: "تكليف",
  });
  const { closeout: wrongCloseout } = await repository.startLectureCloseout(
    second.lecture.id,
  );
  const wrongTask = await repository.createTask({
    subjectId: second.subject.id,
    lectureId: second.lecture.id,
    title: "مهمة لمحاضرة أخرى",
  });

  await assert.rejects(
    () => repository.resolveLectureCapture(capture.id, {
      closeoutId: wrongCloseout.id,
      outcome: "review",
    }),
    /same lecture/,
  );

  const { closeout } = await repository.startLectureCloseout(first.lecture.id);
  await assert.rejects(
    () => repository.resolveLectureCapture(capture.id, {
      closeoutId: closeout.id,
      outcome: "task",
      taskId: wrongTask.id,
    }),
    /capture lecture/,
  );
});

test("raw captures and resolutions are immutable and one resolution is allowed", async () => {
  const { repository } = repositoryFixture();
  const { lecture } = await createLectureGraph(repository);
  const capture = await repository.createLectureCapture({
    lectureId: lecture.id,
    kind: "important",
    text: "نقطة ثابتة",
  });
  const { closeout } = await repository.startLectureCloseout(lecture.id);
  const resolution = await repository.resolveLectureCapture(capture.id, {
    closeoutId: closeout.id,
    outcome: "inbox",
  });
  const snapshot = await repository.exportSnapshot();
  const store = new CoreStore(snapshot);

  assert.throws(
    () => store.replace("lectureCaptures", { ...capture, text: "تغيير صامت" }),
    /Immutable/,
  );
  assert.throws(
    () => store.replace("captureResolutions", { ...resolution, note: "تغيير" }),
    /Immutable/,
  );
  await assert.rejects(
    () => repository.resolveLectureCapture(capture.id, {
      closeoutId: closeout.id,
      outcome: "dismissed",
    }),
    /already resolved/,
  );
});

test("lecture flow persists across reopen and concurrent capture writes", async () => {
  const { driver, repository } = repositoryFixture();
  const { lecture } = await createLectureGraph(repository);
  await Promise.all([
    repository.createLectureCapture({
      lectureId: lecture.id,
      kind: "important",
      text: "أ",
    }),
    repository.createLectureCapture({
      lectureId: lecture.id,
      kind: "professor-feedback",
      text: "ب",
    }),
  ]);

  const reopened = new AcademicRepository(
    new CoreLocalDatabase(driver, { now: () => 20_000 }),
    { now: () => 20_001 },
  );
  assert.equal((await reopened.listLectureCaptures({ lectureId: lecture.id })).length, 2);
});

test("failed lecture-flow persistence requires recovery and loses no committed data", async () => {
  const { driver, repository } = repositoryFixture();
  const { lecture } = await createLectureGraph(repository);
  driver.failNextCommit = true;
  await assert.rejects(
    () => repository.createLectureCapture({
      lectureId: lecture.id,
      kind: "important",
      text: "كتابة ستفشل",
    }),
    CorePersistenceError,
  );
  assert.equal(repository.state().needsRecovery, true);
  await assert.rejects(
    () => repository.createLectureCapture({
      lectureId: lecture.id,
      kind: "important",
      text: "ممنوعة قبل Recovery",
    }),
    AcademicRepositoryRecoveryRequiredError,
  );
  await repository.recover();
  const recovered = await repository.listLectureCaptures();
  assert.equal(recovered.length, 1);
  assert.equal(recovered[0].text, "كتابة ستفشل");
  const saved = await repository.createLectureCapture({
    lectureId: lecture.id,
    kind: "important",
    text: "بعد Recovery",
  });
  assert.ok(saved.id);
  assert.equal((await repository.listLectureCaptures()).length, 2);
});

test("store rejects a capture that points to a missing lecture", () => {
  const store = new CoreStore();
  const capture = createLectureCapture({
    lectureId: "lecture_00000000-0000-4000-8000-000000000099",
    kind: "important",
    text: "لا سياق",
  });
  assert.throws(
    () => store.add("lectureCaptures", capture),
    (error) => error instanceof CoreRelationError && /missing lectures/.test(error.message),
  );
});
