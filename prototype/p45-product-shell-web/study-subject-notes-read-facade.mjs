import { openCanonicalReadRepository } from "./canonical-read-repository.mjs";

export function createStudySubjectNotesReadFacade(repository) {
  if (typeof repository?.listNotes !== "function") {
    throw new TypeError("Study subject notes facade requires AcademicRepository.listNotes");
  }
  return Object.freeze({
    listNotes({ subjectId }) {
      return repository.listNotes({ subjectId });
    },
  });
}

export async function openCanonicalStudySubjectNotesReadFacade(options = {}) {
  return createStudySubjectNotesReadFacade(await openCanonicalReadRepository(options));
}
