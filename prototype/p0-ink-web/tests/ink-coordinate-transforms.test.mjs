import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  FIT_PADDING,
  MAX_SCALE,
  MIN_SCALE,
  clampScale,
  createPinchState,
  documentPointToView,
  fitDocumentInSurface,
  panViewport,
  updatePinchViewport,
  viewPointToDocument,
  zoomViewportAt,
} from "../ink-coordinate-transforms.mjs";

const DOCUMENT = { documentWidth: 1600, documentHeight: 1000 };
const ORIGIN_RECT = { left: 0, top: 0 };

function assertNumberClose(actual, expected, message) {
  assert.ok(
    Math.abs(actual - expected) <= 1e-10,
    `${message}: expected ${expected}, received ${actual}`,
  );
}

function assertTransformClose(actual, expected, message = "transform") {
  assertNumberClose(actual.scale, expected.scale, `${message}.scale`);
  assertNumberClose(actual.x, expected.x, `${message}.x`);
  assertNumberClose(actual.y, expected.y, `${message}.y`);
}

function assertPointClose(actual, expected, message = "point") {
  assertNumberClose(actual.x, expected.x, `${message}.x`);
  assertNumberClose(actual.y, expected.y, `${message}.y`);
}

test("coordinate transform module has no browser, storage, timer, or Core dependency", async () => {
  const source = await readFile(
    new URL("../ink-coordinate-transforms.mjs", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(
    source,
    /\b(?:window|document|PointerEvent|Canvas|localStorage|indexedDB|setTimeout|Studio5)\b/,
  );
  assert.doesNotMatch(source, /^\s*import\s/m);
});

test("coordinate transform defaults preserve current P0 limits and padding", () => {
  assert.equal(MIN_SCALE, 0.2);
  assert.equal(MAX_SCALE, 4);
  assert.equal(FIT_PADDING, 34);
});

const fitCases = [
  {
    name: "landscape surface",
    input: { ...DOCUMENT, surfaceWidth: 1200, surfaceHeight: 800 },
    expected: { scale: 0.7075, x: 34, y: 46.25 },
  },
  {
    name: "portrait surface",
    input: { ...DOCUMENT, surfaceWidth: 800, surfaceHeight: 1200 },
    expected: { scale: 0.4575, x: 34, y: 371.25 },
  },
  {
    name: "height-limited landscape surface",
    input: { ...DOCUMENT, surfaceWidth: 2000, surfaceHeight: 900 },
    expected: { scale: 0.832, x: 334.4, y: 34 },
  },
];

for (const fitCase of fitCases) {
  test(`fit centers the document with current padding: ${fitCase.name}`, () => {
    const result = fitDocumentInSurface(fitCase.input);
    assertTransformClose(result, fitCase.expected, fitCase.name);

    const rightMargin = fitCase.input.surfaceWidth
      - (result.x + fitCase.input.documentWidth * result.scale);
    const bottomMargin = fitCase.input.surfaceHeight
      - (result.y + fitCase.input.documentHeight * result.scale);
    assertNumberClose(rightMargin, result.x, `${fitCase.name}.horizontal centering`);
    assertNumberClose(bottomMargin, result.y, `${fitCase.name}.vertical centering`);
    assert.ok(result.x === FIT_PADDING || result.y === FIT_PADDING);
  });
}

const clampCases = [
  ["below minimum", 0.05, 0.2],
  ["at minimum", 0.2, 0.2],
  ["inside range", 1.75, 1.75],
  ["at maximum", 4, 4],
  ["above maximum", 9, 4],
  ["positive infinity", Infinity, 4],
  ["negative infinity", -Infinity, 0.2],
];

for (const [name, input, expected] of clampCases) {
  test(`scale clamp handles ${name}`, () => {
    assert.equal(clampScale(input), expected);
  });
}

test("scale clamp preserves legacy NaN propagation", () => {
  assert.ok(Number.isNaN(clampScale(Number.NaN)));
});

const zoomCases = [
  {
    name: "zoom in around center",
    viewport: { scale: 1, x: 100, y: 50 },
    factor: 1.5,
    focalPoint: { x: 500, y: 300 },
    expected: { scale: 1.5, x: -100, y: -75 },
  },
  {
    name: "zoom out around center",
    viewport: { scale: 1, x: 100, y: 50 },
    factor: 0.5,
    focalPoint: { x: 500, y: 300 },
    expected: { scale: 0.5, x: 300, y: 175 },
  },
  {
    name: "zoom around non-central point",
    viewport: { scale: 0.8, x: 24, y: -18 },
    factor: 1.25,
    focalPoint: { x: 143, y: 511 },
    expected: { scale: 1, x: -5.75, y: -150.25 },
  },
];

for (const zoomCase of zoomCases) {
  test(zoomCase.name, () => {
    assertTransformClose(
      zoomViewportAt(zoomCase.viewport, zoomCase.factor, zoomCase.focalPoint),
      zoomCase.expected,
      zoomCase.name,
    );
  });
}

test("focal zoom keeps the same document point under the focal view point", () => {
  const viewport = { scale: 0.75, x: 41, y: -26 };
  const focalPoint = { x: 377, y: 229 };
  const before = viewPointToDocument(focalPoint, viewport, ORIGIN_RECT);
  const afterViewport = zoomViewportAt(viewport, 1.7, focalPoint);
  const after = viewPointToDocument(focalPoint, afterViewport, ORIGIN_RECT);
  assertPointClose(after, before, "focal document point");
});

test("zoom clamps at the minimum scale without moving the focal document point", () => {
  const viewport = { scale: 0.25, x: 17, y: 22 };
  const focalPoint = { x: 333, y: 444 };
  const before = viewPointToDocument(focalPoint, viewport, ORIGIN_RECT);
  const result = zoomViewportAt(viewport, 0.01, focalPoint);
  assert.equal(result.scale, MIN_SCALE);
  assertPointClose(
    viewPointToDocument(focalPoint, result, ORIGIN_RECT),
    before,
    "minimum-clamped focal point",
  );
});

test("zoom clamps at the maximum scale without moving the focal document point", () => {
  const viewport = { scale: 3.5, x: -210, y: 88 };
  const focalPoint = { x: 81, y: 602 };
  const before = viewPointToDocument(focalPoint, viewport, ORIGIN_RECT);
  const result = zoomViewportAt(viewport, 3, focalPoint);
  assert.equal(result.scale, MAX_SCALE);
  assertPointClose(
    viewPointToDocument(focalPoint, result, ORIGIN_RECT),
    before,
    "maximum-clamped focal point",
  );
});

const panCases = [
  ["positive delta", { scale: 1, x: 10, y: 20 }, { x: 7, y: 9 }, { scale: 1, x: 17, y: 29 }],
  ["mixed delta", { scale: 0.6, x: -50, y: 80 }, { x: 13, y: -21 }, { scale: 0.6, x: -37, y: 59 }],
  ["zero delta", { scale: 4, x: 9, y: -3 }, { x: 0, y: 0 }, { scale: 4, x: 9, y: -3 }],
];

for (const [name, viewport, delta, expected] of panCases) {
  test(`pan applies ${name} without changing scale`, () => {
    assert.deepEqual(panViewport(viewport, delta), expected);
  });
}

test("view-to-document conversion removes rect offset, pan, and scale", () => {
  assertPointClose(
    viewPointToDocument(
      { x: 525, y: 360 },
      { scale: 2, x: 40, y: -20 },
      { left: 25, top: 30 },
    ),
    { x: 230, y: 175 },
  );
});

test("document-to-view conversion applies scale, pan, and rect offset", () => {
  assertPointClose(
    documentPointToView(
      { x: 230, y: 175 },
      { scale: 2, x: 40, y: -20 },
      { left: 25, top: 30 },
    ),
    { x: 525, y: 360 },
  );
});

const roundTripCases = [
  {
    viewport: { scale: 1, x: 0, y: 0 },
    rect: { left: 0, top: 0 },
    point: { x: 10, y: 20 },
  },
  {
    viewport: { scale: 0.2, x: 321, y: -147 },
    rect: { left: 19, top: 81 },
    point: { x: -50.5, y: 712.25 },
  },
  {
    viewport: { scale: 1.375, x: -832.25, y: 91.75 },
    rect: { left: 107, top: 43 },
    point: { x: 1600, y: 1000 },
  },
  {
    viewport: { scale: 4, x: 0.125, y: -0.875 },
    rect: { left: -20, top: 33 },
    point: { x: 0.001, y: 999.999 },
  },
];

for (const [index, roundTripCase] of roundTripCases.entries()) {
  test(`forward/inverse transform round trip ${index + 1}`, () => {
    const viewPoint = documentPointToView(
      roundTripCase.point,
      roundTripCase.viewport,
      roundTripCase.rect,
    );
    assertPointClose(
      viewPointToDocument(viewPoint, roundTripCase.viewport, roundTripCase.rect),
      roundTripCase.point,
      `round trip ${index + 1}`,
    );
  });
}

test("pinch initial state captures distance, center, and viewport", () => {
  assert.deepEqual(
    createPinchState({
      first: { x: 100, y: 200 },
      second: { x: 300, y: 200 },
      viewport: { scale: 0.75, x: 14, y: -8 },
    }),
    {
      distance: 200,
      center: { x: 200, y: 200 },
      scale: 0.75,
      x: 14,
      y: -8,
    },
  );
});

const pinchCases = [
  {
    name: "pinch zoom in",
    initial: [{ x: 100, y: 200 }, { x: 300, y: 200 }],
    current: [{ x: 0, y: 200 }, { x: 400, y: 200 }],
    expected: { scale: 2, x: -200, y: -200 },
  },
  {
    name: "pinch zoom out",
    initial: [{ x: 100, y: 200 }, { x: 300, y: 200 }],
    current: [{ x: 150, y: 200 }, { x: 250, y: 200 }],
    expected: { scale: 0.5, x: 100, y: 100 },
  },
  {
    name: "pinch center movement",
    initial: [{ x: 100, y: 200 }, { x: 300, y: 200 }],
    current: [{ x: 140, y: 270 }, { x: 340, y: 270 }],
    expected: { scale: 1, x: 40, y: 70 },
  },
];

for (const pinchCase of pinchCases) {
  test(pinchCase.name, () => {
    const pinchState = createPinchState({
      first: pinchCase.initial[0],
      second: pinchCase.initial[1],
      viewport: { scale: 1, x: 0, y: 0 },
    });
    assertTransformClose(
      updatePinchViewport(pinchState, {
        first: pinchCase.current[0],
        second: pinchCase.current[1],
      }),
      pinchCase.expected,
      pinchCase.name,
    );
  });
}

test("pinch keeps the initial focal document point under the moved center", () => {
  const viewport = { scale: 0.8, x: 17, y: -31 };
  const first = { x: 90, y: 140 };
  const second = { x: 310, y: 260 };
  const pinchState = createPinchState({ first, second, viewport });
  const initialDocumentPoint = viewPointToDocument(
    pinchState.center,
    viewport,
    ORIGIN_RECT,
  );
  const currentFirst = { x: 160, y: 210 };
  const currentSecond = { x: 490, y: 390 };
  const currentCenter = {
    x: (currentFirst.x + currentSecond.x) / 2,
    y: (currentFirst.y + currentSecond.y) / 2,
  };
  const result = updatePinchViewport(pinchState, {
    first: currentFirst,
    second: currentSecond,
  });
  assertPointClose(
    viewPointToDocument(currentCenter, result, ORIGIN_RECT),
    initialDocumentPoint,
    "pinch focal document point",
  );
});

test("pinch update preserves legacy minimum and maximum scale clamps", () => {
  const pinchState = createPinchState({
    first: { x: 0, y: 0 },
    second: { x: 100, y: 0 },
    viewport: { scale: 1, x: 0, y: 0 },
  });
  assert.equal(
    updatePinchViewport(pinchState, {
      first: { x: 49.9, y: 0 },
      second: { x: 50.1, y: 0 },
    }).scale,
    MIN_SCALE,
  );
  assert.equal(
    updatePinchViewport(pinchState, {
      first: { x: -1000, y: 0 },
      second: { x: 1100, y: 0 },
    }).scale,
    MAX_SCALE,
  );
});

test("invalid fit dimensions preserve legacy arithmetic instead of adding validation", () => {
  const negative = fitDocumentInSurface({
    ...DOCUMENT,
    surfaceWidth: 40,
    surfaceHeight: 20,
  });
  assert.equal(negative.scale, -0.048);
  assert.equal(negative.x, 58.4);
  assert.equal(negative.y, 34);

  const nonFinite = fitDocumentInSurface({
    ...DOCUMENT,
    surfaceWidth: Number.NaN,
    surfaceHeight: 800,
  });
  assert.ok(Number.isNaN(nonFinite.scale));
  assert.ok(Number.isNaN(nonFinite.x));
  assert.ok(Number.isNaN(nonFinite.y));
});

test("non-finite point input preserves legacy NaN propagation", () => {
  const result = viewPointToDocument(
    { x: Number.NaN, y: 10 },
    { scale: 1, x: 0, y: 0 },
    ORIGIN_RECT,
  );
  assert.ok(Number.isNaN(result.x));
  assert.equal(result.y, 10);
});

function legacyFit(input) {
  const scale = Math.min(
    (input.surfaceWidth - input.padding * 2) / input.documentWidth,
    (input.surfaceHeight - input.padding * 2) / input.documentHeight,
  );
  return {
    scale,
    x: (input.surfaceWidth - input.documentWidth * scale) / 2,
    y: (input.surfaceHeight - input.documentHeight * scale) / 2,
  };
}

function legacyZoom(viewport, factor, focalPoint) {
  const scale = Math.min(4, Math.max(0.2, viewport.scale * factor));
  const ratio = scale / viewport.scale;
  return {
    scale,
    x: focalPoint.x - (focalPoint.x - viewport.x) * ratio,
    y: focalPoint.y - (focalPoint.y - viewport.y) * ratio,
  };
}

function legacyPan(viewport, delta) {
  return {
    scale: viewport.scale,
    x: viewport.x + delta.x,
    y: viewport.y + delta.y,
  };
}

function legacyPointToDocument(point, viewport, rect) {
  return {
    x: (point.x - rect.left - viewport.x) / viewport.scale,
    y: (point.y - rect.top - viewport.y) / viewport.scale,
  };
}

function legacyPinchState(first, second, viewport) {
  return {
    distance: Math.hypot(second.x - first.x, second.y - first.y),
    center: { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 },
    scale: viewport.scale,
    x: viewport.x,
    y: viewport.y,
  };
}

function legacyPinchUpdate(pinchState, first, second) {
  const distance = Math.max(1, Math.hypot(second.x - first.x, second.y - first.y));
  const center = { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 };
  const scale = Math.min(
    4,
    Math.max(0.2, pinchState.scale * (distance / pinchState.distance)),
  );
  const ratio = scale / pinchState.scale;
  return {
    scale,
    x: center.x - (pinchState.center.x - pinchState.x) * ratio,
    y: center.y - (pinchState.center.y - pinchState.y) * ratio,
  };
}

test("golden parity: fit matches frozen legacy equations", () => {
  for (const fitCase of [
    { ...DOCUMENT, surfaceWidth: 1200, surfaceHeight: 800, padding: 34 },
    { ...DOCUMENT, surfaceWidth: 800, surfaceHeight: 1200, padding: 34 },
    { ...DOCUMENT, surfaceWidth: 40, surfaceHeight: 20, padding: 34 },
  ]) {
    assert.deepEqual(fitDocumentInSurface(fitCase), legacyFit(fitCase));
  }
});

test("golden parity: focal zoom matches frozen legacy equations", () => {
  for (const zoomCase of [
    [{ scale: 1, x: 0, y: 0 }, 1.1, { x: 500, y: 300 }],
    [{ scale: 0.21, x: 52, y: -17 }, 0.01, { x: 0, y: 0 }],
    [{ scale: 3.9, x: -400, y: 90 }, 8, { x: 901, y: 17 }],
    [{ scale: 1.25, x: 44, y: 31 }, 0.9, { x: 233, y: 411 }],
  ]) {
    assert.deepEqual(zoomViewportAt(...zoomCase), legacyZoom(...zoomCase));
  }
});

test("golden parity: pan matches frozen legacy equations", () => {
  for (const [viewport, delta] of panCases.map(([, viewport, delta]) => [viewport, delta])) {
    assert.deepEqual(panViewport(viewport, delta), legacyPan(viewport, delta));
  }
});

test("golden parity: inverse transform matches frozen legacy equations", () => {
  for (const roundTripCase of roundTripCases) {
    const viewPoint = documentPointToView(
      roundTripCase.point,
      roundTripCase.viewport,
      roundTripCase.rect,
    );
    assert.deepEqual(
      viewPointToDocument(viewPoint, roundTripCase.viewport, roundTripCase.rect),
      legacyPointToDocument(viewPoint, roundTripCase.viewport, roundTripCase.rect),
    );
  }
});

test("golden parity: pinch start and update match frozen legacy equations", () => {
  for (const pinchCase of pinchCases) {
    const viewport = { scale: 1, x: 0, y: 0 };
    const expectedState = legacyPinchState(
      pinchCase.initial[0],
      pinchCase.initial[1],
      viewport,
    );
    const state = createPinchState({
      first: pinchCase.initial[0],
      second: pinchCase.initial[1],
      viewport,
    });
    assert.deepEqual(state, expectedState);
    assert.deepEqual(
      updatePinchViewport(state, {
        first: pinchCase.current[0],
        second: pinchCase.current[1],
      }),
      legacyPinchUpdate(expectedState, pinchCase.current[0], pinchCase.current[1]),
    );
  }
});
