export const MAX_PDF_BYTES = 50 * 1024 * 1024;

export function validatePdfFile(file) {
  if (!file || typeof file !== "object") {
    throw new TypeError("اختر ملف PDF أولاً");
  }
  const name = String(file.name ?? "").trim();
  const type = String(file.type ?? "").trim().toLowerCase();
  const size = Number(file.size);
  if (!name.toLowerCase().endsWith(".pdf") && type !== "application/pdf") {
    throw new TypeError("الملف يجب أن يكون PDF");
  }
  if (!Number.isSafeInteger(size) || size < 1) {
    throw new TypeError("ملف PDF فارغ أو غير صالح");
  }
  if (size > MAX_PDF_BYTES) {
    throw new RangeError("حجم PDF يتجاوز 50MB");
  }
  return { name, type: "application/pdf", size };
}

export function draftKey(artifactId = "none") {
  return `studio5:p3:pdf-note-draft:${artifactId}`;
}

export function readDraft(storage, artifactId) {
  const raw = storage?.getItem?.(draftKey(artifactId));
  if (!raw) return { title: "", body: "", pageNumber: "" };
  try {
    const value = JSON.parse(raw);
    return {
      title: String(value?.title ?? ""),
      body: String(value?.body ?? ""),
      pageNumber: String(value?.pageNumber ?? ""),
    };
  } catch {
    return { title: "", body: "", pageNumber: "" };
  }
}

export function writeDraft(storage, artifactId, draft) {
  const normalized = {
    title: String(draft?.title ?? ""),
    body: String(draft?.body ?? ""),
    pageNumber: String(draft?.pageNumber ?? ""),
  };
  storage?.setItem?.(draftKey(artifactId), JSON.stringify(normalized));
  return normalized;
}

export function clearDraft(storage, artifactId) {
  storage?.removeItem?.(draftKey(artifactId));
}
