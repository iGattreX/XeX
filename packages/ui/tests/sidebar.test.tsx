import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { HomeIcon } from '@heroicons/react/24/outline'
import { Header, Sidebar, useSidebarCollapsed } from '../src'

const items = [
  { id: 'a', label: 'Alpha', icon: HomeIcon },
  { id: 'b', label: 'Beta', icon: HomeIcon },
]

const nav = () => screen.getByRole('complementary', { hidden: true, name: 'Main navigation' })

describe('Sidebar collapse', () => {
  it('has no collapse button unless onToggleCollapse is given', () => {
    render(<Sidebar items={items} active="a" onSelect={() => {}} open={false} onClose={() => {}} />)
    expect(screen.queryByRole('button', { name: /collapse navigation/i, hidden: true })).not.toBeInTheDocument()
  })

  it('is docked by default and offers to collapse', async () => {
    const onToggle = vi.fn()
    render(<Sidebar items={items} active="a" onSelect={() => {}} open={false} onClose={() => {}} onToggleCollapse={onToggle} />)
    expect(nav()).not.toHaveAttribute('data-collapsed')
    expect(nav().className).toContain('lg:sticky') // takes its place in the page at lg+
    await userEvent.click(screen.getByRole('button', { name: 'Collapse navigation', hidden: true }))
    expect(onToggle).toHaveBeenCalledOnce()
  })

  it('when collapsed it leaves the page flow at every width and offers to pin open', async () => {
    const onToggle = vi.fn()
    render(<Sidebar items={items} active="a" onSelect={() => {}} open={false} onClose={() => {}} collapsed onToggleCollapse={onToggle} />)
    expect(nav()).toHaveAttribute('data-collapsed', 'true')
    expect(nav().className).not.toContain('lg:sticky')
    expect(nav().className).not.toContain('lg:visible') // stays out of the tab order while hidden
    await userEvent.click(screen.getByRole('button', { name: 'Keep navigation open', hidden: true }))
    expect(onToggle).toHaveBeenCalledOnce()
  })

  it('opens as a drawer when collapsed: focus goes to the current page, Escape closes', async () => {
    const onClose = vi.fn()
    render(<Sidebar items={items} active="b" onSelect={() => {}} open onClose={onClose} collapsed onToggleCollapse={() => {}} />)
    expect(screen.getByRole('link', { name: 'Beta' })).toHaveFocus()
    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('selecting a page reports it', async () => {
    const onSelect = vi.fn()
    render(<Sidebar items={items} active="a" onSelect={onSelect} open onClose={() => {}} collapsed />)
    await userEvent.click(screen.getByRole('link', { name: 'Beta' }))
    expect(onSelect).toHaveBeenCalledWith('b')
  })
})

describe('Header menu button', () => {
  it('is hidden on wide screens by default and always visible on request', () => {
    const { rerender } = render(<Header title="T" onMenu={() => {}} />)
    expect(screen.getByRole('button', { name: 'Open navigation' }).className).toContain('lg:hidden')
    rerender(<Header title="T" onMenu={() => {}} menuAlwaysVisible />)
    expect(screen.getByRole('button', { name: 'Open navigation' }).className).not.toContain('lg:hidden')
  })
})

describe('useSidebarCollapsed', () => {
  function Probe({ storageKey }: { storageKey?: string }) {
    const [collapsed, setCollapsed] = useSidebarCollapsed(storageKey)
    return <button onClick={() => setCollapsed(!collapsed)}>{collapsed ? 'collapsed' : 'docked'}</button>
  }

  it('remembers the choice under the given key', async () => {
    const { unmount } = render(<Probe storageKey="my-app-nav-collapsed" />)
    expect(screen.getByRole('button')).toHaveTextContent('docked')
    await userEvent.click(screen.getByRole('button'))
    expect(screen.getByRole('button')).toHaveTextContent('collapsed')
    expect(localStorage.getItem('my-app-nav-collapsed')).toBe('1')
    unmount()
    render(<Probe storageKey="my-app-nav-collapsed" />)
    expect(screen.getByRole('button')).toHaveTextContent('collapsed')
  })

  it('does not leak into another app key', () => {
    localStorage.setItem('app-a-nav-collapsed', '1')
    render(<Probe storageKey="app-b-nav-collapsed" />)
    expect(screen.getByRole('button')).toHaveTextContent('docked')
  })
})
