export class MemoryFileContentStore {
  records = new Map();
  putCount = 0;

  async putIfAbsent(key, bytes, {
    mediaType = "application/octet-stream",
    now = Date.now(),
  } = {}) {
    this.putCount += 1;
    const existing = this.records.get(key);
    if (existing) {
      return { created: false, record: structuredClone(existing) };
    }
    const content = bytes instanceof ArrayBuffer
      ? new Uint8Array(bytes.slice(0))
      : new Uint8Array(
        bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
      );
    const record = {
      key,
      bytes: content,
      byteSize: content.byteLength,
      mediaType,
      createdAt: new Date(now).toISOString(),
    };
    this.records.set(key, structuredClone(record));
    return { created: true, record: structuredClone(record) };
  }

  async get(key) {
    const record = this.records.get(key);
    return record ? structuredClone(record) : null;
  }
}
