export function projectStudySubjectTasks(tasks) {
  return tasks.map(({ id, title, dueAt, status }) => Object.freeze({
    id,
    title,
    dueAt,
    status,
  }));
}
