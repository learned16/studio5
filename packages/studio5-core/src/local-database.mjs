import { createEmptySnapshot, migrateSnapshot } from "./schema.mjs";

export const CURRENT_SNAPSHOT_ID = "core-current";
export const PENDING_JOURNAL_ID = "core-pending";

function assertDriver(driver) {
  const methods = [
    "readSnapshot",
    "readJournal",
    "writeJournal",
    "commitSnapshotAndClearJournal",
  ];
  for (const method of methods) {
    if (typeof driver?.[method] !== "function") {
      throw new TypeError(`Core local database driver is missing ${method}()`);
    }
  }
}

export class CorePersistenceError extends Error {
  constructor(message, options = {}) {
    super(message, options);
    this.name = "CorePersistenceError";
    this.journalPreserved = Boolean(options.journalPreserved);
  }
}

export class CoreRecoveryError extends Error {
  constructor(message, options = {}) {
    super(message, options);
    this.name = "CoreRecoveryError";
    this.fallbackSnapshot = options.fallbackSnapshot
      ? structuredClone(options.fallbackSnapshot)
      : null;
    this.journalPreserved = true;
  }
}

export class CoreLocalDatabase {
  #driver;
  #now;
  #operationQueue = Promise.resolve();

  constructor(driver, { now = Date.now } = {}) {
    assertDriver(driver);
    if (typeof now !== "function") throw new TypeError("now must be a function");
    this.#driver = driver;
    this.#now = now;
  }

  #enqueue(operation) {
    const result = this.#operationQueue.then(operation, operation);
    this.#operationQueue = result.catch(() => undefined);
    return result;
  }

  load() {
    return this.#enqueue(() => this.#loadUnlocked());
  }

  async #loadUnlocked() {
    const [storedRecord, journal] = await Promise.all([
      this.#driver.readSnapshot(),
      this.#driver.readJournal(),
    ]);

    let storedSnapshot = null;
    if (storedRecord?.snapshot) {
      try {
        storedSnapshot = migrateSnapshot(storedRecord.snapshot, this.#now());
      } catch (error) {
        throw new CorePersistenceError("Stored core snapshot is unreadable", { cause: error });
      }
    }

    if (journal) {
      let recovered;
      try {
        recovered = migrateSnapshot(journal.snapshot, this.#now());
      } catch (error) {
        throw new CoreRecoveryError("Pending core journal is unreadable", {
          cause: error,
          fallbackSnapshot: storedSnapshot,
        });
      }

      const recoveredRecord = {
        id: CURRENT_SNAPSHOT_ID,
        savedAt: Number(journal.savedAt || this.#now()),
        snapshot: structuredClone(recovered),
      };
      try {
        await this.#driver.commitSnapshotAndClearJournal(recoveredRecord);
      } catch (error) {
        throw new CorePersistenceError("Recovered core data could not be committed", {
          cause: error,
          journalPreserved: true,
        });
      }
      return {
        snapshot: recovered,
        recovered: true,
        source: "journal",
      };
    }

    if (storedSnapshot) {
      return {
        snapshot: storedSnapshot,
        recovered: false,
        source: "snapshot",
      };
    }

    return {
      snapshot: createEmptySnapshot(this.#now()),
      recovered: false,
      source: "empty",
    };
  }

  save(snapshot) {
    return this.#enqueue(() => this.#saveUnlocked(snapshot));
  }

  async #saveUnlocked(snapshot) {
    const savedAt = this.#now();
    const normalized = migrateSnapshot(snapshot, savedAt);
    const journal = {
      id: PENDING_JOURNAL_ID,
      savedAt,
      snapshot: structuredClone(normalized),
    };
    try {
      await this.#driver.writeJournal(journal);
    } catch (error) {
      throw new CorePersistenceError("Core recovery journal could not be written", {
        cause: error,
        journalPreserved: false,
      });
    }

    const record = {
      id: CURRENT_SNAPSHOT_ID,
      savedAt,
      snapshot: structuredClone(normalized),
    };
    try {
      await this.#driver.commitSnapshotAndClearJournal(record);
    } catch (error) {
      throw new CorePersistenceError("Core snapshot commit failed; recovery journal was preserved", {
        cause: error,
        journalPreserved: true,
      });
    }

    return {
      snapshot: normalized,
      savedAt,
    };
  }
}
