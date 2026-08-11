import test from "node:test";
import assert from "node:assert/strict";

import { projectStudySubjects } from "../study-subjects-projection.mjs";
import { destinationView } from "../views.mjs";

function subjectsFixture() {
  return [
    {
      id: "subject:structures",
      title: "Building Structures",
      semesterId: "semester:one",
      subjectProfileId: "profile:structures",
    },
    {
      id: "subject:drawing",
      title: "الرسم المعماري — Studio",
      semesterId: "semester:one",
      subjectProfileId: "profile:drawing",
    },
  ];
}

test("projection preserves Core order and exposes only subject identity and title", () => {
  const projection = projectStudySubjects(subjectsFixture());

  assert.deepEqual(projection, [
    { id: "subject:structures", title: "Building Structures" },
    { id: "subject:drawing", title: "الرسم المعماري — Studio" },
  ]);
  assert.equal(projection.every(Object.isFrozen), true);
});

test("Study renders loading, data, empty, and recoverable error states", () => {
  const loading = destinationView("study", { status: "loading" });
  const ready = destinationView("study", { status: "ready", subjects: subjectsFixture() });
  const empty = destinationView("study", { status: "ready", subjects: [] });
  const error = destinationView("study", { status: "error" });

  assert.match(loading, /Loading subjects/);
  assert.match(ready, /<ul class="subject-grid">/);
  assert.match(ready, /<article class="paper-card subject-card" aria-labelledby=/);
  assert.match(ready, /dir="auto">الرسم المعماري — Studio/);
  assert.match(ready, /2 subjects/);
  assert.match(empty, /No subjects yet/);
  assert.match(error, /data-study-retry/);
  assert.match(error, /Try again/);
});

test("Study escapes hostile titles while preserving automatic direction", () => {
  const hostile = subjectsFixture();
  hostile[0].title = '<img src=x onerror="unsafe()"> & مراجعة';

  const ready = destinationView("study", { status: "ready", subjects: hostile });

  assert.doesNotMatch(ready, /<img src=x/);
  assert.match(
    ready,
    /dir="auto">&lt;img src=x onerror=&quot;unsafe\(\)&quot;&gt; &amp; مراجعة/,
  );
});
