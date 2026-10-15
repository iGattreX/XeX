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
    await userEvent.click(screen.getByRole('button', { name: /any role/i }))
    await userEvent.click(screen.getByRole('checkbox', { name: /Admin/ }))
    await userEvent.click(screen.getByRole('checkbox', { name: /Viewer/ }))
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
