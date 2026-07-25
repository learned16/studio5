export const SCHEMA_VERSION = 1;
export const DOCUMENT_WIDTH = 1600;
export const DOCUMENT_HEIGHT = 1000;

export function createId(prefix = "id") {
  const value = globalThis.crypto?.randomUUID?.()
    ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${value}`;
}

export function createDocument(now = Date.now()) {
  return {
    schemaVersion: SCHEMA_VERSION,
    id: "p0-current",
    width: DOCUMENT_WIDTH,
    height: DOCUMENT_HEIGHT,
    createdAt: now,
    updatedAt: now,
    strokes: [],
  };
}

export function createStroke({ color, baseWidth, pointerType, now = Date.now() }) {
  return {
    id: createId("stroke"),
    color,
    baseWidth,
    pointerType,
    createdAt: now,
    points: [],
  };
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function pressureOrDefault(pressure) {
  return pressure > 0 ? clamp(pressure, 0.05, 1) : 0.5;
}

export function appendPoint(stroke, point) {
  const next = {
    x: Number(point.x),
    y: Number(point.y),
    pressure: pressureOrDefault(Number(point.pressure)),
    time: Number(point.time ?? Date.now()),
  };
  const previous = stroke.points.at(-1);
  if (previous && Math.hypot(previous.x - next.x, previous.y - next.y) < 0.35) {
    return false;
  }
  stroke.points.push(next);
  return true;
}

export function pointToDocument(clientPoint, viewport, rect) {
  return {
    x: (clientPoint.x - rect.left - viewport.x) / viewport.scale,
    y: (clientPoint.y - rect.top - viewport.y) / viewport.scale,
  };
}

export function widthForPoint(stroke, point) {
  return stroke.baseWidth * (0.38 + pressureOrDefault(point.pressure) * 1.12);
}

export function distanceToSegment(point, start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  if (dx === 0 && dy === 0) {
    return Math.hypot(point.x - start.x, point.y - start.y);
  }
  const t = clamp(
    ((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy),
    0,
    1,
  );
  return Math.hypot(point.x - (start.x + t * dx), point.y - (start.y + t * dy));
}

export function strokeHits(stroke, point, radius) {
  if (!stroke.points.length) return false;
  if (stroke.points.length === 1) {
    return Math.hypot(stroke.points[0].x - point.x, stroke.points[0].y - point.y) <= radius;
  }
  for (let index = 1; index < stroke.points.length; index += 1) {
    if (distanceToSegment(point, stroke.points[index - 1], stroke.points[index]) <= radius) {
      return true;
    }
  }
  return false;
}

export function migrateDocument(input) {
  if (!input || typeof input !== "object") return createDocument();
  if (input.schemaVersion !== SCHEMA_VERSION) {
    throw new Error(`Unsupported document schema: ${input.schemaVersion}`);
  }
  return {
    ...input,
    width: Number(input.width || DOCUMENT_WIDTH),
    height: Number(input.height || DOCUMENT_HEIGHT),
    strokes: Array.isArray(input.strokes) ? input.strokes : [],
  };
}

export function mergePendingOperation(document, journal) {
  if (!journal || journal.documentId !== document.id) return document;
  const next = structuredClone(document);

  if (journal.type === "stroke" && journal.stroke?.id) {
    const index = next.strokes.findIndex((stroke) => stroke.id === journal.stroke.id);
    if (index >= 0) {
      if (journal.stroke.points.length >= next.strokes[index].points.length) {
        next.strokes[index] = journal.stroke;
      }
    } else {
      next.strokes.push(journal.stroke);
    }
  }

  if (journal.type === "delete" && Array.isArray(journal.strokeIds)) {
    const removed = new Set(journal.strokeIds);
    next.strokes = next.strokes.filter((stroke) => !removed.has(stroke.id));
  }

  next.updatedAt = Math.max(Number(next.updatedAt || 0), Number(journal.savedAt || 0));
  return next;
}

export function documentStats(document) {
  return {
    strokes: document.strokes.length,
    points: document.strokes.reduce((sum, stroke) => sum + stroke.points.length, 0),
  };
}

export function exportManifest(document, now = Date.now()) {
  const stats = documentStats(document);
  return {
    product: "Studio5",
    prototype: "P0 Ink Web Candidate A",
    appVersion: "0.1.0",
    schemaVersion: SCHEMA_VERSION,
    documentId: document.id,
    documentSize: { width: document.width, height: document.height },
    strokeCount: stats.strokes,
    pointCount: stats.points,
    exportedAt: now,
  };
}
