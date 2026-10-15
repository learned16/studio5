# COLLEGE-M8 — Studio jury with rubrics (Jury room)

Status: implemented on branch `impl-m8-w2`, waiting for review. Plan: `docs/COLLEGE_PLAN.md` §4 M8 and the M8 appendix spec.
Classification: Experimental (a prototype UI over a small pure core; can be hidden or replaced without data loss).

## Goal
A studio critique like a real pin-up: an intent statement, self-scoring first, an AI juror whose scores are advice
only, the professor's scores typed in verbatim, and a calibration table between the three.

## Files
- `src/college/70-jury.js` (new, IIFE, attaches only to `S5.*`)
  - `S5.RUBRICS` — 3 Year-1 architecture rubrics written for the app (composition of primary forms; bubble diagram
    and zoning; freehand perspective sheet). 6 criteria each, 4 levels (Beginning/Developing/Proficient/Exemplary),
    English + Arabic descriptors, weights adding up to 100. Vocabulary aligned with a first-year studio
    (Harvard GSD 1101 topics), nothing copied; shown as `unverified`.
  - `S5.jury` pure core: `total`, `complete`, `validate`, `deltas`, `totals`, `bias`, `gate`, `prompt`;
    records: `create`, `save`, `setSelf`, `setProf`, `pin`, `pinInk`, `downscale`, `inkCanvas`; AI: `askAI`, `receive`.
  - View `jury` (home: rubric cards, past pin-ups, calibration across pin-ups; session: board + intent, brief,
    self-score, AI juror, professor scores, calibration table). Actions `jury-new|self|ai|ink|ink-pick|del`.
  - Registration through the college hooks only: `S5.CAMPUS_EXTRA` (Studio building → "Jury room" `{v:'jury'}`),
    `S5.LIVE_EXTRA` (`jury`), `S5.ROOT_EXTRA` (`jury → practice`). `S5.openRecord`/`S5.typeLabel` are wrapped so search
    results open a pin-up.
- `src/ai.js` (small, in scope): `S5.ai.ask` passes `temperature` and `max_tokens` through; the standalone `run()` and
  `run.json()` forward them, and `run.json()` now also sends `images` (JSON mode used to drop them).
- `src/tutor.js` (one line): `S5.tutor.ask` sends `temperature` in the request body (the Worker already accepts it;
  `undefined` is omitted by `JSON.stringify`, so every existing caller sends exactly what it sent before).
- `src/i18n-ar-m8.txt` (new): Arabic for every new UI string; no key overrides an existing dictionary key.
- `tests/col-m8-jury.mjs` (new).

## Rules kept
- Code grades, the AI talks: the juror's reply is untrusted. Unknown or repeated criterion ids are dropped, levels
  are rounded and clamped to 1–4, non-numeric levels are dropped, questions are capped (5 × 300 chars), and every
  weighted total (`Σ weight × level ÷ 4`, so all-4 = 100 %) is computed by code. The juror never sees the self-scores.
- Evidence tiers: self = E0, AI = E1 ("AI reading, not a grade"), professor/jury = EP (authoritative).
- Self first: the AI juror is closed (button, `S5.jury.askAI`, and the action) until the board, the intent and every
  self-score exist; professor fields stay closed until the self-scores are complete. Self-scores, board and intent
  lock once a valid AI reading or a professor score exists, so the calibration stays honest.
- Mastery is untouched: the module never writes `attempt` records, `tutorProg` or `studioProg`.
- AI path: only the governed `S5.ai.ask('Jury', …, {json:true, temperature:0.2, max_tokens:900, images:[board]})`
  (switch, noAI flag, daily cap 60, aiLog). Jury budget 6 requests per day per device, counted from aiLog.
- Board: photo (file input) or an ink page (rendered with the Ink engine's own painter, no editor opened),
  downscaled to a long side of 1280 px, JPEG quality 0.85, stored in the blob store (`boardKey`).

## Data (additive only, no migration)
New record type `jury`:
`{rubric, rubricV, title, projectId, boardKey, boardSrc:'photo'|'ink', inkId, boardW, boardH, boardBytes, boardAt,
intent, self:{critId:1–4}, selfAt, ai:{ok, at, tier:'E1', scores, evidence, questions, dropped, clamped} | null,
aiStatus:{ok, at, code?, reason?, partial?}, prof:{critId:1–4}, profAt, profVerbatim,
total:{self, ai, prof} (weighted %), deltas:{crit:{id:{aiSelf, profSelf, profAi}}, total:{…}}, tiers:{self:'E0', ai:'E1', prof:'EP'}}`.
`total` and `deltas` are recomputed by code on every save. Board bytes are ordinary blobs, so Backup carries them.
No existing record, field or schema version changes (`SCHEMA_VERSION` stays 3).

## Recovery
- Bad build: the new type is ignored by every other screen; reverting `70-jury.js` hides the room and leaves the
  `jury` records and their blobs untouched in IndexedDB and in backups (a later build shows them again).
- An unknown rubric id (for example a record from a newer build) renders an "Unknown rubric" notice and keeps its data.
- Deleting a pin-up is a soft delete (Trash); restore works as for every record.
- The ai.js/tutor.js change only adds optional fields; removing it restores the previous request bodies exactly.

## Acceptance → evidence (`tests/col-m8-jury.mjs`)
| Acceptance | Checks |
|---|---|
| The AI juror cannot be called before every self-score is entered | `selfFirstGate`, `selfFirstGateWithAiReady` (button disabled, `askAI` → `self-first`, action refused, aiLog unchanged; professor fields closed) |
| Mock reply `{ok, echo}` shows "juror unavailable" and nothing breaks | `mockReplyJurorUnavailable` (code `no-criteria`), `workerMockRepliedOkEcho`, `malformed_garbage_*`, `malformed_array_*`, `noPageErrors` |
| Hand-injected valid object gives the expected weighted total; unknown id dropped; level 7 → 4 | `validReplyValidatedByCode`, `aiWeightedTotalByCode`, `pureValidateClampDropTotal` |
| The jury record holds the self, ai and prof columns and the deltas are computed | `recordHoldsThreeColumns`, `profScoresVerbatim`, `deltasComputed`, `calibrationTable`, `persistsAfterReload`, `backupCarriesJuryAndBoard` |
| aiLog shows images:1; no AI jury score changes mastery | `aiLogJuryImages1`, `requestJsonTemp02WithImage`, `masteryUnaffected`, `masteryUnaffectedA` |
| Rubrics, room, board, budget, strings | `rubrics3x4to6bilingualWeights100`, `studioHasJuryRoom`, `campusRoomOpensJury`, `boardDownscaledJpeg1280`, `boardJpegQuality085`, `inkPageBoard`, `juryBudget6`, `arabicHomeNoLeftovers`, `arabicSessionNoLeftovers`, `englishRendering`, `oldOrUnknownRecordsSafe` |

Run: `BASE=<app url> [WBASE=<mock worker url>] node tests/col-m8-jury.mjs`. When BASE is the standalone app on the
mock Worker (`TUTOR_MOCK=1`) the AI checks hit the Worker; with the claude.ai build at BASE they use WBASE
(default `http://127.0.0.1:8787/` only when BASE is unset, i.e. inside run-all.sh); with no Worker they run against an
in-page stand-in that answers like the mock. The JSON output names the mode (`aiMode`).

## NEEDS DECISION / open
- Rubric wording and weights are the app's own; the owner should compare them with the real NTU studio briefs and
  mark the GSD alignment verified or adjust it.
- Pinning a camera photo on the MatePad (orientation, size) needs a real-device check.
- The plan's optional link from project pages is not added (it needs an edit to `view-projects.js`); a pin-up can be
  linked to a project from its own page instead.
- `docs/TRACEABILITY.md` (repository root) and the plan's progress log are left for the orchestrator, because this
  task was limited to `studio5-app/`.
