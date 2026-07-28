import {
  GlobalWorkerOptions,
  getDocument,
} from "../vendor/pdfjs/pdf.min.mjs";

GlobalWorkerOptions.workerSrc = new URL(
  "../vendor/pdfjs/pdf.worker.min.mjs",
  import.meta.url,
).href;

const MIN_SCALE = 0.4;
const MAX_SCALE = 3;
const SCALE_STEP = 1.2;
const MAX_PIXEL_RATIO = 2;

function copyBytes(bytes) {
  if (bytes instanceof Uint8Array) return bytes.slice();
  if (bytes instanceof ArrayBuffer) return new Uint8Array(bytes.slice(0));
  if (ArrayBuffer.isView(bytes)) {
    return new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength).slice();
  }
  return Uint8Array.from(bytes ?? []);
}

function clampScale(value) {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, value));
}

export function createPdfViewer({
  canvas,
  stage,
  status,
  pageLabel,
  previousButton,
  nextButton,
  zoomOutButton,
  zoomInButton,
  fitButton,
}) {
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) throw new Error("Canvas 2D غير متاح على هذا المتصفح");
  let document = null;
  let loadingTask = null;
  let renderTask = null;
  let generation = 0;
  let pageNumber = 1;
  let scale = 1;

  function setStatus(message, tone = "normal") {
    status.textContent = message;
    status.dataset.tone = tone;
  }

  function updateControls() {
    const pages = document?.numPages ?? 0;
    pageLabel.textContent = pages ? `${pageNumber} / ${pages}` : "0 / 0";
    previousButton.disabled = !pages || pageNumber <= 1;
    nextButton.disabled = !pages || pageNumber >= pages;
    zoomOutButton.disabled = !pages || scale <= MIN_SCALE;
    zoomInButton.disabled = !pages || scale >= MAX_SCALE;
    fitButton.disabled = !pages;
  }

  async function cancelWork() {
    generation += 1;
    if (renderTask) {
      renderTask.cancel();
      renderTask = null;
    }
    if (loadingTask) {
      await loadingTask.destroy().catch(() => undefined);
      loadingTask = null;
    } else if (document) {
      await document.destroy().catch(() => undefined);
    }
    document = null;
    context.clearRect(0, 0, canvas.width, canvas.height);
    canvas.width = 0;
    canvas.height = 0;
    updateControls();
  }

  async function renderCurrentPage() {
    if (!document) return;
    const activeGeneration = generation;
    const page = await document.getPage(pageNumber);
    if (activeGeneration !== generation) return;

    const viewport = page.getViewport({ scale });
    const pixelRatio = Math.min(globalThis.devicePixelRatio || 1, MAX_PIXEL_RATIO);
    canvas.width = Math.max(1, Math.floor(viewport.width * pixelRatio));
    canvas.height = Math.max(1, Math.floor(viewport.height * pixelRatio));
    canvas.style.width = `${Math.floor(viewport.width)}px`;
    canvas.style.height = `${Math.floor(viewport.height)}px`;

    setStatus(`دا أعرض الصفحة ${pageNumber}...`);
    renderTask = page.render({
      canvasContext: context,
      viewport,
      transform: pixelRatio === 1
        ? null
        : [pixelRatio, 0, 0, pixelRatio, 0, 0],
    });
    try {
      await renderTask.promise;
      if (activeGeneration === generation) {
        setStatus(`الصفحة ${pageNumber} من ${document.numPages}`);
      }
    } catch (error) {
      if (error?.name !== "RenderingCancelledException") throw error;
    } finally {
      renderTask = null;
    }
    updateControls();
  }

  async function fitWidth() {
    if (!document) return;
    const page = await document.getPage(pageNumber);
    const natural = page.getViewport({ scale: 1 });
    const available = Math.max(240, stage.clientWidth - 32);
    scale = clampScale(available / natural.width);
    await renderCurrentPage();
  }

  async function changePage(nextPage) {
    if (!document) return;
    pageNumber = Math.min(document.numPages, Math.max(1, nextPage));
    stage.scrollTop = 0;
    stage.scrollLeft = 0;
    await renderCurrentPage();
  }

  async function changeScale(nextScale) {
    if (!document) return;
    scale = clampScale(nextScale);
    await renderCurrentPage();
  }

  previousButton.addEventListener("click", () => changePage(pageNumber - 1));
  nextButton.addEventListener("click", () => changePage(pageNumber + 1));
  zoomOutButton.addEventListener("click", () => changeScale(scale / SCALE_STEP));
  zoomInButton.addEventListener("click", () => changeScale(scale * SCALE_STEP));
  fitButton.addEventListener("click", fitWidth);

  updateControls();

  return {
    async open(bytes) {
      await cancelWork();
      const activeGeneration = generation;
      const data = copyBytes(bytes);
      if (data.byteLength === 0) throw new Error("ملف PDF فارغ");

      setStatus("دا أجهز صفحات الملف...");
      loadingTask = getDocument({
        data,
        cMapUrl: new URL("../vendor/pdfjs/cmaps/", import.meta.url).href,
        cMapPacked: true,
        standardFontDataUrl: new URL(
          "../vendor/pdfjs/standard_fonts/",
          import.meta.url,
        ).href,
        wasmUrl: new URL("../vendor/pdfjs/wasm/", import.meta.url).href,
        iccUrl: new URL("../vendor/pdfjs/iccs/", import.meta.url).href,
      });

      try {
        const openedDocument = await loadingTask.promise;
        if (activeGeneration !== generation) {
          await openedDocument.destroy();
          return;
        }
        document = openedDocument;
        loadingTask = null;
        pageNumber = 1;
        scale = 1;
        await fitWidth();
      } catch (error) {
        if (activeGeneration === generation) {
          setStatus("تعذر عرض PDF داخلياً. تقدر تنزله أو تفتحه منفصل.", "error");
        }
        throw error;
      }
    },

    async destroy() {
      await cancelWork();
    },
  };
}
