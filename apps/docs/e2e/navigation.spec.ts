import { expect, test } from '@playwright/test'

// The left navigation can be collapsed on a wide screen to give the page more room, behaving as it
// does on a narrow screen (hidden, opened from the header's menu button).

test.use({ viewport: { width: 1440, height: 900 } })

const nav = (page: import('@playwright/test').Page) => page.getByRole('complementary', { name: 'Main navigation' })

test.beforeEach(async ({ page }) => {
  await page.goto('/#/controls')
  await page.evaluate(() => localStorage.removeItem('xex-docs-nav-collapsed'))
  await page.reload()
  await page.waitForSelector('main section')
})

test('collapsing the navigation gives the page more room, and it is remembered', async ({ page }) => {
  const main = page.locator('main')
  const dockedWidth = (await main.boundingBox())!.width
  await expect(nav(page)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Open navigation' })).toBeHidden() // no menu button while docked

  await page.getByRole('button', { name: 'Collapse navigation' }).click()
  await expect(nav(page)).toBeHidden()
  await expect(page.getByRole('button', { name: 'Open navigation' })).toBeVisible()
  await expect.poll(async () => (await main.boundingBox())!.width).toBeGreaterThan(dockedWidth + 150)

  await page.reload()
  await page.waitForSelector('main section')
  await expect(nav(page)).toBeHidden() // still collapsed after a reload
})

test('a collapsed navigation opens as a drawer and can be pinned open again', async ({ page }) => {
  await page.getByRole('button', { name: 'Collapse navigation' }).click()
  await page.getByRole('button', { name: 'Open navigation' }).click()
  await expect(nav(page)).toBeVisible()
  await expect(nav(page).getByRole('link', { name: 'Controls' })).toBeFocused()

  await page.keyboard.press('Escape')
  await expect(nav(page)).toBeHidden()
  await expect(page.getByRole('button', { name: 'Open navigation' })).toBeFocused() // focus returns to the opener

  await page.getByRole('button', { name: 'Open navigation' }).click()
  await nav(page).getByRole('link', { name: 'Typography' }).click()
  await expect(page).toHaveURL(/#\/typography/)
  await expect(nav(page)).toBeHidden() // choosing a page closes the drawer

  await page.getByRole('button', { name: 'Open navigation' }).click()
  await page.getByRole('button', { name: 'Keep navigation open' }).click()
  await expect(nav(page)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Open navigation' })).toBeHidden()
})
