import { expect, test, type Page } from '@playwright/test'
import {
  assertAxeClean,
  assertMinButtonSize,
  assertMeterLabelsFit,
  assertNoHorizontalOverflow,
  auditSentences,
  choosePredictionIfShown,
} from './helpers'

const OUT = 'screenshots'

async function shot(page: Page, name: string) {
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(250)
  await page.screenshot({ path: `${OUT}/${name}.png` })
  console.log(`[I18N SHOT] ${name}.png`)
}

test('Afaan Oromoo: layout, targets, axe, lang, full mission, info, screenshots', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 640 })
  await page.goto('/')
  await page.getByRole('heading', { name: 'Storm Watch' }).waitFor()

  await page.getByTestId('lang-om').click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'om')
  await expect(page.getByTestId('lang-om')).toHaveAttribute('aria-pressed', 'true')

  // The choice must survive a reload.
  await page.reload()
  await page.getByRole('heading', { name: 'Storm Watch' }).waitFor()
  await expect(page.locator('html')).toHaveAttribute('lang', 'om')
  await expect(page.getByTestId('lang-om')).toHaveAttribute('aria-pressed', 'true')

  await assertNoHorizontalOverflow(page)
  await assertMinButtonSize(page)
  await auditSentences(page, 'picker-om')
  await assertAxeClean(page, 'picker-om')
  await shot(page, 'i18n-picker-om-360')

  await page.getByRole('button', { name: /2024-05-11/ }).click()
  await page.getByTestId('start-mission').click()
  await page.getByTestId('begin-sol').waitFor()
  await assertNoHorizontalOverflow(page)
  await assertMinButtonSize(page)
  await auditSentences(page, 'briefing-om')
  await assertAxeClean(page, 'briefing-om')

  await page.getByTestId('begin-sol').click()
  await page.getByTestId('end-day').waitFor()
  await assertNoHorizontalOverflow(page)
  await assertMinButtonSize(page)
  await assertMeterLabelsFit(page)
  await auditSentences(page, 'sol-om')
  await assertAxeClean(page, 'sol-om')
  await shot(page, 'i18n-sol-om-360')

  for (let i = 0; i < 12; i++) {
    const endBtn = page.getByTestId('end-day')
    if (!(await endBtn.isVisible())) break
    await choosePredictionIfShown(page)
    await endBtn.click()
    await page.waitForTimeout(100)
  }
  await page.getByTestId('shelter-now').waitFor()
  await assertNoHorizontalOverflow(page)
  await assertMinButtonSize(page)
  await auditSentences(page, 'clock-om')
  await assertAxeClean(page, 'clock-om')
  await shot(page, 'i18n-clock-om-360')

  await page.getByTestId('shelter-now').click()
  await page.getByTestId('continue').waitFor()
  await assertAxeClean(page, 'clock outcome-om')
  for (let i = 0; i < 24; i++) {
    if (await page.getByTestId('debrief').isVisible()) break
    const continueBtn = page.getByTestId('continue')
    const shelterBtn = page.getByTestId('shelter-now')
    const endBtn = page.getByTestId('end-day')
    if (await continueBtn.isVisible()) {
      await continueBtn.click()
      await page.waitForTimeout(100)
    } else if (await shelterBtn.isVisible()) {
      await shelterBtn.click()
      await page.waitForTimeout(700)
    } else if (await endBtn.isVisible()) {
      await choosePredictionIfShown(page)
      await endBtn.click()
      await page.waitForTimeout(100)
    } else {
      await page.waitForTimeout(100)
    }
  }
  await page.getByTestId('debrief').waitFor()
  await assertNoHorizontalOverflow(page)
  await assertMinButtonSize(page)
  await auditSentences(page, 'debrief-om')
  await assertAxeClean(page, 'debrief-om')
  await shot(page, 'i18n-debrief-om-360')

  // Every info page, reached from the debrief.
  await page.getByTestId('info-nav-sources').click()
  await page.getByTestId('info-back').waitFor()
  for (const id of ['sources', 'simplified', 'glossary', 'teacher', 'about']) {
    await page.getByTestId(`info-page-${id}`).click()
    await page.getByTestId('info-back').waitFor()
    await expect(page.locator('html')).toHaveAttribute('lang', 'om')
    await assertNoHorizontalOverflow(page)
    await assertMinButtonSize(page)
    await auditSentences(page, `info-${id}-om`)
    await assertAxeClean(page, `info-${id}-om`)
  }
  await page.getByTestId('info-back').click()
  await page.getByTestId('debrief').waitFor()

  // A desktop pass with the same language.
  await page.setViewportSize({ width: 1280, height: 800 })
  await assertNoHorizontalOverflow(page)
  await shot(page, 'i18n-debrief-om-1280')
})
