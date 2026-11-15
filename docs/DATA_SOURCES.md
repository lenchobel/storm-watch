# Data sources

This project uses real NASA data, saved with fetch dates and clearly labeled **LIVE** or **SAVED** in the interface. Nothing is invented or guessed.

## Real NASA sources used

Every fact in `src/data/facts.json` was re-fetched and checked against the page on
**2026-11-14**. The table below records the exact sentence on the page that
supports the number, so a reviewer can find it without trusting the game.

| Fact shown to the player | Source | Exact supporting sentence on the page | URL |
|---|---|---|---|
| Storm list, flare class, gap | NASA CCMC DONKI (`FLR`, `SEP`) | Live JSON: `classType`, `peakTime`, `eventTime`, `linkedEvents` → `gapHours = sepStart − flarePeak` | https://ccmc.gsfc.nasa.gov/DONKI-API/get |
| `Curiosity measured 0.7 mSv per day on Mars.` | NASA NTRS Space Radiation Book Chapter, p. 4 | "Measurements obtained by NASA's Mars Science Laboratory's Radiation Assessment Detector (MSL-RAD) on the Curiosity rover were 1.84 mSv/day in transit and 0.7 mSv/day on the Mars surface (Zeitlin et al., 2013)." | https://ntrs.nasa.gov/api/citations/20250004252/downloads/Book%20Chapter.pdf |
| `On the trip to Mars, Curiosity measured 1.84 mSv per day.` | NASA NTRS Space Radiation Book Chapter, p. 4 | "Measurements obtained by NASA's Mars Science Laboratory's Radiation Assessment Detector (MSL-RAD) on the Curiosity rover were 1.84 mSv/day in transit and 0.7 mSv/day on the Mars surface (Zeitlin et al., 2013)." | https://ntrs.nasa.gov/api/citations/20250004252/downloads/Book%20Chapter.pdf |
| `Radio signals reach the Moon in about 1.3 seconds.` | NASA Science Human Spaceflight Hazards white paper, p. 2 | "At the Moon, the signal latency is about 1.3 seconds, one-way." | https://science.nasa.gov/wp-content/uploads/2023/05/188_fed0ad8278e728107533d509b24dc68b_SmithsimmonsDrew.pdf |
| `Mars radio delay is about 3 minutes at closest approach.` | NASA Science Human Spaceflight Hazards white paper, p. 2 | "On the surface, delay would be just over three minutes, one-way, when Earth and Mars are at their closest and over 20 minutes when the planets are furthest apart." | https://science.nasa.gov/wp-content/uploads/2023/05/188_fed0ad8278e728107533d509b24dc68b_SmithsimmonsDrew.pdf |
| `Radio signals to Mars take up to 22 minutes one way.` | NASA NTRS ASCEND Mars Comms, p. 10 | "In terms of communication delays, the maximum one-way communication delay is about 22 minutes for any mission and can range from 15 to 20 minutes while crew is at Mars." | https://ntrs.nasa.gov/api/citations/20220013418/downloads/ASCEND-Communication%20Delays%2C%20Disruptions%2C%20and%20Blackouts%20for%20Crewed%20Mars%20Missions.pdf |
| `Mars gets about 43 percent of Earth sunlight.` | NASA NSSDC Mars Fact Sheet | Solar irradiance row: `Solar irradiance (W/m 2 ) 586.2 1361.0 0.431` — Mars 586.2 vs Earth 1361.0 W/m², ratio 0.431 | https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html |
| `Shelters stop storm particles well, but cosmic rays pass through.` | NASA NTRS Space Radiation Book Chapter, pp. 2–3 | "This broad energy range allows many GCR to penetrate shielding, exposing astronauts to a constant low dose rate of a complex radiation field." (p. 2) · "In spacecraft, dedicated "storm shelters" with additional shielding help reduce radiation exposure during large SPEs (Townsend et al., 2018)." (p. 3) | https://ntrs.nasa.gov/api/citations/20250004252/downloads/Book%20Chapter.pdf |

No fact is shown without a URL that contains its number. Facts that could not be
found on a NASA page were removed rather than softened.

## Place-name references

The base names are cultural references, not NASA data. Entoto Observatory and
Research Center sits on Mount Entoto above Addis Ababa. Dallol is a hot,
colorful site in Ethiopia's Afar region and a planetary analogue for Mars.

| Reference | Source | URL |
|---|---|---|
| Entoto Base | Ethiopian Space Science Society, Entoto Observatory and Research Center | https://ethiosss.org/projects/eorc |
| Dallol Base | *Astrobiology*, “The Dallol Geothermal Area, Northern Afar (Ethiopia)” | https://pubmed.ncbi.nlm.nih.gov/30653331/ |

`npm run facts` re-checks all of this: it fetches every URL live, compares the
SHA-256 of the served file against the copy the quote was read from, and searches
the live text for the number. `npm run storms` prints the game storm table
straight from `data/storms.json` and checks every gap against the timestamps.

## Saved storms

`data/storms.json` holds the raw NASA DONKI snapshot fetched on **2026-11-14**
(`fetchedAt: 2026-11-14T14:51:55.048Z`, 79 flares, 49 with a linked SEP).
`src/data/gameStorms.json` is the hand-checked game set: **8 storms** — 6 real
particle storms and 2 false alarms — each present in that snapshot.

| # | Storm id | Flare | Flare peak | Particle start | Gap (h) | Tier |
|---|---|---|---|---|---|---|
| 1 | 2024-02-06T02:37:00-FLR-001 | M4.2 | 2024-02-06T03:12Z | 2024-02-06T05:25Z | 2.22 | medium |
| 2 | 2025-11-11T09:49:00-FLR-001 | X5.1 | 2025-11-11T10:04Z | 2025-11-11T10:20Z | 0.27 | big |
| 3 | 2024-05-11T01:10:00-FLR-001 | X5.8 | 2024-05-11T01:23Z | 2024-05-11T02:10Z | 0.78 | big |
| 4 | 2024-05-13T09:36:00-FLR-001 | M6.6 | 2024-05-13T09:44Z | 2024-05-13T12:44Z | 3.00 | medium |
| 5 | 2024-10-26T05:57:00-FLR-001 | M9.5 | 2024-10-26T06:23Z | 2024-10-26T16:45Z | 10.37 | medium |
| 6 | 2025-01-04T14:24:00-FLR-001 | C9.3 | 2025-01-04T15:08Z | 2025-01-04T21:46Z | 6.63 | small |
| 7 | 2023-11-28T19:35:00-FLR-001 | M9.8 | 2023-11-28T19:50Z | none (false alarm) | none | small |
| 8 | 2023-11-28T19:07:00-FLR-001 | M3.4 | 2023-11-28T19:32Z | none (false alarm) | none | small |

## Live fetching vs. saved snapshot

- In production on Vercel, `/api/donki` queries `https://ccmc.gsfc.nasa.gov/DONKI-API/get` (replacing legacy `api.nasa.gov/DONKI/` which returned HTTP 404 after 2026-09-30) with an optional server-side `NASA_API_KEY` header, 8s timeout, and 1h caching.
- Because CCMC enforces a 60-day range ceiling per query (verified: a 365-day window returns HTTP 400), `loadStorms.ts` queries the latest 55 days (`LIVE`) and falls back to `src/data/gameStorms.json` (`SAVED 2026-11-14`) whenever offline or unreachable.
- Saved storms are never labeled `LIVE`. When the live proxy fails, the badge reads `SAVED 2026-11-14` — the date of the snapshot — and never `LIVE`. A Playwright test blocks every `/api/donki` request and asserts exactly that badge text.
- `npm run live` exercises the real live path: it calls the Vercel proxy in `api/donki.ts` against the live CCMC API and prints the badge the browser would show. Last run on 2026-11-14: `FLR -> HTTP 200, 24 events`, `SEP -> HTTP 200, 0 events`, 24 linked storms (all false alarms, no SEPs in the window), badge `LIVE 2026-11-11`.
- **Why a local run shows `SAVED`:** `npm run dev` / `npm run preview` serve only the static SPA. There is no serverless function behind `/api/donki` locally, so that request returns the SPA `index.html`, the JSON parse fails, and the app correctly falls back to `SAVED`. This is the offline fallback working, not a NASA outage. The `LIVE` badge only appears on the deployed Vercel URL.

## What is simplified for gameplay

| Mechanic | Simplification |
|---|---|
| Resource units | Bolts (15 power each), Power (0–100), Air (-42/-22/0/+8), Health (0–100) are game abstractions, not physical engineering values. |
| Flare-to-tier mapping | X = big, M = medium, lower = small for linked particle storms; false alarms without SEPs deal zero storm dose. |
| Radiation doses | Cosmic loss (`4 health/sol`, minimal 0.05/bolt shielding) and storm doses (`12 / 40 / 120` scaled by `[1, 0.6, 0.3, 0.08]`) are game balance values, not medical doses. |
| Storm Clock uncertainty | `K = clamp(ceil(visibleHours / 2), 1, 4)` and arrival block `A in [ceil(K/2), K]` are game design choices teaching forecast uncertainty. |
| Sunlight income | Moon `42`, Mars `24` power per sol are game numbers chosen for balance. The real Mars/Earth sunlight ratio is about 43% (NASA Mars Fact Sheet); the game uses `24 / 42 = 57%` so a Mars crew can still reach two stars. |
| Two-star science goal | Moon `8`, Mars `3`. The lower Mars goal exists because Mars income is lower, not because NASA reports a different science target. |
