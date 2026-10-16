import assert from "node:assert/strict";
import test from "node:test";
import {
  AcademicRepository,
  AcademicRepositoryRecoveryRequiredError,
} from "../src/academic-repository.mjs";
import { CoreLocalDatabase, CorePersistenceError } from "../src/local-database.mjs";
import { CoreRelationError, CoreStore } from "../src/store.mjs";
import { MemoryCoreDriver } from "./helpers/memory-driver.mjs";
import { MemoryFileContentStore } from "./helpers/memory-file-content-store.mjs";

function repositoryFixture(nowStart = 10_000) {
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

async function createAcademicContext(repository, profileKey = "notebook-test") {
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
    key: profileKey,
    label: "مادة عامة",
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

async function createNotebookDocument(repository) {
  const { lecture, subject } = await createAcademicContext(repository);
  const notebook = await repository.createNotebook({
    subjectId: subject.id,
    lectureId: lecture.id,
    title: "دفتر المحاضرة",
    template: "engineering",
  });
  const document = await repository.createInkDocument({
    notebookId: notebook.id,
    title: "صفحة 1",
    width: 1600,
    height: 2200,
  });
  return { document, lecture, notebook, subject };
}

function inkSnapshot(strokeId = "stroke-1", x = 10) {
  return {
    layers: [{ id: "notes", name: "Notes", visible: true }],
    strokes: [{
      id: strokeId,
      layerId: "notes",
      color: "#111111",
      baseWidth: 4,
      pointerType: "pen",
      points: [
        { x, y: 20, pressure: 0.4, time: 1 },
        { x: x + 5, y: 25, pressure: 0.7, time: 2 },
      ],
    }],
  };
}

test("notebook links to a subject and a lecture from the same subject", async () => {
  const { repository } = repositoryFixture();
  const { lecture, subject } = await createAcademicContext(repository);
  const notebook = await repository.createNotebook({
    subjectId: subject.id,
    lectureId: lecture.id,
    title: "دفتر",
    template: "grid",
  });

  assert.equal(notebook.subjectId, subject.id);
  assert.equal(notebook.lectureId, lecture.id);
  assert.equal(notebook.template, "grid");
  assert.deepEqual(
    (await repository.listNotebooks({ subjectId: subject.id })).map(({ id }) => id),
    [notebook.id],
  );
});

test("notebook rejects missing or cross-subject lecture relations and unknown templates", async () => {
  const { repository } = repositoryFixture();
  const first = await createAcademicContext(repository, "first");
  const second = await createAcademicContext(repository, "second");

  await assert.rejects(
    () => repository.createNotebook({
      subjectId: first.subject.id,
      lectureId: second.lecture.id,
      title: "علاقة خاطئة",
    }),
    CoreRelationError,
  );
  await assert.rejects(
    () => repository.createNotebook({
      subjectId: first.subject.id,
      title: "قالب خاطئ",
      template: "custom-subject-template",
    }),
    /template/,
  );
});

test("ink save copies input and preserves layer, stroke, and point order", async () => {
  const { repository } = repositoryFixture();
  const { document } = await createNotebookDocument(repository);
  const input = {
    layers: [
      { id: "underlay", name: "Underlay" },
      { id: "notes", name: "Notes" },
    ],
    strokes: [
      { ...inkSnapshot("stroke-a", 1).strokes[0], layerId: "notes" },
      { ...inkSnapshot("stroke-b", 20).strokes[0], layerId: "underlay" },
    ],
  };
  const created = await repository.saveInkRevision(document.id, input);
  input.layers.reverse();
  input.strokes[0].points[0].x = 999;

  const stored = await repository.getInkRevisionContent(created.revision.id);
  assert.equal(created.status, "created");
  assert.equal(created.revision.layerCount, 2);
  assert.equal(created.revision.strokeCount, 2);
  assert.equal(created.revision.pointCount, 4);
  assert.deepEqual(stored.snapshot.layers.map(({ id }) => id), ["underlay", "notes"]);
  assert.deepEqual(stored.snapshot.strokes.map(({ id }) => id), ["stroke-a", "stroke-b"]);
  assert.equal(stored.snapshot.strokes[0].points[0].x, 1);
});

test("ink revisions preserve history and identical content returns duplicate", async () => {
  const { contentStore, repository } = repositoryFixture();
  const { document } = await createNotebookDocument(repository);
  const first = await repository.saveInkRevision(document.id, inkSnapshot());
  const duplicate = await repository.saveInkRevision(document.id, inkSnapshot());
  const second = await repository.saveInkRevision(document.id, inkSnapshot("stroke-2", 30));

  assert.equal(first.revision.revisionNumber, 1);
  assert.equal(duplicate.status, "duplicate");
  assert.equal(duplicate.revision.id, first.revision.id);
  assert.equal(second.revision.revisionNumber, 2);
  assert.deepEqual(
    (await repository.listInkRevisions({ inkDocumentId: document.id }))
      .map(({ revisionNumber }) => revisionNumber),
    [1, 2],
  );
  assert.equal(contentStore.records.size, 2);
});

test("concurrent ink saves serialize revision numbers without losing either snapshot", async () => {
  const { repository } = repositoryFixture();
  const { document } = await createNotebookDocument(repository);
  const [first, second] = await Promise.all([
    repository.saveInkRevision(document.id, inkSnapshot("stroke-a", 1)),
    repository.saveInkRevision(document.id, inkSnapshot("stroke-b", 50)),
  ]);

  assert.deepEqual(
    [first.revision.revisionNumber, second.revision.revisionNumber].sort(),
    [1, 2],
  );
  assert.equal((await repository.listInkRevisions({
    inkDocumentId: document.id,
  })).length, 2);
});

test("ink metadata collections enforce stable relations and immutable revisions", async () => {
  const { repository } = repositoryFixture();
  const { document } = await createNotebookDocument(repository);
  const saved = await repository.saveInkRevision(document.id, inkSnapshot());
  const store = new CoreStore(await repository.exportSnapshot());

  assert.throws(
    () => store.replace("inkRevisions", saved.revision),
    /Immutable core collection/,
  );
  await assert.rejects(
    () => repository.createInkDocument({
      notebookId: "notebook_00000000-0000-4000-8000-000000000000",
      title: "مفقود",
      width: 100,
      height: 100,
    }),
    CoreRelationError,
  );
});

test("notebook, ink document, revisions, and bytes survive reopen", async () => {
  const { contentStore, driver, repository } = repositoryFixture();
  const { document, notebook } = await createNotebookDocument(repository);
  const saved = await repository.saveInkRevision(document.id, inkSnapshot());
  const reopened = new AcademicRepository(
    new CoreLocalDatabase(driver, { now: () => 20_000 }),
    { now: () => 20_001, fileContentStore: contentStore },
  );

  assert.equal((await reopened.listNotebooks())[0].id, notebook.id);
  assert.equal((await reopened.listInkDocuments())[0].id, document.id);
  assert.equal((await reopened.listInkRevisions())[0].id, saved.revision.id);
  assert.equal(
    (await reopened.getInkRevisionContent(saved.revision.id)).snapshot.documentId,
    document.id,
  );
});

test("ink read rejects same-size corruption", async () => {
  const { contentStore, repository } = repositoryFixture();
  const { document } = await createNotebookDocument(repository);
  const saved = await repository.saveInkRevision(document.id, inkSnapshot());
  const damaged = contentStore.records.get(saved.revision.storageKey);
  damaged.bytes[damaged.bytes.length - 2] ^= 1;
  contentStore.records.set(saved.revision.storageKey, damaged);

  await assert.rejects(
    () => repository.getInkRevisionContent(saved.revision.id),
    /hash mismatch/,
  );
});

test("failed ink metadata persistence preserves bytes and recovers from the journal", async () => {
  const { contentStore, driver, repository } = repositoryFixture();
  const { document } = await createNotebookDocument(repository);
  driver.failNextCommit = true;

  await assert.rejects(
    () => repository.saveInkRevision(document.id, inkSnapshot()),
    CorePersistenceError,
  );
  assert.equal(contentStore.records.size, 1);
  assert.deepEqual(await repository.listInkRevisions(), []);
  await assert.rejects(
    () => repository.saveInkRevision(document.id, inkSnapshot("blocked")),
    AcademicRepositoryRecoveryRequiredError,
  );

  assert.equal((await repository.recover()).recovered, true);
  assert.equal((await repository.listInkRevisions()).length, 1);
});
