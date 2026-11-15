# Decisions

## 2026-11-14 — P1 Engine Core

1. **Stack**: Scaffolded Vite + React + TypeScript + Vitest without external libraries.
2. **Mulberry32 PRNG**: Implemented pure deterministic `mulberry32` generator in `src/engine/rng.ts`. Zero calls to `Math.random` throughout `src/engine/`.
3. **Independent Seeded Draws**: Storm sol drawn from `mulberry32(seed)` in `[3, 6]`. Mars dust sol drawn from separate salted generator `mulberry32((seed ^ 0x6a09e667) >>> 0)` in `[2, 6]` (returns `null` for Moon). Neither draw interferes with the other.
4. **Power Allocation & Cuts**: Sol plans budget bolts capped at `floor(power / 15)`. Excess bolts are cut from `lab` first, then `shield`, then `air`, and recorded in `log`.
5. **Radiation & Health Rounding**: Total radiation loss per sol (cosmic + storm) scaled by difficulty multiplier (0.7 for Cadet, 1.0 for Commander), subtracted from health, and rounded once per sol via `Math.round`. Health, air, and power capped at 100.
6. **Early Termination**: Mission breaks out immediately on the sol where `air <= 0` or `health <= 0` (`survived = false`, `stars = 0`).

## 2026-11-14 — P2 Storm Clock

1. **P1 Test Fixture Edit in `sim.test.ts`**:
   - As authorized by the P2 prompt, `smallStorm` and `bigStorm` in `src/engine/sim.test.ts` were updated to add `gapHours: 4`. Without `gapHours`, storms would be treated as false alarms under P2 rules. Zero assertions or expected values in `sim.test.ts` were changed.
2. **Dedicated Seeded PRNG Streams**:
   - `falseAlarmForecastHours`: uses `mulberry32((cfg.seed ^ 0xbb67ae85) >>> 0)` in `[2, 6]`.
   - `marsDelayMinutes`: uses `mulberry32((cfg.seed ^ 0x3c6ef372) >>> 0)` drawing whole minutes in `[3, 22]`.
   - `arrivalU`: uses `mulberry32((cfg.seed ^ 0x9e3779b9) >>> 0)` in `[0.5, 1.0]`.
   - These independent salts ensure no draw alters another, and none alter P1 `stormSol` or `dustSol`.
3. **Forecast Hours Formatting**:
   - `formatForecastHours(gapHours)` clamps to minimum 0.05. Clamped values under 0.1 (such as 0.05 h = 3 min) are preserved unrounded so Mars delay (>= 3 min) produces `visibleHours <= 0` and `oldMessage = true`, while Moon delay (0.02 min) preserves `visibleHours > 0` and `oldMessage = false`. Gaps >= 0.1 are rounded to 1 decimal place.
4. **Clock Fallbacks**:
   - Missing `clock` array on a sol plan defaults to shelter on block 1 (`['shelter']`).
   - Missing trailing blocks in an active clock array default to `'work'`.
5. **Log Messaging**:
   - All generated log lines remain under 12 words per sentence, adhering to rule 5 of `AGENTS.md`.


## 2026-11-14 — P3 Saver and Two-Worlds Comparison

1. **Saver Search Hierarchy**:
   - Skips evaluation if the initial run already reached 3 stars.
   - Evaluates all single edits first (cost 1): 14 bolt adjustments per sol plus storm-sol clock moves (shelter at block 1..K or 'none').
   - Tests all pairs (cost 2) only if no single edit achieves the goal. Never pairs edits on the same sol and category, and never pairs two clock moves.
   - Ranking: survival fix > stars gained > lowest cost > fewest bolts moved > earliest sol > category order (`air` < `shield` < `lab`).
   - Every candidate is verified by re-running `runMission` with the candidate plan; matching before/after results are guaranteed.
2. **Saver Text Templates**:
   - Templates follow specified strings: `'If you had used 1 less/more bolt on {thing} on sol {n}, {benefit}.'`, `'If you had gone to shelter on block {b}, the crew would have stayed safe.'`, and `'If you had worked all blocks, you would have earned more science.'`. *(These were replaced by shorter two-sentence templates in P11 — see P11 item 4.)*
   - Multi-edit text joins clauses with `' and '` following `'If you had'`.
3. **World Comparison Rows and Sentences**:
   - Table outputs 5 exact rows: `Stars`, `Air left`, `Health left`, `Science`, `Warning time`.
   - Sentence follows priority order: K difference naming delay minutes and missing blocks > old message notification > power difference >= 10 > identical feel fallback.

## 2026-11-14 — P4 Balance Bot

1. **Dev Dependency**: Added `tsx` (`devDependencies`) to run TypeScript balance and data scripts via `npm run balance`.
2. **Arrival Block Distribution (`src/engine/clock.ts`)**: Aligned `A` to a discrete uniform integer in `[ceil(K / 2), K]` via `nextInt(rng, Math.ceil(K / 2), K)`, matching `BLUEPRINT.md` section 3.
3. **Tuned Constants (`src/engine/rules.ts`)**:
   - `AIR_TABLE = [-42, -22, 0, 8]` (up from `[-32, -16, 0, 8]`) so unmitigated air neglect fails reliably in random play while `air = 2` holds steady.
   - `TIER_DOSE = { small: 12, medium: 40, big: 120 }` (up from `{ small: 12, medium: 30, big: 85 }`) so shelter vs. caught trade-offs differentiate small, medium, and big storms across clock strategies.
4. **Test Updates for Tuned Balance Constants**:
   - `src/engine/clock.test.ts` Test 6: updated expected caught `big` dose `85` -> `120`.
   - `src/engine/sim.test.ts` Tests 3, 4, 7, 8, 9: updated expected `air` (`-32`/`-16` -> `-42`/`-22`) and `health` (`120` big dose) values matching tuned constants.
   - `src/engine/saver.test.ts` Tests 1, 2, 4, 5, 6, 8: updated hand-computed air/health expectations and Test 8 plan (`seed=1` has `stormSol=5`, ensuring Sol 5 has `>=60` power and `>=8` science from non-storm sols).

## 2026-11-14 — P5 Real NASA Data

1. **DONKI Host & 60-Day Chunking Limit**:
   - `https://api.nasa.gov/DONKI/FLR` now returns HTTP 404 (`"path":"/DONKI-API/get/FLR/"`) following the 2026-09-30 CCMC migration.
   - `scripts/fetch-donki.ts`, `api/donki.ts`, and `src/data/loadStorms.ts` use `https://ccmc.gsfc.nasa.gov/DONKI-API/get/{FLR|SEP}`.
   - Because CCMC enforces a maximum 60-day range per request (`HTTP 400`), `fetch-donki.ts` queries in 55-day chunks and `loadStorms.ts` queries a 55-day live window (`LIVE_WINDOW_DAYS = 55`) instead of 90 days.
2. **Tier Refinement (`src/data/donkiLink.ts`)**:
   - Particle storms (`0.25 <= gapHours <= 48`): `X` -> `'big'`, `M` -> `'medium'`, lower -> `'small'`.
   - False alarms (no linked SEP): `X` -> `'medium'`, else `'small'` (refines the old flare-only rule because dose only applies when particles arrive).
3. **NASA Facts (`src/data/facts.json`)**:
   - Selected 6 verified NASA facts (Curiosity RAD surface `0.64 mSv/day` & cruise `1.84 mSv/day`, Moon `~1.3s` & Mars `3–22 min` radio delay, Mars `~43%` sunlight, shelter particles vs. cosmic rays). Omitted optional OSDR item as unneeded alongside verified RAD facts. *(The surface figure and two source URLs were corrected in P11 — see P11 item 6.)*

## 2026-11-14 — P6–P8 UI, Storm Clock, Teaching & PWA

1. **Stepwise Engine API (`src/engine/sim.ts`, `src/engine/clock.ts`)**: Added `createMission`, `playSol`, `missionResult`, `clockStep`, and `warningSolFor`. Unified `runMission` to loop `playSol` so rules live in one place.
2. **Self-Hosted Fonts & Icons**: Bundled Atkinson Hyperlegible WOFF2 (`400`, `700`) under `/public/fonts/`, drew one 9-icon SVG sprite (`IconSprite.tsx`), and generated local PNG/SVG PWA manifest icons without outside assets or NASA branding.
3. **Offline PWA & Bundle Budget**: Configured `vite-plugin-pwa` (`generateSW`) precaching shell, fonts, icons, and statically bundled `gameStorms.json` (total `dist` size ~770 KB <= 1.5 MB). Live API failure falls back to `SAVED`.

## 2026-11-14 — P11 Pre-Release Fixes

1. **Star reachability was impossible on Mars** (`src/engine/rules.ts`):
   - Diagnosis: with `SUNLIGHT_MARS = 18`, a Mars crew had roughly 14 usable bolts across 7 sols, and air alone cost about 10. No plan could buy enough lab bolts, so **2 stars were unreachable on every Mars storm** — the search reported a maximum of 1 star on all Mars rows.
   - Fix: `SUNLIGHT_MARS` `18 → 24`. This is the smallest single-value change that makes two stars reachable. `25` was rejected because it pushes Mars Commander "sensible" from 66.6% to 73.1% and breaks the P4 target of 50–70%.
   - The P4 balance was re-run after the change and every target still passes.

2. **Two-star science goal is now per site** (`src/engine/rules.ts`, `src/engine/sim.ts`):
   - Added `STAR_SCIENCE_THRESHOLD_MARS = 3` alongside `STAR_SCIENCE_THRESHOLD_MOON = 8`, plus one helper `starScienceGoal(site)`.
   - `calculateStars(survived, science, health, site)` now takes the site and asks `starScienceGoal(site)`; `sim.ts` passes `state.cfg.site`.
   - Reason: at `SUNLIGHT_MARS = 24` a Mars crew can reach at most about 3–4 science on the big storms, so an 8-science goal would still leave two stars unreachable there. The Moon goal stays at 8.
   - Every place the goal appears now reads the site-specific value: sol screen, briefing, glossary ("Two stars" / "Three stars"), teacher page, and debrief. The copy helpers `twoStarScienceGoal` / `starGoalLines` / `starGoalLine` live in `src/ui/copy.ts`, so the UI never computes game math.

3. **Two real storms added** (`src/data/gameStorms.json`):
   - Added `2024-02-06T02:37:00-FLR-001` (M4.2, peak 03:12Z, particles 05:25Z, gap 2.22 h, medium) and `2025-11-11T09:49:00-FLR-001` (X5.1, peak 10:04Z, particles 10:20Z, gap 0.27 h, big). Both are present in the saved DONKI snapshot `data/storms.json` (`fetchedAt` 2026-11-14T14:51:55.048Z).
   - The game set is now **8 storms**: 6 particle storms and 2 false alarms. The M4.2 storm is what makes the demo work — 2 Storm Clock blocks on the Moon, 1 fewer block on Mars because the radio warning is 20 minutes late.

4. **Short saver and compare sentences** (`src/engine/saver.ts`, `src/engine/compare.ts`):
   - Saver text is now two short sentences: `Try 1 less/more {air|shield|science} bolt on sol {n}.` then the benefit sentence (`The air would have lasted.` / `The crew would have stayed safe.` / `You would have earned {n} stars.` / `You would have earned more science.`). Two edits read `Try {edit1}. Then {edit2}.` plus the benefit sentence.
   - Compare text: `On {site} the warning came {n} minutes late.` then `You got {m} fewer work blocks.` The other three cases stay `Earth's message was old news on Mars.`, `{site} gets less sunlight, so power ran lower.`, `Both worlds felt much the same this time.`
   - The old templates were longer than 12 words. They are replaced, not softened.

5. **Changed test values (deliberate, listed as AGENTS.md requires)**:
   - `src/data/loadStorms.test.ts` — 3 assertions changed from `expect(res.storms).toHaveLength(6)` to `expect(res.storms).toHaveLength(gameStorms.storms.length)` (now 8), because the saved game storm set grew from 6 to 8 storms. The live-proxy test already used `gameStorms.storms.length + 1` and was not touched.
   - `src/engine/saver.test.ts` and `src/engine/compare.test.ts` — **no existing assertion was changed**. Only the comment in compare Test 9 and the title of saver Test 6 were reworded to match the new templates; both still assert with `toContain(...)`.
   - New tests added (not edits of old ones): saver Test 9 and compare Test 4 (300 seeded runs, every sentence 12 words or fewer), and `src/engine/sim.test.ts` Test 10 ("uses a lower science goal for two stars on Mars").

6. **`src/data/facts.json` rewritten against re-fetched NASA pages**:
   - `curiosity-rad-mars`: `0.64 mSv/day` → **`0.7 mSv/day`**. The RAD PDF reads "were 1.84 mSv/day in transit and 0.7 mSv/day on the Mars surface". `0.64` does not appear on the page.
   - `moon-radio-delay`: URL repointed from the NASA Science "Solar Storms and Flares" page (which does not contain 1.3 s) to the NASA Science *Human Spaceflight Hazards* white paper PDF, page 2: "At the Moon, the signal latency is about 1.3 seconds, one-way".
   - `mars-radio-delay`: reworded to "Radio signals to Mars take up to 22 minutes one way." because the ASCEND PDF supports "maximum one-way communication delay is about 22 minutes".
   - `mars-radio-delay-close`: **new fact** "Mars radio delay is about 3 minutes at closest approach." from the same white paper ("just over three minutes").
   - `shield-particles-vs-cosmic`: URL repointed from the NASA Science blog page to the RAD Book Chapter PDF, which carries both "storm shelters" and the statement that shielding "allows many GCR to penetrate".
   - The set is now 7 facts. Every number was checked against the literal page text; nothing was kept on trust.

7. **Tooling added for the audit** (`scripts/`):
   - `scripts/plan-builders.ts` — plan builders extracted from `scripts/balance-bot.ts` so the balance bot and the star search share one implementation. `balance-bot.ts` now only runs when invoked directly.
   - `scripts/star-plan-utils.ts` — the plan helpers used by the search: budget-valid plan checks, bolt moves, change counting, the repaired sensible baseline, and random budget-safe plans.
   - `scripts/star-search.ts` — random search (200,000 plans per row over 60 seeds) plus beam hill climbing, and a near-sensible search that measures how far a winning plan is from a repaired sensible baseline.
   - `scripts/star-reach.ts` — prints the reachability table and re-runs every printed plan to prove it reproduces the reported stars and science. The summary lines now use the actual storm count instead of a hardcoded `/6`.
   - `scripts/print-storm-table.ts` — prints the game storms straight from `data/storms.json` and re-computes every gap from the timestamps.
   - `scripts/check-facts.ts` + `scripts/fact-quotes.ts` — fetch every fact URL live, compare the SHA-256 of the served file against the copy the recorded quote was read from, and search the live text for the number.
   - `tests/demo.spec.ts` — plays the three demo moments end to end and prints the real on-screen copy.
   - `tests/screenshots.spec.ts` — captures every screen at 360x640 and 1280x800 into `screenshots/` (git-ignored).
   - New npm scripts: `npm run stars`, `npm run storms`, `npm run facts`, `npm run live`.

8. **Live path verified against real DONKI** (`scripts/check-live-donki.ts`):
   - `npm run live` calls the actual Vercel proxy in `api/donki.ts` against the live CCMC DONKI API and prints the badge the browser would show. On 2026-11-14: `FLR -> HTTP 200, 24 events`, `SEP -> HTTP 200, 0 events`, 24 linked storms (all false alarms, because no SEP fell in the 55-day window), badge `LIVE 2026-11-11`.
   - This also confirmed the P5 finding that CCMC rejects windows longer than 60 days with HTTP 400 (a 365-day request fails), so the 55-day live window stays.
   - **Why a local run shows `SAVED`:** `npm run dev` and `npm run preview` serve only the static SPA, so `/api/donki` returns the SPA `index.html`, the JSON parse fails, and `loadStorms` falls back to the saved snapshot. That is the offline fallback working, not a DONKI outage. The `LIVE` badge only appears on the deployed Vercel URL.

9. **Files split to stay under 250 lines** (`AGENTS.md` rule 7):
   - `scripts/star-search.ts` was 368 lines. The plan helpers moved to `scripts/star-plan-utils.ts`; the search now owns only the three search phases.
   - `tests/e2e.spec.ts` was 275 lines. The shared assertions moved to `tests/helpers.ts`, and the Storm Clock, badge and offline tests moved to `tests/e2e-play.spec.ts`.
   - While moving the shared `playToDebrief` helper, a pre-existing typo was fixed: two branches used `await continue`, which is not valid TypeScript. They are plain `continue` now. No test expectation changed, and the full e2e suite still passes.

10. **Demo choice**:
   - Storm `2024-02-06T02:37:00-FLR-001` (M4.2), seed 24, Cadet. The storm lands on sol 4, particles arrive at Moon block 2, and the Mars radio delay is 20 minutes, so Mars shows one block fewer and the run ends on the two-worlds comparison.
   - `docs/SUBMISSION.md` §1 was rewritten to match the screens the demo actually shows, with the exact URLs and taps in §1b.

11. **Known inconsistency, flagged rather than hidden**:
   - The game gives Mars `24 / 42 = 57%` of the Moon's sunlight, while the cited NASA fact is about 43% of Earth's sunlight. The 24/42 ratio is a game balance number and is labelled as simplified in `docs/DATA_SOURCES.md`. No copy claims the 57% ratio is real.

12. **Sound toggle is now an icon-only speaker button** (`src/ui/components/TopBar.tsx`, `src/ui/components/IconSprite.tsx`, `src/ui/styles.css`):
   - The top-bar button dropped its `Sound` / `Muted` text and now shows only the speaker glyph: `icon-speaker` when sound is on, `icon-speaker-off` (speaker with an X) when muted.
   - Accessibility is unchanged: the button keeps `aria-label` (`Mute sound` / `Unmute sound`) and `aria-pressed`, so the state is still announced. Verified by `tests/sound-toggle.spec.ts`.
   - The glyphs were redrawn on the 24 px grid with 2 px round strokes: a speaker body plus two sound-wave arcs for on, and the body plus an X for off. The old shapes were a flat cone with three straight lines, which read as a grille rather than sound.
   - New `.icon-btn` rule keeps the target a square 48 x 48 with the 20 px glyph centred (measured: 48 x 48 button, 20 x 20 icon, 14 px gap on each side).
   - `BLUEPRINT.md` §7 now lists 11 icons in the sprite instead of 9.

13. **Documentation synchronized**:
   - `BLUEPRINT.md` §2 updated: sunlight `Moon 42, Mars 24`; air change `−42 / −22 / 0 / +8`; storm doses `12 / 40 / 120`; two-star goal `8+` on the Moon and `3+` on Mars; the storm set is eight storms. The §4/§5/§7 copy examples now match the shipped saver and compare templates.
   - `docs/DATA_SOURCES.md` rewritten with the exact supporting sentence for every fact, the saved storm table, and the SAVED-badge rule.
   - `docs/SUBMISSION.md` §1 rewritten to the verified demo script, with the exact URLs and taps in §1b.

## 2026-11-15 — Stage A Visual Review

1. Restored Orbi's translated Calm, Warning, and Storm labels beside its status light. The labels keep color from carrying meaning alone.
2. Raised compact meter, preset, and badge text to at least 18 px.
3. Kept the Apple touch icon linked to PNG. Safari does not reliably accept SVG touch icons.
4. Used the existing SVG favicon and PWA manifest icons for the new three-color ray design.
5. Stacked compact meter icons above labels at 360 px. Oromo meter words no longer collide.
6. Expanded the screenshot flow to capture picker, briefing, sol, clock, and debrief in both languages at both reference sizes.
7. Added a new fit assertion for Oromo meter labels. No existing expected value or assertion was changed.


## 2026-11-15 — L1 Language Support

1. **Catalogues**: `strings.en.json` is the source catalogue. `strings.om.json` currently mirrors English until human translation. Keep both key sets and placeholders aligned.
2. **Language state**: Persist the `en` or `om` choice under `stormwatch.language`. Detect the Oromo default when `navigator.language` starts with `om`.
3. **Translation logic**: Keep key lookup and parameter interpolation pure in `src/i18n/translate.ts`. React context stays in `src/i18n/index.ts`.
4. **Engine text metadata**: Engine results retain English sentences. Optional keys and params let the UI localize them without engine imports.
5. **Checks**: `i18n:check` compares key and placeholder sets. Matching English and Oromo values are counted as untranslated, not errors.


## 2026-11-15 — L2 Afaan Oromoo Draft

1. **Translation source**: Wrote the Oromo catalogue in Qubee without a translation service. Keep the English catalogue and its tests unchanged.
2. **Fallbacks**: Product names, NASA source labels, and the existing English `common.back` test value remain English. Empty or missing Oromo values still fall back to English.
3. **Mobile labels**: Oromo meter words stay whole at narrow widths. Orbi status remains visual through its light and face.
4. **Review status**: The translated copy is a draft. A fluent Afaan Oromoo speaker must review it before release.

## 2026-11-15 — Stages B–D

1. **Goals**: Thresholds remain the requested values. A 100,000-plan seeded search found `safeHands` reachable in 26/32 offered combinations (81.3%); every other goal reached 30/32 or more. No threshold relaxation was needed.
2. **Daily missions**: The local calendar day selects the saved storm, site, and deterministic seed. The challenge stores no class accounts or names.
3. **Forecast teaching**: The game checks the saved flare-to-SEP link. False-alarm copy is explicitly a game note because the facts catalogue does not establish a universal false-alarm rate.
4. **Classroom mode**: Enabling it mutes sound and disables vibration. Both preferences persist locally. The teacher print view isolates the lesson and class results to one page.
5. **3D view**: Three.js and its type declarations are the only added packages. The 2D SVG remains the loading, reduced-motion, low-power, unavailable-WebGL, URL, and context-loss fallback. The 3D planet texture is drawn locally and is not NASA imagery.
6. **Existing tests**: Existing expected values and assertions were not changed. Test helpers now choose “Not sure” before ending a day when the new prediction prompt appears. Screenshot coverage adds the collection and daily briefing. Playwright’s shared saved preference keeps the established suite on 2D; Stage D tests turn 3D on explicitly.
7. **Performance**: Production output keeps Three.js in a separate lazy chunk. The initial gzip bundle increased by about 1 KB; total precache output remained below 1 MB.
8. **Visual coverage**: A Playwright screenshot matrix compares 2D and 3D for both sites, all three clock outcomes, and debrief at phone and desktop sizes. Representative pairs were inspected after correcting terrain orientation and impact visibility.


## Stage E

- Shared settings live in the gear sheet; language stays in the compact header.
- Kept the existing common.back fallback unchanged for its unit test; the visible header uses common.backButton.
- On short sol screens, hide secondary goal/preset text and scroll the control cards; pin the day action.
- Collection cards use two columns at all widths. Locked cards reveal only the date and lock.

- Stage E game desk: picker keeps launch visible and scrolls mission choices inside the play frame, not the page.


- Picker fit correction: use one five-row game frame at every viewport height; keep only mission options scrollable. Desktop picker uses non-overlapping assigned rows and columns.


- Responsive layout pass: use fluid padding and type, a wider tablet frame, and a two-column picker at tablet width; retain scroll only in choice panels.


- Tablet-width picker stays single-column below 1024px; the earlier tablet split made world labels unreadable.


- Procedural scene atmosphere: seeded star layers drift and twinkle; a canvas nebula, pulsing corona, point light, and flare animate with slowly rotating Earth and orbiting moonlet. The scene uses no external image assets.


- Sol interaction: keep the scene outside the scrolling bolt controls so shield changes are visible immediately.


- Local Vite server on port 3000 was already occupied and inaccessible from this environment; latest edits are served on port 3001.

- Landscape-first play: landscape phone layout keeps scene left and controls right; storm actions are side by side. Portrait phones show a translated rotation hint while remaining usable.
- Responsive overrides now load last, after screen styles.
- Sol keeps scene, meters, Orbi, and End day visible. Only controls scroll.
- Button labels wrap at spaces to prevent broken words.
- Test UI opens Settings before sound and Simple 2D controls.
- The portrait rotation hint stays in normal flow; it never covers a game control.
- Browser screenshot coverage includes 640 x 360 landscape, 360 x 640 phone, and 1280 x 800 desktop.
- Collection returns from the shared header, so the back action stays reachable.
- Repaired incomplete responsive CSS rules and limited desktop columns to 1024 px and wider. This restored the short-landscape picker and prevented layout overrides on phones.
- Existing selector names and engine assertions were not changed. Test flows now open Settings and close it before the next screen; landscape checks use `end-day`, `work-block`, and `shelter-now` bounds.
- Verified 67 unit tests, the production build, all 35 browser tests, translation key parity, mobile/desktop/landscape overflow, and zero serious or critical axe findings in covered flows.
- Browser screenshot output was generated for English and Afaan Oromoo at 360 x 640, 640 x 360, and 1280 x 800. The native browser bridge remained unavailable, so review used Playwright captures.

## 2026-11-15 — Landscape cockpit and scene direction

- Phone landscape uses the viewport height, not desktop width, to select its compact cockpit. The player sees meters, the live scene, three bolt steppers, and End day at 800 x 360 without page scrolling.
- Compact cockpit removes only duplicate goal and preset copy. Engine-backed bolt controls and 48 px touch targets remain visible.
- The scene remains procedural and code-drawn. It uses no external art or invented NASA measurements.
- Scene work is staged: responsive play first; then terrain, shelter, astronaut, light, stars, and solar-particle visuals; then outcome feedback. Any future radiation or thermal mechanic must be added to the pure engine with tests before the UI describes it.
- The astronaut is a visual crew representative. The existing engine outcome controls its protected, sheltered, or caught presentation; it does not add a new loss rule.
