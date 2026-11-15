# Storm Watch — Build Blueprint

NASA Space Apps 2026 · Build a Junior Astronaut Mission Trainer.
Working spec distilled from the full build guide. `AGENTS.md` wins for process;
where section 4.2 and 4.2b disagree, 4.2b wins. Choices not fixed by the guide
live in `DECISIONS.md`.

## 0. One line

Storm Watch is a night-shift mission desk where the real Sun sets the clock.
A kid commands a Moon or Mars outpost for seven sols. Real NASA solar storms
decide when danger comes. Three ideas make it ours:

1. **The Storm Clock** — real warnings are short and uncertain.
2. **Same storm, two worlds** — where you live changes what you can do.
3. **What would have saved you** — failure points to one small fix, proven by
   the engine.

## 1. Submission hard gates

1. Submit under the official challenge. "Create Your Own Challenge" is not
   eligible for global judging.
2. Demo is a video up to 30 seconds or a deck up to 7 slides. Videos need
   English subtitles. Host on YouTube, Drive or GitHub with a public link
   that needs no login. Test in a private window.
3. Use NASA data or resources. List every data source, library, image and
   text in the form.
4. Disclose AI use: tools and how. Watermark AI-made images or video. Never
   use NASA logos, flags or mission patches.
5. No names, voices or faces of anyone under 18. No personal details.
   No selling products.
6. Everything is original work. List code, text and images from others,
   even free ones. No copyrighted music or art.
7. Team size 1 to 6. All members registered at the same Local Event or the
   Universal Event.
8. Press Submit for Judging before 11:59 pm in the Local Event's time zone.
   Submission is final.
9. Judging categories: Impact, Creativity, Validity, Relevance, Presentation.
   Give Presentation as much care as the other four.

Best-fit awards: Best Mission Concept, Most Inspirational, Best Storytelling,
Art & Technology. No one can promise a win.

## 2. Game rules

### Meters

- Power, Air, Crew Health: 0 to 100. All start at 100.
- Science is a score, not a meter. It starts at 0.

### The sol

Seven sols. Each sol the player spends power bolts on three systems:

| System | Bolts | Cost | Effect |
|---|---|---|---|
| Air machine | 0–3 | 15 power each | Air change −42 / −22 / 0 / +8 |
| Radiation shield | 0–3 | 15 power each | Storm shield factor 1 / 0.6 / 0.3 / 0.08 |
| Science lab | 0–3 | 15 power each | +1 science per bolt |

- Total bolts cannot exceed `floor(power / 15)`. If an over-budget plan reaches
  the engine, fund air first, then shield, then lab. The UI must prevent it.
- Sunlight income each sol: Moon 42, Mars 24. A Mars dust-storm sol gives 30%
  of that (floor). Battery caps at 100; unused power is wasted.
- Air caps at 100 and health caps at 100.
- The hidden storm sol is seeded in sols 3 to 6.
- Mars has one seeded dust sol in sols 2 to 6.
- End-of-sol order: income, spend, air change, cosmic loss, storm, science,
  failure check.

### Radiation

- **Cosmic rays, every sol.** Small health loss. The shield barely helps:
  4 health lost per sol at shield 0, 3 at shield 3. Simplified game numbers.
- **Solar storm, one sol.** Dose by tier times shield factor:
  small 12, medium 40, big 120; factors 1 / 0.6 / 0.3 / 0.08.
- **Tier from real data.** A linked SEP means particles. Size from flare
  class: X = big, M = medium, C = small. No linked SEP = false alarm, no dose.
  This is simplified for the game, not a medical dose. Flares are light;
  the dose comes mostly from particles.
- Cosmic rays are always there. The shield is not a more-is-better slider.

### Win and stars

- Survive 7 sols.
- 1 star = survive.
- 2 stars = also enough science: 8+ on the Moon, 3+ on Mars.
- 3 stars = also health 50+ at the end.
- Current balance: a big storm on Mars can reach two stars, not three. Do not
  promise three stars on Mars in the copy or debrief.
- The science goal is per site because Mars sunlight is 24 against the Moon's 42,
  so a Mars crew simply cannot buy as many lab bolts. Mars needs 3 science for
  two stars; the Moon needs 8. The copy must state the goal for the site the
  player is on, everywhere the goal appears.

### No free choice

Every option costs power, air, health or science. An automated balance test
must show no single action is best on all sols.

### Difficulty

- Cadet (7–9): three preset plans (Safe, Balanced, Science) plus Custom.
- Commander (10–12): sliders.

## 3. The Storm Clock (signature 1)

- On the storm sol, after the player ends the day, the screen switches to the
  Storm Clock.
- `gapHours = (SEP start − flare peak) / 1 hour`, from the real DONKI event.
- `K = clamp(ceil(gapHours / 2), 1, 4)`. Each block lasts `gapHours / K`
  hours, so the displayed warning stays truthful for long gaps. This refines
  the guide's fixed 2-hour block. The data page must say the block length is a
  game choice.
- Earth announces: "Particles in about H hours." Each block is one choice:
  **Work** (+1 science, stay outside) or **Shelter** (go in, safe from here on).
- Forecast uncertainty: the seeded arrival block is chosen evenly from
  `[ceil(K / 2), K]` (for example, 1 or 2 when K=2). Always show the earliest
  possible block so the risk is legible.
- **Shelter on block A protects you.** Work on block A means caught outside.
  Once sheltered, stay inside and stop earning science.
- Sheltered before arrival: dose = tier × shield factor for that sol's shield.
- Caught outside: full tier dose. The shield protects the shelter, not a suit.
- False alarm: no storm dose, but every Shelter block loses the science the
  player could have earned.
- Mars: show the real one-way radio delay in minutes. Do not claim Mars loses
  work blocks to a multi-hour delay. The data page must say the forecast error
  range is a game choice, not a NASA number.
- Without motion, show the same steps as static screens.

## 4. Same storm, two worlds (signature 2)

- After the debrief: "Fly this exact storm on the other world."
- Same storm, same seed; only site rules change (sunlight, dust).
- Save each finished run keyed by storm id + site. Show a two-column card:
  stars, air left, health left, science, warning time.
- Generate one sentence naming the biggest real difference, using numbers from
  the run: "On Mars the warning came 20 minutes late. You got 1 fewer work blocks."
- Never invent a difference the engine did not produce.

## 5. What would have saved you (signature 3)

- After any run under 3 stars, replay edited versions of the run: same seed,
  same storm.
- Try every single edit first (one sol, one category, plus or minus one bolt;
  one Storm Clock move earlier or later), then every pair.
- Pick the smallest edit that helps: fail-to-survive first, then +1 star.
  Tie-break by fewest bolts moved, then earliest sol.
- One friendly line, never blame: "Try 1 less science bolt on sol 4. The air
  would have lasted." If nothing works: "This one was very hard. Try the Safe
  plan."
- Every sentence in the line is 12 words or fewer.
- Re-run the suggested edit through the engine and prove it gives the promised
  result.

## 6. Data plan

| Data | Source | Use | Fallback |
|---|---|---|---|
| Flares (FLR), particle events (SEP), links | NASA DONKI via `ccmc.gsfc.nasa.gov/DONKI-API/get` (moved 2026-09-30; old `api.nasa.gov/DONKI/FLR` is 404) | Storm tier, date, class, gap | Saved `data/storms.json` |
| Curiosity RAD: about 0.7 mSv/day at Mars surface, 1.84 mSv/day cruise, ISS 0.4–1.0 | NASA / SwRI | Cosmic baseline, Did-you-know card | Static, cited |
| One real astronaut finding | NASA OSDR, record study ID | Real astronaut science card | Use RAD fact instead |
| Radio delay (Moon about 1 s, Mars minutes), Mars sunlight share | NASA pages, verified | Comms and power rules | Omit the number if unverified |

Rules:

- Never hardcode a storm from memory. `scripts/fetch-donki.mjs` fetches DONKI,
  saves `data/storms.json` with `fetchedAt`, and picks eight real storms:
  six particle storms with different sizes/gaps and two false alarms.
- Runtime: live first (8 s timeout, 2 retries with backoff), then the saved
  snapshot. Badge shows LIVE or SAVED (date). Never call static data live.
- `DEMO_KEY`: 30 requests/hour, 50/day. A free personal key gives 1000/hour.
  Keep the key on the server (serverless proxy) and cache for an hour.
- Every screen with a real number has a "Where does this come from?" link to
  the data page with sources and what is simplified.

## 7. Design system

### Identity

Night-shift mission desk: deep navy, one warm amber desk lamp, flat hand-built
SVG shapes. No purple-blue gradients, no glass blur, no stock rocket emoji,
no template hero banner. The only glow is the solar flare.

Orbi, the outpost robot, is the only character: rounded box body 64 × 72, one
wide visor with two round eyes, a small antenna with an amber light. Orbi
speaks in lines of up to 12 words and always uses a real number when there is
one. Voice: calm, concrete, a little dry. Banned words: unleash, epic, journey,
galactic adventure, dive in, let's go. At most one exclamation mark per screen.

Icons: one SVG sprite of 11 icons on a 24 px grid, 2 px stroke, round caps:
bolt, air, heart, flask, shield, sun, signal, clock, house, speaker,
speaker-off. No emoji.

### Tokens

| Token | Value |
|---|---|
| Space navy | `#0B1026` |
| Panel | `#161D3F` |
| Line | `#2A3366` |
| Text | `#EEF0FF` |
| Muted text | `#AEB4D6` |
| Amber | `#FFB703` |
| Air blue | `#6EC6FF` |
| Health green | `#7BD88F` |
| Power yellow | `#FFD166` |
| Danger coral | `#FF5D5D` |
| Moon ground | `#8D90A8` |
| Mars ground | `#B5543A` |
| Mars sky | `#24141C` |

Every meter has an icon and a word, never color alone. Coral text on panel is
about 4.2:1; use coral as a fill with a text label, or adjust before P6.

### Type

Atkinson Hyperlegible, self-hosted woff2 (open font license), fallback
`system-ui`. Sizes 18, 22, 28, 40. Weights 400 and 700 only. Body never below
18 px.

### Layout

Reference 360 × 640 phone, designed first. The guide's full stack is 692 px
before gaps, so use a compact mode on short screens. Full-size target:

- Top bar 72: three meters (icon, word, bar) and sol counter.
- Scene 240 tall.
- Orbi message bubble under the scene.
- Three control cards, 88 tall each, minus/plus buttons 48 × 48.
- Main action 56 tall, full width, pinned at the bottom.
- Desktop: one centered column max 480, data panel on the right.

Compact target (≤700 px tall): 64 HUD, 220 scene, 52 bubble, 76 cards,
52 CTA. Verify no overlap and no sideways scroll at 360 px.

### Scene recipe

SVG `viewBox="0 0 360 240"`, drawn in code, no images.

- Sky: one flat rect. 40 stars from the seeded RNG, radius 0.6–1.4,
  opacity 0.4–0.9.
- Ground: one path across the bottom 70 px. Moon: 5 crater ellipses.
  Mars: a lighter dust band.
- Habitat: half-circle dome, radius 46, centered at x 180 on the ground line,
  with a door and a small dish on top.
- Solar panels: three thin rectangles 28 × 6 on stands at x 60, 100, 260.
  Mars panels 40% dimmer.
- Shield: dashed arc, radius 58, around the dome. Opacity
  `0.15 + 0.28 * shield level`.
- Sun: circle radius 16 at (312, 36) with 8 short rays. Earth: circle radius
  12 at (44, 40) with two continent paths. A signal dot travels Earth → dish.
- Mars dust sol: translucent brown rect over the scene; panels dimmer.

### Storm Clock screen

Full screen. Ring split into K segments (1–4). Center: "Particles expected in
about 3 hours." Two huge buttons: **Work one more block** (amber) and
**Shelter now** (air blue). Each tap advances one segment over 600 ms and the
sun pulses. When the real arrival block is reached, a wave sweeps across the
scene, then the result. Reduced motion shows static steps.

### Motion and sound

Transitions up to 400 ms. One hero animation only (flare and wave). Five
synthesized WebAudio sounds: tick, warning, storm hit, shelter door, success.
Nothing plays before the first tap. Mute on every screen. No flashing more
than 3 times per second.

### Copy bank

- Briefing: "A real flare from 2024 is coming. Keep the air running."
- Storm Clock start: "Earth says particles in about 3 hours. Forecasts can be wrong."
- Shelter early, false alarm: "No particles came. You lost 2 science. That is the price of caution."
- Caught outside: "The shield only protects the shelter. Next time, go in sooner."
- Mars late message: "Earth's message took 11 minutes. It is old news."
- Debrief fix: "Try 1 less science bolt on sol 4. The air would have lasted."

### Screens

Title and mission picker, Briefing, Sol screen, Storm Clock, Storm result,
Debrief with the fix, Two-worlds comparison, Glossary, Teacher mode, Data and
sources, About and AI disclosure.

## 8. Accessibility

- WCAG AA contrast, full keyboard play, screen-reader live regions for meter
  changes, reduced-motion support, no flashing over 3 times per second.
- No accounts, no tracking, no cookies, no data collection.
- axe-core on every screen with zero serious issues.
- No sideways scroll at 360 px. Every button at least 48 px.
- Real child test: at least one child aged 7–12 plays for 10 minutes without
  help. Text notes only. No child's name, voice or face in submission material.
- The human reviews every screen on a phone. The agent cannot see screenshots.

## 9. Architecture

```
src/engine/   rng.ts, rules.ts, types.ts, sim.ts, clock.ts, saver.ts, compare.ts
src/data/     loadStorms.ts, facts.json, storms.json (public/data/)
src/ui/       copy.ts, components/, screens/
api/          donki.ts (serverless proxy)
scripts/      fetch-donki.mjs, balance-bot
docs/         DATA_SOURCES.md, AI_USE.md, CREDITS.md
tests/        engine/*.test.ts, ui/*.spec.ts, data/*.test.ts
```

- The engine is pure. No DOM, no fetch, no clock, no `Math.random`.
- The UI calls engine helpers for every number. It never computes game math.
- The engine must support both `runMission(cfg, plan)` for tests/saver and a
  step API for the interactive clock.

## 10. Phases and gates

- **P0** setup: blueprint, agent rules, config, skills, commands, scaffold,
  git. Gate: `npm test` and `npm run build`.
- **P1** engine core: rng, rules, types, sim. Gate: unit tests pass.
- **P1.5** DONKI probe: fetch FLR/SEP, measure real gaps, pick eight storms.
  Gate: `data/storms.json` and a printed gap table.
- **P2** Storm Clock: `clock.ts`, called from `sim.ts`. Gate: clock tests.
- **P3** saver and two-world compare. Gate: replay proves the fix.
- **P4** balance bot: 5,000 seeded runs per site/difficulty/strategy. Gate:
  Moon Cadet sensible ≥90%, random 25–50%; Mars Commander sensible 50–70%;
  all-science loses on both; false-alarm and wait-last proofs.
- **P5** live/saved data wiring, facts, badges. Gate: loader tests.
- **P6** UI shell and scene. Gate: layout, 48 px, axe.
- **P7** clock screen, debrief, comparison. Gate: full mission test.
- **P8** teaching, data pages, offline PWA. Gate: Lighthouse a11y ≥95,
  offline test, first load under 1.5 MB.
- **P9** audit, docs, deploy. Gate: public link in a private window.
- **P10** demo script, form, link checklist. Gate: private-window links.

## 11. Quality gates

- Rules: all 9 hard gates ticked.
- Science: every number has a source or is marked simplified; flares versus
  particles explained; forecast error range stated as a game choice; no
  medical claims.
- Engine: balance table meets targets; every saver sentence verified by
  re-running the engine; same seed = same run; no crash on any input.
- Signature test: after one play, a stranger can explain the Storm Clock in
  one sentence.
- Look: human reviewed every screen on a phone; no banned visual; no sentence
  over 12 words.
- Tech: live link works in a private window; offline works; phone and desktop
  fine; no console errors; public repo with README; axe zero serious;
  Lighthouse accessibility ≥95.
- Honesty: LIVE/SAVED badge always right; AI use accurate; all assets listed.
- Judge dry run: a friend plays 5 minutes and watches the 30-second video.

## 12. Submission pack

30-second video, English subtitles, no children on camera:

- 0:00–0:03 Name, team, title, tagline: "Storm Watch: the real Sun sets the clock."
- 0:03–0:07 Problem: kids learn space facts, but not the choices astronauts make.
- 0:07–0:15 Screen recording. Pick a real storm with the LIVE badge. Earth
  says particles in about 3 hours. Tap Work, Work, Shelter.
- 0:15–0:22 The twist: particles came early. One run caught outside, one
  saved. Debrief line "If you had…"
- 0:22–0:27 Same storm on Mars. One line: shields stop storm particles, not
  cosmic rays.
- 0:27–0:30 Future (classrooms, offline phones) and play link. Subtitles
  throughout. No children on camera.

Form fields: high-level summary, detailed description, NASA data, other data
and resources, use of AI. Use only claims the repo proves.
