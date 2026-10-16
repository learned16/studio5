import assert from "node:assert/strict";
import test from "node:test";
import { AcademicRepository } from "../src/academic-repository.mjs";
import { buildTodayQuery } from "../src/today-query.mjs";
import { CoreLocalDatabase } from "../src/local-database.mjs";
import { MemoryCoreDriver } from "./helpers/memory-driver.mjs";

function repositoryFixture(nowStart = 1_000) {
  let clock = nowStart;
  const driver = new MemoryCoreDriver();
  const database = new CoreLocalDatabase(driver, { now: () => clock++ });
  const repository = new AcademicRepository(database, { now: () => clock++ });
  return { driver, repository };
}

async function createAcademicGraph(repository) {
  const year = await repository.createAcademicYear({
    label: "السنة الأولى",
    startDate: "2026-09-01",
    endDate: "2027-06-30",
  });
  const semester = await repository.createSemester({
    academicYearId: year.id,
    label: "الفصل الأول",
    order: 1,
    startDate: "2026-09-01",
    endDate: "2027-01-31",
  });
  const profile = await repository.createSubjectProfile({
    key: "studio",
    label: "مادة تطبيقية",
  });
  const subject = await repository.createSubject({
    semesterId: semester.id,
    subjectProfileId: profile.id,
    title: "مادة الاختبار",
    color: "#17251f",
  });
  return { year, semester, profile, subject };
}

test("today agenda prefers actual lectures and keeps uncovered schedule slots", async () => {
  const { repository } = repositoryFixture();
  const { subject } = await createAcademicGraph(repository);
  const covered = await repository.createScheduleEntry({
    subjectId: subject.id,
    dayOfWeek: 1,
    startTime: "09:00",
    endTime: "10:30",
    effectiveFrom: "2026-09-01",
    effectiveUntil: "2026-12-31",
    location: "قاعة أ",
  });
  const uncovered = await repository.createScheduleEntry({
    subjectId: subject.id,
    dayOfWeek: 1,
    startTime: "13:00",
    endTime: "14:00",
    location: "قاعة ب",
  });
  await repository.createScheduleEntry({
    subjectId: subject.id,
    dayOfWeek: 2,
    startTime: "08:00",
    endTime: "09:00",
  });
  const lecture = await repository.createLecture({
    subjectId: subject.id,
    scheduleEntryId: covered.id,
    title: "محاضرة فعلية",
    startsAt: "2026-09-07T09:15:00+03:00",
    endsAt: "2026-09-07T10:45:00+03:00",
  });

  const result = await repository.queryToday({
    date: "2026-09-07",
    now: "2026-09-07T08:00:00+03:00",
    utcOffsetMinutes: 180,
  });

  assert.deepEqual(
    result.agenda.map(({ id, sourceKind }) => [id, sourceKind]),
    [
      [lecture.id, "lecture"],
      [uncovered.id, "schedule-entry"],
    ],
  );
  assert.equal(result.agenda[0].location, "قاعة أ");
  assert.equal(result.agenda[0].subject.title, "مادة الاختبار");
  assert.equal(result.agenda[1].startsAt, "2026-09-07T10:00:00.000Z");
  assert.equal(result.summary.agendaCount, 2);
});

test("today classifies open and completed tasks without leaking future or cancelled work", async () => {
  const { repository } = repositoryFixture();
  const { subject } = await createAcademicGraph(repository);
  const overdue = await repository.createTask({
    subjectId: subject.id,
    title: "مهمة متأخرة",
    dueAt: "2026-09-06T20:00:00Z",
    priority: "high",
  });
  const dueNormal = await repository.createTask({
    subjectId: subject.id,
    title: "مهمة اليوم العادية",
    dueAt: "2026-09-07T09:00:00Z",
    priority: "normal",
  });
  const dueUrgent = await repository.createTask({
    subjectId: subject.id,
    title: "مهمة اليوم العاجلة",
    dueAt: "2026-09-07T18:00:00Z",
    priority: "urgent",
  });
  const unscheduled = await repository.createTask({
    title: "مهمة بلا موعد",
    priority: "low",
  });
  await repository.createTask({
    title: "مهمة مستقبلية",
    dueAt: "2026-09-08T08:00:00Z",
  });
  const completed = await repository.createTask({
    title: "أنجزت اليوم",
    status: "done",
    now: Date.parse("2026-09-07T07:30:00Z"),
  });
  await repository.createTask({
    title: "ملغاة",
    status: "cancelled",
    dueAt: "2026-09-07T11:00:00Z",
  });

  const result = await repository.queryToday({
    date: "2026-09-07",
    now: "2026-09-07T10:00:00Z",
    utcOffsetMinutes: 180,
  });

  assert.deepEqual(result.tasks.overdue.map(({ id }) => id), [overdue.id]);
  assert.deepEqual(
    result.tasks.dueToday.map(({ id }) => id),
    [dueUrgent.id, dueNormal.id],
  );
  assert.deepEqual(result.tasks.unscheduled.map(({ id }) => id), [unscheduled.id]);
  assert.deepEqual(result.tasks.completedToday.map(({ id }) => id), [completed.id]);
  assert.deepEqual(result.summary, {
    agendaCount: 0,
    overdueTaskCount: 1,
    dueTodayTaskCount: 2,
    unscheduledTaskCount: 1,
    completedTodayTaskCount: 1,
  });
});

test("today uses the explicit local offset across a UTC date boundary", async () => {
  const { repository } = repositoryFixture();
  const { subject } = await createAcademicGraph(repository);
  const lecture = await repository.createLecture({
    subjectId: subject.id,
    title: "بعد منتصف الليل محلياً",
    startsAt: "2026-09-06T22:00:00Z",
    endsAt: "2026-09-06T23:00:00Z",
  });

  const result = await repository.queryToday({
    now: "2026-09-06T22:30:00Z",
    utcOffsetMinutes: 180,
  });

  assert.equal(result.date, "2026-09-07");
  assert.equal(result.dayOfWeek, 1);
  assert.deepEqual(result.window, {
    startsAt: "2026-09-06T21:00:00.000Z",
    endsAt: "2026-09-07T21:00:00.000Z",
  });
  assert.deepEqual(result.agenda.map(({ id }) => id), [lecture.id]);
});

test("pure today query never mutates its source snapshot", async () => {
  const { repository } = repositoryFixture();
  const { subject } = await createAcademicGraph(repository);
  await repository.createTask({
    subjectId: subject.id,
    title: "اختبار الثبات",
    dueAt: "2026-09-07T12:00:00Z",
  });
  const snapshot = await repository.exportSnapshot();
  const before = JSON.stringify(snapshot);

  const result = buildTodayQuery(snapshot, {
    date: "2026-09-07",
    now: "2026-09-07T09:00:00Z",
    utcOffsetMinutes: 180,
  });

  assert.equal(result.tasks.dueToday.length, 1);
  assert.equal(JSON.stringify(snapshot), before);
});

test("today query works after reopening the local repository", async () => {
  const { driver, repository } = repositoryFixture();
  const { subject } = await createAcademicGraph(repository);
  const task = await repository.createTask({
    subjectId: subject.id,
    title: "مهمة محفوظة",
    dueAt: "2026-09-07T12:00:00Z",
  });
  const reopened = new AcademicRepository(
    new CoreLocalDatabase(driver, { now: () => 5_000 }),
    { now: () => 5_001 },
  );

  const result = await reopened.queryToday({
    date: "2026-09-07",
    now: "2026-09-07T09:00:00Z",
    utcOffsetMinutes: 180,
  });

  assert.deepEqual(result.tasks.dueToday.map(({ id }) => id), [task.id]);
});

test("today rejects invalid offsets and options", async () => {
  const { repository } = repositoryFixture();
  await assert.rejects(
    () => repository.queryToday({ utcOffsetMinutes: 841 }),
    /utcOffsetMinutes/,
  );
  assert.throws(
    () => buildTodayQuery(undefined, []),
    /options must be an object/,
  );
  assert.throws(
    () => repository.queryToday(null),
    /options must be an object/,
  );
  await assert.rejects(
    () => repository.queryToday({
      now: "2026-09-07T10:00:00",
      utcOffsetMinutes: 180,
    }),
    /explicit timezone/,
  );
});
