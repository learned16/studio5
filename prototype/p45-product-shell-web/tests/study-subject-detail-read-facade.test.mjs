import test from "node:test";
import assert from "node:assert/strict";
import { createStudySubjectDetailReadFacade } from "../study-subject-detail-read-facade.mjs";

test("Study subject detail facade exposes only frozen canonical getSubject", async () => {
  const facade = createStudySubjectDetailReadFacade({
    getSubject: async (id) => ({ id }),
    updateSubject() { throw new Error("mutator must not be exposed"); },
  });
  assert.ok(Object.isFrozen(facade));
  assert.deepEqual(Object.keys(facade), ["getSubject"]);
  assert.equal(facade.updateSubject, undefined);
  assert.deepEqual(await facade.getSubject("subject:1"), { id: "subject:1" });
});
