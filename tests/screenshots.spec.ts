import { expect, test, type Page } from '@playwright/test'

/**
 * Captures every screen at the two reference sizes from BLUEPRINT section 7
 * (Layout): a 360 x 640 phone designed first, and a 1280 x 800 desktop.
 * Run with `npm run e2e`; the PNGs land in `screenshots/`.
 */
const DEMO_STORM = '2024-02-06T02:37:00-FLR-001'
const DEMO_SEED = 24
const OUT = 'screenshots'

const SIZES = [
  { name: '360x640', width: 360, height: 640 },
  { name: '1280x800', width: 1280, height: 800 },
]

async function shot(page: Page, name: string) {
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(250)
  await page.screenshot({ path: `${OUT}/${name}.png` })
  console.log(`[SHOT] ${name}.png`)
}

/** Tap "End the day" until the Storm Clock or the debrief appears. */
async function playToDebrief(page: Page) {
  for (let i = 0; i < 24; i++) {
    const continueBtn = page.getByRole('button', { name: 'Continue' })
    const endBtn = page.getByRole('button', { name: 'End the day' })
    const shelterBtn = page.getByRole('button', { name: 'Shelter now' })
    const tryAgain = page.getByRole('button', { name: 'Try again' })

    if (await tryAgain.isVisible()) return
    if (await continueBtn.isVisible()) {
      await continueBtn.click()
      await page.waitForTimeout(200)
      continue
    }
    if (await shelterBtn.isVisible()) {
      await shelterBtn.click()
      await page.waitForTimeout(800)
      continue
    }
    if (await endBtn.isVisible()) {
      await endBtn.click()
      await page.waitForTimeout(200)
      continue
    }
    return
  }
}

for (const size of SIZES) {
  test(`screenshots at ${size.name}`, async ({ page }) => {
    await page.setViewportSize({ width: size.width, height: size.height })

    // 1. Mission picker
    await page.goto('/')
    await page.getByRole('heading', { name: 'Storm Watch' }).waitFor()
    await shot(page, `${size.name}-01-picker`)

    // 1b. The sound toggle, in both states.
    const muteBtn = page.getByRole('button', { name: 'Mute sound' })
    await muteBtn.click()
    await expect(page.getByRole('button', { name: 'Unmute sound' })).toBeVisible()
    await shot(page, `${size.name}-01b-picker-muted`)
    await page.getByRole('button', { name: 'Unmute sound' }).click()
    await expect(page.getByRole('button', { name: 'Mute sound' })).toBeVisible()
    await shot(page, `${size.name}-01c-picker-unmuted`)

    // 2..6. The five info pages
    const infoButtons = [
      'Where does this come from?',
      'What is simplified?',
      'Glossary',
      'Teacher mode',
      'About',
    ]
    let step = 2
    for (const label of infoButtons) {
      await page.getByRole('button', { name: label }).click()
      const slug = label.replace(/[^a-zA-Z]+/g, '-').replace(/^-|-$/g, '').toLowerCase()
      await shot(page, `${size.name}-${String(step).padStart(2, '0')}-info-${slug}`)
      step++
      await page.getByRole('button', { name: 'Back to mission' }).click()
    }

    // 7. Briefing
    await page.getByRole('button', { name: 'Start mission' }).click()
    await shot(page, `${size.name}-${String(step).padStart(2, '0')}-briefing`)
    step++

    // 8. Sol 1
    await page.getByRole('button', { name: 'Begin sol 1' }).click()
    await shot(page, `${size.name}-${String(step).padStart(2, '0')}-sol-1`)
    step++

    // 9. Storm Clock and its outcome, from the demo storm and seed.
    await page.goto(
      `/?seed=${DEMO_SEED}&storm=${DEMO_STORM}&site=moon&difficulty=cadet`
    )
    await page.getByRole('button', { name: 'End the day' }).waitFor()
    for (let i = 0; i < 3; i++) {
      await page.getByRole('button', { name: 'End the day' }).click()
      await page.waitForTimeout(150)
    }
    await page.getByRole('button', { name: 'End the day' }).click()
    await page.waitForTimeout(400)
    await shot(page, `${size.name}-${String(step).padStart(2, '0')}-storm-clock`)
    step++

    await page.getByRole('button', { name: 'Shelter now' }).click()
    await page.waitForTimeout(900)
    await shot(page, `${size.name}-${String(step).padStart(2, '0')}-clock-outcome`)
    step++

    // 11. Debrief
    await playToDebrief(page)
    await page.getByTestId('saver-text').waitFor()
    await shot(page, `${size.name}-${String(step).padStart(2, '0')}-debrief`)
    step++

    // 12. Two-worlds comparison
    await page.getByRole('button', { name: /Fly this exact storm on Mars/i }).click()
    await playToDebrief(page)
    const table = page.getByRole('table', { name: /Moon versus Mars results/i })
    await expect(table).toBeVisible()
    await shot(page, `${size.name}-${String(step).padStart(2, '0')}-two-worlds`)
  })
}
