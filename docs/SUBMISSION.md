# Storm Watch — NASA Space Apps 2026 Submission Pack

All claims below are verified directly against the repository codebase (`src/engine/`, `src/data/`, `src/ui/`, `api/`).

---

## 1. 30-Second Demo Video Script (< 70 spoken words)

**Constraints:** No children on camera. No children's names or voices. No NASA logos. English subtitles required.

**Demo storm (real NASA DONKI data):** `2024-02-06T02:37:00-FLR-001` — flare **M4.2**, flare peak `2024-02-06T03:12Z`, particle onset `2024-02-06T05:25Z`, gap **2.22 h**. Seed `24`, Cadet. These are the exact URLs and taps from §1b; every line below was played and verified in Playwright.

| Time | Visual / Action | Spoken Line & Subtitles | On-Screen Text (actual app copy) |
|---|---|---|---|
| `0:00–0:03` | Title screen: Orbi + mission picker | `[Team Name] presents Storm Watch. The real Sun sets the clock.` (11 words) | **Storm Watch** · `[Team Name]` |
| `0:03–0:07` | Moon outpost, meters, `SAVED 2026-11-14` badge | `Real NASA flares decide when particles reach you.` (8 words) | **SAVED 2026-11-14** |
| `0:07–0:13` | Sol 4 warning line, then the Storm Clock ring opens | `Earth says particles in about 2.2 hours. Forecasts can be wrong.` (11 words) | *Earth says particles in about 2.2 hours. Forecasts can be wrong.* |
| `0:13–0:18` | Tap **Work one more block** twice, wave sweeps, caught outside | `We worked too long. The shield only protects the shelter.` (10 words) | *The shield only protects the shelter. Next time, go in sooner.* |
| `0:18–0:22` | Same storm, same seed, tap **Shelter now** | `Same storm, same seed. This time we shelter in time.` (10 words) | *The shelter held.* |
| `0:22–0:27` | Tap **Fly this exact storm on Mars**; Mars clock shows one block | `On Mars the warning came 20 minutes late.` (8 words) | *Earth says particles in about 1.9 hours.* · *On Mars the warning came 20 minutes late. You got 1 fewer work blocks.* |
| `0:27–0:30` | Two-worlds comparison table + play link card | `One fewer work block. Two worlds, one real storm.` (9 words) | **Stars 1/1 · Air 100/78 · Health 63/51 · Science 0/0 · Warning 2.2h/1.9h** |

**Total spoken word count:** `11 + 8 + 11 + 10 + 10 + 8 + 9 = 67 words` (under 70 words). Every spoken sentence is 12 words or fewer.

### 1b. Exact demo URLs and taps (verified with Playwright)

All three moments use the same real storm and the same seed, so the video shows one continuous storm on two worlds.

**A. Moon run — the player works too long and is caught outside**

```
http://localhost:4173/?seed=24&storm=2024-02-06T02:37:00-FLR-001&site=moon&difficulty=cadet
```

Taps: **End the day** ×3 → (sol 4 warning) **End the day** → **Work one more block** → **Work one more block** → **Continue** → **End the day** ×3.
Result: caught outside at block 2, `The shield only protects the shelter. Next time, go in sooner.`, 1 star, debrief `This one was very hard. Try the Safe plan.`

**B. Same storm, same seed — the player shelters in time and survives**

```
http://localhost:4173/?seed=24&storm=2024-02-06T02:37:00-FLR-001&site=moon&difficulty=cadet
```

Taps: **End the day** ×3 → **End the day** → **Shelter now** → **Continue** → **End the day** ×3.
Result: `The shelter held.`, the crew survives, 1 star.

**C. The same storm on Mars — the warning arrives late, ends in the two-worlds comparison**

```
http://localhost:4173/?seed=24&storm=2024-02-06T02:37:00-FLR-001&site=mars&difficulty=cadet
```

Reach it from the Moon debrief with **Fly this exact storm on Mars** (same seed, same storm). Taps: **End the day** ×3 → **End the day** → **Shelter now** → **Continue** → **End the day** ×3.
Result: Mars warning reads `Earth says particles in about 1.9 hours.` (20 minutes later than the Moon's 2.2 h), the clock has **1** block instead of 2, and the run ends on the **Same Storm · Two Worlds** table: Stars `1 / 1`, Air `100 / 78`, Health `63 / 51`, Science `0 / 0`, Warning time `2.2h / 1.9h`, with the line `On Mars the warning came 20 minutes late. You got 1 fewer work blocks.`

> For the public video, replace `localhost:4173` with the deployed play URL. The query string is identical.

---

## 2. Alternative 7-Slide Outline

1. **Title**: Storm Watch — `[Team Name]` — *"The real Sun sets the clock."*
2. **Problem**: Children read space radiation facts but never practice high-stakes resource and storm-timing trade-offs.
3. **Real NASA Data**: Live/Saved NASA CCMC DONKI `FLR` & `SEP` events compute real flare-to-particle gaps, plus verified Curiosity MSL RAD and radio-delay facts.
4. **Signature 1 — The Storm Clock**: K-block countdown (`1–4` blocks) with forecast uncertainty (`[ceil(K/2), K]`) and Moon vs. Mars radio delay.
5. **Signature 2 — Same Storm, Two Worlds**: Fly an identical storm & seed on the Moon (`42` sun, `1.3s` delay) vs. Mars (`24` sun, dust storms, `3–22 min` delay).
6. **Signature 3 — What Would Have Saved You**: Deterministic replay searches 1- and 2-step edits and proves a non-blaming fix, teaching that shields block storm particles rather than steady cosmic rays.
7. **Classrooms & Offline Reach**: Self-contained `< 1 MB` offline PWA with printable Teacher Mode lesson plan and honest data/simplification guides (`[Play Link]` / `[GitHub Repo]`).

---

## 3. Space Apps Challenge Form Fields

### Project Name
Storm Watch

### High-Level Summary (1 paragraph)
Storm Watch is an offline-capable, mobile-first web game for ages 7–12 where kids command a Moon or Mars habitat across seven sols using real NASA solar storm data. Children read about radiation in textbooks, yet rarely make astronaut decisions under uncertainty; Storm Watch turns NASA CCMC DONKI flare and particle logs into three signature mechanics: the **Storm Clock** (short, uncertain particle arrival warnings), **Same Storm, Two Worlds** (comparing identical storms across Lunar sunlight vs. Martian low-sunlight and `3–22` minute radio delays), and **What Would Have Saved You** (replay search proving the smallest edit that saves the crew), teaching that habitat shields block solar storm particles while steady cosmic rays still pass through.

### Detailed Description
Each sol, players spend limited power bolts (`15` power each, capped at `floor(power / 15)`) across Air, Radiation Shielding, and Science Labs, using presets in Cadet (`7–9`, `0.7x` radiation) or direct steppers in Commander (`10–12`, `1.0x` radiation). On the hidden storm sol (sols `3–6`), the game links real NASA DONKI flare (`FLR`) and solar energetic particle (`SEP`) timestamps (`0.25–48` hour gaps, or unlinked false alarms) to build a `1–4` block Storm Clock. Each block forces a real cost: working outside adds `+1` science but risks full unshielded radiation if particles arrive early; sheltering early keeps the crew safe behind habitat shielding but forfeits science during false alarms. On Mars, reduced sunlight (`24` vs. `42`), a seeded dust storm (`30%` sunlight), and a `3–22` minute radio delay squeeze margins further. At debrief, `findSaver` replays single and paired edits through the deterministic `mulberry32` engine to verify an actionable hint, alongside Curiosity RAD facts and a 3-question check. Built with React, TypeScript, Vite, Vitest, Playwright, `axe-core`, and `vite-plugin-pwa`.

### NASA Data and How It Is Used
- **NASA CCMC DONKI API (`FLR` & `SEP`)** ([ccmc.gsfc.nasa.gov/DONKI-API/get](https://ccmc.gsfc.nasa.gov/DONKI-API/get)): Flare classes (`X/M/C`), peak times, SEP onset times, and `linkedEvents` determine whether a flare produced hazardous particles, compute `gapHours = sepStart - flarePeak`, assign tiers, and tag events `LIVE` or `SAVED`.
- **NASA NTRS — MSL Curiosity RAD** ([Book Chapter PDF](https://ntrs.nasa.gov/api/citations/20250004252/downloads/Book%20Chapter.pdf)): Surface (`0.7 mSv/day`) and Mars-transit cruise (`1.84 mSv/day`) radiation facts cited in `src/data/facts.json` and "Where does this come from?".
- **NASA Science — Human Spaceflight Hazards** ([white paper PDF](https://science.nasa.gov/wp-content/uploads/2023/05/188_fed0ad8278e728107533d509b24dc68b_SmithsimmonsDrew.pdf)): Basis for the Earth–Moon signal latency (`about 1.3 seconds one way`) and the Earth–Mars closest-approach latency (`about 3 minutes`).
- **NASA NTRS — Crewed Mars Mission Communications** ([ASCEND PDF](https://ntrs.nasa.gov/api/citations/20220013418/downloads/ASCEND-Communication%20Delays%2C%20Disruptions%2C%20and%20Blackouts%20for%20Crewed%20Mars%20Missions.pdf)): Basis for the Earth–Mars maximum one-way radio delay (`about 22 minutes`).
- **NASA Mars Fact Sheet** ([nssdc.gsfc.nasa.gov](https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html)): Mars receives ~43% of Earth sunlight.
- **NASA NTRS — Space Radiation Book Chapter** ([Book Chapter PDF](https://ntrs.nasa.gov/api/citations/20250004252/downloads/Book%20Chapter.pdf)): Storm shelters stop solar storm particles while cosmic rays penetrate.
*(Game mechanics such as bolts, air/health points, medical-free damage numbers, and clock error bounds are explicitly documented as simplifications on screen and in `docs/DATA_SOURCES.md`.)*

### Other Data and Resources
React (`MIT`), React DOM (`MIT`), Vite (`MIT`), TypeScript (`Apache-2.0`), Vitest (`MIT`), `@vitejs/plugin-react` (`MIT`), `tsx` (`MIT`), `@playwright/test` (`Apache-2.0`), `@axe-core/playwright` (`MPL-2.0`), `vite-plugin-pwa` (`MIT`), and self-hosted **Atkinson Hyperlegible** fonts (`SIL OFL 1.1`). All SVGs, icons, and WebAudio sounds were coded in-house.

### AI Use Disclosure
AI coding assistants helped author and refactor TypeScript engine logic, React UI components, tests, scripts, and documentation. Tools used: **Antigravity Assistant** (Google DeepMind Gemini models) for the engine, UI, PWA and demo-script phases; an **AI coding assistant in Google AI Studio** for the P4–P10 balance, NASA data, audit and submission phases; and **Mavis** (MiniMax agent runtime) for the repository setup, the P11 pre-release audit, NASA fact re-verification against the source pages, the star-reachability search (200,000 random plans per row plus hill climbing), the 300-seed sentence-length tests, and the demo-scene verification. Every calculation, test assertion, accessibility check, and NASA source citation was re-checked by running the engine and by fetching the cited pages; the exact supporting sentence for every fact is recorded in `docs/DATA_SOURCES.md`. No AI-generated images, photographs, video, or music are used anywhere in the application or demo; if any AI-generated media is added to slides/video later, add a visible `"AI-generated media"` watermark.

---

## 4. Six Key Differentiators (One Line Each)

1. **Physics-honest shielding**: Habitat shields stop solar storm particles well, while steady cosmic rays still chip at health daily.
2. **Particles decide danger, not light**: Real DONKI flares without linked SEPs become zero-dose false alarms that still tempt cautious sheltering.
3. **Real Storm Clock under delay**: Forecast uncertainty (`[ceil(K/2), K]`) and real Mars radio delays (`3–22 min`) force timed **Work vs. Shelter** trade-offs.
4. **Proven replay fixes**: Every sub-3-star run re-simulates edits to prove the smallest fix with real engine numbers.
5. **Same storm, two worlds**: Compare Moon vs. Mars across the identical seed and flare in a 5-row debrief table.
6. **Live NASA data drives play**: New DONKI flares/SEPs load with honest `LIVE` / `SAVED` badges and offline precached resilience.

---

## 5. Private-Window & Last-Hour Checklists

### Private-Window Link Checklist
- [ ] Play link opens in Incognito / Private window with zero console errors and zero login wall.
- [ ] Verify `/api/donki` live badge OR honest `SAVED 2026-11-14` fallback renders clearly.
- [ ] Play the three demo URLs from §1b end to end and confirm the tapped screens match the script.
- [ ] GitHub repository (`lenchobel/storm-watch`) opens cleanly in a Private window with `README.md` visible.
- [ ] Demo video (`<= 30s`, English subtitles) or deck (`<= 7 slides`) opens publicly in a Private window without login.

### Last-Hour Submission Checklist
- [ ] Freeze code branch after final green `npm test && npm run balance && npm run build && npm run e2e`.
- [ ] Record 30s screen capture with subtitles (zero children on camera/audio, zero NASA logos).
- [ ] Fill every Space Apps form field and double-check AI tool bracket placeholders (`[Team Name]`, `[AI tool names]`, `[Play URL]`).
- [ ] Submit before `11:59 pm` local event deadline and reopen submission page to confirm all links save cleanly.
