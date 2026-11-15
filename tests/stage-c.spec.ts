import { expect, test } from '@playwright/test'
import { assertAxeClean, choosePredictionIfShown, playToDebrief } from './helpers'

const particle = '2024-05-11T01:10:00-FLR-001'
const falseAlarm = '2023-11-28T19:35:00-FLR-001'

async function answerStormQuestion(page: import('@playwright/test').Page, guess: 'yes' | 'no') {
  for (let i = 0; i < 12; i++) {
    const choice = page.getByTestId(`predict-${guess}`)
    if (await choice.isVisible()) {
      await choice.click()
      await page.getByTestId('end-day').click()
      return
    }
    await choosePredictionIfShown(page)
    await page.getByTestId('end-day').click()
  }
}

test('prediction feedback and learning card explain a particle storm', async ({ page }) => {
  await page.goto(`/?seed=1&storm=${particle}&site=moon&difficulty=cadet`)
  await assertAxeClean(page, 'prediction card')
  await answerStormQuestion(page, 'yes')
  await page.getByTestId('shelter-now').click()
  await playToDebrief(page, 'shelter')
  await expect(page.getByText('You said Yes. Particles came.')).toBeVisible()
  await expect(page.getByText(/Going in early kept the crew safe/)).toBeVisible()
  await assertAxeClean(page, 'prediction debrief')
})

test('false alarm prediction is friendly and saved score ignores unsure', async ({ page }) => {
  await page.goto(`/?seed=1&storm=${falseAlarm}&site=moon&difficulty=cadet`)
  await answerStormQuestion(page, 'no')
  await page.getByTestId('shelter-now').click()
  await playToDebrief(page, 'shelter')
  await expect(page.getByText('You said No. Particles did not come.')).toBeVisible()
  await page.getByRole('button', { name: 'Pick another storm' }).click()
  await page.getByRole('button', { name: 'Storm collection' }).click()
  await expect(page.getByText('Forecaster: 1 / 1')).toBeVisible()
  await expect(page.getByText(/Game note:/)).toBeVisible()
})

test('classroom mode enlarges text, mutes sound, and disables vibration', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 })
  await page.goto('/')
  await page.getByLabel('Classroom mode').check()
  await page.getByRole('button', { name: 'Settings' }).click()
  await expect(page.getByRole('button', { name: 'Unmute sound' })).toBeVisible()
  await page.getByRole('button', { name: 'Close' }).click()
  const fontSize = await page.locator('.app-shell').evaluate((el) => getComputedStyle(el).fontSize)
  expect(Number.parseFloat(fontSize)).toBeGreaterThanOrEqual(22)
  await page.getByRole('button', { name: 'About' }).click()
  await expect(page.getByLabel('Vibration on storm hits')).not.toBeChecked()
})

test('teacher class challenge prints a seed link and results table', async ({ page }) => {
  await page.addInitScript(() => {
    ;(window as Window & { __printed?: boolean }).print = () => {
      ;(window as Window & { __printed?: boolean }).__printed = true
    }
  })
  await page.goto('/')
  await page.getByRole('button', { name: 'Teacher mode' }).click()
  await expect(page.getByRole('table', { name: 'Printable group results' })).toBeVisible()
  await expect(page.getByRole('link', { name: /Today’s challenge link/ })).toHaveAttribute('href', /seed=/)
  await assertAxeClean(page, 'teacher class challenge')
  await page.getByRole('button', { name: 'Print class results' }).click()
  expect(await page.evaluate(() => (window as Window & { __printed?: boolean }).__printed)).toBe(true)
  await page.emulateMedia({ media: 'print' })
  const pdf = await page.pdf({ format: 'Letter', printBackground: true })
  const pageCount = Buffer.from(pdf).toString('latin1').match(/\/Type\s*\/Page\b/g)?.length ?? 0
  expect(pageCount).toBe(1)
})

test('keyboard-only play reaches debrief with visible focus on prediction', async ({ page }) => {
  await page.goto('/')
  const focusByTab = async (id: string) => {
    for (let i = 0; i < 140; i++) {
      const active = await page.evaluate((target) => document.activeElement?.getAttribute('data-testid') === target, id)
      if (active) return
      await page.keyboard.press('Tab')
    }
    throw new Error(`Keyboard focus did not reach ${id}`)
  }
  for (let i = 0; i < 140; i++) {
    const text = await page.evaluate(() => document.activeElement?.textContent ?? '')
    if (text.includes('2024-05-11')) break
    await page.keyboard.press('Tab')
  }
  await page.keyboard.press('Enter')
  await focusByTab('start-mission')
  await page.keyboard.press('Enter')
  await focusByTab('begin-sol')
  await page.keyboard.press('Enter')
  for (let step = 0; step < 30; step++) {
    if (await page.getByTestId('debrief').isVisible()) break
    for (const id of ['predict-unsure', 'end-day', 'shelter-now', 'continue']) {
      const button = page.getByTestId(id)
      if (!await button.isVisible()) continue
      if (id === 'predict-unsure' && await button.getAttribute('aria-pressed') === 'true') continue
      await focusByTab(id)
      if (id === 'predict-unsure') {
        const outline = await page.evaluate(() => getComputedStyle(document.activeElement!).outlineStyle)
        expect(outline).toBe('solid')
      }
      await page.keyboard.press('Enter')
      if (id === 'shelter-now') await page.waitForTimeout(700)
      break
    }
  }
  await expect(page.getByTestId('debrief')).toBeVisible()
})
