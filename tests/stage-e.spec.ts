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

test('landscape keeps the scene visible while shield bolts change', async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 360 })
  await page.goto('/')
  await page.getByTestId('start-mission').click()
  await page.getByTestId('begin-sol').click()
  const scene = page.locator('.scene-frame').first()
  const controls = page.locator('.sol-controls-scroll')
  const sceneBox = await scene.boundingBox()
  const controlsBox = await controls.boundingBox()
  expect(sceneBox).not.toBeNull()
  expect(controlsBox).not.toBeNull()
  expect(sceneBox!.x).toBeLessThan(controlsBox!.x)
  await page.getByRole('button', { name: 'Add bolt to Shield' }).click()
  await expect(scene).toBeVisible()
  const afterBox = await scene.boundingBox()
  expect(afterBox!.y).toBe(sceneBox!.y)
  await expect(page.getByTestId('end-day')).toBeVisible()
  const endBox = await page.getByTestId('end-day').boundingBox()
  expect(endBox!.y + endBox!.height).toBeLessThanOrEqual(360)
})

test('portrait phone explains landscape play', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 })
  await page.goto('/')
  await expect(page.getByRole('status').filter({ hasText: 'Turn your device sideways' })).toBeVisible()
})

test('landscape Storm Clock keeps both choices inside the screen', async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 360 })
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
  for (const id of ['work-block', 'shelter-now']) {
    const button = page.getByTestId(id)
    await expect(button).toBeVisible()
    const box = await button.boundingBox()
    expect(box!.y + box!.height).toBeLessThanOrEqual(360)
  }
})

test('wide landscape phone shows every bolt stepper', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 360 })
  await page.goto('/')
  await page.getByTestId('start-mission').click()
  await page.getByTestId('begin-sol').click()
  for (const name of ['Air', 'Shield', 'Science']) {
    const stepper = page.getByRole('button', { name: `Add bolt to ${name}` })
    await expect(stepper).toBeVisible()
    const box = await stepper.boundingBox()
    expect(box!.y + box!.height).toBeLessThanOrEqual(360)
  }
  const end = page.getByTestId('end-day')
  await expect(end).toBeVisible()
  const box = await end.boundingBox()
  expect(box!.y + box!.height).toBeLessThanOrEqual(360)
})
