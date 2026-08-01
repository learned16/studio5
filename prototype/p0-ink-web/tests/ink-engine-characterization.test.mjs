import assert from "node:assert/strict";
import test from "node:test";
import { AcademicRepository } from "../../../packages/studio5-core/src/academic-repository.mjs";
import { prepareInkSnapshot, parseInkSnapshot } from "../../../packages/studio5-core/src/ink-format.mjs";
import { CoreLocalDatabase } from "../../../packages/studio5-core/src/local-database.mjs";
import { MemoryCoreDriver } from "../../../packages/studio5-core/tests/helpers/memory-driver.mjs";
import {
  MemoryFileContentStore,
} from "../../../packages/studio5-core/tests/helpers/memory-file-content-store.mjs";
import {
  DOCUMENT_HEIGHT,
  DOCUMENT_WIDTH,
  appendPoint,
  createDocument,
  createStroke,
  eraseStrokeAt,
  mergePendingOperation,
  migrateDocument,
  pointToDocument,
  pointerIntent,
  pressureOrDefault,
  widthForPoint,
} from "../ink-core.mjs";
import { createNotebookDemo } from "../notebook-bridge.mjs";
import {
  clearJournal,
  loadDocument,
  saveDocument,
  writeDeleteJournal,
  writeSnapshotJournal,
  writeStrokeJournal,
} from "../storage.mjs";

const FALLBACK_KEY = "studio5-p0-document";
const JOURNAL_KEY = "studio5-p0-journal";

function sampleStroke(id = "stroke-a", offset = 0) {
  return {
    id,
    color: "#14221c",
    baseWidth: 5,
    pointerType: "pen",
    createdAt: 20,
    points: [
      { x: offset, y: 2, pressure: 0.25, time: 21 },
      { x: offset + 100, y: 2, pressure: 0.75, time: 31 },
    ],
  };
}

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    removeItem(key) {
      values.delete(key);
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    snapshot() {
      return Object.fromEntries(values);
    },
  };
}

async function withFallbackStorage(storage, operation) {
  const localStorageDescriptor = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  const indexedDbDescriptor = Object.getOwnPropertyDescriptor(globalThis, "indexedDB");
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: storage,
  });
  delete globalThis.indexedDB;
  try {
    return await operation();
  } finally {
    if (localStorageDescriptor) {
      Object.defineProperty(globalThis, "localStorage", localStorageDescriptor);
    } else {
      delete globalThis.localStorage;
    }
    if (indexedDbDescriptor) {
      Object.defineProperty(globalThis, "indexedDB", indexedDbDescriptor);
    } else {
      delete globalThis.indexedDB;
    }
  }
}

function repositoryFixture() {
  let clock = Date.parse("2026-08-01T09:00:00Z");
  const driver = new MemoryCoreDriver();
  const fileContentStore = new MemoryFileContentStore();
  const createRepository = () => new AcademicRepository(
    new CoreLocalDatabase(driver, { now: () => clock++ }),
    {
      now: () => clock++,
      fileContentStore,
    },
  );
  return { createRepository, fileContentStore };
}

test("new documents use the current stable reference and vector document shape", () => {
  const document = createDocument(10);

  assert.deepEqual(document, {
    schemaVersion: 1,
    id: "p0-current",
    width: DOCUMENT_WIDTH,
    height: DOCUMENT_HEIGHT,
    createdAt: 10,
    updatedAt: 10,
    strokes: [],
  });
  assert.equal("bitmap" in document, false);
  assert.equal("canvas" in document, false);
  assert.equal("dataUrl" in document, false);
});

test("stroke creation preserves input metadata and starts with no samples", () => {
  const stroke = createStroke({
    color: "#123456",
    baseWidth: 7,
    pointerType: "pen",
    now: 12,
  });

  assert.match(stroke.id, /^stroke-/);
  assert.deepEqual(
    {
      color: stroke.color,
      baseWidth: stroke.baseWidth,
      pointerType: stroke.pointerType,
      createdAt: stroke.createdAt,
      points: stroke.points,
    },
    {
      color: "#123456",
      baseWidth: 7,
      pointerType: "pen",
      createdAt: 12,
      points: [],
    },
  );
});

test("pointer samples normalize numeric fields before entering a stroke", () => {
  const stroke = sampleStroke();
  stroke.points = [];

  assert.equal(appendPoint(stroke, {
    x: "12.5",
    y: "18",
    pressure: "0.6",
    time: "30",
  }), true);
  assert.deepEqual(stroke.points[0], {
    x: 12.5,
    y: 18,
    pressure: 0.6,
    time: 30,
  });
});

test("pressure fallback and clamps are stable at current boundaries", () => {
  assert.equal(pressureOrDefault(Number.NaN), 0.5);
  assert.equal(pressureOrDefault(-1), 0.5);
  assert.equal(pressureOrDefault(0), 0.5);
  assert.equal(pressureOrDefault(0.01), 0.05);
  assert.equal(pressureOrDefault(0.4), 0.4);
  assert.equal(pressureOrDefault(1.4), 1);
});

test("render width remains a deterministic function of base width and pressure", () => {
  const stroke = sampleStroke();

  assert.equal(widthForPoint(stroke, { pressure: 0 }), 4.7);
  assert.equal(widthForPoint(stroke, { pressure: 0.5 }), 4.7);
  assert.equal(widthForPoint(stroke, { pressure: 1 }), 7.5);
});

test("document coordinates stay invariant across equivalent zoom and pan viewports", () => {
  const rect = { left: 25, top: 40 };
  const first = pointToDocument(
    { x: 25 + 15 + 80 * 1.5, y: 40 - 10 + 30 * 1.5 },
    { scale: 1.5, x: 15, y: -10 },
    rect,
  );
  const second = pointToDocument(
    { x: 25 - 50 + 80 * 3, y: 40 + 75 + 30 * 3 },
    { scale: 3, x: -50, y: 75 },
    rect,
  );

  assert.deepEqual(first, { x: 80, y: 30 });
  assert.deepEqual(second, first);
});

test("input intent keeps navigation, palm rejection, erasing, and drawing distinct", () => {
  assert.equal(pointerIntent({
    tool: "hand",
    pointerType: "touch",
    allowTouchDrawing: false,
  }), "navigate");
  assert.equal(pointerIntent({
    tool: "pen",
    pointerType: "touch",
    allowTouchDrawing: false,
  }), "ignore");
  assert.equal(pointerIntent({
    tool: "pen",
    pointerType: "touch",
    allowTouchDrawing: true,
  }), "draw");
  assert.equal(pointerIntent({
    tool: "eraser",
    pointerType: "pen",
    allowTouchDrawing: false,
  }), "erase");
  assert.equal(pointerIntent({
    tool: "pen",
    pointerType: "mouse",
    allowTouchDrawing: false,
  }), "draw");
});

test("stroke data survives document JSON serialization and parsing", () => {
  const document = createDocument(1);
  document.strokes.push(sampleStroke());

  const parsed = migrateDocument(JSON.parse(JSON.stringify(document)));

  assert.deepEqual(parsed, document);
  assert.deepEqual(parsed.strokes[0].points, document.strokes[0].points);
});

test("document migration restores numeric defaults without replacing stroke data", () => {
  const strokes = [sampleStroke()];
  const migrated = migrateDocument({
    schemaVersion: 1,
    id: "p0-current",
    width: 0,
    height: null,
    strokes,
  });

  assert.equal(migrated.width, DOCUMENT_WIDTH);
  assert.equal(migrated.height, DOCUMENT_HEIGHT);
  assert.equal(migrated.strokes, strokes);
});

test("a journal for another document cannot change the current document", () => {
  const document = createDocument(1);
  const journal = {
    type: "snapshot",
    documentId: "another-document",
    savedAt: 99,
    strokes: [sampleStroke()],
  };

  assert.equal(mergePendingOperation(document, journal), document);
});

test("stroke recovery keeps the longest known sample sequence and avoids duplicates", () => {
  const document = createDocument(1);
  document.strokes = [sampleStroke()];
  const shorter = { ...sampleStroke(), points: [sampleStroke().points[0]] };
  const longer = {
    ...sampleStroke(),
    points: [...sampleStroke().points, { x: 120, y: 2, pressure: 1, time: 40 }],
  };

  const unchanged = mergePendingOperation(document, {
    type: "stroke",
    documentId: document.id,
    savedAt: 10,
    stroke: shorter,
  });
  const recovered = mergePendingOperation(unchanged, {
    type: "stroke",
    documentId: document.id,
    savedAt: 11,
    stroke: longer,
  });

  assert.equal(unchanged.strokes[0].points.length, 2);
  assert.equal(recovered.strokes.length, 1);
  assert.equal(recovered.strokes[0].points.length, 3);
  assert.equal(recovered.updatedAt, 11);
});

test("delete recovery removes only the referenced stroke IDs", () => {
  const document = createDocument(1);
  document.strokes = [sampleStroke("keep"), sampleStroke("remove", 200)];

  const recovered = mergePendingOperation(document, {
    type: "delete",
    documentId: document.id,
    savedAt: 5,
    strokeIds: ["remove"],
  });

  assert.deepEqual(recovered.strokes.map(({ id }) => id), ["keep"]);
  assert.equal(document.strokes.length, 2);
});

test("snapshot recovery deep-clones the replacement stroke state", () => {
  const document = createDocument(1);
  const replacement = [sampleStroke("replacement")];
  const recovered = mergePendingOperation(document, {
    type: "snapshot",
    documentId: document.id,
    savedAt: 7,
    strokes: replacement,
  });
  replacement[0].points[0].x = 999;

  assert.equal(recovered.strokes[0].points[0].x, 0);
  assert.equal(document.strokes.length, 0);
});

test("segment eraser preserves exact stroke identity when there is no hit", () => {
  const stroke = sampleStroke();
  const fragments = eraseStrokeAt(stroke, { x: 50, y: 100 }, 5);

  assert.equal(fragments.length, 1);
  assert.equal(fragments[0], stroke);
});

test("segment eraser can remove an entire stroke", () => {
  const stroke = sampleStroke();
  const fragments = eraseStrokeAt(stroke, { x: 50, y: 2 }, 60);

  assert.deepEqual(fragments, []);
});

test("segment eraser creates new vector fragments while preserving stroke metadata", () => {
  const stroke = sampleStroke();
  const fragments = eraseStrokeAt(stroke, { x: 50, y: 2 }, 8);

  assert.equal(fragments.length, 2);
  for (const fragment of fragments) {
    assert.match(fragment.id, /^stroke-/);
    assert.notEqual(fragment.id, stroke.id);
    assert.equal(fragment.color, stroke.color);
    assert.equal(fragment.baseWidth, stroke.baseWidth);
    assert.equal(fragment.pointerType, stroke.pointerType);
    assert.ok(fragment.points.every(({ pressure }) => pressure >= 0.25 && pressure <= 0.75));
  }
});

test("autosave fallback stores the complete vector document payload", async () => {
  const storage = memoryStorage();
  const document = createDocument(1);
  document.strokes.push(sampleStroke());

  await withFallbackStorage(storage, async () => {
    assert.equal(await saveDocument(document), "LocalStorage fallback");
  });

  const payload = JSON.parse(storage.snapshot()[FALLBACK_KEY]);
  assert.deepEqual(payload, document);
  assert.equal(Array.isArray(payload.strokes), true);
  assert.equal("bitmap" in payload, false);
  assert.equal("canvas" in payload, false);
  assert.equal(JSON.stringify(payload).includes("data:image"), false);
});

test("emergency journal writers preserve their current payload structures", async () => {
  const storage = memoryStorage();
  const stroke = sampleStroke();

  await withFallbackStorage(storage, async () => {
    writeStrokeJournal("p0-current", stroke);
    const strokeEntry = JSON.parse(storage.snapshot()[JOURNAL_KEY]);
    assert.equal(strokeEntry.schemaVersion, 1);
    assert.equal(strokeEntry.type, "stroke");
    assert.equal(strokeEntry.documentId, "p0-current");
    assert.deepEqual(strokeEntry.stroke, stroke);
    assert.equal(typeof strokeEntry.savedAt, "number");

    writeDeleteJournal("p0-current", ["stroke-a", "stroke-b"]);
    const deleteEntry = JSON.parse(storage.snapshot()[JOURNAL_KEY]);
    assert.deepEqual(
      {
        schemaVersion: deleteEntry.schemaVersion,
        type: deleteEntry.type,
        documentId: deleteEntry.documentId,
        strokeIds: deleteEntry.strokeIds,
      },
      {
        schemaVersion: 1,
        type: "delete",
        documentId: "p0-current",
        strokeIds: ["stroke-a", "stroke-b"],
      },
    );

    writeSnapshotJournal("p0-current", [stroke]);
    const snapshotEntry = JSON.parse(storage.snapshot()[JOURNAL_KEY]);
    assert.equal(snapshotEntry.type, "snapshot");
    assert.deepEqual(snapshotEntry.strokes, [stroke]);
  });
});

test("fallback reopen combines the saved document with the pending journal", async () => {
  const document = createDocument(1);
  document.strokes = [sampleStroke("saved")];
  const pending = sampleStroke("pending", 200);
  const storage = memoryStorage({
    [FALLBACK_KEY]: JSON.stringify(document),
    [JOURNAL_KEY]: JSON.stringify({
      schemaVersion: 1,
      type: "stroke",
      documentId: document.id,
      savedAt: 15,
      stroke: pending,
    }),
  });

  const loaded = await withFallbackStorage(storage, () => loadDocument());

  assert.equal(loaded.storageMode, "LocalStorage fallback");
  assert.equal(loaded.recovered, true);
  assert.deepEqual(loaded.document.strokes.map(({ id }) => id), ["saved", "pending"]);
  assert.equal(loaded.document.updatedAt, 15);
});

test("clearing recovery removes only the journal and keeps autosave data", async () => {
  const storage = memoryStorage({
    [FALLBACK_KEY]: JSON.stringify(createDocument(1)),
    [JOURNAL_KEY]: JSON.stringify({ type: "snapshot" }),
  });

  await withFallbackStorage(storage, async () => clearJournal());

  assert.ok(storage.snapshot()[FALLBACK_KEY]);
  assert.equal(storage.snapshot()[JOURNAL_KEY], undefined);
});

test("Core ink bytes parse back to vector strokes without a canvas bitmap", async () => {
  const { createRepository } = repositoryFixture();
  const demo = await createNotebookDemo(createRepository(), {
    now: Date.parse("2026-08-01T09:00:00Z"),
    documentWidth: DOCUMENT_WIDTH,
    documentHeight: DOCUMENT_HEIGHT,
  });
  const prepared = await prepareInkSnapshot({
    documentId: demo.inkDocument.id,
    strokes: [sampleStroke()],
  });
  const parsed = parseInkSnapshot(prepared.bytes, demo.inkDocument.id);

  assert.deepEqual(parsed, prepared.snapshot);
  assert.equal(parsed.strokes[0].layerId, "layer-1");
  assert.equal("bitmap" in parsed, false);
  assert.equal("canvas" in parsed, false);
  assert.equal(new TextDecoder().decode(prepared.bytes).includes("data:image"), false);
});

test("notebook reopen reuses stable document and revision references", async () => {
  const { createRepository } = repositoryFixture();
  const first = await createNotebookDemo(createRepository(), {
    now: Date.parse("2026-08-01T09:00:00Z"),
    documentWidth: DOCUMENT_WIDTH,
    documentHeight: DOCUMENT_HEIGHT,
  });
  const saved = await first.save([sampleStroke()]);
  const reopened = await createNotebookDemo(createRepository(), {
    now: Date.parse("2026-08-01T10:00:00Z"),
    documentWidth: DOCUMENT_WIDTH,
    documentHeight: DOCUMENT_HEIGHT,
  });
  const revisions = await reopened.listRevisions();
  const restored = await reopened.restoreLatest();

  assert.equal(reopened.notebook.id, first.notebook.id);
  assert.equal(reopened.inkDocument.id, first.inkDocument.id);
  assert.equal(revisions[0].id, saved.revision.id);
  assert.equal(revisions[0].inkDocumentId, first.inkDocument.id);
  assert.equal(restored.revision.id, saved.revision.id);
  assert.deepEqual(restored.strokes[0].points, sampleStroke().points);
});
