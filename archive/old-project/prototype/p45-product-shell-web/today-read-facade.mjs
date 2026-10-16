import { openCanonicalReadRepository } from "./canonical-read-repository.mjs";

export function createTodayReadFacade(repository) {
  if (typeof repository?.queryToday !== "function") {
    throw new TypeError("Today read facade requires AcademicRepository.queryToday");
  }
  return Object.freeze({
    query(options) {
      return repository.queryToday(options);
    },
  });
}

export async function openCanonicalTodayReadFacade(options = {}) {
  const repository = await openCanonicalReadRepository(options);
  return createTodayReadFacade(repository);
}
