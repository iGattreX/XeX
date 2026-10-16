import { expect, test } from '@playwright/test'

// The Controls page has a bar that, once expanded, shows the code for the control being used.

test.use({ viewport: { width: 1440, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] })

test.beforeEach(async ({ page }) => {
  await page.goto('/#/controls')
  await page.evaluate(() => localStorage.removeItem('xex-docs-code-open'))
  await page.reload()
  await page.waitForSelector('main section')
})

const dock = (page: import('@playwright/test').Page) => page.getByRole('region', { name: 'Code for the control you are using' })

test('is collapsed by default and expands and collapses from the bar', async ({ page }) => {
  const toggle = dock(page).getByRole('button', { name: 'Expand for code' })
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  await toggle.click()
  await expect(dock(page).getByText('Use any control on this page')).toBeVisible()
  await dock(page).getByRole('button', { name: 'Hide code' }).click()
  await expect(dock(page).getByText('Use any control on this page')).toBeHidden()
})

test('shows the code for the control being used, with the props it shows, and copies it', async ({ page }) => {
  await dock(page).getByRole('button', { name: 'Expand for code' }).click()

  await page.getByRole('button', { name: 'danger' }).nth(3).click() // the large danger button
  await expect(dock(page)).toContainText('Button · Buttons')
  await expect(dock(page).locator('pre')).toContainText('<Button variant="danger" size="lg">')

  await page.getByRole('switch').first().focus() // keyboard focus counts as using it
  await expect(dock(page).locator('pre')).toContainText('<Switch')

  await page.getByRole('button', { name: 'Header', exact: true }).click() // a component with no inline demo
  await expect(dock(page).locator('pre')).toContainText('<Header')

  await dock(page).getByRole('button', { name: 'Copy Header code' }).click()
  await expect(dock(page).getByText('Copied')).toBeVisible()
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("import { Header")
})

test('remembers whether it was open', async ({ page }) => {
  await dock(page).getByRole('button', { name: 'Expand for code' }).click()
  await page.reload()
  await expect(dock(page).getByRole('button', { name: 'Hide code' })).toBeVisible()
})

test('names the section, and takes you back to the control with a spotlight that then clears', async ({ page }) => {
  await dock(page).getByRole('button', { name: 'Expand for code' }).click()

  await page.getByRole('switch').first().click()
  await expect(dock(page)).toContainText('Switch · Form controls')

  await page.evaluate(() => window.scrollTo(0, 0)) // scroll away from the control
  await expect(page.getByRole('switch').first()).not.toBeInViewport()

  await dock(page).getByRole('button', { name: 'Show the Switch control' }).click()
  await expect(page.getByRole('switch').first()).toBeInViewport()
  await expect(page.getByRole('switch').first()).toBeFocused()
  const spotlight = page.locator('body > div[aria-hidden="true"].fixed')
  await expect(spotlight).toHaveCount(1)
  await expect(spotlight).toHaveCount(0, { timeout: 5000 }) // everything comes back
})

test('spotlights at once when the control is already on screen', async ({ page }) => {
  await dock(page).getByRole('button', { name: 'Expand for code' }).click()
  await page.getByRole('switch').first().scrollIntoViewIfNeeded()
  await page.getByRole('switch').first().click()
  const started = Date.now()
  await dock(page).getByRole('button', { name: 'Show the Switch control' }).click()
  await expect(page.locator('body > div[aria-hidden="true"].fixed')).toHaveCount(1, { timeout: 250 })
  expect(Date.now() - started).toBeLessThan(400)
})

test('every control on the page has code wired to it', async ({ page }) => {
  // Anything you can press, type in or toggle must sit inside an element that carries its code,
  // so the dock never stays silent. (The page chrome, navigation and the dock itself are excluded.)
  const unwired = await page.evaluate(() => {
    const controls = document.querySelectorAll<HTMLElement>('button, input, select, textarea, a[href], [role="switch"], [role="tab"], [role="radio"], [role="combobox"]')
    return Array.from(controls)
      .filter((el) => !el.matches('a[href="#main-content"]') && !el.closest('header, aside, nav, section[aria-label^="Code for"], a[href="#main-content"]') && !el.closest('[data-code]'))
      .map((el) => `${el.tagName.toLowerCase()} "${(el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 40)}" in ${el.closest('section[id]')?.id ?? '?'}`)
  })
  expect(unwired).toEqual([])
})
