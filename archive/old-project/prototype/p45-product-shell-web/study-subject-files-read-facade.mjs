import { openCanonicalReadRepository } from "./canonical-read-repository.mjs";

export function createStudySubjectFilesReadFacade(repository) {
  if (typeof repository?.searchLibrary !== "function") {
    throw new TypeError("Study subject files facade requires AcademicRepository.searchLibrary");
  }
  return Object.freeze({
    listFiles({ subjectId }) {
      return repository.searchLibrary({
        query: "",
        subjectId,
        targetKinds: ["file-artifact"],
        limit: 500,
      });
    },
  });
}

export async function openCanonicalStudySubjectFilesReadFacade(options = {}) {
  return createStudySubjectFilesReadFacade(await openCanonicalReadRepository(options));
}
