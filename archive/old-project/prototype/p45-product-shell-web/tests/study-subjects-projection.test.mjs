import test from "node:test";
import assert from "node:assert/strict";

import { projectStudySubjects } from "../study-subjects-projection.mjs";
import { projectStudySubjectLectures } from "../study-subject-lectures-projection.mjs";
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

test("Study subject lectures retain canonical order and only literal lecture fields", () => {
  const lectures = [
    { id: "lecture:later", title: "Later", startsAt: "2026-09-14T09:00:00+03:00", endsAt: "2026-09-14T10:00:00+03:00", status: "planned", ignored: "no" },
    { id: "lecture:first", title: '<img src=x onerror="unsafe()"> & محاضرة', startsAt: "2026-09-07T09:00:00+03:00", endsAt: "2026-09-07T10:00:00+03:00", status: "completed" },
  ];
  const projection = projectStudySubjectLectures(lectures);
  const ready = destinationView("study", {
    status: "ready",
    subjects: subjectsFixture(),
    detail: { status: "ready", subject: subjectsFixture()[0], lectures: { status: "ready", lectures } },
  });

  assert.deepEqual(projection, lectures.map(({ id, title, startsAt, endsAt, status }) => ({ id, title, startsAt, endsAt, status })));
  assert.equal(projection.every(Object.isFrozen), true);
  assert.ok(ready.indexOf("Later") < ready.indexOf("&lt;img src=x"));
  assert.match(ready, /dir="auto">&lt;img src=x onerror=&quot;unsafe\(\)&quot;&gt; &amp; محاضرة/);
  assert.match(ready, /2026-09-14T09:00:00\+03:00/);
  assert.match(ready, /<dd>planned<\/dd>/);
  assert.doesNotMatch(ready, /ignored/);
});

test("Study subject lecture loading, empty, and error states are explicit", () => {
  const subject = subjectsFixture()[0];
  const state = (lectures) => destinationView("study", {
    status: "ready",
    subjects: subjectsFixture(),
    detail: { status: "ready", subject, lectures },
  });

  assert.match(state({ status: "loading" }), /Loading lectures/);
  assert.match(state({ status: "ready", lectures: [] }), /No lectures are available/);
  assert.match(state({ status: "error" }), /data-study-subject-retry/);
});
