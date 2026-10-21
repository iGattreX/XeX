import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { DataTable, type DataTableColumn } from '../src'

interface Row {
  id: number
  name: string
  role: string
  seats: number
}
const rows: Row[] = [
  { id: 1, name: 'Ada', role: 'Admin', seats: 10 },
  { id: 2, name: 'Bob', role: 'Editor', seats: 2 },
  { id: 3, name: 'Cy', role: 'Viewer', seats: 33 },
  { id: 4, name: 'Dee', role: 'Admin', seats: 4 },
  { id: 5, name: 'Eve', role: 'Editor', seats: 100 },
]
const columns: DataTableColumn<Row>[] = [
  { id: 'name', header: 'Name', accessor: (r) => r.name },
  { id: 'role', header: 'Role', accessor: (r) => r.role, filter: true },
  { id: 'seats', header: 'Seats', accessor: (r) => r.seats },
]

const names = () =>
  within(screen.getByRole('table'))
    .getAllByRole('row')
    .slice(1)
    .map((r) => within(r).getAllByRole('cell')[0].textContent)

const header = (name: string) => screen.getByRole('columnheader', { name: new RegExp(name, 'i') })

describe('DataTable', () => {
  it('renders every row', () => {
    render(<DataTable label="People" rows={rows} columns={columns} rowKey={(r) => r.id} />)
    expect(names()).toEqual(['Ada', 'Bob', 'Cy', 'Dee', 'Eve'])
  })

  it('sorts asc -> desc -> none with aria-sort, using numeric order for numbers', async () => {
    render(<DataTable label="People" rows={rows} columns={columns} rowKey={(r) => r.id} />)
    const seats = within(header('Seats')).getByRole('button')
    await userEvent.click(seats)
    expect(header('Seats')).toHaveAttribute('aria-sort', 'ascending')
    expect(names()).toEqual(['Bob', 'Dee', 'Ada', 'Cy', 'Eve']) // 2 4 10 33 100, not "10" < "2"
    await userEvent.click(seats)
    expect(header('Seats')).toHaveAttribute('aria-sort', 'descending')
    expect(names()[0]).toBe('Eve')
    await userEvent.click(seats)
    expect(header('Seats')).toHaveAttribute('aria-sort', 'none')
    expect(names()).toEqual(['Ada', 'Bob', 'Cy', 'Dee', 'Eve'])
  })

  it('searches across columns and can be cleared', async () => {
    render(<DataTable label="People" rows={rows} columns={columns} rowKey={(r) => r.id} />)
    await userEvent.type(screen.getByRole('textbox', { name: /search/i }), 'edit')
    expect(names()).toEqual(['Bob', 'Eve']) // role "Editor"
    expect(screen.getByRole('status')).toHaveTextContent('2 of 5 rows')
    await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }))
    expect(names()).toHaveLength(5)
  })

  it('filters a column with several values at once (multi-select)', async () => {
    render(<DataTable label="People" rows={rows} columns={columns} rowKey={(r) => r.id} />)
    await userEvent.click(screen.getByRole('combobox', { name: /any role/i }))
    await userEvent.click(screen.getByRole('option', { name: /Admin/ }))
    await userEvent.click(screen.getByRole('option', { name: /Viewer/ }))
    expect(names()).toEqual(['Ada', 'Cy', 'Dee'])
  })

  it('shows an empty state with a way out', async () => {
    render(<DataTable label="People" rows={rows} columns={columns} rowKey={(r) => r.id} />)
    await userEvent.type(screen.getByRole('textbox', { name: /search/i }), 'zzz')
    expect(screen.getByText(/No rows match/)).toBeInTheDocument()
  })

  it('paginates and resets to page 1 when the filter changes', async () => {
    const many = Array.from({ length: 12 }, (_, i) => ({ id: i + 1, name: `User ${i + 1}`, role: 'Admin', seats: i }))
    render(<DataTable label="People" rows={many} columns={columns} rowKey={(r) => r.id} defaultPageSize={5} />)
    expect(names()).toHaveLength(5)
    await userEvent.click(screen.getAllByRole('button', { name: '2' })[0])
    expect(names()[0]).toBe('User 6')
    await userEvent.type(screen.getByRole('textbox', { name: /search/i }), 'User 1')
    expect(names()[0]).toBe('User 1')
  })
})

describe('DataTable cards layout', () => {
  const cardColumns: DataTableColumn<Row>[] = [
    { id: 'name', header: 'Name', accessor: (r) => r.name },
    { id: 'role', header: 'Role', accessor: (r) => r.role, cardLabel: 'Their role', filter: true },
    { id: 'seats', header: 'Seats', accessor: (r) => r.seats, hideInCards: true },
  ]
  const cardNames = () => within(screen.getByRole('list', { name: 'People' })).getAllByRole('listitem').map((li) => li.querySelector('div')!.textContent)
  const layout = () => screen.getAllByRole('radiogroup', { name: 'Row layout' })[0] // one above, one below

  it('offers Comfortable, Compact and Cards in one control (a table until Cards is chosen)', async () => {
    render(<DataTable label="People" rows={rows} columns={cardColumns} rowKey={(r) => r.id} />)
    expect(within(layout()).getAllByRole('radio').map((r) => r.textContent)).toEqual(['Comfortable', 'Compact', 'Cards'])
    expect(screen.getByRole('table')).toBeInTheDocument()
    await userEvent.click(within(layout()).getByRole('radio', { name: 'Cards' }))
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(cardNames()).toEqual(['Ada', 'Bob', 'Cy', 'Dee', 'Eve'])
    await userEvent.click(within(layout()).getByRole('radio', { name: 'Compact' }))
    expect(screen.getByRole('table')).toBeInTheDocument()
  })

  it('shows the first column as the title and the rest as label/value pairs, honouring cardLabel and hideInCards', async () => {
    render(<DataTable label="People" rows={rows} columns={cardColumns} rowKey={(r) => r.id} cards="always" />)
    const first = within(screen.getByRole('list', { name: 'People' })).getAllByRole('listitem')[0]
    expect(first).toHaveTextContent('Ada')
    expect(within(first).getByText('Their role')).toBeInTheDocument()
    expect(within(first).getByText('Admin')).toBeInTheDocument()
    expect(within(first).queryByText('Seats')).not.toBeInTheDocument() // hidden in cards
    expect(screen.queryByRole('radiogroup', { name: 'Row layout' })).not.toBeInTheDocument() // always: no toggle
  })

  it('sorts from a dropdown and a direction button, since there are no column headers', async () => {
    render(<DataTable label="People" rows={rows} columns={cardColumns} rowKey={(r) => r.id} cards="always" />)
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Sort by' }), 'name')
    expect(cardNames()).toEqual(['Ada', 'Bob', 'Cy', 'Dee', 'Eve'])
    await userEvent.click(screen.getByRole('button', { name: /switch to descending/i }))
    expect(cardNames()).toEqual(['Eve', 'Dee', 'Cy', 'Bob', 'Ada'])
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Sort by' }), '')
    expect(screen.queryByRole('button', { name: /switch to/i })).not.toBeInTheDocument()
  })

  it('keeps searching and shows the empty message as a card', async () => {
    render(<DataTable label="People" rows={rows} columns={cardColumns} rowKey={(r) => r.id} cards="always" />)
    await userEvent.type(screen.getByRole('textbox', { name: 'Search People' }), 'zzz')
    expect(screen.getByText('No rows match your filters.')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Clear filters' }).length).toBeGreaterThan(0) // toolbar and empty card
  })

  it('cards="never" keeps the table and offers only the two densities', () => {
    render(<DataTable label="People" rows={rows} columns={cardColumns} rowKey={(r) => r.id} cards="never" />)
    expect(within(layout()).getAllByRole('radio').map((r) => r.textContent)).toEqual(['Comfortable', 'Compact'])
    expect(screen.getByRole('table')).toBeInTheDocument()
  })
})

describe('DataTable row details', () => {
  const open = (name: string) => userEvent.click(screen.getByRole('button', { name }))
  const panel = (name: string) => screen.getByRole('region', { name })

  it('rows do nothing when no detail is given', async () => {
    render(<DataTable label="People" rows={rows} columns={columns} rowKey={(r) => r.id} />)
    expect(document.querySelector('[data-open-trigger]')).toBeNull()
    await userEvent.click(screen.getByText('Ada'))
    expect(screen.queryByRole('region')).not.toBeInTheDocument()
  })

  it('opens a read-only list of every column in a panel beside the table, and moves focus to it', async () => {
    render(<DataTable label="People" rows={rows} columns={columns} rowKey={(r) => r.id} detail />)
    await open('Ada')
    const p = panel('Ada')
    expect(within(p).getAllByRole('term').map((t) => t.textContent)).toEqual(['Name', 'Role', 'Seats'])
    expect(within(p).queryByRole('textbox')).not.toBeInTheDocument() // read-only
    expect(screen.getByRole('table')).toBeInTheDocument() // the list stays
    expect(within(p).getByRole('heading', { name: 'Ada' })).toHaveFocus()
    expect(screen.getByRole('button', { name: 'Ada', expanded: true })).toBeInTheDocument()
  })

  it('opens when the row is clicked, not only its button, and switching rows swaps the panel', async () => {
    render(<DataTable label="People" rows={rows} columns={columns} rowKey={(r) => r.id} detail />)
    await userEvent.click(screen.getByText('Bob')) // the row's text, not the button
    expect(panel('Bob')).toBeInTheDocument()
    await open('Cy')
    expect(panel('Cy')).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Bob' })).not.toBeInTheDocument()
  })

  it('closes with the X or Escape and returns focus to the row that was opened', async () => {
    render(<DataTable label="People" rows={rows} columns={columns} rowKey={(r) => r.id} detail />)
    await open('Dee')
    await userEvent.click(screen.getByRole('button', { name: 'Close details for Dee' }))
    expect(screen.queryByRole('region')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Dee' })).toHaveFocus()

    await open('Eve')
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('region')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Eve' })).toHaveFocus()
  })

  it('renders your own content (a form) when detail is a function', async () => {
    render(
      <DataTable label="People" rows={rows} columns={columns} rowKey={(r) => r.id} detail={(r) => <input aria-label="Edit name" defaultValue={r.name} />} detailTitle={(r) => `Edit ${r.name}`} />,
    )
    await open('Ada')
    expect(within(panel('Edit Ada')).getByRole('textbox', { name: 'Edit name' })).toHaveValue('Ada')
  })

  it('on cards the details replace the list, with a Back button that restores it', async () => {
    render(<DataTable label="People" rows={rows} columns={columns} rowKey={(r) => r.id} cards="always" detail />)
    await open('Bob')
    expect(screen.queryByRole('list', { name: 'People' })).not.toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: 'Search People' })).not.toBeInTheDocument() // toolbar hidden too
    expect(within(panel('Bob')).getByRole('heading', { name: 'Bob' })).toHaveFocus()
    await userEvent.click(screen.getByRole('button', { name: 'Back to People' }))
    expect(screen.getByRole('list', { name: 'People' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Bob' })).toHaveFocus()
  })

  it('keeps the search while details are open and after going back', async () => {
    render(<DataTable label="People" rows={rows} columns={columns} rowKey={(r) => r.id} cards="always" detail />)
    await userEvent.type(screen.getByRole('textbox', { name: 'Search People' }), 'Ev') // only Eve
    await open('Eve')
    await userEvent.click(screen.getByRole('button', { name: 'Back to People' }))
    expect(screen.getByRole('textbox', { name: 'Search People' })).toHaveValue('Ev')
    expect(within(screen.getByRole('list', { name: 'People' })).getAllByRole('listitem')).toHaveLength(1)
  })
})
