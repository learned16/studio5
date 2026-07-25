import assert from "node:assert/strict";
import test from "node:test";
import {
  AcademicRepository,
  AcademicRepositoryRecoveryRequiredError,
} from "../src/academic-repository.mjs";
import { CoreLocalDatabase, CorePersistenceError } from "../src/local-database.mjs";
import { CoreRelationError } from "../src/store.mjs";
import { MemoryCoreDriver } from "./helpers/memory-driver.mjs";

function repositoryFixture(nowStart = 100) {
  let clock = nowStart;
  const driver = new MemoryCoreDriver();
  const database = new CoreLocalDatabase(driver, { now: () => clock++ });
  const repository = new AcademicRepository(database, { now: () => clock++ });
  return { driver, repository };
}

async function createGraph(repository) {
  const year = await repository.createAcademicYear({
    label: "سنة تجريبية",
    startDate: "2026-09-01",
    endDate: "2027-06-30",
  });
  const semester = await repository.createSemester({
    academicYearId: year.id,
    label: "فصل تجريبي",
    order: 1,
    startDate: "2026-09-01",
    endDate: "2027-01-31",
  });
  const capability = await repository.createCapabilityPack({
    key: "practice",
    label: "تدريب",
    config: { attempts: true },
  });
  const profile = await repository.createSubjectProfile({
    key: "custom-profile",
    label: "ملف مادة مخصص",
    capabilityPackIds: [capability.id],
  });
  const subject = await repository.createSubject({
    semesterId: semester.id,
    subjectProfileId: profile.id,
    title: "اسم يكتبه المستخدم بحرية",
    capabilityPackIds: [capability.id],
  });
  return { year, semester, capability, profile, subject };
}

test("repository creates an academic graph and persists it across reopen", async () => {
  const { driver, repository } = repositoryFixture();
  const graph = await createGraph(repository);

  const reopenedDatabase = new CoreLocalDatabase(driver, { now: () => 200 });
  const reopened = new AcademicRepository(reopenedDatabase, { now: () => 201 });
  const loadState = await reopened.initialize();
  assert.equal(loadState.source, "snapshot");
  assert.equal((await reopened.listAcademicYears()).length, 1);
  assert.equal((await reopened.getSubject(graph.subject.id)).title, "اسم يكتبه المستخدم بحرية");
});

test("repository filters semesters and subjects by stable parent IDs", async () => {
  const { repository } = repositoryFixture();
  const graph = await createGraph(repository);
  const otherYear = await repository.createAcademicYear({
    label: "سنة أخرى",
    startDate: "2027-09-01",
    endDate: "2028-06-30",
  });
  await repository.createSemester({
    academicYearId: otherYear.id,
    label: "فصل آخر",
    order: 1,
    startDate: "2027-09-01",
    endDate: "2028-01-31",
  });

  assert.deepEqual(
    (await repository.listSemesters({ academicYearId: graph.year.id })).map(({ id }) => id),
    [graph.semester.id],
  );
  assert.deepEqual(
    (await repository.listSubjects({ semesterId: graph.semester.id })).map(({ id }) => id),
    [graph.subject.id],
  );
  assert.deepEqual(
    (await repository.listSubjects({ academicYearId: otherYear.id })).map(({ id }) => id),
    [],
  );
});

test("repository rejects missing relationships", async () => {
  const { repository } = repositoryFixture();
  await assert.rejects(
    () => repository.createSemester({
      academicYearId: "academic-year_00000000-0000-4000-8000-000000000000",
      label: "فصل مفقود",
      order: 1,
      startDate: "2026-09-01",
      endDate: "2027-01-31",
    }),
    CoreRelationError,
  );
});

test("concurrent creates are serialized without lost updates", async () => {
  const { repository } = repositoryFixture();
  await Promise.all([
    repository.createAcademicYear({
      label: "السنة أ",
      startDate: "2026-09-01",
      endDate: "2027-06-30",
    }),
    repository.createAcademicYear({
      label: "السنة ب",
      startDate: "2027-09-01",
      endDate: "2028-06-30",
    }),
  ]);
  const labels = (await repository.listAcademicYears()).map(({ label }) => label);
  assert.deepEqual(labels, ["السنة أ", "السنة ب"]);
});

test("failed persistence keeps memory stable and requires recovery", async () => {
  const { driver, repository } = repositoryFixture();
  await repository.initialize();
  driver.failNextCommit = true;

  await assert.rejects(
    () => repository.createAcademicYear({
      label: "عملية معلقة",
      startDate: "2026-09-01",
      endDate: "2027-06-30",
    }),
    CorePersistenceError,
  );
  assert.deepEqual(await repository.listAcademicYears(), []);
  assert.equal(repository.state().needsRecovery, true);
  await assert.rejects(
    () => repository.createAcademicYear({
      label: "لا يجوز أن تستبدل الـJournal",
      startDate: "2027-09-01",
      endDate: "2028-06-30",
    }),
    AcademicRepositoryRecoveryRequiredError,
  );

  const recovery = await repository.recover();
  assert.equal(recovery.recovered, true);
  assert.equal((await repository.listAcademicYears())[0].label, "عملية معلقة");
  assert.equal(repository.state().needsRecovery, false);
});
