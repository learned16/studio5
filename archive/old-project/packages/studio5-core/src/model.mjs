import { assertStableId, createStableId } from "./ids.mjs";

function requiredText(value, field) {
  const normalized = String(value ?? "").trim();
  if (!normalized) throw new TypeError(`${field} is required`);
  return normalized;
}

function optionalText(value) {
  if (value === null || value === undefined || value === "") return null;
  return String(value).trim() || null;
}

function optionalStableId(value, kind) {
  if (value === null || value === undefined || value === "") return null;
  return assertStableId(value, kind);
}

function normalizedDate(value, field) {
  const text = requiredText(value, field);
  const parsed = new Date(`${text}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)
    || Number.isNaN(parsed.getTime())
    || parsed.toISOString().slice(0, 10) !== text) {
    throw new TypeError(`${field} must use YYYY-MM-DD`);
  }
  return text;
}

function optionalDate(value, field) {
  if (value === null || value === undefined || value === "") return null;
  return normalizedDate(value, field);
}

function normalizedInstant(value, field) {
  const text = requiredText(value, field);
  const hasExplicitZone = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/
    .test(text);
  const milliseconds = Date.parse(text);
  if (!hasExplicitZone || Number.isNaN(milliseconds)) {
    throw new TypeError(`${field} must be a valid date-time with an explicit timezone`);
  }
  return new Date(milliseconds).toISOString();
}

function optionalInstant(value, field) {
  if (value === null || value === undefined || value === "") return null;
  return normalizedInstant(value, field);
}

function normalizedTime(value, field) {
  const text = requiredText(value, field);
  const match = /^(\d{2}):(\d{2})$/.exec(text);
  if (!match || Number(match[1]) > 23 || Number(match[2]) > 59) {
    throw new TypeError(`${field} must use HH:mm`);
  }
  return text;
}

function normalizedWeekday(value) {
  const day = Number(value);
  if (!Number.isInteger(day) || day < 1 || day > 7) {
    throw new TypeError("dayOfWeek must be an integer from 1 to 7");
  }
  return day;
}

function oneOf(value, allowed, field) {
  const normalized = requiredText(value, field);
  if (!allowed.includes(normalized)) {
    throw new TypeError(`${field} must be one of: ${allowed.join(", ")}`);
  }
  return normalized;
}

function timestamps(now) {
  const iso = new Date(now).toISOString();
  return { createdAt: iso, updatedAt: iso };
}

export const LECTURE_STATUSES = Object.freeze(["planned", "completed", "cancelled"]);
export const TASK_STATUSES = Object.freeze(["todo", "in-progress", "done", "cancelled"]);
export const TASK_PRIORITIES = Object.freeze(["low", "normal", "high", "urgent"]);
export const FILE_SOURCE_TYPES = Object.freeze(["upload", "import"]);
export const ARTIFACT_LINK_TARGET_KINDS = Object.freeze(["subject", "lecture", "task"]);
export const ARTIFACT_LINK_ROLES = Object.freeze([
  "attachment",
  "source",
  "reference",
  "submission",
]);
export const NOTEBOOK_TEMPLATES = Object.freeze([
  "blank",
  "lined",
  "grid",
  "dots",
  "isometric",
  "engineering",
]);
export const RESOURCE_TARGET_KINDS = Object.freeze([
  "subject",
  "lecture",
  "task",
  "file-artifact",
  "notebook",
  "note",
  "lecture-capture",
]);
export const INK_FORMAT_VERSION = 1;

function uniqueStableIds(values, kind) {
  return [...new Set((values ?? []).map((value) => assertStableId(value, kind)))];
}

export function createAcademicYear({
  id = createStableId("academic-year"),
  label,
  startDate,
  endDate,
  now = Date.now(),
}) {
  const start = normalizedDate(startDate, "startDate");
  const end = normalizedDate(endDate, "endDate");
  if (start > end) throw new RangeError("Academic year startDate must precede endDate");
  return {
    kind: "academic-year",
    id: assertStableId(id, "academic-year"),
    label: requiredText(label, "label"),
    startDate: start,
    endDate: end,
    ...timestamps(now),
  };
}

export function createSemester({
  id = createStableId("semester"),
  academicYearId,
  label,
  order,
  startDate,
  endDate,
  now = Date.now(),
}) {
  const numericOrder = Number(order);
  if (!Number.isInteger(numericOrder) || numericOrder < 1) {
    throw new TypeError("Semester order must be a positive integer");
  }
  const start = normalizedDate(startDate, "startDate");
  const end = normalizedDate(endDate, "endDate");
  if (start > end) throw new RangeError("Semester startDate must precede endDate");
  return {
    kind: "semester",
    id: assertStableId(id, "semester"),
    academicYearId: assertStableId(academicYearId, "academic-year"),
    label: requiredText(label, "label"),
    order: numericOrder,
    startDate: start,
    endDate: end,
    ...timestamps(now),
  };
}

export function createCapabilityPack({
  id = createStableId("capability-pack"),
  key,
  label,
  version = 1,
  config = {},
  now = Date.now(),
}) {
  const numericVersion = Number(version);
  if (!Number.isInteger(numericVersion) || numericVersion < 1) {
    throw new TypeError("Capability pack version must be a positive integer");
  }
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    throw new TypeError("Capability pack config must be an object");
  }
  return {
    kind: "capability-pack",
    id: assertStableId(id, "capability-pack"),
    key: requiredText(key, "key"),
    label: requiredText(label, "label"),
    version: numericVersion,
    config: structuredClone(config),
    ...timestamps(now),
  };
}

export function createSubjectProfile({
  id = createStableId("subject-profile"),
  key,
  label,
  capabilityPackIds = [],
  now = Date.now(),
}) {
  return {
    kind: "subject-profile",
    id: assertStableId(id, "subject-profile"),
    key: requiredText(key, "key"),
    label: requiredText(label, "label"),
    capabilityPackIds: uniqueStableIds(capabilityPackIds, "capability-pack"),
    ...timestamps(now),
  };
}

export function createSubject({
  id = createStableId("subject"),
  semesterId,
  subjectProfileId,
  title,
  code = null,
  color = null,
  capabilityPackIds = [],
  now = Date.now(),
}) {
  return {
    kind: "subject",
    id: assertStableId(id, "subject"),
    semesterId: assertStableId(semesterId, "semester"),
    subjectProfileId: assertStableId(subjectProfileId, "subject-profile"),
    title: requiredText(title, "title"),
    code: optionalText(code),
    color: optionalText(color),
    capabilityPackIds: uniqueStableIds(capabilityPackIds, "capability-pack"),
    archivedAt: null,
    ...timestamps(now),
  };
}

export function createScheduleEntry({
  id = createStableId("schedule-entry"),
  subjectId,
  dayOfWeek,
  startTime,
  endTime,
  effectiveFrom = null,
  effectiveUntil = null,
  location = null,
  now = Date.now(),
}) {
  const start = normalizedTime(startTime, "startTime");
  const end = normalizedTime(endTime, "endTime");
  if (start >= end) throw new RangeError("Schedule startTime must precede endTime");
  const from = optionalDate(effectiveFrom, "effectiveFrom");
  const until = optionalDate(effectiveUntil, "effectiveUntil");
  if (from && until && from > until) {
    throw new RangeError("Schedule effectiveFrom must precede effectiveUntil");
  }
  return {
    kind: "schedule-entry",
    id: assertStableId(id, "schedule-entry"),
    subjectId: assertStableId(subjectId, "subject"),
    dayOfWeek: normalizedWeekday(dayOfWeek),
    startTime: start,
    endTime: end,
    effectiveFrom: from,
    effectiveUntil: until,
    location: optionalText(location),
    ...timestamps(now),
  };
}

export function createLecture({
  id = createStableId("lecture"),
  subjectId,
  scheduleEntryId = null,
  title,
  startsAt,
  endsAt,
  status = "planned",
  now = Date.now(),
}) {
  const start = normalizedInstant(startsAt, "startsAt");
  const end = normalizedInstant(endsAt, "endsAt");
  if (start >= end) throw new RangeError("Lecture startsAt must precede endsAt");
  return {
    kind: "lecture",
    id: assertStableId(id, "lecture"),
    subjectId: assertStableId(subjectId, "subject"),
    scheduleEntryId: optionalStableId(scheduleEntryId, "schedule-entry"),
    title: requiredText(title, "title"),
    startsAt: start,
    endsAt: end,
    status: oneOf(status, LECTURE_STATUSES, "status"),
    ...timestamps(now),
  };
}

export function createTask({
  id = createStableId("task"),
  subjectId = null,
  lectureId = null,
  title,
  notes = null,
  dueAt = null,
  priority = "normal",
  status = "todo",
  now = Date.now(),
}) {
  const normalizedSubjectId = optionalStableId(subjectId, "subject");
  const normalizedLectureId = optionalStableId(lectureId, "lecture");
  if (normalizedLectureId && !normalizedSubjectId) {
    throw new TypeError("Task lectureId requires subjectId");
  }
  const normalizedStatus = oneOf(status, TASK_STATUSES, "status");
  const time = timestamps(now);
  return {
    kind: "task",
    id: assertStableId(id, "task"),
    subjectId: normalizedSubjectId,
    lectureId: normalizedLectureId,
    title: requiredText(title, "title"),
    notes: optionalText(notes),
    dueAt: optionalInstant(dueAt, "dueAt"),
    priority: oneOf(priority, TASK_PRIORITIES, "priority"),
    status: normalizedStatus,
    completedAt: normalizedStatus === "done" ? time.createdAt : null,
    ...time,
  };
}

export function reviseTask(task, changes, now = Date.now()) {
  if (!task || task.kind !== "task") throw new TypeError("reviseTask requires a task");
  assertStableId(task.id, "task");
  if (!changes || typeof changes !== "object" || Array.isArray(changes)) {
    throw new TypeError("Task changes must be an object");
  }
  const allowed = new Set(["title", "notes", "dueAt", "priority", "status"]);
  const keys = Object.keys(changes);
  if (keys.length === 0) throw new TypeError("Task changes cannot be empty");
  for (const key of keys) {
    if (!allowed.has(key)) throw new TypeError(`Task field cannot be changed: ${key}`);
  }

  const status = Object.hasOwn(changes, "status")
    ? oneOf(changes.status, TASK_STATUSES, "status")
    : task.status;
  const updatedAt = new Date(now).toISOString();
  return {
    ...structuredClone(task),
    title: Object.hasOwn(changes, "title") ? requiredText(changes.title, "title") : task.title,
    notes: Object.hasOwn(changes, "notes") ? optionalText(changes.notes) : task.notes,
    dueAt: Object.hasOwn(changes, "dueAt") ? optionalInstant(changes.dueAt, "dueAt") : task.dueAt,
    priority: Object.hasOwn(changes, "priority")
      ? oneOf(changes.priority, TASK_PRIORITIES, "priority")
      : task.priority,
    status,
    completedAt: status === "done" ? (task.completedAt ?? updatedAt) : null,
    updatedAt,
  };
}

export function createFileArtifact({
  id = createStableId("file-artifact"),
  displayName,
  originalName = displayName,
  sourceType = "upload",
  now = Date.now(),
}) {
  return {
    kind: "file-artifact",
    id: assertStableId(id, "file-artifact"),
    displayName: requiredText(displayName, "displayName"),
    originalName: requiredText(originalName, "originalName"),
    sourceType: oneOf(sourceType, FILE_SOURCE_TYPES, "sourceType"),
    archivedAt: null,
    ...timestamps(now),
  };
}

export function createFileHash({
  id = createStableId("file-hash"),
  algorithm = "sha-256",
  digest,
  now = Date.now(),
}) {
  const normalizedAlgorithm = requiredText(algorithm, "algorithm").toLowerCase();
  if (normalizedAlgorithm !== "sha-256") {
    throw new TypeError("algorithm must be sha-256");
  }
  const normalizedDigest = requiredText(digest, "digest").toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(normalizedDigest)) {
    throw new TypeError("digest must be a 64-character SHA-256 hex value");
  }
  return {
    kind: "file-hash",
    id: assertStableId(id, "file-hash"),
    algorithm: normalizedAlgorithm,
    digest: normalizedDigest,
    ...timestamps(now),
  };
}

export function createFileVersion({
  id = createStableId("file-version"),
  artifactId,
  fileHashId,
  versionNumber,
  mediaType = "application/octet-stream",
  byteSize,
  storageKey,
  originalModifiedAt = null,
  now = Date.now(),
}) {
  const normalizedVersion = Number(versionNumber);
  if (!Number.isInteger(normalizedVersion) || normalizedVersion < 1) {
    throw new TypeError("versionNumber must be a positive integer");
  }
  const normalizedByteSize = Number(byteSize);
  if (!Number.isSafeInteger(normalizedByteSize) || normalizedByteSize < 0) {
    throw new TypeError("byteSize must be a non-negative safe integer");
  }
  return {
    kind: "file-version",
    id: assertStableId(id, "file-version"),
    artifactId: assertStableId(artifactId, "file-artifact"),
    fileHashId: assertStableId(fileHashId, "file-hash"),
    versionNumber: normalizedVersion,
    mediaType: requiredText(mediaType, "mediaType").toLowerCase(),
    byteSize: normalizedByteSize,
    storageKey: requiredText(storageKey, "storageKey"),
    originalModifiedAt: optionalInstant(originalModifiedAt, "originalModifiedAt"),
    ...timestamps(now),
  };
}

export function createArtifactLink({
  id = createStableId("artifact-link"),
  artifactId,
  targetKind,
  targetId,
  role = "attachment",
  label = null,
  now = Date.now(),
}) {
  const normalizedTargetKind = oneOf(
    targetKind,
    ARTIFACT_LINK_TARGET_KINDS,
    "targetKind",
  );
  return {
    kind: "artifact-link",
    id: assertStableId(id, "artifact-link"),
    artifactId: assertStableId(artifactId, "file-artifact"),
    targetKind: normalizedTargetKind,
    targetId: assertStableId(targetId, normalizedTargetKind),
    role: oneOf(role, ARTIFACT_LINK_ROLES, "role"),
    label: optionalText(label),
    ...timestamps(now),
  };
}

export function createNotebook({
  id = createStableId("notebook"),
  subjectId,
  lectureId = null,
  title,
  template = "blank",
  now = Date.now(),
}) {
  return {
    kind: "notebook",
    id: assertStableId(id, "notebook"),
    subjectId: assertStableId(subjectId, "subject"),
    lectureId: optionalStableId(lectureId, "lecture"),
    title: requiredText(title, "title"),
    template: oneOf(template, NOTEBOOK_TEMPLATES, "template"),
    ...timestamps(now),
  };
}

export function createInkDocument({
  id = createStableId("ink-document"),
  notebookId,
  title,
  width,
  height,
  unit = "px",
  formatVersion = INK_FORMAT_VERSION,
  now = Date.now(),
}) {
  const normalizedWidth = Number(width);
  const normalizedHeight = Number(height);
  const normalizedFormatVersion = Number(formatVersion);
  if (!Number.isFinite(normalizedWidth) || normalizedWidth <= 0) {
    throw new TypeError("width must be a positive finite number");
  }
  if (!Number.isFinite(normalizedHeight) || normalizedHeight <= 0) {
    throw new TypeError("height must be a positive finite number");
  }
  if (normalizedFormatVersion !== INK_FORMAT_VERSION) {
    throw new TypeError(`formatVersion must be ${INK_FORMAT_VERSION}`);
  }
  return {
    kind: "ink-document",
    id: assertStableId(id, "ink-document"),
    notebookId: assertStableId(notebookId, "notebook"),
    title: requiredText(title, "title"),
    width: normalizedWidth,
    height: normalizedHeight,
    unit: requiredText(unit, "unit").toLowerCase(),
    formatVersion: normalizedFormatVersion,
    ...timestamps(now),
  };
}

export function createInkRevision({
  id = createStableId("ink-revision"),
  inkDocumentId,
  fileHashId,
  revisionNumber,
  byteSize,
  storageKey,
  strokeCount,
  pointCount,
  layerCount,
  now = Date.now(),
}) {
  const positiveInteger = (value, field, { allowZero = false } = {}) => {
    const normalized = Number(value);
    const minimum = allowZero ? 0 : 1;
    if (!Number.isSafeInteger(normalized) || normalized < minimum) {
      throw new TypeError(`${field} must be an integer >= ${minimum}`);
    }
    return normalized;
  };
  return {
    kind: "ink-revision",
    id: assertStableId(id, "ink-revision"),
    inkDocumentId: assertStableId(inkDocumentId, "ink-document"),
    fileHashId: assertStableId(fileHashId, "file-hash"),
    revisionNumber: positiveInteger(revisionNumber, "revisionNumber"),
    byteSize: positiveInteger(byteSize, "byteSize", { allowZero: true }),
    storageKey: requiredText(storageKey, "storageKey"),
    strokeCount: positiveInteger(strokeCount, "strokeCount", { allowZero: true }),
    pointCount: positiveInteger(pointCount, "pointCount", { allowZero: true }),
    layerCount: positiveInteger(layerCount, "layerCount"),
    ...timestamps(now),
  };
}

export function createResourceMarker({
  id = createStableId("resource-marker"),
  targetKind,
  targetId,
  isFavorite = false,
  favoriteAt = null,
  lastOpenedAt = null,
  now = Date.now(),
}) {
  const normalizedTargetKind = oneOf(
    targetKind,
    RESOURCE_TARGET_KINDS,
    "targetKind",
  );
  const favorite = Boolean(isFavorite);
  const time = timestamps(now);
  return {
    kind: "resource-marker",
    id: assertStableId(id, "resource-marker"),
    targetKind: normalizedTargetKind,
    targetId: assertStableId(targetId, normalizedTargetKind),
    isFavorite: favorite,
    favoriteAt: favorite
      ? (optionalInstant(favoriteAt, "favoriteAt") ?? time.createdAt)
      : null,
    lastOpenedAt: optionalInstant(lastOpenedAt, "lastOpenedAt"),
    ...time,
  };
}

export function reviseResourceMarker(marker, changes, now = Date.now()) {
  if (!marker || marker.kind !== "resource-marker") {
    throw new TypeError("reviseResourceMarker requires a resource marker");
  }
  if (!changes || typeof changes !== "object" || Array.isArray(changes)) {
    throw new TypeError("Resource marker changes must be an object");
  }
  const allowed = new Set(["isFavorite", "lastOpenedAt"]);
  const keys = Object.keys(changes);
  if (keys.length === 0) throw new TypeError("Resource marker changes cannot be empty");
  for (const key of keys) {
    if (!allowed.has(key)) {
      throw new TypeError(`Resource marker field cannot be changed: ${key}`);
    }
  }
  const updatedAt = new Date(now).toISOString();
  const isFavorite = Object.hasOwn(changes, "isFavorite")
    ? Boolean(changes.isFavorite)
    : marker.isFavorite;
  return {
    ...structuredClone(marker),
    isFavorite,
    favoriteAt: isFavorite
      ? (marker.isFavorite ? marker.favoriteAt : updatedAt)
      : null,
    lastOpenedAt: Object.hasOwn(changes, "lastOpenedAt")
      ? optionalInstant(changes.lastOpenedAt, "lastOpenedAt")
      : marker.lastOpenedAt,
    updatedAt,
  };
}

export function createNote({
  id = createStableId("note"),
  subjectId,
  lectureId = null,
  artifactId = null,
  fileVersionId = null,
  title,
  body,
  pageNumber = null,
  now = Date.now(),
}) {
  const normalizedArtifactId = optionalStableId(artifactId, "file-artifact");
  const normalizedFileVersionId = optionalStableId(fileVersionId, "file-version");
  if (normalizedFileVersionId && !normalizedArtifactId) {
    throw new TypeError("Note fileVersionId requires artifactId");
  }
  const normalizedPageNumber = pageNumber === null
    || pageNumber === undefined
    || pageNumber === ""
    ? null
    : Number(pageNumber);
  if (normalizedPageNumber !== null
    && (!Number.isInteger(normalizedPageNumber) || normalizedPageNumber < 1)) {
    throw new TypeError("pageNumber must be a positive integer");
  }
  return {
    kind: "note",
    id: assertStableId(id, "note"),
    subjectId: assertStableId(subjectId, "subject"),
    lectureId: optionalStableId(lectureId, "lecture"),
    artifactId: normalizedArtifactId,
    fileVersionId: normalizedFileVersionId,
    title: requiredText(title, "title"),
    body: requiredText(body, "body"),
    pageNumber: normalizedPageNumber,
    ...timestamps(now),
  };
}

export function reviseNote(note, changes, now = Date.now()) {
  if (!note || note.kind !== "note") {
    throw new TypeError("reviseNote requires a note");
  }
  if (!changes || typeof changes !== "object" || Array.isArray(changes)) {
    throw new TypeError("Note changes must be an object");
  }
  const allowed = new Set(["title", "body", "pageNumber"]);
  const keys = Object.keys(changes);
  if (keys.length === 0) throw new TypeError("Note changes cannot be empty");
  for (const key of keys) {
    if (!allowed.has(key)) throw new TypeError(`Note field cannot be changed: ${key}`);
  }
  const nextPageNumber = Object.hasOwn(changes, "pageNumber")
    ? changes.pageNumber
    : note.pageNumber;
  const pageNumber = nextPageNumber === null
    || nextPageNumber === undefined
    || nextPageNumber === ""
    ? null
    : Number(nextPageNumber);
  if (pageNumber !== null && (!Number.isInteger(pageNumber) || pageNumber < 1)) {
    throw new TypeError("pageNumber must be a positive integer");
  }
  return {
    ...structuredClone(note),
    title: Object.hasOwn(changes, "title")
      ? requiredText(changes.title, "title")
      : note.title,
    body: Object.hasOwn(changes, "body")
      ? requiredText(changes.body, "body")
      : note.body,
    pageNumber,
    updatedAt: new Date(now).toISOString(),
  };
}
