import assert from "node:assert/strict";
import test from "node:test";
import { createAcademicYear } from "../src/model.mjs";
import {
  CoreLocalDatabase,
  CorePersistenceError,
  CoreRecoveryError,
} from "../src/local-database.mjs";
import { CoreStore } from "../src/store.mjs";
import { MemoryCoreDriver } from "./helpers/memory-driver.mjs";

function snapshotWithYear(now = 10) {
  const store = new CoreStore();
  store.add("academicYears", createAcademicYear({
    label: "سنة اختبار",
    startDate: "2026-09-01",
    endDate: "2027-06-30",
    now,
  }));
  return store.exportSnapshot(now);
}

test("first load returns a valid empty snapshot", async () => {
  const database = new CoreLocalDatabase(new MemoryCoreDriver(), { now: () => 10 });
  const loaded = await database.load();
  assert.equal(loaded.source, "empty");
  assert.equal(loaded.recovered, false);
  assert.deepEqual(loaded.snapshot.entities.academicYears, []);
});

test("save and load round-trip keeps the same core snapshot", async () => {
  const driver = new MemoryCoreDriver();
  const database = new CoreLocalDatabase(driver, { now: () => 10 });
  const source = snapshotWithYear(10);
  await database.save(source);
  const loaded = await database.load();
  assert.equal(loaded.source, "snapshot");
  assert.deepEqual(loaded.snapshot, source);
  assert.equal(driver.journal, null);
});

test("failed commit preserves the journal for the next launch", async () => {
  const driver = new MemoryCoreDriver();
  driver.failNextCommit = true;
  const database = new CoreLocalDatabase(driver, { now: () => 20 });
  await assert.rejects(
    () => database.save(snapshotWithYear(20)),
    (error) => error instanceof CorePersistenceError && error.journalPreserved,
  );
  assert.ok(driver.journal);
  assert.equal(driver.snapshot, null);
});

test("next launch restores and commits a valid pending journal", async () => {
  const driver = new MemoryCoreDriver();
  driver.failNextCommit = true;
  const first = new CoreLocalDatabase(driver, { now: () => 30 });
  const source = snapshotWithYear(30);
  await assert.rejects(() => first.save(source), CorePersistenceError);

  const reopened = new CoreLocalDatabase(driver, { now: () => 31 });
  const loaded = await reopened.load();
  assert.equal(loaded.recovered, true);
  assert.equal(loaded.source, "journal");
  assert.deepEqual(loaded.snapshot, source);
  assert.equal(driver.journal, null);
  assert.deepEqual(driver.snapshot.snapshot, source);
});

test("corrupt journal is preserved and exposes the last good snapshot", async () => {
  const driver = new MemoryCoreDriver();
  const database = new CoreLocalDatabase(driver, { now: () => 40 });
  const good = snapshotWithYear(40);
  await database.save(good);
  driver.journal = {
    id: "core-pending",
    savedAt: 41,
    snapshot: { schemaVersion: 99, entities: {} },
  };

  await assert.rejects(
    () => database.load(),
    (error) => {
      assert.ok(error instanceof CoreRecoveryError);
      assert.deepEqual(error.fallbackSnapshot, good);
      assert.equal(error.journalPreserved, true);
      return true;
    },
  );
  assert.ok(driver.journal);
  assert.deepEqual(driver.snapshot.snapshot, good);
});

test("version 0 snapshots migrate before being persisted", async () => {
  const driver = new MemoryCoreDriver();
  const database = new CoreLocalDatabase(driver, { now: () => 50 });
  await database.save({ academicYears: [], semesters: [] });
  assert.equal(driver.snapshot.snapshot.schemaVersion, 1);
  assert.deepEqual(driver.snapshot.snapshot.entities.subjects, []);
});

test("concurrent saves are serialized and keep the latest requested snapshot", async () => {
  const driver = new MemoryCoreDriver();
  let clock = 60;
  const database = new CoreLocalDatabase(driver, { now: () => clock++ });
  const first = snapshotWithYear(60);
  const second = snapshotWithYear(61);
  second.entities.academicYears[0].label = "النسخة الأحدث";
  await Promise.all([database.save(first), database.save(second)]);
  const loaded = await database.load();
  assert.equal(loaded.snapshot.entities.academicYears[0].label, "النسخة الأحدث");
  assert.equal(driver.journal, null);
});
