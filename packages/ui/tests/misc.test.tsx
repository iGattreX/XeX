import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { MultiSelect, SegmentedControl, pageWindow } from '../src'

describe('pageWindow', () => {
  it('lists every page when there are few', () => {
    expect(pageWindow(1, 5)).toEqual([1, 2, 3, 4, 5])
  })
  it('collapses long ranges with ellipses around the current page', () => {
    expect(pageWindow(1, 20)).toEqual([1, 2, null, 20])
    expect(pageWindow(10, 20)).toEqual([1, null, 9, 10, 11, null, 20])
    expect(pageWindow(20, 20)).toEqual([1, null, 19, 20])
  })
})

describe('SegmentedControl', () => {
  function Seg() {
    const [v, setV] = useState<'a' | 'b'>('a')
    return (
      <SegmentedControl
        label="Density"
        value={v}
        onChange={setV}
        options={[
          { value: 'a', label: 'Comfortable' },
          { value: 'b', label: 'Compact' },
        ]}
      />
    )
  }
  it('moves the selection with arrow keys', async () => {
    render(<Seg />)
    screen.getByRole('radio', { name: 'Comfortable' }).focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByRole('radio', { name: 'Compact' })).toHaveAttribute('aria-checked', 'true')
  })
})

describe('MultiSelect', () => {
  function Multi() {
    const [v, setV] = useState<string[]>([])
    return (
      <MultiSelect
        label="All roles"
        value={v}
        onChange={setV}
        options={[
          { value: 'a', label: 'Admin' },
          { value: 'e', label: 'Editor' },
          { value: 'v', label: 'Viewer' },
        ]}
      />
    )
  }
  it('summarises the selection and closes on Escape', async () => {
    render(<Multi />)
    await userEvent.click(screen.getByRole('button', { name: 'All roles' }))
    await userEvent.click(screen.getByRole('checkbox', { name: 'Admin' }))
    await userEvent.click(screen.getByRole('checkbox', { name: 'Editor' }))
    expect(screen.getByRole('button', { name: /Admin, Editor/ })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('checkbox', { name: 'Viewer' }))
    expect(screen.getByRole('button', { name: /Admin, Editor, Viewer/ })).toHaveTextContent('3 selected')
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('group')).not.toBeInTheDocument()
  })
  it('clears the selection', async () => {
    render(<Multi />)
    await userEvent.click(screen.getByRole('button', { name: 'All roles' }))
    await userEvent.click(screen.getByRole('checkbox', { name: 'Admin' }))
    await userEvent.click(screen.getByRole('button', { name: 'Clear selection' }))
    expect(screen.getByRole('button', { name: 'All roles' })).toBeInTheDocument()
  })
})
