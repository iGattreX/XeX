import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent, type ReactNode } from 'react'
import clsx from 'clsx'
import { ArrowsRightLeftIcon, ArrowsUpDownIcon, ChevronDownIcon, ChevronUpDownIcon, ChevronUpIcon } from '@heroicons/react/16/solid'
import { ArrowLeftIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { Button } from './Button'
import { Input } from './Input'
import { PaginationBar } from './PaginationBar'
import { Select } from './Select'
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
  /** Placeholder for that dropdown, e.g. "All roles". Defaults to "Any <header>". */
  filterLabel?: string
  align?: 'left' | 'right'
  /** Default width as a relative weight (a column with 2 starts twice as wide as one with 1). Default: 1. */
  width?: number
  /** Label for this column's value on a card. Defaults to `header`. */
  cardLabel?: string
  /** Leave this column out of the card layout. (The first column is always the card's title.) */
  hideInCards?: boolean
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
  /**
   * How rows are laid out. `auto` (default): a table, switching to cards when the table is narrow
   * (a phone, or a narrow panel), with a Table/Cards toggle so the user can choose. `always` /
   * `never` fix the layout and hide the toggle. In cards, the first column is the title and the
   * others are label/value pairs.
   */
  cards?: 'auto' | 'always' | 'never'
  /**
   * Make rows (and cards) open a details view. `true` shows every column as a read-only list; a
   * function renders your own content (a form, say) for the row. In a table the details open in a
   * side panel beside the list; on cards, or when the table is narrow, they replace the list, with
   * a Back button. Search, filters, sort and page are kept.
   */
  detail?: boolean | ((row: T) => ReactNode)
  /** Heading of the details view. Defaults to the first column's value. */
  detailTitle?: (row: T) => string
}

type Layout = 'comfortable' | 'compact' | 'cards'

type Sort = { columnId: string; direction: 'asc' | 'desc' } | null

type DragState = { i: number; startX: number; base: number[]; tableWidth: number; grow: number }

/** Narrowest a column can be dragged to, and the table's scroll threshold per column. */
const MIN_COL_PX = 64
const MIN_TABLE_COL_PX = 96
/** Below this width (px) an `auto` table shows cards. */
const CARD_BREAKPOINT_PX = 560
/** A table needs at least this width (px) to have its details open in a side panel. */
const SIDE_PANEL_MIN_PX = 800

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
  cards = 'auto',
  detail,
  detailTitle,
}: DataTableProps<T>) {
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<Record<string, string[]>>({})
  const [sort, setSort] = useState<Sort>(initialSort ?? null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(defaultPageSize)

  // Layout: Comfortable, Compact or Cards. Until the user picks one, `auto` shows cards when the
  // table's own width (not the screen's) is narrow, and a comfortable table otherwise.
  const rootRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0) // 0 = not measured yet: treated as wide
  const [layout, setLayout] = useState<Layout | null>(null)
  useLayoutEffect(() => {
    const el = rootRef.current
    if (!el) return
    const measure = () => setWidth(el.getBoundingClientRect().width)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const narrow = width > 0 && width < CARD_BREAKPOINT_PX
  const asCards = cards === 'always' || (cards === 'auto' && (layout ? layout === 'cards' : narrow))
  const dense = layout === 'compact'
  const cardColumns = width >= 960 ? 3 : width >= 640 ? 2 : 1

  // Row details. Opened from a row or a card; beside the list when there is room, otherwise in its place.
  const detailEnabled = !!detail
  const [openId, setOpenId] = useState<string | null>(null)
  const [returnTo, setReturnTo] = useState<string | null>(null)
  const uid = useId()
  const panelId = `${uid}-detail`
  const headingId = `${uid}-detail-title`
  const headingRef = useRef<HTMLHeadingElement>(null)
  const openRow = detailEnabled && openId !== null ? (rows.find((r) => String(rowKey(r)) === openId) ?? null) : null
  const sideBySide = !asCards && (width === 0 || width >= SIDE_PANEL_MIN_PX) // unmeasured (0) counts as roomy
  const replacing = openRow !== null && !sideBySide

  const open = (row: T) => setOpenId(String(rowKey(row)))
  const close = () => {
    setReturnTo(openId)
    setOpenId(null)
  }
  // Opening moves focus to the heading of the details; closing returns it to the row that was opened.
  useEffect(() => {
    if (openRow) headingRef.current?.focus()
  }, [openId]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (openId !== null || returnTo === null) return
    const rowEl = Array.from(rootRef.current?.querySelectorAll<HTMLElement>('[data-row-id]') ?? []).find((n) => n.dataset.rowId === returnTo)
    rowEl?.querySelector<HTMLElement>('[data-open-trigger]')?.focus()
    setReturnTo(null)
  }, [openId, returnTo])

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
    if (asCards || !wrapper || !table) return
    const check = () => {
      setOverflowing(table.offsetWidth > wrapper.clientWidth + 1)
    }
    check()
    const ro = new ResizeObserver(check)
    ro.observe(wrapper)
    ro.observe(table)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asCards])


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
  const sortableColumns = columns.filter((c) => c.sortable !== false)

  const bar = (placement: 'above' | 'below') => (
    <PaginationBar
      placement={placement}
      textSize="xs"
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
        cards === 'always' ? undefined : (
          <SegmentedControl<Layout>
            label="Row layout"
            value={asCards ? 'cards' : dense ? 'compact' : 'comfortable'}
            onChange={setLayout}
            options={[
              { value: 'comfortable', label: 'Comfortable' },
              { value: 'compact', label: 'Compact' },
              ...(cards === 'auto' ? [{ value: 'cards' as const, label: 'Cards' }] : []),
            ]}
          />
        )
      }
    />
  )

  const pad = dense ? 'px-4 py-1.5' : 'px-4 py-3'
  const rowClick = (e: MouseEvent<HTMLElement>, row: T) => {
    if (!detailEnabled) return
    // clicks on the row itself (or its open button) open it; other controls inside keep their own behaviour
    const hit = (e.target as HTMLElement).closest('a, button, input, select, textarea, label, [role="button"]')
    if (hit && !hit.hasAttribute('data-open-trigger')) return
    open(row)
  }
  /** The first cell is a real button, so keyboard and screen-reader users can open a row too. */
  const trigger = (row: T, children: ReactNode) =>
    detailEnabled ? (
      <button
        type="button"
        data-open-trigger
        aria-controls={String(rowKey(row)) === openId ? panelId : undefined}
        aria-expanded={String(rowKey(row)) === openId}
        className="block w-full rounded text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
      >
        {children}
      </button>
    ) : (
      children
    )
  const detailBody = (row: T) =>
    typeof detail === 'function' ? (
      detail(row)
    ) : (
      <dl className="grid grid-cols-1 gap-4 text-sm">
        {columns.map((c) => (
          <div key={c.id} className="min-w-0">
            <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">{c.cardLabel ?? c.header}</dt>
            <dd className="mt-0.5 break-words text-gray-800">{renderCell(c, row, false)}</dd>
          </div>
        ))}
      </dl>
    )
  const detailView = (row: T, mode: 'side' | 'replace') => {
    const title = detailTitle ? detailTitle(row) : String(columns[0].accessor(row))
    return (
      <section
        id={panelId}
        aria-labelledby={headingId}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.stopPropagation()
            close()
          }
        }}
        className={clsx(mode === 'side' && 'w-80 max-w-[40%] shrink-0 self-stretch border-l border-gray-100')}
      >
        <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
          {mode === 'replace' && (
            <Button variant="ghost" size="sm" icon={<ArrowLeftIcon className="h-4 w-4" />} onClick={close}>
              Back to {label}
            </Button>
          )}
          <h3 id={headingId} ref={headingRef} tabIndex={-1} className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-900 focus:outline-none">
            {title}
          </h3>
          {mode === 'side' && (
            <button
              type="button"
              onClick={close}
              aria-label={`Close details for ${title}`}
              className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
        </div>
        <div className="p-4">{detailBody(row)}</div>
      </section>
    )
  }
  const renderCell = (c: DataTableColumn<T>, row: T, denseCell: boolean) => (c.cell ? c.cell(row, { dense: denseCell }) : <span className="block truncate">{String(c.accessor(row))}</span>)

  return (
    <div ref={rootRef} className="rounded-xl border border-gray-200">
      {!replacing && (searchable || filterColumns.length > 0 || sort || customized || asCards) && (
        <div className="flex flex-wrap items-end gap-3 rounded-t-xl border-b border-gray-100 p-3 [&>button]:h-8 [&>button]:py-0 [&_button[aria-haspopup]]:h-8 [&_button[aria-haspopup]]:py-0 [&_button]:text-xs [&_input]:h-8 [&_input]:py-0 [&_input]:text-xs [&_label]:text-xs [&_p]:text-xs [&_select]:h-8 [&_select]:py-0 [&_select]:text-xs">
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
              label={c.filterLabel ?? `Any ${c.header.toLowerCase()}`}
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
          {asCards && sortableColumns.length > 0 && (
            <>
              <Select
                className="w-full sm:w-44"
                aria-label="Sort by"
                placeholder="Sort by…"
                value={sort?.columnId ?? ''}
                onChange={(e) => {
                  const id = e.target.value
                  setSort(id ? { columnId: id, direction: sort?.direction ?? 'asc' } : null)
                  reset()
                }}
                options={sortableColumns.map((c) => ({ value: c.id, label: c.header }))}
              />
              {sort && (
                <Button
                  variant="secondary"
                  size="sm"
                  aria-label={`Sorted ${sort.direction === 'asc' ? 'ascending' : 'descending'}; switch to ${sort.direction === 'asc' ? 'descending' : 'ascending'}`}
                  onClick={() => {
                    setSort({ ...sort, direction: sort.direction === 'asc' ? 'desc' : 'asc' })
                    reset()
                  }}
                >
                  {sort.direction === 'asc' ? 'A→Z' : 'Z→A'}
                </Button>
              )}
            </>
          )}
          {!asCards && sortColumn && sort && (
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
          {customized && !asCards && (
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

      {replacing ? (
        detailView(openRow!, 'replace')
      ) : (
        <div className={clsx(openRow && 'flex items-start')}>
          <div className="min-w-0 flex-1">
            {bar('above')}

      {asCards ? (
        <ul role="list" aria-label={label} className="grid gap-3 p-3" style={{ gridTemplateColumns: `repeat(${cardColumns}, minmax(0, 1fr))` }}>
          {pageRows.map((row) => (
            <li
              key={rowKey(row)}
              data-row-id={String(rowKey(row))}
              onClick={(e) => rowClick(e, row)}
              className={clsx(
                'min-w-0 rounded-xl border border-gray-200 bg-surface p-4 transition-shadow [@media(hover:hover)]:hover:shadow-sm',
                detailEnabled && 'cursor-pointer',
              )}
            >
              <div className="font-medium text-gray-900">{trigger(row, renderCell(columns[0], row, false))}</div>
              {columns.slice(1).some((c) => !c.hideInCards) && (
                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  {columns
                    .slice(1)
                    .filter((c) => !c.hideInCards)
                    .map((c) => (
                      <div key={c.id} className="min-w-0">
                        <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">{c.cardLabel ?? c.header}</dt>
                        <dd className="mt-0.5 break-words text-gray-700">{renderCell(c, row, false)}</dd>
                      </div>
                    ))}
                </dl>
              )}
            </li>
          ))}
          {pageRows.length === 0 && (
            <li className="col-span-full py-10 text-center text-sm text-gray-500">
              {emptyMessage}{' '}
              {filterActive && (
                <button type="button" onClick={clearAll} className="font-medium text-accent underline">
                  Clear filters
                </button>
              )}
            </li>
          )}
        </ul>
      ) : (
        <>
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
                        <Icon className={clsx('h-4 w-4 shrink-0', sorted ? 'text-accent' : 'text-gray-500')} aria-hidden="true" />
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
              <tr
                key={rowKey(row)}
                data-row-id={String(rowKey(row))}
                onClick={(e) => rowClick(e, row)}
                className={clsx(
                  'border-t border-gray-100',
                  openRow && String(rowKey(row)) === openId ? 'bg-accent-soft' : 'hover:bg-gray-50',
                  detailEnabled && 'cursor-pointer',
                )}
              >
                {columns.map((c, i) => {
                  const content = c.cell ? c.cell(row, { dense }) : <span className="block truncate">{String(c.accessor(row))}</span>
                  return (
                    <td key={c.id} className={clsx(pad, 'overflow-hidden text-gray-600', c.align === 'right' && 'text-right')}>
                      {i === 0 ? trigger(row, content) : content}
                    </td>
                  )
                })}
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr className="border-t border-gray-100">
                <td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-gray-500">
                  {emptyMessage}{' '}
                  {filterActive && (
                    <button type="button" onClick={clearAll} className="font-medium text-accent underline">
                      Clear filters
                    </button>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
        </>
      )}

            {bar('below')}
          </div>
          {openRow && detailView(openRow, 'side')}
        </div>
      )}
    </div>
  )
}
