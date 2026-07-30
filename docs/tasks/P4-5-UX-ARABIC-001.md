# P4.5-UX-ARABIC-001 - Arabic Content Foundation

## Status

`IN PROGRESS / CHERRY-PICKED TO CURRENT DEVELOP / FULL VERIFICATION PENDING`

## Goal

Fix browser rendering of Arabic and mixed Arabic/English user-authored content in
the existing P3 functional prototype without redesigning the application shell,
changing Core contracts, or starting Phase 5.

## Requirement IDs

- `S5-UX-I18N-001`
- `S5-UX-FOUNDATION-001`

## Base and branch

- Base: `develop@6f18b70`
- Branch: `fix/arabic-content-rendering`

## Allowed files

- `PROJECT_STATUS.md`
- `docs/TRACEABILITY.md`
- `docs/DECISION_LOG.md`
- `docs/PHASE_4_5_UX_FOUNDATION_SPEC_EN.md`
- `docs/tasks/P4-5-UX-ARABIC-001.md`
- `prototype/p3-lecture-capture-web/package.json`
- `prototype/p3-lecture-capture-web/user-content.mjs`
- `prototype/p3-lecture-capture-web/app.mjs`
- `prototype/p3-lecture-capture-web/styles.css`
- `prototype/p3-lecture-capture-web/index.html`
- `prototype/p3-lecture-capture-web/sw.js`
- `prototype/p3-lecture-capture-web/closeout/app.mjs`
- `prototype/p3-lecture-capture-web/closeout/styles.css`
- `prototype/p3-lecture-capture-web/closeout/index.html`
- `prototype/p3-lecture-capture-web/library/app.mjs`
- `prototype/p3-lecture-capture-web/library/styles.css`
- `prototype/p3-lecture-capture-web/library/index.html`
- `prototype/p3-lecture-capture-web/reliability/app.mjs`
- `prototype/p3-lecture-capture-web/reliability/styles.css`
- `prototype/p3-lecture-capture-web/scripts/typecheck.mjs`
- `prototype/p3-lecture-capture-web/scripts/verify-build.mjs`
- `prototype/p3-lecture-capture-web/tests/arabic-content-ui.test.mjs`
- Existing P3 tests only when an assertion must follow the Service Worker cache
  version required to ship the new local module.

## Root-cause hypothesis

1. P3 documents inherit a fixed RTL direction while mixed user content does not
   receive an isolated automatic bidi context.
2. Dynamic user content is assigned with `textContent`, but it lacks
   `dir="auto"` and `unicode-bidi: plaintext`.
3. File and resource titles are direct text nodes inside flex buttons instead of
   independent text elements.
4. Several user-content selectors use `overflow-wrap: anywhere`, which permits
   aggressive breaks inside Arabic words.
5. CSS cannot affect glyph shaping inside the PDF.js canvas. PDF page rendering
   is a separate surface controlled by the PDF file fonts and PDF.js.

## In scope

- Preserve the exact stored string and use native browser bidi/shaping.
- Give user-authored HTML content an independent `dir="auto"` element.
- Apply safe Arabic-capable system font fallbacks.
- Remove aggressive wrapping from user-content selectors.
- Cover Capture, Closeout, Library, PDF filenames, Notes, resource results, and
  the visible selected Backup filename.
- Add regression tests and an explicit HTML-versus-PDF-canvas diagnostic.
- Preserve the adopted English LTR product shell and current UX Foundation decisions.
- Update project status without claiming unperformed device gates.

## Out of scope

- Converting the current P3 prototype into the final English product shell.
- Full UX redesign, wireframes, or implementation of the future navigation.
- Core, Schema, storage namespace, migrations, or Backup format changes.
- Replacing PDF.js or adding an Arabic reshaping library.
- Claiming that Arabic text embedded inside arbitrary PDFs is fixed without a
  dedicated device fixture and result.
- Phase 5, AI features, new frameworks, manual deployment, or deletion of P0/P3.

## Acceptance criteria

- [ ] Arabic filenames, mixed filenames, notes, lecture/subject titles, and
  captures render through independent auto-direction HTML elements.
- [ ] User content retains the exact original Unicode string.
- [ ] User-content styles use `unicode-bidi: plaintext`, `text-align: start`,
  `letter-spacing: normal`, and `overflow-wrap: break-word`.
- [ ] English-only content remains LTR through `dir="auto"`.
- [ ] Existing P3 shell is not presented as the final product design.
- [ ] PDF canvas rendering remains on the pinned PDF.js engine and is documented
  separately from HTML content rendering.
- [ ] Core, P0, and P3 verification commands pass.
- [ ] Worker dry-run passes without deployment.

## Verification

- Studio5 Core: lint, typecheck, test when those scripts exist.
- P0 Ink: lint, typecheck, test, build when those scripts exist.
- P3: lint, typecheck, test, `preview:verify`.
- Root: Worker dry-run through the existing script.
- Git diff review confirms no changes to `packages/**`, Schema, storage, or
  Backup implementation.

## Replace / retire

The current P3 interface remains a functional prototype. These content-direction
rules may be reused by the future shell, but its visual structure may be replaced
without changing stored user data.

## Rollback

Revert this task's UI module, selectors, tests, and documentation. There is no
data migration and no stored value transformation to roll back.

## Preserved safe-checkpoint result

- Arabic and mixed HTML content uses independent `dir="auto"` elements.
- Original strings remain unchanged; no JavaScript reshaping was added.
- PDF.js canvas remains unchanged and is explicitly tested as a separate surface.
- P3 lint and static module typecheck passed.
- P3 tests passed: `27/27`, including `5/5` new Arabic-content regressions.
- P3 static build and preview verification passed: `251` files, `4/4` routes,
  unknown route `404`, no broken local references, no exposed sensitive files.
- Core/P0 checks, Worker dry-run, push, Pull Request, and Cloudflare Preview
  remain required on the new branch. Phase 5 is out of scope.

## Conflict resolution on current develop

- `PROJECT_STATUS.md` and `docs/TRACEABILITY.md` conflicted during cherry-pick.
- The current partial Phase 4 gate, `Warm Paper Academic Studio`, English LTR
  shell, and `Today / Study / Projects / Practice / Library` decisions from
  `develop` were retained.
- Only the Arabic HTML implementation and verification status were added.
- Arabic PDF.js canvas rendering remains a separate MatePad device verification.
