import assert from "node:assert/strict";
import test from "node:test";
import {
  appendPoint,
  createDocument,
  createStroke,
  distanceToSegment,
  documentStats,
  exportManifest,
  mergePendingOperation,
  migrateDocument,
  pointToDocument,
  pressureOrDefault,
  strokeHits,
} from "../ink-core.mjs";

test("pressure keeps real values and provides a safe default", () => {
  assert.equal(pressureOrDefault(0), 0.5);
  assert.equal(pressureOrDefault(0.2), 0.2);
  assert.equal(pressureOrDefault(2), 1);
});

test("appendPoint rejects noise while keeping meaningful points", () => {
  const stroke = createStroke({ color: "#000", baseWidth: 5, pointerType: "pen", now: 1 });
  assert.equal(appendPoint(stroke, { x: 10, y: 10, pressure: 0.4, time: 2 }), true);
  assert.equal(appendPoint(stroke, { x: 10.1, y: 10.1, pressure: 0.4, time: 3 }), false);
  assert.equal(appendPoint(stroke, { x: 12, y: 12, pressure: 0.7, time: 4 }), true);
  assert.equal(stroke.points.length, 2);
});

test("view coordinates survive zoom and pan conversion", () => {
  const point = pointToDocument(
    { x: 340, y: 250 },
    { scale: 2, x: 40, y: 50 },
    { left: 0, top: 0 },
  );
  assert.deepEqual(point, { x: 150, y: 100 });
});

test("eraser hit testing works for stroke segments", () => {
  const stroke = {
    points: [{ x: 0, y: 0 }, { x: 100, y: 0 }],
  };
  assert.equal(distanceToSegment({ x: 50, y: 5 }, stroke.points[0], stroke.points[1]), 5);
  assert.equal(strokeHits(stroke, { x: 50, y: 6 }, 7), true);
  assert.equal(strokeHits(stroke, { x: 50, y: 20 }, 7), false);
});

test("crash journal restores a pending stroke without duplication", () => {
  const document = createDocument(1);
  const pending = createStroke({ color: "#000", baseWidth: 5, pointerType: "pen", now: 2 });
  appendPoint(pending, { x: 1, y: 1, pressure: 0.5, time: 3 });
  const recovered = mergePendingOperation(document, {
    type: "stroke",
    documentId: document.id,
    savedAt: 4,
    stroke: pending,
  });
  assert.equal(recovered.strokes.length, 1);
  const recoveredAgain = mergePendingOperation(recovered, {
    type: "stroke",
    documentId: document.id,
    savedAt: 5,
    stroke: pending,
  });
  assert.equal(recoveredAgain.strokes.length, 1);
});

test("schema migration rejects unknown data versions", () => {
  assert.throws(() => migrateDocument({ schemaVersion: 99 }), /Unsupported/);
});

test("export manifest matches document statistics", () => {
  const document = createDocument(1);
  const stroke = createStroke({ color: "#000", baseWidth: 5, pointerType: "pen", now: 2 });
  appendPoint(stroke, { x: 1, y: 1, pressure: 0.5, time: 3 });
  document.strokes.push(stroke);
  assert.deepEqual(documentStats(document), { strokes: 1, points: 1 });
  const manifest = exportManifest(document, 10);
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.strokeCount, 1);
  assert.equal(manifest.pointCount, 1);
});
