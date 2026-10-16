export class MemoryCoreDriver {
  snapshot = null;
  journal = null;
  failNextCommit = false;

  async readSnapshot() {
    return this.snapshot ? structuredClone(this.snapshot) : null;
  }

  async readJournal() {
    return this.journal ? structuredClone(this.journal) : null;
  }

  async writeJournal(journal) {
    this.journal = structuredClone(journal);
  }

  async commitSnapshotAndClearJournal(record) {
    if (this.failNextCommit) {
      this.failNextCommit = false;
      throw new Error("Simulated transaction failure");
    }
    this.snapshot = structuredClone(record);
    this.journal = null;
  }
}
