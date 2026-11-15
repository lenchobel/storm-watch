# Storm Watch rules
Read the BLUEPRINT.md section for the phase I name. Do only that phase.
1. Never invent NASA data. Fetch it, save it, cite it. Label LIVE or SAVED.
2. Game rules live only in src/engine/rules.ts. The UI never computes game math.
3. The engine is pure TypeScript with a seeded RNG. Same seed = same result.
4. Every rule has a unit test. Never change a test to make it pass.
5. Every sentence a child sees is 12 words or fewer.
6. No emoji icons, no purple gradients, no NASA logos, no outside images or music.
7. Keep files under 250 lines. Name things plainly.
8. After each task run: npm test && npm run build. Paste the output.
9. If unsure, take the simplest choice and write it in DECISIONS.md.
10. Record all AI use in docs/AI_USE.md.
11. For any UI change, open the app in the browser tool at 360x640 and 1280x800, take screenshots, and compare them to BLUEPRINT 4.4. Fix differences before you say done.
