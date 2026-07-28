import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { AcademicRepository } from "../../../packages/studio5-core/src/academic-repository.mjs";
import { CoreLocalDatabase } from "../../../packages/studio5-core/src/local-database.mjs";
import * as backupApi from "../../../packages/studio5-core/src/backup.mjs";
import { MemoryCoreDriver } from "../../../packages/studio5-core/tests/helpers/memory-driver.mjs";
import { MemoryFileContentStore } from "../../../packages/studio5-core/tests/helpers/memory-file-content-store.mjs";
import { createReliabilityDemo } from "../reliability/reliability-demo.mjs";

const root = new URL("../", import.meta.url);

test("Reliability UI keeps restore locked until file verification and confirmation", async () => {
  const [html, css, app, serviceWorker] = await Promise.all([
    readFile(new URL("reliability/index.html", root), "utf8"),
    readFile(new URL("reliability/styles.css", root), "utf8"),
    readFile(new URL("reliability/app.mjs", root), "utf8"),
    readFile(new URL("sw.js", root), "utf8"),
  ]);

  assert.match(html, /id="create-backup"/);
  assert.match(html, /id="backup-file"[\s\S]*type="file"/);
  assert.doesNotMatch(html, /id="backup-file"[\s\S]{0,180}accept=/);
  assert.match(html, /id="confirm-replace"[\s\S]*disabled/);
  assert.match(html, /id="restore-backup"[\s\S]*disabled/);
  assert.match(html, /id="manifest-panel"[\s\S]*hidden/);
  assert.match(css, /\.native-file-field input\[type="file"\]\s*\{[\s\S]*opacity:\s*1;/);
  assert.match(app, /inspectBackup\(bundle\)/);
  assert.match(app, /confirmReplace\.checked/);
  assert.match(app, /studio5-before-restore/);
  assert.match(serviceWorker, /studio5-p4-storage-v2/);
  assert.match(serviceWorker, /\.\/reliability\/index\.html/);
});

test("Reliability bridge summarizes and round-trips a verified backup", async () => {
  const driver = new MemoryCoreDriver();
  const contentStore = new MemoryFileContentStore();
  const database = new CoreLocalDatabase(driver);
  const repository = new AcademicRepository(database, {
    fileContentStore: contentStore,
  });
  const demo = createReliabilityDemo({
    repository,
    database,
    contentStore,
    backupApi,
  });

  const initial = await demo.summary();
  const backup = await demo.createBackup();
  const verified = await demo.inspectBackup(backup);
  const restored = await demo.restoreBackup(backup);

  assert.equal(initial.entityCount, 0);
  assert.equal(verified.manifest.contentCount, 0);
  assert.equal(restored.restored, true);
  assert.equal(restored.replacedExisting, false);
});
