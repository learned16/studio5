import { assertStableId } from "./ids.mjs";
import { RESOURCE_TARGET_KINDS } from "./model.mjs";

const ARABIC_DIACRITICS = /[\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06ed]/g;

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(ARABIC_DIACRITICS, "")
    .replace(/\u0640/g, "")
    .toLocaleLowerCase("ar")
    .trim();
}

function requireSnapshot(snapshot) {
  if (!snapshot?.entities || typeof snapshot.entities !== "object") {
    throw new TypeError("Library search requires a core snapshot");
  }
  return snapshot.entities;
}

function markerKey(targetKind, targetId) {
  return `${targetKind}:${targetId}`;
}

function targetKindFilter(targetKinds) {
  if (targetKinds === null || targetKinds === undefined) return null;
  if (!Array.isArray(targetKinds)) throw new TypeError("targetKinds must be an array");
  const normalized = new Set(targetKinds.map((kind) => {
    const value = String(kind).trim();
    if (!RESOURCE_TARGET_KINDS.includes(value)) {
      throw new TypeError(`Unsupported search target kind: ${value}`);
    }
    return value;
  }));
  return normalized.size > 0 ? normalized : null;
}

function positiveLimit(value) {
  const limit = Number(value ?? 50);
  if (!Number.isInteger(limit) || limit < 1 || limit > 500) {
    throw new TypeError("limit must be an integer from 1 to 500");
  }
  return limit;
}

function buildDocuments(entities) {
  const subjects = new Map(entities.subjects.map((item) => [item.id, item]));
  const lectures = new Map(entities.lectures.map((item) => [item.id, item]));
  const tasks = new Map(entities.tasks.map((item) => [item.id, item]));
  const artifactLinks = new Map();
  for (const link of entities.artifactLinks) {
    const current = artifactLinks.get(link.artifactId) ?? [];
    current.push(link);
    artifactLinks.set(link.artifactId, current);
  }

  const subjectContext = (targetKind, targetId) => {
    if (targetKind === "subject") return targetId;
    if (targetKind === "lecture") return lectures.get(targetId)?.subjectId ?? null;
    if (targetKind === "task") return tasks.get(targetId)?.subjectId ?? null;
    return null;
  };

  const documents = [];
  const add = ({
    targetKind,
    targetId,
    title,
    subtitle = null,
    subjectIds = [],
    fields = {},
    sortAt,
  }) => {
    documents.push({
      targetKind,
      targetId,
      title,
      subtitle,
      subjectIds: [...new Set(subjectIds.filter(Boolean))],
      fields,
      sortAt,
    });
  };

  for (const subject of entities.subjects) {
    add({
      targetKind: "subject",
      targetId: subject.id,
      title: subject.title,
      subtitle: subject.code,
      subjectIds: [subject.id],
      fields: { title: subject.title, code: subject.code },
      sortAt: subject.updatedAt,
    });
  }
  for (const lecture of entities.lectures) {
    add({
      targetKind: "lecture",
      targetId: lecture.id,
      title: lecture.title,
      subtitle: subjects.get(lecture.subjectId)?.title ?? null,
      subjectIds: [lecture.subjectId],
      fields: {
        title: lecture.title,
        subject: subjects.get(lecture.subjectId)?.title,
      },
      sortAt: lecture.updatedAt,
    });
  }
  for (const task of entities.tasks) {
    add({
      targetKind: "task",
      targetId: task.id,
      title: task.title,
      subtitle: task.notes,
      subjectIds: [task.subjectId],
      fields: {
        title: task.title,
        notes: task.notes,
        subject: task.subjectId ? subjects.get(task.subjectId)?.title : null,
        lecture: task.lectureId ? lectures.get(task.lectureId)?.title : null,
      },
      sortAt: task.updatedAt,
    });
  }
  for (const artifact of entities.fileArtifacts) {
    const links = artifactLinks.get(artifact.id) ?? [];
    add({
      targetKind: "file-artifact",
      targetId: artifact.id,
      title: artifact.displayName,
      subtitle: artifact.originalName,
      subjectIds: links
        .map((link) => subjectContext(link.targetKind, link.targetId)),
      fields: {
        title: artifact.displayName,
        originalName: artifact.originalName,
        labels: links.map((link) => link.label).filter(Boolean).join(" "),
      },
      sortAt: artifact.updatedAt,
    });
  }
  for (const notebook of entities.notebooks) {
    add({
      targetKind: "notebook",
      targetId: notebook.id,
      title: notebook.title,
      subtitle: subjects.get(notebook.subjectId)?.title ?? null,
      subjectIds: [notebook.subjectId],
      fields: {
        title: notebook.title,
        subject: subjects.get(notebook.subjectId)?.title,
        lecture: notebook.lectureId ? lectures.get(notebook.lectureId)?.title : null,
      },
      sortAt: notebook.updatedAt,
    });
  }
  for (const note of entities.notes) {
    const artifact = note.artifactId
      ? entities.fileArtifacts.find((item) => item.id === note.artifactId)
      : null;
    add({
      targetKind: "note",
      targetId: note.id,
      title: note.title,
      subtitle: artifact?.displayName ?? subjects.get(note.subjectId)?.title ?? null,
      subjectIds: [note.subjectId],
      fields: {
        title: note.title,
        body: note.body,
        subject: subjects.get(note.subjectId)?.title,
        lecture: note.lectureId ? lectures.get(note.lectureId)?.title : null,
        artifact: artifact?.displayName,
      },
      sortAt: note.updatedAt,
    });
  }
  for (const capture of entities.lectureCaptures) {
    const lecture = lectures.get(capture.lectureId);
    add({
      targetKind: "lecture-capture",
      targetId: capture.id,
      title: capture.text,
      subtitle: lecture?.title ?? null,
      subjectIds: [lecture?.subjectId],
      fields: {
        text: capture.text,
        lecture: lecture?.title,
        subject: lecture ? subjects.get(lecture.subjectId)?.title : null,
        captureKind: capture.captureKind,
      },
      sortAt: capture.capturedAt,
    });
  }
  return documents;
}

export function buildLibraryIndex(snapshot) {
  const entities = requireSnapshot(snapshot);
  const markers = new Map(
    entities.resourceMarkers.map((marker) => [
      markerKey(marker.targetKind, marker.targetId),
      marker,
    ]),
  );
  return buildDocuments(entities).map((document) => {
    const marker = markers.get(markerKey(document.targetKind, document.targetId));
    return {
      ...document,
      isFavorite: marker?.isFavorite ?? false,
      favoriteAt: marker?.favoriteAt ?? null,
      lastOpenedAt: marker?.lastOpenedAt ?? null,
    };
  });
}

export function searchLibrary(snapshot, {
  query = "",
  targetKinds = null,
  subjectId = null,
  limit = 50,
} = {}) {
  const normalizedQuery = normalizeText(query);
  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
  const kinds = targetKindFilter(targetKinds);
  const normalizedSubjectId = subjectId
    ? assertStableId(subjectId, "subject")
    : null;
  const max = positiveLimit(limit);

  return buildLibraryIndex(snapshot)
    .map((document) => {
      if (kinds && !kinds.has(document.targetKind)) return null;
      if (normalizedSubjectId && !document.subjectIds.includes(normalizedSubjectId)) return null;
      const normalizedFields = Object.entries(document.fields)
        .map(([field, value]) => [field, normalizeText(value)])
        .filter(([, value]) => value);
      const matchedFields = normalizedFields
        .filter(([, value]) => tokens.every((token) => value.includes(token)))
        .map(([field]) => field);
      const combined = normalizedFields.map(([, value]) => value).join(" ");
      if (tokens.length > 0 && !tokens.every((token) => combined.includes(token))) {
        return null;
      }
      const normalizedTitle = normalizeText(document.title);
      const exactTitle = normalizedQuery && normalizedTitle === normalizedQuery;
      const prefixTitle = normalizedQuery && normalizedTitle.startsWith(normalizedQuery);
      const score = (exactTitle ? 100 : 0)
        + (prefixTitle ? 40 : 0)
        + (matchedFields.includes("title") || matchedFields.includes("text") ? 20 : 0)
        + matchedFields.length;
      return {
        kind: "library-search-result",
        targetKind: document.targetKind,
        targetId: document.targetId,
        title: document.title,
        subtitle: document.subtitle,
        subjectIds: document.subjectIds,
        matchedFields,
        score,
        isFavorite: document.isFavorite,
        favoriteAt: document.favoriteAt,
        lastOpenedAt: document.lastOpenedAt,
      };
    })
    .filter(Boolean)
    .sort((left, right) => (
      right.score - left.score
      || Number(right.isFavorite) - Number(left.isFavorite)
      || String(right.lastOpenedAt ?? "").localeCompare(String(left.lastOpenedAt ?? ""))
      || left.title.localeCompare(right.title, "ar")
      || left.targetId.localeCompare(right.targetId)
    ))
    .slice(0, max);
}

export function listFavoriteResources(snapshot, options = {}) {
  const limit = positiveLimit(options.limit ?? 50);
  return searchLibrary(snapshot, { ...options, query: "", limit: 500 })
    .filter((item) => item.isFavorite)
    .sort((left, right) => (
      String(right.favoriteAt).localeCompare(String(left.favoriteAt))
      || left.title.localeCompare(right.title, "ar")
    ))
    .slice(0, limit);
}

export function listRecentResources(snapshot, options = {}) {
  return searchLibrary(snapshot, { ...options, query: "", limit: 500 })
    .filter((item) => item.lastOpenedAt)
    .sort((left, right) => (
      right.lastOpenedAt.localeCompare(left.lastOpenedAt)
      || left.targetId.localeCompare(right.targetId)
    ))
    .slice(0, positiveLimit(options.limit ?? 20));
}
