export function projectStudySubjectFileVersions(versions) {
  return versions.map(({ id, versionNumber, mediaType, byteSize, originalModifiedAt }) => Object.freeze({
    id,
    versionNumber,
    mediaType,
    byteSize,
    originalModifiedAt,
  }));
}
