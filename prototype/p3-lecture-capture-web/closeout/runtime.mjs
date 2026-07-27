import { AcademicRepository } from "../core/academic-repository.mjs";
import { IndexedDbCoreDriver } from "../core/indexeddb-driver.mjs";
import { CoreLocalDatabase } from "../core/local-database.mjs";
import { createLectureCloseoutDemo } from "./closeout-bridge.mjs";

export function openBrowserLectureCloseoutDemo(options = {}) {
  const driver = new IndexedDbCoreDriver({
    databaseName: "studio5-p3-lecture-capture-core",
  });
  const database = new CoreLocalDatabase(driver);
  const repository = new AcademicRepository(database);
  return createLectureCloseoutDemo(repository, options);
}
