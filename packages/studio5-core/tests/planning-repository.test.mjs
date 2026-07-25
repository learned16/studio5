import assert from "node:assert/strict";
import test from "node:test";
import {
  AcademicRepository,
  AcademicRepositoryRecoveryRequiredError,
} from "../src/academic-repository.mjs";
import { CoreLocalDatabase, CorePersistenceError } from "../src/local-database.mjs";
import { CoreRelationError } from "../src/store.mjs";
import { MemoryCoreDriver } from "./helpers/memory-driver.mjs";

function repositoryFixture(nowStart = 1_000) {
  let clock = nowStart;
  const driver = new MemoryCoreDriver();
  const database = new CoreLocalDatabase(driver, { now: () => clock++ });
  const repository = new AcademicRepository(database, { now: () => clock++ });
  return { driver, repository };
}

async function createSubjectGraph(repository, suffix = "أ") {
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
    key: `profile-${suffix}`,
    label: `ملف ${suffix}`,
  });
  const subject = await repository.createSubject({
    semesterId: semester.id,
    subjectProfileId: profile.id,
    title: `مادة ${suffix}`,
  });
  return { year, semester, profile, subject };
}

async function createPlanningGraph(repository) {
  const academic = await createSubjectGraph(repository);
  const schedule = await repository.createScheduleEntry({
    subjectId: academic.subject.id,
    dayOfWeek: 1,
    startTime: "09:00",
    endTime: "10:30",
    effectiveFrom: "2026-09-01",
    effectiveUntil: "2027-01-31",
    location: "قاعة تجريبية",
  });
  const lecture = await repository.createLecture({
    subjectId: academic.subject.id,
    scheduleEntryId: schedule.id,
    title: "المحاضرة الأولى",
    startsAt: "2026-09-07T09:00:00+03:00",
    endsAt: "2026-09-07T10:30:00+03:00",
  });
  const task = await repository.createTask({
    subjectId: academic.subject.id,
    lectureId: lecture.id,
    title: "حل تمرين المحاضرة",
    dueAt: "2026-09-08T12:00:00+03:00",
    priority: "high",
  });
  return { ...academic, schedule, lecture, task };
}

test("schedule, lecture, and task persist across reopen", async () => {
  const { driver, repository } = repositoryFixture();
  const graph = await createPlanningGraph(repository);

  const reopened = new AcademicRepository(
    new CoreLocalDatabase(driver, { now: () => 2_000 }),
    { now: () => 2_001 },
  );
  await reopened.initialize();

  assert.equal((await reopened.getScheduleEntry(graph.schedule.id)).subjectId, graph.subject.id);
  assert.equal((await reopened.getLecture(graph.lecture.id)).scheduleEntryId, graph.schedule.id);
  assert.equal((await reopened.getTask(graph.task.id)).lectureId, graph.lecture.id);
});

test("planning filters use stable context IDs and time ranges", async () => {
  const { repository } = repositoryFixture();
  const graph = await createPlanningGraph(repository);
  await repository.createTask({ title: "مهمة عامة بلا موعد", priority: "low" });

  assert.deepEqual(
    (await repository.listScheduleEntries({
      subjectId: graph.subject.id,
      dayOfWeek: 1,
      activeOn: "2026-10-01",
    })).map(({ id }) => id),
    [graph.schedule.id],
  );
  assert.deepEqual(
    await repository.listScheduleEntries({
      subjectId: graph.subject.id,
      activeOn: "2027-02-01",
    }),
    [],
  );
  assert.deepEqual(
    (await repository.listLectures({
      subjectId: graph.subject.id,
      status: "planned",
      from: "2026-09-07T08:30:00+03:00",
      until: "2026-09-07T11:00:00+03:00",
    })).map(({ id }) => id),
    [graph.lecture.id],
  );
  assert.deepEqual(
    (await repository.listTasks({
      subjectId: graph.subject.id,
      priority: "high",
      dueBefore: "2026-09-09T00:00:00+03:00",
    })).map(({ id }) => id),
    [graph.task.id],
  );
});

test("task status update preserves identity and persists", async () => {
  const { driver, repository } = repositoryFixture();
  const graph = await createPlanningGraph(repository);
  const updated = await repository.updateTask(graph.task.id, {
    status: "done",
    notes: "اكتملت",
  });

  assert.equal(updated.id, graph.task.id);
  assert.equal(updated.createdAt, graph.task.createdAt);
  assert.notEqual(updated.updatedAt, graph.task.updatedAt);
  assert.equal(updated.completedAt, updated.updatedAt);
  assert.deepEqual(
    (await repository.listTasks({ status: "done" })).map(({ id }) => id),
    [graph.task.id],
  );

  const reopened = new AcademicRepository(new CoreLocalDatabase(driver), { now: () => 3_000 });
  assert.equal((await reopened.getTask(graph.task.id)).status, "done");
});

test("planning relations reject missing or mismatched subjects", async () => {
  const { repository } = repositoryFixture();
  const first = await createPlanningGraph(repository);
  const second = await createSubjectGraph(repository, "ب");

  await assert.rejects(
    () => repository.createScheduleEntry({
      subjectId: "subject_00000000-0000-4000-8000-000000000000",
      dayOfWeek: 2,
      startTime: "09:00",
      endTime: "10:00",
    }),
    CoreRelationError,
  );
  await assert.rejects(
    () => repository.createLecture({
      subjectId: second.subject.id,
      scheduleEntryId: first.schedule.id,
      title: "ربط خاطئ",
      startsAt: "2026-09-08T09:00:00+03:00",
      endsAt: "2026-09-08T10:00:00+03:00",
    }),
    CoreRelationError,
  );
  await assert.rejects(
    () => repository.createTask({
      subjectId: second.subject.id,
      lectureId: first.lecture.id,
      title: "مهمة مرتبطة بمحاضرة مادة أخرى",
    }),
    CoreRelationError,
  );
  await assert.rejects(
    () => repository.createTask({
      lectureId: first.lecture.id,
      title: "مهمة بلا مادة",
    }),
    /requires subjectId/,
  );
});

test("concurrent planning writes are serialized without data loss", async () => {
  const { repository } = repositoryFixture();
  const { subject } = await createSubjectGraph(repository);
  await Promise.all([
    repository.createTask({ subjectId: subject.id, title: "المهمة أ" }),
    repository.createTask({ subjectId: subject.id, title: "المهمة ب" }),
  ]);
  assert.deepEqual(
    (await repository.listTasks({ subjectId: subject.id })).map(({ title }) => title),
    ["المهمة أ", "المهمة ب"],
  );
});

test("failed planning persistence requires recovery and keeps memory stable", async () => {
  const { driver, repository } = repositoryFixture();
  const { subject } = await createSubjectGraph(repository);
  driver.failNextCommit = true;

  await assert.rejects(
    () => repository.createTask({ subjectId: subject.id, title: "مهمة معلقة" }),
    CorePersistenceError,
  );
  assert.deepEqual(await repository.listTasks(), []);
  await assert.rejects(
    () => repository.createTask({ subjectId: subject.id, title: "لا تكتب فوق Journal" }),
    AcademicRepositoryRecoveryRequiredError,
  );

  const recovered = await repository.recover();
  assert.equal(recovered.recovered, true);
  assert.equal((await repository.listTasks())[0].title, "مهمة معلقة");
});
