import { expect, test } from '@playwright/test'
import {
  assertAxeClean,
  assertMinButtonSize,
  assertNoHorizontalOverflow,
  auditSentences,
  playToDebrief,
} from './helpers'

const PARTICLE_FAST_ID = '2024-05-11T01:10:00-FLR-001'

test('360x640 layout, 48px targets, axe, info pages, and sentence audit', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 640 })
  await page.goto('/')
  await page.getByRole('heading', { name: 'Storm Watch' }).waitFor()

  await assertNoHorizontalOverflow(page)
  await assertMinButtonSize(page)
  await assertAxeClean(page, 'picker')

  await auditSentences(page, 'picker')

  // Check all 5 info pages
  const infoButtons = [
    'Where does this come from?',
    'What is simplified?',
    'Glossary',
    'Teacher mode',
    'About',
  ]
  for (const label of infoButtons) {
    await page.getByRole('button', { name: label }).click()
    await assertNoHorizontalOverflow(page)
    await assertMinButtonSize(page)
    await assertAxeClean(page, `info:${label}`)
    await auditSentences(page, `info:${label}`, label === 'Glossary' ? 16 : 12)
    await page.getByRole('button', { name: 'Back to mission' }).click()
  }

  // Briefing
  await page.getByRole('button', { name: 'Start mission' }).click()
  await assertNoHorizontalOverflow(page)
  await assertMinButtonSize(page)
  await assertAxeClean(page, 'briefing')
  await auditSentences(page, 'briefing')

  // Sol 1
  await page.getByRole('button', { name: 'Begin sol 1' }).click()
  await assertNoHorizontalOverflow(page)
  await assertMinButtonSize(page)
  await assertAxeClean(page, 'sol')
  await auditSentences(page, 'sol')
})

test('sentence audit covers every sol, the clock, the debrief and both worlds', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 640 })
  await page.goto(
    `/?seed=1&storm=${PARTICLE_FAST_ID}&site=moon&difficulty=cadet`
  )
  await page.getByRole('button', { name: 'End the day' }).waitFor()

  // Audit every sol screen up to the Storm Clock.
  for (let sol = 1; sol <= 7; sol++) {
    await auditSentences(page, `sol-${sol}`)
    const endBtn = page.getByRole('button', { name: 'End the day' })
    if (await endBtn.isVisible()) {
      await endBtn.click()
      continue
    }
    break
  }

  // Storm Clock screen and its outcome.
  const shelterBtn = page.getByRole('button', { name: 'Shelter now' })
  if (await shelterBtn.isVisible()) {
    await auditSentences(page, 'clock')
    await shelterBtn.click()
    await page.waitForTimeout(800)
    await auditSentences(page, 'clock-outcome')
  }

  // Debrief.
  const continueBtn = page.getByRole('button', { name: 'Continue' })
  for (let i = 0; i < 12; i++) {
    if (await continueBtn.isVisible()) {
      await continueBtn.click()
      await page.waitForTimeout(200)
      continue
    }
    break
  }
  await auditSentences(page, 'debrief')

  // Two-worlds comparison.
  const flyBtn = page.getByRole('button', { name: /Fly this exact storm on/i })
  if (await flyBtn.isVisible()) {
    await flyBtn.click()
    await playToDebrief(page, 'shelter')
    await auditSentences(page, 'debrief-compare')
  }
})

test('URL test mode completes mission with saver and Two-Worlds 5-row comparison', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 640 })
  await page.goto(
    `/?seed=1&storm=${PARTICLE_FAST_ID}&site=moon&difficulty=cadet`
  )
  await page.getByRole('button', { name: 'End the day' }).waitFor()

  // Pick Science preset (air 2, shield 0, lab 2) -> gets 2 stars or less, saver triggers
  const sciBtn = page.getByRole('button', { name: 'Science', exact: true })
  if (await sciBtn.isEnabled()) {
    await sciBtn.click()
  }
  await playToDebrief(page, 'shelter')

  await page.getByTestId('saver-text').waitFor()
  const saverText = await page.getByTestId('saver-text').innerText()
  expect(saverText.length).toBeGreaterThan(5)
  await assertAxeClean(page, 'debrief')
  await auditSentences(page, 'debrief')

  // Fly this exact storm on Mars
  await page
    .getByRole('button', { name: /Fly this exact storm on Mars/i })
    .click()
  await playToDebrief(page, 'shelter')

  const compareTable = page.getByRole('table', {
    name: /Moon versus Mars results/i,
  })
  await expect(compareTable).toBeVisible()
  const rows = compareTable.locator('[role="row"]')
  // 1 header row + 5 data rows = 6 rows
  await expect(rows).toHaveCount(6)
  await auditSentences(page, 'debrief-compare')
})
