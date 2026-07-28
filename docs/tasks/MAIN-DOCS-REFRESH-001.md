# MAIN-DOCS-REFRESH-001 — Refresh the main documentation baseline

## Status

DONE — 2026-07-28

## User decision

`main` is a documentation baseline for the approved Studio5 process. It must not be updated by merging feature branches for this task.

## Scope completed

- Removed the obsolete root `README.md`.
- Removed the obsolete authoritative handoff PDF from the root.
- Added the current governance, specifications, decision records, status board, traceability, SOP, and task records from `codex/p4-backup-restore-ui`.
- Preserved the existing historical prototype and phase files already on `main`.
- Did not merge feature branches or copy application source code into `main`.
- Did not touch the untracked `gate0_device_results_for_codex.pdf` device-result file.

## Verification

- Reviewed the staged tree and confirmed no application-source directories were added by this refresh.
- Confirmed that the old root `README.md` and the old root authoritative PDF are absent from the staged `main` tree.

## Explicitly not done

- Removing `docs/phase-0`, `docs/phase-1`, or `prototype/ink-pdf` was not performed because the user did not explicitly approve deletion of those directories.
