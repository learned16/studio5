import { assertStableId } from "./ids.mjs";
import {
  LECTURE_STATUSES,
  TASK_PRIORITIES,
  TASK_STATUSES,
  createAcademicYear,
  createArtifactLink,
  createCapabilityPack,
  createFileArtifact,
  createFileHash,
  createFileVersion,
  createInkDocument,
  createInkRevision,
  createLecture,
  createNotebook,
  createScheduleEntry,
  createSemester,
  createSubject,
  createSubjectProfile,
  createTask,
  reviseTask,
} from "./model.mjs";
import { CoreRelationError, CoreStore } from "./store.mjs";
import { buildTodayQuery } from "./today-query.mjs";
import {
  assertFileContentStore,
  prepareFileIntake,
  sha256Hex,
} from "./file-intake.mjs";
import { parseInkSnapshot, prepareInkSnapshot } from "./ink-format.mjs";
import {
  CAPTURE_RESOLUTION_OUTCOMES,
  LECTURE_CAPTURE_KINDS,
  LECTURE_CLOSEOUT_STATUSES,
  completeLectureCloseout as completeCloseoutModel,
  createCaptureResolution,
  createLectureCapture,
  createLectureCloseout,
} from "./lecture-flow.mjs";

function withDefaultNow(input = {}, now) {
  return Object.hasOwn(input, "now") ? input : { ...input, now };
}

function optionalFilterValue(value, allowed, field) {
  if (value === null || value === undefined || value === "") return null;
  const normalized = String(value).trim();
  if (!allowed.includes(normalized)) {
    throw new TypeError(`${field} must be one of: ${allowed.join(", ")}`);
  }
  return normalized;
}

function optionalFilterInstant(value, field) {
  if (value === null || value === undefined || value === "") return null;
  const text = String(value);
  const hasExplicitZone = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/
    .test(text);
  const milliseconds = Date.parse(text);
  if (!hasExplicitZone || Number.isNaN(milliseconds)) {
    throw new TypeError(`${field} must be a valid date-time with an explicit timezone`);
  }
  return new Date(milliseconds).toISOString();
}

function optionalFilterDate(value, field) {
  if (value === null || value === undefined || value === "") return null;
  const text = String(value);
  const parsed = new Date(`${text}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)
    || Number.isNaN(parsed.getTime())
    || parsed.toISOString().slice(0, 10) !== text) {
    throw new TypeError(`${field} must use YYYY-MM-DD`);
  }
  return text;
}

function optionalFilterWeekday(value) {
  if (value === null || value === undefined || value === "") return null;
  const day = Number(value);
  if (!Number.isInteger(day) || day < 1 || day > 7) {
    throw new TypeError("dayOfWeek must be an integer from 1 to 7");
  }
  return day;
}

export class AcademicRepositoryRecoveryRequiredError extends Error {
  constructor() {
    super("Academic repository requires recovery before another write");
    this.name = "AcademicRepositoryRecoveryRequiredError";
  }
}

export class LectureCloseoutIncompleteError extends Error {
  constructor(closeoutId, unresolvedCaptureIds) {
    super(
      `Lecture closeout ${closeoutId} has ${unresolvedCaptureIds.length} unresolved capture(s)`,
    );
    this.name = "LectureCloseoutIncompleteError";
    this.closeoutId = closeoutId;
    this.unresolvedCaptureIds = structuredClone(unresolvedCaptureIds);
  }
}

export class AcademicRepository {
  #database;
  #fileContentStore;
  #now;
  #store = null;
  #initialized = false;
  #needsRecovery = false;
  #operationQueue = Promise.resolve();
  #lastLoad = null;

  constructor(localDatabase, {
    now = Date.now,
    fileContentStore = null,
  } = {}) {
    if (!localDatabase
      || typeof localDatabase.load !== "function"
      || typeof localDatabase.save !== "function") {
      throw new TypeError("AcademicRepository requires a CoreLocalDatabase-compatible object");
    }
    if (typeof now !== "function") throw new TypeError("now must be a function");
    this.#database = localDatabase;
    this.#now = now;
    this.#fileContentStore = fileContentStore
      ? assertFileContentStore(fileContentStore)
      : null;
  }

  #enqueue(operation) {
    const result = this.#operationQueue.then(operation, operation);
    this.#operationQueue = result.catch(() => undefined);
    return result;
  }

  async #initializeUnlocked({ force = false } = {}) {
    if (this.#initialized && !force) return this.#lastLoad;
    const loaded = await this.#database.load();
    this.#store = new CoreStore(loaded.snapshot);
    this.#initialized = true;
    this.#needsRecovery = false;
    this.#lastLoad = {
      recovered: loaded.recovered,
      source: loaded.source,
    };
    return structuredClone(this.#lastLoad);
  }

  initialize() {
    return this.#enqueue(() => this.#initializeUnlocked());
  }

  recover() {
    return this.#enqueue(() => this.#initializeUnlocked({ force: true }));
  }

  state() {
    return {
      initialized: this.#initialized,
      needsRecovery: this.#needsRecovery,
      lastLoad: this.#lastLoad ? structuredClone(this.#lastLoad) : null,
    };
  }

  async #read(operation) {
    return this.#enqueue(async () => {
      await this.#initializeUnlocked();
      return operation(this.#store);
    });
  }

  #mutate(operation) {
    return this.#enqueue(async () => {
      await this.#initializeUnlocked();
      if (this.#needsRecovery) {
        throw new AcademicRepositoryRecoveryRequiredError();
      }

      const working = new CoreStore(this.#store.exportSnapshot(this.#now()));
      const result = operation(working);
      try {
        await this.#database.save(working.exportSnapshot(this.#now()));
      } catch (error) {
        this.#needsRecovery = true;
        throw error;
      }
      this.#store = working;
      return structuredClone(result);
    });
  }

  #create(collection, entityFactory, input) {
    return this.#mutate((working) => {
      const entity = entityFactory(withDefaultNow(input, this.#now()));
      working.add(collection, entity);
      return entity;
    });
  }

  createAcademicYear(input) {
    return this.#create("academicYears", createAcademicYear, input);
  }

  createSemester(input) {
    return this.#create("semesters", createSemester, input);
  }

  createCapabilityPack(input) {
    return this.#create("capabilityPacks", createCapabilityPack, input);
  }

  createSubjectProfile(input) {
    return this.#create("subjectProfiles", createSubjectProfile, input);
  }

  createSubject(input) {
    return this.#create("subjects", createSubject, input);
  }

  createScheduleEntry(input) {
    return this.#create("scheduleEntries", createScheduleEntry, input);
  }

  createLecture(input) {
    return this.#create("lectures", createLecture, input);
  }

  createTask(input) {
    return this.#create("tasks", createTask, input);
  }

  linkArtifact(input) {
    return this.#create("artifactLinks", createArtifactLink, input);
  }

  createNotebook(input) {
    return this.#create("notebooks", createNotebook, input);
  }

  createInkDocument(input) {
    return this.#create("inkDocuments", createInkDocument, input);
  }

  createLectureCapture(input) {
    return this.#create("lectureCaptures", createLectureCapture, input);
  }

  startLectureCloseout(lectureId, input = {}) {
    return this.#mutate((working) => {
      const normalizedLectureId = assertStableId(lectureId, "lecture");
      const existing = working.list("lectureCloseouts")
        .find((closeout) => closeout.lectureId === normalizedLectureId);
      if (existing) {
        return { status: "existing", closeout: existing };
      }
      const closeout = createLectureCloseout(withDefaultNow({
        ...input,
        lectureId: normalizedLectureId,
      }, this.#now()));
      working.add("lectureCloseouts", closeout);
      return { status: "created", closeout };
    });
  }

  resolveLectureCapture(captureId, input) {
    return this.#mutate((working) => {
      const resolution = createCaptureResolution(withDefaultNow({
        ...input,
        captureId: assertStableId(captureId, "lecture-capture"),
      }, this.#now()));
      working.add("captureResolutions", resolution);
      return resolution;
    });
  }

  completeLectureCloseout(closeoutId, input = {}) {
    return this.#mutate((working) => {
      const normalizedCloseoutId = assertStableId(closeoutId, "lecture-closeout");
      const closeout = working.get("lectureCloseouts", normalizedCloseoutId);
      if (!closeout) {
        throw new CoreRelationError(`Cannot complete missing lecture closeout: ${closeoutId}`);
      }
      if (closeout.status === "completed") return closeout;
      const captureIds = working.list("lectureCaptures")
        .filter((capture) => capture.lectureId === closeout.lectureId)
        .map(({ id }) => id);
      const resolvedIds = new Set(
        working.list("captureResolutions")
          .filter((resolution) => resolution.closeoutId === closeout.id)
          .map(({ captureId }) => captureId),
      );
      const unresolved = captureIds.filter((id) => !resolvedIds.has(id));
      if (unresolved.length > 0) {
        throw new LectureCloseoutIncompleteError(closeout.id, unresolved);
      }
      const completed = completeCloseoutModel(closeout, input, this.#now());
      working.replace("lectureCloseouts", completed);
      return completed;
    });
  }

  updateTask(taskId, changes) {
    return this.#mutate((working) => {
      const id = assertStableId(taskId, "task");
      const current = working.get("tasks", id);
      if (!current) throw new CoreRelationError(`Cannot update missing task: ${id}`);
      const revised = reviseTask(current, changes, this.#now());
      working.replace("tasks", revised);
      return revised;
    });
  }

  listAcademicYears() {
    return this.#read((store) => store.list("academicYears"));
  }

  listSemesters({ academicYearId = null } = {}) {
    return this.#read((store) => {
      const semesters = store.list("semesters");
      if (!academicYearId) return semesters;
      assertStableId(academicYearId, "academic-year");
      return semesters.filter((semester) => semester.academicYearId === academicYearId);
    });
  }

  listCapabilityPacks() {
    return this.#read((store) => store.list("capabilityPacks"));
  }

  listSubjectProfiles() {
    return this.#read((store) => store.list("subjectProfiles"));
  }

  listSubjects({ semesterId = null, academicYearId = null } = {}) {
    return this.#read((store) => {
      let allowedSemesterIds = null;
      if (academicYearId) {
        assertStableId(academicYearId, "academic-year");
        allowedSemesterIds = new Set(
          store.list("semesters")
            .filter((semester) => semester.academicYearId === academicYearId)
            .map((semester) => semester.id),
        );
      }
      if (semesterId) assertStableId(semesterId, "semester");
      return store.list("subjects").filter((subject) => (
        (!semesterId || subject.semesterId === semesterId)
        && (!allowedSemesterIds || allowedSemesterIds.has(subject.semesterId))
      ));
    });
  }

  getSubject(subjectId) {
    return this.#read((store) => (
      store.get("subjects", assertStableId(subjectId, "subject"))
    ));
  }

  listScheduleEntries({
    subjectId = null,
    dayOfWeek = null,
    activeOn = null,
  } = {}) {
    return this.#read((store) => {
      if (subjectId) assertStableId(subjectId, "subject");
      const day = optionalFilterWeekday(dayOfWeek);
      const date = optionalFilterDate(activeOn, "activeOn");
      return store.list("scheduleEntries").filter((entry) => (
        (!subjectId || entry.subjectId === subjectId)
        && (!day || entry.dayOfWeek === day)
        && (!date || (
          (!entry.effectiveFrom || entry.effectiveFrom <= date)
          && (!entry.effectiveUntil || entry.effectiveUntil >= date)
        ))
      ));
    });
  }

  getScheduleEntry(scheduleEntryId) {
    return this.#read((store) => (
      store.get("scheduleEntries", assertStableId(scheduleEntryId, "schedule-entry"))
    ));
  }

  listLectures({
    subjectId = null,
    scheduleEntryId = null,
    status = null,
    from = null,
    until = null,
  } = {}) {
    return this.#read((store) => {
      if (subjectId) assertStableId(subjectId, "subject");
      if (scheduleEntryId) assertStableId(scheduleEntryId, "schedule-entry");
      const normalizedStatus = optionalFilterValue(status, LECTURE_STATUSES, "status");
      const start = optionalFilterInstant(from, "from");
      const end = optionalFilterInstant(until, "until");
      if (start && end && start > end) throw new RangeError("from must precede until");
      return store.list("lectures").filter((lecture) => (
        (!subjectId || lecture.subjectId === subjectId)
        && (!scheduleEntryId || lecture.scheduleEntryId === scheduleEntryId)
        && (!normalizedStatus || lecture.status === normalizedStatus)
        && (!start || lecture.endsAt > start)
        && (!end || lecture.startsAt < end)
      ));
    });
  }

  getLecture(lectureId) {
    return this.#read((store) => (
      store.get("lectures", assertStableId(lectureId, "lecture"))
    ));
  }

  listTasks({
    subjectId = null,
    lectureId = null,
    status = null,
    priority = null,
    dueAfter = null,
    dueBefore = null,
  } = {}) {
    return this.#read((store) => {
      if (subjectId) assertStableId(subjectId, "subject");
      if (lectureId) assertStableId(lectureId, "lecture");
      const normalizedStatus = optionalFilterValue(status, TASK_STATUSES, "status");
      const normalizedPriority = optionalFilterValue(priority, TASK_PRIORITIES, "priority");
      const after = optionalFilterInstant(dueAfter, "dueAfter");
      const before = optionalFilterInstant(dueBefore, "dueBefore");
      if (after && before && after > before) {
        throw new RangeError("dueAfter must precede dueBefore");
      }
      return store.list("tasks").filter((task) => (
        (!subjectId || task.subjectId === subjectId)
        && (!lectureId || task.lectureId === lectureId)
        && (!normalizedStatus || task.status === normalizedStatus)
        && (!normalizedPriority || task.priority === normalizedPriority)
        && (!after || (task.dueAt && task.dueAt >= after))
        && (!before || (task.dueAt && task.dueAt <= before))
      ));
    });
  }

  getTask(taskId) {
    return this.#read((store) => (
      store.get("tasks", assertStableId(taskId, "task"))
    ));
  }

  listLectureCaptures({
    lectureId = null,
    kind = null,
  } = {}) {
    return this.#read((store) => {
      if (lectureId) assertStableId(lectureId, "lecture");
      const normalizedKind = optionalFilterValue(
        kind,
        LECTURE_CAPTURE_KINDS,
        "kind",
      );
      return store.list("lectureCaptures")
        .filter((capture) => (
          (!lectureId || capture.lectureId === lectureId)
          && (!normalizedKind || capture.captureKind === normalizedKind)
        ))
        .sort((left, right) => (
          left.capturedAt.localeCompare(right.capturedAt)
          || left.id.localeCompare(right.id)
        ));
    });
  }

  listLectureCloseouts({
    lectureId = null,
    status = null,
  } = {}) {
    return this.#read((store) => {
      if (lectureId) assertStableId(lectureId, "lecture");
      const normalizedStatus = optionalFilterValue(
        status,
        LECTURE_CLOSEOUT_STATUSES,
        "status",
      );
      return store.list("lectureCloseouts").filter((closeout) => (
        (!lectureId || closeout.lectureId === lectureId)
        && (!normalizedStatus || closeout.status === normalizedStatus)
      ));
    });
  }

  listCaptureResolutions({
    captureId = null,
    closeoutId = null,
    outcome = null,
  } = {}) {
    return this.#read((store) => {
      if (captureId) assertStableId(captureId, "lecture-capture");
      if (closeoutId) assertStableId(closeoutId, "lecture-closeout");
      const normalizedOutcome = optionalFilterValue(
        outcome,
        CAPTURE_RESOLUTION_OUTCOMES,
        "outcome",
      );
      return store.list("captureResolutions").filter((resolution) => (
        (!captureId || resolution.captureId === captureId)
        && (!closeoutId || resolution.closeoutId === closeoutId)
        && (!normalizedOutcome || resolution.outcome === normalizedOutcome)
      ));
    });
  }

  async #prepareAndQueueFile(input, artifactId = null) {
    if (!this.#fileContentStore) {
      throw new TypeError("File intake requires a fileContentStore");
    }
    const prepared = await prepareFileIntake(input);
    return this.#enqueue(async () => {
      await this.#initializeUnlocked();
      if (this.#needsRecovery) {
        throw new AcademicRepositoryRecoveryRequiredError();
      }

      const working = new CoreStore(this.#store.exportSnapshot(this.#now()));
      const hashes = working.list("fileHashes");
      let fileHash = hashes.find((candidate) => (
        candidate.algorithm === prepared.algorithm
        && candidate.digest === prepared.digest
      )) ?? null;
      const versionsForHash = fileHash
        ? working.list("fileVersions")
          .filter((version) => version.fileHashId === fileHash.id)
        : [];

      if (!artifactId && versionsForHash.length > 0) {
        const duplicateVersion = versionsForHash
          .sort((left, right) => left.versionNumber - right.versionNumber)[0];
        const duplicateArtifact = working.get(
          "fileArtifacts",
          duplicateVersion.artifactId,
        );
        await this.#fileContentStore.putIfAbsent(
          prepared.storageKey,
          prepared.bytes,
          { mediaType: prepared.mediaType, now: this.#now() },
        );
        return {
          status: "duplicate",
          artifact: duplicateArtifact,
          version: duplicateVersion,
          fileHash,
        };
      }

      let artifact;
      let versionNumber = 1;
      if (artifactId) {
        const normalizedArtifactId = assertStableId(artifactId, "file-artifact");
        artifact = working.get("fileArtifacts", normalizedArtifactId);
        if (!artifact) {
          throw new CoreRelationError(`Cannot version missing file artifact: ${normalizedArtifactId}`);
        }
        const artifactVersions = working.list("fileVersions")
          .filter((version) => version.artifactId === normalizedArtifactId)
          .sort((left, right) => left.versionNumber - right.versionNumber);
        const matching = fileHash
          ? artifactVersions.find((version) => version.fileHashId === fileHash.id)
          : null;
        if (matching) {
          await this.#fileContentStore.putIfAbsent(
            prepared.storageKey,
            prepared.bytes,
            { mediaType: prepared.mediaType, now: this.#now() },
          );
          return {
            status: "duplicate",
            artifact,
            version: matching,
            fileHash,
          };
        }
        versionNumber = (artifactVersions.at(-1)?.versionNumber ?? 0) + 1;
      }

      await this.#fileContentStore.putIfAbsent(
        prepared.storageKey,
        prepared.bytes,
        { mediaType: prepared.mediaType, now: this.#now() },
      );

      const operationNow = this.#now();
      if (!fileHash) {
        fileHash = createFileHash({
          algorithm: prepared.algorithm,
          digest: prepared.digest,
          now: operationNow,
        });
        working.add("fileHashes", fileHash);
      }
      if (!artifact) {
        artifact = createFileArtifact({
          displayName: prepared.displayName,
          originalName: prepared.originalName,
          sourceType: prepared.sourceType,
          now: operationNow,
        });
        working.add("fileArtifacts", artifact);
      }
      const version = createFileVersion({
        artifactId: artifact.id,
        fileHashId: fileHash.id,
        versionNumber,
        mediaType: prepared.mediaType,
        byteSize: prepared.byteSize,
        storageKey: prepared.storageKey,
        originalModifiedAt: prepared.originalModifiedAt,
        now: operationNow,
      });
      working.add("fileVersions", version);

      try {
        await this.#database.save(working.exportSnapshot(this.#now()));
      } catch (error) {
        this.#needsRecovery = true;
        throw error;
      }
      this.#store = working;
      return structuredClone({
        status: "created",
        artifact,
        version,
        fileHash,
      });
    });
  }

  ingestFile(input) {
    return this.#prepareAndQueueFile(input);
  }

  addFileVersion(artifactId, input) {
    return this.#prepareAndQueueFile(input, artifactId);
  }

  listFileArtifacts() {
    return this.#read((store) => store.list("fileArtifacts"));
  }

  getFileArtifact(artifactId) {
    return this.#read((store) => (
      store.get("fileArtifacts", assertStableId(artifactId, "file-artifact"))
    ));
  }

  listFileVersions({ artifactId = null, fileHashId = null } = {}) {
    return this.#read((store) => {
      if (artifactId) assertStableId(artifactId, "file-artifact");
      if (fileHashId) assertStableId(fileHashId, "file-hash");
      return store.list("fileVersions")
        .filter((version) => (
          (!artifactId || version.artifactId === artifactId)
          && (!fileHashId || version.fileHashId === fileHashId)
        ))
        .sort((left, right) => left.versionNumber - right.versionNumber);
    });
  }

  listArtifactLinks({
    artifactId = null,
    targetKind = null,
    targetId = null,
  } = {}) {
    return this.#read((store) => {
      if (artifactId) assertStableId(artifactId, "file-artifact");
      if (targetId && !targetKind) {
        throw new TypeError("targetId filter requires targetKind");
      }
      if (targetKind && !["subject", "lecture", "task"].includes(targetKind)) {
        throw new TypeError("Unsupported artifact link targetKind");
      }
      if (targetId) assertStableId(targetId, targetKind);
      return store.list("artifactLinks").filter((link) => (
        (!artifactId || link.artifactId === artifactId)
        && (!targetKind || link.targetKind === targetKind)
        && (!targetId || link.targetId === targetId)
      ));
    });
  }

  async getFileContent(fileVersionId) {
    if (!this.#fileContentStore) {
      throw new TypeError("File content access requires a fileContentStore");
    }
    const version = await this.#read((store) => (
      store.get("fileVersions", assertStableId(fileVersionId, "file-version"))
    ));
    if (!version) return null;
    const content = await this.#fileContentStore.get(version.storageKey);
    if (!content) return null;
    if (content.byteSize !== version.byteSize) {
      throw new CoreRelationError(`Stored content size mismatch for ${version.id}`);
    }
    const fileHash = await this.#read((store) => (
      store.get("fileHashes", version.fileHashId)
    ));
    const digest = await sha256Hex(content.bytes);
    if (!fileHash || digest !== fileHash.digest) {
      throw new CoreRelationError(`Stored content hash mismatch for ${version.id}`);
    }
    return content;
  }

  saveInkRevision(inkDocumentId, input) {
    if (!this.#fileContentStore) {
      return Promise.reject(new TypeError("Ink revision requires a fileContentStore"));
    }
    const normalizedDocumentId = assertStableId(inkDocumentId, "ink-document");
    return prepareInkSnapshot({
      ...input,
      documentId: normalizedDocumentId,
    }).then((prepared) => this.#enqueue(async () => {
      await this.#initializeUnlocked();
      if (this.#needsRecovery) {
        throw new AcademicRepositoryRecoveryRequiredError();
      }

      const working = new CoreStore(this.#store.exportSnapshot(this.#now()));
      const inkDocument = working.get("inkDocuments", normalizedDocumentId);
      if (!inkDocument) {
        throw new CoreRelationError(`Cannot revise missing ink document: ${normalizedDocumentId}`);
      }
      let fileHash = working.list("fileHashes").find((candidate) => (
        candidate.algorithm === prepared.algorithm
        && candidate.digest === prepared.digest
      )) ?? null;
      const revisions = working.list("inkRevisions")
        .filter((revision) => revision.inkDocumentId === normalizedDocumentId)
        .sort((left, right) => left.revisionNumber - right.revisionNumber);
      const duplicate = fileHash
        ? revisions.find((revision) => revision.fileHashId === fileHash.id)
        : null;

      await this.#fileContentStore.putIfAbsent(
        prepared.storageKey,
        prepared.bytes,
        { mediaType: "application/vnd.studio5.ink+json", now: this.#now() },
      );
      if (duplicate) {
        return {
          status: "duplicate",
          inkDocument,
          revision: duplicate,
          fileHash,
        };
      }

      const operationNow = this.#now();
      if (!fileHash) {
        fileHash = createFileHash({
          algorithm: prepared.algorithm,
          digest: prepared.digest,
          now: operationNow,
        });
        working.add("fileHashes", fileHash);
      }
      const revision = createInkRevision({
        inkDocumentId: normalizedDocumentId,
        fileHashId: fileHash.id,
        revisionNumber: (revisions.at(-1)?.revisionNumber ?? 0) + 1,
        byteSize: prepared.byteSize,
        storageKey: prepared.storageKey,
        strokeCount: prepared.strokeCount,
        pointCount: prepared.pointCount,
        layerCount: prepared.layerCount,
        now: operationNow,
      });
      working.add("inkRevisions", revision);

      try {
        await this.#database.save(working.exportSnapshot(this.#now()));
      } catch (error) {
        this.#needsRecovery = true;
        throw error;
      }
      this.#store = working;
      return structuredClone({
        status: "created",
        inkDocument,
        revision,
        fileHash,
      });
    }));
  }

  listNotebooks({ subjectId = null, lectureId = null } = {}) {
    return this.#read((store) => {
      if (subjectId) assertStableId(subjectId, "subject");
      if (lectureId) assertStableId(lectureId, "lecture");
      return store.list("notebooks").filter((notebook) => (
        (!subjectId || notebook.subjectId === subjectId)
        && (!lectureId || notebook.lectureId === lectureId)
      ));
    });
  }

  listInkDocuments({ notebookId = null } = {}) {
    return this.#read((store) => {
      if (notebookId) assertStableId(notebookId, "notebook");
      return store.list("inkDocuments").filter((document) => (
        !notebookId || document.notebookId === notebookId
      ));
    });
  }

  listInkRevisions({ inkDocumentId = null } = {}) {
    return this.#read((store) => {
      if (inkDocumentId) assertStableId(inkDocumentId, "ink-document");
      return store.list("inkRevisions")
        .filter((revision) => (
          !inkDocumentId || revision.inkDocumentId === inkDocumentId
        ))
        .sort((left, right) => left.revisionNumber - right.revisionNumber);
    });
  }

  async getInkRevisionContent(inkRevisionId) {
    if (!this.#fileContentStore) {
      throw new TypeError("Ink content access requires a fileContentStore");
    }
    const revision = await this.#read((store) => (
      store.get("inkRevisions", assertStableId(inkRevisionId, "ink-revision"))
    ));
    if (!revision) return null;
    const content = await this.#fileContentStore.get(revision.storageKey);
    if (!content) return null;
    if (content.byteSize !== revision.byteSize) {
      throw new CoreRelationError(`Stored ink size mismatch for ${revision.id}`);
    }
    const fileHash = await this.#read((store) => (
      store.get("fileHashes", revision.fileHashId)
    ));
    const digest = await sha256Hex(content.bytes);
    if (!fileHash || digest !== fileHash.digest) {
      throw new CoreRelationError(`Stored ink hash mismatch for ${revision.id}`);
    }
    const snapshot = parseInkSnapshot(content.bytes, revision.inkDocumentId);
    return { ...content, snapshot };
  }

  queryToday(options = {}) {
    if (!options || typeof options !== "object" || Array.isArray(options)) {
      throw new TypeError("Today query options must be an object");
    }
    return this.#read((store) => {
      const now = Object.hasOwn(options, "now") ? options.now : this.#now();
      return buildTodayQuery(
        store.exportSnapshot(now),
        { ...options, now },
      );
    });
  }

  exportSnapshot() {
    return this.#read((store) => store.exportSnapshot(this.#now()));
  }
}
