export function projectStudySubjects(subjects) {
  return subjects.map(({ id, title }) => Object.freeze({ id, title }));
}
