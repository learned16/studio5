function requiredText(value, field) {
  const normalized = String(value ?? "").trim();
  if (!normalized) throw new TypeError(`${field} is required`);
  return normalized;
}

async function copyBytes(value) {
  if (typeof Blob !== "undefined" && value instanceof Blob) {
    return new Uint8Array(await value.arrayBuffer());
  }
  if (value instanceof ArrayBuffer) {
    return new Uint8Array(value.slice(0));
  }
  if (ArrayBuffer.isView(value)) {
    return new Uint8Array(
      value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength),
    );
  }
  throw new TypeError("bytes must be a Blob, ArrayBuffer, or typed array");
}

export async function sha256Hex(value, {
  crypto = globalThis.crypto,
} = {}) {
  if (!crypto?.subtle || typeof crypto.subtle.digest !== "function") {
    throw new TypeError("Web Crypto SHA-256 is unavailable");
  }
  const bytes = await copyBytes(value);
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  return [...digest].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function assertFileContentStore(store) {
  for (const method of ["putIfAbsent", "get"]) {
    if (typeof store?.[method] !== "function") {
      throw new TypeError(`File content store is missing ${method}()`);
    }
  }
  return store;
}

export async function prepareFileIntake(input, options = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError("File intake input must be an object");
  }
  const bytes = await copyBytes(input.bytes);
  const digest = await sha256Hex(bytes, options);
  const originalName = requiredText(input.originalName, "originalName");
  return {
    bytes,
    digest,
    algorithm: "sha-256",
    storageKey: `sha256/${digest}`,
    byteSize: bytes.byteLength,
    originalName,
    displayName: requiredText(input.displayName ?? originalName, "displayName"),
    mediaType: requiredText(
      input.mediaType ?? "application/octet-stream",
      "mediaType",
    ).toLowerCase(),
    sourceType: requiredText(input.sourceType ?? "upload", "sourceType").toLowerCase(),
    originalModifiedAt: input.originalModifiedAt ?? null,
  };
}
