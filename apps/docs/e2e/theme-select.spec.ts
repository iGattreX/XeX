import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { themes } from '@xex/tokens'

// The header's theme dropdown (names with their primary colours) and its separate light/dark button.

test.use({ viewport: { width: 1440, height: 900 } })

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('xex-docs-theme', 'classic')
    localStorage.setItem('xex-docs-mode', 'light')
  })
  await page.goto('/#/controls')
  await page.waitForSelector('main section')
})

const header = (page: import('@playwright/test').Page) => page.locator('header')

test('the header has a theme dropdown and a separate dark mode button', async ({ page }) => {
  const select = header(page).getByRole('combobox', { name: 'Color theme: Classic' })
  await expect(select).toBeVisible()
  await select.click()
  const options = page.getByRole('listbox', { name: 'Color theme' }).getByRole('option')
  await expect(options).toHaveCount(themes.length)
  await expect(options.first()).toContainText(themes[0].name)

  await page.getByRole('option', { name: 'Forest' }).click()
  await expect(header(page).getByRole('combobox', { name: 'Color theme: Forest' })).toBeVisible()

  await header(page).getByRole('button', { name: 'Switch to dark mode' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-mode', 'dark')
  await expect(header(page).getByRole('combobox', { name: 'Color theme: Forest' })).toBeVisible() // theme kept
})

for (const mode of ['light', 'dark'] as const) {
  test(`the open dropdown has no accessibility violations · ${mode}`, async ({ page }) => {
    if (mode === 'dark') await header(page).getByRole('button', { name: 'Switch to dark mode' }).click()
    await header(page).getByRole('combobox').click()
    await expect(page.getByRole('listbox')).toBeVisible()
    await page.waitForTimeout(300)
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(', ')}`)).toEqual([])
  })
}
