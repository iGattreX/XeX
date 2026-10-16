import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Checkbox, Input, RadioGroup, Select, Switch, Textarea } from '../src'

describe('Switch', () => {
  function Demo({ onChange = () => {} }: { onChange?: (v: boolean) => void }) {
    const [on, setOn] = useState(false)
    return <Switch checked={on} onChange={(v) => { setOn(v); onChange(v) }} label="Notifications" />
  }

  it('is a switch named by its label and flips on click, Space and Enter', async () => {
    const onChange = vi.fn()
    render(<Demo onChange={onChange} />)
    const sw = screen.getByRole('switch', { name: 'Notifications' })
    expect(sw).toHaveAttribute('aria-checked', 'false')
    await userEvent.click(sw)
    expect(sw).toHaveAttribute('aria-checked', 'true')
    sw.focus()
    await userEvent.keyboard(' ')
    expect(sw).toHaveAttribute('aria-checked', 'false')
    await userEvent.keyboard('{Enter}')
    expect(onChange).toHaveBeenLastCalledWith(true)
  })

  it('takes an aria-label when there is no visible label, and respects disabled', async () => {
    const onChange = vi.fn()
    render(<Switch checked={false} onChange={onChange} aria-label="Dark mode" disabled />)
    await userEvent.click(screen.getByRole('switch', { name: 'Dark mode' }))
    expect(onChange).not.toHaveBeenCalled()
  })
})

describe('Checkbox', () => {
  it('is labelled, toggles, and links its error', async () => {
    const { rerender } = render(<Checkbox label="I agree" />)
    const box = screen.getByRole('checkbox', { name: 'I agree' })
    await userEvent.click(box)
    expect(box).toBeChecked()
    rerender(<Checkbox label="I agree" error="Required" />)
    expect(screen.getByRole('checkbox', { name: 'I agree' })).toHaveAccessibleDescription('Required')
    expect(screen.getByRole('checkbox', { name: 'I agree' })).toBeInvalid()
  })
})

describe('RadioGroup', () => {
  function Demo() {
    const [v, setV] = useState('free')
    return (
      <RadioGroup label="Plan" value={v} onChange={setV} options={[{ value: 'free', label: 'Free' }, { value: 'pro', label: 'Pro' }, { value: 'team', label: 'Team' }]} />
    )
  }

  it('is a named group of radios; the arrow keys move and select', async () => {
    render(<Demo />)
    expect(screen.getByRole('group', { name: 'Plan' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Free' })).toBeChecked()
    screen.getByRole('radio', { name: 'Free' }).focus()
    await userEvent.keyboard('{ArrowDown}')
    expect(screen.getByRole('radio', { name: 'Pro' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Pro' })).toHaveFocus()
    await userEvent.click(screen.getByRole('radio', { name: 'Team' }))
    expect(screen.getByRole('radio', { name: 'Team' })).toBeChecked()
  })
})

describe('Textarea', () => {
  it('is labelled, accepts typing, and describes its hint or error', async () => {
    const { rerender } = render(<Textarea label="Notes" hint="Optional" />)
    const field = screen.getByRole('textbox', { name: 'Notes' })
    await userEvent.type(field, 'hello')
    expect(field).toHaveValue('hello')
    expect(field).toHaveAccessibleDescription('Optional')
    rerender(<Textarea label="Notes" error="Too short" />)
    expect(screen.getByRole('textbox', { name: 'Notes' })).toHaveAccessibleDescription('Too short')
    expect(screen.getByRole('textbox', { name: 'Notes' })).toBeInvalid()
  })
})

describe('Input and Select hints', () => {
  it('link their hint and error to the field so screen readers read them', () => {
    const { rerender } = render(<Input label="Name" hint="At least 3 characters" />)
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveAccessibleDescription('At least 3 characters')
    rerender(<Input label="Name" error="Too short" />)
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveAccessibleDescription('Too short')

    const options = [{ value: 'a', label: 'A' }]
    const view = render(<Select label="Role" options={options} hint="Pick one" />)
    expect(screen.getByRole('combobox', { name: 'Role' })).toHaveAccessibleDescription('Pick one')
    view.rerender(<Select label="Role" options={options} error="Required" />)
    expect(screen.getByRole('combobox', { name: 'Role' })).toHaveAccessibleDescription('Required')
  })
})
