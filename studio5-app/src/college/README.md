College modules (docs/COLLEGE_PLAN.md). build.mjs concatenates every src/college/*.js in filename order,
after tutor.js and before campus.js, into the same shared "use strict" scope — so each file is an IIFE that
only attaches to S5.*. Name files with a numeric prefix (10-problems.js, 20-gens-y1.js, 30-view-pset.js…).
Extension hooks (no edits to shared files needed):
  S5.CAMPUS_EXTRA = (S5.CAMPUS_EXTRA || []); S5.CAMPUS_EXTRA.push(["civil", ["Problem room", { v: "pset", kind: "civil" }]]);
  S5.LIVE_EXTRA  = (S5.LIVE_EXTRA || []);  S5.LIVE_EXTRA.push("pset");          // views that hold inputs/timers
  S5.ROOT_EXTRA  = Object.assign(S5.ROOT_EXTRA || {}, { pset: "practice" });   // which nav tab is highlighted
UI strings: one dictionary file per milestone, src/i18n-ar-m<N>.txt (English<TAB>Arabic), picked up automatically.
Tests: tests/col-m<N>-*.mjs are run by tests/run-all.sh; set process.exitCode = 1 on any failed check.
