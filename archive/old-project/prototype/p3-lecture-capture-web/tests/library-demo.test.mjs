import assert from "node:assert/strict";
import test from "node:test";
import { AcademicRepository } from "../../../packages/studio5-core/src/academic-repository.mjs";
import { CoreLocalDatabase } from "../../../packages/studio5-core/src/local-database.mjs";
import { createLibraryDemo } from "../library/library-demo.mjs";
import {
  clearDraft,
  draftKey,
  readDraft,
  validatePdfFile,
  writeDraft,
} from "../library/library-state.mjs";
import { MemoryCoreDriver } from "../../../packages/studio5-core/tests/helpers/memory-driver.mjs";
import { MemoryFileContentStore } from "../../../packages/studio5-core/tests/helpers/memory-file-content-store.mjs";

function fixture() {
  const database = new CoreLocalDatabase(new MemoryCoreDriver());
  const contentStore = new MemoryFileContentStore();
  const repository = new AcademicRepository(database, { fileContentStore: contentStore });
  return { contentStore, database, repository };
}

function fakePdf(name = "lecture.pdf", bytes = new Uint8Array([37, 80, 68, 70])) {
  return {
    name,
    type: "application/pdf",
    size: bytes.byteLength,
    lastModified: Date.parse("2026-07-27T10:00:00Z"),
    async arrayBuffer() {
      return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    },
  };
}

test("library bootstrap is idempotent and reuses one subject", async () => {
  const { repository } = fixture();
  const first = await createLibraryDemo(repository);
  const second = await createLibraryDemo(repository);
  assert.equal(first.subject.id, second.subject.id);
  assert.equal((await repository.listSubjects()).length, 1);
});

test("PDF intake, reopen, note, search, favorite, and recent share Core contracts", async () => {
  const state = fixture();
  const demo = await createLibraryDemo(state.repository);
  const intake = await demo.ingestPdf(fakePdf());
  const duplicate = await demo.ingestPdf(fakePdf());
  assert.equal(duplicate.status, "duplicate");

  const files = await demo.listPdfs();
  assert.equal(files.length, 1);
  const opened = await demo.openPdf(intake.artifact.id);
  assert.deepEqual(opened.content.bytes, new Uint8Array([37, 80, 68, 70]));

  const note = await demo.createNote({
    artifactId: intake.artifact.id,
    fileVersionId: intake.version.id,
    title: "ملاحظة المنظور",
    body: "نقطة الهروب على خط الأفق",
    pageNumber: 2,
  });
  await state.repository.setResourceFavorite("note", note.id, true);
  await state.repository.recordResourceOpened("note", note.id);

  const reopened = new AcademicRepository(state.database, {
    fileContentStore: state.contentStore,
  });
  assert.equal((await reopened.searchLibrary({ query: "خط الأفق" }))[0].targetId, note.id);
  assert.equal((await reopened.listFavoriteResources())[0].targetId, note.id);
  assert.equal((await reopened.listNotes({ artifactId: intake.artifact.id })).length, 1);
});

test("PDF validation rejects wrong type, empty file, and oversized file", () => {
  assert.equal(validatePdfFile(fakePdf()).type, "application/pdf");
  assert.throws(
    () => validatePdfFile({ name: "image.png", type: "image/png", size: 2 }),
    /PDF/,
  );
  assert.throws(
    () => validatePdfFile({ name: "empty.pdf", type: "application/pdf", size: 0 }),
    /فارغ/,
  );
  assert.throws(
    () => validatePdfFile({
      name: "huge.pdf",
      type: "application/pdf",
      size: 51 * 1024 * 1024,
    }),
    /50MB/,
  );
});

test("note draft survives reload semantics and clears only after explicit save", () => {
  const values = new Map();
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
  const artifactId = "file-artifact_11111111-1111-4111-8111-111111111111";
  writeDraft(storage, artifactId, {
    title: "مسودة",
    body: "لا تضيع",
    pageNumber: "4",
  });
  assert.ok(values.has(draftKey(artifactId)));
  assert.deepEqual(readDraft(storage, artifactId), {
    title: "مسودة",
    body: "لا تضيع",
    pageNumber: "4",
  });
  clearDraft(storage, artifactId);
  assert.deepEqual(readDraft(storage, artifactId), {
    title: "",
    body: "",
    pageNumber: "",
  });
});
