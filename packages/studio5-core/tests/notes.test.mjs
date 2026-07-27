import assert from "node:assert/strict";
import test from "node:test";
import { AcademicRepository } from "../src/academic-repository.mjs";
import { CoreLocalDatabase } from "../src/local-database.mjs";
import { createEmptySnapshot, migrateSnapshot } from "../src/schema.mjs";
import { MemoryCoreDriver } from "./helpers/memory-driver.mjs";
import { MemoryFileContentStore } from "./helpers/memory-file-content-store.mjs";

function fixture(nowStart = 80_000) {
  let clock = nowStart;
  const driver = new MemoryCoreDriver();
  const contentStore = new MemoryFileContentStore();
  const database = new CoreLocalDatabase(driver, { now: () => clock++ });
  const repository = new AcademicRepository(database, {
    fileContentStore: contentStore,
    now: () => clock++,
  });
  return { contentStore, database, repository };
}

async function createGraph(repository, suffix = "أ") {
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
    key: `note-${suffix}`,
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
    endsAt: "2026-09-07T10:00:00+03:00",
  });
  return { lecture, subject };
}

test("schema v7 migrates to v8 without losing offline operations", () => {
  const v7 = createEmptySnapshot(1);
  v7.schemaVersion = 7;
  delete v7.entities.notes;
  v7.entities.offlineOperations.push({
    kind: "offline-operation",
    id: "offline-operation_11111111-1111-4111-8111-111111111111",
    idempotencyKey: "task.sync:1",
    operationType: "entity.upsert",
    entityKind: "task",
    entityId: "task_22222222-2222-4222-8222-222222222222",
    payload: {},
    status: "pending",
    attempts: 0,
    availableAt: "2026-01-01T00:00:00.000Z",
    lastAttemptAt: null,
    completedAt: null,
    errorCode: null,
    errorMessage: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  });

  const migrated = migrateSnapshot(v7, 2);
  assert.equal(migrated.schemaVersion, 8);
  assert.equal(migrated.entities.offlineOperations.length, 1);
  assert.deepEqual(migrated.entities.notes, []);
});

test("PDF note preserves immutable file bytes and persists its context", async () => {
  const state = fixture();
  const { lecture, subject } = await createGraph(state.repository);
  const sourceBytes = new TextEncoder().encode("%PDF-1.4 Studio5 test");
  const intake = await state.repository.ingestFile({
    bytes: sourceBytes,
    displayName: "محاضرة المنظور.pdf",
    originalName: "perspective.pdf",
    mediaType: "application/pdf",
  });
  await state.repository.linkArtifact({
    artifactId: intake.artifact.id,
    targetKind: "subject",
    targetId: subject.id,
    role: "source",
  });

  const note = await state.repository.createNote({
    subjectId: subject.id,
    lectureId: lecture.id,
    artifactId: intake.artifact.id,
    fileVersionId: intake.version.id,
    title: "ملاحظة الصفحة 3",
    body: "خطوط العمق تتجه إلى نقطة الهروب",
    pageNumber: 3,
  });
  const revised = await state.repository.updateNote(note.id, {
    body: "كل خطوط العمق تتجه إلى نقطة الهروب",
  });
  const content = await state.repository.getFileContent(intake.version.id);

  assert.deepEqual(content.bytes, sourceBytes);
  assert.equal(revised.artifactId, intake.artifact.id);
  assert.equal(revised.fileVersionId, intake.version.id);
  assert.equal(revised.pageNumber, 3);

  const reopened = new AcademicRepository(state.database, {
    fileContentStore: state.contentStore,
  });
  const notes = await reopened.listNotes({ artifactId: intake.artifact.id });
  assert.equal(notes.length, 1);
  assert.equal(notes[0].body, revised.body);
});

test("notes are searchable, favoriteable, and recent after reopen", async () => {
  const state = fixture();
  const { subject } = await createGraph(state.repository);
  const note = await state.repository.createNote({
    subjectId: subject.id,
    title: "قاعدة المنظور",
    body: "نقطة الهروب ثابتة على خط الأفق",
  });
  await state.repository.setResourceFavorite("note", note.id, true);
  await state.repository.recordResourceOpened("note", note.id);

  const reopened = new AcademicRepository(state.database);
  assert.equal((await reopened.searchLibrary({ query: "خط الأفق" }))[0].targetId, note.id);
  assert.equal((await reopened.listFavoriteResources())[0].targetId, note.id);
  assert.equal((await reopened.listRecentResources())[0].targetId, note.id);
});

test("note rejects cross-subject lectures and mismatched file versions", async () => {
  const state = fixture();
  const first = await createGraph(state.repository, "أ");
  const second = await createGraph(state.repository, "ب");
  await assert.rejects(
    state.repository.createNote({
      subjectId: first.subject.id,
      lectureId: second.lecture.id,
      title: "خطأ",
      body: "لا يقبل",
    }),
    /note.lectureId must belong to note.subjectId/,
  );

  const firstFile = await state.repository.ingestFile({
    bytes: new Uint8Array([1]),
    displayName: "أ.pdf",
    originalName: "a.pdf",
    mediaType: "application/pdf",
  });
  const secondFile = await state.repository.ingestFile({
    bytes: new Uint8Array([2]),
    displayName: "ب.pdf",
    originalName: "b.pdf",
    mediaType: "application/pdf",
  });
  await assert.rejects(
    state.repository.createNote({
      subjectId: first.subject.id,
      artifactId: firstFile.artifact.id,
      fileVersionId: secondFile.version.id,
      title: "خطأ ملف",
      body: "لا يقبل",
    }),
    /note.fileVersionId must belong to note.artifactId/,
  );
});

test("note validates body and page then keeps relation fields immutable", async () => {
  const { repository } = fixture();
  const { subject } = await createGraph(repository);
  await assert.rejects(
    repository.createNote({
      subjectId: subject.id,
      title: "فارغة",
      body: " ",
    }),
    /body is required/,
  );
  const note = await repository.createNote({
    subjectId: subject.id,
    title: "صالحة",
    body: "نص",
    pageNumber: 1,
  });
  await assert.rejects(
    repository.updateNote(note.id, { pageNumber: 0 }),
    /pageNumber must be a positive integer/,
  );
  await assert.rejects(
    repository.updateNote(note.id, { subjectId: subject.id }),
    /Note field cannot be changed/,
  );
});
