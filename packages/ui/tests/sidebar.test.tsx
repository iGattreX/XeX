import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { HomeIcon } from '@heroicons/react/24/outline'
import { Header, Sidebar, SidebarBrand, useSidebarCollapsed } from '../src'

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

describe('Sidebar brand', () => {
  const base = { items, active: 'a', onSelect: () => {}, open: true, onClose: () => {} }

  it('shows the XeX brand by default', () => {
    render(<Sidebar {...base} />)
    expect(screen.getByText('XeX')).toBeInTheDocument()
  })

  it('SidebarBrand takes an app name and mark', () => {
    render(<Sidebar {...base} brand={<SidebarBrand name="Acme" />} />)
    expect(screen.getByText('Acme')).toBeInTheDocument()
    expect(screen.getByText('A')).toBeInTheDocument() // mark defaults to the first letter
    expect(screen.queryByText('XeX')).not.toBeInTheDocument()
  })

  it('accepts any element as the brand', () => {
    render(<Sidebar {...base} brand={<img src="/logo.svg" alt="Acme logo" />} />)
    expect(screen.getByRole('img', { name: 'Acme logo' })).toBeInTheDocument()
    expect(screen.queryByText('XeX')).not.toBeInTheDocument()
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

describe('Sidebar sub-items', () => {
  it('lists child pages indented under their parent, and selecting one reports it', async () => {
    const onSelect = vi.fn()
    const nested = [
      { id: 'a', label: 'Alpha', icon: HomeIcon, children: [{ id: 'a1', label: 'Alpha options', icon: HomeIcon }] },
      { id: 'b', label: 'Beta', icon: HomeIcon },
    ]
    render(<Sidebar items={nested} active="a1" onSelect={onSelect} open onClose={() => {}} collapsed />)
    expect(screen.getAllByRole('link').map((l) => l.textContent)).toEqual(['Alpha', 'Alpha options', 'Beta'])
    expect(screen.getByRole('link', { name: 'Alpha options' })).toHaveAttribute('aria-current', 'page')
    await userEvent.click(screen.getByRole('link', { name: 'Alpha options' }))
    expect(onSelect).toHaveBeenCalledWith('a1')
  })
})
