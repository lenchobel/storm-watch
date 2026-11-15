# Contributing to Storm Watch

Thanks for taking the time. This project is small on purpose, and the rules
below keep it that way.

## The one rule that matters

**The engine owns the game math.** Every constant lives in
`src/engine/rules.ts`. The interface reads numbers from the engine and never
computes a rule of its own. If a screen needs a number it cannot get from
the engine, that is an engine bug, not a screen workaround.

## Ground rules

1. **Never change a test to make it pass.** Tests are the contract. If a rule
   changes, change the rule and the test together, and explain both in
   `DECISIONS.md`.
2. **Same seed, same result.** The engine is pure and deterministic. No
   `Math.random`, no `Date.now`, no network calls inside `src/engine/`.
3. **Keep files under 250 lines.** When a file grows past that, split it by
   responsibility, not by convenience.
4. **Name things plainly.** `clock.ts` beats `stormClockManager.ts`.
5. **Every sentence a child sees is 12 words or fewer.** One idea per screen.
   Read every string aloud before you keep it.
6. **Never invent NASA data.** Fetch it, save it, cite it, and label it LIVE
   or SAVED.
7. **No emoji icons, no purple gradients, no NASA logos, no stock art.**
   Visuals are drawn in code.
8. **If you are unsure, take the simplest choice** and write it down in
   `DECISIONS.md`.

## Before you open a pull request

```bash
npm test
npm run build
```

Both must pass. Paste the output in the pull request description.

## Pull requests

- One concern per pull request. Split refactors from behaviour changes.
- Explain what changed and why in the body, not only in the title.
- Link the issue it closes, if there is one.
- Note any new data source, with its citation and retrieval date.

## Reporting a bug

Open an issue with:

- what you did,
- what you expected,
- what happened instead,
- the seed, site, and difficulty, if the bug involves a mission.

A failing engine case with a seed is the fastest possible report.

## Code of conduct

Be precise, be kind, and argue about the rules rather than the person. This
project is for children to read, and that standard applies to the repo too.
