export function projectStudySubjectFileMetadata(fileArtifact) {
  if (!fileArtifact) return null;
  return Object.freeze({
    id: fileArtifact.id,
    displayName: fileArtifact.displayName,
    originalName: fileArtifact.originalName,
    sourceType: fileArtifact.sourceType,
    archivedAt: fileArtifact.archivedAt,
  });
}
