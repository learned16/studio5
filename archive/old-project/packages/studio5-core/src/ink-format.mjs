import { assertStableId } from "./ids.mjs";
import { INK_FORMAT_VERSION } from "./model.mjs";
import { sha256Hex } from "./file-intake.mjs";

function requiredText(value, field) {
  const normalized = String(value ?? "").trim();
  if (!normalized) throw new TypeError(`${field} is required`);
  return normalized;
}

function finiteNumber(value, field) {
  const normalized = Number(value);
  if (!Number.isFinite(normalized)) throw new TypeError(`${field} must be finite`);
  return normalized;
}

function normalizeLayer(layer, index) {
  if (!layer || typeof layer !== "object" || Array.isArray(layer)) {
    throw new TypeError(`layers[${index}] must be an object`);
  }
  return {
    id: requiredText(layer.id, `layers[${index}].id`),
    name: requiredText(layer.name ?? `Layer ${index + 1}`, `layers[${index}].name`),
    visible: layer.visible !== false,
    locked: layer.locked === true,
  };
}

function normalizePoint(point, strokeIndex, pointIndex) {
  if (!point || typeof point !== "object" || Array.isArray(point)) {
    throw new TypeError(`strokes[${strokeIndex}].points[${pointIndex}] must be an object`);
  }
  const pressure = point.pressure === null || point.pressure === undefined
    ? null
    : finiteNumber(point.pressure, `strokes[${strokeIndex}].points[${pointIndex}].pressure`);
  if (pressure !== null && (pressure < 0 || pressure > 1)) {
    throw new TypeError("Ink point pressure must be between 0 and 1");
  }
  return {
    x: finiteNumber(point.x, `strokes[${strokeIndex}].points[${pointIndex}].x`),
    y: finiteNumber(point.y, `strokes[${strokeIndex}].points[${pointIndex}].y`),
    pressure,
    time: finiteNumber(
      point.time ?? pointIndex,
      `strokes[${strokeIndex}].points[${pointIndex}].time`,
    ),
  };
}

function normalizeStroke(stroke, index, layerIds, defaultLayerId) {
  if (!stroke || typeof stroke !== "object" || Array.isArray(stroke)) {
    throw new TypeError(`strokes[${index}] must be an object`);
  }
  const layerId = requiredText(
    stroke.layerId ?? defaultLayerId,
    `strokes[${index}].layerId`,
  );
  if (!layerIds.has(layerId)) {
    throw new TypeError(`strokes[${index}].layerId references a missing layer`);
  }
  const baseWidth = finiteNumber(stroke.baseWidth, `strokes[${index}].baseWidth`);
  if (baseWidth <= 0) throw new TypeError("Ink stroke baseWidth must be positive");
  const points = Array.isArray(stroke.points)
    ? stroke.points.map((point, pointIndex) => normalizePoint(point, index, pointIndex))
    : null;
  if (!points?.length) throw new TypeError(`strokes[${index}].points is required`);
  return {
    id: requiredText(stroke.id, `strokes[${index}].id`),
    layerId,
    color: requiredText(stroke.color, `strokes[${index}].color`),
    baseWidth,
    pointerType: requiredText(stroke.pointerType ?? "pen", `strokes[${index}].pointerType`),
    points,
  };
}

export async function prepareInkSnapshot(input, options = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError("Ink snapshot input must be an object");
  }
  const documentId = assertStableId(input.documentId, "ink-document");
  const sourceLayers = Array.isArray(input.layers) && input.layers.length
    ? input.layers
    : [{ id: "layer-1", name: "Layer 1" }];
  const layers = sourceLayers.map(normalizeLayer);
  const layerIds = new Set(layers.map(({ id }) => id));
  if (layerIds.size !== layers.length) throw new TypeError("Ink layer IDs must be unique");
  const strokes = (input.strokes ?? []).map((stroke, index) => (
    normalizeStroke(stroke, index, layerIds, layers[0].id)
  ));
  if (new Set(strokes.map(({ id }) => id)).size !== strokes.length) {
    throw new TypeError("Ink stroke IDs must be unique");
  }
  const snapshot = {
    formatVersion: INK_FORMAT_VERSION,
    documentId,
    layers,
    strokes,
  };
  const bytes = new TextEncoder().encode(JSON.stringify(snapshot));
  const digest = await sha256Hex(bytes, options);
  return {
    snapshot,
    bytes,
    digest,
    algorithm: "sha-256",
    storageKey: `sha256/${digest}`,
    byteSize: bytes.byteLength,
    layerCount: layers.length,
    strokeCount: strokes.length,
    pointCount: strokes.reduce((total, stroke) => total + stroke.points.length, 0),
  };
}

export function parseInkSnapshot(bytes, expectedDocumentId = null) {
  const view = bytes instanceof ArrayBuffer
    ? new Uint8Array(bytes)
    : new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let parsed;
  try {
    parsed = JSON.parse(new TextDecoder().decode(view));
  } catch (error) {
    throw new TypeError("Ink snapshot contains invalid JSON", { cause: error });
  }
  if (parsed?.formatVersion !== INK_FORMAT_VERSION) {
    throw new TypeError(`Unsupported ink format version: ${parsed?.formatVersion}`);
  }
  if (expectedDocumentId && parsed.documentId !== expectedDocumentId) {
    throw new TypeError("Ink snapshot documentId does not match its revision");
  }
  return structuredClone(parsed);
}
