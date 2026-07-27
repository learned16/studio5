import assert from "node:assert/strict";
import test from "node:test";
import { createStableId, isStableId } from "../src/ids.mjs";
import {
  createAcademicYear,
  createCapabilityPack,
  createLecture,
  createScheduleEntry,
  createSemester,
  createSubject,
  createSubjectProfile,
  createTask,
  reviseTask,
} from "../src/model.mjs";
import {
  CORE_SCHEMA_VERSION,
  CoreMigrationError,
  migrateSnapshot,
} from "../src/schema.mjs";
import { CoreRelationError, CoreStore } from "../src/store.mjs";

function academicFixture() {
  const year = createAcademicYear({
    label: "السنة الأولى",
    startDate: "2026-09-01",
    endDate: "2027-06-30",
    now: 1,
  });
  const semester = createSemester({
    academicYearId: year.id,
    label: "الفصل الأول",
    order: 1,
    startDate: "2026-09-01",
    endDate: "2027-01-31",
    now: 2,
  });
  const capability = createCapabilityPack({
    key: "custom-practice",
    label: "أدوات تدريب مخصصة",
    config: { attempts: true },
    now: 3,
  });
  const profile = createSubjectProfile({
    key: "applied-subject",
    label: "مادة تطبيقية",
    capabilityPackIds: [capability.id],
    now: 4,
  });
  const subject = createSubject({
    semesterId: semester.id,
    subjectProfileId: profile.id,
    title: "أي مادة يضيفها المستخدم",
    capabilityPackIds: [capability.id],
    now: 5,
  });
  return { year, semester, capability, profile, subject };
}

test("stable IDs use entity kinds and never use a subject name", () => {
  const id = createStableId("subject");
  assert.equal(isStableId(id, "subject"), true);
  assert.equal(id.includes("أي مادة"), false);
});

test("core builds a complete academic relation graph from IDs", () => {
  const fixture = academicFixture();
  const store = new CoreStore();
  store.add("academicYears", fixture.year);
  store.add("semesters", fixture.semester);
  store.add("capabilityPacks", fixture.capability);
  store.add("subjectProfiles", fixture.profile);
  store.add("subjects", fixture.subject);
  assert.equal(store.get("subjects", fixture.subject.id).title, "أي مادة يضيفها المستخدم");
  assert.equal(store.list("subjects").length, 1);
});

test("core rejects a relation to an entity that does not exist", () => {
  const fixture = academicFixture();
  const store = new CoreStore();
  assert.throws(
    () => store.add("semesters", fixture.semester),
    (error) => error instanceof CoreRelationError && /missing academicYears/.test(error.message),
  );
});

test("core rejects duplicate IDs instead of replacing data silently", () => {
  const { year } = academicFixture();
  const store = new CoreStore();
  store.add("academicYears", year);
  assert.throws(() => store.add("academicYears", year), /Duplicate core entity ID/);
});

test("export and import preserve the same entities", () => {
  const fixture = academicFixture();
  const store = new CoreStore();
  store.add("academicYears", fixture.year);
  store.add("semesters", fixture.semester);
  store.add("capabilityPacks", fixture.capability);
  store.add("subjectProfiles", fixture.profile);
  store.add("subjects", fixture.subject);
  const exported = store.exportSnapshot(10);
  const restored = new CoreStore(exported);
  assert.deepEqual(restored.exportSnapshot(10), exported);
});

test("schema version 0 migrates forward without losing collections", () => {
  const { year } = academicFixture();
  const migrated = migrateSnapshot({
    academicYears: [year],
    semesters: [],
  }, 10);
  assert.equal(migrated.schemaVersion, CORE_SCHEMA_VERSION);
  assert.deepEqual(migrated.entities.academicYears, [year]);
  assert.deepEqual(migrated.entities.subjects, []);
  assert.deepEqual(migrated.entities.scheduleEntries, []);
  assert.deepEqual(migrated.entities.lectures, []);
  assert.deepEqual(migrated.entities.tasks, []);
  assert.deepEqual(migrated.entities.fileArtifacts, []);
  assert.deepEqual(migrated.entities.fileHashes, []);
  assert.deepEqual(migrated.entities.fileVersions, []);
  assert.deepEqual(migrated.entities.artifactLinks, []);
  assert.deepEqual(migrated.entities.notebooks, []);
  assert.deepEqual(migrated.entities.inkDocuments, []);
  assert.deepEqual(migrated.entities.inkRevisions, []);
});

test("schema version 1 migrates to current without losing academic data", () => {
  const fixture = academicFixture();
  const versionOne = {
    schemaVersion: 1,
    exportedAt: "2026-07-25T00:00:00.000Z",
    entities: {
      academicYears: [fixture.year],
      semesters: [fixture.semester],
      capabilityPacks: [fixture.capability],
      subjectProfiles: [fixture.profile],
      subjects: [fixture.subject],
    },
  };
  const migrated = migrateSnapshot(versionOne, 10);
  assert.equal(migrated.schemaVersion, CORE_SCHEMA_VERSION);
  assert.deepEqual(migrated.entities.subjects, [fixture.subject]);
  assert.deepEqual(migrated.entities.scheduleEntries, []);
  assert.deepEqual(migrated.entities.lectures, []);
  assert.deepEqual(migrated.entities.tasks, []);
  assert.deepEqual(migrated.entities.fileArtifacts, []);
});

test("schema version 2 migrates to current without losing planning data", () => {
  const fixture = academicFixture();
  const task = createTask({
    subjectId: fixture.subject.id,
    title: "مهمة محفوظة",
    now: 20,
  });
  const versionTwo = {
    schemaVersion: 2,
    exportedAt: "2026-07-25T00:00:00.000Z",
    entities: {
      academicYears: [fixture.year],
      semesters: [fixture.semester],
      capabilityPacks: [fixture.capability],
      subjectProfiles: [fixture.profile],
      subjects: [fixture.subject],
      scheduleEntries: [],
      lectures: [],
      tasks: [task],
    },
  };
  const migrated = migrateSnapshot(versionTwo, 30);
  assert.equal(migrated.schemaVersion, CORE_SCHEMA_VERSION);
  assert.deepEqual(migrated.entities.tasks, [task]);
  assert.deepEqual(migrated.entities.fileHashes, []);
  assert.deepEqual(migrated.entities.fileVersions, []);
  assert.deepEqual(migrated.entities.artifactLinks, []);
});

test("schema version 3 migrates to current without losing file metadata", () => {
  const versionThree = {
    schemaVersion: 3,
    exportedAt: "2026-07-25T00:00:00.000Z",
    entities: {
      academicYears: [],
      semesters: [],
      capabilityPacks: [],
      subjectProfiles: [],
      subjects: [],
      scheduleEntries: [],
      lectures: [],
      tasks: [],
      fileArtifacts: [],
      fileHashes: [],
      fileVersions: [],
      artifactLinks: [],
    },
  };
  const migrated = migrateSnapshot(versionThree, 40);
  assert.equal(migrated.schemaVersion, CORE_SCHEMA_VERSION);
  assert.deepEqual(migrated.entities.fileArtifacts, []);
  assert.deepEqual(migrated.entities.notebooks, []);
  assert.deepEqual(migrated.entities.inkDocuments, []);
  assert.deepEqual(migrated.entities.inkRevisions, []);
});

test("schema version 4 migrates to current without losing notebook data", () => {
  const versionFour = {
    schemaVersion: 4,
    exportedAt: "2026-07-25T00:00:00.000Z",
    entities: {
      academicYears: [],
      semesters: [],
      capabilityPacks: [],
      subjectProfiles: [],
      subjects: [],
      scheduleEntries: [],
      lectures: [],
      tasks: [],
      fileArtifacts: [],
      fileHashes: [],
      fileVersions: [],
      artifactLinks: [],
      notebooks: [],
      inkDocuments: [],
      inkRevisions: [],
    },
  };
  const migrated = migrateSnapshot(versionFour, 50);
  assert.equal(migrated.schemaVersion, 6);
  assert.deepEqual(migrated.entities.notebooks, []);
  assert.deepEqual(migrated.entities.inkDocuments, []);
  assert.deepEqual(migrated.entities.inkRevisions, []);
  assert.deepEqual(migrated.entities.lectureCaptures, []);
  assert.deepEqual(migrated.entities.lectureCloseouts, []);
  assert.deepEqual(migrated.entities.captureResolutions, []);
});

test("planning models validate time, status, priority, and task revisions", () => {
  const fixture = academicFixture();
  const schedule = createScheduleEntry({
    subjectId: fixture.subject.id,
    dayOfWeek: 1,
    startTime: "09:00",
    endTime: "10:30",
    now: 10,
  });
  const lecture = createLecture({
    subjectId: fixture.subject.id,
    scheduleEntryId: schedule.id,
    title: "محاضرة",
    startsAt: "2026-09-07T09:00:00+03:00",
    endsAt: "2026-09-07T10:30:00+03:00",
    now: 11,
  });
  const task = createTask({
    subjectId: fixture.subject.id,
    lectureId: lecture.id,
    title: "مهمة",
    priority: "high",
    dueAt: "2026-09-08T12:00:00+03:00",
    now: 12,
  });
  const revised = reviseTask(task, { status: "done" }, 13);

  assert.equal(schedule.dayOfWeek, 1);
  assert.equal(lecture.startsAt, "2026-09-07T06:00:00.000Z");
  assert.equal(revised.status, "done");
  assert.equal(revised.createdAt, task.createdAt);
  assert.equal(revised.completedAt, revised.updatedAt);
  assert.throws(
    () => createScheduleEntry({
      subjectId: fixture.subject.id,
      dayOfWeek: 8,
      startTime: "09:00",
      endTime: "10:00",
    }),
    /dayOfWeek/,
  );
  assert.throws(
    () => createScheduleEntry({
      subjectId: fixture.subject.id,
      dayOfWeek: 1,
      startTime: "10:00",
      endTime: "09:00",
    }),
    /startTime must precede/,
  );
  assert.throws(
    () => createLecture({
      subjectId: fixture.subject.id,
      title: "محاضرة",
      startsAt: "2026-09-07T09:00:00+03:00",
      endsAt: "2026-09-07T10:00:00+03:00",
      status: "delayed",
    }),
    /status/,
  );
  assert.throws(
    () => createLecture({
      subjectId: fixture.subject.id,
      title: "وقت محلي غامض",
      startsAt: "2026-09-07T09:00:00",
      endsAt: "2026-09-07T10:00:00",
    }),
    /explicit timezone/,
  );
  assert.throws(
    () => createScheduleEntry({
      subjectId: fixture.subject.id,
      dayOfWeek: 1,
      startTime: "09:00",
      endTime: "10:00",
      effectiveFrom: "2026-02-31",
    }),
    /effectiveFrom/,
  );
  assert.throws(
    () => createTask({ title: "مهمة", priority: "critical" }),
    /priority/,
  );
  assert.throws(
    () => createTask({ title: "مهمة", status: "waiting" }),
    /status/,
  );
  assert.throws(
    () => reviseTask(task, { subjectId: fixture.subject.id }, 14),
    /cannot be changed/,
  );
});

test("future schemas fail clearly instead of being opened unsafely", () => {
  assert.throws(
    () => migrateSnapshot({ schemaVersion: 99, entities: {} }),
    (error) => error instanceof CoreMigrationError && /newer than supported/.test(error.message),
  );
});
