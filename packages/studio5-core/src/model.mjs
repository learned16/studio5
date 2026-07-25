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

function normalizedDate(value, field) {
  const text = requiredText(value, field);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text) || Number.isNaN(Date.parse(`${text}T00:00:00Z`))) {
    throw new TypeError(`${field} must use YYYY-MM-DD`);
  }
  return text;
}

function timestamps(now) {
  const iso = new Date(now).toISOString();
  return { createdAt: iso, updatedAt: iso };
}

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
