export function projectStudySubjectDetail(subject) {
  if (!subject) return null;
  return Object.freeze({ id: subject.id, title: subject.title, code: subject.code ?? null });
}
