export function projectStudySubjectLectures(lectures) {
  return lectures.map(({ id, title, startsAt, endsAt, status }) => Object.freeze({
    id,
    title,
    startsAt,
    endsAt,
    status,
  }));
}
