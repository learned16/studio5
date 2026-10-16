import test from "node:test";
import assert from "node:assert/strict";

import { createLibraryNoteReadFacade, openCanonicalLibraryNoteReadFacade } from "../library-note-read-facade.mjs";

test("Library note facade exposes only frozen canonical getNote", async () => {
  const calls = [];
  const facade = createLibraryNoteReadFacade({
    getNote(noteId) {
      calls.push(noteId);
      return Promise.resolve({ id: noteId });
    },
    updateNote() { throw new Error("mutator must not be exposed"); },
  });

  assert.ok(Object.isFrozen(facade));
  assert.deepEqual(Object.keys(facade), ["getNote"]);
  assert.equal(facade.updateNote, undefined);
  assert.deepEqual(await facade.getNote("note:1"), { id: "note:1" });
  assert.deepEqual(calls, ["note:1"]);
});

test("Library note facade rejects a repository without canonical getNote", () => {
  assert.throws(() => createLibraryNoteReadFacade({}), /requires AcademicRepository\.getNote/);
});

test("canonical Library note facade initializes the shared read repository", async () => {
  const events = [];
  const facade = await openCanonicalLibraryNoteReadFacade({
    contextFactory: async () => ({ repository: {
      async initialize() { events.push("initialize"); },
      async getNote(noteId) { events.push(["getNote", noteId]); return null; },
    } }),
  });
  assert.equal(await facade.getNote("note:1"), null);
  assert.deepEqual(events, ["initialize", ["getNote", "note:1"]]);
});
