import { AcademicRepository } from "./core/academic-repository.mjs";
import { IndexedDbCoreDriver } from "./core/indexeddb-driver.mjs";
import { CoreLocalDatabase } from "./core/local-database.mjs";
import { createLectureCaptureDemo } from "./lecture-demo.mjs";

export function openBrowserLectureCaptureDemo(options = {}) {
  const driver = new IndexedDbCoreDriver({
    databaseName: "studio5-p3-lecture-capture-core",
  });
  const database = new CoreLocalDatabase(driver);
  const repository = new AcademicRepository(database);
  return createLectureCaptureDemo(repository, options);
}
