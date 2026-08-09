# Studio5 Phase 4.5 Product Shell

This isolated replacement-candidate surface implements the first approved
Phase 4.5 slice: an English LTR application shell with five responsive primary
destinations. It does not read or write Studio5 Core data and does not implement
Ink, persistence, Backup, Drawing Coach, or Phase 5 behavior.

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

The build produces ignored files under `dist/assets`. All tooling uses Node.js
built-ins; this surface has no external runtime or development dependencies.

## Replacement boundary

This directory owns no user data and imports no other prototype. It can be
revised or removed without migration. Existing P0, P3, and Warm Paper reference
surfaces remain unchanged.
