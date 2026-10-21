import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

// The custom dropdowns share one Combobox: the font picker (search, category chips), the theme
// dropdown and the table's filter dropdowns.

test.use({ viewport: { width: 1280, height: 800 } })

const fontTrigger = (page: Page) => page.getByRole('button', { name: /^Font: / })

async function openFonts(page: Page) {
  await page.goto('/#/typography')
  await page.waitForSelector('main section')
  await fontTrigger(page).click()
  await expect(page.getByRole('combobox', { name: /Search/ })).toBeFocused()
}

test.describe('font picker', () => {
  test('hovering a row shades it only: no theme-coloured border; the keyboard still gets a ring', async ({ page }) => {
    await openFonts(page)
    const rows = page.getByRole('listbox', { name: 'Font' }).getByRole('option')
    await rows.nth(1).hover()
    const boxShadow = (i: number) => rows.nth(i).evaluate((el) => getComputedStyle(el).boxShadow)
    expect(await boxShadow(1)).toBe('none')
    expect(await rows.nth(1).evaluate((el) => getComputedStyle(el).backgroundColor)).not.toBe('rgba(0, 0, 0, 0)')

    await page.keyboard.press('ArrowDown')
    expect(await boxShadow(2)).not.toBe('none') // keyboard focus indicator
  })

  test('the popup has the control\'s radius and sits 4px below it', async ({ page }) => {
    await openFonts(page)
    const trigger = await fontTrigger(page).evaluate((el) => ({ r: getComputedStyle(el).borderTopLeftRadius, bottom: el.getBoundingClientRect().bottom }))
    const popup = await page.getByRole('listbox', { name: 'Font' }).evaluate((el) => {
      const p = el.closest('.absolute')!
      return { r: getComputedStyle(p).borderTopLeftRadius, top: p.getBoundingClientRect().top }
    })
    expect(popup.r).toBe(trigger.r)
    expect(Math.round(popup.top - trigger.bottom)).toBe(4)
  })

  test('the category chip is remembered for the browser session', async ({ page }) => {
    await openFonts(page)
    await page.getByRole('button', { name: 'Serif', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Serif', exact: true })).toHaveAttribute('aria-pressed', 'true')
    await page.keyboard.press('Escape')

    await page.reload() // same tab: the session is kept
    await page.waitForSelector('main section')
    await fontTrigger(page).click()
    await expect(page.getByRole('button', { name: 'Serif', exact: true })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByRole('button', { name: 'All', exact: true })).toHaveAttribute('aria-pressed', 'false')

    // a new tab (a new session) starts from All again
    const fresh = await page.context().newPage()
    await fresh.goto('/#/typography')
    await fresh.waitForSelector('main section')
    await fresh.getByRole('button', { name: /^Font: / }).click()
    await expect(fresh.getByRole('button', { name: 'All', exact: true })).toHaveAttribute('aria-pressed', 'true')
  })

  test('the list scrolls with a thin rail (like On this page), not the native scrollbar', async ({ page }) => {
    await openFonts(page)
    const list = page.getByRole('listbox', { name: 'Font' })
    expect(await list.evaluate((el) => getComputedStyle(el).scrollbarWidth)).toBe('none')
    const rail = page.locator('[data-scroll-rail]')
    await expect(rail).toBeVisible()
    const before = await list.evaluate((el) => el.scrollTop)
    const box = (await rail.boundingBox())!
    await page.mouse.move(box.x + 6, box.y + box.height * 0.3)
    await page.mouse.down()
    await page.mouse.move(box.x + 6, box.y + box.height * 0.8, { steps: 6 })
    await page.mouse.up()
    expect(await list.evaluate((el) => el.scrollTop)).not.toBe(before) // dragging the rail scrolls the list
    await expect(page.getByRole('combobox', { name: /Search/ })).toBeFocused() // and focus stays in the search box
  })

  test('choosing a font applies it', async ({ page }) => {
    await openFonts(page)
    await page.getByRole('combobox', { name: /Search/ }).fill('Roboto')
    await page.getByRole('option', { name: /^Roboto/ }).first().click()
    await expect(fontTrigger(page)).toHaveAttribute('aria-label', /Font: Roboto/)
  })

  for (const mode of ['light', 'dark'] as const) {
    test(`the open dropdown has no accessibility violations · ${mode}`, async ({ page }) => {
      await page.addInitScript((m) => localStorage.setItem('xex-docs-mode', m), mode)
      await openFonts(page)
      await page.waitForTimeout(400)
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
      expect(results.violations.map((v) => `${v.id}: ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(', ')}`)).toEqual([])
    })
  }
})

test.describe('table filter dropdown', () => {
  test('is a Combobox: options, checkmarks, and the same shape as the others', async ({ page }) => {
    await page.goto('/#/controls')
    await page.waitForSelector('#table')
    const roles = page.locator('#table').getByRole('combobox', { name: /All roles/ }).first()
    await roles.scrollIntoViewIfNeeded()
    await roles.click()
    const list = page.getByRole('listbox', { name: /All roles/ })
    await list.getByRole('option', { name: /Admin/ }).click()
    await list.getByRole('option', { name: /Editor/ }).click()
    await expect(page.locator('#table').getByRole('combobox', { name: /Admin, Editor/ }).first()).toHaveText(/Admin, Editor/)
    const radius = await page.getByRole('listbox').evaluate((el) => getComputedStyle(el.closest('.absolute')!).borderTopLeftRadius)
    expect(radius).toBe('8px')
  })
})
