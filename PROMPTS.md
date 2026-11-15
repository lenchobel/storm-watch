# Phase prompts (paste ONE per conversation, in order. Start a new conversation for each phase.)
Mode: use Planning mode for every phase. Read the implementation plan the agent shows you and approve it only if it matches the BLUEPRINT. Use the strongest Gemini Pro option for P1-P5 and P9. Flash is fine for small fixes if you hit rate limits. Commit with git after each phase.

## P0. Check the setup (no code)
PHASE P0. Read AGENTS.md and BLUEPRINT.md. List the rules in AGENTS.md and the skills you found in .agent/skills. Say which BLUEPRINT sections cover the game rules, the design, and the data plan. Do not write code.

## P1. Engine core
PHASE P1. Read BLUEPRINT sections 4.2 and 4.2b and the storm-engine skill.
Scaffold Vite + React + TypeScript + Vitest (no extra libraries).
Create src/engine/rng.ts (mulberry32), rules.ts (all constants), types.ts, sim.ts.
Types: Site = moon | mars. Tier = small | medium | big.
Storm = { id, source: live | saved, flareClass, flarePeak, sepStart?, gapHours?, tier }.
Plan = { sols: Array<{ air:0-3, shield:0-3, lab:0-3, clock?: Array<work | shelter> }>, cards: number[] }.
Result = { survived, stars, air, health, science, log: string[] }.
Export runMission(cfg: { site, storm, seed, difficulty }, plan): Result.
Implement the sol rules in 4.2 (bolt cost 15, power cap 100, air table, sunlight, dust sol, cosmic baseline). Use a simple stub for the storm: tier dose x shield factor. The Storm Clock comes in P2.
Tests: bolts capped by power; battery caps at 100; air table values; shield helps storms but barely changes cosmic baseline; storm sol is 3 to 6; same seed gives the same result.
Done when npm test passes. Paste the output.

## P2. Storm Clock
PHASE P2. Implement the Storm Clock exactly as BLUEPRINT 4.2b rule 1, inside src/engine/clock.ts, and call it from sim.ts on the storm sol.
Functions: clockBlocks(gapHours, delayHours) -> { K, oldMessage }; arrivalBlock(rng, K); resolveClock(...).
Tests: K is clamped 1 to 4; arrival block is between 1 and K; Mars delay can make the forecast old; no SEP means no storm dose; sheltered gives tier x shield factor; caught outside gives full dose; every Shelter block in a false alarm loses 1 science; results are deterministic for a seed.
Done when npm test passes. Paste the output.

## P3. The saver and the two worlds
PHASE P3. In src/engine/saver.ts implement findSaver(cfg, plan, result) as BLUEPRINT 4.2b rule 3: all single edits, then all pairs (one sol, one category, plus or minus one bolt; one Storm Clock move earlier or later). Choose the smallest edit that turns a failure into survival, else adds a star. Tie-break: fewest bolts moved, then earliest sol. Return { edits, text } with the child-friendly sentence.
In src/engine/compare.ts implement compareWorlds(resultA, resultB) returning the table rows and one sentence that names the biggest difference.
Tests: re-run the engine with the saver edit and prove the promised improvement; return null when nothing helps; the sentence mentions real numbers from the run.
Done when npm test passes. Paste the output.

## P4. Balance bot
PHASE P4. Write scripts/balance-bot.mjs. Play 5,000 seeded runs per site and difficulty with: random play, a sensible strategy, an all-science strategy, and three Storm Clock strategies (shelter first block, wait until the last block, wait until the block before last).
Targets: Moon Cadet sensible win rate at least 90%, random 25 to 50%; Mars Commander sensible 50 to 70%; all-science loses on both.
Print proof that: (a) shelter-first loses science in false alarms; (b) wait-last is caught outside in at least 15% of particle storms; (c) no single clock strategy is best in every storm tier.
Adjust rules.ts until targets are met. Never edit tests or targets. Print the final table and paste it.

## P5. Real data
PHASE P5. Use the nasa-data skill. Write scripts/fetch-donki.mjs (NASA_API_KEY from env, DEMO_KEY fallback with backoff). Fetch FLR and SEP for the last 3 years plus May 2024 and October 2024. Link flares to SEP with linkedEvents, compute gapHours, assign tiers per BLUEPRINT 4.2. Save data/storms.json with fetchedAt. Pick 6 storms: 3 particle storms of different sizes, 1 medium, 2 false alarms.
Build api/donki.ts as a serverless proxy with 1-hour cache and 8-second timeout. Add src/data/loadStorms.ts: live first, then saved, with a LIVE or SAVED (date) badge value.
Build src/data/facts.json: each fact with source URL and dateChecked. Verify radio delay and Mars sunlight on NASA pages; leave them out if not verified. Add the Curiosity radiation figures with their source.
Done when the script runs and tests for loadStorms (live ok, live fails, timeout) pass. Paste the output.

## P6. UI shell and look
PHASE P6. Use the svg-scene-design and kid-ui-writing skills. Build BLUEPRINT 4.4 exactly: CSS variables, self-hosted Atkinson Hyperlegible, the 9-icon SVG sprite, the Scene component (recipe), the top HUD with three meters, Orbi, the Sol screen with the three control cards, Cadet presets (Safe, Balanced, Science, Custom) and the Briefing screen. The UI calls the engine and never computes game math.
Add Playwright tests: no sideways scroll at 360 px; every button is at least 48 px; axe has zero serious issues.
Then run npm run dev and open it in the browser tool at 360x640 and 1280x800. Screenshot every screen. List each difference from BLUEPRINT 4.4 and fix them. Repeat until there are no differences.
Done when tests pass and the screenshots match. Also list 8 things I should check by eye on my phone.

## P7. Storm Clock screen, debrief, two worlds
PHASE P7. Build the Storm Clock screen (ring with K segments, two big buttons, 600 ms steps, flare pulse, wave sweep, static version for reduced motion), the Storm result, the Debrief with the saver sentence and a Did-you-know card with its source, and the Two-worlds comparison card with the Fly this exact storm on the other world button. Show the LIVE or SAVED badge on the Briefing and the Debrief.
Add a Playwright test that plays one full mission with a fixed seed from start to debrief and checks that the saver sentence appears.
Use the browser tool to play one full mission on the Moon and one on Mars, screenshotting the Storm Clock, the result, the debrief and the comparison. Fix anything that does not match BLUEPRINT 4.4.
Done when tests pass and the screenshots match. List what I should check by eye.

## P8. Teaching, data pages, offline
PHASE P8. Add: Where does this come from? page; What is simplified page (must state that the forecast error range is a game choice); Glossary; Teacher mode with a one-page printable lesson plan and seed list; About page with an honest AI-use statement; a 3-question check on the main idea (shields help against solar storms, not much against cosmic rays). Make it work offline after first load (PWA). Keep first load under 1.5 MB.
Done when Lighthouse accessibility is 95 or higher and offline mode works in a Playwright test. Paste the results.

## P9. Audit and fix
PHASE P9. Run /verify and /audit (workflows in .agent/workflows). Fix every high defect. Write README.md, docs/DATA_SOURCES.md, docs/AI_USE.md and docs/CREDITS.md from what the repo really contains. Deploy to Vercel and test the public link in a private window.
Report what you could not check.

## P10. Words for the demo and the form
PHASE P10. From the real repo only, draft: the 30-second video script with timings and English subtitles (BLUEPRINT section 10), every field of the project form, and a checklist of links to test. Use only claims the repo proves. Keep the AI disclosure accurate.
