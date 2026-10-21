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

// Row details: a side panel beside the table, or in place of the list on a phone, with Back.

test.describe('row details · desktop', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test('opens beside the table; closing returns focus to the row', async ({ page }) => {
    await open(page)
    await users(page).getByRole('button', { name: 'Ada Hamilton' }).click()
    const panel = users(page).getByRole('region', { name: 'Ada Hamilton' })
    await expect(panel).toBeVisible()
    await expect(users(page).getByRole('table')).toBeVisible() // the list stays beside it
    await expect(panel.getByRole('textbox', { name: 'Name' })).toHaveValue('Ada Hamilton') // the demo's form

    await page.keyboard.press('Escape')
    await expect(panel).toHaveCount(0)
    await expect(users(page).getByRole('button', { name: 'Ada Hamilton' })).toBeFocused()
  })

  test('"Does nothing" makes rows inert and "Shows read-only details" has no fields', async ({ page }) => {
    await open(page)
    await users(page).getByRole('radio', { name: 'Does nothing' }).click()
    await expect(users(page).locator('[data-open-trigger]')).toHaveCount(0)
    await users(page).getByRole('radio', { name: 'Shows read-only details' }).click()
    await users(page).getByRole('button', { name: 'Grace Thompson' }).click()
    const panel = users(page).getByRole('region', { name: 'Grace Thompson' })
    await expect(panel.getByRole('term')).toHaveCount(4)
    await expect(panel.getByRole('textbox')).toHaveCount(0)
  })

  for (const mode of ['light', 'dark'] as const) {
    test(`the open panel has no accessibility violations · ${mode}`, async ({ page }) => {
      await open(page, mode)
      await users(page).getByRole('button', { name: 'Ada Hamilton' }).click()
      await expect(users(page).getByRole('region', { name: 'Ada Hamilton' })).toBeVisible()
      await page.waitForTimeout(300)
      const results = await new AxeBuilder({ page }).include('#table').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
      expect(results.violations.map((v) => `${v.id}: ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(', ')}`)).toEqual([])
    })
  }
})

test.describe('row details · phone', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test('a card opens the details in place of the list, and Back restores it', async ({ page }) => {
    await open(page)
    await users(page).getByRole('button', { name: 'Grace Thompson' }).click()
    await expect(users(page).getByRole('region', { name: 'Grace Thompson' })).toBeVisible()
    await expect(users(page).getByRole('list', { name: 'Users' })).toHaveCount(0)
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0)

    await users(page).getByRole('button', { name: 'Back to Users' }).click()
    await expect(users(page).getByRole('list', { name: 'Users' })).toBeVisible()
    await expect(users(page).getByRole('button', { name: 'Grace Thompson' })).toBeFocused()
  })
})
