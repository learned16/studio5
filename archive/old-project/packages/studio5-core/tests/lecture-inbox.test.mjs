import assert from "node:assert/strict";
import test from "node:test";
import {
  AcademicRepository,
  AcademicRepositoryRecoveryRequiredError,
} from "../src/academic-repository.mjs";
import { buildLectureInbox } from "../src/lecture-inbox.mjs";
import { CoreLocalDatabase, CorePersistenceError } from "../src/local-database.mjs";
import { MemoryCoreDriver } from "./helpers/memory-driver.mjs";

function repositoryFixture(nowStart = 30_000) {
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
    key: `inbox-${suffix}`,
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
  return { lecture, subject };
}

test("pure lecture inbox shows unprocessed and intentionally kept captures only", async () => {
  const { repository } = repositoryFixture();
  const { lecture } = await createLectureGraph(repository);
  const unprocessed = await repository.createLectureCapture({
    lectureId: lecture.id,
    kind: "important",
    text: "نقطة غير منظمة",
    capturedAt: "2026-09-07T09:30:00+03:00",
  });
  const kept = await repository.createLectureCapture({
    lectureId: lecture.id,
    kind: "professor-question",
    text: "يبقى في Inbox",
    capturedAt: "2026-09-07T09:20:00+03:00",
  });
  const dismissed = await repository.createLectureCapture({
    lectureId: lecture.id,
    kind: "important",
    text: "محسوم",
    capturedAt: "2026-09-07T09:10:00+03:00",
  });
  const { closeout } = await repository.startLectureCloseout(lecture.id);
  await repository.resolveLectureCapture(kept.id, {
    closeoutId: closeout.id,
    outcome: "inbox",
  });
  await repository.resolveLectureCapture(dismissed.id, {
    closeoutId: closeout.id,
    outcome: "dismissed",
  });
  const snapshotBefore = await repository.exportSnapshot();
  const items = await repository.buildLectureInbox();
  const snapshotAfter = await repository.exportSnapshot();

  assert.deepEqual(
    items.map(({ captureId, state }) => [captureId, state]),
    [
      [unprocessed.id, "unprocessed"],
      [kept.id, "kept"],
    ],
  );
  assert.deepEqual(snapshotAfter.entities, snapshotBefore.entities);
});

test("lecture inbox filters by stable lecture and subject context", async () => {
  const { repository } = repositoryFixture();
  const first = await createLectureGraph(repository, "أ");
  const second = await createLectureGraph(repository, "ب");
  const firstCapture = await repository.createLectureCapture({
    lectureId: first.lecture.id,
    kind: "important",
    text: "أ",
  });
  const secondCapture = await repository.createLectureCapture({
    lectureId: second.lecture.id,
    kind: "important",
    text: "ب",
  });

  assert.deepEqual(
    (await repository.buildLectureInbox({ lectureId: first.lecture.id }))
      .map(({ captureId }) => captureId),
    [firstCapture.id],
  );
  assert.deepEqual(
    (await repository.buildLectureInbox({ subjectId: second.subject.id }))
      .map(({ captureId }) => captureId),
    [secondCapture.id],
  );
});

test("capture-to-task derives trusted context and writes task with resolution", async () => {
  const { repository } = repositoryFixture();
  const { lecture, subject } = await createLectureGraph(repository);
  const capture = await repository.createLectureCapture({
    lectureId: lecture.id,
    kind: "assignment",
    text: "حل تمرين الواجهات",
  });
  await repository.startLectureCloseout(lecture.id);
  assert.throws(
    () => repository.resolveLectureCaptureAsTask(capture.id, {
      subjectId: "subject_00000000-0000-4000-8000-000000000099",
    }),
    /not allowed/,
  );
  const result = await repository.resolveLectureCaptureAsTask(capture.id, {
    dueAt: "2026-09-08T18:00:00+03:00",
    priority: "high",
    resolutionNote: "مطلوب قبل المحاضرة القادمة",
  });

  assert.equal(result.status, "created");
  assert.equal(result.task.title, capture.text);
  assert.equal(result.task.subjectId, subject.id);
  assert.equal(result.task.lectureId, lecture.id);
  assert.equal(result.resolution.taskId, result.task.id);
  assert.equal(result.resolution.outcome, "task");
  assert.deepEqual(await repository.buildLectureInbox(), []);
});

test("failed atomic conversion recovers task and resolution together without duplicates", async () => {
  const { driver, repository } = repositoryFixture();
  const { lecture } = await createLectureGraph(repository);
  const capture = await repository.createLectureCapture({
    lectureId: lecture.id,
    kind: "assignment",
    text: "مهمة ذرية",
  });
  await repository.startLectureCloseout(lecture.id);
  driver.failNextCommit = true;

  await assert.rejects(
    () => repository.resolveLectureCaptureAsTask(capture.id),
    CorePersistenceError,
  );
  await assert.rejects(
    () => repository.resolveLectureCaptureAsTask(capture.id),
    AcademicRepositoryRecoveryRequiredError,
  );
  await repository.recover();
  const tasksAfterRecovery = await repository.listTasks({ lectureId: lecture.id });
  const resolutionsAfterRecovery = await repository.listCaptureResolutions({
    captureId: capture.id,
  });
  assert.equal(tasksAfterRecovery.length, 1);
  assert.equal(resolutionsAfterRecovery.length, 1);
  assert.equal(resolutionsAfterRecovery[0].taskId, tasksAfterRecovery[0].id);

  const retried = await repository.resolveLectureCaptureAsTask(capture.id);
  assert.equal(retried.status, "existing");
  assert.equal((await repository.listTasks({ lectureId: lecture.id })).length, 1);
  assert.equal((await repository.listCaptureResolutions({
    captureId: capture.id,
  })).length, 1);
});

test("capture-to-task requires an active closeout", async () => {
  const { repository } = repositoryFixture();
  const { lecture } = await createLectureGraph(repository);
  const capture = await repository.createLectureCapture({
    lectureId: lecture.id,
    kind: "assignment",
    text: "لا تحول بلا Closeout",
  });

  await assert.rejects(
    () => repository.resolveLectureCaptureAsTask(capture.id),
    /requires an active closeout/,
  );
});

test("pure builder rejects broken context instead of hiding data corruption", () => {
  assert.throws(
    () => buildLectureInbox({
      captures: [{
        id: "lecture-capture_00000000-0000-4000-8000-000000000001",
        lectureId: "lecture_00000000-0000-4000-8000-000000000002",
        captureKind: "important",
        text: "broken",
        capturedAt: "2026-09-07T09:00:00.000Z",
      }],
      resolutions: [],
      lectures: [],
      subjects: [],
    }),
    /missing lecture/,
  );
});
