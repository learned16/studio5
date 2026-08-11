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

export function createTodayReadFacade(repository) {
  if (typeof repository?.queryToday !== "function") {
    throw new TypeError("Today read facade requires AcademicRepository.queryToday");
  }
  return Object.freeze({
    query(options) {
      return repository.queryToday(options);
    },
  });
}

export async function openCanonicalTodayReadFacade({
  indexedDB = globalThis.indexedDB,
  now = Date.now,
  contextFactory = canonicalBrowserStorageContext,
} = {}) {
  const context = await contextFactory({ indexedDB, now });
  await context.repository.initialize();
  return createTodayReadFacade(context.repository);
}
