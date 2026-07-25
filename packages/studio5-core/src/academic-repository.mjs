import { assertStableId } from "./ids.mjs";
import {
  createAcademicYear,
  createCapabilityPack,
  createSemester,
  createSubject,
  createSubjectProfile,
} from "./model.mjs";
import { CoreStore } from "./store.mjs";

function withDefaultNow(input = {}, now) {
  return Object.hasOwn(input, "now") ? input : { ...input, now };
}

export class AcademicRepositoryRecoveryRequiredError extends Error {
  constructor() {
    super("Academic repository requires recovery before another write");
    this.name = "AcademicRepositoryRecoveryRequiredError";
  }
}

export class AcademicRepository {
  #database;
  #now;
  #store = null;
  #initialized = false;
  #needsRecovery = false;
  #operationQueue = Promise.resolve();
  #lastLoad = null;

  constructor(localDatabase, { now = Date.now } = {}) {
    if (!localDatabase
      || typeof localDatabase.load !== "function"
      || typeof localDatabase.save !== "function") {
      throw new TypeError("AcademicRepository requires a CoreLocalDatabase-compatible object");
    }
    if (typeof now !== "function") throw new TypeError("now must be a function");
    this.#database = localDatabase;
    this.#now = now;
  }

  #enqueue(operation) {
    const result = this.#operationQueue.then(operation, operation);
    this.#operationQueue = result.catch(() => undefined);
    return result;
  }

  async #initializeUnlocked({ force = false } = {}) {
    if (this.#initialized && !force) return this.#lastLoad;
    const loaded = await this.#database.load();
    this.#store = new CoreStore(loaded.snapshot);
    this.#initialized = true;
    this.#needsRecovery = false;
    this.#lastLoad = {
      recovered: loaded.recovered,
      source: loaded.source,
    };
    return structuredClone(this.#lastLoad);
  }

  initialize() {
    return this.#enqueue(() => this.#initializeUnlocked());
  }

  recover() {
    return this.#enqueue(() => this.#initializeUnlocked({ force: true }));
  }

  state() {
    return {
      initialized: this.#initialized,
      needsRecovery: this.#needsRecovery,
      lastLoad: this.#lastLoad ? structuredClone(this.#lastLoad) : null,
    };
  }

  async #read(operation) {
    return this.#enqueue(async () => {
      await this.#initializeUnlocked();
      return operation(this.#store);
    });
  }

  async #create(collection, entityFactory, input) {
    return this.#enqueue(async () => {
      await this.#initializeUnlocked();
      if (this.#needsRecovery) {
        throw new AcademicRepositoryRecoveryRequiredError();
      }

      const working = new CoreStore(this.#store.exportSnapshot(this.#now()));
      const entity = entityFactory(withDefaultNow(input, this.#now()));
      working.add(collection, entity);
      try {
        await this.#database.save(working.exportSnapshot(this.#now()));
      } catch (error) {
        this.#needsRecovery = true;
        throw error;
      }
      this.#store = working;
      return structuredClone(entity);
    });
  }

  createAcademicYear(input) {
    return this.#create("academicYears", createAcademicYear, input);
  }

  createSemester(input) {
    return this.#create("semesters", createSemester, input);
  }

  createCapabilityPack(input) {
    return this.#create("capabilityPacks", createCapabilityPack, input);
  }

  createSubjectProfile(input) {
    return this.#create("subjectProfiles", createSubjectProfile, input);
  }

  createSubject(input) {
    return this.#create("subjects", createSubject, input);
  }

  listAcademicYears() {
    return this.#read((store) => store.list("academicYears"));
  }

  listSemesters({ academicYearId = null } = {}) {
    return this.#read((store) => {
      const semesters = store.list("semesters");
      if (!academicYearId) return semesters;
      assertStableId(academicYearId, "academic-year");
      return semesters.filter((semester) => semester.academicYearId === academicYearId);
    });
  }

  listCapabilityPacks() {
    return this.#read((store) => store.list("capabilityPacks"));
  }

  listSubjectProfiles() {
    return this.#read((store) => store.list("subjectProfiles"));
  }

  listSubjects({ semesterId = null, academicYearId = null } = {}) {
    return this.#read((store) => {
      let allowedSemesterIds = null;
      if (academicYearId) {
        assertStableId(academicYearId, "academic-year");
        allowedSemesterIds = new Set(
          store.list("semesters")
            .filter((semester) => semester.academicYearId === academicYearId)
            .map((semester) => semester.id),
        );
      }
      if (semesterId) assertStableId(semesterId, "semester");
      return store.list("subjects").filter((subject) => (
        (!semesterId || subject.semesterId === semesterId)
        && (!allowedSemesterIds || allowedSemesterIds.has(subject.semesterId))
      ));
    });
  }

  getSubject(subjectId) {
    return this.#read((store) => (
      store.get("subjects", assertStableId(subjectId, "subject"))
    ));
  }

  exportSnapshot() {
    return this.#read((store) => store.exportSnapshot(this.#now()));
  }
}
