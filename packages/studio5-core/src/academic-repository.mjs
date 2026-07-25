import { assertStableId } from "./ids.mjs";
import {
  LECTURE_STATUSES,
  TASK_PRIORITIES,
  TASK_STATUSES,
  createAcademicYear,
  createCapabilityPack,
  createLecture,
  createScheduleEntry,
  createSemester,
  createSubject,
  createSubjectProfile,
  createTask,
  reviseTask,
} from "./model.mjs";
import { CoreRelationError, CoreStore } from "./store.mjs";
import { buildTodayQuery } from "./today-query.mjs";

function withDefaultNow(input = {}, now) {
  return Object.hasOwn(input, "now") ? input : { ...input, now };
}

function optionalFilterValue(value, allowed, field) {
  if (value === null || value === undefined || value === "") return null;
  const normalized = String(value).trim();
  if (!allowed.includes(normalized)) {
    throw new TypeError(`${field} must be one of: ${allowed.join(", ")}`);
  }
  return normalized;
}

function optionalFilterInstant(value, field) {
  if (value === null || value === undefined || value === "") return null;
  const text = String(value);
  const hasExplicitZone = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/
    .test(text);
  const milliseconds = Date.parse(text);
  if (!hasExplicitZone || Number.isNaN(milliseconds)) {
    throw new TypeError(`${field} must be a valid date-time with an explicit timezone`);
  }
  return new Date(milliseconds).toISOString();
}

function optionalFilterDate(value, field) {
  if (value === null || value === undefined || value === "") return null;
  const text = String(value);
  const parsed = new Date(`${text}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)
    || Number.isNaN(parsed.getTime())
    || parsed.toISOString().slice(0, 10) !== text) {
    throw new TypeError(`${field} must use YYYY-MM-DD`);
  }
  return text;
}

function optionalFilterWeekday(value) {
  if (value === null || value === undefined || value === "") return null;
  const day = Number(value);
  if (!Number.isInteger(day) || day < 1 || day > 7) {
    throw new TypeError("dayOfWeek must be an integer from 1 to 7");
  }
  return day;
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

  #mutate(operation) {
    return this.#enqueue(async () => {
      await this.#initializeUnlocked();
      if (this.#needsRecovery) {
        throw new AcademicRepositoryRecoveryRequiredError();
      }

      const working = new CoreStore(this.#store.exportSnapshot(this.#now()));
      const result = operation(working);
      try {
        await this.#database.save(working.exportSnapshot(this.#now()));
      } catch (error) {
        this.#needsRecovery = true;
        throw error;
      }
      this.#store = working;
      return structuredClone(result);
    });
  }

  #create(collection, entityFactory, input) {
    return this.#mutate((working) => {
      const entity = entityFactory(withDefaultNow(input, this.#now()));
      working.add(collection, entity);
      return entity;
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

  createScheduleEntry(input) {
    return this.#create("scheduleEntries", createScheduleEntry, input);
  }

  createLecture(input) {
    return this.#create("lectures", createLecture, input);
  }

  createTask(input) {
    return this.#create("tasks", createTask, input);
  }

  updateTask(taskId, changes) {
    return this.#mutate((working) => {
      const id = assertStableId(taskId, "task");
      const current = working.get("tasks", id);
      if (!current) throw new CoreRelationError(`Cannot update missing task: ${id}`);
      const revised = reviseTask(current, changes, this.#now());
      working.replace("tasks", revised);
      return revised;
    });
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

  listScheduleEntries({
    subjectId = null,
    dayOfWeek = null,
    activeOn = null,
  } = {}) {
    return this.#read((store) => {
      if (subjectId) assertStableId(subjectId, "subject");
      const day = optionalFilterWeekday(dayOfWeek);
      const date = optionalFilterDate(activeOn, "activeOn");
      return store.list("scheduleEntries").filter((entry) => (
        (!subjectId || entry.subjectId === subjectId)
        && (!day || entry.dayOfWeek === day)
        && (!date || (
          (!entry.effectiveFrom || entry.effectiveFrom <= date)
          && (!entry.effectiveUntil || entry.effectiveUntil >= date)
        ))
      ));
    });
  }

  getScheduleEntry(scheduleEntryId) {
    return this.#read((store) => (
      store.get("scheduleEntries", assertStableId(scheduleEntryId, "schedule-entry"))
    ));
  }

  listLectures({
    subjectId = null,
    scheduleEntryId = null,
    status = null,
    from = null,
    until = null,
  } = {}) {
    return this.#read((store) => {
      if (subjectId) assertStableId(subjectId, "subject");
      if (scheduleEntryId) assertStableId(scheduleEntryId, "schedule-entry");
      const normalizedStatus = optionalFilterValue(status, LECTURE_STATUSES, "status");
      const start = optionalFilterInstant(from, "from");
      const end = optionalFilterInstant(until, "until");
      if (start && end && start > end) throw new RangeError("from must precede until");
      return store.list("lectures").filter((lecture) => (
        (!subjectId || lecture.subjectId === subjectId)
        && (!scheduleEntryId || lecture.scheduleEntryId === scheduleEntryId)
        && (!normalizedStatus || lecture.status === normalizedStatus)
        && (!start || lecture.endsAt > start)
        && (!end || lecture.startsAt < end)
      ));
    });
  }

  getLecture(lectureId) {
    return this.#read((store) => (
      store.get("lectures", assertStableId(lectureId, "lecture"))
    ));
  }

  listTasks({
    subjectId = null,
    lectureId = null,
    status = null,
    priority = null,
    dueAfter = null,
    dueBefore = null,
  } = {}) {
    return this.#read((store) => {
      if (subjectId) assertStableId(subjectId, "subject");
      if (lectureId) assertStableId(lectureId, "lecture");
      const normalizedStatus = optionalFilterValue(status, TASK_STATUSES, "status");
      const normalizedPriority = optionalFilterValue(priority, TASK_PRIORITIES, "priority");
      const after = optionalFilterInstant(dueAfter, "dueAfter");
      const before = optionalFilterInstant(dueBefore, "dueBefore");
      if (after && before && after > before) {
        throw new RangeError("dueAfter must precede dueBefore");
      }
      return store.list("tasks").filter((task) => (
        (!subjectId || task.subjectId === subjectId)
        && (!lectureId || task.lectureId === lectureId)
        && (!normalizedStatus || task.status === normalizedStatus)
        && (!normalizedPriority || task.priority === normalizedPriority)
        && (!after || (task.dueAt && task.dueAt >= after))
        && (!before || (task.dueAt && task.dueAt <= before))
      ));
    });
  }

  getTask(taskId) {
    return this.#read((store) => (
      store.get("tasks", assertStableId(taskId, "task"))
    ));
  }

  queryToday(options = {}) {
    if (!options || typeof options !== "object" || Array.isArray(options)) {
      throw new TypeError("Today query options must be an object");
    }
    return this.#read((store) => {
      const now = Object.hasOwn(options, "now") ? options.now : this.#now();
      return buildTodayQuery(
        store.exportSnapshot(now),
        { ...options, now },
      );
    });
  }

  exportSnapshot() {
    return this.#read((store) => store.exportSnapshot(this.#now()));
  }
}
