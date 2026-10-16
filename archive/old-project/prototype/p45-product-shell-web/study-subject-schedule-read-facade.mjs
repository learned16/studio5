import { openCanonicalReadRepository } from "./canonical-read-repository.mjs";

export function createStudySubjectScheduleReadFacade(repository) {
  if (typeof repository?.listScheduleEntries !== "function") {
    throw new TypeError("Study subject schedule facade requires AcademicRepository.listScheduleEntries");
  }
  return Object.freeze({
    listScheduleEntries({ subjectId }) {
      return repository.listScheduleEntries({ subjectId });
    },
  });
}

export async function openCanonicalStudySubjectScheduleReadFacade(options = {}) {
  return createStudySubjectScheduleReadFacade(await openCanonicalReadRepository(options));
}
