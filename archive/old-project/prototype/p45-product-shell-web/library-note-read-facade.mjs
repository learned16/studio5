import { openCanonicalReadRepository } from "./canonical-read-repository.mjs";

export function createLibraryNoteReadFacade(repository) {
  if (typeof repository?.getNote !== "function") {
    throw new TypeError("Library note read facade requires AcademicRepository.getNote");
  }
  return Object.freeze({
    getNote(noteId) {
      return repository.getNote(noteId);
    },
  });
}

export async function openCanonicalLibraryNoteReadFacade(options = {}) {
  return createLibraryNoteReadFacade(await openCanonicalReadRepository(options));
}
