import { expect, test } from '@playwright/test'

/**
 * The sound toggle is icon-only, so it must still meet the 48 px touch target
 * rule and keep the glyph centred inside the button.
 */
test('sound toggle is an icon-only 48px button with a centred speaker glyph', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 640 })
  await page.goto('/')
  await page.getByRole('heading', { name: 'Storm Watch' }).waitFor()

  const btn = page.getByRole('button', { name: 'Mute sound' })
  await expect(btn).toBeVisible()

  const box = await btn.boundingBox()
  expect(box).not.toBeNull()
  console.log(`[SOUND BTN] box: ${Math.round(box!.width)}x${Math.round(box!.height)}`)
  expect(box!.width).toBeGreaterThanOrEqual(48)
  expect(box!.height).toBeGreaterThanOrEqual(48)

  const icon = btn.locator('svg')
  const iconBox = await icon.boundingBox()
  console.log(`[SOUND BTN] icon: ${Math.round(iconBox!.width)}x${Math.round(iconBox!.height)}`)

  // The glyph must sit centred in the button.
  const leftGap = iconBox!.x - box!.x
  const rightGap = box!.x + box!.width - (iconBox!.x + iconBox!.width)
  console.log(`[SOUND BTN] left gap ${leftGap.toFixed(1)}px, right gap ${rightGap.toFixed(1)}px`)
  expect(Math.abs(leftGap - rightGap)).toBeLessThanOrEqual(1.5)

  // The button must carry no visible text label any more.
  const label = (await btn.innerText()).trim()
  console.log(`[SOUND BTN] visible text: "${label}"`)
  expect(label).toBe('')

  // It still toggles, and the state is exposed to assistive tech.
  await btn.click()
  const muted = page.getByRole('button', { name: 'Unmute sound' })
  await expect(muted).toBeVisible()
  await expect(muted).toHaveAttribute('aria-pressed', 'true')
  await muted.click()
  await expect(page.getByRole('button', { name: 'Mute sound' })).toHaveAttribute(
    'aria-pressed',
    'false'
  )
})
