import { useEffect, useMemo, useState } from 'react'
import clsx from 'clsx'
import { CheckIcon } from '@heroicons/react/20/solid'
import { ArrowUturnLeftIcon } from '@heroicons/react/24/outline'
import { DEFAULT_FONT, FONT_CATEGORIES, SYSTEM_FONT, fontStack, loadFontPreviews, type FontCategory } from '@xex/tokens'
import { useTheme } from '../theme/ThemeContext'
import { useFontCatalog } from './catalog'
import { Button } from '../components/Button'
import { Combobox } from '../components/Combobox'
import { LoadingDots } from '../components/LoadingDots'

const PAGE_SIZE = 40

/** The category chip is remembered for the browser session (a tab), per app. */
const readCategory = (key: string): FontCategory | '' => {
  try {
    const v = sessionStorage.getItem(key)
    return FONT_CATEGORIES.some((c) => c.value === v) ? (v as FontCategory) : ''
  } catch {
    return ''
  }
}

/** Last-5-used chips + a searchable dropdown of every Google Font (a `Combobox` with a category header and lazy paging). */
export function FontPicker() {
  const { font, recentFonts, setFont, storagePrefix } = useTheme()
  const categoryKey = `${storagePrefix}-font-category`
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [category, setCategoryState] = useState<FontCategory | ''>(() => readCategory(categoryKey))
  const [visible, setVisible] = useState(PAGE_SIZE)
  // Index (rounded down to 10) of the first row in view; font previews load around it.
  const [viewIdx, setViewIdx] = useState(0)
  const catalog = useFontCatalog(open)

  const setCategory = (c: FontCategory | '') => {
    setCategoryState(c)
    try {
      sessionStorage.setItem(categoryKey, c)
    } catch {
      /* storage unavailable: the choice still holds for this page */
    }
  }

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    const all = [SYSTEM_FONT, ...catalog.fonts]
    return all.filter((f) => (!category || f.category === category) && (!q || f.family.toLowerCase().includes(q)))
  }, [catalog.fonts, query, category])

  // Whenever the list opens or the result set changes: unless searching, load enough pages to include
  // the current font (plus one more) so the list can scroll to it; otherwise start from the first page.
  useEffect(() => {
    if (!open) return
    const idx = query ? -1 : matches.findIndex((f) => f.family === font.family)
    setVisible(idx >= 0 ? Math.max(PAGE_SIZE, (Math.floor(idx / PAGE_SIZE) + 2) * PAGE_SIZE) : PAGE_SIZE)
    if (idx < 0) setViewIdx(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-centring on every font change would fight the user
  }, [open, matches])

  // Draw the rows in/near view in their own typeface (one batched request per window).
  useEffect(() => {
    if (open) loadFontPreviews(matches.slice(Math.max(0, viewIdx - 10), Math.min(visible, viewIdx + 50)))
  }, [open, matches, visible, viewIdx])

  const byFamily = useMemo(() => new Map(matches.map((f) => [f.family, f])), [matches])
  const options = useMemo(() => matches.slice(0, visible).map((f) => ({ value: f.family, label: f.family, meta: f.category })), [matches, visible])

  const syncView = (list: HTMLUListElement) => {
    const rowH = list.querySelector('li[role="option"]')?.getBoundingClientRect().height || 32
    setViewIdx(Math.floor(list.scrollTop / rowH / 10) * 10)
  }

  const chips = (
    <div className="flex flex-wrap gap-1">
      {[{ value: '', label: 'All' }, ...FONT_CATEGORIES].map((c) => (
        <button
          key={c.value}
          type="button"
          aria-pressed={category === c.value}
          onClick={() => setCategory(c.value as FontCategory | '')}
          className={clsx(
            'rounded-full px-2.5 py-0.5 text-xs font-medium',
            category === c.value ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
          )}
        >
          {c.label}
        </button>
      ))}
    </div>
  )

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Combobox
          className="w-full max-w-sm"
          options={options}
          value={font.family}
          onChange={(family) => {
            const next = byFamily.get(family)
            if (next) setFont(next)
          }}
          aria-label={`Font: ${font.family}`}
          searchable
          searchPlaceholder="Search Google Fonts…"
          query={query}
          onQueryChange={setQuery}
          filterOptions={false}
          emptyMessage="No fonts match."
          popupClassName="w-full"
          onOpenChange={setOpen}
          onListScroll={syncView}
          onReachEnd={() => setVisible((v) => Math.min(v + PAGE_SIZE, matches.length))}
          renderValue={() => (
            <span className="block truncate" style={{ fontFamily: fontStack(font) }}>
              {font.family}
            </span>
          )}
          renderOption={(o, { selected }) => {
            const f = byFamily.get(o.value)
            return (
              <>
                <span className="flex-1 truncate" style={{ fontFamily: f ? fontStack(f) : undefined }} title={o.label}>
                  {o.label}
                </span>
                <span className="flex items-center gap-2 text-xs text-gray-600">
                  {o.meta}
                  {selected && <CheckIcon className="h-4 w-4 text-accent" />}
                </span>
              </>
            )
          }}
          header={chips}
          notice={
            catalog.status === 'loading' ? (
              <p className="px-3 py-2 text-sm text-gray-500">
                Loading fonts <LoadingDots />
              </p>
            ) : catalog.status === 'error' ? (
              <p className="px-3 py-2 text-sm text-danger-ink">
                Couldn’t load the font list.{' '}
                <button type="button" className="font-medium underline" onClick={catalog.retry}>
                  Retry
                </button>
              </p>
            ) : undefined
          }
          footer={
            visible < matches.length ? (
              <p className="px-3 py-2 text-xs text-gray-500">
                Showing {visible} of {matches.length} — scroll for more
              </p>
            ) : undefined
          }
        />

        {/* Fixed to the default typeface (Inter): symbol/icon fonts cannot render their own name. */}
        <div className="flex items-center gap-2" style={{ fontFamily: fontStack(DEFAULT_FONT) }}>
          <p className="text-sm text-gray-500">
            Selected: <span className="font-semibold text-gray-900">{font.family}</span>
            {font.stack ? '' : <span className="text-gray-500"> · {font.category}</span>}
          </p>
          <Button
            size="xs"
            variant="ghost"
            disabled={font.family === DEFAULT_FONT.family}
            onClick={() => setFont(DEFAULT_FONT)}
            icon={<ArrowUturnLeftIcon className="h-4 w-4" />}
            title={`Reset to ${DEFAULT_FONT.family}`}
          >
            Reset
          </Button>
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-xs text-gray-500">Recently used</p>
        <div className="flex flex-wrap gap-2">
          {recentFonts.map((f) => (
            <Button
              key={f.family}
              size="sm"
              variant={f.family === font.family ? 'primary' : 'secondary'}
              title={f.family}
              onClick={() => setFont(f)}
              style={{ fontFamily: fontStack(f) }}
            >
              {f.family}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
