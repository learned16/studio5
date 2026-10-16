import test from "node:test";
import assert from "node:assert/strict";

import { createStudySubjectFileMetadataReadFacade } from "../study-subject-file-metadata-read-facade.mjs";
import { projectStudySubjectFileMetadata } from "../study-subject-file-metadata-projection.mjs";
import { destinationView } from "../views.mjs";

test("Study subject file metadata facade exposes only frozen canonical getFileArtifact", async () => {
  const calls = [];
  const facade = createStudySubjectFileMetadataReadFacade({
    getFileArtifact(artifactId) {
      calls.push(artifactId);
      return Promise.resolve({ id: artifactId });
    },
    getFileContent() { throw new Error("file content must not be exposed"); },
  });

  assert.ok(Object.isFrozen(facade));
  assert.deepEqual(Object.keys(facade), ["getFileArtifact"]);
  assert.equal(facade.getFileContent, undefined);
  assert.deepEqual(await facade.getFileArtifact("file-artifact:1"), { id: "file-artifact:1" });
  assert.deepEqual(calls, ["file-artifact:1"]);
});

test("Study subject file metadata renders only escaped canonical metadata", () => {
  const fileArtifact = {
    id: "file-artifact:1",
    displayName: '<img src=x onerror="unsafe()"> & display',
    originalName: '<script>alert("unsafe")</script> & original',
    sourceType: "upload",
    archivedAt: "2026-08-13T09:00:00.000Z",
    createdAt: "hidden",
    fileVersionId: "hidden",
  };
  const state = (metadata) => destinationView("study", {
    status: "ready",
    subjects: [{ id: "subject:1", title: "Structures" }],
    detail: {
      status: "ready",
      subject: { id: "subject:1", title: "Structures" },
      lectures: { status: "ready", lectures: [] },
      tasks: { status: "ready", tasks: [] },
      schedule: { status: "ready", entries: [] },
      notes: { status: "ready", notes: [] },
      files: { status: "ready", files: [{ targetId: fileArtifact.id, title: "File" }] },
      fileMetadata: metadata,
    },
  });
  const ready = state({ status: "ready", fileArtifact });

  assert.deepEqual(projectStudySubjectFileMetadata(fileArtifact), {
    id: "file-artifact:1",
    displayName: fileArtifact.displayName,
    originalName: fileArtifact.originalName,
    sourceType: "upload",
    archivedAt: "2026-08-13T09:00:00.000Z",
  });
  assert.ok(Object.isFrozen(projectStudySubjectFileMetadata(fileArtifact)));
  assert.match(ready, /dir="auto">&lt;img src=x onerror=&quot;unsafe\(\)&quot;&gt; &amp; display/);
  assert.match(ready, /dir="auto">&lt;script&gt;alert\(&quot;unsafe&quot;\)&lt;\/script&gt; &amp; original/);
  assert.match(ready, /2026-08-13T09:00:00\.000Z/);
  assert.doesNotMatch(ready, /createdAt|fileVersion|file content|download|open file/i);
  assert.match(state({ status: "loading" }), /Loading file information…/u);
  assert.match(state({ status: "missing" }), /File information is unavailable/);
  assert.match(state({ status: "error" }), /data-study-subject-file-metadata-retry/);
});
