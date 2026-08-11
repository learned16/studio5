# Studio5 Phase 4.5 Product Shell

This isolated replacement-candidate surface implements the first approved
Phase 4.5 foundation: an English LTR application shell with five responsive
primary destinations. Today reads the existing canonical Core projection from
this browser through a surface-local facade that exposes no mutators. The
surface does not change Core data, storage contracts, Ink, Backup, Drawing
Coach, the production route, or Phase 5 behavior.

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

## Replacement boundary

This directory owns no user data and imports no other prototype. Its read-only
Today facade uses the canonical browser storage profile already owned by Core.
The shell can be revised or removed without data migration. Existing P0, P3,
and Warm Paper reference surfaces remain unchanged.
