import test from "node:test";
import assert from "node:assert/strict";

import { createStudySubjectTasksReadFacade } from "../study-subject-tasks-read-facade.mjs";
import { projectStudySubjectTasks } from "../study-subject-tasks-projection.mjs";
import { destinationView } from "../views.mjs";

test("Study subject tasks facade exposes only frozen canonical listTasks", async () => {
  const callArguments = [];
  const facade = createStudySubjectTasksReadFacade({
    listTasks: async (options) => {
      callArguments.push(options);
      return [{ id: "task:1" }];
    },
    updateTask() { throw new Error("mutator must not be exposed"); },
  });

  assert.ok(Object.isFrozen(facade));
  assert.deepEqual(Object.keys(facade), ["listTasks"]);
  assert.equal(facade.updateTask, undefined);
  assert.deepEqual(await facade.listTasks({ subjectId: "subject:1" }), [{ id: "task:1" }]);
  assert.deepEqual(callArguments, [{ subjectId: "subject:1" }]);
});

test("Study subject tasks retain Core order, literal nullable fields, and read-only states", () => {
  const tasks = [
    { id: "task:later", title: "Later", dueAt: null, status: null, ignored: "no" },
    { id: "task:first", title: '<img src=x onerror="unsafe()"> & مهمة', dueAt: "2026-09-07T09:00:00+03:00", status: "open" },
  ];
  const projection = projectStudySubjectTasks(tasks);
  const state = (taskState) => destinationView("study", {
    status: "ready",
    subjects: [{ id: "subject:1", title: "Structures" }],
    detail: {
      status: "ready",
      subject: { id: "subject:1", title: "Structures" },
      lectures: { status: "ready", lectures: [] },
      tasks: taskState,
    },
  });
  const ready = state({ status: "ready", tasks });

  assert.deepEqual(projection, tasks.map(({ id, title, dueAt, status }) => ({ id, title, dueAt, status })));
  assert.equal(projection.every(Object.isFrozen), true);
  assert.ok(ready.indexOf("Later") < ready.indexOf("&lt;img src=x"));
  assert.match(ready, /dir="auto">&lt;img src=x onerror=&quot;unsafe\(\)&quot;&gt; &amp; مهمة/);
  assert.match(ready, /<dd>null<\/dd>/);
  assert.match(ready, /2026-09-07T09:00:00\+03:00/);
  assert.doesNotMatch(ready, /ignored|checkbox|completedAt|priority|overdue/i);
  assert.match(state({ status: "loading" }), /Loading tasks/);
  assert.match(state({ status: "ready", tasks: [] }), /No tasks are available/);
  assert.match(state({ status: "error" }), /data-study-subject-tasks-retry/);
});
