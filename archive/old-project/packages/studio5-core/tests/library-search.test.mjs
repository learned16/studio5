import assert from "node:assert/strict";
import test from "node:test";
import { AcademicRepository } from "../src/academic-repository.mjs";
import { CoreLocalDatabase } from "../src/local-database.mjs";
import { createEmptySnapshot, migrateSnapshot } from "../src/schema.mjs";
import { searchLibrary } from "../src/library-search.mjs";
import { MemoryCoreDriver } from "./helpers/memory-driver.mjs";

function repositoryFixture(nowStart = Date.parse("2026-09-01T08:00:00Z")) {
  let clock = nowStart;
  const driver = new MemoryCoreDriver();
  const database = new CoreLocalDatabase(driver, { now: () => clock++ });
  const repository = new AcademicRepository(database, { now: () => clock++ });
  return {
    database,
    driver,
    repository,
    tick(milliseconds = 1_000) {
      clock += milliseconds;
    },
  };
}

async function createStudyGraph(repository, suffix = "أ") {
  const year = await repository.createAcademicYear({
    label: `السنة ${suffix}`,
    startDate: "2026-09-01",
    endDate: "2027-06-30",
  });
  const semester = await repository.createSemester({
    academicYearId: year.id,
    label: `الفصل ${suffix}`,
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
    title: suffix === "أ" ? "الرَّسم المِعماري" : `مادة ${suffix}`,
    code: suffix === "أ" ? "ARCH-101" : null,
  });
  const lecture = await repository.createLecture({
    subjectId: subject.id,
    title: suffix === "أ" ? "Perspective Basics" : `محاضرة ${suffix}`,
    startsAt: "2026-09-07T09:00:00+03:00",
    endsAt: "2026-09-07T10:30:00+03:00",
  });
  const task = await repository.createTask({
    subjectId: subject.id,
    lectureId: lecture.id,
    title: suffix === "أ" ? "رسم منظور غرفة" : `واجب ${suffix}`,
    notes: suffix === "أ" ? "تسليم اللوحة يوم الخميس" : null,
  });
  const notebook = await repository.createNotebook({
    subjectId: subject.id,
    lectureId: lecture.id,
    title: suffix === "أ" ? "دفتر المنظور" : `دفتر ${suffix}`,
  });
  const capture = await repository.createLectureCapture({
    lectureId: lecture.id,
    kind: "important",
    text: suffix === "أ" ? "كل الخطوط تتجه إلى نقطة الهروب" : `نقطة ${suffix}`,
  });
  return { capture, lecture, notebook, subject, task };
}

test("schema v5 migrates to current without losing lecture-flow entities", () => {
  const v5 = createEmptySnapshot(1);
  v5.schemaVersion = 5;
  delete v5.entities.resourceMarkers;
  v5.entities.lectureCaptures.push({
    kind: "lecture-capture",
    id: "lecture-capture_11111111-1111-4111-8111-111111111111",
    lectureId: "lecture_22222222-2222-4222-8222-222222222222",
    captureKind: "important",
    text: "محفوظ",
    capturedAt: "2026-01-01T00:00:00.000Z",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  });

  const migrated = migrateSnapshot(v5, 2);
  assert.equal(migrated.schemaVersion, 8);
  assert.equal(migrated.entities.lectureCaptures[0].text, "محفوظ");
  assert.deepEqual(migrated.entities.resourceMarkers, []);
});

test("search normalizes Arabic diacritics and English letter case", async () => {
  const { repository } = repositoryFixture();
  const graph = await createStudyGraph(repository);

  const arabic = await repository.searchLibrary({ query: "الرسم المعماري" });
  const english = await repository.searchLibrary({ query: "perspective basics" });

  assert.equal(arabic[0].targetId, graph.subject.id);
  assert.equal(english[0].targetId, graph.lecture.id);
});

test("search filters by stable subject and kind without mutating data", async () => {
  const { repository } = repositoryFixture();
  const first = await createStudyGraph(repository, "أ");
  await createStudyGraph(repository, "ب");
  const before = await repository.exportSnapshot();

  const results = await repository.searchLibrary({
    query: "منظور",
    subjectId: first.subject.id,
    targetKinds: ["task", "notebook", "lecture-capture"],
  });
  const after = await repository.exportSnapshot();

  assert.deepEqual(
    new Set(results.map((item) => item.targetKind)),
    new Set(["task", "notebook"]),
  );
  assert.deepEqual(after.entities, before.entities);
});

test("pure search indexes immutable file metadata and linked subject context", () => {
  const snapshot = createEmptySnapshot(1);
  snapshot.entities.subjects.push({
    kind: "subject",
    id: "subject_11111111-1111-4111-8111-111111111111",
    title: "مواد البناء",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  });
  snapshot.entities.fileArtifacts.push({
    kind: "file-artifact",
    id: "file-artifact_44444444-4444-4444-8444-444444444444",
    displayName: "ملزمة الطابوق",
    originalName: "brick-notes.pdf",
    sourceType: "upload",
    archivedAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  });
  snapshot.entities.artifactLinks.push({
    kind: "artifact-link",
    id: "artifact-link_55555555-5555-4555-8555-555555555555",
    artifactId: snapshot.entities.fileArtifacts[0].id,
    targetKind: "subject",
    targetId: snapshot.entities.subjects[0].id,
    role: "source",
    label: "محاضرة الطابوق",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  });

  const result = searchLibrary(snapshot, {
    query: "brick",
    subjectId: snapshot.entities.subjects[0].id,
  });
  assert.equal(result.length, 1);
  assert.equal(result[0].targetKind, "file-artifact");
});

test("favorites and recent resources persist and retain one marker per target", async () => {
  const fixture = repositoryFixture();
  const graph = await createStudyGraph(fixture.repository);

  await fixture.repository.setResourceFavorite("subject", graph.subject.id, true);
  fixture.tick();
  await fixture.repository.recordResourceOpened("subject", graph.subject.id);
  fixture.tick();
  await fixture.repository.recordResourceOpened("notebook", graph.notebook.id);

  const reopened = new AcademicRepository(fixture.database, {
    now: () => Date.parse("2026-09-02T08:00:00Z"),
  });
  const favorites = await reopened.listFavoriteResources();
  const recent = await reopened.listRecentResources();
  const markers = await reopened.listResourceMarkers();

  assert.deepEqual(favorites.map((item) => item.targetId), [graph.subject.id]);
  assert.deepEqual(
    recent.map((item) => item.targetId),
    [graph.notebook.id, graph.subject.id],
  );
  assert.equal(markers.length, 2);
  assert.equal(markers.find((item) => item.targetId === graph.subject.id).isFavorite, true);
});

test("favorite can be removed without deleting recent history", async () => {
  const { repository } = repositoryFixture();
  const { task } = await createStudyGraph(repository);
  await repository.setResourceFavorite("task", task.id, true);
  await repository.recordResourceOpened("task", task.id, "2026-09-07T11:00:00+03:00");
  await repository.setResourceFavorite("task", task.id, false);

  assert.deepEqual(await repository.listFavoriteResources(), []);
  assert.deepEqual(
    (await repository.listRecentResources()).map((item) => item.targetId),
    [task.id],
  );
});

test("resource markers reject unsupported and missing targets", async () => {
  const { repository } = repositoryFixture();
  await assert.rejects(
    repository.setResourceFavorite(
      "unknown",
      "unknown_11111111-1111-4111-8111-111111111111",
      true,
    ),
    /targetKind must be one of/,
  );
  await assert.rejects(
    repository.recordResourceOpened(
      "subject",
      "subject_11111111-1111-4111-8111-111111111111",
    ),
    /references missing subjects/,
  );
});
