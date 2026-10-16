import { AcademicRepository } from "./academic-repository.mjs";
import {
  restorePortableBackup,
} from "./backup.mjs";
import {
  CANONICAL_BROWSER_STORAGE_PROFILE,
  LEGACY_BROWSER_STORAGE_PROFILES,
  assertBrowserStorageProfile,
  sameBrowserStorageProfile,
} from "./browser-storage-profile.mjs";
import { IndexedDbCoreDriver } from "./indexeddb-driver.mjs";
import { IndexedDbFileContentStore } from "./indexeddb-file-content-store.mjs";
import { CoreLocalDatabase } from "./local-database.mjs";

function entityCount(bundle) {
  return Object.values(bundle.manifest.entityCounts)
    .reduce((total, count) => total + count, 0);
}

function sameSnapshotData(left, right) {
  return left.schemaVersion === right.schemaVersion
    && JSON.stringify(left.entities) === JSON.stringify(right.entities);
}

export class BrowserStorageMigrationConflictError extends Error {
  constructor(sourceProfileId, targetProfileId) {
    super(
      `Storage migration from ${sourceProfileId} to ${targetProfileId} requires an explicit decision`,
    );
    this.name = "BrowserStorageMigrationConflictError";
    this.sourceProfileId = sourceProfileId;
    this.targetProfileId = targetProfileId;
  }
}

export function createBrowserStorageContext({
  profile = CANONICAL_BROWSER_STORAGE_PROFILE,
  indexedDB = globalThis.indexedDB,
  now = Date.now,
} = {}) {
  const selected = assertBrowserStorageProfile(profile);
  const driver = new IndexedDbCoreDriver({
    indexedDB,
    databaseName: selected.coreDatabaseName,
  });
  const database = new CoreLocalDatabase(driver, { now });
  const contentStore = new IndexedDbFileContentStore({
    indexedDB,
    databaseName: selected.contentDatabaseName,
  });
  const repository = new AcademicRepository(database, {
    fileContentStore: contentStore,
    now,
  });
  return {
    profile: selected,
    driver,
    database,
    contentStore,
    repository,
  };
}

export async function migrateRepositoryStorage({
  sourceProfile,
  sourceRepository,
  targetProfile,
  targetRepository,
  targetDatabase,
  targetContentStore,
}) {
  const source = assertBrowserStorageProfile(sourceProfile);
  const target = assertBrowserStorageProfile(targetProfile);
  if (sameBrowserStorageProfile(source, target)) {
    return {
      status: "same-profile",
      sourceProfileId: source.id,
      targetProfileId: target.id,
    };
  }

  await sourceRepository.initialize();
  const sourceBundle = await sourceRepository.createPortableBackup();
  if (entityCount(sourceBundle) === 0) {
    return {
      status: "no-source-data",
      sourceProfileId: source.id,
      targetProfileId: target.id,
    };
  }

  await targetRepository.initialize();
  const targetBundle = await targetRepository.createPortableBackup();
  if (sameSnapshotData(targetBundle.snapshot, sourceBundle.snapshot)) {
    return {
      status: "already-migrated",
      sourceProfileId: source.id,
      targetProfileId: target.id,
      manifest: structuredClone(sourceBundle.manifest),
    };
  }
  if (entityCount(targetBundle) > 0) {
    throw new BrowserStorageMigrationConflictError(source.id, target.id);
  }

  const restored = await restorePortableBackup({
    bundle: sourceBundle,
    database: targetDatabase,
    contentStore: targetContentStore,
    allowReplace: false,
  });
  return {
    status: "migrated",
    sourceProfileId: source.id,
    targetProfileId: target.id,
    manifest: structuredClone(restored.manifest),
  };
}

export async function openCanonicalBrowserStorage({
  indexedDB = globalThis.indexedDB,
  now = Date.now,
  legacyProfiles = LEGACY_BROWSER_STORAGE_PROFILES,
} = {}) {
  const target = createBrowserStorageContext({
    profile: CANONICAL_BROWSER_STORAGE_PROFILE,
    indexedDB,
    now,
  });
  const migrations = [];

  for (const sourceProfile of legacyProfiles) {
    if (sameBrowserStorageProfile(sourceProfile, target.profile)) continue;
    const source = createBrowserStorageContext({
      profile: sourceProfile,
      indexedDB,
      now,
    });
    try {
      const result = await migrateRepositoryStorage({
        sourceProfile: source.profile,
        sourceRepository: source.repository,
        targetProfile: target.profile,
        targetRepository: target.repository,
        targetDatabase: target.database,
        targetContentStore: target.contentStore,
      });
      migrations.push(result);
    } finally {
      source.driver.close();
      source.contentStore.close();
    }
  }

  return {
    ...target,
    migrations,
  };
}
