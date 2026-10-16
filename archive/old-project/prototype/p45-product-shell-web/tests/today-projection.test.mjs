import test from "node:test";
import assert from "node:assert/strict";

import { projectTodayQuery } from "../today-projection.mjs";
import { destinationView } from "../views.mjs";

function projectionFixture() {
  return {
    date: "2026-08-11",
    utcOffsetMinutes: 180,
    agenda: [
      {
        id: "lecture:1",
        title: "Structures",
        startsAt: "2026-08-11T06:00:00.000Z",
        subject: { title: "Building Structures" },
      },
      {
        id: "lecture:2",
        title: "الرسم المعماري — Studio",
        startsAt: "2026-08-11T09:30:00.000Z",
        subject: { title: "Architectural Drawing" },
      },
    ],
    tasks: {
      overdue: [{ id: "task:1", title: "Overdue first", dueAt: "2026-08-10T12:00:00.000Z" }],
      dueToday: [{ id: "task:2", title: "Due second", dueAt: "2026-08-11T15:00:00.000Z" }],
      unscheduled: [{ id: "task:3", title: "Planned third", dueAt: null }],
      completedToday: [{ id: "task:4" }],
    },
  };
}

test("projection preserves Core agenda and task-group ordering", () => {
  const viewModel = projectTodayQuery(projectionFixture(), { locale: "en" });

  assert.deepEqual(viewModel.agenda.map(({ id }) => id), ["lecture:1", "lecture:2"]);
  assert.deepEqual(viewModel.tasks.map(({ id }) => id), ["task:1", "task:2", "task:3"]);
  assert.deepEqual(viewModel.tasks.map(({ status }) => status), ["Overdue", "Due today", "Planned"]);
  assert.equal(viewModel.completedCount, 1);
});

test("projection formats instants using the explicit Core UTC offset", () => {
  const viewModel = projectTodayQuery(projectionFixture(), { locale: "en-US" });

  assert.equal(viewModel.agenda[0].time, "9:00 AM");
  assert.equal(viewModel.tasks[1].time, "6:00 PM");
});

test("Today renders loading, empty, recoverable error, and automatic content direction", () => {
  const loading = destinationView("today", { status: "loading" });
  const empty = destinationView("today", {
    status: "ready",
    projection: { ...projectionFixture(), agenda: [], tasks: {
      overdue: [], dueToday: [], unscheduled: [], completedToday: [],
    } },
  });
  const error = destinationView("today", { status: "error" });
  const ready = destinationView("today", { status: "ready", projection: projectionFixture() });

  assert.match(loading, /Loading today/);
  assert.match(empty, /Your day is clear/);
  assert.match(error, /data-today-retry/);
  assert.match(error, /Try again/);
  assert.match(ready, /dir="auto"><strong>الرسم المعماري — Studio/);
  assert.match(ready, /Overdue first/);
});

test("Today escapes hostile user content while preserving automatic direction", () => {
  const hostile = projectionFixture();
  hostile.agenda[0].title = '<img src=x onerror="unsafe()"> & مراجعة';

  const ready = destinationView("today", { status: "ready", projection: hostile });

  assert.doesNotMatch(ready, /<img src=x/);
  assert.match(
    ready,
    /dir="auto"><strong>&lt;img src=x onerror=&quot;unsafe\(\)&quot;&gt; &amp; مراجعة/,
  );
});
