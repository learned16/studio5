import test from "node:test";
import assert from "node:assert/strict";

import { createStudySubjectFilesReadFacade } from "../study-subject-files-read-facade.mjs";
import { projectStudySubjectFiles } from "../study-subject-files-projection.mjs";
import { destinationView } from "../views.mjs";

test("Study subject files facade exposes only frozen canonical file-artifact search", async () => {
  const callArguments = [];
  const facade = createStudySubjectFilesReadFacade({
    searchLibrary: async (options) => {
      callArguments.push(options);
      return [{ targetId: "file-artifact:1" }];
    },
    getFileArtifact() { throw new Error("file detail read must not be exposed"); },
  });

  assert.ok(Object.isFrozen(facade));
  assert.deepEqual(Object.keys(facade), ["listFiles"]);
  assert.equal(facade.getFileArtifact, undefined);
  assert.deepEqual(await facade.listFiles({ subjectId: "subject:1" }), [{ targetId: "file-artifact:1" }]);
  assert.deepEqual(callArguments, [{ query: "", subjectId: "subject:1", targetKinds: ["file-artifact"], limit: 500 }]);
});

test("Study subject files retain Core order and render only escaped title and subtitle", () => {
  const files = [
    { targetKind: "file-artifact", targetId: "file-artifact:later", title: "Later canonical file", subtitle: "Second canonical subtitle", ignored: "no" },
    { targetKind: "file-artifact", targetId: "file-artifact:first", title: '<img src=x onerror="unsafe()"> & Arabic', subtitle: '<script>alert("unsafe")</script> & source', artifactId: "hidden" },
  ];
  const state = (fileState) => destinationView("study", {
    status: "ready",
    subjects: [{ id: "subject:1", title: "Structures" }],
    detail: {
      status: "ready",
      subject: { id: "subject:1", title: "Structures" },
      lectures: { status: "ready", lectures: [] },
      tasks: { status: "ready", tasks: [] },
      schedule: { status: "ready", entries: [] },
      notes: { status: "ready", notes: [] },
      files: fileState,
    },
  });
  const ready = state({ status: "ready", files });

  assert.deepEqual(projectStudySubjectFiles(files), files.map(({ targetId, title, subtitle }) => ({ targetId, title, subtitle })));
  assert.equal(projectStudySubjectFiles(files).every(Object.isFrozen), true);
  assert.ok(ready.indexOf("Later canonical file") < ready.indexOf("&lt;img src=x"));
  assert.match(ready, /dir="auto">&lt;img src=x onerror=&quot;unsafe\(\)&quot;&gt; &amp; Arabic/);
  assert.match(ready, /dir="auto">&lt;script&gt;alert\(&quot;unsafe&quot;\)&lt;\/script&gt; &amp; source/);
  assert.doesNotMatch(ready, /ignored|artifactId|targetKind|fileVersion|favorite|recent|count/i);
  assert.doesNotMatch(ready, /data-study-subject-files-open|Open file/);
  assert.match(state({ status: "loading" }), /Loading files…/u);
  assert.match(state({ status: "ready", files: [] }), /No files are available/);
  assert.match(state({ status: "error" }), /data-study-subject-files-retry/);
});
