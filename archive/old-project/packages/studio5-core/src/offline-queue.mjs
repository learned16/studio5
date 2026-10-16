import { assertStableId, createStableId } from "./ids.mjs";

export const OFFLINE_OPERATION_STATUSES = Object.freeze([
  "pending",
  "processing",
  "succeeded",
  "failed",
  "conflict",
]);

function requiredToken(value, field, pattern) {
  const normalized = String(value ?? "").trim();
  if (!pattern.test(normalized)) {
    throw new TypeError(`${field} has an invalid format`);
  }
  return normalized;
}

function normalizedInstant(value, field) {
  const text = String(value ?? "").trim();
  const milliseconds = Date.parse(text);
  if (!text || Number.isNaN(milliseconds) || !/(?:Z|[+-]\d{2}:\d{2})$/.test(text)) {
    throw new TypeError(`${field} must be a valid date-time with an explicit timezone`);
  }
  return new Date(milliseconds).toISOString();
}

function optionalText(value) {
  if (value === null || value === undefined || value === "") return null;
  return String(value).trim() || null;
}

function clonePayload(value) {
  if (value === null || value === undefined) return {};
  if (typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError("payload must be an object");
  }
  return structuredClone(value);
}

function assertOperation(operation) {
  if (!operation || operation.kind !== "offline-operation") {
    throw new TypeError("Offline queue transition requires an offline operation");
  }
  assertStableId(operation.id, "offline-operation");
  return operation;
}

function assertStatus(operation, allowed, action) {
  if (!allowed.includes(operation.status)) {
    throw new TypeError(
      `${action} requires status ${allowed.join(" or ")}, received ${operation.status}`,
    );
  }
}

export function createOfflineOperation({
  id = createStableId("offline-operation"),
  idempotencyKey,
  operationType,
  entityKind,
  entityId,
  payload = {},
  availableAt = null,
  now = Date.now(),
}) {
  const createdAt = new Date(now).toISOString();
  const normalizedEntityKind = requiredToken(
    entityKind,
    "entityKind",
    /^[a-z][a-z0-9-]*$/,
  );
  return {
    kind: "offline-operation",
    id: assertStableId(id, "offline-operation"),
    idempotencyKey: requiredToken(
      idempotencyKey,
      "idempotencyKey",
      /^[A-Za-z0-9][A-Za-z0-9._:-]{2,199}$/,
    ),
    operationType: requiredToken(
      operationType,
      "operationType",
      /^[a-z][a-z0-9.-]*$/,
    ),
    entityKind: normalizedEntityKind,
    entityId: assertStableId(entityId, normalizedEntityKind),
    payload: clonePayload(payload),
    status: "pending",
    attempts: 0,
    availableAt: availableAt
      ? normalizedInstant(availableAt, "availableAt")
      : createdAt,
    lastAttemptAt: null,
    completedAt: null,
    errorCode: null,
    errorMessage: null,
    createdAt,
    updatedAt: createdAt,
  };
}

export function startOfflineOperation(operation, now = Date.now()) {
  assertOperation(operation);
  assertStatus(operation, ["pending"], "startOfflineOperation");
  const instant = new Date(now).toISOString();
  if (operation.availableAt > instant) {
    throw new RangeError("Offline operation is not available yet");
  }
  return {
    ...structuredClone(operation),
    status: "processing",
    attempts: operation.attempts + 1,
    lastAttemptAt: instant,
    errorCode: null,
    errorMessage: null,
    updatedAt: instant,
  };
}

export function succeedOfflineOperation(operation, now = Date.now()) {
  assertOperation(operation);
  assertStatus(operation, ["processing"], "succeedOfflineOperation");
  const instant = new Date(now).toISOString();
  return {
    ...structuredClone(operation),
    status: "succeeded",
    completedAt: instant,
    errorCode: null,
    errorMessage: null,
    updatedAt: instant,
  };
}

export function failOfflineOperation(operation, {
  errorCode,
  errorMessage,
}, now = Date.now()) {
  assertOperation(operation);
  assertStatus(operation, ["processing"], "failOfflineOperation");
  const instant = new Date(now).toISOString();
  return {
    ...structuredClone(operation),
    status: "failed",
    completedAt: null,
    errorCode: requiredToken(errorCode, "errorCode", /^[A-Z0-9][A-Z0-9._-]{1,99}$/),
    errorMessage: optionalText(errorMessage),
    updatedAt: instant,
  };
}

export function conflictOfflineOperation(operation, {
  errorCode = "SYNC_CONFLICT",
  errorMessage = null,
}, now = Date.now()) {
  assertOperation(operation);
  assertStatus(operation, ["processing"], "conflictOfflineOperation");
  const instant = new Date(now).toISOString();
  return {
    ...structuredClone(operation),
    status: "conflict",
    completedAt: null,
    errorCode: requiredToken(errorCode, "errorCode", /^[A-Z0-9][A-Z0-9._-]{1,99}$/),
    errorMessage: optionalText(errorMessage),
    updatedAt: instant,
  };
}

export function retryOfflineOperation(operation, {
  availableAt = null,
} = {}, now = Date.now()) {
  assertOperation(operation);
  assertStatus(operation, ["failed", "conflict"], "retryOfflineOperation");
  const instant = new Date(now).toISOString();
  return {
    ...structuredClone(operation),
    status: "pending",
    availableAt: availableAt
      ? normalizedInstant(availableAt, "availableAt")
      : instant,
    completedAt: null,
    errorCode: null,
    errorMessage: null,
    updatedAt: instant,
  };
}

export function recoverInterruptedOperation(operation, now = Date.now()) {
  assertOperation(operation);
  assertStatus(operation, ["processing"], "recoverInterruptedOperation");
  const instant = new Date(now).toISOString();
  return {
    ...structuredClone(operation),
    status: "pending",
    availableAt: instant,
    completedAt: null,
    errorCode: "INTERRUPTED",
    errorMessage: "Recovered after an interrupted processing attempt",
    updatedAt: instant,
  };
}
