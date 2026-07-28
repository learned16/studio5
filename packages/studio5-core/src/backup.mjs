import { sha256Hex } from "./file-intake.mjs";
import { COLLECTIONS, migrateSnapshot } from "./schema.mjs";
import { CoreStore } from "./store.mjs";

export const PORTABLE_BACKUP_FORMAT = "studio5-portable-backup";
export const PORTABLE_BACKUP_VERSION = 1;

export class BackupValidationError extends Error {
  constructor(message, options = {}) {
    super(message, options);
    this.name = "BackupValidationError";
  }
}

export class BackupRestoreConflictError extends Error {
  constructor(message) {
    super(message);
    this.name = "BackupRestoreConflictError";
  }
}

function assertContentStore(contentStore) {
  for (const method of ["putIfAbsent", "get"]) {
    if (typeof contentStore?.[method] !== "function") {
      throw new TypeError(`Backup content store is missing ${method}()`);
    }
  }
  return contentStore;
}

function assertDatabase(database) {
  for (const method of ["load", "save"]) {
    if (typeof database?.[method] !== "function") {
      throw new TypeError(`Backup database is missing ${method}()`);
    }
  }
  return database;
}

function copiedBytes(value) {
  if (value instanceof ArrayBuffer) return new Uint8Array(value.slice(0));
  if (ArrayBuffer.isView(value)) {
    return new Uint8Array(
      value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength),
    );
  }
  throw new BackupValidationError("Backup content bytes are invalid");
}

function encodeBase64(bytes) {
  const content = copiedBytes(bytes);
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < content.length; offset += chunkSize) {
    binary += String.fromCharCode(...content.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

function decodeBase64(value) {
  if (typeof value !== "string") {
    throw new BackupValidationError("Backup content data must be Base64 text");
  }
  let binary;
  try {
    binary = atob(value);
  } catch (error) {
    throw new BackupValidationError("Backup content data is not valid Base64", {
      cause: error,
    });
  }
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  if (encodeBase64(bytes) !== value) {
    throw new BackupValidationError("Backup content Base64 is not canonical");
  }
  return bytes;
}

function canonicalValue(value) {
  if (Array.isArray(value)) return value.map(canonicalValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalValue(value[key])]),
    );
  }
  return value;
}

function canonicalBytes(value) {
  return new TextEncoder().encode(JSON.stringify(canonicalValue(value)));
}

function validInstant(value, field) {
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
    throw new BackupValidationError(`${field} must be a valid ISO date-time`);
  }
  return value;
}

function entityCounts(snapshot) {
  return Object.fromEntries(
    COLLECTIONS.map((collection) => [
      collection,
      snapshot.entities[collection].length,
    ]),
  );
}

function compareEntityCounts(actual, expected) {
  if (!expected || typeof expected !== "object" || Array.isArray(expected)) {
    throw new BackupValidationError("Backup manifest entityCounts are missing");
  }
  for (const collection of COLLECTIONS) {
    if (!Number.isInteger(expected[collection])
      || expected[collection] < 0
      || expected[collection] !== actual[collection]) {
      throw new BackupValidationError(
        `Backup manifest count mismatch for ${collection}`,
      );
    }
  }
  if (Object.keys(expected).some((collection) => !COLLECTIONS.includes(collection))) {
    throw new BackupValidationError("Backup manifest contains an unknown collection");
  }
}

function referencedContent(snapshot) {
  const hashes = new Map(
    snapshot.entities.fileHashes.map((hash) => [hash.id, hash]),
  );
  const references = [
    ...snapshot.entities.fileVersions.map((version) => ({
      storageKey: version.storageKey,
      fileHashId: version.fileHashId,
      byteSize: version.byteSize,
      mediaType: version.mediaType,
      sourceId: version.id,
    })),
    ...snapshot.entities.inkRevisions.map((revision) => ({
      storageKey: revision.storageKey,
      fileHashId: revision.fileHashId,
      byteSize: revision.byteSize,
      mediaType: "application/vnd.studio5.ink+json",
      sourceId: revision.id,
    })),
  ];
  const byStorageKey = new Map();

  for (const reference of references) {
    const hash = hashes.get(reference.fileHashId);
    if (!hash) {
      throw new BackupValidationError(
        `Backup reference ${reference.sourceId} has no FileHash`,
      );
    }
    const expectedKey = `${hash.algorithm.replace("-", "")}/${hash.digest}`;
    if (reference.storageKey !== expectedKey) {
      throw new BackupValidationError(
        `Backup reference ${reference.sourceId} has an invalid storage key`,
      );
    }
    const existing = byStorageKey.get(reference.storageKey);
    if (existing
      && (existing.digest !== hash.digest || existing.byteSize !== reference.byteSize)) {
      throw new BackupValidationError(
        `Backup storage key ${reference.storageKey} has conflicting references`,
      );
    }
    byStorageKey.set(reference.storageKey, {
      storageKey: reference.storageKey,
      digest: hash.digest,
      byteSize: reference.byteSize,
      mediaType: existing?.mediaType ?? reference.mediaType,
    });
  }

  return [...byStorageKey.values()]
    .sort((left, right) => left.storageKey.localeCompare(right.storageKey));
}

function normalizeSnapshot(snapshot) {
  let migrated;
  try {
    migrated = migrateSnapshot(snapshot);
    new CoreStore(migrated);
  } catch (error) {
    throw new BackupValidationError("Backup core snapshot is invalid", {
      cause: error,
    });
  }
  return migrated;
}

function assertBundleShape(bundle) {
  if (!bundle || typeof bundle !== "object" || Array.isArray(bundle)) {
    throw new BackupValidationError("Backup bundle must be an object");
  }
  if (bundle.format !== PORTABLE_BACKUP_FORMAT) {
    throw new BackupValidationError("Unsupported backup format");
  }
  if (bundle.formatVersion !== PORTABLE_BACKUP_VERSION) {
    throw new BackupValidationError(
      `Unsupported backup format version: ${bundle.formatVersion}`,
    );
  }
  if (!bundle.manifest || typeof bundle.manifest !== "object") {
    throw new BackupValidationError("Backup manifest is missing");
  }
  if (!Array.isArray(bundle.contents)) {
    throw new BackupValidationError("Backup contents must be an array");
  }
}

export async function createPortableBackup({
  snapshot,
  contentStore,
  now = Date.now(),
}) {
  assertContentStore(contentStore);
  const normalized = normalizeSnapshot(snapshot);
  const references = referencedContent(normalized);
  const contents = [];

  for (const reference of references) {
    const stored = await contentStore.get(reference.storageKey);
    if (!stored) {
      throw new BackupValidationError(
        `Backup content is missing: ${reference.storageKey}`,
      );
    }
    const bytes = copiedBytes(stored.bytes);
    const digest = await sha256Hex(bytes);
    if (bytes.byteLength !== reference.byteSize || digest !== reference.digest) {
      throw new BackupValidationError(
        `Backup content is damaged: ${reference.storageKey}`,
      );
    }
    contents.push({
      storageKey: reference.storageKey,
      digest,
      byteSize: bytes.byteLength,
      mediaType: String(stored.mediaType || reference.mediaType),
      data: encodeBase64(bytes),
    });
  }

  const createdAt = new Date(now).toISOString();
  const snapshotSha256 = await sha256Hex(canonicalBytes(normalized));
  const manifest = {
    createdAt,
    coreSchemaVersion: normalized.schemaVersion,
    snapshotSha256,
    entityCounts: entityCounts(normalized),
    contentCount: contents.length,
    contentBytes: contents.reduce((total, content) => total + content.byteSize, 0),
  };
  return structuredClone({
    format: PORTABLE_BACKUP_FORMAT,
    formatVersion: PORTABLE_BACKUP_VERSION,
    manifest,
    snapshot: normalized,
    contents,
  });
}

export async function verifyPortableBackup(bundle) {
  assertBundleShape(bundle);
  validInstant(bundle.manifest.createdAt, "manifest.createdAt");
  const normalized = normalizeSnapshot(bundle.snapshot);
  if (bundle.manifest.coreSchemaVersion !== bundle.snapshot?.schemaVersion) {
    throw new BackupValidationError("Backup manifest schema version mismatch");
  }
  const snapshotSha256 = await sha256Hex(canonicalBytes(normalized));
  if (bundle.manifest.snapshotSha256 !== snapshotSha256) {
    throw new BackupValidationError("Backup snapshot digest mismatch");
  }
  compareEntityCounts(entityCounts(normalized), bundle.manifest.entityCounts);

  const references = referencedContent(normalized);
  const entries = new Map();
  let totalBytes = 0;
  for (const entry of bundle.contents) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      throw new BackupValidationError("Backup content entry is invalid");
    }
    if (entries.has(entry.storageKey)) {
      throw new BackupValidationError(`Duplicate backup content: ${entry.storageKey}`);
    }
    const bytes = decodeBase64(entry.data);
    const digest = await sha256Hex(bytes);
    if (entry.storageKey !== `sha256/${digest}`
      || entry.digest !== digest
      || entry.byteSize !== bytes.byteLength) {
      throw new BackupValidationError(
        `Backup content integrity failed: ${entry.storageKey}`,
      );
    }
    const normalizedEntry = {
      storageKey: entry.storageKey,
      digest,
      byteSize: bytes.byteLength,
      mediaType: String(entry.mediaType || "application/octet-stream"),
      bytes,
    };
    entries.set(entry.storageKey, normalizedEntry);
    totalBytes += bytes.byteLength;
  }

  if (bundle.manifest.contentCount !== entries.size
    || bundle.manifest.contentBytes !== totalBytes) {
    throw new BackupValidationError("Backup manifest content totals mismatch");
  }
  if (references.length !== entries.size) {
    throw new BackupValidationError("Backup content set does not match snapshot references");
  }
  for (const reference of references) {
    const entry = entries.get(reference.storageKey);
    if (!entry
      || entry.digest !== reference.digest
      || entry.byteSize !== reference.byteSize) {
      throw new BackupValidationError(
        `Backup is missing referenced content: ${reference.storageKey}`,
      );
    }
  }

  return {
    manifest: structuredClone(bundle.manifest),
    snapshot: structuredClone(normalized),
    contents: [...entries.values()].map((entry) => ({
      ...entry,
      bytes: copiedBytes(entry.bytes),
    })),
  };
}

function isEmptySnapshot(snapshot) {
  return COLLECTIONS.every((collection) => snapshot.entities[collection].length === 0);
}

export async function restorePortableBackup({
  bundle,
  database,
  contentStore,
  allowReplace = false,
}) {
  assertDatabase(database);
  assertContentStore(contentStore);
  const verified = await verifyPortableBackup(bundle);
  const current = await database.load();
  const replacingExisting = !isEmptySnapshot(normalizeSnapshot(current.snapshot));
  if (replacingExisting && allowReplace !== true) {
    throw new BackupRestoreConflictError(
      "Restore would replace existing Studio5 data; explicit approval is required",
    );
  }

  for (const content of verified.contents) {
    await contentStore.putIfAbsent(
      content.storageKey,
      content.bytes,
      { mediaType: content.mediaType },
    );
    const stored = await contentStore.get(content.storageKey);
    const bytes = copiedBytes(stored?.bytes);
    const digest = await sha256Hex(bytes);
    if (bytes.byteLength !== content.byteSize || digest !== content.digest) {
      throw new BackupValidationError(
        `Restored content verification failed: ${content.storageKey}`,
      );
    }
  }

  await database.save(verified.snapshot);
  return {
    restored: true,
    replacedExisting: replacingExisting,
    manifest: structuredClone(verified.manifest),
  };
}
