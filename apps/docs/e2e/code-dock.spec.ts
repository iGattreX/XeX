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

test('spotlights at once, without scrolling, when the control is already on screen', async ({ page }) => {
  await dock(page).getByRole('button', { name: 'Expand for code' }).click()
  await page.getByRole('switch').first().scrollIntoViewIfNeeded()
  await page.getByRole('switch').first().click()
  const before = await page.evaluate(() => window.scrollY)
  await dock(page).getByRole('button', { name: 'Show the Switch control' }).click()
  // no scroll to wait for: the spotlight is there on the next frames
  await expect(page.locator('body > div[aria-hidden="true"].fixed')).toHaveCount(1, { timeout: 1000 })
  expect(await page.evaluate(() => window.scrollY)).toBe(before)
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

test('each section shows the code of the very control used, labels and props included', async ({ page }) => {
  await dock(page).getByRole('button', { name: 'Expand for code' }).click()
  const code = dock(page).locator('pre')
  const press = async (selector: string) => {
    await page.locator(selector).first().dispatchEvent('pointerdown')
    await expect(code).toBeVisible()
  }

  await press('[data-code="Badge"][data-code-label="warning"]')
  await expect(code).toContainText('<Badge variant="warning">warning</Badge>')

  await press('[data-code="Tabs"][data-code-props="pills"]')
  await expect(code).toContainText('variant="pills"')
  await expect(code).toContainText("{ id: 'month', label: 'Month', badge: 3")

  await press('[data-code="Spinner"][data-code-props=\'size="xl"\']')
  await expect(code).toContainText('<Spinner size="xl" />')

  await press('[data-code="StatCard"][data-code-props="stat-rose"]')
  await expect(code).toContainText('stat-rose')
  await expect(code).toContainText('Churned')
  await expect(code).toContainText('12')

  await press('[data-code="Alert"][data-code-props="warning"]')
  await expect(code).toContainText('<ExclamationCircleIcon')
  await expect(code).toContainText("from '@heroicons/react/20/solid'")
  await expect(code).toContainText('Your trial ends in 3 days.')

  await press('[data-code="Button"][data-code-label="Remove"]')
  await expect(code).toContainText('>Remove</Button>')

  await press('[data-code="Modal"][data-code-props=\'size="lg"\']')
  await expect(code).toContainText('title="Modal · lg"')

  await press('[data-code="ProgressBar"][data-code-props*="Storage"]')
  await expect(code).toContainText('tone="warning"')
})

test('the spotlight finds controls wrapped without a box of their own', async ({ page }) => {
  await dock(page).getByRole('button', { name: 'Expand for code' }).click()
  await page.locator('[data-code="Skeleton"]').first().dispatchEvent('pointerdown')
  await dock(page).getByRole('button', { name: 'Show the Skeleton control' }).click()
  const hole = page.locator('body > div[aria-hidden="true"].fixed')
  await expect(hole).toHaveCount(1)
  const box = (await hole.boundingBox())!
  expect(box.width).toBeGreaterThan(20) // a real area around the skeleton, not an empty box
  expect(box.height).toBeGreaterThan(20)
})
