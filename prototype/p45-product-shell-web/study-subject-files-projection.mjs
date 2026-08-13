export function projectStudySubjectFiles(files) {
  return files.map(({ targetId, title, subtitle }) => Object.freeze({
    targetId,
    title,
    subtitle: subtitle ?? null,
  }));
}
