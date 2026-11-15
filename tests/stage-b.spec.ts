import { expect, test, type Page } from '@playwright/test'
import { assertAxeClean } from './helpers'

const storm = '2024-02-06T02:37:00-FLR-001'

async function finishMission(page: Page) {
  for (let step = 0; step < 24; step++) {
    if (await page.getByTestId('debrief').isVisible()) return
    if (await page.getByTestId('continue').isVisible()) await page.getByTestId('continue').click()
    else if (await page.getByTestId('shelter-now').isVisible() && await page.getByTestId('shelter-now').isEnabled()) await page.getByTestId('shelter-now').click()
    else if (await page.getByTestId('end-day').isVisible()) {
      const prediction = page.getByTestId('predict-unsure')
      if (await prediction.isVisible()) await prediction.click()
      await page.getByTestId('end-day').click()
    }
    await page.waitForTimeout(100)
  }
}

test('challenge link starts the same mission and shows its score', async ({ page }) => {
  await page.goto(`/?storm=${storm}&site=moon&difficulty=cadet&seed=24&beat=2`)
  await expect(page.getByText('A friend got 2 stars. Can you beat it?')).toBeVisible()
  await expect(page.getByTestId('end-day')).toBeVisible()
})

test('corrupt saved progress does not prevent loading', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('storm-watch-v1', '{broken'))
  await page.goto('/')
  await expect(page.getByTestId('picker')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Start mission' })).toBeVisible()
})

test('a completed run remains in the collection after reload', async ({ page }) => {
  await page.goto(`/?storm=${storm}&site=moon&difficulty=cadet&seed=24`)
  await finishMission(page)
  await expect(page.getByTestId('debrief')).toBeVisible()
  await page.goto('/')
  await page.getByRole('button', { name: 'Storm collection' }).click()
  await assertAxeClean(page, 'storm collection')
  await expect(page.getByTestId('collection')).toContainText('M4.2')
  await expect(page.getByTestId('collection')).toContainText('Particles arrived after')
})

test('English and Oromo picker layouts do not scroll sideways', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 })
  for (const lang of ['en', 'om']) {
    await page.goto('/')
    if (lang === 'om') await page.getByTestId('lang-om').click()
    const widths = await page.evaluate(() => ({ body: document.body.scrollWidth, viewport: window.innerWidth }))
    expect(widths.body).toBeLessThanOrEqual(widths.viewport)
  }
})
