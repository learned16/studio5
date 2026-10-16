function countEntities(snapshot) {
  return Object.values(snapshot.entities)
    .reduce((total, entities) => total + entities.length, 0);
}

export function createReliabilityDemo({
  repository,
  database,
  contentStore,
  backupApi,
}) {
  if (!repository || typeof repository.createPortableBackup !== "function") {
    throw new TypeError("Reliability demo requires a backup-capable repository");
  }
  if (!database || typeof database.load !== "function") {
    throw new TypeError("Reliability demo requires a local database");
  }
  if (!contentStore || typeof contentStore.get !== "function") {
    throw new TypeError("Reliability demo requires a content store");
  }
  if (typeof backupApi?.verifyPortableBackup !== "function"
    || typeof backupApi?.restorePortableBackup !== "function") {
    throw new TypeError("Reliability demo requires the portable backup API");
  }

  return {
    async summary() {
      const snapshot = await repository.exportSnapshot();
      return {
        schemaVersion: snapshot.schemaVersion,
        entityCount: countEntities(snapshot),
        pdfCount: snapshot.entities.fileVersions
          .filter(({ mediaType }) => mediaType === "application/pdf").length,
        noteCount: snapshot.entities.notes.length,
        inkRevisionCount: snapshot.entities.inkRevisions.length,
      };
    },
    createBackup() {
      return repository.createPortableBackup();
    },
    inspectBackup(bundle) {
      return backupApi.verifyPortableBackup(bundle);
    },
    restoreBackup(bundle) {
      return backupApi.restorePortableBackup({
        bundle,
        database,
        contentStore,
        allowReplace: true,
      });
    },
  };
}
