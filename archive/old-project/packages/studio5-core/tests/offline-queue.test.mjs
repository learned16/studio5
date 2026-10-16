import assert from "node:assert/strict";
import test from "node:test";
import {
  AcademicRepository,
  AcademicRepositoryRecoveryRequiredError,
} from "../src/academic-repository.mjs";
import { CoreLocalDatabase } from "../src/local-database.mjs";
import { createEmptySnapshot, migrateSnapshot } from "../src/schema.mjs";
import { MemoryCoreDriver } from "./helpers/memory-driver.mjs";

function fixture(nowStart = Date.parse("2026-09-01T08:00:00Z")) {
  let clock = nowStart;
  const driver = new MemoryCoreDriver();
  const database = new CoreLocalDatabase(driver, { now: () => clock++ });
  const repository = new AcademicRepository(database, { now: () => clock++ });
  return {
    database,
    driver,
    repository,
    now: () => clock,
    tick(milliseconds = 1_000) {
      clock += milliseconds;
    },
  };
}

function operationInput(suffix = "1", overrides = {}) {
  return {
    idempotencyKey: `task.sync:${suffix}`,
    operationType: "entity.upsert",
    entityKind: "task",
    entityId: `task_${suffix.repeat(8)}-${suffix.repeat(4)}-4${suffix.repeat(3)}-8${suffix.repeat(3)}-${suffix.repeat(12)}`,
    payload: { revision: Number(suffix) },
    ...overrides,
  };
}

test("schema v6 migrates to current without losing resource markers", () => {
  const v6 = createEmptySnapshot(1);
  v6.schemaVersion = 6;
  delete v6.entities.offlineOperations;
  v6.entities.resourceMarkers.push({
    kind: "resource-marker",
    id: "resource-marker_11111111-1111-4111-8111-111111111111",
    targetKind: "subject",
    targetId: "subject_22222222-2222-4222-8222-222222222222",
    isFavorite: true,
    favoriteAt: "2026-01-01T00:00:00.000Z",
    lastOpenedAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  });

  const migrated = migrateSnapshot(v6, 2);
  assert.equal(migrated.schemaVersion, 8);
  assert.equal(migrated.entities.resourceMarkers.length, 1);
  assert.deepEqual(migrated.entities.offlineOperations, []);
});

test("enqueue is idempotent and persists metadata without file bytes", async () => {
  const { database, repository } = fixture();
  const first = await repository.enqueueOfflineOperation(operationInput("1"));
  const second = await repository.enqueueOfflineOperation(operationInput("1", {
    payload: { revision: 999 },
  }));

  assert.equal(first.status, "created");
  assert.equal(second.status, "existing");
  assert.equal(first.operation.id, second.operation.id);
  assert.deepEqual(second.operation.payload, { revision: 1 });

  const reopened = new AcademicRepository(database);
  assert.equal((await reopened.listOfflineOperations()).length, 1);
});

test("claim is deterministic and ignores operations before availableAt", async () => {
  const state = fixture();
  const future = new Date(state.now() + 60_000).toISOString();
  const later = await state.repository.enqueueOfflineOperation(operationInput("2", {
    availableAt: future,
  }));
  const first = await state.repository.enqueueOfflineOperation(operationInput("1"));

  const claimed = await state.repository.claimNextOfflineOperation();
  assert.equal(claimed.id, first.operation.id);
  assert.equal(claimed.status, "processing");
  assert.equal(claimed.attempts, 1);
  assert.equal((await state.repository.claimNextOfflineOperation()), null);

  state.tick(61_000);
  const delayed = await state.repository.claimNextOfflineOperation();
  assert.equal(delayed.id, later.operation.id);
});

test("success, failure, conflict, and retry transitions are explicit", async () => {
  const { repository } = fixture();
  const first = await repository.enqueueOfflineOperation(operationInput("1"));
  await repository.claimNextOfflineOperation();
  const succeeded = await repository.succeedOfflineOperation(first.operation.id);
  assert.equal(succeeded.status, "succeeded");
  await assert.rejects(
    repository.retryOfflineOperation(succeeded.id),
    /requires status failed or conflict/,
  );

  const second = await repository.enqueueOfflineOperation(operationInput("2"));
  await repository.claimNextOfflineOperation();
  const failed = await repository.failOfflineOperation(second.operation.id, {
    errorCode: "NETWORK_TIMEOUT",
    errorMessage: "انقطع الاتصال",
  });
  assert.equal(failed.status, "failed");
  const retried = await repository.retryOfflineOperation(failed.id);
  assert.equal(retried.status, "pending");
  const claimedAgain = await repository.claimNextOfflineOperation();
  const conflict = await repository.conflictOfflineOperation(claimedAgain.id, {
    errorMessage: "نسخة بعيدة أحدث",
  });
  assert.equal(conflict.status, "conflict");
  assert.equal(conflict.attempts, 2);
});

test("interrupted processing operations recover to pending without deletion", async () => {
  const { database, repository } = fixture();
  const queued = await repository.enqueueOfflineOperation(operationInput("1"));
  await repository.claimNextOfflineOperation();

  const reopened = new AcademicRepository(database);
  const recovered = await reopened.recoverInterruptedOfflineOperations();
  assert.equal(recovered.length, 1);
  assert.equal(recovered[0].id, queued.operation.id);
  assert.equal(recovered[0].status, "pending");
  assert.equal(recovered[0].errorCode, "INTERRUPTED");
});

test("failed persistence keeps the journal and requires recovery", async () => {
  const state = fixture();
  state.driver.failNextCommit = true;
  await assert.rejects(
    state.repository.enqueueOfflineOperation(operationInput("1")),
    /Core snapshot commit failed/,
  );
  assert.ok(state.driver.journal);
  await assert.rejects(
    state.repository.enqueueOfflineOperation(operationInput("2")),
    AcademicRepositoryRecoveryRequiredError,
  );

  await state.repository.recover();
  const operations = await state.repository.listOfflineOperations();
  assert.equal(operations.length, 1);
  assert.equal(operations[0].idempotencyKey, "task.sync:1");
});

test("queue validates IDs, payloads, and legal transitions", async () => {
  const { repository } = fixture();
  await assert.rejects(
    repository.enqueueOfflineOperation(operationInput("1", { payload: [] })),
    /payload must be an object/,
  );
  await assert.rejects(
    repository.enqueueOfflineOperation(operationInput("1", {
      entityKind: "subject",
    })),
    /Invalid stable ID for subject/,
  );
  const queued = await repository.enqueueOfflineOperation(operationInput("1"));
  await assert.rejects(
    repository.succeedOfflineOperation(queued.operation.id),
    /requires status processing/,
  );
});
