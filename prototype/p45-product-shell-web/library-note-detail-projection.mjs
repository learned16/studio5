export function projectLibraryNoteDetail(note) {
  if (!note) return null;
  return {
    id: note.id,
    title: note.title,
    body: note.body,
    pageNumber: note.pageNumber ?? null,
  };
}
