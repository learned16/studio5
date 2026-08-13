import test from "node:test";
import assert from "node:assert/strict";

import { createStudySubjectFileVersionsReadFacade } from "../study-subject-file-versions-read-facade.mjs";
import { projectStudySubjectFileVersions } from "../study-subject-file-versions-projection.mjs";
import { destinationView } from "../views.mjs";

test("Study file versions facade exposes only frozen canonical version reads", async () => {
  const callArguments = [];
  const facade = createStudySubjectFileVersionsReadFacade({
    listFileVersions(options) {
      callArguments.push(options);
      return Promise.resolve([{ id: "file-version:1" }]);
    },
    getFileArtifact() { throw new Error("file metadata must not be exposed"); },
  });

  assert.ok(Object.isFrozen(facade));
  assert.deepEqual(Object.keys(facade), ["listFileVersions"]);
  assert.equal(facade.getFileArtifact, undefined);
  assert.deepEqual(await facade.listFileVersions({ artifactId: "file-artifact:1" }), [{ id: "file-version:1" }]);
  assert.deepEqual(callArguments, [{ artifactId: "file-artifact:1" }]);
});

test("Study file versions preserve Core order and render only canonical values", () => {
  const versions = [
    { id: "file-version:2", versionNumber: 2, mediaType: "application/pdf", byteSize: 2048, originalModifiedAt: "2026-08-13T09:01:00.000Z", fileHashId: "hidden" },
    { id: "file-version:1", versionNumber: 1, mediaType: '<img src=x onerror="unsafe()">', byteSize: 1024, originalModifiedAt: "2026-08-13T09:00:00.000Z", storageKey: "hidden" },
  ];
  const state = (versionState) => destinationView("study", {
    status: "ready", subjects: [{ id: "subject:1", title: "Structures" }],
    detail: { status: "ready", subject: { id: "subject:1", title: "Structures" }, lectures: { status: "ready", lectures: [] }, tasks: { status: "ready", tasks: [] }, schedule: { status: "ready", entries: [] }, notes: { status: "ready", notes: [] }, files: { status: "ready", files: [] }, fileMetadata: { status: "ready", artifactId: "file-artifact:1", fileArtifact: { id: "file-artifact:1", displayName: "File", originalName: "file.pdf", sourceType: "upload", archivedAt: null }, versions: versionState } },
  });
  const ready = state({ status: "ready", versions });

  assert.deepEqual(projectStudySubjectFileVersions(versions), versions.map(({ id, versionNumber, mediaType, byteSize, originalModifiedAt }) => ({ id, versionNumber, mediaType, byteSize, originalModifiedAt })));
  assert.equal(projectStudySubjectFileVersions(versions).every(Object.isFrozen), true);
  assert.ok(ready.indexOf("2048") < ready.indexOf("1024"));
  assert.match(ready, /&lt;img src=x onerror=&quot;unsafe\(\)&quot;&gt;/);
  assert.doesNotMatch(ready, /fileHashId|storageKey|artifactId|file-artifact:1|current|latest/i);
  assert.doesNotMatch(ready, /data-study-subject-file-versions-(?:open|download|view)/);
  assert.match(state({ status: "loading" }), /Loading file versionsâ€¦/u);
  assert.match(state({ status: "ready", versions: [] }), /No file versions are available/);
  assert.match(state({ status: "error" }), /data-study-subject-file-versions-retry/);
});
