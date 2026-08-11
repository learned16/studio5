async function canonicalBrowserStorageContext(options) {
  const [{ CANONICAL_BROWSER_STORAGE_PROFILE }, { createBrowserStorageContext }] =
    await Promise.all([
      import("./core/browser-storage-profile.mjs"),
      import("./core/browser-storage-migration.mjs"),
    ]);
  return createBrowserStorageContext({
    ...options,
    profile: CANONICAL_BROWSER_STORAGE_PROFILE,
  });
}

export async function openCanonicalReadRepository({
  indexedDB = globalThis.indexedDB,
  now = Date.now,
  contextFactory = canonicalBrowserStorageContext,
} = {}) {
  const context = await contextFactory({ indexedDB, now });
  await context.repository.initialize();
  return context.repository;
}
