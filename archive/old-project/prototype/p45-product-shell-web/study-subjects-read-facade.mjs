import { openCanonicalReadRepository } from "./canonical-read-repository.mjs";

export function createStudySubjectsReadFacade(repository) {
  if (typeof repository?.listSubjects !== "function") {
    throw new TypeError("Study subjects read facade requires AcademicRepository.listSubjects");
  }
  return Object.freeze({
    list() {
      return repository.listSubjects();
    },
  });
}

export async function openCanonicalStudySubjectsReadFacade(options = {}) {
  const repository = await openCanonicalReadRepository(options);
  return createStudySubjectsReadFacade(repository);
}
