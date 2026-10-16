import test from "node:test";
import assert from "node:assert/strict";
import { createStudySubjectLecturesReadFacade } from "../study-subject-lectures-read-facade.mjs";

test("Study subject lectures facade exposes only frozen canonical listLectures", async () => {
  const callArguments = [];
  const facade = createStudySubjectLecturesReadFacade({
    listLectures: async (options) => {
      callArguments.push(options);
      return [{ id: "lecture:1" }];
    },
    getLecture() { throw new Error("detail read must not be exposed"); },
  });

  assert.ok(Object.isFrozen(facade));
  assert.deepEqual(Object.keys(facade), ["listLectures"]);
  assert.equal(facade.getLecture, undefined);
  assert.deepEqual(await facade.listLectures({ subjectId: "subject:1" }), [{ id: "lecture:1" }]);
  assert.deepEqual(callArguments, [{ subjectId: "subject:1" }]);
});
