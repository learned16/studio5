import assert from "node:assert/strict";
import test from "node:test";
import {
  appendPoint,
  createDocument,
  createStroke,
  distanceToSegment,
  documentStats,
  eraseStrokeAt,
  exportManifest,
  mergePendingOperation,
  migrateDocument,
  pointerIntent,
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

test("touch is ignored outside the explicit hand tool", () => {
  assert.equal(
    pointerIntent({ tool: "pen", pointerType: "touch", allowTouchDrawing: false }),
    "ignore",
  );
  assert.equal(
    pointerIntent({ tool: "eraser", pointerType: "touch", allowTouchDrawing: false }),
    "ignore",
  );
  assert.equal(
    pointerIntent({ tool: "hand", pointerType: "touch", allowTouchDrawing: false }),
    "navigate",
  );
  assert.equal(
    pointerIntent({ tool: "pen", pointerType: "pen", allowTouchDrawing: false }),
    "draw",
  );
});

test("eraser hit testing works for stroke segments", () => {
  const stroke = {
    points: [{ x: 0, y: 0 }, { x: 100, y: 0 }],
  };
  assert.equal(distanceToSegment({ x: 50, y: 5 }, stroke.points[0], stroke.points[1]), 5);
  assert.equal(strokeHits(stroke, { x: 50, y: 6 }, 7), true);
  assert.equal(strokeHits(stroke, { x: 50, y: 20 }, 7), false);
});

test("segment eraser keeps both sides of one continuous stroke", () => {
  const stroke = {
    id: "stroke-original",
    color: "#000",
    baseWidth: 5,
    pointerType: "pen",
    createdAt: 1,
    points: [
      { x: 0, y: 0, pressure: 0.5, time: 1 },
      { x: 100, y: 0, pressure: 0.5, time: 2 },
    ],
  };
  const fragments = eraseStrokeAt(stroke, { x: 50, y: 0 }, 10);
  assert.equal(fragments.length, 2);
  assert.ok(fragments[0].points.at(-1).x < 50);
  assert.ok(fragments[1].points[0].x > 50);
  assert.ok(fragments.flatMap((fragment) => fragment.points).length > 2);
});

test("segment eraser trims an end without deleting the remaining line", () => {
  const stroke = {
    id: "stroke-original",
    color: "#000",
    baseWidth: 5,
    pointerType: "pen",
    createdAt: 1,
    points: [
      { x: 0, y: 0, pressure: 0.5, time: 1 },
      { x: 100, y: 0, pressure: 0.5, time: 2 },
    ],
  };
  const fragments = eraseStrokeAt(stroke, { x: 100, y: 0 }, 10);
  assert.equal(fragments.length, 1);
  assert.ok(fragments[0].points.at(-1).x < 100);
  assert.ok(fragments[0].points[0].x === 0);
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

test("snapshot journal restores partial eraser results", () => {
  const document = createDocument(1);
  document.strokes = [{ id: "old", points: [{ x: 0, y: 0 }] }];
  const replacement = [{ id: "fragment", points: [{ x: 10, y: 10 }] }];
  const recovered = mergePendingOperation(document, {
    type: "snapshot",
    documentId: document.id,
    savedAt: 5,
    strokes: replacement,
  });
  assert.deepEqual(recovered.strokes, replacement);
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
