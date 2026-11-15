import { expect, test, type Page } from '@playwright/test'
import { choosePredictionIfShown } from './helpers'

/**
 * Demo moments for the 30 second video.
 * Storm: M4.2 flare on 2024-02-06, real particles 2.22 hours after the flare.
 * Seed 24: the storm lands on sol 4, particles arrive at Moon block 2, and the
 * Mars radio delay is 20 minutes, so Mars shows one block fewer.
 */
const DEMO_STORM = '2024-02-06T02:37:00-FLR-001'
const DEMO_SEED = 24
const STORM_SOL = 4
const MOON_URL = `/?seed=${DEMO_SEED}&storm=${DEMO_STORM}&site=moon&difficulty=cadet`
const MARS_URL = `/?seed=${DEMO_SEED}&storm=${DEMO_STORM}&site=mars&difficulty=cadet`

/** Tap "End the day" up to the sol before the storm sol. */
async function playToStormSol(page: Page) {
  for (let i = 0; i < STORM_SOL - 1; i++) {
    await page.getByRole('button', { name: 'End the day' }).click()
    await page.waitForTimeout(150)
  }
}

/** On the storm sol, one "End the day" opens the Storm Clock. */
async function openClock(page: Page) {
  await choosePredictionIfShown(page, 'yes')
  await page.getByRole('button', { name: 'End the day' }).click()
  await page.waitForTimeout(200)
}

async function finishAfterClock(page: Page) {
  for (let i = 0; i < 12; i++) {
    const continueBtn = page.getByRole('button', { name: 'Continue' })
    if (await continueBtn.isVisible()) {
      await continueBtn.click()
      await page.waitForTimeout(150)
      continue
    }
    const endBtn = page.getByRole('button', { name: 'End the day' })
    if (await endBtn.isVisible()) {
      await endBtn.click()
      await page.waitForTimeout(150)
      continue
    }
    break
  }
}

async function logWarning(page: Page, label: string) {
  const line = page.locator('.orbi-bubble p').first()
  console.log(`[${label}] warning line: ${await line.innerText()}`)
}

test('demo A: Moon run works too long and is caught outside', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 })
  await page.goto(MOON_URL)
  await playToStormSol(page)
  await logWarning(page, 'DEMO A')
  await openClock(page)

  await page.getByRole('button', { name: 'Work one more block' }).click()
  await page.waitForTimeout(700)
  await page.getByRole('button', { name: 'Work one more block' }).click()
  await expect(page.getByText(/The shield only protects the shelter\./)).toBeVisible()
  console.log('[DEMO A] clock outcome: The shield only protects the shelter. Next time, go in sooner.')

  await finishAfterClock(page)
  await expect(page.getByTestId('saver-text')).toBeVisible()
  console.log(`[DEMO A] debrief saver line: ${await page.getByTestId('saver-text').innerText()}`)
  console.log(`[DEMO A] stars: ${await page.locator('.star-row').getAttribute('aria-label')}`)
})

test('demo B: same storm and seed, the player shelters in time and survives', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 640 })
  await page.goto(MOON_URL)
  await playToStormSol(page)
  await openClock(page)

  await page.getByRole('button', { name: 'Shelter now' }).click()
  await expect(page.getByText(/The shelter held\./)).toBeVisible()
  console.log('[DEMO B] clock outcome: The shelter held.')

  await finishAfterClock(page)
  await expect(page.getByTestId('saver-text')).toBeVisible()
  console.log(`[DEMO B] debrief saver line: ${await page.getByTestId('saver-text').innerText()}`)
  console.log(`[DEMO B] stars: ${await page.locator('.star-row').getAttribute('aria-label')}`)
})

test('demo C: the same storm on Mars, warning arrives late, ends with the comparison', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 640 })
  await page.goto(MOON_URL)
  await playToStormSol(page)
  await openClock(page)
  await page.getByRole('button', { name: 'Shelter now' }).click()
  await expect(page.getByText(/The shelter held\./)).toBeVisible()
  await finishAfterClock(page)

  await page.getByRole('button', { name: /Fly this exact storm on Mars/i }).click()
  await playToStormSol(page)
  await logWarning(page, 'DEMO C')
  await openClock(page)
  console.log(
    `[DEMO C] Mars clock blocks: ${
      await page.locator('svg[aria-label^="Storm Clock"]').getAttribute('aria-label')
    }`
  )

  await page.getByRole('button', { name: 'Shelter now' }).click()
  await expect(page.getByText(/The shelter held\./)).toBeVisible()
  await finishAfterClock(page)

  const table = page.getByRole('table', { name: /Moon versus Mars results/i })
  await expect(table).toBeVisible()
  console.log(`[DEMO C] comparison table:\n${await table.innerText()}`)
})
