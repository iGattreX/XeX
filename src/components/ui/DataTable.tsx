import { useMemo, useState, type ReactNode } from 'react'
import clsx from 'clsx'
import { ArrowsUpDownIcon, ChevronDownIcon, ChevronUpDownIcon, ChevronUpIcon } from '@heroicons/react/16/solid'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { Button } from './Button'
import { Input } from './Input'
import { PaginationBar } from './PaginationBar'
import { SegmentedControl } from './SegmentedControl'
import { MultiSelect } from './MultiSelect'

export interface DataTableColumn<T> {
  id: string
  header: string
  /** Plain value used for sorting, searching and filtering. */
  accessor: (row: T) => string | number
  /** Custom cell content; defaults to the accessor's value. `dense` mirrors the density toggle. */
  cell?: (row: T, ctx: { dense: boolean }) => ReactNode
  /** Click-to-sort header. Default: true. */
  sortable?: boolean
  /** Adds a multi-select dropdown listing this column's distinct values (OR within a column, AND across columns). Default: false. */
  filter?: boolean
  /** Placeholder for that dropdown, e.g. "All roles". */
  filterLabel?: string
  align?: 'left' | 'right'
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  rows: T[]
  rowKey: (row: T) => string | number
  /** Accessible name for the table. */
  label: string
  /** Search box (matches any column). Default: true. */
  searchable?: boolean
  searchPlaceholder?: string
  pageSizeOptions?: number[]
  defaultPageSize?: number
  initialSort?: { columnId: string; direction: 'asc' | 'desc' }
  emptyMessage?: string
}

type Sort = { columnId: string; direction: 'asc' | 'desc' } | null

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })

/**
 * Standard table: click-to-sort headers, global search, per-column dropdown filters,
 * pagination (above and below) and a density toggle. Switch parts off per column or via props.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  label,
  searchable = true,
  searchPlaceholder = 'Search…',
  pageSizeOptions = [5, 10, 25],
  defaultPageSize = pageSizeOptions[0],
  initialSort,
  emptyMessage = 'No rows match your filters.',
}: DataTableProps<T>) {
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<Record<string, string[]>>({})
  const [sort, setSort] = useState<Sort>(initialSort ?? null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(defaultPageSize)
  const [dense, setDense] = useState(false)

  const filterColumns = columns.filter((c) => c.filter)
  const filterActive = query.trim() !== '' || Object.values(filters).some((v) => v.length > 0)

  const filterOptions = useMemo(
    () =>
      Object.fromEntries(
        filterColumns.map((c) => [
          c.id,
          [...rows.reduce((m, r) => m.set(String(c.accessor(r)), (m.get(String(c.accessor(r))) ?? 0) + 1), new Map<string, number>())]
            .sort((a, b) => collator.compare(a[0], b[0]))
            .map(([v, count]) => ({ value: v, label: v, count })),
        ]),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rows, columns],
  )

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    let out = rows.filter((row) => {
      for (const c of filterColumns) {
        const want = filters[c.id]
        if (want?.length && !want.includes(String(c.accessor(row)))) return false
      }
      return !q || columns.some((c) => String(c.accessor(row)).toLowerCase().includes(q))
    })
    const col = sort && columns.find((c) => c.id === sort.columnId)
    if (col && sort) {
      const dir = sort.direction === 'asc' ? 1 : -1
      out = [...out].sort((a, b) => {
        const x = col.accessor(a)
        const y = col.accessor(b)
        return (typeof x === 'number' && typeof y === 'number' ? x - y : collator.compare(String(x), String(y))) * dir
      })
    }
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, columns, query, filters, sort])

  const totalPages = Math.max(1, Math.ceil(visible.length / pageSize))
  const current = Math.min(page, totalPages)
  const pageRows = visible.slice((current - 1) * pageSize, current * pageSize)

  // Any change to what is shown starts again from page 1.
  const reset = () => setPage(1)
  const toggleSort = (id: string) => {
    reset()
    setSort((s) => (s?.columnId !== id ? { columnId: id, direction: 'asc' } : s.direction === 'asc' ? { columnId: id, direction: 'desc' } : null))
  }
  const clearAll = () => {
    setQuery('')
    setFilters({})
    reset()
  }

  const sortColumn = sort && columns.find((c) => c.id === sort.columnId)

  const bar = (placement: 'above' | 'below') => (
    <PaginationBar
      placement={placement}
      page={current}
      totalPages={totalPages}
      total={visible.length}
      pageSize={pageSize}
      onPageChange={setPage}
      pageSizeOptions={pageSizeOptions}
      onPageSizeChange={(n) => {
        setPageSize(n)
        reset()
      }}
      right={
        <SegmentedControl
          label="Row density"
          value={dense ? 'compact' : 'comfortable'}
          onChange={(v) => setDense(v === 'compact')}
          options={[
            { value: 'comfortable', label: 'Comfortable' },
            { value: 'compact', label: 'Compact' },
          ]}
        />
      }
    />
  )

  const pad = dense ? 'px-4 py-1.5' : 'px-4 py-3'

  return (
    <div className="rounded-xl border border-gray-200">
      {(searchable || filterColumns.length > 0 || sort) && (
        <div className="flex flex-wrap items-end gap-3 rounded-t-xl border-b border-gray-100 p-3">
          {searchable && (
            <Input
              className="w-full sm:w-64"
              aria-label={`Search ${label}`}
              placeholder={searchPlaceholder}
              icon={<MagnifyingGlassIcon />}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                reset()
              }}
            />
          )}
          {filterColumns.map((c) => (
            <MultiSelect
              key={c.id}
              className="w-full sm:w-44"
              label={c.filterLabel ?? `All ${c.header.toLowerCase()}`}
              value={filters[c.id] ?? []}
              onChange={(v) => {
                setFilters((f) => ({ ...f, [c.id]: v }))
                reset()
              }}
              options={filterOptions[c.id]}
            />
          ))}
          {filterActive && (
            <Button variant="ghost" size="sm" icon={<XMarkIcon className="h-4 w-4" />} onClick={clearAll}>
              Clear filters
            </Button>
          )}
          {sortColumn && sort && (
            <Button
              variant="ghost"
              size="sm"
              icon={<ArrowsUpDownIcon className="h-4 w-4" />}
              onClick={() => {
                setSort(null)
                reset()
              }}
              title="Remove sorting (a third click on the sorted header does the same)"
            >
              Sorted by {sortColumn.header} ({sort.direction === 'asc' ? 'A→Z' : 'Z→A'}) · Reset
            </Button>
          )}
          <p role="status" className="ml-auto self-center text-sm text-gray-500">
            {visible.length === rows.length ? `${rows.length} rows` : `${visible.length} of ${rows.length} rows`}
          </p>
        </div>
      )}

      {bar('above')}

      <div className="overflow-x-auto">
        <table aria-label={label} className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              {columns.map((c) => {
                const sorted = sort?.columnId === c.id ? sort.direction : null
                const sortable = c.sortable !== false
                const Icon = sorted === 'asc' ? ChevronUpIcon : sorted === 'desc' ? ChevronDownIcon : ChevronUpDownIcon
                return (
                  <th
                    key={c.id}
                    scope="col"
                    aria-sort={sortable ? (sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : 'none') : undefined}
                    className={clsx('px-4 py-2.5 font-semibold', c.align === 'right' && 'text-right')}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(c.id)}
                        className={clsx(
                          '-mx-1.5 inline-flex items-center gap-1 rounded px-1.5 py-0.5 uppercase tracking-wide hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
                          sorted ? 'text-gray-900' : 'text-gray-500',
                        )}
                      >
                        {c.header}
                        <Icon className={clsx('h-4 w-4', sorted ? 'text-brand-600' : 'text-gray-400')} aria-hidden="true" />
                      </button>
                    ) : (
                      c.header
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => (
              <tr key={rowKey(row)} className="border-t border-gray-100 hover:bg-gray-50">
                {columns.map((c) => (
                  <td key={c.id} className={clsx(pad, 'text-gray-600', c.align === 'right' && 'text-right')}>
                    {c.cell ? c.cell(row, { dense }) : String(c.accessor(row))}
                  </td>
                ))}
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr className="border-t border-gray-100">
                <td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-gray-500">
                  {emptyMessage}{' '}
                  {filterActive && (
                    <button type="button" onClick={clearAll} className="font-medium text-brand-700 underline">
                      Clear filters
                    </button>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {bar('below')}
    </div>
  )
}
