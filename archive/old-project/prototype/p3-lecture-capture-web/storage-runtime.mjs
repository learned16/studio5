import {
  createBrowserStorageContext,
  openCanonicalBrowserStorage,
} from "./core/browser-storage-migration.mjs";
import {
  CANONICAL_BROWSER_STORAGE_PROFILE,
} from "./core/browser-storage-profile.mjs";

const MIGRATION_MARKER_KEY = "studio5:browser-storage:canonical-v1";
let opening = null;

function migrationCompleted(storage = globalThis.localStorage) {
  try {
    return storage?.getItem(MIGRATION_MARKER_KEY) === "complete";
  } catch {
    return false;
  }
}

function markMigrationCompleted(storage = globalThis.localStorage) {
  try {
    storage?.setItem(MIGRATION_MARKER_KEY, "complete");
  } catch {
    // IndexedDB is authoritative. An unavailable LocalStorage marker only
    // means that the safe migration check will run again next time.
  }
}

async function openStorage() {
  if (migrationCompleted()) {
    return {
      ...createBrowserStorageContext({
        profile: CANONICAL_BROWSER_STORAGE_PROFILE,
      }),
      migrations: [],
    };
  }

  const context = await openCanonicalBrowserStorage();
  markMigrationCompleted();
  return context;
}

export function openStudio5BrowserStorage() {
  if (!opening) {
    opening = openStorage().catch((error) => {
      opening = null;
      throw error;
    });
  }
  return opening;
}
