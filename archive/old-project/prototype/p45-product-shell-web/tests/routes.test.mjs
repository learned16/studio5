import test from "node:test";
import assert from "node:assert/strict";

import {
  destinations,
  routeFromHash,
  routeFromPathname,
  routeHash,
} from "../routes.mjs";

test("primary destinations preserve the approved five-item order", () => {
  assert.deepEqual(
    destinations.map(({ id, label }) => [id, label]),
    [
      ["today", "Today"],
      ["study", "Study"],
      ["projects", "Projects"],
      ["practice", "Practice"],
      ["library", "Library"],
    ],
  );
});

test("hash navigation restores every destination and defaults safely", () => {
  for (const destination of destinations) {
    assert.equal(routeFromHash(routeHash(destination.id)), destination);
  }
  assert.equal(routeFromHash(""), destinations[0]);
  assert.equal(routeFromHash("#/unknown"), destinations[0]);
});

test("static fallback maps direct paths without creating extra destinations", () => {
  assert.equal(routeFromPathname("/study").id, "study");
  assert.equal(routeFromPathname("/nested/library").id, "library");
  assert.equal(routeFromPathname("/not-a-route").id, "today");
});
