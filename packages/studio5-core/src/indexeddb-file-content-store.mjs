export const FILE_CONTENT_DB_VERSION = 1;
export const FILE_CONTENT_STORE = "file-content";

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

function addIfAbsent(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(true);
    request.onerror = (event) => {
      if (request.error?.name === "ConstraintError") {
        event.preventDefault();
        event.stopPropagation();
        resolve(false);
        return;
      }
      reject(request.error ?? new Error("IndexedDB add failed"));
    };
  });
}

function normalizedStorageKey(value) {
  const key = String(value ?? "").trim().toLowerCase();
  if (!/^sha256\/[0-9a-f]{64}$/.test(key)) {
    throw new TypeError("File storage key must use sha256/<64 hex characters>");
  }
  return key;
}

function copiedBytes(value) {
  if (value instanceof ArrayBuffer) return new Uint8Array(value.slice(0));
  if (ArrayBuffer.isView(value)) {
    return new Uint8Array(
      value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength),
    );
  }
  throw new TypeError("File content bytes must be an ArrayBuffer or typed array");
}

export class IndexedDbFileContentStore {
  #factory;
  #databaseName;
  #database = null;
  #opening = null;

  constructor({
    indexedDB = globalThis.indexedDB,
    databaseName = "studio5-file-content",
  } = {}) {
    if (!indexedDB || typeof indexedDB.open !== "function") {
      throw new TypeError("IndexedDB is unavailable");
    }
    this.#factory = indexedDB;
    this.#databaseName = String(databaseName);
  }

  async #open() {
    if (this.#database) return this.#database;
    if (this.#opening) return this.#opening;
    this.#opening = new Promise((resolve, reject) => {
      const request = this.#factory.open(this.#databaseName, FILE_CONTENT_DB_VERSION);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(FILE_CONTENT_STORE)) {
          database.createObjectStore(FILE_CONTENT_STORE, { keyPath: "key" });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error("IndexedDB open failed"));
      request.onblocked = () => reject(new Error("IndexedDB file content upgrade is blocked"));
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

  async putIfAbsent(key, bytes, {
    mediaType = "application/octet-stream",
    now = Date.now(),
  } = {}) {
    const normalizedKey = normalizedStorageKey(key);
    const content = copiedBytes(bytes);
    const database = await this.#open();
    const transaction = database.transaction(FILE_CONTENT_STORE, "readwrite");
    const done = transactionDone(transaction);
    const store = transaction.objectStore(FILE_CONTENT_STORE);
    const record = {
      key: normalizedKey,
      bytes: content,
      byteSize: content.byteLength,
      mediaType: String(mediaType).trim().toLowerCase() || "application/octet-stream",
      createdAt: new Date(now).toISOString(),
    };
    const created = await addIfAbsent(store.add(structuredClone(record)));
    await done;
    if (created) return { created: true, record: structuredClone(record) };
    return { created: false, record: await this.get(normalizedKey) };
  }

  async get(key) {
    const normalizedKey = normalizedStorageKey(key);
    const database = await this.#open();
    const transaction = database.transaction(FILE_CONTENT_STORE, "readonly");
    const done = transactionDone(transaction);
    const result = await requestResult(
      transaction.objectStore(FILE_CONTENT_STORE).get(normalizedKey),
    );
    await done;
    return result ? structuredClone(result) : null;
  }

  close() {
    this.#database?.close();
    this.#database = null;
  }
}
