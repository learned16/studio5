import test from "node:test";
import assert from "node:assert/strict";

import {
  createTodayReadFacade,
  openCanonicalTodayReadFacade,
} from "../today-read-facade.mjs";

test("facade exposes one read operation and delegates only to queryToday", async () => {
  const calls = [];
  const repository = {
    queryToday(options) {
      calls.push(options);
      return Promise.resolve({ date: "2026-08-11" });
    },
    createTask() {
      throw new Error("mutator must not be reachable");
    },
  };
  const facade = createTodayReadFacade(repository);
  const options = { now: 1_786_400_000_000, utcOffsetMinutes: 180 };

  assert.deepEqual(Object.keys(facade), ["query"]);
  assert.equal(Object.isFrozen(facade), true);
  assert.deepEqual(await facade.query(options), { date: "2026-08-11" });
  assert.deepEqual(calls, [options]);
  assert.equal("createTask" in facade, false);
});

test("canonical opener initializes the supplied Core context without exposing it", async () => {
  const lifecycle = [];
  const repository = {
    initialize: async () => lifecycle.push("initialize"),
    queryToday: async () => ({ date: "2026-08-11" }),
  };
  const indexedDB = { name: "boundary-double" };
  const now = () => 1_786_400_000_000;
  const contextFactory = async (options) => {
    lifecycle.push([options.indexedDB, options.now]);
    return { repository, driver: { close() {} } };
  };

  const facade = await openCanonicalTodayReadFacade({ indexedDB, now, contextFactory });

  assert.deepEqual(lifecycle, [[indexedDB, now], "initialize"]);
  assert.deepEqual(Object.keys(facade), ["query"]);
  assert.equal("repository" in facade, false);
});
