import assert from "node:assert/strict";
import test from "node:test";
import { createStableId, isStableId } from "../src/ids.mjs";
import {
  createAcademicYear,
  createCapabilityPack,
  createSemester,
  createSubject,
  createSubjectProfile,
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
});

test("future schemas fail clearly instead of being opened unsafely", () => {
  assert.throws(
    () => migrateSnapshot({ schemaVersion: 99, entities: {} }),
    (error) => error instanceof CoreMigrationError && /newer than supported/.test(error.message),
  );
});
