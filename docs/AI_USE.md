# AI Use Record

## Phase P1: Engine Core (2026-11-14)
- **Tool**: Antigravity Assistant (powered by Google DeepMind Gemini models).
- **Scope**:
  - Scaffolded Vite + React + TypeScript + Vitest setup.
  - Authored pure TypeScript simulation engine files: `rng.ts`, `rules.ts`, `types.ts`, `sim.ts`.
  - Authored unit test suite in `sim.test.ts` covering 9 required rule scenarios with hand-computed values.
  - Documented architectural choices in `DECISIONS.md`.
- **Human Verification**:
  - Validated all formulas against specification rules.
  - Verified unit test suite passing deterministically via `npm test`.
  - Verified TypeScript compilation and production build via `npm run build`.


## Phase P2: Storm Clock (2026-11-14)
- **Tool**: Antigravity Assistant (powered by Google DeepMind Gemini models).
- **Scope**:
  - Implemented Storm Clock constants in `rules.ts`.
  - Added clock types (`ClockMove`, `ClockOutcome`, `ClockSetup`, `ClockResult`, `PlayClockResult`) to `types.ts`.
  - Created `src/engine/clock.ts` with `clockSetup`, `previewClock`, and `playClock`.
  - Integrated Storm Clock execution into `src/engine/sim.ts` on storm sol with log emission.
  - Authored unit test suite in `src/engine/clock.test.ts` covering all 10 required clock test scenarios with hand-computed values in comments.
  - Updated P1 test fixtures (`smallStorm`, `bigStorm`) in `sim.test.ts` with `gapHours: 4` per instructions.
  - Documented design decisions in `DECISIONS.md`.
- **Human Verification**:
  - Validated all 10 clock tests and all 9 sim tests passing via `npm test` (19/19 passing).
  - Verified TypeScript compilation and production build via `npm run build`.

## Phase P3: Saver and Two-Worlds Comparison (2026-11-14)
- **Tool**: Antigravity Assistant (powered by Google DeepMind Gemini models).
- **Scope**:
  - Authored `src/engine/saver.ts` implementing `findSaver` with single and pair edit search, ranking, tie-breaking, replay verification, and template text generation.
  - Authored `src/engine/compare.ts` implementing `compareWorlds` with 5 comparison rows and priority-based sentence generation.
  - Authored unit test suites `src/engine/saver.test.ts` (8 tests) and `src/engine/compare.test.ts` (3 tests) covering all 10 required test scenarios with hand-computed expected values in comments.
  - Recorded architectural and tie-breaking choices in `DECISIONS.md`.
- **Human Verification**:
  - Validated all 30 tests in test suites passing via `npm test` (30/30 passing).
  - Verified TypeScript compilation and production build via `npm run build`.

## Repository Setup (2026-11-14)
- **Tool**: Mavis (MiniMax agent runtime, local workspace agent).
- **Scope**:
  - Wrote `README.md` from the real repository contents, including the current build status and the known failing tests.
  - Added `LICENSE` (MIT), `CONTRIBUTING.md`, `.gitignore`, `.gitattributes`, and `.editorconfig`.
  - Added `.github/workflows/ci.yml` (Node 20 and 22: install, typecheck and build, unit tests) and GitHub issue forms.
  - Added `docs/DATA_SOURCES.md` and `docs/CREDITS.md`. No NASA value was written into either file, because no NASA data has been fetched or saved yet.
  - Created the public GitHub repository `lenchobel/storm-watch` and pushed the history.
- **Human Verification**:
  - Ran `npm test` and `npm run build` after the changes. The build passes. The unit test suite was already failing before this work, with 11 of 30 tests failing during the engine rebalance. No test was modified and no engine rule was changed, so the failure stays visible.
  - Confirmed every claim in `README.md` against the files in the repository.

## Phases P4–P10: Balance, NASA Data, UI/PWA & Submission (2026-11-14)
- **Tool**: AI coding assistant in Google AI Studio.
- **Scope**:
  - **P4 (Balance)**: Fixed uniform Storm Clock arrival sampling in `src/engine/clock.ts`, tuned `AIR_TABLE` and `TIER_DOSE` in `src/engine/rules.ts`, updated hardcoded balance constants in `clock.test.ts`, `sim.test.ts`, `saver.test.ts`, and completed Proof (d) in `scripts/balance-bot.ts`.
  - **P5 (NASA Data)**: Implemented `src/data/donkiLink.ts`, `scripts/fetch-donki.ts`, `api/donki.ts`, `src/data/loadStorms.ts`, `src/data/facts.json`, and `src/data/gameStorms.json` using live CCMC DONKI responses and verified NASA NTRS/Science URLs.
  - **P6–P8 (UI, Storm Clock, Teaching, PWA)**: Added stepwise engine API (`createMission`, `playSol`, `clockStep`, `warningSolFor`), SVG outpost & Orbi components, WebAudio synthesizer, five educational/honest-data pages, debrief quiz, custom SVG/PNG icons, and `vite-plugin-pwa` offline precaching.
  - **P9–P10 (Audit & Submission)**: Updated documentation, `.env.example`, `vercel.json`, and drafted `docs/SUBMISSION.md`.
- **Media**: No AI-generated images, photography, video, or recorded audio are used anywhere in the app.
- **Human Verification**:
  - Executed `npm test` (39/39 passing), `npm run balance` (5,000 runs/strategy passing all targets and Proofs a–d), `npm run build`, and `npm run e2e` (mobile 360px overflow, 48px targets, axe-core, reduced motion, 3 Storm Clock outcomes, Two-Worlds comparison, and offline PWA reload).
  - Visually inspected mobile (`360x640`) and desktop (`1280x800`) screenshots and fixed HUD spacing, preset layout, and table number formatting.

## Phase P11: Pre-Release Fixes (2026-11-14)
- **Tool**: Mavis (MiniMax agent runtime, local workspace agent).
- **Scope**:
  - **Star reachability**: Added `scripts/star-search.ts` and `scripts/star-plan-utils.ts` (200,000 random plans per row over 60 seeds, plus beam hill climbing and a near-sensible search), `scripts/star-reach.ts` (reachability table with a re-run check on every printed plan), and `scripts/plan-builders.ts` (plan builders extracted from `scripts/balance-bot.ts`).
  - **Balance fix**: Raised `SUNLIGHT_MARS` from 18 to 24 in `src/engine/rules.ts` because two stars were unreachable on every Mars storm, and made the two-star science goal site-dependent (`STAR_SCIENCE_THRESHOLD_MOON = 8`, `STAR_SCIENCE_THRESHOLD_MARS = 3`) through a new `starScienceGoal(site)` helper and a `site` parameter on `calculateStars`.
  - **Copy**: Updated the star-goal text in the sol screen, briefing, glossary, teacher page, and debrief; replaced the long saver and compare templates with short two-sentence versions.
  - **Sound toggle**: At the user's request, the top-bar `Sound` / `Muted` text button became an icon-only speaker button with redrawn `icon-speaker` and `icon-speaker-off` glyphs, keeping `aria-label` and `aria-pressed`, with `tests/sound-toggle.spec.ts` asserting the 48 px square target and the centred glyph.
  - **Data**: Added two real storms from the saved DONKI snapshot to `src/data/gameStorms.json` (M4.2 and X5.1), re-fetched every `src/data/facts.json` source URL, corrected the Curiosity surface figure to 0.7 mSv/day, repointed two facts to pages that actually contain their numbers, and added the closest-approach Mars radio delay fact.
  - **Verification tooling**: Added `scripts/print-storm-table.ts` (prints the game storms straight from `data/storms.json` and re-checks every gap against the timestamps), `scripts/check-facts.ts` and `scripts/fact-quotes.ts` (fetch every fact URL live, compare the SHA-256 of the served file against the copy the recorded quote was read from, and search the live text for the number), `tests/demo.spec.ts` (plays the three demo moments end to end), `tests/screenshots.spec.ts` (captures every screen at 360x640 and 1280x800), and `tests/helpers.ts` (shared e2e assertions, split out of `tests/e2e.spec.ts` so every file stays under 250 lines).
  - **Docs**: Rewrote `docs/SUBMISSION.md` §1 and added §1b with the exact demo URLs and taps; updated `DECISIONS.md`, `BLUEPRINT.md`, `docs/DATA_SOURCES.md`, and this file.
- **Media**: No AI-generated images, photography, video, or recorded audio are used anywhere in the app or the demo script.
- **Human Verification**:
  - Ran `npm test` (42/42 passing), `npm run balance` (Moon Cadet sensible 97.0%, Moon Cadet random 34.6%, Mars Commander sensible 66.6%, all-science 0% on both worlds, Proofs a–d all PASS), `npm run build`, and `npm run e2e` (11 tests passing, including the sentence audit on every screen, the `SAVED` badge check with `/api/donki` blocked, and the three demo moments).
  - Re-fetched all 7 fact sources live and printed the exact supporting sentence from each page.
  - Printed the game storm table from `data/storms.json` and confirmed every gap against the timestamps.
  - Opened the app at 360x640 and 1280x800 and compared every screen against the blueprint layout and copy.


## Phase L1: English and Afaan Oromoo UI Support (2026-11-15)
- **Tool**: OpenAI Codex assistant.
- **Scope**:
  - Added English and Afaan Oromoo catalogues with matching keys and English fallback values.
  - Added language persistence, browser-language defaulting, document language metadata, and the top-bar switch.
  - Routed visible UI copy and engine-generated saver, comparison, and Storm Clock messages through translation keys.
  - Added translation consistency checks, engine text-key tests, and Playwright language/layout/accessibility coverage.
  - Added wrapping fixes and requested mobile screenshots.
- **Human Verification**: `npm test` passed (54 tests); `npm run build` passed; `npm run i18n:check` passed (243 keys, matching placeholders). `npm run e2e` passed all 13 browser tests, including language, layout, axe, and screenshots at 360x640 and 1280x800.



## Phase P1: Engine Core Review (2026-11-15)
- **Tool**: OpenAI Codex assistant.
- **Scope**: Reviewed the existing Phase P1 engine files and test coverage. No engine or test changes were needed.
- **Human Verification**: `npm test` passed (54 tests); `npm run build` passed.

## Phase L2: Afaan Oromoo Translation Draft (2026-11-15)
- **Tool**: OpenAI Codex assistant; no translation service used.
- **Scope**:
  - Drafted Oromo text for the catalogue while preserving keys and placeholders.
  - Kept product and source names, plus the existing `common.back` test value, in English.
  - Localized Moon and Mars site names, fixed narrow meter labels, and removed untranslated Orbi status keys from the visible UI.
  - Added sentence-length checks for Oromo screens and a translation unit assertion.
- **Verification**: 55 unit tests passed; build passed; 247 catalogue keys and placeholders match; 12 values remain English or shared names; 13 browser tests passed at 360x640 and 1280x800. Native-speaker review is still needed.

## Stage A: Visual Identity Review (2026-11-15)
- **Tool**: OpenAI Codex assistant.
- **Scope**:
  - Reviewed the existing visual changes against the upgrade brief and the compact layout in `BLUEPRINT.md`.
  - Restored translated Orbi status labels so shape and color have words beside them.
  - Raised compact text that fell below 18 px, prevented Oromo HUD label collisions, and clarified the verified place-name note.
  - Kept the Apple touch icon on its supported PNG reference. The favicon and PWA manifest continue using the new SVG design.
  - Expanded the browser screenshot coverage to the requested five screens, two languages, and two viewport sizes. Added an Oromo meter-fit assertion without changing any existing expected values.
- **Human Verification**: Unit tests and build passed. The 13-test Playwright suite passed with screenshots at 360x640 and 1280x800. `npm run i18n:check` passed. Screenshots were visually reviewed in English and Afaan Oromoo. No AI-generated media was used.

## Stages B–D: Progress, classroom, and optional 3D (2026-11-15)
- **Tool**: OpenAI Codex assistant; no external translation or image service used.
- **Scope**:
  - Added seeded daily missions, goals, local progress, ranks, challenge links, and storm collection.
  - Added prediction-before-clock, debrief learning cards, forecaster score, classroom mode, teacher lesson, class challenge, and printable group table.
  - Added an optional procedural Three.js scene with SVG loading and failure fallback. The Earth texture is drawn in code; no external imagery or audio was added.
  - Added English and Afaan Oromoo catalogue entries. Translation remains a draft requiring fluent-speaker review.
- **Choices**: Goal thresholds stayed unchanged after the 100,000-plan reachability search. False-alarm teaching uses a plainly labeled game note because `facts.json` has no general flare false-alarm rate. Classroom records stay on-device; no student data is uploaded.
- **Existing tests**: No existing expected values or assertions were altered. Existing mission helpers now answer “Not sure” before the storm-sol action when prompted. Screenshot coverage adds the collection and daily briefing. New Stage B, C, and D tests cover the added flows.
- **Visual review**: Generated 96 paired screenshots for 2D and 3D, Moon and Mars, sheltered/caught/false-alarm clock states, and debriefs at 360x640 and 1280x800. Reviewed representative pairs for scene meaning and layout. The in-app Chrome session chose the 2D fallback; Playwright SwiftShader rendered and tested 3D.
- **Verification**: 67 unit tests passed; build passed; 334 catalogue keys and placeholders match. All 27 Playwright tests passed, including screen accessibility in English and Afaan Oromoo, keyboard-only play, 3D gameplay and fallback, screenshot comparisons, and a one-page lesson PDF. Goal reachability passed the 70% bar without threshold changes.
- **Review still needed**: A fluent Afaan Oromoo speaker should review the draft. The local app used its saved NASA snapshot; live NASA fetching and deployment were not checked in this pass.

