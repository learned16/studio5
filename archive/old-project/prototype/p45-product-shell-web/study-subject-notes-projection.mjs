export function projectStudySubjectNotes(notes) {
  return notes.map(({ id, title, body }) => Object.freeze({ id, title, body }));
}
