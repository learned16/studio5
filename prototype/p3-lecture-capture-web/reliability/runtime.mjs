import { AcademicRepository } from "../core/academic-repository.mjs";
import { IndexedDbCoreDriver } from "../core/indexeddb-driver.mjs";
import { IndexedDbFileContentStore } from "../core/indexeddb-file-content-store.mjs";
import { CoreLocalDatabase } from "../core/local-database.mjs";
import * as backupApi from "../core/backup.mjs";
import { createReliabilityDemo } from "./reliability-demo.mjs";

export function openBrowserReliabilityDemo() {
  const driver = new IndexedDbCoreDriver({
    databaseName: "studio5-p3-lecture-capture-core",
  });
  const contentStore = new IndexedDbFileContentStore({
    databaseName: "studio5-p3-library-content",
  });
  const database = new CoreLocalDatabase(driver);
  const repository = new AcademicRepository(database, {
    fileContentStore: contentStore,
  });
  return createReliabilityDemo({
    repository,
    database,
    contentStore,
    backupApi,
  });
}
