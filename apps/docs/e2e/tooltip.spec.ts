import { expect, test, type Locator, type Page } from '@playwright/test'

// Tooltips open just below the mouse pointer (like the browser's own), draw above everything else,
// and never leave the screen.

async function openTooltipExplorer(page: Page) {
  await page.goto('/#/options')
  await page.waitForSelector('#explorer')
  await page.getByRole('button', { name: /^Control/ }).click()
  await page.getByRole('listbox').getByRole('option', { name: 'Tooltip', exact: true }).click()
}

const insideViewport = (tip: Locator) =>
  tip.evaluate((el) => {
    const r = el.getBoundingClientRect()
    // inside the scrollbars: clientWidth/clientHeight exclude them, innerWidth/innerHeight do not
    const { clientWidth, clientHeight } = document.documentElement
    return r.left >= 0 && r.top >= 0 && r.right <= clientWidth && r.bottom <= clientHeight
  })

/** Nothing covers the tooltip, and it sits at the top level of the page (not inside another layer). */
const drawnAboveEverything = async (tip: Locator) => ({
  topLevel: await tip.evaluate((el) => el.parentElement === document.body),
  uncovered: await tip.evaluate((el) => {
    const r = el.getBoundingClientRect()
    return document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) === el
  }),
})

test.describe('desktop', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('opens just below the mouse pointer by default, and is fixed above other layers', async ({ page }) => {
    await openTooltipExplorer(page)
    const button = page.getByRole('button', { name: 'Hover or focus me' })
    const box = (await button.boundingBox())!
    const pointer = { x: box.x + 20, y: box.y + 10 }
    await page.mouse.move(pointer.x, pointer.y)
    const tip = page.getByRole('tooltip').filter({ hasText: 'Save your work' })
    await expect(tip).toBeVisible()
    const t = (await tip.boundingBox())!
    expect(t.y - pointer.y).toBeGreaterThanOrEqual(22) // below the pointer and clear of the cursor image, not above the control
    expect(t.y - pointer.y).toBeLessThan(40) // but close to it
    expect(t.x - pointer.x).toBeGreaterThanOrEqual(12) // and to its right, so the cursor does not cover the tooltip's corner
    expect(await tip.evaluate((el) => getComputedStyle(el).position)).toBe('fixed')
    expect(Number(await tip.evaluate((el) => getComputedStyle(el).zIndex))).toBeGreaterThan(50) // over drawers and dialogs
    expect(await insideViewport(tip)).toBe(true)
  })

  test('opens below the control for keyboard focus, at once, and Escape closes it', async ({ page }) => {
    await openTooltipExplorer(page)
    const button = page.getByRole('button', { name: 'Hover or focus me' })
    await button.focus()
    await page.keyboard.press('Shift+Tab')
    await page.keyboard.press('Tab') // keyboard focus (focus-visible)
    const tip = page.getByRole('tooltip').filter({ hasText: 'Save your work' })
    await expect(tip).toBeVisible()
    const [t, b] = await Promise.all([tip.boundingBox(), button.boundingBox()])
    expect(t!.y).toBeGreaterThanOrEqual(b!.y + b!.height) // there is no pointer: below the control
    await page.keyboard.press('Escape')
    await expect(tip).toBeHidden()
  })

  test('a control at the very top: the tooltip is below the pointer, on screen, and above every other layer', async ({ page }) => {
    await page.goto('/#/controls')
    await page.waitForSelector('main section')
    const mode = page.locator('header').getByRole('button', { name: /Switch to (dark|light) mode/ })
    const box = (await mode.boundingBox())!
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    const tip = page.getByRole('tooltip').filter({ hasText: /Switch to (dark|light) mode/ })
    await expect(tip).toBeVisible()
    expect((await tip.boundingBox())!.y).toBeGreaterThan(box.y + box.height / 2)
    expect(await insideViewport(tip)).toBe(true)
    expect(await drawnAboveEverything(tip)).toEqual({ topLevel: true, uncovered: true })
  })

  test('near the bottom of the screen it goes above the pointer instead of off the screen', async ({ page }) => {
    await openTooltipExplorer(page)
    // put the trigger at the very bottom of the window, then hover it
    await page.evaluate(() => {
      const b = [...document.querySelectorAll('button')].find((x) => x.textContent === 'Hover or focus me')!
      document.getElementById('explorer')!.scrollIntoView()
      const spacer = document.createElement('div')
      spacer.style.height = '2000px'
      document.body.appendChild(spacer)
      b.scrollIntoView({ block: 'end' })
    })
    const button = page.getByRole('button', { name: 'Hover or focus me' })
    const box = (await button.boundingBox())!
    await page.mouse.move(box.x + 10, box.y + box.height - 2)
    const tip = page.getByRole('tooltip').filter({ hasText: 'Save your work' })
    await expect(tip).toBeVisible()
    expect(await insideViewport(tip)).toBe(true)
  })

  test('the sidebar collapse button, at the left edge, shows its tooltip on screen', async ({ page }) => {
    await page.goto('/#/controls')
    await page.waitForSelector('main section')
    const collapse = page.getByRole('button', { name: 'Collapse navigation' })
    const box = (await collapse.boundingBox())!
    await page.mouse.move(box.x + 4, box.y + 4)
    const tip = page.getByRole('tooltip').filter({ hasText: 'Collapse navigation' })
    await expect(tip).toBeVisible()
    expect(await insideViewport(tip)).toBe(true)
  })
})

test.describe('with a page scrollbar', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('a tooltip at the right edge stays clear of the scrollbar', async ({ page }) => {
    await page.goto('/#/controls')
    await page.waitForSelector('main section')
    const scrollbar = await page.evaluate(() => window.innerWidth - document.documentElement.clientWidth)
    const mode = page.locator('header').getByRole('button', { name: /Switch to (dark|light) mode/ })
    const box = (await mode.boundingBox())!
    // the pointer at the far right of the button, where the tooltip would otherwise reach the scrollbar
    await page.mouse.move(box.x + box.width - 2, box.y + box.height / 2)
    const tip = page.getByRole('tooltip').filter({ hasText: /Switch to (dark|light) mode/ })
    await expect(tip).toBeVisible()
    const right = (await tip.boundingBox())!.x + (await tip.boundingBox())!.width
    const available = await page.evaluate(() => document.documentElement.clientWidth)
    expect(right).toBeLessThanOrEqual(available - 8 + 0.5) // 8px margin inside the scrollbar
    expect(scrollbar).toBeGreaterThanOrEqual(0)
  })
})

test.describe('phone', () => {
  test.use({ viewport: { width: 375, height: 700 } })

  test('stays inside a narrow screen, whatever the placement', async ({ page }) => {
    await openTooltipExplorer(page)
    for (const placement of ['pointer', 'top', 'bottom', 'left', 'right']) {
      await page.getByRole('combobox', { name: /^placement/ }).click()
      await page.getByRole('listbox').getByRole('option', { name: placement, exact: true }).click()
      await page.getByRole('textbox', { name: 'content' }).fill('A rather long tooltip text that must wrap rather than run off the side of a narrow screen')
      const button = page.getByRole('button', { name: 'Hover or focus me' })
      await button.hover()
      const tip = page.getByRole('tooltip').filter({ hasText: 'A rather long' })
      await expect(tip).toBeVisible()
      expect(await insideViewport(tip), placement).toBe(true)
      await page.mouse.move(0, 0)
      await expect(tip).toBeHidden()
    }
  })
})
