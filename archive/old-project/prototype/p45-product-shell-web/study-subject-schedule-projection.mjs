export function projectStudySubjectSchedule(entries) {
  return entries.map(({ id, dayOfWeek, startTime, endTime, effectiveFrom, effectiveUntil, location }) => Object.freeze({
    id,
    dayOfWeek,
    startTime,
    endTime,
    effectiveFrom,
    effectiveUntil,
    location,
  }));
}
