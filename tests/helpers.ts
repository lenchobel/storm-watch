import AxeBuilder from '@axe-core/playwright'
import { expect, type Page } from '@playwright/test'

export async function assertNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth
  )
  expect(overflow).toBe(false)
}

export async function assertMinButtonSize(page: Page) {
  const smallButtons = await page.evaluate(() => {
    const out: string[] = []
    for (const btn of document.querySelectorAll('button')) {
      const rect = btn.getBoundingClientRect()
      if (rect.width === 0 && rect.height === 0) continue
      if (rect.width < 48 || rect.height < 48) {
        out.push(`${btn.textContent?.trim()}:${Math.round(rect.width)}x${Math.round(rect.height)}`)
      }
    }
    return out
  })
  expect(smallButtons).toEqual([])
}

export async function assertAxeClean(page: Page, label: string) {
  const res = await new AxeBuilder({ page }).analyze()
  const bad = res.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical'
  )
  expect(bad, `Axe serious/critical on ${label}`).toEqual([])
}

/**
 * Fails when any sentence a child can read is longer than `maxWords`.
 * Glossary entries are allowed up to 16 words.
 */
export async function auditSentences(page: Page, label: string, maxWords = 12) {
  const long = await page.evaluate((limit) => {
    const text = document.body.innerText
    return text
      .split(/(?<=[.!?])\s+|\n+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((s) => s.split(/\s+/).length > limit)
  }, maxWords)
  if (long.length > 0) {
    console.log(`[SENTENCE AUDIT] ${label}: ${long.length} over ${maxWords} words`)
    for (const s of long) console.log(`  [${s.split(/\s+/).length} words] ${s}`)
  } else {
    console.log(`[SENTENCE AUDIT] ${label}: clean (all sentences <= ${maxWords} words)`)
  }
  expect(long, `${label} sentences <= ${maxWords} words`).toEqual([])
}

/** Play the mission until the debrief appears. */
export async function playToDebrief(
  page: Page,
  clockChoice: 'shelter' | 'work-all'
) {
  for (let i = 0; i < 24; i++) {
    const endBtn = page.getByRole('button', { name: 'End the day' })
    const workBtn = page.getByRole('button', { name: 'Work one more block' })
    const shelterBtn = page.getByRole('button', { name: 'Shelter now' })
    const continueBtn = page.getByRole('button', { name: 'Continue' })
    const tryAgain = page.getByRole('button', { name: 'Try again' })

    if (await tryAgain.isVisible()) return
    if (await continueBtn.isVisible()) {
      await continueBtn.click()
      continue
    }
    if (await shelterBtn.isVisible()) {
      const target = clockChoice === 'shelter' ? shelterBtn : workBtn
      if (await target.isEnabled()) {
        await target.click()
      }
      await page.waitForTimeout(700)
      continue
    }
    if (await endBtn.isVisible()) {
      await endBtn.click()
      continue
    }
    await page.waitForTimeout(100)
  }
}
