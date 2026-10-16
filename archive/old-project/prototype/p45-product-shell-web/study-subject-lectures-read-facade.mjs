import { openCanonicalReadRepository } from "./canonical-read-repository.mjs";

export function createStudySubjectLecturesReadFacade(repository) {
  if (typeof repository?.listLectures !== "function") {
    throw new TypeError("Study subject lectures facade requires AcademicRepository.listLectures");
  }
  return Object.freeze({
    listLectures({ subjectId }) {
      return repository.listLectures({ subjectId });
    },
  });
}

export async function openCanonicalStudySubjectLecturesReadFacade(options = {}) {
  return createStudySubjectLecturesReadFacade(await openCanonicalReadRepository(options));
}
