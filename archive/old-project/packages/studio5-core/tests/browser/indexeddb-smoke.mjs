import { IndexedDbCoreDriver } from "../../src/indexeddb-driver.mjs";
import { CoreLocalDatabase } from "../../src/local-database.mjs";
import { createAcademicYear } from "../../src/model.mjs";
import { CoreStore } from "../../src/store.mjs";

const result = document.querySelector("#result");

try {
  const databaseName = `studio5-core-browser-smoke-${Date.now()}`;
  const store = new CoreStore();
  const year = createAcademicYear({
    label: "اختبار المتصفح",
    startDate: "2026-09-01",
    endDate: "2027-06-30",
  });
  store.add("academicYears", year);
  const source = store.exportSnapshot();

  const firstDriver = new IndexedDbCoreDriver({ databaseName });
  const firstDatabase = new CoreLocalDatabase(firstDriver);
  await firstDatabase.save(source);
  firstDriver.close();

  const reopenedDriver = new IndexedDbCoreDriver({ databaseName });
  const reopenedDatabase = new CoreLocalDatabase(reopenedDriver);
  const loaded = await reopenedDatabase.load();
  reopenedDriver.close();

  if (loaded.snapshot.entities.academicYears[0]?.id !== year.id) {
    throw new Error("Stable ID changed after IndexedDB reload");
  }
  if (loaded.source !== "snapshot" || loaded.recovered) {
    throw new Error("Unexpected IndexedDB load state");
  }

  result.dataset.status = "pass";
  result.textContent = JSON.stringify({
    status: "PASS",
    schemaVersion: loaded.snapshot.schemaVersion,
    academicYearId: year.id,
    source: loaded.source,
  }, null, 2);
} catch (error) {
  result.dataset.status = "fail";
  result.textContent = JSON.stringify({
    status: "FAIL",
    message: error.message,
  }, null, 2);
}
