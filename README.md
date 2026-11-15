# Storm Watch

**The real Sun sets the clock.**

A night-shift mission desk where a child commands a Moon or Mars outpost for
seven sols. Real NASA solar storms decide when danger arrives, and every choice
spends power, air, crew health, or science.

NASA Space Apps 2026 · Junior Astronaut Mission Trainer

---

## The problem

Children learn space facts. They rarely practice the trade-offs astronauts make
when power is short, forecasts can be wrong, and a storm is hours away.

## Three ideas make it ours

1. **The Storm Clock** — Real flare-to-particle gaps set a K-block countdown (`1–4` blocks). Each block, choose **Work** (`+1` science) or **Shelter** (safe inside).
2. **Same storm, two worlds** — Fly the exact same storm and seed on the Moon, then Mars. Lower sunlight, a dust sol, and a 3–22 minute radio delay change the outcome.
3. **What would have saved you** — Any run under 3 stars searches 1- and 2-step edits through the deterministic engine and proves a minimal fix.

## How to play

- **Ages 7–9 (Cadet)** uses Safe, Balanced, Science, or Custom plans (`0.7x` radiation).
- **Ages 10–12 (Commander)** allocates bolts directly (`1.0x` radiation).
- Each bolt costs **15 power**. Fund **Air**, **Shield**, and **Science** up to `floor(power / 15)`.
- When Earth warns of incoming solar particles on the storm sol, use the **Storm Clock** to decide when to shelter.
- At debrief, review your 1–3 stars, Orbi's log, the proven fix, NASA space-weather facts, and the 3-question check.

## Quick start

Requires Node.js 20+.

```bash
npm install        # install dependencies
npm run dev        # start Vite dev server on port 3000
npm test           # run Vitest unit tests (39 tests)
npm run build      # TypeScript check + Vite PWA production build
npm run balance    # run 5,000-run seeded balance verification
npm run e2e        # run Playwright mobile, a11y, reduced-motion, and offline tests
```

URL test mode starts any scenario directly:
`/?seed=1&storm=2024-05-11T01:10:00-FLR-001&site=moon&difficulty=cadet`

## Data sources

- **NASA CCMC DONKI (`FLR` & `SEP`)** via serverless proxy `/api/donki` with `LIVE` / `SAVED` badges and offline snapshot `src/data/gameStorms.json`.
- **NASA NTRS & NASA Science** verified radiation, sunlight, and communication facts in `src/data/facts.json`.

See [docs/DATA_SOURCES.md](docs/DATA_SOURCES.md), [docs/CREDITS.md](docs/CREDITS.md), and [docs/AI_USE.md](docs/AI_USE.md).

## License

[MIT](LICENSE) for code. Self-hosted Atkinson Hyperlegible fonts are licensed under SIL OFL 1.1. Not an official NASA product; uses no NASA logos or insignia.
