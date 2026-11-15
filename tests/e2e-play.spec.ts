import { expect, test } from '@playwright/test'
import { assertAxeClean, auditSentences, playToDebrief } from './helpers'

const PARTICLE_FAST_ID = '2024-05-11T01:10:00-FLR-001'
const FALSE_ALARM_ID = '2023-11-28T19:35:00-FLR-001'

test('Storm Clock covers sheltered, caught, and false_alarm plus reduced motion', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 360, height: 640 })

  // 1. Sheltered outcome on particle storm
  await page.goto(
    `/?seed=1&storm=${PARTICLE_FAST_ID}&site=moon&difficulty=cadet`
  )
  while (await page.getByRole('button', { name: 'End the day' }).isVisible()) {
    await page.getByRole('button', { name: 'End the day' }).click()
  }
  await page.getByRole('button', { name: 'Shelter now' }).waitFor()
  await assertAxeClean(page, 'clock')
  await auditSentences(page, 'clock')
  const signalAnim = await page.evaluate(() => {
    const el = document.querySelector('.signal-dot')
    return el ? getComputedStyle(el).animationName : 'none'
  })
  expect(signalAnim).toBe('none')
  await page.getByRole('button', { name: 'Shelter now' }).click()
  await expect(page.getByText(/The shelter held\./)).toBeVisible()
  await auditSentences(page, 'clock-outcome')

  // 2. Caught outcome on fast particle storm (K=1, work triggers caught)
  await page.goto(
    `/?seed=1&storm=${PARTICLE_FAST_ID}&site=moon&difficulty=cadet`
  )
  while (await page.getByRole('button', { name: 'End the day' }).isVisible()) {
    await page.getByRole('button', { name: 'End the day' }).click()
  }
  await page.getByRole('button', { name: 'Work one more block' }).click()
  await expect(
    page.getByText(/The shield only protects the shelter\./)
  ).toBeVisible()

  // 3. False alarm outcome
  await page.goto(
    `/?seed=1&storm=${FALSE_ALARM_ID}&site=moon&difficulty=cadet`
  )
  while (await page.getByRole('button', { name: 'End the day' }).isVisible()) {
    await page.getByRole('button', { name: 'End the day' }).click()
  }
  await page.getByRole('button', { name: 'Shelter now' }).click()
  await expect(page.getByText(/No particles came\./)).toBeVisible()
})

test('badge says SAVED with the fetch date when /api/donki cannot be reached', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 640 })
  await page.route('**/api/donki**', (route) => route.abort())
  await page.goto('/')
  await page.getByRole('heading', { name: 'Storm Watch' }).waitFor()

  const badge = page.locator('.badge').first()
  await expect(badge).toBeVisible()
  const text = (await badge.innerText()).trim()
  console.log(`[BADGE AUDIT] unreachable /api/donki -> "${text}"`)
  expect(text).toMatch(/^SAVED\s+\d{4}-\d{2}-\d{2}$/)
  expect(text).not.toContain('LIVE')
  await expect(page.locator('.badge', { hasText: 'LIVE' })).toHaveCount(0)
})

test('Offline PWA works after reload and plays to debrief', async ({
  page,
  context,
}) => {
  await page.goto('/')
  await page.getByRole('heading', { name: 'Storm Watch' }).waitFor()
  // Wait for service worker activation
  await page.evaluate(async () => {
    if ('serviceWorker' in navigator) {
      await navigator.serviceWorker.ready
    }
  })

  await context.setOffline(true)
  await page.reload()
  await page.getByRole('heading', { name: 'Storm Watch' }).waitFor()
  await expect(page.getByText(/SAVED/).first()).toBeVisible()

  await page.getByRole('button', { name: 'Start mission' }).click()
  await page.getByRole('button', { name: 'Begin sol 1' }).click()
  await playToDebrief(page, 'shelter')
  await page.getByTestId('saver-text').waitFor()
})
