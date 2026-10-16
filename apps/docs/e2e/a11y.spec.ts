import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { themes } from '@xex/tokens'

// Real-browser accessibility checks, including colour contrast, which jsdom cannot do.
// Every theme x light/dark on the Controls page (the one with every component), and the other
// pages in the default theme.

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

async function open(page: Page, route: string, theme: string, mode: 'light' | 'dark') {
  await page.addInitScript(
    ([t, m]) => {
      localStorage.setItem('xex-docs-theme', t)
      localStorage.setItem('xex-docs-mode', m)
    },
    [theme, mode],
  )
  await page.goto(`/#/${route}`)
  await page.waitForSelector('main section')
  await expect(page.locator('html')).toHaveAttribute('data-mode', mode)
  await page.waitForTimeout(300) // let transitions and the lazy page settle
}

async function violations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze()
  return results.violations.map((v) => ({
    rule: v.id,
    impact: v.impact,
    help: v.help,
    nodes: v.nodes.slice(0, 5).map((n) => `${n.target.join(' ')} — ${n.failureSummary?.split('\n')[1]?.trim() ?? ''}`),
  }))
}

for (const mode of ['light', 'dark'] as const) {
  for (const theme of themes) {
    test(`controls · ${theme.id} · ${mode}`, async ({ page }) => {
      await open(page, 'controls', theme.id, mode)
      expect(await violations(page)).toEqual([])
    })
  }

  for (const route of ['components', 'typography', 'icons']) {
    test(`${route} · classic · ${mode}`, async ({ page }) => {
      await open(page, route, 'classic', mode)
      expect(await violations(page)).toEqual([])
    })
  }
}

// Overlays only exist while open, so open each one and check it too.
for (const mode of ['light', 'dark'] as const) {
  test(`open overlays · classic · ${mode}`, async ({ page }) => {
    await open(page, 'controls', 'classic', mode)

    await page.getByRole('button', { name: 'Modal md' }).click()
    await expect(page.getByRole('dialog', { name: 'Modal · md' })).toBeVisible()
    expect(await violations(page)).toEqual([])
    await page.keyboard.press('Escape')

    await page.getByRole('button', { name: 'Delete project…' }).click()
    await expect(page.getByRole('dialog', { name: 'Delete this project?' })).toBeVisible()
    expect(await violations(page)).toEqual([])
    await page.keyboard.press('Escape')

    await page.getByRole('button', { name: 'All roles' }).first().click()
    await expect(page.getByRole('group', { name: 'All roles' })).toBeVisible()
    expect(await violations(page)).toEqual([])
  })
}
