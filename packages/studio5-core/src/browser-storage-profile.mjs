export const BROWSER_STORAGE_PROFILE_VERSION = 1;

function createProfile({
  id,
  coreDatabaseName,
  contentDatabaseName,
}) {
  return Object.freeze({
    version: BROWSER_STORAGE_PROFILE_VERSION,
    id: String(id),
    coreDatabaseName: String(coreDatabaseName),
    contentDatabaseName: String(contentDatabaseName),
  });
}

export const CANONICAL_BROWSER_STORAGE_PROFILE = createProfile({
  id: "studio5-canonical-v1",
  coreDatabaseName: "studio5-core",
  contentDatabaseName: "studio5-file-content",
});

export const LEGACY_BROWSER_STORAGE_PROFILES = Object.freeze([
  createProfile({
    id: "phase3-lecture-library-v1",
    coreDatabaseName: "studio5-p3-lecture-capture-core",
    contentDatabaseName: "studio5-p3-library-content",
  }),
]);

export function assertBrowserStorageProfile(profile) {
  if (!profile || profile.version !== BROWSER_STORAGE_PROFILE_VERSION) {
    throw new TypeError("Unsupported browser storage profile");
  }
  for (const field of ["id", "coreDatabaseName", "contentDatabaseName"]) {
    if (typeof profile[field] !== "string" || profile[field].trim() === "") {
      throw new TypeError(`Browser storage profile requires ${field}`);
    }
  }
  return profile;
}

export function sameBrowserStorageProfile(left, right) {
  const first = assertBrowserStorageProfile(left);
  const second = assertBrowserStorageProfile(right);
  return first.coreDatabaseName === second.coreDatabaseName
    && first.contentDatabaseName === second.contentDatabaseName;
}
