import test from "node:test";
import assert from "node:assert/strict";

import { createStudySubjectNotesReadFacade } from "../study-subject-notes-read-facade.mjs";
import { projectStudySubjectNotes } from "../study-subject-notes-projection.mjs";
import { destinationView } from "../views.mjs";

test("Study subject notes facade exposes only frozen canonical listNotes", async () => {
  const callArguments = [];
  const facade = createStudySubjectNotesReadFacade({
    listNotes: async (options) => {
      callArguments.push(options);
      return [{ id: "note:1" }];
    },
    getNote() { throw new Error("detail read must not be exposed"); },
  });

  assert.ok(Object.isFrozen(facade));
  assert.deepEqual(Object.keys(facade), ["listNotes"]);
  assert.equal(facade.getNote, undefined);
  assert.deepEqual(await facade.listNotes({ subjectId: "subject:1" }), [{ id: "note:1" }]);
  assert.deepEqual(callArguments, [{ subjectId: "subject:1" }]);
});

test("Study subject notes retain Core order and only render escaped text", () => {
  const notes = [
    { id: "note:later", title: "Later", body: "Second canonical note", ignored: "no" },
    { id: "note:first", title: '<img src=x onerror="unsafe()"> & ملاحظة', body: '<script>alert("unsafe")</script> & نص', artifactId: "file-artifact:1", lectureId: "lecture:1" },
  ];
  const state = (noteState) => destinationView("study", {
    status: "ready",
    subjects: [{ id: "subject:1", title: "Structures" }],
    detail: {
      status: "ready",
      subject: { id: "subject:1", title: "Structures" },
      lectures: { status: "ready", lectures: [] },
      tasks: { status: "ready", tasks: [] },
      schedule: { status: "ready", entries: [] },
      notes: noteState,
    },
  });
  const ready = state({ status: "ready", notes });

  assert.deepEqual(projectStudySubjectNotes(notes), notes.map(({ id, title, body }) => ({ id, title, body })));
  assert.equal(projectStudySubjectNotes(notes).every(Object.isFrozen), true);
  assert.ok(ready.indexOf("Later") < ready.indexOf("&lt;img src=x"));
  assert.match(ready, /dir="auto">&lt;img src=x onerror=&quot;unsafe\(\)&quot;&gt; &amp; ملاحظة/);
  assert.match(ready, /dir="auto">&lt;script&gt;alert\(&quot;unsafe&quot;\)&lt;\/script&gt; &amp; نص/);
  assert.doesNotMatch(ready, /ignored|artifactId|lectureId|fileVersionId|updatedAt|createdAt|recent|count/i);
  assert.match(state({ status: "loading" }), /Loading notes/);
  assert.match(state({ status: "ready", notes: [] }), /No notes are available/);
  assert.match(state({ status: "error" }), /data-study-subject-notes-retry/);
});
