import assert from "node:assert/strict";
import test from "node:test";
import {
  BackupRestoreConflictError,
  BackupValidationError,
  PORTABLE_BACKUP_FORMAT,
  PORTABLE_BACKUP_VERSION,
  restorePortableBackup,
  verifyPortableBackup,
} from "../src/backup.mjs";
import { AcademicRepository } from "../src/academic-repository.mjs";
import { CoreLocalDatabase, CorePersistenceError } from "../src/local-database.mjs";
import { COLLECTIONS } from "../src/schema.mjs";
import { MemoryCoreDriver } from "./helpers/memory-driver.mjs";
import { MemoryFileContentStore } from "./helpers/memory-file-content-store.mjs";

function repositoryFixture(nowStart = 50_000) {
  let clock = nowStart;
  const driver = new MemoryCoreDriver();
  const contentStore = new MemoryFileContentStore();
  const database = new CoreLocalDatabase(driver, { now: () => clock++ });
  const repository = new AcademicRepository(database, {
    now: () => clock++,
    fileContentStore: contentStore,
  });
  return { contentStore, database, driver, repository };
}

async function createAcademicContext(repository) {
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
    key: "backup-test",
    label: "اختبار النسخ",
  });
  const subject = await repository.createSubject({
    semesterId: semester.id,
    subjectProfileId: profile.id,
    title: "مادة اختبار",
  });
  const lecture = await repository.createLecture({
    subjectId: subject.id,
    title: "المحاضرة الأولى",
    startsAt: "2026-09-07T09:00:00+03:00",
    endsAt: "2026-09-07T10:30:00+03:00",
  });
  return { lecture, subject };
}

async function createCompleteFixture(repository) {
  const { lecture, subject } = await createAcademicContext(repository);
  const file = await repository.ingestFile({
    bytes: new Uint8Array([37, 80, 68, 70, 45, 49]),
    originalName: "lecture.pdf",
    mediaType: "application/pdf",
  });
  await repository.linkArtifact({
    artifactId: file.artifact.id,
    targetKind: "lecture",
    targetId: lecture.id,
    role: "source",
  });
  await repository.createNote({
    subjectId: subject.id,
    lectureId: lecture.id,
    artifactId: file.artifact.id,
    fileVersionId: file.version.id,
    title: "ملاحظة",
    body: "هذه الملاحظة يجب أن تعود بعد الاستعادة.",
    pageNumber: 1,
  });
  const notebook = await repository.createNotebook({
    subjectId: subject.id,
    lectureId: lecture.id,
    title: "دفتر الرسم",
    template: "engineering",
  });
  const document = await repository.createInkDocument({
    notebookId: notebook.id,
    title: "صفحة 1",
    width: 1600,
    height: 2200,
  });
  const ink = await repository.saveInkRevision(document.id, {
    layers: [{ id: "main", name: "Main", visible: true }],
    strokes: [{
      id: "stroke-1",
      layerId: "main",
      color: "#111111",
      baseWidth: 4,
      pointerType: "pen",
      points: [
        { x: 10, y: 20, pressure: 0.4, time: 1 },
        { x: 30, y: 40, pressure: 0.8, time: 2 },
      ],
    }],
  });
  return { document, file, ink, lecture, notebook, subject };
}

function totalEntities(snapshot) {
  return COLLECTIONS.reduce(
    (total, collection) => total + snapshot.entities[collection].length,
    0,
  );
}

test("empty portable backup is valid and has a complete manifest", async () => {
  const { repository } = repositoryFixture();
  const backup = await repository.createPortableBackup();
  const verified = await verifyPortableBackup(backup);

  assert.equal(backup.format, PORTABLE_BACKUP_FORMAT);
  assert.equal(backup.formatVersion, PORTABLE_BACKUP_VERSION);
  assert.equal(backup.manifest.contentCount, 0);
  assert.equal(backup.manifest.contentBytes, 0);
  assert.equal(totalEntities(verified.snapshot), 0);
  assert.deepEqual(backup.contents, []);
  assert.deepEqual(Object.keys(backup.manifest.entityCounts), COLLECTIONS);
});

test("backup includes PDF and Ink once without mutating source data", async () => {
  const { contentStore, repository } = repositoryFixture();
  await createCompleteFixture(repository);
  const snapshotBefore = await repository.exportSnapshot();
  const bytesBefore = new Map(
    [...contentStore.records].map(([key, record]) => [key, [...record.bytes]]),
  );
  const backup = await repository.createPortableBackup();
  const verified = await verifyPortableBackup(backup);

  assert.equal(backup.manifest.contentCount, 2);
  assert.equal(backup.contents.length, 2);
  assert.equal(verified.contents.length, 2);
  const snapshotAfter = await repository.exportSnapshot();
  assert.equal(snapshotAfter.schemaVersion, snapshotBefore.schemaVersion);
  assert.deepEqual(snapshotAfter.entities, snapshotBefore.entities);
  assert.deepEqual(
    new Map([...contentStore.records].map(([key, record]) => [key, [...record.bytes]])),
    bytesBefore,
  );
});

test("verification detects changed snapshot, content, and manifest", async () => {
  const { repository } = repositoryFixture();
  await createCompleteFixture(repository);
  const backup = await repository.createPortableBackup();

  const changedSnapshot = structuredClone(backup);
  changedSnapshot.snapshot.entities.notes[0].body = "تم العبث بالملاحظة";
  await assert.rejects(
    () => verifyPortableBackup(changedSnapshot),
    /snapshot digest mismatch/,
  );

  const changedContent = structuredClone(backup);
  changedContent.contents[0].data = btoa("damaged");
  await assert.rejects(
    () => verifyPortableBackup(changedContent),
    BackupValidationError,
  );

  const changedManifest = structuredClone(backup);
  changedManifest.manifest.contentCount += 1;
  await assert.rejects(
    () => verifyPortableBackup(changedManifest),
    /content totals mismatch/,
  );
});

test("restore to empty storage preserves entities, relations, PDF, and Ink bytes", async () => {
  const source = repositoryFixture();
  const fixture = await createCompleteFixture(source.repository);
  const backup = await source.repository.createPortableBackup();
  const target = repositoryFixture(80_000);

  const result = await restorePortableBackup({
    bundle: backup,
    database: target.database,
    contentStore: target.contentStore,
  });
  const restored = new AcademicRepository(target.database, {
    now: () => 90_000,
    fileContentStore: target.contentStore,
  });

  assert.equal(result.restored, true);
  assert.equal(result.replacedExisting, false);
  assert.equal((await restored.listFileArtifacts()).length, 1);
  assert.equal((await restored.listNotes()).length, 1);
  assert.equal((await restored.listNotebooks()).length, 1);
  assert.equal((await restored.listInkRevisions()).length, 1);
  assert.deepEqual(
    [...(await restored.getFileContent(fixture.file.version.id)).bytes],
    [37, 80, 68, 70, 45, 49],
  );
  assert.equal(
    (await restored.getInkRevisionContent(fixture.ink.revision.id))
      .snapshot.strokes[0].id,
    "stroke-1",
  );
});

test("restore requires explicit approval before replacing existing data", async () => {
  const source = repositoryFixture();
  await createCompleteFixture(source.repository);
  const backup = await source.repository.createPortableBackup();
  const target = repositoryFixture(100_000);
  await target.repository.createAcademicYear({
    label: "بيانات موجودة",
    startDate: "2025-09-01",
    endDate: "2026-06-30",
  });
  const existing = await target.repository.exportSnapshot();

  await assert.rejects(
    () => restorePortableBackup({
      bundle: backup,
      database: target.database,
      contentStore: target.contentStore,
    }),
    BackupRestoreConflictError,
  );
  const afterRejectedRestore = await target.repository.exportSnapshot();
  assert.equal(afterRejectedRestore.schemaVersion, existing.schemaVersion);
  assert.deepEqual(afterRejectedRestore.entities, existing.entities);

  const replaced = await restorePortableBackup({
    bundle: backup,
    database: target.database,
    contentStore: target.contentStore,
    allowReplace: true,
  });
  const reopened = new AcademicRepository(target.database, {
    fileContentStore: target.contentStore,
  });
  assert.equal(replaced.replacedExisting, true);
  assert.equal((await reopened.listNotes()).length, 1);
  assert.equal((await reopened.exportSnapshot()).entities.academicYears.length, 1);
});

test("failed restore commit preserves journal and recovers the verified backup", async () => {
  const source = repositoryFixture();
  await createCompleteFixture(source.repository);
  const backup = await source.repository.createPortableBackup();
  const target = repositoryFixture(120_000);
  target.driver.failNextCommit = true;

  await assert.rejects(
    () => restorePortableBackup({
      bundle: backup,
      database: target.database,
      contentStore: target.contentStore,
    }),
    CorePersistenceError,
  );
  assert.ok(target.driver.journal);

  const recoveredDatabase = new CoreLocalDatabase(target.driver, {
    now: () => 130_000,
  });
  const recovered = await recoveredDatabase.load();
  assert.equal(recovered.recovered, true);
  assert.equal(recovered.snapshot.entities.notes.length, 1);
  assert.equal(target.driver.journal, null);
});

test("restore rejects a corrupt existing content record before committing snapshot", async () => {
  const source = repositoryFixture();
  await createCompleteFixture(source.repository);
  const backup = await source.repository.createPortableBackup();
  const target = repositoryFixture(140_000);
  const first = backup.contents[0];
  target.contentStore.records.set(first.storageKey, {
    key: first.storageKey,
    bytes: new Uint8Array(first.byteSize).fill(9),
    byteSize: first.byteSize,
    mediaType: first.mediaType,
    createdAt: new Date(140_000).toISOString(),
  });

  await assert.rejects(
    () => restorePortableBackup({
      bundle: backup,
      database: target.database,
      contentStore: target.contentStore,
    }),
    /Restored content verification failed/,
  );
  assert.equal(target.driver.snapshot, null);
});
