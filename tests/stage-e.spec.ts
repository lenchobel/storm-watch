import { expect, test } from '@playwright/test'
import { assertAxeClean, assertNoHorizontalOverflow } from './helpers'

test('Stage E mobile mission actions stay visible', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 })
  await page.goto('/')
  await page.getByTestId('start-mission').click()
  await page.getByTestId('begin-sol').click()
  const end = page.getByTestId('end-day')
  await expect(end).toBeVisible()
  expect((await end.boundingBox())!.y + (await end.boundingBox())!.height).toBeLessThanOrEqual(640)
  await assertNoHorizontalOverflow(page)
  await assertAxeClean(page, 'mobile sol')
})

test('Stage E desktop mission uses two columns', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/')
  await page.getByTestId('start-mission').click()
  await page.getByTestId('begin-sol').click()
  const columns = await page.getByTestId('sol').evaluate((el) => getComputedStyle(el).gridTemplateColumns)
  expect(columns.split(' ').length).toBe(2)
  await assertAxeClean(page, 'desktop sol')
})

test('Stage E Oromo back label and mobile layout', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 })
  await page.goto('/')
  await page.getByTestId('lang-om').click()
  await assertNoHorizontalOverflow(page)
  await assertAxeClean(page, 'Oromo picker')
})
test('Stage E mobile storm clock keeps both choices visible', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 })
  await page.goto('/')
  await page.getByTestId('start-mission').click()
  await page.getByTestId('begin-sol').click()
  for (let day = 0; day < 12; day++) {
    if (await page.getByTestId('clock').isVisible().catch(() => false)) break
    const guess = page.getByTestId('predict-unsure')
    if (await guess.isVisible()) await guess.click()
    await page.getByTestId('end-day').click()
  }
  await expect(page.getByTestId('clock')).toBeVisible()
  const work = page.getByTestId('work-block')
  const shelter = page.getByTestId('shelter-now')
  await expect(work).toBeVisible()
  await expect(shelter).toBeVisible()
  for (const button of [work, shelter]) {
    const box = (await button.boundingBox())!
    expect(box.y + box.height).toBeLessThanOrEqual(640)
  }
  await assertAxeClean(page, 'mobile storm clock')
})
