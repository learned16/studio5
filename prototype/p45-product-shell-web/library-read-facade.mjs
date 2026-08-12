import { openCanonicalReadRepository } from "./canonical-read-repository.mjs";

export function createLibraryReadFacade(repository) {
  return Object.freeze({
    search(options = {}) {
      return repository.searchLibrary(options);
    },
  });
}

export async function openCanonicalLibraryReadFacade(options = {}) {
  return createLibraryReadFacade(await openCanonicalReadRepository(options));
}
