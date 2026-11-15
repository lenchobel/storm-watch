// Layout audit: screenshots + overflow/overlap checks across screens and viewports.
// Usage: node scripts/shot-responsive.mjs [outDir]
import { chromium } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const outDir = process.argv[2] ?? 'screenshots/responsive'
const base = process.env.BASE_URL ?? 'http://127.0.0.1:3000'

const viewports = [
  { name: 'phone-360x640', width: 360, height: 640 },
  { name: 'phone-390x844', width: 390, height: 844 },
  { name: 'tablet-768x1024', width: 768, height: 1024 },
  { name: 'tablet-1024x768', width: 1024, height: 768 },
  { name: 'laptop-1280x800', width: 1280, height: 800 },
  { name: 'wide-1863x906', width: 1863, height: 906 },
  { name: 'land-812x375', width: 812, height: 375 },
  { name: 'land-640x360', width: 640, height: 360 },
]

const screens = ['picker', 'briefing', 'sol', 'clock']

fs.mkdirSync(outDir, { recursive: true })
const browser = await chromium.launch()
let problems = 0

for (const vp of viewports) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } })
  const page = await ctx.newPage()

  for (const screen of screens) {
    await page.goto(base, { waitUntil: 'networkidle' })
    await page.waitForTimeout(400)
    if (screen !== 'picker') {
      await page.getByTestId('start-mission').click()
      await page.waitForTimeout(300)
      const begin = page.getByRole('button', { name: /begin mission|start mission|begin/i }).first()
      if (await begin.isVisible().catch(() => false)) await begin.click()
      await page.waitForTimeout(700)
      if (screen === 'sol' || screen === 'clock') {
        const endBtn = page.getByRole('button', { name: 'End the day' })
        if (await endBtn.isVisible().catch(() => false)) {
          await endBtn.click()
          await page.waitForTimeout(800)
        }
      }
    }
    await page.waitForTimeout(400)

    const audit = await page.evaluate(() => {
      const stack = document.querySelector('.screen-stack')
      const stackRect = stack ? stack.getBoundingClientRect() : null
      const out = { sideScroll: false, clipped: [], overlaps: [], offscreen: [], sceneH: 0, cta: null, stackId: null }
      out.sideScroll = document.documentElement.scrollWidth > window.innerWidth + 1
      out.pageScroll = document.documentElement.scrollHeight > window.innerHeight + 1
      out.stackId = stack ? stack.getAttribute('data-testid') : null
      const scene = document.querySelector('.scene-frame')
      if (scene) out.sceneH = Math.round(scene.getBoundingClientRect().height)
      const cta = document.querySelector('.cta-btn')
      if (cta) {
        const r = cta.getBoundingClientRect()
        out.cta = { bottom: Math.round(r.bottom), h: Math.round(r.height) }
      }
      // Clipped: element scrolls its own content but has overflow hidden.
      for (const el of document.querySelectorAll('.screen-stack *')) {
        const c = getComputedStyle(el)
        if (c.overflow === 'hidden' && el.scrollHeight > el.clientHeight + 2 && el.clientHeight > 0) {
          out.clipped.push(`${el.className || el.tagName} (${el.clientHeight}<${el.scrollHeight})`)
        }
      }
      // Offscreen: content outside the viewport box, ignoring scroll containers.
      const scrollParent = (el) => {
        let p = el.parentElement
        while (p && p !== document.body) {
          const o = getComputedStyle(p)
          if (o.overflowY === 'auto' || o.overflowY === 'scroll') return p
          p = p.parentElement
        }
        return null
      }
      for (const el of document.querySelectorAll('.screen-stack > *, .screen-stack > * > *')) {
        const r = el.getBoundingClientRect()
        if (r.width === 0 || r.height === 0) continue
        if (r.right > window.innerWidth + 1 || r.left < -1 || r.bottom > window.innerHeight + 1) {
          if (scrollParent(el)) continue
          out.offscreen.push(`${el.className || el.tagName} bottom=${Math.round(r.bottom)} right=${Math.round(r.right)} vh=${window.innerHeight}`)
        }
      }
      // Overlap: direct grid/flex children of the screen stack that intersect.
      const kids = [...(stack?.children ?? [])].map((el) => ({ el, r: el.getBoundingClientRect() }))
      for (let i = 0; i < kids.length; i++) {
        for (let j = i + 1; j < kids.length; j++) {
          const a = kids[i]
          const b = kids[j]
          const ox = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left)
          const oy = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top)
          if (ox > 2 && oy > 2) {
            out.overlaps.push(`${a.el.className} X ${b.el.className} (${Math.round(ox)}x${Math.round(oy)})`)
          }
        }
      }
      if (stackRect) out.stackRect = { w: Math.round(stackRect.width), h: Math.round(stackRect.height) }
      return out
    })

    const issues = []
    if (audit.sideScroll) issues.push('side-scroll')
    if (audit.pageScroll) issues.push('page-scroll')
    if (audit.sceneH > 0 && audit.sceneH < 40) issues.push(`scene-collapsed:${audit.sceneH}px`)
    if (audit.cta && audit.cta.bottom > vp.height + 1) issues.push(`cta-cut:${audit.cta.bottom}>${vp.height}`)
    if (audit.clipped.length) issues.push(`clipped:${audit.clipped.join('|')}`)
    if (audit.overlaps.length) issues.push(`overlap:${audit.overlaps.join('|')}`)
    if (audit.offscreen.length) issues.push(`offscreen:${audit.offscreen.slice(0, 4).join('|')}`)

    const tag = `${vp.name}/${screen}`
    if (issues.length) {
      problems++
      console.log(`FAIL ${tag}: ${issues.join('  ')}`)
    } else {
      console.log(`ok   ${tag}  scene=${audit.sceneH} stack=${audit.stackRect?.w}x${audit.stackRect?.h}`)
    }
    await page.screenshot({ path: path.join(outDir, `${vp.name}--${screen}.png`) })
  }
  await ctx.close()
}

await browser.close()
console.log(`\n${problems} failing combinations`)
