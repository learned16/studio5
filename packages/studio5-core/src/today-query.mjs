import { CoreStore } from "./store.mjs";

const MIN_OFFSET_MINUTES = -14 * 60;
const MAX_OFFSET_MINUTES = 14 * 60;
const OPEN_TASK_STATUSES = new Set(["todo", "in-progress"]);
const PRIORITY_ORDER = Object.freeze({
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3,
});

function normalizedInstant(value, field) {
  if (typeof value === "string"
    && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/
      .test(value)) {
    throw new TypeError(`${field} string must include an explicit timezone`);
  }
  const milliseconds = value instanceof Date
    ? value.getTime()
    : (typeof value === "number" ? value : Date.parse(String(value)));
  if (!Number.isFinite(milliseconds)) {
    throw new TypeError(`${field} must be a valid date-time`);
  }
  return milliseconds;
}

function normalizedOffset(value) {
  const offset = Number(value);
  if (!Number.isInteger(offset)
    || offset < MIN_OFFSET_MINUTES
    || offset > MAX_OFFSET_MINUTES) {
    throw new TypeError("utcOffsetMinutes must be an integer from -840 to 840");
  }
  return offset;
}

function normalizedDate(value, field) {
  const text = String(value ?? "").trim();
  const parsed = Date.parse(`${text}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)
    || Number.isNaN(parsed)
    || new Date(parsed).toISOString().slice(0, 10) !== text) {
    throw new TypeError(`${field} must use YYYY-MM-DD`);
  }
  return text;
}

function localDateForInstant(milliseconds, offsetMinutes) {
  return new Date(milliseconds + offsetMinutes * 60_000).toISOString().slice(0, 10);
}

function instantForLocalClock(date, time, offsetMinutes) {
  const localAsUtc = Date.parse(`${date}T${time}:00Z`);
  return new Date(localAsUtc - offsetMinutes * 60_000).toISOString();
}

function dayWindow({ date = null, now = Date.now(), utcOffsetMinutes = 0 } = {}) {
  const offset = normalizedOffset(utcOffsetMinutes);
  const nowMilliseconds = normalizedInstant(now, "now");
  const localDate = date === null || date === undefined || date === ""
    ? localDateForInstant(nowMilliseconds, offset)
    : normalizedDate(date, "date");
  const localMidnightAsUtc = Date.parse(`${localDate}T00:00:00Z`);
  const startMilliseconds = localMidnightAsUtc - offset * 60_000;
  const endMilliseconds = startMilliseconds + 24 * 60 * 60 * 1_000;
  const utcDay = new Date(localMidnightAsUtc).getUTCDay();
  return {
    date: localDate,
    dayOfWeek: utcDay === 0 ? 7 : utcDay,
    utcOffsetMinutes: offset,
    startsAt: new Date(startMilliseconds).toISOString(),
    endsAt: new Date(endMilliseconds).toISOString(),
    startMilliseconds,
    endMilliseconds,
    nowMilliseconds,
  };
}

function compareText(left, right) {
  return String(left).localeCompare(String(right), "en");
}

function agendaOrder(left, right) {
  return compareText(left.startsAt, right.startsAt)
    || compareText(left.endsAt, right.endsAt)
    || compareText(left.sourceKind, right.sourceKind)
    || compareText(left.id, right.id);
}

function taskOrder(left, right) {
  return (PRIORITY_ORDER[left.priority] - PRIORITY_ORDER[right.priority])
    || compareText(left.dueAt ?? left.createdAt, right.dueAt ?? right.createdAt)
    || compareText(left.id, right.id);
}

function completedTaskOrder(left, right) {
  return compareText(right.completedAt, left.completedAt)
    || compareText(left.id, right.id);
}

function withSubject(entity, subjectsById) {
  return {
    ...structuredClone(entity),
    subject: entity.subjectId
      ? structuredClone(subjectsById.get(entity.subjectId) ?? null)
      : null,
  };
}

function scheduleIsActive(entry, window) {
  return entry.dayOfWeek === window.dayOfWeek
    && (!entry.effectiveFrom || entry.effectiveFrom <= window.date)
    && (!entry.effectiveUntil || entry.effectiveUntil >= window.date);
}

function lectureIsInWindow(lecture, window) {
  return Date.parse(lecture.endsAt) > window.startMilliseconds
    && Date.parse(lecture.startsAt) < window.endMilliseconds;
}

function taskIsCompletedInWindow(task, window) {
  if (task.status !== "done" || !task.completedAt) return false;
  const completed = Date.parse(task.completedAt);
  return completed >= window.startMilliseconds && completed < window.endMilliseconds;
}

export function buildTodayQuery(snapshot, options = {}) {
  if (!options || typeof options !== "object" || Array.isArray(options)) {
    throw new TypeError("Today query options must be an object");
  }
  const window = dayWindow(options);
  const store = new CoreStore(snapshot);
  const subjectsById = new Map(
    store.list("subjects").map((subject) => [subject.id, subject]),
  );
  const lectures = store.list("lectures")
    .filter((lecture) => lectureIsInWindow(lecture, window));
  const coveredScheduleIds = new Set(
    lectures
      .filter((lecture) => lecture.scheduleEntryId)
      .map((lecture) => lecture.scheduleEntryId),
  );

  const lectureAgenda = lectures.map((lecture) => ({
    ...withSubject(lecture, subjectsById),
    sourceKind: "lecture",
    location: lecture.scheduleEntryId
      ? (store.get("scheduleEntries", lecture.scheduleEntryId)?.location ?? null)
      : null,
  }));

  const scheduleAgenda = store.list("scheduleEntries")
    .filter((entry) => scheduleIsActive(entry, window))
    .filter((entry) => !coveredScheduleIds.has(entry.id))
    .map((entry) => {
      const subject = subjectsById.get(entry.subjectId);
      return {
        ...withSubject(entry, subjectsById),
        sourceKind: "schedule-entry",
        title: subject.title,
        startsAt: instantForLocalClock(window.date, entry.startTime, window.utcOffsetMinutes),
        endsAt: instantForLocalClock(window.date, entry.endTime, window.utcOffsetMinutes),
        status: "scheduled",
      };
    });

  const tasks = store.list("tasks");
  const openTasks = tasks
    .filter((task) => OPEN_TASK_STATUSES.has(task.status))
    .map((task) => withSubject(task, subjectsById));
  const overdue = [];
  const dueToday = [];
  const unscheduled = [];

  for (const task of openTasks) {
    if (!task.dueAt) {
      unscheduled.push(task);
      continue;
    }
    const due = Date.parse(task.dueAt);
    if (due < window.startMilliseconds) {
      overdue.push(task);
    } else if (due < window.endMilliseconds) {
      dueToday.push(task);
    }
  }

  const completedToday = tasks
    .filter((task) => taskIsCompletedInWindow(task, window))
    .map((task) => withSubject(task, subjectsById))
    .sort(completedTaskOrder);

  const agenda = [...lectureAgenda, ...scheduleAgenda].sort(agendaOrder);
  overdue.sort(taskOrder);
  dueToday.sort(taskOrder);
  unscheduled.sort(taskOrder);

  return {
    date: window.date,
    dayOfWeek: window.dayOfWeek,
    generatedAt: new Date(window.nowMilliseconds).toISOString(),
    utcOffsetMinutes: window.utcOffsetMinutes,
    window: {
      startsAt: window.startsAt,
      endsAt: window.endsAt,
    },
    agenda,
    tasks: {
      overdue,
      dueToday,
      unscheduled,
      completedToday,
    },
    summary: {
      agendaCount: agenda.length,
      overdueTaskCount: overdue.length,
      dueTodayTaskCount: dueToday.length,
      unscheduledTaskCount: unscheduled.length,
      completedTodayTaskCount: completedToday.length,
    },
  };
}
