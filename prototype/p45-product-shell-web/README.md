# Studio5 Phase 4.5 Product Shell

This isolated replacement-candidate surface implements the first approved
Phase 4.5 foundation: an English LTR application shell with five responsive
primary destinations. Today reads the canonical Core projection and Study lists
canonical Core subjects; an opened Study subject reads its canonical lectures
without changing them. Library lists the canonical Core library index without
opening resource bytes. All reads use records available to the surface's current
browser origin.
Each destination uses a surface-local facade that exposes no mutator.
IndexedDB is origin-scoped: localhost or an isolated preview cannot see records
stored by P3 or production on a different origin. A later same-origin hosting
slice is required before those surfaces can share the same canonical records.
This surface does not change Core data contracts, Ink, Backup, Drawing Coach,
the production route, or Phase 5 behavior. It does not implement PDF opening,
a PDF viewer, file-byte access, or Notes.

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
Core module closure required by Today, Study, and Library into
`dist/assets/core`. All tooling uses Node.js built-ins; this surface has no
external runtime or development dependencies.

The built smoke uses a controlled in-memory IndexedDB boundary. It verifies the
app's Today, Study, and Library failure, Retry, read-input, escaping, and
ready-state behavior, but it does not prove access to existing physical-browser
data. Core's real browser storage smoke remains pending, and no device or
production-route PASS is claimed by this slice.

## Replacement boundary

This directory owns no user data and imports no other prototype. Its read-only
Today, Study, and Library facades use the canonical browser storage profile
already owned by Core. The shell can be revised or removed without data
migration. Existing P0, P3, and Warm Paper reference surfaces remain unchanged.
