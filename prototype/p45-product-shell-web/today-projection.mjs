const TASK_GROUPS = Object.freeze([
  Object.freeze({ key: "overdue", label: "Overdue", tone: "danger" }),
  Object.freeze({ key: "dueToday", label: "Due today", tone: "warning" }),
  Object.freeze({ key: "unscheduled", label: "Planned", tone: "neutral" }),
]);

function shiftedDate(instant, utcOffsetMinutes) {
  return new Date(Date.parse(instant) + utcOffsetMinutes * 60_000);
}

function timeLabel(instant, utcOffsetMinutes, locale) {
  if (!instant) return null;
  return new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(shiftedDate(instant, utcOffsetMinutes));
}

function dateLabel(date, locale) {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    weekday: "long",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
}

function agendaItem(entry, projection, locale) {
  return {
    id: entry.id,
    title: entry.title,
    context: entry.subject?.title ?? entry.location ?? "Academic schedule",
    time: timeLabel(entry.startsAt, projection.utcOffsetMinutes, locale),
  };
}

function taskItem(task, group, projection, locale) {
  return {
    id: task.id,
    title: task.title,
    context: task.subject?.title ?? "Academic task",
    time: timeLabel(task.dueAt, projection.utcOffsetMinutes, locale),
    status: group.label,
    tone: group.tone,
  };
}

export function projectTodayQuery(projection, { locale = "en" } = {}) {
  const agenda = projection.agenda.map((entry) => agendaItem(entry, projection, locale));
  const tasks = TASK_GROUPS.flatMap((group) => (
    projection.tasks[group.key].map((task) => taskItem(task, group, projection, locale))
  ));
  return {
    date: dateLabel(projection.date, locale),
    agenda,
    tasks,
    completedCount: projection.tasks.completedToday.length,
    isEmpty: agenda.length === 0 && tasks.length === 0,
  };
}
