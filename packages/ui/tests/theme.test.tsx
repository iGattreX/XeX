import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { themes } from '@xex/tokens'
import { ThemeProvider, ThemeSwitcher, useTheme } from '../src'

function Probe() {
  const { theme, mode, toggleMode, setThemeId } = useTheme()
  return (
    <>
      <p data-testid="state">
        {theme.id}/{mode}
      </p>
      <button onClick={toggleMode}>toggle</button>
      <button onClick={() => setThemeId('sunset')}>sunset</button>
      <button onClick={() => setThemeId('nope')}>bogus</button>
    </>
  )
}

const root = () => document.documentElement

describe('ThemeProvider', () => {
  it('writes every brand shade onto <html>', () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    )
    const classic = themes.find((t) => t.id === 'classic')!
    expect(root().style.getPropertyValue('--brand-600')).toBe(classic.shades[600])
    expect(root().style.getPropertyValue('--brand-50')).toBe(classic.shades[50])
  })

  it('switches theme, persists it under the app prefix, and falls back for unknown ids', async () => {
    render(
      <ThemeProvider storagePrefix="my-app">
        <Probe />
      </ThemeProvider>,
    )
    await userEvent.click(screen.getByText('sunset'))
    expect(screen.getByTestId('state')).toHaveTextContent('sunset/')
    expect(root().style.getPropertyValue('--brand-600')).toBe(themes.find((t) => t.id === 'sunset')!.shades[600])
    expect(localStorage.getItem('my-app-theme')).toBe('sunset')
    expect(localStorage.getItem('xex-theme')).toBeNull() // another app's key is untouched
    await userEvent.click(screen.getByText('bogus'))
    expect(screen.getByTestId('state')).toHaveTextContent('classic/') // default
  })

  it('restores a saved theme and mode', () => {
    localStorage.setItem('my-app-theme', 'teal')
    localStorage.setItem('my-app-mode', 'dark')
    render(
      <ThemeProvider storagePrefix="my-app">
        <Probe />
      </ThemeProvider>,
    )
    expect(screen.getByTestId('state')).toHaveTextContent('teal/dark')
    expect(root().dataset.mode).toBe('dark')
  })

  it('toggles dark mode on <html>', async () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    )
    expect(root().dataset.mode).toBe('light')
    await userEvent.click(screen.getByText('toggle'))
    expect(root().dataset.mode).toBe('dark')
    expect(root().classList.contains('dark')).toBe(true)
  })

  it('offers custom themes and a custom default', () => {
    const custom = [{ id: 'mine', name: 'Mine', shades: themes[0].shades }]
    render(
      <ThemeProvider themes={custom} defaultThemeId="mine">
        <Probe />
      </ThemeProvider>,
    )
    expect(screen.getByTestId('state')).toHaveTextContent('mine/')
  })
})

describe('ThemeSwitcher', () => {
  it('is one Tab stop and arrow keys change the theme', async () => {
    render(
      <ThemeProvider>
        <ThemeSwitcher />
      </ThemeProvider>,
    )
    const group = screen.getByRole('radiogroup', { name: 'Color theme' })
    const radios = Array.from(group.querySelectorAll<HTMLElement>('[role="radio"]'))
    expect(radios.filter((r) => r.tabIndex === 0)).toHaveLength(1)
    radios[0].focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(radios[1]).toHaveFocus()
    expect(radios[1]).toHaveAttribute('aria-checked', 'true')
  })
})
