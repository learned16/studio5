import { performance } from "node:perf_hooks";

import {
  documentPointToView,
  prepareDocumentToViewTransformInto,
} from "../ink-coordinate-transforms.mjs";

const SIZES = [1_000, 10_000, 50_000, 100_000];
const ROUNDS = 15;
const VIEWPORT = { scale: 1.375, x: -183.25, y: 72.5 };

function pointsFor(segments) {
  return Array.from({ length: segments + 1 }, (_, index) => ({
    x: (index * 17) % 1600 + index / 1000,
    y: (index * 31) % 1000 + index / 2000,
  }));
}

function legacyInline(points, viewport) {
  let checksum = 0;
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    checksum += viewport.x + previous.x * viewport.scale;
    checksum += viewport.y + previous.y * viewport.scale;
    checksum += viewport.x + current.x * viewport.scale;
    checksum += viewport.y + current.y * viewport.scale;
  }
  return checksum;
}

function extractedBeforeFix(points, viewport) {
  let checksum = 0;
  for (let index = 1; index < points.length; index += 1) {
    const previous = documentPointToView(points[index - 1], viewport);
    const current = documentPointToView(points[index], viewport);
    checksum += previous.x + previous.y + current.x + current.y;
  }
  return checksum;
}

function optimizedAllocationFree(points, viewport) {
  const prepared = { scale: 1, x: 0, y: 0 };
  prepareDocumentToViewTransformInto(viewport, prepared);
  const scale = prepared.scale;
  const offsetX = prepared.x;
  const offsetY = prepared.y;
  let previousX = offsetX + points[0].x * scale;
  let previousY = offsetY + points[0].y * scale;
  let checksum = 0;
  for (let index = 1; index < points.length; index += 1) {
    const currentX = offsetX + points[index].x * scale;
    const currentY = offsetY + points[index].y * scale;
    checksum += previousX + previousY + currentX + currentY;
    previousX = currentX;
    previousY = currentY;
  }
  return checksum;
}

const implementations = [
  ["legacy", legacyInline],
  ["before", extractedBeforeFix],
  ["optimized", optimizedAllocationFree],
];

function measure(implementation, points, repetitions) {
  const started = performance.now();
  let checksum = 0;
  for (let repetition = 0; repetition < repetitions; repetition += 1) {
    checksum += implementation(points, VIEWPORT);
  }
  return { checksum, elapsed: performance.now() - started };
}

const results = [];
for (const segments of SIZES) {
  const points = pointsFor(segments);
  const repetitions = Math.max(10, Math.ceil(1_000_000 / segments));
  for (let warmup = 0; warmup < 10; warmup += 1) {
    for (const [, implementation] of implementations) implementation(points, VIEWPORT);
  }
  const samples = Object.fromEntries(implementations.map(([name]) => [name, []]));
  let expectedChecksum = null;
  for (let round = 0; round < ROUNDS; round += 1) {
    const order = implementations.map((_, index) => implementations[(round + index) % implementations.length]);
    for (const [name, implementation] of order) {
      const result = measure(implementation, points, repetitions);
      expectedChecksum ??= result.checksum;
      if (Math.abs(result.checksum - expectedChecksum) > 1e-6) {
        throw new Error(`${name} checksum differs at ${segments} segments`);
      }
      samples[name].push(result.elapsed);
    }
  }
  const averages = Object.fromEntries(Object.entries(samples).map(([name, values]) => [
    name,
    values.reduce((sum, value) => sum + value, 0) / values.length,
  ]));
  results.push({
    segments,
    legacyMs: averages.legacy,
    beforeMs: averages.before,
    optimizedMs: averages.optimized,
    beforeVsLegacyPercent: (averages.before / averages.legacy - 1) * 100,
    optimizedVsLegacyPercent: (averages.optimized / averages.legacy - 1) * 100,
  });
}

console.table(results.map((result) => ({
  segments: result.segments,
  "legacy ms": result.legacyMs.toFixed(3),
  "before ms": result.beforeMs.toFixed(3),
  "optimized ms": result.optimizedMs.toFixed(3),
  "before vs legacy": `${result.beforeVsLegacyPercent.toFixed(1)}%`,
  "optimized vs legacy": `${result.optimizedVsLegacyPercent.toFixed(1)}%`,
})));

const largeResults = results.filter(({ segments }) => segments >= 50_000);
if (largeResults.every(({ optimizedVsLegacyPercent }) => optimizedVsLegacyPercent > 15)) {
  process.exitCode = 1;
  console.error("Optimized transform path remained consistently over 15% slower on large inputs.");
}
