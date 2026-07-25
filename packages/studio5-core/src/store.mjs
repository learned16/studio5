import { assertStableId } from "./ids.mjs";
import { COLLECTIONS, createEmptySnapshot, migrateSnapshot } from "./schema.mjs";

const COLLECTION_KIND = Object.freeze({
  academicYears: "academic-year",
  semesters: "semester",
  capabilityPacks: "capability-pack",
  subjectProfiles: "subject-profile",
  subjects: "subject",
});

function clone(value) {
  return structuredClone(value);
}

export class CoreRelationError extends Error {
  constructor(message) {
    super(message);
    this.name = "CoreRelationError";
  }
}

export class CoreStore {
  #records = new Map();

  constructor(snapshot = createEmptySnapshot()) {
    const migrated = migrateSnapshot(snapshot);
    for (const collection of COLLECTIONS) {
      this.#records.set(collection, new Map());
    }
    for (const collection of COLLECTIONS) {
      for (const entity of migrated.entities[collection]) {
        this.add(collection, entity);
      }
    }
  }

  #collection(name) {
    const records = this.#records.get(name);
    if (!records) throw new TypeError(`Unknown core collection: ${name}`);
    return records;
  }

  #has(collection, id) {
    return this.#collection(collection).has(id);
  }

  #assertExists(collection, id, relation) {
    if (!this.#has(collection, id)) {
      throw new CoreRelationError(`${relation} references missing ${collection} entity: ${id}`);
    }
  }

  #validateRelations(collection, entity) {
    if (collection === "semesters") {
      this.#assertExists("academicYears", entity.academicYearId, "semester.academicYearId");
    }
    if (collection === "subjectProfiles") {
      for (const id of entity.capabilityPackIds ?? []) {
        this.#assertExists("capabilityPacks", id, "subjectProfile.capabilityPackIds");
      }
    }
    if (collection === "subjects") {
      this.#assertExists("semesters", entity.semesterId, "subject.semesterId");
      this.#assertExists("subjectProfiles", entity.subjectProfileId, "subject.subjectProfileId");
      for (const id of entity.capabilityPackIds ?? []) {
        this.#assertExists("capabilityPacks", id, "subject.capabilityPackIds");
      }
    }
  }

  add(collection, entity) {
    if (!entity || typeof entity !== "object") {
      throw new TypeError("Core entity must be an object");
    }
    const expectedKind = COLLECTION_KIND[collection];
    const records = this.#collection(collection);
    assertStableId(entity.id, expectedKind);
    if (entity.kind !== expectedKind) {
      throw new TypeError(`Expected ${expectedKind} entity in ${collection}`);
    }
    for (const existing of this.#records.values()) {
      if (existing.has(entity.id)) {
        throw new CoreRelationError(`Duplicate core entity ID: ${entity.id}`);
      }
    }
    this.#validateRelations(collection, entity);
    records.set(entity.id, clone(entity));
    return clone(entity);
  }

  get(collection, id) {
    const value = this.#collection(collection).get(id);
    return value ? clone(value) : null;
  }

  list(collection) {
    return [...this.#collection(collection).values()].map(clone);
  }

  exportSnapshot(now = Date.now()) {
    const snapshot = createEmptySnapshot(now);
    for (const collection of COLLECTIONS) {
      snapshot.entities[collection] = this.list(collection);
    }
    return snapshot;
  }
}
