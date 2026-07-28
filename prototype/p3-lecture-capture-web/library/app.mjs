import { openBrowserLibraryDemo } from "./runtime.mjs";
import {
  clearDraft,
  readDraft,
  validatePdfFile,
  writeDraft,
} from "./library-state.mjs";

const elements = {
  uploadForm: document.querySelector("#upload-form"),
  pdfFile: document.querySelector("#pdf-file"),
  pdfPickerLabel: document.querySelector("#pdf-picker-label"),
  uploadSubmit: document.querySelector("#upload-submit"),
  uploadStatus: document.querySelector("#upload-status"),
  fileCount: document.querySelector("#file-count"),
  fileList: document.querySelector("#file-list"),
  selectedFile: document.querySelector("#selected-file"),
  favoriteFile: document.querySelector("#favorite-file"),
  openExternal: document.querySelector("#open-external"),
  viewerEmpty: document.querySelector("#viewer-empty"),
  pdfViewer: document.querySelector("#pdf-viewer"),
  noteForm: document.querySelector("#note-form"),
  noteTitle: document.querySelector("#note-title"),
  notePage: document.querySelector("#note-page"),
  noteBody: document.querySelector("#note-body"),
  draftStatus: document.querySelector("#draft-status"),
  notesList: document.querySelector("#notes-list"),
  searchInput: document.querySelector("#search-input"),
  resourceList: document.querySelector("#resource-list"),
  tabs: [...document.querySelectorAll(".tab")],
};

const state = {
  demo: null,
  files: [],
  selected: null,
  objectUrl: null,
  resourceView: "search",
};

function setStatus(message, tone = "normal") {
  elements.uploadStatus.textContent = message;
  elements.uploadStatus.dataset.tone = tone;
}

function formattedFileSize(size) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function updateFileSelection() {
  const file = elements.pdfFile.files?.[0] ?? null;
  if (!file) {
    elements.pdfPickerLabel.textContent = "لم يتم اختيار ملف";
    elements.uploadSubmit.disabled = true;
    setStatus("");
    return;
  }
  try {
    validatePdfFile(file);
    elements.pdfPickerLabel.textContent = `${file.name} — ${formattedFileSize(file.size)}`;
    elements.uploadSubmit.disabled = false;
    setStatus("الملف جاهز للحفظ في المكتبة.");
  } catch (error) {
    elements.pdfPickerLabel.textContent = file.name || "ملف غير صالح";
    elements.uploadSubmit.disabled = true;
    setStatus(error.message || "تعذر اختيار PDF", "error");
  }
}

function button(label, className, handler) {
  const node = document.createElement("button");
  node.type = "button";
  node.className = className;
  node.textContent = label;
  node.addEventListener("click", handler);
  return node;
}

function emptyMessage(text) {
  const node = document.createElement("p");
  node.className = "empty-message";
  node.textContent = text;
  return node;
}

async function refreshFiles() {
  state.files = (await state.demo.listPdfs())
    .filter(({ version }) => version?.mediaType === "application/pdf")
    .sort((left, right) => (
      right.artifact.updatedAt.localeCompare(left.artifact.updatedAt)
    ));
  elements.fileCount.textContent = `${state.files.length} ملف`;
  elements.fileList.replaceChildren();
  if (state.files.length === 0) {
    elements.fileList.append(emptyMessage("بعد ماكو PDF محفوظ."));
    return;
  }
  for (const entry of state.files) {
    const node = button(entry.artifact.displayName, "file-item", () => openPdf(entry));
    if (state.selected?.artifact.id === entry.artifact.id) node.classList.add("selected");
    const meta = document.createElement("small");
    meta.textContent = `${Math.max(1, Math.round(entry.version.byteSize / 1024))} KB`;
    node.append(meta);
    elements.fileList.append(node);
  }
}

function restoreDraft() {
  const artifactId = state.selected?.artifact.id ?? "none";
  const draft = readDraft(localStorage, artifactId);
  elements.noteTitle.value = draft.title;
  elements.noteBody.value = draft.body;
  elements.notePage.value = draft.pageNumber;
  elements.draftStatus.textContent = draft.title || draft.body
    ? "تمت استعادة المسودة المحلية"
    : "المسودة محفوظة محلياً";
}

function saveDraft() {
  const artifactId = state.selected?.artifact.id ?? "none";
  writeDraft(localStorage, artifactId, {
    title: elements.noteTitle.value,
    body: elements.noteBody.value,
    pageNumber: elements.notePage.value,
  });
  elements.draftStatus.textContent = "حُفظت المسودة الآن";
}

async function refreshNotes() {
  elements.notesList.replaceChildren();
  if (!state.selected) {
    elements.notesList.append(emptyMessage("اختر PDF حتى تشوف ملاحظاته."));
    return;
  }
  const notes = await state.demo.listNotes(state.selected.artifact.id);
  if (notes.length === 0) {
    elements.notesList.append(emptyMessage("ماكو ملاحظات معتمدة على هذا الملف."));
    return;
  }
  for (const note of notes) {
    const article = document.createElement("article");
    const heading = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = note.title;
    const favorite = button("☆", "icon-button", async () => {
      const results = await state.demo.repository.searchLibrary({
        query: note.title,
        targetKinds: ["note"],
      });
      const current = results.find((item) => item.targetId === note.id);
      await state.demo.repository.setResourceFavorite("note", note.id, !current?.isFavorite);
      await refreshResources();
    });
    heading.append(title, favorite);
    const body = document.createElement("p");
    body.textContent = note.body;
    const meta = document.createElement("small");
    meta.textContent = note.pageNumber ? `صفحة ${note.pageNumber}` : "بدون صفحة محددة";
    article.append(heading, body, meta);
    article.addEventListener("click", () => (
      state.demo.repository.recordResourceOpened("note", note.id).then(refreshResources)
    ));
    elements.notesList.append(article);
  }
}

async function openPdf(entry) {
  const opened = await state.demo.openPdf(entry.artifact.id);
  if (!opened) {
    setStatus("تعذر فتح الملف المحلي. أعد إضافته.", "error");
    return;
  }
  if (state.objectUrl) URL.revokeObjectURL(state.objectUrl);
  const blob = new Blob([opened.content.bytes], { type: "application/pdf" });
  state.objectUrl = URL.createObjectURL(blob);
  state.selected = entry;
  elements.selectedFile.textContent = entry.artifact.displayName;
  elements.pdfViewer.src = state.objectUrl;
  elements.pdfViewer.hidden = false;
  elements.viewerEmpty.hidden = true;
  elements.openExternal.href = state.objectUrl;
  elements.openExternal.classList.remove("disabled");
  elements.favoriteFile.disabled = false;
  await refreshFileFavorite();
  await refreshFiles();
  restoreDraft();
  await refreshNotes();
  await refreshResources();
}

async function refreshFileFavorite() {
  if (!state.selected) return;
  const results = await state.demo.repository.searchLibrary({
    query: state.selected.artifact.displayName,
    targetKinds: ["file-artifact"],
  });
  const current = results.find((item) => item.targetId === state.selected.artifact.id);
  elements.favoriteFile.dataset.favorite = String(Boolean(current?.isFavorite));
  elements.favoriteFile.textContent = current?.isFavorite ? "★ مفضلة" : "☆ مفضلة";
}

async function resourceItems() {
  if (state.resourceView === "favorites") {
    return state.demo.repository.listFavoriteResources({ limit: 30 });
  }
  if (state.resourceView === "recent") {
    return state.demo.repository.listRecentResources({ limit: 30 });
  }
  return state.demo.repository.searchLibrary({
    query: elements.searchInput.value,
    limit: 30,
  });
}

async function openResource(item) {
  if (item.targetKind === "file-artifact") {
    const entry = state.files.find(({ artifact }) => artifact.id === item.targetId);
    if (entry) await openPdf(entry);
    return;
  }
  if (item.targetKind === "note") {
    const note = await state.demo.repository.getNote(item.targetId);
    if (note?.artifactId) {
      const entry = state.files.find(({ artifact }) => artifact.id === note.artifactId);
      if (entry) await openPdf(entry);
    }
    await state.demo.repository.recordResourceOpened("note", item.targetId);
    await refreshResources();
  }
}

async function refreshResources() {
  const items = await resourceItems();
  elements.resourceList.replaceChildren();
  if (items.length === 0) {
    elements.resourceList.append(emptyMessage("لا توجد عناصر بهذا العرض."));
    return;
  }
  for (const item of items) {
    const article = document.createElement("article");
    const content = button(item.title, "resource-main", () => openResource(item));
    const meta = document.createElement("small");
    meta.textContent = item.subtitle || item.targetKind;
    content.append(meta);
    const favorite = button(item.isFavorite ? "★" : "☆", "icon-button", async () => {
      await state.demo.repository.setResourceFavorite(
        item.targetKind,
        item.targetId,
        !item.isFavorite,
      );
      await refreshResources();
      await refreshFileFavorite();
    });
    article.append(content, favorite);
    elements.resourceList.append(article);
  }
}

elements.uploadForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const file = elements.pdfFile.files?.[0];
  try {
    validatePdfFile(file);
    setStatus("دا أحفظ الملف محلياً...");
    const result = await state.demo.ingestPdf(file);
    await refreshFiles();
    const entry = state.files.find(({ artifact }) => artifact.id === result.artifact.id);
    if (entry) await openPdf(entry);
    elements.uploadForm.reset();
    updateFileSelection();
    setStatus(
      result.status === "duplicate"
        ? "هذا الملف موجود؛ فتحت النسخة المحفوظة."
        : "انحفظ PDF محلياً بنجاح.",
      "success",
    );
  } catch (error) {
    setStatus(error.message || "فشل حفظ PDF", "error");
  }
});

elements.pdfFile.addEventListener("change", updateFileSelection);
elements.noteForm.addEventListener("input", saveDraft);
elements.noteForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!state.selected) {
    elements.draftStatus.textContent = "اختر PDF أولاً.";
    return;
  }
  try {
    const note = await state.demo.createNote({
      artifactId: state.selected.artifact.id,
      fileVersionId: state.selected.version.id,
      title: elements.noteTitle.value,
      body: elements.noteBody.value,
      pageNumber: elements.notePage.value || null,
    });
    clearDraft(localStorage, state.selected.artifact.id);
    elements.noteForm.reset();
    elements.draftStatus.textContent = "اعتمدت الملاحظة وربطتها بالملف.";
    await state.demo.repository.recordResourceOpened("note", note.id);
    await refreshNotes();
    await refreshResources();
  } catch (error) {
    elements.draftStatus.textContent = error.message || "تعذر حفظ الملاحظة.";
  }
});

elements.favoriteFile.addEventListener("click", async () => {
  if (!state.selected) return;
  const next = elements.favoriteFile.dataset.favorite !== "true";
  await state.demo.repository.setResourceFavorite(
    "file-artifact",
    state.selected.artifact.id,
    next,
  );
  await refreshFileFavorite();
  await refreshResources();
});

elements.searchInput.addEventListener("input", () => {
  state.resourceView = "search";
  for (const tab of elements.tabs) {
    tab.classList.toggle("active", tab.dataset.view === "search");
  }
  refreshResources();
});

for (const tab of elements.tabs) {
  tab.addEventListener("click", () => {
    state.resourceView = tab.dataset.view;
    for (const candidate of elements.tabs) {
      candidate.classList.toggle("active", candidate === tab);
    }
    refreshResources();
  });
}

window.addEventListener("beforeunload", () => {
  if (state.objectUrl) URL.revokeObjectURL(state.objectUrl);
});

try {
  state.demo = await openBrowserLibraryDemo();
  await refreshFiles();
  restoreDraft();
  await refreshNotes();
  await refreshResources();
  navigator.serviceWorker?.register?.("../sw.js").catch(() => undefined);
} catch (error) {
  setStatus(error.message || "تعذر تشغيل المكتبة المحلية", "error");
}
