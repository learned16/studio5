import test from "node:test";
import assert from "node:assert/strict";

import {
  createStudySubjectsReadFacade,
  openCanonicalStudySubjectsReadFacade,
} from "../study-subjects-read-facade.mjs";

test("facade exposes one read operation and delegates only to listSubjects", async () => {
  const calls = [];
  const repository = {
    listSubjects(...args) {
      calls.push(args);
      return Promise.resolve([{ id: "subject:1", title: "Structures" }]);
    },
    createSubject() {
      throw new Error("mutator must not be reachable");
    },
  };
  const facade = createStudySubjectsReadFacade(repository);

  assert.deepEqual(Object.keys(facade), ["list"]);
  assert.equal(Object.isFrozen(facade), true);
  assert.deepEqual(await facade.list(), [{ id: "subject:1", title: "Structures" }]);
  assert.deepEqual(calls, [[]]);
  assert.equal("createSubject" in facade, false);
});

test("canonical opener initializes the supplied Core context without exposing it", async () => {
  const lifecycle = [];
  const repository = {
    initialize: async () => lifecycle.push("initialize"),
    listSubjects: async () => [],
  };
  const indexedDB = { name: "boundary-double" };
  const now = () => 1_786_400_000_000;
  const contextFactory = async (options) => {
    lifecycle.push([options.indexedDB, options.now]);
    return { repository, driver: { close() {} } };
  };

  const facade = await openCanonicalStudySubjectsReadFacade({
    indexedDB,
    now,
    contextFactory,
  });

  assert.deepEqual(lifecycle, [[indexedDB, now], "initialize"]);
  assert.deepEqual(Object.keys(facade), ["list"]);
  assert.equal("repository" in facade, false);
});
