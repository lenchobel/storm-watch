import { expect, test } from '@playwright/test'
import { playToDebrief } from './helpers'

const storm = '2024-02-06T02:37:00-FLR-001'

test('3D view draws a canvas and completes a mission without console errors', async ({ page }, testInfo) => {
  const errors: string[] = []
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto('/')
  await page.getByTestId('simple-view-toggle').click()
  await page.goto(`/?seed=1&storm=${storm}&site=moon&difficulty=cadet`)
  await expect(page.getByTestId('scene-3d').locator('canvas')).toBeVisible()
  await page.setViewportSize({ width: 360, height: 640 })
  await page.screenshot({ path: testInfo.outputPath('moon-sol-360.png') })
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.screenshot({ path: testInfo.outputPath('moon-sol-1280.png') })
  await page.setViewportSize({ width: 360, height: 640 })
  await playToDebrief(page, 'shelter')
  await expect(page.getByTestId('debrief')).toBeVisible()
  expect(errors).toEqual([])
})

test('Mars procedural scene fits phone and desktop viewports', async ({ page }, testInfo) => {
  await page.goto('/')
  await page.getByTestId('simple-view-toggle').click()
  await page.goto(`/?seed=1&storm=${storm}&site=mars&difficulty=cadet`)
  await expect(page.getByTestId('scene-3d').locator('canvas')).toBeVisible()
  for (const size of [{ width: 360, height: 640 }, { width: 1280, height: 800 }]) {
    await page.setViewportSize(size)
    await page.screenshot({ path: testInfo.outputPath(`mars-sol-${size.width}.png`) })
  }
})

test('simple view switches the mission scene back to SVG', async ({ page }) => {
  await page.goto('/')
  const toggle = page.getByTestId('simple-view-toggle')
  await expect(toggle).toHaveAttribute('aria-pressed', 'true')
  await toggle.click()
  await page.goto(`/?view=2d&seed=1&storm=${storm}&site=moon&difficulty=cadet`)
  await expect(page.locator('.scene-frame svg')).toBeVisible()
  await page.goto(`/?seed=1&storm=${storm}&site=moon&difficulty=cadet`)
  await expect(page.getByTestId('scene-3d').locator('canvas')).toBeVisible()
  await playToDebrief(page, 'shelter')
  await page.getByRole('button', { name: 'Pick another storm' }).click()
  await page.getByTestId('simple-view-toggle').click()
  await page.goto(`/?seed=1&storm=${storm}&site=moon&difficulty=cadet`)
  await expect(page.locator('.scene-frame svg')).toBeVisible()
  await expect(page.getByTestId('scene-3d')).toHaveCount(0)
})

test('lost WebGL context falls back to the 2D scene', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('simple-view-toggle').click()
  await page.goto(`/?seed=1&storm=${storm}&site=moon&difficulty=cadet`)
  await expect(page.getByTestId('scene-3d').locator('canvas')).toBeVisible()
  await page.locator('.scene-3d canvas').evaluate((canvas) => {
    canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true }))
  })
  await expect(page.locator('.scene-frame svg')).toBeVisible()
})

test('3D and 2D scenes compare across storm outcomes and viewports', async ({ page }, testInfo) => {
  test.setTimeout(240_000)
  await page.goto('/')
  await page.getByTestId('simple-view-toggle').click()
  const sizes = [{ width: 360, height: 640 }, { width: 1280, height: 800 }]
  const capture = async (site: string, mode: string, screen: string) => {
    for (const size of sizes) {
      await page.setViewportSize(size)
      await page.screenshot({ path: testInfo.outputPath(`${site}-${mode}-${screen}-${size.width}.png`) })
    }
  }
  const runScenario = async (site: string, stormId: string, outcome: 'sheltered' | 'caught' | 'false-alarm', view: '3d' | '2d') => {
    const viewQuery = view === '2d' ? '&view=2d' : ''
    await page.goto(`/?seed=1&storm=${stormId}&site=${site}&difficulty=cadet${viewQuery}`)
    if (view === '3d') await expect(page.getByTestId('scene-3d').locator('canvas')).toBeVisible()
    else await expect(page.locator('.scene-frame svg')).toBeVisible()
    await capture(site, view, 'sol')
    for (let i = 0; i < 10 && !await page.getByTestId('clock').isVisible(); i++) {
      const end = page.getByTestId('end-day')
      if (await end.isVisible()) {
        const prediction = page.getByTestId('predict-unsure')
        if (await prediction.isVisible() && await prediction.getAttribute('aria-pressed') !== 'true') await prediction.click()
        await end.click()
      }
    }
    await expect(page.getByTestId('clock')).toBeVisible()
    await capture(site, view, `clock-${outcome}`)
    if (outcome === 'caught') {
      for (let i = 0; i < 5 && !await page.getByTestId('continue').isVisible(); i++) {
        await page.getByTestId('work-block').click()
        await page.waitForTimeout(700)
      }
    } else {
      await page.getByTestId('shelter-now').click()
      await page.waitForTimeout(700)
    }
    await expect(page.getByTestId('continue')).toBeVisible()
    await capture(site, view, `outcome-${outcome}`)
    await playToDebrief(page, outcome === 'caught' ? 'work-all' : 'shelter')
    await expect(page.getByTestId('debrief')).toBeVisible()
    await capture(site, view, 'debrief')
  }
  const particle = '2024-02-06T02:37:00-FLR-001'
  const falseAlarm = '2023-11-28T19:35:00-FLR-001'
  for (const site of ['moon', 'mars']) {
    for (const mode of ['sheltered', 'caught'] as const) {
      for (const view of ['3d', '2d'] as const) await runScenario(site, particle, mode, view)
    }
    for (const view of ['3d', '2d'] as const) await runScenario(site, falseAlarm, 'false-alarm', view)
  }
})
