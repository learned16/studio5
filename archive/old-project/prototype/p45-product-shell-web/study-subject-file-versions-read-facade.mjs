import { openCanonicalReadRepository } from "./canonical-read-repository.mjs";

export function createStudySubjectFileVersionsReadFacade(repository) {
  if (typeof repository?.listFileVersions !== "function") {
    throw new TypeError("Study subject file versions facade requires AcademicRepository.listFileVersions");
  }
  return Object.freeze({
    listFileVersions({ artifactId }) {
      return repository.listFileVersions({ artifactId });
    },
  });
}

export async function openCanonicalStudySubjectFileVersionsReadFacade(options = {}) {
  return createStudySubjectFileVersionsReadFacade(await openCanonicalReadRepository(options));
}
