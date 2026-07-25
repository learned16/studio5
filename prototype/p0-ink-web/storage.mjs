import { createDocument, mergePendingOperation, migrateDocument } from "./ink-core.mjs";

const DATABASE_NAME = "studio5-p0";
const STORE_NAME = "documents";
const FALLBACK_KEY = "studio5-p0-document";
const JOURNAL_KEY = "studio5-p0-journal";

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in globalThis)) {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB open failed"));
  });
}

async function readIndexedDocument() {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const request = transaction.objectStore(STORE_NAME).get("p0-current");
    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB read failed"));
    transaction.oncomplete = () => database.close();
  });
}

async function writeIndexedDocument(document) {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(document);
    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error ?? new Error("IndexedDB write failed"));
    };
    transaction.onabort = () => {
      database.close();
      reject(transaction.error ?? new Error("IndexedDB write aborted"));
    };
  });
}

function readJson(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function loadDocument() {
  let stored = null;
  let storageMode = "IndexedDB";
  try {
    stored = await readIndexedDocument();
  } catch {
    storageMode = "LocalStorage fallback";
    stored = readJson(FALLBACK_KEY);
  }
  const base = migrateDocument(stored ?? createDocument());
  const journal = readJson(JOURNAL_KEY);
  return {
    document: mergePendingOperation(base, journal),
    recovered: Boolean(journal),
    storageMode,
  };
}

export async function saveDocument(document) {
  const snapshot = structuredClone(document);
  localStorage.setItem(FALLBACK_KEY, JSON.stringify(snapshot));
  try {
    await writeIndexedDocument(snapshot);
    return "IndexedDB + LocalStorage";
  } catch {
    return "LocalStorage fallback";
  }
}

export function writeStrokeJournal(documentId, stroke) {
  const entry = {
    schemaVersion: 1,
    type: "stroke",
    documentId,
    savedAt: Date.now(),
    stroke: structuredClone(stroke),
  };
  localStorage.setItem(JOURNAL_KEY, JSON.stringify(entry));
}

export function writeDeleteJournal(documentId, strokeIds) {
  const entry = {
    schemaVersion: 1,
    type: "delete",
    documentId,
    savedAt: Date.now(),
    strokeIds: [...strokeIds],
  };
  localStorage.setItem(JOURNAL_KEY, JSON.stringify(entry));
}

export function clearJournal() {
  localStorage.removeItem(JOURNAL_KEY);
}
