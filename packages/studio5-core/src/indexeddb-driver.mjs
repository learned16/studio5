import { CURRENT_SNAPSHOT_ID, PENDING_JOURNAL_ID } from "./local-database.mjs";

export const INDEXED_DB_VERSION = 1;
export const SNAPSHOT_STORE = "core-snapshots";
export const JOURNAL_STORE = "core-journal";

function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
  });
}

function transactionDone(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(
      transaction.error ?? new Error("IndexedDB transaction failed"),
    );
    transaction.onabort = () => reject(
      transaction.error ?? new Error("IndexedDB transaction aborted"),
    );
  });
}

export class IndexedDbCoreDriver {
  #factory;
  #databaseName;
  #database = null;
  #opening = null;

  constructor({
    indexedDB = globalThis.indexedDB,
    databaseName = "studio5-core",
  } = {}) {
    if (!indexedDB || typeof indexedDB.open !== "function") {
      throw new TypeError("IndexedDB is unavailable");
    }
    this.#factory = indexedDB;
    this.#databaseName = databaseName;
  }

  async #open() {
    if (this.#database) return this.#database;
    if (this.#opening) return this.#opening;
    this.#opening = new Promise((resolve, reject) => {
      const request = this.#factory.open(this.#databaseName, INDEXED_DB_VERSION);
      request.onupgradeneeded = () => {
        const next = request.result;
        if (!next.objectStoreNames.contains(SNAPSHOT_STORE)) {
          next.createObjectStore(SNAPSHOT_STORE, { keyPath: "id" });
        }
        if (!next.objectStoreNames.contains(JOURNAL_STORE)) {
          next.createObjectStore(JOURNAL_STORE, { keyPath: "id" });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error("IndexedDB open failed"));
      request.onblocked = () => reject(new Error("IndexedDB upgrade is blocked"));
    });
    let database;
    try {
      database = await this.#opening;
    } finally {
      this.#opening = null;
    }
    database.onversionchange = () => {
      database.close();
      if (this.#database === database) this.#database = null;
    };
    this.#database = database;
    return database;
  }

  async #read(storeName, key) {
    const database = await this.#open();
    const transaction = database.transaction(storeName, "readonly");
    const done = transactionDone(transaction);
    const result = await requestResult(transaction.objectStore(storeName).get(key));
    await done;
    return result ? structuredClone(result) : null;
  }

  async readSnapshot() {
    return this.#read(SNAPSHOT_STORE, CURRENT_SNAPSHOT_ID);
  }

  async readJournal() {
    return this.#read(JOURNAL_STORE, PENDING_JOURNAL_ID);
  }

  async writeJournal(journal) {
    const database = await this.#open();
    const transaction = database.transaction(JOURNAL_STORE, "readwrite");
    const done = transactionDone(transaction);
    transaction.objectStore(JOURNAL_STORE).put(structuredClone(journal));
    await done;
  }

  async commitSnapshotAndClearJournal(record) {
    const database = await this.#open();
    const transaction = database.transaction(
      [SNAPSHOT_STORE, JOURNAL_STORE],
      "readwrite",
    );
    const done = transactionDone(transaction);
    transaction.objectStore(SNAPSHOT_STORE).put(structuredClone(record));
    transaction.objectStore(JOURNAL_STORE).delete(PENDING_JOURNAL_ID);
    await done;
  }

  close() {
    this.#database?.close();
    this.#database = null;
  }
}
