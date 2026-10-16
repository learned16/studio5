import { openCanonicalReadRepository } from "./canonical-read-repository.mjs";

export function createLibraryReadFacade(repository) {
  if (typeof repository?.searchLibrary !== "function") {
    throw new TypeError("Library read facade requires AcademicRepository.searchLibrary");
  }
  return Object.freeze({
    searchLibrary(options = {}) {
      return repository.searchLibrary(options);
    },
  });
}

export async function openCanonicalLibraryReadFacade(options = {}) {
  return createLibraryReadFacade(await openCanonicalReadRepository(options));
}
