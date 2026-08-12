import test from "node:test";
import assert from "node:assert/strict";

import { projectLibraryResults } from "../library-results-projection.mjs";
import { destinationView } from "../views.mjs";

const canonicalResults = [
  {
    targetKind: "file-artifact",
    targetId: "file-artifact:2",
    title: "Second result",
    subtitle: "Source B",
  },
  {
    targetKind: "note",
    targetId: "note:1",
    title: "First by another ranking",
    subtitle: null,
  },
];

test("Library projection preserves canonical result order and identity", () => {
  assert.deepEqual(projectLibraryResults(canonicalResults), canonicalResults);
});

test("Library ready and empty states use semantic accessible content", () => {
  const ready = destinationView("library", { status: "ready", results: canonicalResults });
  const empty = destinationView("library", { status: "ready", results: [] });

  assert.ok(ready.indexOf("Second result") < ready.indexOf("First by another ranking"));
  assert.match(ready, /<ul class="library-grid">/);
  assert.equal((ready.match(/<li><article/g) ?? []).length, 2);
  assert.match(ready, /aria-labelledby="library-result-1"/);
  assert.match(ready, /<h3 id="library-result-1" dir="auto">Second result<\/h3>/);
  assert.match(ready, /<p dir="auto">Source B<\/p>/);
  assert.match(empty, /No library items yet/);
  assert.match(empty, /empty-state/);
});

test("Library escapes hostile user content and applies automatic direction", () => {
  const markup = destinationView("library", {
    status: "ready",
    results: [{
      targetKind: "note",
      targetId: "note:hostile",
      title: '<img src=x onerror="unsafe()"> & مراجعة',
      subtitle: '<script>alert("unsafe")</script> & مصدر',
    }],
  });

  assert.doesNotMatch(markup, /<img src=x|<script>/);
  assert.match(markup, /dir="auto">&lt;img src=x onerror=&quot;unsafe\(\)&quot;&gt; &amp; مراجعة/);
  assert.match(markup, /dir="auto">&lt;script&gt;alert\(&quot;unsafe&quot;\)&lt;\/script&gt; &amp; مصدر/);
});

test("Library loading and recoverable error states are explicit", () => {
  const loading = destinationView("library", { status: "loading" });
  const error = destinationView("library", { status: "error" });

  assert.match(loading, /aria-busy="true"/);
  assert.match(loading, /Loading library/);
  assert.match(error, /role="alert"/);
  assert.match(error, /data-library-retry/);
  assert.match(error, /did not open files or create notes/);
});
