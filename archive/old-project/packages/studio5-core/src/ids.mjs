const ID_PATTERN = /^[a-z][a-z0-9-]*_[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const KIND_PATTERN = /^[a-z][a-z0-9-]*$/;

export function createStableId(kind) {
  if (!KIND_PATTERN.test(kind)) {
    throw new TypeError(`Invalid entity kind: ${kind}`);
  }
  const uuid = globalThis.crypto?.randomUUID?.();
  if (!uuid) {
    throw new Error("Secure random UUID generation is unavailable");
  }
  return `${kind}_${uuid}`;
}

export function isStableId(value, expectedKind = null) {
  if (typeof value !== "string" || !ID_PATTERN.test(value)) return false;
  if (!expectedKind) return true;
  return value.startsWith(`${expectedKind}_`);
}

export function assertStableId(value, expectedKind = null) {
  if (!isStableId(value, expectedKind)) {
    const suffix = expectedKind ? ` for ${expectedKind}` : "";
    throw new TypeError(`Invalid stable ID${suffix}: ${value}`);
  }
  return value;
}
