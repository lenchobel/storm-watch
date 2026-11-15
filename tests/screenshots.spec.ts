import { expect, test, type Page } from '@playwright/test'
import { choosePredictionIfShown } from './helpers'

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
  { name: '640x360', width: 640, height: 360 },
  { name: '800x360', width: 800, height: 360 },
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
      await choosePredictionIfShown(page)
      await endBtn.click()
      await page.waitForTimeout(200)
      continue
    }
    return
  }
}

async function playOromoToDebrief(page: Page) {
  for (let i = 0; i < 24; i++) {
    if (await page.getByTestId('debrief').isVisible()) return
    const continueBtn = page.getByTestId('continue')
    const shelterBtn = page.getByTestId('shelter-now')
    const endBtn = page.getByTestId('end-day')
    if (await continueBtn.isVisible()) await continueBtn.click()
    else if (await shelterBtn.isVisible() && await shelterBtn.isEnabled()) {
      await shelterBtn.click()
    }
    else if (await endBtn.isVisible()) {
      await choosePredictionIfShown(page)
      await endBtn.click()
    }
    await page.waitForTimeout(120)
  }
}

async function captureOromoScreens(page: Page, size: string) {
  await page.goto('/')
  await page.getByTestId('lang-om').click()
  await shot(page, `om-${size}-01-picker`)
  await page.getByRole('button', { name: /2024-05-11/ }).click()
  await page.getByTestId('start-mission').click()
  await shot(page, `om-${size}-07-briefing`)
  await page.getByTestId('begin-sol').click()
  await shot(page, `om-${size}-08-sol-1`)
  for (let i = 0; i < 12; i++) {
    const endBtn = page.getByTestId('end-day')
    if (!(await endBtn.isVisible())) break
    await choosePredictionIfShown(page)
    await endBtn.click()
  }
  await page.getByTestId('shelter-now').waitFor()
  await shot(page, `om-${size}-09-storm-clock`)
  await page.getByTestId('shelter-now').click()
  await playOromoToDebrief(page)
  await page.getByTestId('debrief').waitFor()
  await shot(page, `om-${size}-11-debrief`)
}

for (const size of SIZES) {
  test(`screenshots at ${size.name}`, async ({ page }) => {
    test.setTimeout(120_000)
    await page.setViewportSize({ width: size.width, height: size.height })

    // 1. Mission picker
    await page.goto('/')
    await page.getByRole('heading', { name: 'Storm Watch' }).waitFor()
    await shot(page, `${size.name}-01-picker`)

    await page.getByRole('button', { name: 'Storm collection' }).click()
    await page.getByTestId('collection').waitFor()
    await shot(page, `${size.name}-01d-collection`)
    await page.getByRole('button', { name: 'Back to mission' }).click()

    await page.getByRole('button', { name: 'Play daily mission' }).click()
    await page.getByTestId('briefing').waitFor()
    await shot(page, `${size.name}-01e-daily-briefing`)
    await page.getByRole('button', { name: 'Pick another storm' }).click()

    // 1b. The sound toggle, in both states.
    await page.getByRole('button', { name: 'Settings' }).click()
    const muteBtn = page.getByRole('button', { name: 'Mute sound' })
    await muteBtn.click()
    await expect(page.getByRole('button', { name: 'Unmute sound' })).toBeVisible()
    await shot(page, `${size.name}-01b-picker-muted`)
    await page.getByRole('button', { name: 'Unmute sound' }).click()
    await expect(page.getByRole('button', { name: 'Mute sound' })).toBeVisible()
    await shot(page, `${size.name}-01c-picker-unmuted`)
    await page.getByRole('button', { name: 'Close' }).click()

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
    await choosePredictionIfShown(page)
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

    await captureOromoScreens(page, size.name)
  })
}
