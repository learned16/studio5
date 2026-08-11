# Studio5 Phase 4.5 Product Shell

This isolated replacement-candidate surface implements the first approved
Phase 4.5 foundation: an English LTR application shell with five responsive
primary destinations. Today reads the canonical Core projection available to
the surface's current browser origin through a facade that exposes no mutators.
IndexedDB is origin-scoped: localhost or an isolated preview cannot see records
stored by P3 or production on a different origin. A later same-origin hosting
slice is required before those surfaces can share the same canonical records.
This surface does not change Core data contracts, Ink, Backup, Drawing Coach,
the production route, or Phase 5 behavior.

## Run locally

From this directory:

```powershell
pnpm run dev
```

Open `http://127.0.0.1:4176`. Routes use URL hashes, so reloading a destination
does not require server rewriting. `404.html` also returns a direct static path
to the matching hash destination when the hosting platform serves the fallback.

## Verify

```powershell
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm run build
pnpm run smoke
```

The build produces ignored files under `dist/assets` and copies the existing
Core module closure required by Today into `dist/assets/core`. All tooling uses
Node.js built-ins; this surface has no external runtime or development
dependencies.

The built smoke uses a controlled in-memory IndexedDB boundary. It verifies the
app's failure, Retry, query-options, escaping, and ready-state behavior, but it
does not prove access to existing physical-browser data. Core's real browser
storage smoke remains pending, and no device or production-route PASS is
claimed by this slice.

## Replacement boundary

This directory owns no user data and imports no other prototype. Its read-only
Today facade uses the canonical browser storage profile already owned by Core.
The shell can be revised or removed without data migration. Existing P0, P3,
and Warm Paper reference surfaces remain unchanged.
