# NASA Space Apps 2026 — Submission Form (copy and paste)

Every claim below is verified against the repository. NASA link check: all five
returned HTTP 200 on 2026-11-15. Project link: `https://storm-watch-tau.vercel.app/`
returned HTTP 200. Source: `https://github.com/lenchobel/storm-watch` returned HTTP 200.

> **You must fill in one thing yourself:** the **Team Name** (the form's first
> section). It is `[Team Name]` everywhere in the demo script and is the only
> value in this pack that is not verifiable from the code.

---

## 1. Project Name

```
Storm Watch
```

## 2. Project Summary

Field limit 1500 characters. This is 161 words / about 1,040 characters.

```
Storm Watch is an offline-capable web game for ages 7-12 where a child commands a Moon or Mars outpost for seven sols while real NASA solar storm data decides when danger arrives. Children read radiation facts in textbooks but rarely practice the trade-offs astronauts face when power is short and forecasts can be wrong. The game turns NASA CCMC DONKI flare and particle-event logs into three signature mechanics: the Storm Clock, where a real flare-to-particle gap sets a 1-4 block countdown and each block trades science against safety; Same Storm, Two Worlds, where the identical storm and seed is replayed on the Moon and then on Mars to show how lower sunlight and a 3-22 minute radio delay change the outcome; and What Would Have Saved You, where the engine replays single and paired edits to prove the smallest change that saves the crew. Every number shown carries its NASA source or is labelled a simplification, and the whole app works offline.
```

## 3. Project Links — already filled, leave as is

| Field | Value |
|---|---|
| Project Demonstration | `https://canva.link/bkmgiwupiztb6pj` |
| Project | `https://storm-watch-tau.vercel.app/` |

Check the demo link opens in a private window with no login before you submit.

## 4. Project Details

```
Storm Watch is a free, offline-capable web game for ages 7-12. The player is the shift commander of a Moon or Mars outpost for seven sols.

WHAT IT DOES AND HOW IT WORKS. Each sol the player spends limited power on three systems - Air, Radiation Shield, and Science Lab - using preset plans in Cadet mode (ages 7-9) or direct steppers in Commander mode (ages 10-12). Every bolt costs 15 power and no option is free: each one spends power, air, crew health, or science.

The storm is real. The game fetches NASA CCMC DONKI flare (FLR) and solar energetic particle (SEP) events and links them to the real flare-to-particle gap. That gap becomes the Storm Clock: a 1-4 block countdown in which the player chooses Work (+1 science, still outside) or Shelter (safe inside). The arrival block is uncertain by design, and on Mars the warning arrives 3-22 minutes late because of the real one-way radio delay. A flare with no linked particle event becomes a false alarm: no dose, but every shelter block still costs the science it could have earned.

Three features make it ours. First, the Storm Clock turns short, uncertain warnings into a real decision. Second, Same Storm, Two Worlds replays the identical storm and the identical seed on the Moon and then on Mars, so the player sees lower sunlight (24 vs 42 power), a dust sol, and radio delay change the outcome. Third, What Would Have Saved You replays the run through the engine, tries every single edit and then every pair, and proves the smallest change that saves the crew, so the feedback never blames the player.

WHY IT IS IMPORTANT. Children read radiation facts but rarely practice the trade-offs astronauts face when power is short and a forecast can be wrong. Storm Watch turns those trade-offs into ten minutes of play, and it refuses to fake its data: every fact on screen carries its NASA source and the exact supporting sentence, and every game abstraction (bolt costs, health points, dose numbers, forecast error bounds) is labelled a simplification on the data page.

INTENDED IMPACT. A teacher opens one link on any phone, runs it with no internet, and uses the printable lesson plan and the storm collection for daily classroom practice. There are no accounts, no tracking, and no student data leaves the device. The app is bilingual, in English and Afaan Oromoo.

TOOLS. React 19, TypeScript, Vite, Vitest, Playwright, axe-core, Three.js, and vite-plugin-pwa. The game engine is pure TypeScript with a seeded mulberry32 random generator, so the same seed always produces the same run. 67 unit tests cover the rules, the Storm Clock, the save-replay search, and the length of every child-facing sentence. The outpost scene, the icon set, and all five sound cues are drawn in code or synthesized with the Web Audio API. There are no stock images, no music, and no NASA logos or insignia.

CREATIVITY. Rather than simulating space weather, we let real NASA records be the game clock. The gap between a flare and its particle event is short and uncertain, which is exactly the shape of the decision real crews face, so the data sets the difficulty instead of decorating it.

FACTORS WE CONSIDERED. Honesty was the main constraint. We removed any fact we could not find on a NASA page, we show LIVE and SAVED badges that are always truthful, and we never label saved data as live. We also kept the game offline-first for classrooms with poor connectivity, made every touch target at least 48 px, kept every sentence a child reads to 12 words or fewer, and verified that axe-core reports zero serious accessibility issues.
```

## 5. Use of Super Intelligence (SI)

**Tick exactly one box: `Code and data`.**

Do **not** tick images and videos, do **not** tick audio, and do **not** tick
"I did not use SI". No image, video, or audio in this project was
AI-generated, so those watermarks do not apply.

If the form asks for a short description in the same box, use this:

```
SI tools were used for code and data only. AI coding assistants (Google DeepMind Gemini models, an AI coding assistant in Google AI Studio, OpenAI Codex, and the Mavis agent runtime) helped author and refactor the TypeScript game engine, the React interface, the automated tests, the data-fetching scripts, and the documentation. No AI-generated images, video, music, or other media were used in the application or the demo, so no SI watermark is required on any asset. Every game rule was verified by unit tests, every NASA figure was re-checked against its source page, and the exact supporting sentence for each fact is recorded in docs/DATA_SOURCES.md in the public repository.
```

Full detail is in `docs/AI_USE.md` in the repository.

## 6. NASA Data

Add these five rows. Every link returned HTTP 200 when checked on 2026-11-15.

| Link Text | Link Url |
|---|---|
| NASA CCMC DONKI API - Solar Flares (FLR) | `https://ccmc.gsfc.nasa.gov/DONKI-API/get/FLR?startDate=2024-02-06&endDate=2024-02-07` |
| NASA CCMC DONKI API - Solar Energetic Particles (SEP) | `https://ccmc.gsfc.nasa.gov/DONKI-API/get/SEP?startDate=2024-02-06&endDate=2024-02-07` |
| NASA NTRS - Space Radiation Book Chapter (Curiosity RAD 0.7 mSv/day, storm shelters vs. galactic cosmic rays) | `https://ntrs.nasa.gov/api/citations/20250004252/downloads/Book%20Chapter.pdf` |
| NASA Science - Human Spaceflight Hazards (Moon 1.3 s and Mars 3 min radio delay) | `https://science.nasa.gov/wp-content/uploads/2023/05/188_fed0ad8278e728107533d509b24dc68b_SmithsimmonsDrew.pdf` |
| NASA NTRS - ASCEND Crewed Mars Mission Communications (22 min maximum delay) | `https://ntrs.nasa.gov/api/citations/20220013418/downloads/ASCEND-Communication%20Delays%2C%20Disruptions%2C%20and%20Blackouts%20for%20Crewed%20Mars%20Missions.pdf` |
| NASA NSSDC - Mars Fact Sheet (Mars gets about 43 percent of Earth sunlight) | `https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html` |

The first two links open the exact NASA records behind the demo storm
(flare `2024-02-06T02:37:00-FLR-001`, M4.2, and its linked particle event
`2024-02-06T05:25:00-SEP-001`). The 2.22-hour gap between them is what drives
the Storm Clock in the demo.

## 7. Space Agency Partner & Other Data

Add these rows. All are publicly accessible.

| Link Text | Link Url |
|---|---|
| Storm Watch - full source code, documentation, and NASA data records (MIT) | `https://github.com/lenchobel/storm-watch` |
| Three.js - 3D outpost scene (MIT) | `https://github.com/mrdoob/three.js` |
| React and React DOM - user interface (MIT) | `https://github.com/facebook/react` |
| Vite - build tool and dev server (MIT) | `https://github.com/vitejs/vite` |
| TypeScript - programming language (Apache-2.0) | `https://github.com/microsoft/TypeScript` |
| Vitest - unit test runner (MIT) | `https://github.com/vitest-dev/vitest` |
| Playwright - end-to-end browser tests (Apache-2.0) | `https://github.com/microsoft/playwright` |
| axe-core - accessibility testing (MPL-2.0) | `https://github.com/dequelabs/axe-core` |
| vite-plugin-pwa - offline precaching and web app manifest (MIT) | `https://github.com/vite-pwa/vite-plugin-pwa` |
| Atkinson Hyperlegible - self-hosted font, SIL Open Font License 1.1 | `https://fonts.google.com/specimen/Atkinson+Hyperlegible` |

`tsx` (MIT) and `@vitejs/plugin-react` (MIT) are also used:
`https://github.com/privatenumber/tsx` and
`https://github.com/vitejs/vite-plugin-react`.

All artwork, icons, the outpost scene, and all five sound cues were written
for this project. There is no stock art, no music, and no NASA imagery.

---

## Before you press Submit for Judging

- [ ] Replace `[Team Name]` in the demo deck and in the app title if it is still a placeholder.
- [ ] Open the demo link and the project link in a private window. Both must load with no login.
- [ ] Tick `Code and data` under SI use.
- [ ] Save Progress, then Submit for Judging. Saving is not submitting.
