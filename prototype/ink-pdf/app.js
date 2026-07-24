import * as pdfjsLib from "./vendor/pdf.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc = "./vendor/pdf.worker.mjs";

const DB_NAME = "studio5-ink-pdf-prototype";
const DB_VERSION = 1;
const PENDING_STROKE_KEY = "studio5:p1:pending-stroke";
const MAX_RENDER_DPR = 2;
const MIN_ZOOM = 0.45;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.15;

const elements = {
  clearButton: document.querySelector("#clearButton"),
  colorInput: document.querySelector("#colorInput"),
  deviceModelInput: document.querySelector("#deviceModelInput"),
  diagnosticsButton: document.querySelector("#diagnosticsButton"),
  diagnosticsDialog: document.querySelector("#diagnosticsDialog"),
  diagnosticsSummary: document.querySelector("#diagnosticsSummary"),
  documentName: document.querySelector("#documentName"),
  emptyState: document.querySelector("#emptyState"),
  exportDiagnosticsButton: document.querySelector("#exportDiagnosticsButton"),
  fitButton: document.querySelector("#fitButton"),
  inkCanvas: document.querySelector("#inkCanvas"),
  installButton: document.querySelector("#installButton"),
  nextPageButton: document.querySelector("#nextPageButton"),
  pageCount: document.querySelector("#pageCount"),
  pageInput: document.querySelector("#pageInput"),
  pageStage: document.querySelector("#pageStage"),
  pdfCanvas: document.querySelector("#pdfCanvas"),
  pdfInput: document.querySelector("#pdfInput"),
  penOnlyInput: document.querySelector("#penOnlyInput"),
  pointerTypeMetric: document.querySelector("#pointerTypeMetric"),
  pressureMetric: document.querySelector("#pressureMetric"),
  previousPageButton: document.querySelector("#previousPageButton"),
  redoButton: document.querySelector("#redoButton"),
  sampleMetric: document.querySelector("#sampleMetric"),
  saveMetric: document.querySelector("#saveMetric"),
  saveState: document.querySelector("#saveState"),
  sizeInput: document.querySelector("#sizeInput"),
  sizeValue: document.querySelector("#sizeValue"),
  stylusModelInput: document.querySelector("#stylusModelInput"),
  subjectiveResultInput: document.querySelector("#subjectiveResultInput"),
  systemVersionInput: document.querySelector("#systemVersionInput"),
  testerNotesInput: document.querySelector("#testerNotesInput"),
  toast: document.querySelector("#toast"),
  toolButtons: [...document.querySelectorAll(".tool-button")],
  undoButton: document.querySelector("#undoButton"),
  workspaceViewport: document.querySelector("#workspaceViewport"),
  zoomInButton: document.querySelector("#zoomInButton"),
  zoomOutButton: document.querySelector("#zoomOutButton"),
  zoomOutput: document.querySelector("#zoomOutput")
};

const state = {
  currentDocumentId: null,
  currentDocumentName: null,
  currentPage: 1,
  currentPointerId: null,
  currentStroke: null,
  db: null,
  deferredInstallPrompt: null,
  diagnostics: {
    appStartedAt: new Date().toISOString(),
    autosaveDurationsMs: [],
    coalescedSamples: 0,
    committedStrokes: 0,
    inputSamples: 0,
    lastPointerType: null,
    maxPressure: 0,
    pendingStrokeRecovered: false,
    rejectedTouchEvents: 0,
    renderDurationsMs: []
  },
  document: null,
  fitZoom: 1,
  history: {
    redo: [],
    undo: []
  },
  pageStrokes: [],
  pdfRenderTask: null,
  renderToken: 0,
  seenPen: false,
  tool: "pen",
  zoom: 1
};

const pdfContext = elements.pdfCanvas.getContext("2d", { alpha: false });
const inkContext = elements.inkCanvas.getContext("2d");

function cloneStrokes(strokes) {
  return strokes.map((stroke) => ({
    ...stroke,
    points: stroke.points.map((point) => ({ ...point }))
  }));
}

function createId(prefix = "id") {
  if (globalThis.crypto?.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function percentile(values, percentileValue) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((percentileValue / 100) * sorted.length) - 1)
  );
  return sorted[index];
}

function setSaveState(text, tone = "success") {
  elements.saveState.textContent = text;
  elements.saveState.style.color = tone === "error" ? "#c53030" : "#13795b";
}

let toastTimer;
function showToast(message) {
  clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.add("visible");
  toastTimer = setTimeout(() => elements.toast.classList.remove("visible"), 2600);
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains("documents")) {
        database.createObjectStore("documents", { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains("pages")) {
        database.createObjectStore("pages", { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains("settings")) {
        database.createObjectStore("settings", { keyPath: "key" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function databaseRequest(storeName, mode, operation) {
  return new Promise((resolve, reject) => {
    const transaction = state.db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    const request = operation(store);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.onerror = () => reject(transaction.error);
  });
}

function getRecord(storeName, key) {
  return databaseRequest(storeName, "readonly", (store) => store.get(key));
}

function putRecord(storeName, value) {
  return databaseRequest(storeName, "readwrite", (store) => store.put(value));
}

function pageRecordId(documentId = state.currentDocumentId, page = state.currentPage) {
  return `${documentId}:${page}`;
}

async function saveSetting(key, value) {
  await putRecord("settings", { key, value, updatedAt: new Date().toISOString() });
}

async function loadSetting(key, fallback = null) {
  const record = await getRecord("settings", key);
  return record?.value ?? fallback;
}

async function hashDocumentMetadata(file) {
  const source = `${file.name}|${file.size}|${file.lastModified}|${file.type}`;
  if (!crypto?.subtle) {
    return btoa(unescape(encodeURIComponent(source))).replace(/[^a-z0-9]/gi, "");
  }
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(source));
  return [...new Uint8Array(digest)]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

async function storeAndOpenPdf(file) {
  if (file.type && file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    showToast("الملف المختار ليس PDF.");
    return;
  }

  setSaveState("جارٍ فتح الملف...");
  const documentId = await hashDocumentMetadata(file);
  const pdfBlob = file.slice(0, file.size, "application/pdf");

  await putRecord("documents", {
    id: documentId,
    name: file.name,
    size: file.size,
    type: "application/pdf",
    lastModified: file.lastModified,
    blob: pdfBlob,
    updatedAt: new Date().toISOString()
  });

  await saveSetting("lastDocumentId", documentId);
  await openStoredDocument(documentId);
}

async function openStoredDocument(documentId) {
  const record = await getRecord("documents", documentId);
  if (!record?.blob) return false;

  setSaveState("جارٍ استعادة الملف...");
  const data = await record.blob.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data });
  state.document = await loadingTask.promise;
  state.currentDocumentId = documentId;
  state.currentDocumentName = record.name;
  state.currentPage = Math.min(
    state.document.numPages,
    Math.max(1, Number(await loadSetting(`lastPage:${documentId}`, 1)))
  );
  state.history.undo = [];
  state.history.redo = [];

  elements.documentName.textContent = record.name;
  elements.pageCount.textContent = String(state.document.numPages);
  elements.pageInput.max = String(state.document.numPages);
  elements.pageInput.value = String(state.currentPage);
  elements.emptyState.hidden = true;
  elements.pageStage.hidden = false;
  setDocumentControlsEnabled(true);

  await loadPageStrokes();
  await fitPage();
  await recoverPendingStroke();
  setSaveState("تمت الاستعادة");
  return true;
}

function setDocumentControlsEnabled(enabled) {
  elements.pageInput.disabled = !enabled;
  elements.fitButton.disabled = !enabled;
  elements.zoomInButton.disabled = !enabled;
  elements.zoomOutButton.disabled = !enabled;
  elements.clearButton.disabled = !enabled;
  updatePageButtons();
  updateHistoryButtons();
}

function updatePageButtons() {
  const hasDocument = Boolean(state.document);
  elements.previousPageButton.disabled = !hasDocument || state.currentPage <= 1;
  elements.nextPageButton.disabled =
    !hasDocument || state.currentPage >= (state.document?.numPages ?? 0);
}

function updateHistoryButtons() {
  elements.undoButton.disabled = state.history.undo.length === 0;
  elements.redoButton.disabled = state.history.redo.length === 0;
}

async function loadPageStrokes() {
  const record = await getRecord("pages", pageRecordId());
  state.pageStrokes = cloneStrokes(record?.strokes ?? []);
  state.history.undo = [];
  state.history.redo = [];
  updateHistoryButtons();
}

async function savePageStrokes(reason = "autosave") {
  if (!state.currentDocumentId) return;
  const startedAt = performance.now();
  setSaveState("جارٍ الحفظ...");

  try {
    await putRecord("pages", {
      id: pageRecordId(),
      documentId: state.currentDocumentId,
      pageNumber: state.currentPage,
      strokes: cloneStrokes(state.pageStrokes),
      updatedAt: new Date().toISOString()
    });
    await saveSetting(`lastPage:${state.currentDocumentId}`, state.currentPage);

    const duration = performance.now() - startedAt;
    state.diagnostics.autosaveDurationsMs.push(Number(duration.toFixed(2)));
    elements.saveMetric.textContent = `${duration.toFixed(0)} ms`;
    setSaveState("محفوظ محلياً");
  } catch (error) {
    console.error(`Save failed (${reason})`, error);
    setSaveState("فشل الحفظ", "error");
    showToast("تعذر حفظ الحبر. لا تغلق التطبيق.");
  }
}

async function renderCurrentPage() {
  if (!state.document) return;

  const token = ++state.renderToken;
  const startedAt = performance.now();
  const page = await state.document.getPage(state.currentPage);
  const viewport = page.getViewport({ scale: state.zoom });
  const dpr = Math.min(globalThis.devicePixelRatio || 1, MAX_RENDER_DPR);

  elements.pageStage.style.width = `${viewport.width}px`;
  elements.pageStage.style.height = `${viewport.height}px`;

  for (const canvas of [elements.pdfCanvas, elements.inkCanvas]) {
    canvas.width = Math.floor(viewport.width * dpr);
    canvas.height = Math.floor(viewport.height * dpr);
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;
  }

  if (state.pdfRenderTask) {
    try {
      state.pdfRenderTask.cancel();
    } catch {
      // A completed render cannot be cancelled.
    }
  }

  state.pdfRenderTask = page.render({
    canvasContext: pdfContext,
    viewport,
    transform: dpr === 1 ? null : [dpr, 0, 0, dpr, 0, 0]
  });

  try {
    await state.pdfRenderTask.promise;
  } catch (error) {
    if (error?.name !== "RenderingCancelledException") throw error;
  }

  if (token !== state.renderToken) return;
  redrawInk();
  elements.pageInput.value = String(state.currentPage);
  elements.zoomOutput.value = `${Math.round(state.zoom * 100)}%`;
  state.diagnostics.renderDurationsMs.push(Number((performance.now() - startedAt).toFixed(2)));
  updatePageButtons();
}

function clearInkCanvas() {
  const dpr = Math.min(globalThis.devicePixelRatio || 1, MAX_RENDER_DPR);
  inkContext.setTransform(1, 0, 0, 1, 0, 0);
  inkContext.clearRect(0, 0, elements.inkCanvas.width, elements.inkCanvas.height);
  inkContext.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function redrawInk(includeCurrentStroke = true) {
  clearInkCanvas();
  for (const stroke of state.pageStrokes) {
    drawStroke(inkContext, stroke);
  }
  if (includeCurrentStroke && state.currentStroke) {
    drawStroke(inkContext, state.currentStroke);
  }
}

function drawStroke(context, stroke) {
  if (!stroke.points.length) return;
  const width = elements.inkCanvas.clientWidth;
  const height = elements.inkCanvas.clientHeight;
  if (!width || !height) return;

  context.save();
  context.strokeStyle = stroke.color;
  context.fillStyle = stroke.color;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.globalCompositeOperation = "source-over";

  if (stroke.points.length === 1) {
    const point = stroke.points[0];
    const radius = strokeWidth(stroke, point.pressure) / 2;
    context.beginPath();
    context.arc(point.x * width, point.y * height, radius, 0, Math.PI * 2);
    context.fill();
    context.restore();
    return;
  }

  for (let index = 1; index < stroke.points.length; index += 1) {
    const previous = stroke.points[index - 1];
    const point = stroke.points[index];
    context.lineWidth = strokeWidth(stroke, (previous.pressure + point.pressure) / 2);
    context.beginPath();
    context.moveTo(previous.x * width, previous.y * height);
    context.lineTo(point.x * width, point.y * height);
    context.stroke();
  }
  context.restore();
}

function strokeWidth(stroke, pressure) {
  const normalizedPressure = pressure > 0 ? pressure : 0.5;
  return stroke.size * (0.45 + normalizedPressure * 0.95);
}

function pointerPoint(event) {
  const rect = elements.inkCanvas.getBoundingClientRect();
  return {
    x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
    y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)),
    pressure: Number(event.pressure || 0.5),
    time: Math.round(performance.now())
  };
}

function pointerIsAllowed(event) {
  if (event.pointerType === "pen") {
    state.seenPen = true;
    return true;
  }

  if (event.pointerType === "touch" && elements.penOnlyInput.checked) {
    state.diagnostics.rejectedTouchEvents += 1;
    return false;
  }

  return event.pointerType === "mouse" || !elements.penOnlyInput.checked;
}

function recordPointerSample(event, coalesced = false) {
  state.diagnostics.inputSamples += 1;
  if (coalesced) state.diagnostics.coalescedSamples += 1;
  state.diagnostics.lastPointerType = event.pointerType || "unknown";
  state.diagnostics.maxPressure = Math.max(state.diagnostics.maxPressure, event.pressure || 0);
  elements.pointerTypeMetric.textContent = event.pointerType || "غير معروف";
  elements.sampleMetric.textContent = String(state.diagnostics.inputSamples);
  elements.pressureMetric.textContent =
    state.diagnostics.maxPressure > 0 && state.diagnostics.maxPressure !== 0.5
      ? `نعم (${state.diagnostics.maxPressure.toFixed(2)})`
      : "لم يظهر بعد";
}

function beginStroke(event) {
  if (!state.document || state.tool === "hand" || !pointerIsAllowed(event)) return;
  event.preventDefault();
  elements.inkCanvas.setPointerCapture(event.pointerId);
  state.currentPointerId = event.pointerId;
  recordPointerSample(event);

  if (state.tool === "eraser") {
    eraseAt(pointerPoint(event));
    return;
  }

  state.currentStroke = {
    id: createId("stroke"),
    color: elements.colorInput.value,
    size: Number(elements.sizeInput.value),
    pointerType: event.pointerType || "unknown",
    createdAt: new Date().toISOString(),
    points: [pointerPoint(event)]
  };
  flushPendingStroke();
  redrawInk();
}

let pendingFlushTimer;
function continueStroke(event) {
  if (event.pointerId !== state.currentPointerId || !state.document) return;
  event.preventDefault();

  if (state.tool === "eraser") {
    eraseAt(pointerPoint(event));
    return;
  }

  if (!state.currentStroke) return;
  const events = event.getCoalescedEvents?.() ?? [event];
  for (const sample of events) {
    recordPointerSample(sample, events.length > 1);
    state.currentStroke.points.push(pointerPoint(sample));
  }

  redrawInk();
  clearTimeout(pendingFlushTimer);
  pendingFlushTimer = setTimeout(flushPendingStroke, 100);
}

async function endStroke(event) {
  if (event.pointerId !== state.currentPointerId) return;
  event.preventDefault();

  try {
    elements.inkCanvas.releasePointerCapture(event.pointerId);
  } catch {
    // The pointer capture may already be released after cancellation.
  }

  state.currentPointerId = null;
  if (state.tool === "eraser") {
    localStorage.removeItem(PENDING_STROKE_KEY);
    return;
  }

  if (!state.currentStroke) return;
  const before = cloneStrokes(state.pageStrokes);
  state.pageStrokes.push(state.currentStroke);
  state.currentStroke = null;
  state.diagnostics.committedStrokes += 1;
  state.history.undo.push(before);
  state.history.redo = [];
  updateHistoryButtons();
  localStorage.removeItem(PENDING_STROKE_KEY);
  redrawInk();
  await savePageStrokes("stroke-end");
}

function flushPendingStroke() {
  if (!state.currentStroke || !state.currentDocumentId) return;
  try {
    localStorage.setItem(
      PENDING_STROKE_KEY,
      JSON.stringify({
        documentId: state.currentDocumentId,
        pageNumber: state.currentPage,
        stroke: state.currentStroke,
        savedAt: new Date().toISOString()
      })
    );
  } catch (error) {
    console.warn("Could not write the emergency stroke journal.", error);
  }
}

async function recoverPendingStroke() {
  const raw = localStorage.getItem(PENDING_STROKE_KEY);
  if (!raw) return;

  try {
    const pending = JSON.parse(raw);
    if (
      pending.documentId === state.currentDocumentId &&
      pending.pageNumber === state.currentPage &&
      pending.stroke?.points?.length
    ) {
      const alreadySaved = state.pageStrokes.some((stroke) => stroke.id === pending.stroke.id);
      if (!alreadySaved) {
        state.pageStrokes.push(pending.stroke);
        state.diagnostics.pendingStrokeRecovered = true;
        await savePageStrokes("pending-recovery");
        redrawInk();
        showToast("استعدنا آخر خط لم يكتمل قبل الإغلاق.");
      }
    }
  } catch (error) {
    console.warn("Invalid pending stroke journal.", error);
  } finally {
    localStorage.removeItem(PENDING_STROKE_KEY);
  }
}

let lastEraseAt = 0;
function eraseAt(point) {
  const now = performance.now();
  if (now - lastEraseAt < 24) return;
  lastEraseAt = now;

  const rect = elements.inkCanvas.getBoundingClientRect();
  const radiusPx = Math.max(10, Number(elements.sizeInput.value) * 2.2);
  const radiusX = radiusPx / rect.width;
  const radiusY = radiusPx / rect.height;
  const before = cloneStrokes(state.pageStrokes);
  const remaining = state.pageStrokes.filter(
    (stroke) =>
      !stroke.points.some((strokePoint) => {
        const dx = (strokePoint.x - point.x) / radiusX;
        const dy = (strokePoint.y - point.y) / radiusY;
        return dx * dx + dy * dy <= 1;
      })
  );

  if (remaining.length === state.pageStrokes.length) return;
  state.pageStrokes = remaining;
  state.history.undo.push(before);
  state.history.redo = [];
  updateHistoryButtons();
  redrawInk();
  savePageStrokes("erase");
}

async function changePage(nextPage) {
  if (!state.document) return;
  const safePage = Math.min(state.document.numPages, Math.max(1, Number(nextPage)));
  if (safePage === state.currentPage) return;

  if (state.currentStroke) {
    await endStroke({ pointerId: state.currentPointerId, preventDefault() {} });
  }
  state.currentPage = safePage;
  await loadPageStrokes();
  await renderCurrentPage();
  await saveSetting(`lastPage:${state.currentDocumentId}`, state.currentPage);
}

async function fitPage() {
  if (!state.document) return;
  const page = await state.document.getPage(state.currentPage);
  const viewport = page.getViewport({ scale: 1 });
  const availableWidth = Math.max(260, elements.workspaceViewport.clientWidth - 64);
  const availableHeight = Math.max(260, elements.workspaceViewport.clientHeight - 64);
  state.fitZoom = Math.min(availableWidth / viewport.width, availableHeight / viewport.height);
  state.zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, state.fitZoom));
  await renderCurrentPage();
}

async function setZoom(nextZoom) {
  state.zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, nextZoom));
  await renderCurrentPage();
}

function setTool(tool) {
  state.tool = tool;
  for (const button of elements.toolButtons) {
    button.classList.toggle("active", button.dataset.tool === tool);
  }
  elements.inkCanvas.classList.toggle("hand-mode", tool === "hand");
}

async function undo() {
  const previous = state.history.undo.pop();
  if (!previous) return;
  state.history.redo.push(cloneStrokes(state.pageStrokes));
  state.pageStrokes = cloneStrokes(previous);
  redrawInk();
  updateHistoryButtons();
  await savePageStrokes("undo");
}

async function redo() {
  const next = state.history.redo.pop();
  if (!next) return;
  state.history.undo.push(cloneStrokes(state.pageStrokes));
  state.pageStrokes = cloneStrokes(next);
  redrawInk();
  updateHistoryButtons();
  await savePageStrokes("redo");
}

async function clearPage() {
  if (!state.pageStrokes.length) return;
  const confirmed = globalThis.confirm("مسح كل الحبر من الصفحة الحالية؟ يمكنك التراجع بعدها.");
  if (!confirmed) return;
  state.history.undo.push(cloneStrokes(state.pageStrokes));
  state.history.redo = [];
  state.pageStrokes = [];
  redrawInk();
  updateHistoryButtons();
  await savePageStrokes("clear-page");
}

function buildDiagnosticsReport() {
  const report = {
    schemaVersion: 1,
    prototype: "Studio5 Ink & PDF P1",
    generatedAt: new Date().toISOString(),
    tester: {
      deviceModel: elements.deviceModelInput.value.trim(),
      systemVersion: elements.systemVersionInput.value.trim(),
      stylusModel: elements.stylusModelInput.value.trim(),
      subjectiveResult: elements.subjectiveResultInput.value,
      notes: elements.testerNotesInput.value.trim()
    },
    environment: {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      devicePixelRatio: globalThis.devicePixelRatio || 1,
      viewport: {
        width: globalThis.innerWidth,
        height: globalThis.innerHeight
      },
      pointerEvents: "PointerEvent" in globalThis,
      indexedDb: "indexedDB" in globalThis,
      serviceWorker: "serviceWorker" in navigator
    },
    session: {
      ...state.diagnostics,
      autosaveAverageMs: Number(average(state.diagnostics.autosaveDurationsMs).toFixed(2)),
      autosaveP95Ms: Number(percentile(state.diagnostics.autosaveDurationsMs, 95).toFixed(2)),
      renderAverageMs: Number(average(state.diagnostics.renderDurationsMs).toFixed(2)),
      currentDocumentPages: state.document?.numPages ?? 0,
      currentPageStrokeCount: state.pageStrokes.length
    }
  };
  return report;
}

async function persistTesterMetadata() {
  const metadata = {
    deviceModel: elements.deviceModelInput.value,
    systemVersion: elements.systemVersionInput.value,
    stylusModel: elements.stylusModelInput.value,
    subjectiveResult: elements.subjectiveResultInput.value,
    notes: elements.testerNotesInput.value
  };
  await saveSetting("testerMetadata", metadata);
}

function openDiagnostics() {
  const report = buildDiagnosticsReport();
  elements.diagnosticsSummary.textContent = JSON.stringify(report.session, null, 2);
  elements.diagnosticsDialog.showModal();
}

async function exportDiagnostics() {
  await persistTesterMetadata();
  const report = buildDiagnosticsReport();
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `studio5-p1-diagnostics-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
  showToast("تم تنزيل تقرير الاختبار.");
}

async function loadTesterMetadata() {
  const metadata = await loadSetting("testerMetadata", {});
  elements.deviceModelInput.value = metadata.deviceModel ?? "";
  elements.systemVersionInput.value = metadata.systemVersion ?? "";
  elements.stylusModelInput.value = metadata.stylusModel ?? "";
  elements.subjectiveResultInput.value = metadata.subjectiveResult ?? "not-tested";
  elements.testerNotesInput.value = metadata.notes ?? "";
}

function registerEvents() {
  elements.pdfInput.addEventListener("change", async (event) => {
    const [file] = event.target.files;
    if (!file) return;
    try {
      await storeAndOpenPdf(file);
    } catch (error) {
      console.error(error);
      setSaveState("تعذر فتح الملف", "error");
      showToast("تعذر فتح PDF. جرّب ملفاً آخر.");
    } finally {
      event.target.value = "";
    }
  });

  elements.toolButtons.forEach((button) =>
    button.addEventListener("click", () => setTool(button.dataset.tool))
  );
  elements.sizeInput.addEventListener("input", () => {
    elements.sizeValue.textContent = elements.sizeInput.value;
  });

  elements.inkCanvas.addEventListener("pointerdown", beginStroke);
  elements.inkCanvas.addEventListener("pointermove", continueStroke);
  elements.inkCanvas.addEventListener("pointerup", endStroke);
  elements.inkCanvas.addEventListener("pointercancel", endStroke);
  elements.inkCanvas.addEventListener("contextmenu", (event) => event.preventDefault());

  elements.previousPageButton.addEventListener("click", () => changePage(state.currentPage - 1));
  elements.nextPageButton.addEventListener("click", () => changePage(state.currentPage + 1));
  elements.pageInput.addEventListener("change", () => changePage(elements.pageInput.value));
  elements.zoomInButton.addEventListener("click", () => setZoom(state.zoom + ZOOM_STEP));
  elements.zoomOutButton.addEventListener("click", () => setZoom(state.zoom - ZOOM_STEP));
  elements.fitButton.addEventListener("click", fitPage);
  elements.undoButton.addEventListener("click", undo);
  elements.redoButton.addEventListener("click", redo);
  elements.clearButton.addEventListener("click", clearPage);
  elements.diagnosticsButton.addEventListener("click", openDiagnostics);
  elements.exportDiagnosticsButton.addEventListener("click", exportDiagnostics);

  globalThis.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    state.deferredInstallPrompt = event;
    elements.installButton.hidden = false;
  });

  elements.installButton.addEventListener("click", async () => {
    if (!state.deferredInstallPrompt) return;
    state.deferredInstallPrompt.prompt();
    await state.deferredInstallPrompt.userChoice;
    state.deferredInstallPrompt = null;
    elements.installButton.hidden = true;
  });

  globalThis.addEventListener("beforeunload", () => {
    flushPendingStroke();
  });

  globalThis.addEventListener("resize", () => {
    if (!state.document) return;
    clearTimeout(globalThis.__studio5ResizeTimer);
    globalThis.__studio5ResizeTimer = setTimeout(fitPage, 180);
  });
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  try {
    await navigator.serviceWorker.register("./sw.js", { scope: "./" });
  } catch (error) {
    console.warn("Service worker registration failed.", error);
  }
}

async function initialize() {
  registerEvents();
  setTool("pen");
  state.db = await openDatabase();
  await loadTesterMetadata();
  await registerServiceWorker();

  const lastDocumentId = await loadSetting("lastDocumentId");
  if (lastDocumentId) {
    try {
      const restored = await openStoredDocument(lastDocumentId);
      if (restored) showToast("تمت استعادة آخر جلسة.");
    } catch (error) {
      console.error("Could not restore the last document.", error);
      setSaveState("تعذر الاستعادة", "error");
    }
  }
}

initialize().catch((error) => {
  console.error("Studio5 prototype failed to initialize.", error);
  setSaveState("خطأ في التشغيل", "error");
  showToast("تعذر تشغيل Prototype. افتح أدوات المطور لمعرفة السبب.");
});
