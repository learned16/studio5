export const CORE_SCHEMA_VERSION = 5;

const COLLECTIONS_V1 = Object.freeze([
  "academicYears",
  "semesters",
  "capabilityPacks",
  "subjectProfiles",
  "subjects",
]);

const COLLECTIONS_V2 = Object.freeze([
  ...COLLECTIONS_V1,
  "scheduleEntries",
  "lectures",
  "tasks",
]);

const COLLECTIONS_V3 = Object.freeze([
  ...COLLECTIONS_V2,
  "fileArtifacts",
  "fileHashes",
  "fileVersions",
  "artifactLinks",
]);

const COLLECTIONS_V4 = Object.freeze([
  ...COLLECTIONS_V3,
  "notebooks",
  "inkDocuments",
  "inkRevisions",
]);

export const COLLECTIONS = Object.freeze([
  ...COLLECTIONS_V4,
  "lectureCaptures",
  "lectureCloseouts",
  "captureResolutions",
]);

function emptyEntities(collections = COLLECTIONS) {
  return Object.fromEntries(collections.map((collection) => [collection, []]));
}

export function createEmptySnapshot(now = Date.now()) {
  return {
    schemaVersion: CORE_SCHEMA_VERSION,
    exportedAt: new Date(now).toISOString(),
    entities: emptyEntities(),
  };
}

function migrateVersion0(input, now) {
  const entities = emptyEntities(COLLECTIONS_V1);
  const source = input?.entities && typeof input.entities === "object"
    ? input.entities
    : input;
  for (const collection of COLLECTIONS_V1) {
    entities[collection] = Array.isArray(source?.[collection])
      ? structuredClone(source[collection])
      : [];
  }
  return {
    schemaVersion: 1,
    exportedAt: input?.exportedAt ?? new Date(now).toISOString(),
    entities,
  };
}

function migrateVersion1(input, now) {
  const entities = emptyEntities(COLLECTIONS_V2);
  for (const collection of COLLECTIONS_V1) {
    entities[collection] = Array.isArray(input?.entities?.[collection])
      ? structuredClone(input.entities[collection])
      : [];
  }
  return {
    schemaVersion: 2,
    exportedAt: input?.exportedAt ?? new Date(now).toISOString(),
    entities,
  };
}

function migrateVersion2(input, now) {
  const entities = emptyEntities(COLLECTIONS_V3);
  for (const collection of COLLECTIONS_V2) {
    entities[collection] = Array.isArray(input?.entities?.[collection])
      ? structuredClone(input.entities[collection])
      : [];
  }
  return {
    schemaVersion: 3,
    exportedAt: input?.exportedAt ?? new Date(now).toISOString(),
    entities,
  };
}

function migrateVersion3(input, now) {
  const entities = emptyEntities(COLLECTIONS_V4);
  for (const collection of COLLECTIONS_V3) {
    entities[collection] = Array.isArray(input?.entities?.[collection])
      ? structuredClone(input.entities[collection])
      : [];
  }
  return {
    schemaVersion: 4,
    exportedAt: input?.exportedAt ?? new Date(now).toISOString(),
    entities,
  };
}

function migrateVersion4(input, now) {
  const entities = emptyEntities();
  for (const collection of COLLECTIONS_V4) {
    entities[collection] = Array.isArray(input?.entities?.[collection])
      ? structuredClone(input.entities[collection])
      : [];
  }
  return {
    schemaVersion: 5,
    exportedAt: input?.exportedAt ?? new Date(now).toISOString(),
    entities,
  };
}

const MIGRATIONS = new Map([
  [0, migrateVersion0],
  [1, migrateVersion1],
  [2, migrateVersion2],
  [3, migrateVersion3],
  [4, migrateVersion4],
]);

export class CoreMigrationError extends Error {
  constructor(message, options = {}) {
    super(message, options);
    this.name = "CoreMigrationError";
  }
}

export function validateSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== "object") {
    throw new CoreMigrationError("Core snapshot must be an object");
  }
  if (snapshot.schemaVersion !== CORE_SCHEMA_VERSION) {
    throw new CoreMigrationError(
      `Expected core schema ${CORE_SCHEMA_VERSION}, received ${snapshot.schemaVersion}`,
    );
  }
  if (!snapshot.entities || typeof snapshot.entities !== "object") {
    throw new CoreMigrationError("Core snapshot entities are missing");
  }
  for (const collection of COLLECTIONS) {
    if (!Array.isArray(snapshot.entities[collection])) {
      throw new CoreMigrationError(`Core collection ${collection} must be an array`);
    }
  }
  return snapshot;
}

export function migrateSnapshot(input, now = Date.now()) {
  if (!input || typeof input !== "object") return createEmptySnapshot(now);
  let current = structuredClone(input);
  let version = Number.isInteger(current.schemaVersion) ? current.schemaVersion : 0;
  if (version > CORE_SCHEMA_VERSION) {
    throw new CoreMigrationError(
      `Core schema ${version} is newer than supported schema ${CORE_SCHEMA_VERSION}`,
    );
  }
  while (version < CORE_SCHEMA_VERSION) {
    const migration = MIGRATIONS.get(version);
    if (!migration) {
      throw new CoreMigrationError(`No migration registered from core schema ${version}`);
    }
    current = migration(current, now);
    version = current.schemaVersion;
  }
  return validateSnapshot(current);
}
