import * as backupApi from "../core/backup.mjs";
import { openStudio5BrowserStorage } from "../storage-runtime.mjs";
import { createReliabilityDemo } from "./reliability-demo.mjs";

export async function openBrowserReliabilityDemo() {
  const {
    repository,
    database,
    contentStore,
  } = await openStudio5BrowserStorage();
  return createReliabilityDemo({
    repository,
    database,
    contentStore,
    backupApi,
  });
}
