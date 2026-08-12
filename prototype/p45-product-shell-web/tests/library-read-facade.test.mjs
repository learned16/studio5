import test from "node:test";
import assert from "node:assert/strict";

import {
  createLibraryReadFacade,
  openCanonicalLibraryReadFacade,
} from "../library-read-facade.mjs";

test("Library facade exposes only canonical read search", async () => {
  const calls = [];
  const repository = {
    searchLibrary(options) {
      calls.push(structuredClone(options));
      return Promise.resolve([{ targetId: "resource:1" }]);
    },
    createNote() {
      throw new Error("mutator must not be exposed");
    },
  };
  const facade = createLibraryReadFacade(repository);

  assert.deepEqual(Object.keys(facade), ["search"]);
  assert.equal(facade.createNote, undefined);
  assert.deepEqual(await facade.search({ query: "", limit: 50 }), [{ targetId: "resource:1" }]);
  assert.deepEqual(calls, [{ query: "", limit: 50 }]);
});

test("canonical Library facade initializes the shared read repository", async () => {
  const events = [];
  const repository = {
    async initialize() {
      events.push("initialize");
    },
    async searchLibrary(options) {
      events.push(["searchLibrary", structuredClone(options)]);
      return [];
    },
  };
  const facade = await openCanonicalLibraryReadFacade({
    contextFactory: async () => ({ repository }),
  });

  assert.deepEqual(await facade.search(), []);
  assert.deepEqual(events, ["initialize", ["searchLibrary", {}]]);
});
