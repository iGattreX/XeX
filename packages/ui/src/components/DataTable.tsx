import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react'
import clsx from 'clsx'
import { ArrowsRightLeftIcon, ArrowsUpDownIcon, ChevronDownIcon, ChevronUpDownIcon, ChevronUpIcon } from '@heroicons/react/16/solid'
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
  /** Default width as a relative weight (a column with 2 starts twice as wide as one with 1). Default: 1. */
  width?: number
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

type DragState = { i: number; startX: number; base: number[]; tableWidth: number; grow: number }

/** Narrowest a column can be dragged to, and the table's scroll threshold per column. */
const MIN_COL_PX = 64
const MIN_TABLE_COL_PX = 96

/**
 * Move the boundary between column `i` and column `i + 1` by `delta` (a fraction of the table
 * width): `i` grows and its right neighbour shrinks, so the total width never changes. Clamped so
 * neither side drops below the minimum. (The last column has no right neighbour; see `growLast`.)
 */
function applyResize(base: number[], i: number, delta: number, tableWidth: number): number[] {
  const n = i + 1
  if (n >= base.length) return base
  const min = MIN_COL_PX / tableWidth
  const d = Math.min(Math.max(delta, min - base[i]), base[n] - min)
  const next = [...base]
  next[i] = base[i] + d
  next[n] = base[n] - d
  return next
}

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

  // Column widths are fractions of the table width (summing to 1) so they survive container resizes.
  // null = the defaults from each column's `width` weight. Fixed table layout + <colgroup> means the
  // widths never depend on cell content, so sorting / paging can no longer make columns jump.
  const [custom, setCustom] = useState<number[] | null>(null)
  const tableRef = useRef<HTMLTableElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const drag = useRef<DragState | null>(null)
  // Extra width (px) the last column's handle has added on top of the container width, so the table
  // can be widened past it and scrolled sideways. 0 = the table fits its container.
  const [grow, setGrow] = useState(0)
  const [overflowing, setOverflowing] = useState(false)
  const [resizing, setResizing] = useState<number | null>(null)
  const weights = columns.map((c) => c.width ?? 1)
  const weightSum = weights.reduce((a, b) => a + b, 0)
  const defaults = weights.map((w) => w / weightSum)
  const widths = custom && custom.length === columns.length ? custom : defaults
  const customized = (custom !== null && custom.length === columns.length) || grow > 0

  // Does the table need sideways scrolling? Only then does the last column get a resize handle.
  useEffect(() => {
    const wrapper = wrapperRef.current
    const table = tableRef.current
    if (!wrapper || !table) return
    const check = () => setOverflowing(table.offsetWidth > wrapper.clientWidth + 1)
    check()
    const ro = new ResizeObserver(check)
    ro.observe(wrapper)
    ro.observe(table)
    return () => ro.disconnect()
  }, [])

  /** Widen / narrow the table by `delta` px, all of it taken by the last column. Never narrower than its container. */
  const growLast = (base: number[], tableWidth: number, startGrow: number, delta: number) => {
    const last = base.length - 1
    const px = base.map((f) => f * tableWidth)
    const d = Math.max(delta, MIN_COL_PX - px[last], -startGrow)
    px[last] += d
    const total = tableWidth + d
    setCustom(px.map((p) => p / total))
    setGrow(startGrow + d)
  }

  useEffect(() => {
    if (resizing === null) return
    const { cursor, userSelect } = document.body.style
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    return () => {
      document.body.style.cursor = cursor
      document.body.style.userSelect = userSelect
    }
  }, [resizing])

  const onHandleDown = (e: PointerEvent<HTMLElement>, i: number) => {
    if (e.button !== 0 || !tableRef.current) return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { i, startX: e.clientX, base: widths, tableWidth: tableRef.current.getBoundingClientRect().width, grow }
    setResizing(i)
  }
  const onHandleMove = (e: PointerEvent<HTMLElement>) => {
    const d = drag.current
    if (!d) return
    if (d.i === d.base.length - 1) growLast(d.base, d.tableWidth, d.grow, e.clientX - d.startX)
    else setCustom(applyResize(d.base, d.i, (e.clientX - d.startX) / d.tableWidth, d.tableWidth))
  }
  const onHandleUp = (e: PointerEvent<HTMLElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId)
    drag.current = null
    setResizing(null)
  }
  const onHandleKey = (e: KeyboardEvent<HTMLElement>, i: number) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    if (!tableRef.current) return
    e.preventDefault()
    const tableWidth = tableRef.current.getBoundingClientRect().width
    const px = (e.shiftKey ? 40 : 10) * (e.key === 'ArrowRight' ? 1 : -1)
    if (i === columns.length - 1) growLast(widths, tableWidth, grow, px)
    else setCustom(applyResize(widths, i, px / tableWidth, tableWidth))
  }
  const resetWidths = () => {
    setCustom(null)
    setGrow(0)
  }

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
      {(searchable || filterColumns.length > 0 || sort || customized) && (
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
          {customized && (
            <Button
              variant="ghost"
              size="sm"
              icon={<ArrowsRightLeftIcon className="h-4 w-4" />}
              onClick={resetWidths}
              title="Restore the default column widths (double-clicking a column edge does the same)"
            >
              Reset column widths
            </Button>
          )}
          <p role="status" className="ml-auto self-center text-sm text-gray-500">
            {visible.length === rows.length ? `${rows.length} rows` : `${visible.length} of ${rows.length} rows`}
          </p>
        </div>
      )}

      {bar('above')}

      <div ref={wrapperRef} className="overflow-x-auto">
        <table
          ref={tableRef}
          aria-label={label}
          className="w-full table-fixed text-left text-sm"
          style={{ minWidth: columns.length * MIN_TABLE_COL_PX, ...(grow > 0 && { width: `calc(max(100%, ${columns.length * MIN_TABLE_COL_PX}px) + ${grow}px)` }) }}
        >
          <colgroup>
            {columns.map((c, i) => (
              <col key={c.id} style={{ width: `${widths[i] * 100}%` }} />
            ))}
          </colgroup>
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              {columns.map((c, i) => {
                const sorted = sort?.columnId === c.id ? sort.direction : null
                const sortable = c.sortable !== false
                const Icon = sorted === 'asc' ? ChevronUpIcon : sorted === 'desc' ? ChevronDownIcon : ChevronUpDownIcon
                return (
                  <th
                    key={c.id}
                    scope="col"
                    aria-sort={sortable ? (sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : 'none') : undefined}
                    className={clsx('relative px-4 py-2.5 font-semibold', c.align === 'right' && 'text-right')}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(c.id)}
                        className={clsx(
                          '-mx-1.5 inline-flex max-w-[calc(100%+0.75rem)] items-center gap-1 rounded px-1.5 py-0.5 uppercase tracking-wide hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
                          sorted ? 'text-gray-900' : 'text-gray-500',
                        )}
                      >
                        <span className="truncate">{c.header}</span>
                        <Icon className={clsx('h-4 w-4 shrink-0', sorted ? 'text-brand-600' : 'text-gray-400')} aria-hidden="true" />
                      </button>
                    ) : (
                      <span className="block truncate">{c.header}</span>
                    )}
                    {columns.length > 1 && (i < columns.length - 1 || overflowing || grow > 0) && (
                      <span
                        role="separator"
                        aria-orientation="vertical"
                        aria-label={i === columns.length - 1 ? `Resize ${c.header} column (widens the table)` : `Resize ${c.header} column`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={Math.round(widths[i] * 100)}
                        tabIndex={0}
                        title="Drag to resize · double-click to reset"
                        onPointerDown={(e) => onHandleDown(e, i)}
                        onPointerMove={onHandleMove}
                        onPointerUp={onHandleUp}
                        onPointerCancel={onHandleUp}
                        onKeyDown={(e) => onHandleKey(e, i)}
                        onDoubleClick={resetWidths}
                        className={clsx(
                          'group absolute inset-y-1 z-10 flex w-3 cursor-col-resize touch-none select-none justify-center rounded',
                          i === columns.length - 1 ? 'right-0' : '-right-1.5',
                        )}
                      >
                        <span
                          className={clsx(
                            'my-auto h-5 w-0.5 rounded-full transition-colors group-hover:bg-brand-500 group-focus-visible:bg-brand-500',
                            resizing === i ? 'bg-brand-500' : 'bg-gray-300',
                          )}
                        />
                      </span>
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
                  <td key={c.id} className={clsx(pad, 'overflow-hidden text-gray-600', c.align === 'right' && 'text-right')}>
                    {c.cell ? c.cell(row, { dense }) : <span className="block truncate">{String(c.accessor(row))}</span>}
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
