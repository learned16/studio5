import { openCanonicalReadRepository } from "./canonical-read-repository.mjs";

export function createStudySubjectTasksReadFacade(repository) {
  if (typeof repository?.listTasks !== "function") {
    throw new TypeError("Study subject tasks facade requires AcademicRepository.listTasks");
  }
  return Object.freeze({
    listTasks({ subjectId }) {
      return repository.listTasks({ subjectId });
    },
  });
}

export async function openCanonicalStudySubjectTasksReadFacade(options = {}) {
  return createStudySubjectTasksReadFacade(await openCanonicalReadRepository(options));
}
