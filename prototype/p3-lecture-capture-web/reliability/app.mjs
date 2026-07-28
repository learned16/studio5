import { openBrowserReliabilityDemo } from "./runtime.mjs";

const elements = {
  summary: document.querySelector("#current-summary"),
  createBackup: document.querySelector("#create-backup"),
  exportStatus: document.querySelector("#export-status"),
  backupFile: document.querySelector("#backup-file"),
  selectedBackup: document.querySelector("#selected-backup"),
  manifestPanel: document.querySelector("#manifest-panel"),
  manifestDate: document.querySelector("#manifest-date"),
  manifestSchema: document.querySelector("#manifest-schema"),
  manifestEntities: document.querySelector("#manifest-entities"),
  manifestContent: document.querySelector("#manifest-content"),
  manifestSize: document.querySelector("#manifest-size"),
  confirmReplace: document.querySelector("#confirm-replace"),
  restoreBackup: document.querySelector("#restore-backup"),
  restoreStatus: document.querySelector("#restore-status"),
  reloadApp: document.querySelector("#reload-app"),
};

const state = {
  demo: null,
  verifiedBundle: null,
};

function setStatus(element, message, tone = "normal") {
  element.textContent = message;
  element.dataset.tone = tone;
}

function formattedBytes(value) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function totalEntities(entityCounts) {
  return Object.values(entityCounts)
    .reduce((total, count) => total + count, 0);
}

function timestampName(prefix = "studio5-backup") {
  const stamp = new Date().toISOString().replaceAll(":", "-").replace(/\.\d{3}Z$/, "Z");
  return `${prefix}-${stamp}.studio5-backup.json`;
}

function downloadBundle(bundle, name) {
  const blob = new Blob([JSON.stringify(bundle)], {
    type: "application/vnd.studio5.backup+json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

function renderSummary(summary) {
  const values = [
    [summary.entityCount, "كل السجلات"],
    [summary.pdfCount, "PDF"],
    [summary.noteCount, "الملاحظات"],
    [summary.inkRevisionCount, "نسخ الرسم"],
  ];
  elements.summary.replaceChildren(...values.map(([value, label]) => {
    const article = document.createElement("article");
    const strong = document.createElement("strong");
    const span = document.createElement("span");
    strong.textContent = String(value);
    span.textContent = label;
    article.append(strong, span);
    return article;
  }));
}

function resetRestoreSelection() {
  state.verifiedBundle = null;
  elements.manifestPanel.hidden = true;
  elements.confirmReplace.checked = false;
  elements.confirmReplace.disabled = true;
  elements.restoreBackup.disabled = true;
  elements.reloadApp.hidden = true;
}

function renderManifest(manifest) {
  elements.manifestDate.textContent = new Date(manifest.createdAt).toLocaleString("ar-IQ");
  elements.manifestSchema.textContent = String(manifest.coreSchemaVersion);
  elements.manifestEntities.textContent = String(totalEntities(manifest.entityCounts));
  elements.manifestContent.textContent = String(manifest.contentCount);
  elements.manifestSize.textContent = formattedBytes(manifest.contentBytes);
  elements.manifestPanel.hidden = false;
}

elements.createBackup.addEventListener("click", async () => {
  elements.createBackup.disabled = true;
  setStatus(elements.exportStatus, "دا أفحص البيانات وأجهز النسخة...");
  try {
    const bundle = await state.demo.createBackup();
    downloadBundle(bundle, timestampName());
    setStatus(
      elements.exportStatus,
      `تم إنشاء نسخة سليمة: ${bundle.manifest.contentCount} محتوى، ${formattedBytes(bundle.manifest.contentBytes)}.`,
      "success",
    );
  } catch (error) {
    setStatus(
      elements.exportStatus,
      error.message || "تعذر إنشاء النسخة الاحتياطية.",
      "error",
    );
  } finally {
    elements.createBackup.disabled = false;
  }
});

elements.backupFile.addEventListener("change", async () => {
  resetRestoreSelection();
  setStatus(elements.restoreStatus, "");
  const file = elements.backupFile.files?.[0] ?? null;
  if (!file) {
    elements.selectedBackup.textContent = "لم يتم اختيار ملف";
    return;
  }
  elements.selectedBackup.textContent = `${file.name} — ${formattedBytes(file.size)}`;
  setStatus(elements.restoreStatus, "دا أفحص الـManifest والملفات والرسم...");
  try {
    const bundle = JSON.parse(await file.text());
    const verified = await state.demo.inspectBackup(bundle);
    state.verifiedBundle = bundle;
    renderManifest(verified.manifest);
    elements.confirmReplace.disabled = false;
    setStatus(
      elements.restoreStatus,
      "النسخة سليمة. اقرأ التأكيد قبل تفعيل الاستعادة.",
      "success",
    );
  } catch (error) {
    setStatus(
      elements.restoreStatus,
      error.message || "الملف ليس نسخة Studio5 سليمة.",
      "error",
    );
  }
});

elements.confirmReplace.addEventListener("change", () => {
  elements.restoreBackup.disabled = !(
    state.verifiedBundle && elements.confirmReplace.checked
  );
});

elements.restoreBackup.addEventListener("click", async () => {
  if (!state.verifiedBundle || !elements.confirmReplace.checked) return;
  elements.restoreBackup.disabled = true;
  elements.createBackup.disabled = true;
  setStatus(elements.restoreStatus, "دا أنشئ نسخة أمان من الحالة الحالية...");
  try {
    const safetyBackup = await state.demo.createBackup();
    downloadBundle(safetyBackup, timestampName("studio5-before-restore"));
    setStatus(elements.restoreStatus, "نسخة الأمان جاهزة. دا أستعيد النسخة المختارة...");
    await state.demo.restoreBackup(state.verifiedBundle);
    setStatus(
      elements.restoreStatus,
      "تمت الاستعادة والتحقق. أعد تحميل Studio5 لفتح البيانات المستعادة.",
      "success",
    );
    elements.reloadApp.hidden = false;
  } catch (error) {
    setStatus(
      elements.restoreStatus,
      error.message || "فشلت الاستعادة ولم تُعتمد بيانات غير متحققة.",
      "error",
    );
    elements.restoreBackup.disabled = false;
  } finally {
    elements.createBackup.disabled = false;
  }
});

elements.reloadApp.addEventListener("click", () => {
  window.location.reload();
});

async function start() {
  state.demo = openBrowserReliabilityDemo();
  renderSummary(await state.demo.summary());
}

start().catch((error) => {
  setStatus(
    elements.exportStatus,
    error.message || "تعذر فتح تخزين Studio5 المحلي.",
    "error",
  );
  elements.createBackup.disabled = true;
});
