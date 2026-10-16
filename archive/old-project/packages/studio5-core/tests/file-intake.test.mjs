import assert from "node:assert/strict";
import test from "node:test";
import {
  AcademicRepository,
  AcademicRepositoryRecoveryRequiredError,
} from "../src/academic-repository.mjs";
import { sha256Hex } from "../src/file-intake.mjs";
import { CoreLocalDatabase, CorePersistenceError } from "../src/local-database.mjs";
import { CoreRelationError, CoreStore } from "../src/store.mjs";
import { MemoryCoreDriver } from "./helpers/memory-driver.mjs";
import { MemoryFileContentStore } from "./helpers/memory-file-content-store.mjs";

function repositoryFixture(nowStart = 1_000) {
  let clock = nowStart;
  const driver = new MemoryCoreDriver();
  const contentStore = new MemoryFileContentStore();
  const database = new CoreLocalDatabase(driver, { now: () => clock++ });
  const repository = new AcademicRepository(database, {
    now: () => clock++,
    fileContentStore: contentStore,
  });
  return { contentStore, driver, repository };
}

async function createSubject(repository) {
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
    key: "file-test",
    label: "اختبار الملفات",
  });
  return repository.createSubject({
    semesterId: semester.id,
    subjectProfileId: profile.id,
    title: "مادة مرتبطة",
  });
}

test("SHA-256 is deterministic and never mutates source bytes", async () => {
  const bytes = new TextEncoder().encode("abc");
  const before = [...bytes];
  const digest = await sha256Hex(bytes);

  assert.equal(
    digest,
    "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
  );
  assert.deepEqual([...bytes], before);
});

test("file intake creates immutable metadata and content-addressed bytes", async () => {
  const { contentStore, repository } = repositoryFixture();
  const source = new Uint8Array([1, 2, 3, 4]);
  const result = await repository.ingestFile({
    bytes: source,
    originalName: "lecture.pdf",
    displayName: "المحاضرة الأولى",
    mediaType: "application/pdf",
    originalModifiedAt: "2026-07-25T10:00:00+03:00",
  });
  source[0] = 99;

  assert.equal(result.status, "created");
  assert.equal(result.version.versionNumber, 1);
  assert.equal(result.version.byteSize, 4);
  assert.equal(result.version.storageKey, `sha256/${result.fileHash.digest}`);
  assert.equal((await repository.listFileArtifacts()).length, 1);
  assert.equal((await repository.listFileVersions()).length, 1);
  assert.equal(contentStore.records.size, 1);
  const stored = await repository.getFileContent(result.version.id);
  assert.deepEqual([...stored.bytes], [1, 2, 3, 4]);
  assert.equal(stored.mediaType, "application/pdf");
});

test("identical bytes are detected as one artifact even under concurrent intake", async () => {
  const { contentStore, repository } = repositoryFixture();
  const bytes = new Uint8Array([10, 20, 30]);
  const [first, second] = await Promise.all([
    repository.ingestFile({
      bytes,
      originalName: "first.pdf",
      mediaType: "application/pdf",
    }),
    repository.ingestFile({
      bytes,
      originalName: "renamed-copy.pdf",
      mediaType: "application/pdf",
    }),
  ]);

  assert.deepEqual(
    [first.status, second.status].sort(),
    ["created", "duplicate"],
  );
  assert.equal(first.artifact.id, second.artifact.id);
  assert.equal((await repository.listFileArtifacts()).length, 1);
  assert.equal((await repository.listFileVersions()).length, 1);
  assert.equal(contentStore.records.size, 1);
});

test("an intentional new version preserves the old version and deduplicates content", async () => {
  const { contentStore, repository } = repositoryFixture();
  const initial = await repository.ingestFile({
    bytes: new Uint8Array([1, 1, 1]),
    originalName: "drawing.pdf",
    mediaType: "application/pdf",
  });
  const next = await repository.addFileVersion(initial.artifact.id, {
    bytes: new Uint8Array([2, 2, 2]),
    originalName: "drawing-v2.pdf",
    mediaType: "application/pdf",
  });
  const duplicate = await repository.addFileVersion(initial.artifact.id, {
    bytes: new Uint8Array([2, 2, 2]),
    originalName: "drawing-v2-copy.pdf",
    mediaType: "application/pdf",
  });

  assert.equal(next.status, "created");
  assert.equal(next.version.versionNumber, 2);
  assert.equal(duplicate.status, "duplicate");
  assert.equal(duplicate.version.id, next.version.id);
  assert.deepEqual(
    (await repository.listFileVersions({ artifactId: initial.artifact.id }))
      .map(({ versionNumber }) => versionNumber),
    [1, 2],
  );
  assert.equal(contentStore.records.size, 2);
});

test("artifact links use stable existing targets and reject duplicates", async () => {
  const { repository } = repositoryFixture();
  const subject = await createSubject(repository);
  const file = await repository.ingestFile({
    bytes: new Uint8Array([7]),
    originalName: "material-card.jpg",
    mediaType: "image/jpeg",
  });
  const link = await repository.linkArtifact({
    artifactId: file.artifact.id,
    targetKind: "subject",
    targetId: subject.id,
    role: "reference",
  });

  assert.deepEqual(
    (await repository.listArtifactLinks({
      artifactId: file.artifact.id,
      targetKind: "subject",
      targetId: subject.id,
    })).map(({ id }) => id),
    [link.id],
  );
  await assert.rejects(
    () => repository.linkArtifact({
      artifactId: file.artifact.id,
      targetKind: "subject",
      targetId: subject.id,
      role: "reference",
    }),
    CoreRelationError,
  );
  await assert.rejects(
    () => repository.linkArtifact({
      artifactId: file.artifact.id,
      targetKind: "subject",
      targetId: "subject_00000000-0000-4000-8000-000000000000",
    }),
    CoreRelationError,
  );
});

test("file metadata collections reject replacement", async () => {
  const { repository } = repositoryFixture();
  const result = await repository.ingestFile({
    bytes: new Uint8Array([5, 5]),
    originalName: "immutable.bin",
  });
  const store = new CoreStore(await repository.exportSnapshot());

  assert.throws(
    () => store.replace("fileArtifacts", {
      ...result.artifact,
      displayName: "changed",
    }),
    /Immutable core collection/,
  );
  assert.throws(
    () => store.replace("fileVersions", result.version),
    /Immutable core collection/,
  );
  assert.throws(
    () => store.replace("fileHashes", result.fileHash),
    /Immutable core collection/,
  );
});

test("file metadata and content survive repository reopen", async () => {
  const { contentStore, driver, repository } = repositoryFixture();
  const created = await repository.ingestFile({
    bytes: new Uint8Array([8, 9]),
    originalName: "saved.bin",
  });
  const reopened = new AcademicRepository(
    new CoreLocalDatabase(driver, { now: () => 5_000 }),
    { now: () => 5_001, fileContentStore: contentStore },
  );

  assert.equal((await reopened.getFileArtifact(created.artifact.id)).id, created.artifact.id);
  assert.deepEqual(
    [...(await reopened.getFileContent(created.version.id)).bytes],
    [8, 9],
  );
});

test("file content read rejects same-size corruption instead of returning damaged bytes", async () => {
  const { contentStore, repository } = repositoryFixture();
  const created = await repository.ingestFile({
    bytes: new Uint8Array([8, 9]),
    originalName: "protected.bin",
  });
  const damaged = contentStore.records.get(created.version.storageKey);
  damaged.bytes = new Uint8Array([9, 8]);
  contentStore.records.set(created.version.storageKey, damaged);

  await assert.rejects(
    () => repository.getFileContent(created.version.id),
    /hash mismatch/,
  );
});

test("failed metadata persistence keeps content and recovers through the journal", async () => {
  const { contentStore, driver, repository } = repositoryFixture();
  driver.failNextCommit = true;

  await assert.rejects(
    () => repository.ingestFile({
      bytes: new Uint8Array([4, 2]),
      originalName: "recover.bin",
    }),
    CorePersistenceError,
  );
  assert.equal(contentStore.records.size, 1);
  assert.deepEqual(await repository.listFileArtifacts(), []);
  await assert.rejects(
    () => repository.ingestFile({
      bytes: new Uint8Array([1]),
      originalName: "blocked.bin",
    }),
    AcademicRepositoryRecoveryRequiredError,
  );

  const recovered = await repository.recover();
  assert.equal(recovered.recovered, true);
  assert.equal((await repository.listFileArtifacts())[0].originalName, "recover.bin");
});

test("file intake refuses to run without a content store", async () => {
  const driver = new MemoryCoreDriver();
  const repository = new AcademicRepository(new CoreLocalDatabase(driver));
  await assert.rejects(
    () => repository.ingestFile({
      bytes: new Uint8Array([1]),
      originalName: "missing-store.bin",
    }),
    /fileContentStore/,
  );
});
