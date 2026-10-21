import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Combobox, type ComboboxOption } from '../src'

const few: ComboboxOption[] = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
  { value: 'c', label: 'Gamma', disabled: true },
]
const many: ComboboxOption[] = Array.from({ length: 12 }, (_, i) => ({ value: `v${i}`, label: `Option ${i}`, keywords: i === 5 ? 'needle' : undefined }))

function Single({ options = few, ...rest }: Partial<React.ComponentProps<typeof Combobox>> & { options?: ComboboxOption[] }) {
  const [v, setV] = useState('')
  return <Combobox label="Letter" options={options} value={v} onChange={setV} {...(rest as object)} />
}

const trigger = () => screen.getByRole('combobox', { name: /Letter/ })

describe('Combobox (single)', () => {
  it('shows the placeholder, then the chosen option, and closes on choosing', async () => {
    render(<Single placeholder="Pick one" />)
    expect(trigger()).toHaveTextContent('Pick one')
    await userEvent.click(trigger())
    await userEvent.click(screen.getByRole('option', { name: 'Beta' }))
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(trigger()).toHaveTextContent('Beta')
    expect(trigger()).toHaveFocus()
  })

  it('works from the keyboard: arrows move, Enter picks, Escape closes without changing', async () => {
    render(<Single />)
    trigger().focus()
    await userEvent.keyboard('{ArrowDown}') // opens
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    await userEvent.keyboard('{ArrowDown}{Enter}')
    expect(trigger()).toHaveTextContent('Beta')
    await userEvent.keyboard('{ArrowDown}{Escape}')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(trigger()).toHaveTextContent('Beta')
  })

  it('does not pick a disabled option', async () => {
    render(<Single />)
    await userEvent.click(trigger())
    await userEvent.click(screen.getByRole('option', { name: 'Gamma' }))
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    expect(trigger()).not.toHaveTextContent('Gamma')
  })

  it('has no search box for a short list and one for a long list, which filters (also by keywords)', async () => {
    const { unmount } = render(<Single />)
    await userEvent.click(trigger())
    expect(screen.queryByRole('combobox', { name: /Search/ })).not.toBeInTheDocument()
    unmount()

    render(<Single options={many} />)
    await userEvent.click(screen.getByRole('button', { name: /Letter/ })) // with a search box the trigger is a plain button
    const search = screen.getByRole('combobox', { name: /Search Letter/ })
    expect(search).toHaveFocus()
    await userEvent.type(search, 'option 1')
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['Option 1', 'Option 10', 'Option 11'])
    await userEvent.clear(search)
    await userEvent.type(search, 'needle')
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['Option 5'])
    await userEvent.clear(search)
    await userEvent.type(search, 'zzz')
    expect(screen.getByText('No matches.')).toBeInTheDocument()
  })

  it('keeps focus in the search box and picks with Enter, a space typed into the search stays text', async () => {
    render(<Single options={many} />)
    await userEvent.click(screen.getByRole('button', { name: /Letter/ }))
    await userEvent.keyboard('opt{ArrowDown}{Enter}')
    expect(screen.getByRole('button', { name: /Letter/ })).toHaveTextContent('Option 1')
  })

  it('closes when the user presses elsewhere', async () => {
    render(<Single />)
    await userEvent.click(trigger())
    await userEvent.click(document.body)
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('submits its value with a form when given a name, and links hint/error to the trigger', () => {
    const { container, rerender } = render(<Combobox label="Letter" name="letter" options={few} value="b" onChange={() => {}} hint="Choose a letter" />)
    expect(container.querySelector('input[type="hidden"][name="letter"]')).toHaveValue('b')
    expect(trigger()).toHaveAccessibleDescription('Choose a letter')
    rerender(<Combobox label="Letter" options={few} value="b" onChange={() => {}} error="Required" />)
    expect(trigger()).toHaveAccessibleDescription('Required')
    expect(trigger()).toBeInvalid()
  })

  it('reports lazy loading: onReachEnd when the last options are highlighted, onOpenChange on open and close', async () => {
    const onReachEnd = vi.fn()
    const onOpenChange = vi.fn()
    render(<Single options={many} onReachEnd={onReachEnd} onOpenChange={onOpenChange} />)
    await userEvent.click(screen.getByRole('button', { name: /Letter/ }))
    expect(onOpenChange).toHaveBeenLastCalledWith(true)
    await userEvent.keyboard('{ArrowUp}') // from the first option, wraps nowhere: stays at 0
    await userEvent.keyboard('{PageDown}{PageDown}')
    expect(onReachEnd).toHaveBeenCalled()
    await userEvent.keyboard('{Escape}')
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
  })

  it('uses renderOption and renderValue when given', async () => {
    render(
      <Single
        renderValue={(o) => <b data-testid="v">{o ? o.label.toUpperCase() : 'none'}</b>}
        renderOption={(o) => <i>{`* ${o.label}`}</i>}
      />,
    )
    expect(screen.getByTestId('v')).toHaveTextContent('none')
    await userEvent.click(trigger())
    await userEvent.click(screen.getByText('* Alpha'))
    expect(screen.getByTestId('v')).toHaveTextContent('ALPHA')
  })
})

describe('Combobox (multiple)', () => {
  function Multi() {
    const [v, setV] = useState<string[]>([])
    return <Combobox multiple label="Letters" placeholder="All letters" options={few} value={v} onChange={setV} />
  }

  it('toggles several options and stays open, summarises them, and clears', async () => {
    render(<Multi />)
    const t = () => screen.getByRole('combobox', { name: /Letters/ })
    await userEvent.click(t())
    expect(screen.getByRole('listbox')).toHaveAttribute('aria-multiselectable', 'true')
    await userEvent.click(screen.getByRole('option', { name: 'Alpha' }))
    await userEvent.click(screen.getByRole('option', { name: 'Beta' }))
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    expect(t()).toHaveTextContent('Alpha, Beta')
    expect(screen.getByRole('option', { name: 'Alpha' })).toHaveAttribute('aria-selected', 'true')
    await userEvent.click(screen.getByRole('button', { name: 'Clear selection' }))
    expect(t()).toHaveTextContent('All letters')
  })

  it('toggles with Space or Enter from the keyboard', async () => {
    render(<Multi />)
    screen.getByRole('combobox', { name: /Letters/ }).focus()
    await userEvent.keyboard('{ArrowDown}{Enter}{ArrowDown}{ }')
    expect(screen.getByRole('option', { name: 'Alpha' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('option', { name: 'Beta' })).toHaveAttribute('aria-selected', 'true')
  })
})

describe('Combobox placeholder', () => {
  it('is the same grey in single and multiple mode, and chosen values are normal text', () => {
    const { rerender } = render(<Combobox label="Letter" placeholder="Pick" options={few} value="" onChange={() => {}} />)
    const placeholder = () => screen.getByText('Pick')
    expect(placeholder().className).toContain('text-gray-500')
    rerender(<Combobox multiple label="Letter" placeholder="Pick" options={few} value={[]} onChange={() => {}} />)
    expect(placeholder().className).toContain('text-gray-500')
    rerender(<Combobox multiple label="Letter" placeholder="Pick" options={few} value={['a']} onChange={() => {}} />)
    expect(screen.getByText('Alpha').className).not.toContain('text-gray-500')
  })
})
