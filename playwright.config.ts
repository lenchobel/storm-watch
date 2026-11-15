import fs from 'node:fs'
import { defineConfig } from '@playwright/test'

const headlessShell =
  '/ms-playwright/chrome-headless-shell-linux64/chrome-headless-shell'
const executablePath = fs.existsSync(headlessShell) ? headlessShell : undefined

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  timeout: 45_000,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    storageState: {
      cookies: [],
      origins: [{
        origin: 'http://127.0.0.1:4173',
        localStorage: [{ name: 'storm-watch-v1', value: JSON.stringify({
          version: 1, bestStars: {}, runs: [], daysPlayed: [], forecaster: { right: 0, guesses: 0 },
          settings: { language: 'en', muted: false, vibration: true, classroom: false, simpleView: true },
        }) }],
      }],
    },
    launchOptions: {
      ...(executablePath ? { executablePath } : {}),
      args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
    },
  },
  webServer: {
    command: 'npm run build && npx vite preview --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
