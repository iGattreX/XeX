import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Tabs } from '../src'

const items = [
  { id: 'a', label: 'Alpha', content: 'Panel A' },
  { id: 'b', label: 'Beta', content: 'Panel B' },
  { id: 'c', label: 'Gamma', disabled: true, content: 'Panel C' },
  { id: 'd', label: 'Delta', content: 'Panel D' },
]

describe('Tabs', () => {
  it('selects the first tab, shows only its panel, and has a single Tab stop', () => {
    render(<Tabs label="Sections" items={items} />)
    expect(screen.getByRole('tab', { name: 'Alpha' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Panel A')
    const stops = screen.getAllByRole('tab').filter((t) => t.tabIndex === 0)
    expect(stops).toHaveLength(1)
  })

  it('links each tab to its panel', () => {
    render(<Tabs label="Sections" items={items} />)
    const tab = screen.getByRole('tab', { name: 'Alpha' })
    const panel = screen.getByRole('tabpanel')
    expect(tab).toHaveAttribute('aria-controls', panel.id)
    expect(panel).toHaveAttribute('aria-labelledby', tab.id)
  })

  it('moves and selects with the arrow keys, skipping disabled tabs and wrapping', async () => {
    render(<Tabs label="Sections" items={items} />)
    screen.getByRole('tab', { name: 'Alpha' }).focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'Beta' })).toHaveFocus()
    await userEvent.keyboard('{ArrowRight}') // Gamma is disabled
    expect(screen.getByRole('tab', { name: 'Delta' })).toHaveFocus()
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Panel D')
    await userEvent.keyboard('{ArrowRight}') // wraps
    expect(screen.getByRole('tab', { name: 'Alpha' })).toHaveFocus()
    await userEvent.keyboard('{End}')
    expect(screen.getByRole('tab', { name: 'Delta' })).toHaveFocus()
    await userEvent.keyboard('{Home}')
    expect(screen.getByRole('tab', { name: 'Alpha' })).toHaveFocus()
  })

  it('manual activation: arrows move focus only; Enter selects', async () => {
    render(<Tabs label="Sections" items={items} activation="manual" />)
    screen.getByRole('tab', { name: 'Alpha' }).focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'Beta' })).toHaveFocus()
    expect(screen.getByRole('tab', { name: 'Alpha' })).toHaveAttribute('aria-selected', 'true')
    await userEvent.keyboard('{Enter}')
    expect(screen.getByRole('tab', { name: 'Beta' })).toHaveAttribute('aria-selected', 'true')
  })

  it('works controlled', async () => {
    const onChange = vi.fn()
    render(<Tabs label="Sections" items={items} value="b" onChange={onChange} />)
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Panel B')
    await userEvent.click(screen.getByRole('tab', { name: 'Alpha' }))
    expect(onChange).toHaveBeenCalledWith('a')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Panel B') // parent has not changed `value`
  })

  it('keepMounted keeps inactive panels in the DOM, hidden', () => {
    render(<Tabs label="Sections" items={items} keepMounted />)
    expect(screen.getAllByRole('tabpanel', { hidden: true })).toHaveLength(4)
    expect(screen.getAllByRole('tabpanel')).toHaveLength(1)
  })
})
