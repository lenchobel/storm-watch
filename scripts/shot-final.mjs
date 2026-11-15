// Final delivery screenshots in a real (headed) browser.
// Usage: node scripts/shot-final.mjs
import { chromium } from '@playwright/test'

const outDir = 'screenshots/final'
const browser = await chromium.launch({ headless: false })

const shots = [
  { name: 'desktop-1280x800-picker', width: 1280, height: 800, screen: 'picker' },
  { name: 'phone-360x640-picker', width: 360, height: 640, screen: 'picker' },
  { name: 'landscape-640x360-picker', width: 640, height: 360, screen: 'picker' },
  { name: 'desktop-1280x800-sol', width: 1280, height: 800, screen: 'sol' },
]

for (const shot of shots) {
  const ctx = await browser.newContext({ viewport: { width: shot.width, height: shot.height } })
  const page = await ctx.newPage()
  await page.goto('http://127.0.0.1:3000', { waitUntil: 'networkidle' })
  await page.waitForTimeout(2200)
  if (shot.screen === 'sol') {
    await page.getByTestId('start-mission').click()
    await page.waitForTimeout(500)
    await page.getByTestId('begin-sol').click()
    await page.waitForTimeout(1800)
  }
  await page.screenshot({ path: `${outDir}/${shot.name}.png` })
  console.log(`shot ${shot.name}`)
  await ctx.close()
}

await browser.close()
