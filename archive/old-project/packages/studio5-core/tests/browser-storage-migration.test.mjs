import assert from "node:assert/strict";
import test from "node:test";
import { AcademicRepository } from "../src/academic-repository.mjs";
import {
  BrowserStorageMigrationConflictError,
  migrateRepositoryStorage,
} from "../src/browser-storage-migration.mjs";
import {
  CANONICAL_BROWSER_STORAGE_PROFILE,
  LEGACY_BROWSER_STORAGE_PROFILES,
} from "../src/browser-storage-profile.mjs";
import { CoreLocalDatabase } from "../src/local-database.mjs";
import { MemoryCoreDriver } from "./helpers/memory-driver.mjs";
import { MemoryFileContentStore } from "./helpers/memory-file-content-store.mjs";

function memoryContext({
  driver = new MemoryCoreDriver(),
  contentStore = new MemoryFileContentStore(),
  nowStart = 10_000,
} = {}) {
  let clock = nowStart;
  const now = () => clock++;
  const database = new CoreLocalDatabase(driver, { now });
  const repository = new AcademicRepository(database, {
    fileContentStore: contentStore,
    now,
  });
  return { contentStore, database, driver, repository };
}

async function addYear(repository, label) {
  return repository.createAcademicYear({
    label,
    startDate: "2026-09-01",
    endDate: "2027-06-30",
  });
}

function migrate(source, target) {
  return migrateRepositoryStorage({
    sourceProfile: LEGACY_BROWSER_STORAGE_PROFILES[0],
    sourceRepository: source.repository,
    targetProfile: CANONICAL_BROWSER_STORAGE_PROFILE,
    targetRepository: target.repository,
    targetDatabase: target.database,
    targetContentStore: target.contentStore,
  });
}

test("empty legacy storage leaves canonical storage unchanged", async () => {
  const source = memoryContext();
  const target = memoryContext();

  const result = await migrate(source, target);

  assert.equal(result.status, "no-source-data");
  assert.deepEqual(await target.repository.listAcademicYears(), []);
});

test("legacy storage migrates to an empty canonical profile without deleting source", async () => {
  const source = memoryContext();
  const target = memoryContext();
  const year = await addYear(source.repository, "Legacy year");

  const result = await migrate(source, target);
  const reopenedTarget = memoryContext({
    driver: target.driver,
    contentStore: target.contentStore,
  });

  assert.equal(result.status, "migrated");
  assert.equal((await reopenedTarget.repository.listAcademicYears())[0].id, year.id);
  assert.equal((await source.repository.listAcademicYears())[0].id, year.id);
});

test("repeating a completed migration is idempotent", async () => {
  const source = memoryContext();
  const target = memoryContext();
  await addYear(source.repository, "Legacy year");
  await migrate(source, target);

  const reopenedTarget = memoryContext({
    driver: target.driver,
    contentStore: target.contentStore,
  });
  const second = await migrate(source, reopenedTarget);

  assert.equal(second.status, "already-migrated");
  assert.equal((await reopenedTarget.repository.listAcademicYears()).length, 1);
});

test("different non-empty canonical data causes a conflict without replacement", async () => {
  const source = memoryContext();
  const target = memoryContext();
  await addYear(source.repository, "Legacy year");
  const canonicalYear = await addYear(target.repository, "Canonical year");

  await assert.rejects(
    migrate(source, target),
    BrowserStorageMigrationConflictError,
  );

  const years = await target.repository.listAcademicYears();
  assert.equal(years.length, 1);
  assert.equal(years[0].id, canonicalYear.id);
});
