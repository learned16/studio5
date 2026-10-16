# Warm Paper Academic Studio

`Warm Paper Academic Studio` is an **Experimental** interactive visual prototype for Studio5. It tests a warm, paper-led academic application shell for an engineering and architecture student. It is not a production application and does not connect to Studio5 Core, real IndexedDB data, external services, or user files.

## Run locally

From this directory:

```powershell
node serve.mjs
```

Then open `http://127.0.0.1:4175`.

No install or build step is required. The prototype uses only HTML, CSS, vanilla JavaScript modules, and Node.js built-ins for its local server and tests.

## Test

```powershell
node --test tests/*.test.mjs
node --check app.mjs
node --check serve.mjs
```

The structural suite verifies the five and only five primary destinations, absence of an AI chat destination, the Unified Workspace and its modes, Arabic `dir="auto"` examples, the absence of dependencies/CDNs, accessibility foundations, and loading through a static HTTP server.

## Prototype coverage

- Today: greeting/date, Continue Studying, schedule, priorities, deadlines, recent work, and Quick Add.
- Study: semester selector, scalable subject directory, and subject sections for Overview, Lectures, Notes, Files, Drawings, and Tasks.
- Projects: assignments, submission dates, versions, professor feedback, and submission checklist.
- Practice: today’s exercise, Freehand, Engineering Drawing, Architectural Design Basics, progress, and a Drawing Coach entry point.
- Library: compact list, drawing-friendly grid, resource filters, subject/semester controls, and Favorite/Recent/Unassigned affordances with Arabic and mixed-language examples.
- Unified Workspace: page/resources panel, main paper area, optional context panel, Read/Annotate/Notes/Canvas/Split modes, ink toolbar placeholder, and collapsible side panels.
- Responsive behavior: navigation rail in landscape, bottom navigation in portrait, and drawer-like workspace panels in portrait.

All interactions and content are synthetic and presentation-only. Drawing, PDF rendering, coaching assessment, persistence, and task creation are intentionally not implemented.

## Isolation and Replace/Retire path

Reserved files are limited to `prototype/p45-warm-paper-shell/**`. The prototype imports no other prototype and exposes no Core contract or schema. It can be revised, hidden, replaced, or retired by removing this directory without migrating or deleting user data because it owns none.

The visual shell remains `Experimental` until real MatePad use supports an `Accepted`, `Revise`, or `Retired` decision.
