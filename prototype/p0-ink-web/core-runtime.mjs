import { AcademicRepository } from "./core/academic-repository.mjs";
import { IndexedDbFileContentStore } from "./core/indexeddb-file-content-store.mjs";
import { IndexedDbCoreDriver } from "./core/indexeddb-driver.mjs";
import { CoreLocalDatabase } from "./core/local-database.mjs";
import { createNotebookDemo } from "./notebook-bridge.mjs";

export function openBrowserNotebookDemo(options = {}) {
  const driver = new IndexedDbCoreDriver({
    databaseName: "studio5-core",
  });
  const database = new CoreLocalDatabase(driver);
  const fileContentStore = new IndexedDbFileContentStore({
    databaseName: "studio5-file-content",
  });
  const repository = new AcademicRepository(database, { fileContentStore });
  return createNotebookDemo(repository, options);
}
