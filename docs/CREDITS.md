# Credits

All application code, SVG scenes, icons, and synthesized audio in Storm Watch were built specifically for this project.

## Open-source packages

| Package | Version | License | Purpose |
|---|---|---|---|
| React / React DOM | 19.x | MIT | UI rendering & reducer state |
| Three.js | 0.187.x | MIT | Optional procedural 3D outpost scene |
| Vite | 6.x | MIT | Bundler & dev server |
| TypeScript | 5.7.x | Apache-2.0 | Static type checking |
| Vitest | 3.x | MIT | Pure engine & data unit tests |
| `@vitejs/plugin-react` | 4.x | MIT | React JSX transform |
| `tsx` | 4.x | MIT | TypeScript CLI runner for balance & DONKI scripts |
| `@playwright/test` | 1.x | Apache-2.0 | End-to-end browser & offline tests |
| `@axe-core/playwright` | 4.x | MPL-2.0 | Automated WCAG accessibility checks |
| `vite-plugin-pwa` | 2.x | MIT | Service worker precaching & Web App Manifest |

## Font, visual assets, and audio

- **Atkinson Hyperlegible** (weights `400` and `700`): self-hosted WOFF2 files in `/public/fonts/`, licensed under the **SIL Open Font License 1.1**.
- **Graphics & Icons**: Hand-built React SVG components (`IconSprite.tsx`, `Orbi.tsx`, `SceneSvg.tsx`) and local PNG manifest icons generated in Node. No stock images or NASA insignia are used.
- **Audio**: Five short cues synthesized client-side via Web Audio API (`src/ui/sound.ts`). No external audio files.
