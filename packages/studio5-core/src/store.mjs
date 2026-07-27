import { assertStableId } from "./ids.mjs";
import { COLLECTIONS, createEmptySnapshot, migrateSnapshot } from "./schema.mjs";

const COLLECTION_KIND = Object.freeze({
  academicYears: "academic-year",
  semesters: "semester",
  capabilityPacks: "capability-pack",
  subjectProfiles: "subject-profile",
  subjects: "subject",
  scheduleEntries: "schedule-entry",
  lectures: "lecture",
  tasks: "task",
  fileArtifacts: "file-artifact",
  fileHashes: "file-hash",
  fileVersions: "file-version",
  artifactLinks: "artifact-link",
  notebooks: "notebook",
  inkDocuments: "ink-document",
  inkRevisions: "ink-revision",
  lectureCaptures: "lecture-capture",
  lectureCloseouts: "lecture-closeout",
  captureResolutions: "capture-resolution",
  resourceMarkers: "resource-marker",
  offlineOperations: "offline-operation",
});

const IMMUTABLE_COLLECTIONS = new Set([
  "fileArtifacts",
  "fileHashes",
  "fileVersions",
  "artifactLinks",
  "inkRevisions",
  "lectureCaptures",
  "captureResolutions",
]);

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
    if (collection === "scheduleEntries") {
      this.#assertExists("subjects", entity.subjectId, "scheduleEntry.subjectId");
    }
    if (collection === "lectures") {
      this.#assertExists("subjects", entity.subjectId, "lecture.subjectId");
      if (entity.scheduleEntryId) {
        this.#assertExists(
          "scheduleEntries",
          entity.scheduleEntryId,
          "lecture.scheduleEntryId",
        );
        const scheduleEntry = this.get("scheduleEntries", entity.scheduleEntryId);
        if (scheduleEntry.subjectId !== entity.subjectId) {
          throw new CoreRelationError(
            "lecture.scheduleEntryId must belong to lecture.subjectId",
          );
        }
      }
    }
    if (collection === "tasks") {
      if (entity.subjectId) {
        this.#assertExists("subjects", entity.subjectId, "task.subjectId");
      }
      if (entity.lectureId) {
        this.#assertExists("lectures", entity.lectureId, "task.lectureId");
        const lecture = this.get("lectures", entity.lectureId);
        if (!entity.subjectId || lecture.subjectId !== entity.subjectId) {
          throw new CoreRelationError("task.lectureId must belong to task.subjectId");
        }
      }
    }
    if (collection === "fileHashes") {
      const duplicate = [...this.#collection("fileHashes").values()]
        .find((hash) => (
          hash.algorithm === entity.algorithm
          && hash.digest === entity.digest
          && hash.id !== entity.id
        ));
      if (duplicate) {
        throw new CoreRelationError(
          `Duplicate file hash digest: ${entity.algorithm}:${entity.digest}`,
        );
      }
    }
    if (collection === "fileVersions") {
      this.#assertExists("fileArtifacts", entity.artifactId, "fileVersion.artifactId");
      this.#assertExists("fileHashes", entity.fileHashId, "fileVersion.fileHashId");
      const hash = this.get("fileHashes", entity.fileHashId);
      if (entity.storageKey !== `${hash.algorithm.replace("-", "")}/${hash.digest}`) {
        throw new CoreRelationError(
          "fileVersion.storageKey must be derived from fileVersion.fileHashId",
        );
      }
      const duplicateVersion = [...this.#collection("fileVersions").values()]
        .find((version) => (
          version.artifactId === entity.artifactId
          && version.versionNumber === entity.versionNumber
          && version.id !== entity.id
        ));
      if (duplicateVersion) {
        throw new CoreRelationError(
          `Duplicate file version number ${entity.versionNumber} for ${entity.artifactId}`,
        );
      }
    }
    if (collection === "artifactLinks") {
      this.#assertExists("fileArtifacts", entity.artifactId, "artifactLink.artifactId");
      const targets = {
        subject: "subjects",
        lecture: "lectures",
        task: "tasks",
      };
      const targetCollection = targets[entity.targetKind];
      if (!targetCollection) {
        throw new CoreRelationError(
          `Unsupported artifactLink.targetKind: ${entity.targetKind}`,
        );
      }
      this.#assertExists(targetCollection, entity.targetId, "artifactLink.targetId");
      const duplicateLink = [...this.#collection("artifactLinks").values()]
        .find((link) => (
          link.artifactId === entity.artifactId
          && link.targetKind === entity.targetKind
          && link.targetId === entity.targetId
          && link.role === entity.role
          && link.id !== entity.id
        ));
      if (duplicateLink) {
        throw new CoreRelationError(
          `Duplicate artifact link for ${entity.artifactId} and ${entity.targetId}`,
        );
      }
    }
    if (collection === "notebooks") {
      this.#assertExists("subjects", entity.subjectId, "notebook.subjectId");
      if (entity.lectureId) {
        this.#assertExists("lectures", entity.lectureId, "notebook.lectureId");
        const lecture = this.get("lectures", entity.lectureId);
        if (lecture.subjectId !== entity.subjectId) {
          throw new CoreRelationError(
            "notebook.lectureId must belong to notebook.subjectId",
          );
        }
      }
    }
    if (collection === "inkDocuments") {
      this.#assertExists("notebooks", entity.notebookId, "inkDocument.notebookId");
    }
    if (collection === "inkRevisions") {
      this.#assertExists("inkDocuments", entity.inkDocumentId, "inkRevision.inkDocumentId");
      this.#assertExists("fileHashes", entity.fileHashId, "inkRevision.fileHashId");
      const hash = this.get("fileHashes", entity.fileHashId);
      if (entity.storageKey !== `${hash.algorithm.replace("-", "")}/${hash.digest}`) {
        throw new CoreRelationError(
          "inkRevision.storageKey must be derived from inkRevision.fileHashId",
        );
      }
      const revisions = [...this.#collection("inkRevisions").values()];
      if (revisions.some((revision) => (
        revision.inkDocumentId === entity.inkDocumentId
        && revision.revisionNumber === entity.revisionNumber
        && revision.id !== entity.id
      ))) {
        throw new CoreRelationError(
          `Duplicate ink revision number ${entity.revisionNumber} for ${entity.inkDocumentId}`,
        );
      }
      if (revisions.some((revision) => (
        revision.inkDocumentId === entity.inkDocumentId
        && revision.fileHashId === entity.fileHashId
        && revision.id !== entity.id
      ))) {
        throw new CoreRelationError(
          `Duplicate ink content for ${entity.inkDocumentId}`,
        );
      }
    }
    if (collection === "lectureCaptures") {
      this.#assertExists("lectures", entity.lectureId, "lectureCapture.lectureId");
    }
    if (collection === "lectureCloseouts") {
      this.#assertExists("lectures", entity.lectureId, "lectureCloseout.lectureId");
      const duplicate = [...this.#collection("lectureCloseouts").values()]
        .find((closeout) => (
          closeout.lectureId === entity.lectureId
          && closeout.id !== entity.id
        ));
      if (duplicate) {
        throw new CoreRelationError(
          `Lecture already has a closeout: ${entity.lectureId}`,
        );
      }
    }
    if (collection === "captureResolutions") {
      this.#assertExists(
        "lectureCaptures",
        entity.captureId,
        "captureResolution.captureId",
      );
      this.#assertExists(
        "lectureCloseouts",
        entity.closeoutId,
        "captureResolution.closeoutId",
      );
      const capture = this.get("lectureCaptures", entity.captureId);
      const closeout = this.get("lectureCloseouts", entity.closeoutId);
      if (capture.lectureId !== closeout.lectureId) {
        throw new CoreRelationError(
          "captureResolution capture and closeout must belong to the same lecture",
        );
      }
      const duplicate = [...this.#collection("captureResolutions").values()]
        .find((resolution) => (
          resolution.captureId === entity.captureId
          && resolution.id !== entity.id
        ));
      if (duplicate) {
        throw new CoreRelationError(
          `Lecture capture is already resolved: ${entity.captureId}`,
        );
      }
      if (entity.taskId) {
        this.#assertExists("tasks", entity.taskId, "captureResolution.taskId");
        const task = this.get("tasks", entity.taskId);
        if (task.lectureId !== capture.lectureId) {
          throw new CoreRelationError(
            "captureResolution.taskId must belong to the capture lecture",
          );
        }
      }
    }
    if (collection === "resourceMarkers") {
      const targetCollections = {
        subject: "subjects",
        lecture: "lectures",
        task: "tasks",
        "file-artifact": "fileArtifacts",
        notebook: "notebooks",
        "lecture-capture": "lectureCaptures",
      };
      const targetCollection = targetCollections[entity.targetKind];
      if (!targetCollection) {
        throw new CoreRelationError(
          `Unsupported resourceMarker.targetKind: ${entity.targetKind}`,
        );
      }
      this.#assertExists(
        targetCollection,
        entity.targetId,
        "resourceMarker.targetId",
      );
      const duplicate = [...this.#collection("resourceMarkers").values()]
        .find((marker) => (
          marker.targetKind === entity.targetKind
          && marker.targetId === entity.targetId
          && marker.id !== entity.id
        ));
      if (duplicate) {
        throw new CoreRelationError(
          `Duplicate resource marker for ${entity.targetKind}:${entity.targetId}`,
        );
      }
    }
    if (collection === "offlineOperations") {
      const duplicate = [...this.#collection("offlineOperations").values()]
        .find((operation) => (
          operation.idempotencyKey === entity.idempotencyKey
          && operation.id !== entity.id
        ));
      if (duplicate) {
        throw new CoreRelationError(
          `Duplicate offline operation idempotency key: ${entity.idempotencyKey}`,
        );
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

  replace(collection, entity) {
    if (!entity || typeof entity !== "object") {
      throw new TypeError("Core entity must be an object");
    }
    const expectedKind = COLLECTION_KIND[collection];
    const records = this.#collection(collection);
    if (IMMUTABLE_COLLECTIONS.has(collection)) {
      throw new CoreRelationError(`Immutable core collection cannot be replaced: ${collection}`);
    }
    assertStableId(entity.id, expectedKind);
    if (entity.kind !== expectedKind) {
      throw new TypeError(`Expected ${expectedKind} entity in ${collection}`);
    }
    if (!records.has(entity.id)) {
      throw new CoreRelationError(`Cannot replace missing ${collection} entity: ${entity.id}`);
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
