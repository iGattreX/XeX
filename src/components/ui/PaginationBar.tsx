import type { ReactNode } from 'react'
import clsx from 'clsx'

export interface PaginationBarProps {
  page: number // 1-based
  totalPages: number
  total: number
  pageSize: number
  onPageChange: (page: number) => void
  pageSizeOptions?: number[]
  onPageSizeChange?: (size: number) => void
  /** Extra controls on the right (e.g. a density toggle), divided by a "|". */
  right?: ReactNode
}

/** 1 … 4 5 [6] 7 8 … 20 — null entries are ellipses. */
export function pageWindow(page: number, totalPages: number): (number | null)[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
  const out: (number | null)[] = [1]
  const start = Math.max(2, page - 1)
  const end = Math.min(totalPages - 1, page + 1)
  if (start > 2) out.push(null)
  for (let p = start; p <= end; p++) out.push(p)
  if (end < totalPages - 1) out.push(null)
  out.push(totalPages)
  return out
}

const navBtn = 'rounded-md px-2.5 py-1 text-sm text-gray-600 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 disabled:opacity-40 disabled:hover:bg-transparent'

export function PaginationBar({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  pageSizeOptions,
  onPageSizeChange,
  right,
}: PaginationBarProps) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-y border-gray-100 px-4 py-2.5">
      <div>
        {totalPages > 1 && (
          <nav aria-label="Pagination" className="flex items-center gap-1">
            <button type="button" className={navBtn} disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
              « Prev
            </button>
            {pageWindow(page, totalPages).map((p, i) =>
              p === null ? (
                <span key={`gap-${i}`} className="px-1 text-gray-400">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  type="button"
                  aria-current={p === page ? 'page' : undefined}
                  onClick={() => onPageChange(p)}
                  className={clsx(
                    'min-w-[2rem] rounded-md px-2 py-1 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
                    p === page ? 'bg-brand-600 font-semibold text-white' : 'text-gray-600 hover:bg-gray-100',
                  )}
                >
                  {p}
                </button>
              ),
            )}
            <button type="button" className={navBtn} disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
              Next »
            </button>
          </nav>
        )}
      </div>

      <div className="ml-auto flex items-center gap-3 text-sm text-gray-500">
        {right && (
          <>
            {right}
            <span className="text-gray-300" aria-hidden="true">
              |
            </span>
          </>
        )}
        {pageSizeOptions && onPageSizeChange && (
          <label className="flex items-center gap-2">
            Rows per page
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="rounded-md border border-gray-300 bg-white px-1.5 py-1 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400"
            >
              {pageSizeOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        )}
        <span className="tabular-nums">
          {from}–{to} of {total}
        </span>
      </div>
    </div>
  )
}
