import test from "node:test";
import assert from "node:assert/strict";

import { createStudySubjectScheduleReadFacade } from "../study-subject-schedule-read-facade.mjs";
import { projectStudySubjectSchedule } from "../study-subject-schedule-projection.mjs";
import { destinationView } from "../views.mjs";

test("Study subject schedule facade exposes only frozen canonical listScheduleEntries", async () => {
  const callArguments = [];
  const facade = createStudySubjectScheduleReadFacade({
    listScheduleEntries: async (options) => {
      callArguments.push(options);
      return [{ id: "schedule-entry:1" }];
    },
    getScheduleEntry() { throw new Error("detail read must not be exposed"); },
  });

  assert.ok(Object.isFrozen(facade));
  assert.deepEqual(Object.keys(facade), ["listScheduleEntries"]);
  assert.equal(facade.getScheduleEntry, undefined);
  assert.deepEqual(await facade.listScheduleEntries({ subjectId: "subject:1" }), [{ id: "schedule-entry:1" }]);
  assert.deepEqual(callArguments, [{ subjectId: "subject:1" }]);
});

test("Study subject schedule retains Core order, literal fields, and read-only states", () => {
  const entries = [
    { id: "schedule-entry:later", dayOfWeek: 5, startTime: "13:00", endTime: "14:00", effectiveFrom: null, effectiveUntil: null, location: null, ignored: "no" },
    { id: "schedule-entry:first", dayOfWeek: 1, startTime: "09:00", endTime: "10:00", effectiveFrom: "2026-09-01", effectiveUntil: "2026-12-31", location: '<img src=x onerror="unsafe()"> & قاعة' },
  ];
  const projection = projectStudySubjectSchedule(entries);
  const state = (schedule) => destinationView("study", {
    status: "ready",
    subjects: [{ id: "subject:1", title: "Structures" }],
    detail: {
      status: "ready",
      subject: { id: "subject:1", title: "Structures" },
      lectures: { status: "ready", lectures: [] },
      tasks: { status: "ready", tasks: [] },
      schedule,
    },
  });
  const ready = state({ status: "ready", entries });

  assert.deepEqual(projection, entries.map(({ id, dayOfWeek, startTime, endTime, effectiveFrom, effectiveUntil, location }) => ({ id, dayOfWeek, startTime, endTime, effectiveFrom, effectiveUntil, location })));
  assert.equal(projection.every(Object.isFrozen), true);
  assert.ok(ready.indexOf("Friday") < ready.indexOf("Monday"));
  assert.match(ready, /dir="auto">&lt;img src=x onerror=&quot;unsafe\(\)&quot;&gt; &amp; قاعة/);
  assert.match(ready, /<dd>null<\/dd>/);
  assert.match(ready, /2026-09-01/);
  assert.doesNotMatch(ready, /ignored|active|current|next|relative|timezone|recurrence|overlap|count|rank/i);
  assert.match(state({ status: "loading" }), /Loading schedule entries/);
  assert.match(state({ status: "ready", entries: [] }), /No schedule entries are available/);
  assert.match(state({ status: "error" }), /data-study-subject-schedule-retry/);
});
