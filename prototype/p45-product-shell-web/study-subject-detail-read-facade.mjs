import { openCanonicalReadRepository } from "./canonical-read-repository.mjs";

export function createStudySubjectDetailReadFacade(repository) {
  if (typeof repository?.getSubject !== "function") {
    throw new TypeError("Study subject detail facade requires AcademicRepository.getSubject");
  }
  return Object.freeze({
    getSubject(subjectId) {
      return repository.getSubject(subjectId);
    },
  });
}

export async function openCanonicalStudySubjectDetailReadFacade(options = {}) {
  return createStudySubjectDetailReadFacade(await openCanonicalReadRepository(options));
}
