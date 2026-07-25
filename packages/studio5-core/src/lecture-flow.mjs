import { assertStableId, createStableId } from "./ids.mjs";

export const LECTURE_CAPTURE_KINDS = Object.freeze([
  "understanding-gap",
  "important",
  "assignment",
  "professor-question",
  "professor-feedback",
]);

export const LECTURE_CLOSEOUT_STATUSES = Object.freeze([
  "in-progress",
  "completed",
]);

export const CAPTURE_RESOLUTION_OUTCOMES = Object.freeze([
  "task",
  "review",
  "inbox",
  "answered",
  "dismissed",
]);

function requiredText(value, field) {
  const normalized = String(value ?? "").trim();
  if (!normalized) throw new TypeError(`${field} is required`);
  return normalized;
}

function optionalText(value) {
  if (value === null || value === undefined || value === "") return null;
  return String(value).trim() || null;
}

function oneOf(value, allowed, field) {
  const normalized = requiredText(value, field);
  if (!allowed.includes(normalized)) {
    throw new TypeError(`${field} must be one of: ${allowed.join(", ")}`);
  }
  return normalized;
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

function optionalStableId(value, kind) {
  if (value === null || value === undefined || value === "") return null;
  return assertStableId(value, kind);
}

function timestamps(now) {
  const iso = new Date(now).toISOString();
  return { createdAt: iso, updatedAt: iso };
}

export function createLectureCapture({
  id = createStableId("lecture-capture"),
  lectureId,
  kind,
  text,
  capturedAt = null,
  now = Date.now(),
}) {
  const time = timestamps(now);
  return {
    kind: "lecture-capture",
    id: assertStableId(id, "lecture-capture"),
    lectureId: assertStableId(lectureId, "lecture"),
    captureKind: oneOf(kind, LECTURE_CAPTURE_KINDS, "kind"),
    text: requiredText(text, "text"),
    capturedAt: capturedAt === null || capturedAt === undefined || capturedAt === ""
      ? time.createdAt
      : normalizedInstant(capturedAt, "capturedAt"),
    ...time,
  };
}

export function createLectureCloseout({
  id = createStableId("lecture-closeout"),
  lectureId,
  summary = null,
  now = Date.now(),
}) {
  return {
    kind: "lecture-closeout",
    id: assertStableId(id, "lecture-closeout"),
    lectureId: assertStableId(lectureId, "lecture"),
    status: "in-progress",
    summary: optionalText(summary),
    completedAt: null,
    ...timestamps(now),
  };
}

export function completeLectureCloseout(closeout, {
  summary = closeout?.summary ?? null,
} = {}, now = Date.now()) {
  if (!closeout || closeout.kind !== "lecture-closeout") {
    throw new TypeError("completeLectureCloseout requires a lecture-closeout");
  }
  assertStableId(closeout.id, "lecture-closeout");
  if (closeout.status === "completed") return structuredClone(closeout);
  if (!LECTURE_CLOSEOUT_STATUSES.includes(closeout.status)) {
    throw new TypeError("Lecture closeout has an unsupported status");
  }
  const completedAt = new Date(now).toISOString();
  return {
    ...structuredClone(closeout),
    status: "completed",
    summary: optionalText(summary),
    completedAt,
    updatedAt: completedAt,
  };
}

export function createCaptureResolution({
  id = createStableId("capture-resolution"),
  captureId,
  closeoutId,
  outcome,
  taskId = null,
  note = null,
  now = Date.now(),
}) {
  const normalizedOutcome = oneOf(
    outcome,
    CAPTURE_RESOLUTION_OUTCOMES,
    "outcome",
  );
  const normalizedTaskId = optionalStableId(taskId, "task");
  if (normalizedOutcome === "task" && !normalizedTaskId) {
    throw new TypeError("task outcome requires taskId");
  }
  if (normalizedOutcome !== "task" && normalizedTaskId) {
    throw new TypeError("taskId is only allowed for task outcome");
  }
  return {
    kind: "capture-resolution",
    id: assertStableId(id, "capture-resolution"),
    captureId: assertStableId(captureId, "lecture-capture"),
    closeoutId: assertStableId(closeoutId, "lecture-closeout"),
    outcome: normalizedOutcome,
    taskId: normalizedTaskId,
    note: optionalText(note),
    ...timestamps(now),
  };
}
