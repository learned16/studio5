import { openCanonicalReadRepository } from "./canonical-read-repository.mjs";

export function createStudySubjectFileMetadataReadFacade(repository) {
  if (typeof repository?.getFileArtifact !== "function") {
    throw new TypeError("Study subject file metadata facade requires AcademicRepository.getFileArtifact");
  }
  return Object.freeze({
    getFileArtifact(artifactId) {
      return repository.getFileArtifact(artifactId);
    },
  });
}

export async function openCanonicalStudySubjectFileMetadataReadFacade(options = {}) {
  return createStudySubjectFileMetadataReadFacade(await openCanonicalReadRepository(options));
}
