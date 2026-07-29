# Studio5 Independent Web Build

GitHub repository and its branches are the only source of truth. The current Sites
v9 deployment is a frozen reference only and is not part of the build or release
workflow.

## Requirements

- Node.js 22.
- No package installation is required for Core or P0 Ink because they have no
  external runtime dependencies or lockfile.
- P3 uses the committed `pnpm-lock.yaml`; use pnpm with `--frozen-lockfile`.

## Studio5 Core

Core is a JavaScript module package and has no standalone web build script:

```text
cd packages/studio5-core
npm run lint
npm run typecheck
npm test
```

## P0 Ink Web

```text
cd prototype/p0-ink-web
npm run build
```

Output:

```text
prototype/p0-ink-web/dist/
```

The output contains static assets plus `dist/server/index.js`.

## P3 Lecture Capture Web

```text
cd prototype/p3-lecture-capture-web
pnpm install --frozen-lockfile
pnpm run build
```

Output:

```text
prototype/p3-lecture-capture-web/dist/
```

The output contains the Capture, Closeout, Library, PDF.js, Reliability and shared
storage assets plus `dist/server/index.js`.

## Release rule

Build output must come from a committed GitHub branch. A later GitHub-connected
preview provider may consume these outputs, but Studio5 source and history remain
in GitHub.
