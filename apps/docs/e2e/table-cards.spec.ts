import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

// On a phone the table becomes a list of cards instead of overflowing sideways.

async function open(page: Page, mode: 'light' | 'dark' = 'light') {
  await page.addInitScript((m) => {
    localStorage.setItem('xex-docs-theme', 'classic')
    localStorage.setItem('xex-docs-mode', m)
  }, mode)
  await page.goto('/#/controls')
  await page.waitForSelector('main section')
  await page.locator('#table').scrollIntoViewIfNeeded()
}

const users = (page: Page) => page.locator('#table')

test.describe('phone width', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test('shows cards, does not overflow sideways, and can switch back to the table', async ({ page }) => {
    await open(page)
    await expect(users(page).getByRole('list', { name: 'Users' })).toBeVisible()
    await expect(users(page).getByRole('table')).toHaveCount(0)
    await expect(users(page).getByRole('radio', { name: 'Cards' }).first()).toHaveAttribute('aria-checked', 'true')

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBeLessThanOrEqual(0) // the page itself never scrolls sideways

    await users(page).getByRole('radio', { name: 'Comfortable' }).first().click()
    await expect(users(page).getByRole('table')).toBeVisible()
    await users(page).getByRole('radio', { name: 'Cards' }).first().click()
    await expect(users(page).getByRole('list', { name: 'Users' })).toBeVisible()
  })

  test('sorts the cards from the dropdown', async ({ page }) => {
    await open(page)
    await users(page).getByRole('combobox', { name: 'Sort by' }).selectOption('user')
    const first = users(page).getByRole('list', { name: 'Users' }).getByRole('listitem').first()
    await expect(first).toContainText('Ada Hamilton')
    await users(page).getByRole('button', { name: /switch to descending/i }).click()
    await expect(first).not.toContainText('Ada Hamilton')
  })

  for (const mode of ['light', 'dark'] as const) {
    test(`cards have no accessibility violations · ${mode}`, async ({ page }) => {
      await open(page, mode)
      await page.waitForTimeout(300)
      const results = await new AxeBuilder({ page }).include('#table').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
      expect(results.violations.map((v) => `${v.id}: ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(', ')}`)).toEqual([])
    })
  }
})

test.describe('desktop width', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test('is a table, and Cards is one of the layout options', async ({ page }) => {
    await open(page)
    await expect(users(page).getByRole('table')).toBeVisible()
    await users(page).getByRole('radio', { name: 'Cards' }).first().click()
    await expect(users(page).getByRole('list', { name: 'Users' })).toBeVisible()
  })
})
