import {
  DOCUMENT_HEIGHT,
  DOCUMENT_WIDTH,
  appendPoint,
  createDocument,
  createStroke,
  documentStats,
  eraseStrokeAt,
  exportManifest,
  pointerIntent,
  pointToDocument,
  widthForPoint,
} from "./ink-core.mjs";
import {
  clearJournal,
  loadDocument,
  saveDocument,
  writeSnapshotJournal,
  writeStrokeJournal,
} from "./storage.mjs";
import { openBrowserNotebookDemo } from "./core-runtime.mjs";

const canvas = document.querySelector("#ink-canvas");
const context = canvas.getContext("2d", { alpha: false, desynchronized: true });
const saveState = document.querySelector("#save-state");
const strokeCount = document.querySelector("#stroke-count");
const pointCount = document.querySelector("#point-count");
const pressureState = document.querySelector("#pressure-state");
const storageState = document.querySelector("#storage-state");
const lastSaved = document.querySelector("#last-saved");
const zoomOutput = document.querySelector("#zoom-output");
const hint = document.querySelector("#canvas-hint");
const toast = document.querySelector("#toast");
const diagnosticsDialog = document.querySelector("#diagnostics-dialog");
const diagnosticsList = document.querySelector("#diagnostics-list");
const notebookState = document.querySelector("#notebook-state");
const saveRevisionButton = document.querySelector("#save-revision-button");

let inkDocument = createDocument();
let tool = "pen";
let baseWidth = 5;
let color = "#14221c";
let allowTouchDrawing = false;
let currentStroke = null;
let activeDrawPointer = null;
let activePanPointer = null;
let activePointers = new Map();
let pinch = null;
let viewport = { scale: 1, x: 0, y: 0 };
let history = [];
let future = [];
let saveTimer = null;
let journalTimer = null;
let renderQueued = false;
let lastFrameMs = 0;
let pressureObserved = false;
let storageMode = "جارٍ الفحص";
let dragging = false;
let notebookDemo = null;
let notebookRevisionCount = 0;

function cloneStrokes() {
  return structuredClone(inkDocument.strokes);
}

function pushHistory() {
  history.push(cloneStrokes());
  if (history.length > 60) history.shift();
  future = [];
  updateUndoButtons();
}

function restoreStrokes(strokes) {
  inkDocument.strokes = structuredClone(strokes);
  inkDocument.updatedAt = Date.now();
  scheduleRender();
  scheduleSave(0);
  updateStats();
}

function updateUndoButtons() {
  document.querySelector("#undo-button").disabled = history.length === 0;
  document.querySelector("#redo-button").disabled = future.length === 0;
}

function undo() {
  if (!history.length) return;
  future.push(cloneStrokes());
  restoreStrokes(history.pop());
  updateUndoButtons();
}

function redo() {
  if (!future.length) return;
  history.push(cloneStrokes());
  restoreStrokes(future.pop());
  updateUndoButtons();
}

function setSaveState(label, state) {
  saveState.textContent = label;
  saveState.dataset.state = state;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.setTimeout(() => toast.classList.remove("is-visible"), 2200);
}

function updateNotebookState(message = null) {
  notebookState.textContent = message
    ?? `دفتر مرتبط · ${notebookRevisionCount} نسخة`;
}

async function saveNotebookRevision() {
  if (!notebookDemo) return;
  saveRevisionButton.disabled = true;
  updateNotebookState("جارٍ تثبيت النسخة…");
  try {
    storageMode = await saveDocument(inkDocument);
    clearJournal();
    const result = await notebookDemo.save(inkDocument.strokes);
    notebookRevisionCount = result.revisionCount;
    updateNotebookState();
    showToast(result.status === "duplicate"
      ? "هذه النسخة محفوظة مسبقاً، لم ننشئ نسخة مكررة"
      : `تم حفظ النسخة ${result.revision.revisionNumber}`);
  } catch (error) {
    console.error(error);
    updateNotebookState("تعذر حفظ نسخة Notebook");
    showToast("فشل حفظ النسخة، المسودة المحلية ما زالت محفوظة");
  } finally {
    saveRevisionButton.disabled = false;
  }
}

function scheduleSave(delay = 240) {
  window.clearTimeout(saveTimer);
  setSaveState("جارٍ الحفظ…", "saving");
  saveTimer = window.setTimeout(async () => {
    try {
      inkDocument.updatedAt = Date.now();
      storageMode = await saveDocument(inkDocument);
      clearJournal();
      const time = new Intl.DateTimeFormat("ar-IQ", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(new Date());
      setSaveState("محفوظ محلياً", "saved");
      lastSaved.textContent = `آخر حفظ: ${time}`;
      storageState.textContent = `التخزين: ${storageMode}`;
    } catch (error) {
      console.error(error);
      setSaveState("فشل الحفظ", "error");
      storageState.textContent = "التخزين: فشل";
    }
  }, delay);
}

function fitDocument() {
  const rect = canvas.getBoundingClientRect();
  const padding = 34;
  viewport.scale = Math.min(
    (rect.width - padding * 2) / DOCUMENT_WIDTH,
    (rect.height - padding * 2) / DOCUMENT_HEIGHT,
  );
  viewport.x = (rect.width - DOCUMENT_WIDTH * viewport.scale) / 2;
  viewport.y = (rect.height - DOCUMENT_HEIGHT * viewport.scale) / 2;
  updateZoom();
  scheduleRender();
}

function updateZoom() {
  zoomOutput.textContent = `${Math.round(viewport.scale * 100)}%`;
}

function zoomAt(factor, center = null) {
  const rect = canvas.getBoundingClientRect();
  const point = center ?? { x: rect.width / 2, y: rect.height / 2 };
  const nextScale = Math.min(4, Math.max(0.2, viewport.scale * factor));
  const ratio = nextScale / viewport.scale;
  viewport.x = point.x - (point.x - viewport.x) * ratio;
  viewport.y = point.y - (point.y - viewport.y) * ratio;
  viewport.scale = nextScale;
  updateZoom();
  scheduleRender();
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const ratio = Math.min(window.devicePixelRatio || 1, 3);
  canvas.width = Math.max(1, Math.round(rect.width * ratio));
  canvas.height = Math.max(1, Math.round(rect.height * ratio));
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  canvas.dataset.ratio = String(ratio);
  scheduleRender();
}

function drawStroke(targetContext, stroke, transform = { scale: 1, x: 0, y: 0 }) {
  if (!stroke.points.length) return;
  const points = stroke.points;
  targetContext.save();
  targetContext.lineCap = "round";
  targetContext.lineJoin = "round";
  targetContext.strokeStyle = stroke.color;
  targetContext.fillStyle = stroke.color;

  if (points.length === 1) {
    const radius = widthForPoint(stroke, points[0]) * transform.scale * 0.5;
    targetContext.beginPath();
    targetContext.arc(
      transform.x + points[0].x * transform.scale,
      transform.y + points[0].y * transform.scale,
      radius,
      0,
      Math.PI * 2,
    );
    targetContext.fill();
    targetContext.restore();
    return;
  }

  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    targetContext.lineWidth = ((widthForPoint(stroke, previous) + widthForPoint(stroke, current)) / 2)
      * transform.scale;
    targetContext.beginPath();
    targetContext.moveTo(
      transform.x + previous.x * transform.scale,
      transform.y + previous.y * transform.scale,
    );
    targetContext.lineTo(
      transform.x + current.x * transform.scale,
      transform.y + current.y * transform.scale,
    );
    targetContext.stroke();
  }
  targetContext.restore();
}

function render() {
  renderQueued = false;
  const started = performance.now();
  const rect = canvas.getBoundingClientRect();
  context.clearRect(0, 0, rect.width, rect.height);
  context.fillStyle = "#e1e2dc";
  context.fillRect(0, 0, rect.width, rect.height);

  context.save();
  context.shadowColor = "rgba(25, 31, 27, 0.16)";
  context.shadowBlur = 22;
  context.fillStyle = "#fffdf8";
  context.fillRect(
    viewport.x,
    viewport.y,
    DOCUMENT_WIDTH * viewport.scale,
    DOCUMENT_HEIGHT * viewport.scale,
  );
  context.restore();

  context.save();
  context.beginPath();
  context.rect(
    viewport.x,
    viewport.y,
    DOCUMENT_WIDTH * viewport.scale,
    DOCUMENT_HEIGHT * viewport.scale,
  );
  context.clip();
  for (const stroke of inkDocument.strokes) {
    drawStroke(context, stroke, viewport);
  }
  context.restore();
  lastFrameMs = performance.now() - started;
}

function scheduleRender() {
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(render);
}

function updateStats() {
  const stats = documentStats(inkDocument);
  strokeCount.textContent = `${stats.strokes} خط`;
  pointCount.textContent = `${stats.points} نقطة`;
  hint.hidden = stats.strokes > 0;
}

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  const point = pointToDocument(
    { x: event.clientX, y: event.clientY },
    viewport,
    rect,
  );
  return {
    ...point,
    pressure: event.pressure,
    time: event.timeStamp,
  };
}

function isInsideDocument(point) {
  return point.x >= 0
    && point.y >= 0
    && point.x <= DOCUMENT_WIDTH
    && point.y <= DOCUMENT_HEIGHT;
}

function updatePressure(event) {
  if (event.pointerType === "pen" && event.pressure > 0 && event.pressure !== 0.5) {
    pressureObserved = true;
    pressureState.textContent = `الضغط: يعمل (${event.pressure.toFixed(2)})`;
  } else if (event.pointerType === "pen" && !pressureObserved) {
    pressureState.textContent = "الضغط: قلم مكتشف، لم يتغير بعد";
  }
}

function beginStroke(event) {
  const point = canvasPoint(event);
  if (!isInsideDocument(point)) return;
  pushHistory();
  currentStroke = createStroke({
    color,
    baseWidth,
    pointerType: event.pointerType,
  });
  appendPoint(currentStroke, point);
  inkDocument.strokes.push(currentStroke);
  activeDrawPointer = event.pointerId;
  writeStrokeJournal(inkDocument.id, currentStroke);
  updateStats();
  scheduleRender();
}

function continueStroke(event) {
  if (event.pointerId !== activeDrawPointer || !currentStroke) return;
  updatePressure(event);
  const events = event.getCoalescedEvents?.() ?? [event];
  let changed = false;
  for (const sample of events) {
    const point = canvasPoint(sample);
    if (isInsideDocument(point)) changed = appendPoint(currentStroke, point) || changed;
  }
  if (!changed) return;
  window.clearTimeout(journalTimer);
  journalTimer = window.setTimeout(
    () => writeStrokeJournal(inkDocument.id, currentStroke),
    70,
  );
  updateStats();
  scheduleRender();
}

function finishStroke() {
  if (!currentStroke) return;
  writeStrokeJournal(inkDocument.id, currentStroke);
  currentStroke = null;
  activeDrawPointer = null;
  scheduleSave(0);
}

function eraseAt(event) {
  const point = canvasPoint(event);
  const radius = 12 / viewport.scale;
  let changed = false;
  const nextStrokes = [];
  for (const stroke of inkDocument.strokes) {
    const fragments = eraseStrokeAt(stroke, point, radius);
    if (fragments.length !== 1 || fragments[0] !== stroke) changed = true;
    nextStrokes.push(...fragments);
  }
  if (!changed) return false;
  inkDocument.strokes = nextStrokes;
  writeSnapshotJournal(inkDocument.id, inkDocument.strokes);
  updateStats();
  scheduleRender();
  return true;
}

function beginPan(event) {
  activePanPointer = event.pointerId;
  dragging = true;
  canvas.dataset.dragging = "true";
}

function continuePan(event) {
  if (event.pointerId !== activePanPointer) return;
  viewport.x += event.movementX;
  viewport.y += event.movementY;
  scheduleRender();
}

function finishPan(event) {
  if (event.pointerId !== activePanPointer) return;
  activePanPointer = null;
  dragging = false;
  canvas.dataset.dragging = "false";
}

function touchEntries() {
  return [...activePointers.entries()].filter(([, pointer]) => pointer.type === "touch");
}

function beginPinch() {
  const touches = touchEntries();
  if (touches.length < 2) return;
  const [first, second] = touches.map(([, pointer]) => pointer);
  const center = { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 };
  pinch = {
    distance: Math.hypot(second.x - first.x, second.y - first.y),
    center,
    scale: viewport.scale,
    x: viewport.x,
    y: viewport.y,
  };
}

function continuePinch() {
  if (!pinch) return;
  const touches = touchEntries();
  if (touches.length < 2) return;
  const [first, second] = touches.map(([, pointer]) => pointer);
  const distance = Math.max(1, Math.hypot(second.x - first.x, second.y - first.y));
  const center = { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 };
  const nextScale = Math.min(4, Math.max(0.2, pinch.scale * (distance / pinch.distance)));
  const ratio = nextScale / pinch.scale;
  viewport.scale = nextScale;
  viewport.x = center.x - (pinch.center.x - pinch.x) * ratio;
  viewport.y = center.y - (pinch.center.y - pinch.y) * ratio;
  updateZoom();
  scheduleRender();
}

canvas.addEventListener("pointerdown", (event) => {
  const intent = pointerIntent({
    tool,
    pointerType: event.pointerType,
    allowTouchDrawing,
  });
  if (intent === "ignore") return;
  if (intent !== "navigate" && activeDrawPointer !== null) {
    return;
  }

  canvas.setPointerCapture(event.pointerId);
  activePointers.set(event.pointerId, {
    x: event.clientX,
    y: event.clientY,
    type: event.pointerType,
  });

  if (intent === "navigate") {
    if (event.pointerType === "touch" && touchEntries().length >= 2) {
      activePanPointer = null;
      beginPinch();
      return;
    }
    beginPan(event);
    return;
  }
  if (intent === "erase") {
    pushHistory();
    eraseAt(event);
    activeDrawPointer = event.pointerId;
    return;
  }
  beginStroke(event);
});

canvas.addEventListener("pointermove", (event) => {
  if (activePointers.has(event.pointerId)) {
    activePointers.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
      type: event.pointerType,
    });
  }
  if (tool === "hand" && pinch) {
    continuePinch();
    return;
  }
  if (tool === "hand" && activePanPointer === event.pointerId) {
    continuePan(event);
    return;
  }
  if (tool === "eraser" && activeDrawPointer === event.pointerId) {
    eraseAt(event);
    return;
  }
  continueStroke(event);
});

function finishPointer(event) {
  activePointers.delete(event.pointerId);
  if (pinch) {
    if (touchEntries().length < 2) pinch = null;
    finishPan(event);
    return;
  }
  if (event.pointerId === activePanPointer) {
    finishPan(event);
    return;
  }
  if (event.pointerId === activeDrawPointer) {
    if (tool === "eraser") {
      activeDrawPointer = null;
      scheduleSave(0);
    } else {
      finishStroke();
    }
  }
}

canvas.addEventListener("pointerup", finishPointer);
canvas.addEventListener("pointercancel", finishPointer);
canvas.addEventListener("contextmenu", (event) => event.preventDefault());
canvas.addEventListener("wheel", (event) => {
  event.preventDefault();
  const rect = canvas.getBoundingClientRect();
  zoomAt(event.deltaY < 0 ? 1.1 : 0.9, {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  });
}, { passive: false });

for (const button of document.querySelectorAll("[data-tool]")) {
  button.addEventListener("click", () => {
    tool = button.dataset.tool;
    for (const candidate of document.querySelectorAll("[data-tool]")) {
      const active = candidate === button;
      candidate.classList.toggle("is-active", active);
      candidate.setAttribute("aria-pressed", String(active));
    }
    canvas.dataset.tool = tool;
  });
}

document.querySelector("#width-control").addEventListener("input", (event) => {
  baseWidth = Number(event.target.value);
});
document.querySelector("#color-control").addEventListener("input", (event) => {
  color = event.target.value;
});
document.querySelector("#touch-draw-toggle").addEventListener("change", (event) => {
  allowTouchDrawing = event.target.checked;
  showToast(
    allowTouchDrawing
      ? "تم تفعيل الرسم بالإصبع"
      : "راحة اليد لن تحرك اللوحة؛ اختر «تحريك» عند الحاجة",
  );
});
document.querySelector("#undo-button").addEventListener("click", undo);
document.querySelector("#redo-button").addEventListener("click", redo);
document.querySelector("#zoom-in-button").addEventListener("click", () => zoomAt(1.18));
document.querySelector("#zoom-out-button").addEventListener("click", () => zoomAt(0.84));
document.querySelector("#fit-button").addEventListener("click", fitDocument);

document.querySelector("#clear-button").addEventListener("click", () => {
  if (!inkDocument.strokes.length) return;
  if (!window.confirm("هل تريد مسح كل الخطوط؟ يمكن التراجع بعد المسح.")) return;
  pushHistory();
  inkDocument.strokes = [];
  writeSnapshotJournal(inkDocument.id, inkDocument.strokes);
  updateStats();
  scheduleRender();
  scheduleSave(0);
});

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

document.querySelector("#export-data-button").addEventListener("click", () => {
  const payload = {
    manifest: exportManifest(inkDocument),
    document: inkDocument,
  };
  downloadBlob(
    new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }),
    `studio5-p0-${Date.now()}.json`,
  );
});

document.querySelector("#export-png-button").addEventListener("click", () => {
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = DOCUMENT_WIDTH;
  exportCanvas.height = DOCUMENT_HEIGHT;
  const exportContext = exportCanvas.getContext("2d");
  exportContext.fillStyle = "#fffdf8";
  exportContext.fillRect(0, 0, DOCUMENT_WIDTH, DOCUMENT_HEIGHT);
  for (const stroke of inkDocument.strokes) drawStroke(exportContext, stroke);
  exportCanvas.toBlob((blob) => {
    if (blob) downloadBlob(blob, `studio5-p0-${Date.now()}.png`);
  }, "image/png");
});

saveRevisionButton.addEventListener("click", saveNotebookRevision);

document.querySelector("#diagnostics-button").addEventListener("click", () => {
  const stats = documentStats(inkDocument);
  const values = [
    ["المستند", inkDocument.id],
    ["Schema", String(inkDocument.schemaVersion)],
    ["الخطوط", String(stats.strokes)],
    ["النقاط", String(stats.points)],
    ["آخر Render", `${lastFrameMs.toFixed(2)} ms`],
    ["Device pixel ratio", String(window.devicePixelRatio || 1)],
    ["Canvas pixels", `${canvas.width} × ${canvas.height}`],
    ["Pointer Events", "PointerEvent" in window ? "مدعومة" : "غير مدعومة"],
    ["ضغط القلم", pressureObserved ? "تم رصده" : "لم يُرصد بعد"],
    ["التخزين", storageMode],
    ["Notebook Core", notebookDemo ? "متصل" : "غير متصل"],
    ["نسخ Ink", String(notebookRevisionCount)],
    ["Online", navigator.onLine ? "نعم" : "لا"],
    ["User agent", navigator.userAgent],
  ];
  diagnosticsList.replaceChildren();
  for (const [label, value] of values) {
    const term = document.createElement("dt");
    const description = document.createElement("dd");
    term.textContent = label;
    description.textContent = value;
    diagnosticsList.append(term, description);
  }
  diagnosticsDialog.showModal();
});

window.addEventListener("resize", () => {
  resizeCanvas();
  if (!dragging) fitDocument();
});
window.addEventListener("online", () => showToast("عاد الاتصال، بيانات الرسم بقيت محلية"));
window.addEventListener("offline", () => showToast("أنت Offline، الرسم والحفظ مستمران"));
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") scheduleSave(0);
});

async function boot() {
  try {
    const loaded = await loadDocument();
    inkDocument = loaded.document;
    storageMode = loaded.storageMode;
    if (loaded.recovered) {
      showToast("تمت استعادة آخر عملية غير مكتملة");
      scheduleSave(0);
    } else {
      setSaveState("جاهز للرسم", "ready");
    }
  } catch (error) {
    console.error(error);
    inkDocument = createDocument();
    setSaveState("تخزين جديد", "ready");
  }
  try {
    notebookDemo = await openBrowserNotebookDemo({
      documentWidth: DOCUMENT_WIDTH,
      documentHeight: DOCUMENT_HEIGHT,
    });
    notebookRevisionCount = await notebookDemo.revisionCount();
    if (inkDocument.strokes.length === 0) {
      const restored = await notebookDemo.restoreLatest();
      if (restored?.strokes.length) {
        inkDocument.strokes = restored.strokes;
        inkDocument.updatedAt = Date.now();
        showToast(`استُعيدت نسخة Notebook رقم ${restored.revision.revisionNumber}`);
        scheduleSave(0);
      }
    }
    updateNotebookState();
    saveRevisionButton.disabled = false;
  } catch (error) {
    console.error("Notebook Core", error);
    updateNotebookState("الرسم متاح · Notebook غير متصل");
  }
  updateUndoButtons();
  updateStats();
  canvas.dataset.tool = tool;
  resizeCanvas();
  fitDocument();
  storageState.textContent = `التخزين: ${storageMode}`;
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch((error) => console.warn("SW", error));
  }
}

boot();
