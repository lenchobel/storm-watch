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
    ...(executablePath ? { launchOptions: { executablePath } } : {}),
  },
  webServer: {
    command: 'npm run build && npx vite preview --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
