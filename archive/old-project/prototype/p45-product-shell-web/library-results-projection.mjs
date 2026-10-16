export function projectLibraryResults(results) {
  return results.map((result) => ({
    targetKind: result.targetKind,
    targetId: result.targetId,
    title: result.title,
    subtitle: result.subtitle ?? null,
  }));
}
