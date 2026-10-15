import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type UIEvent } from 'react'
import clsx from 'clsx'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid'
import { ArrowUturnLeftIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { DEFAULT_FONT, FONT_CATEGORIES, SYSTEM_FONT, fontStack, loadFontPreviews, type FontCategory, type FontChoice } from '@xex/tokens'
import { useTheme } from '../theme/ThemeContext'
import { useFontCatalog } from './catalog'
import { Button } from '../components/Button'
import { LoadingDots } from '../components/LoadingDots'

const PAGE_SIZE = 40

/** Last-5-used chips + a searchable dropdown of every Google Font. */
export function FontPicker() {
  const { font, recentFonts, setFont } = useTheme()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<FontCategory | ''>('')
  const [visible, setVisible] = useState(PAGE_SIZE)
  const uid = useId()
  const listId = `${uid}-list`
  const optId = (i: number) => `${uid}-opt-${i}`
  // Keyboard-highlighted row (aria-activedescendant); focus stays in the search box.
  const [active, setActive] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const pendingScroll = useRef(false)
  // Set by arrow-key navigation only, so mouse/scrollbar scrolling is never fought.
  const scrollToActive = useRef(false)
  // Index (rounded down to 10) of the first row in view; font previews load around it.
  const [viewIdx, setViewIdx] = useState(0)
  const catalog = useFontCatalog(open)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setOpen(false)
      triggerRef.current?.focus()
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    const all = [SYSTEM_FONT, ...catalog.fonts]
    return all.filter((f) => (!category || f.category === category) && (!q || f.family.toLowerCase().includes(q)))
  }, [catalog.fonts, query, category])

  const syncView = (list: HTMLUListElement) => {
    const rowH = list.querySelector('li')?.getBoundingClientRect().height || 32
    setViewIdx(Math.floor(list.scrollTop / rowH / 10) * 10)
  }

  // Whenever the list opens or the result set changes: if the current font is in
  // an unfiltered list, load enough pages to include it (plus one more) and scroll
  // to it; otherwise start from the top.
  useEffect(() => {
    if (!open) {
      pendingScroll.current = false
      return
    }
    const idx = !query && !category ? matches.findIndex((f) => f.family === font.family) : -1
    setActive(Math.max(idx, 0))
    if (idx >= 0) {
      setVisible(Math.max(PAGE_SIZE, (Math.floor(idx / PAGE_SIZE) + 2) * PAGE_SIZE))
      pendingScroll.current = true
    } else {
      setVisible(PAGE_SIZE)
      setViewIdx(0)
      listRef.current?.scrollTo({ top: 0 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-centering on every font change would fight the user
  }, [open, matches])

  // Centre the selected row once it has been rendered.
  useLayoutEffect(() => {
    if (!pendingScroll.current) return
    const list = listRef.current
    const el = list?.querySelector<HTMLElement>('[aria-selected="true"]')
    if (!list || !el) return
    list.scrollTop = el.offsetTop - list.clientHeight / 2 + el.clientHeight / 2
    syncView(list)
    pendingScroll.current = false
  }, [visible, matches])

  // After arrow-key navigation, keep the highlighted row inside the scrolled area.
  useLayoutEffect(() => {
    if (!scrollToActive.current) return
    const list = listRef.current
    const el = open ? document.getElementById(optId(active)) : null
    if (!list || !el) return // row not rendered yet; retry when `visible` grows
    scrollToActive.current = false
    if (el.offsetTop < list.scrollTop) list.scrollTop = el.offsetTop
    else if (el.offsetTop + el.offsetHeight > list.scrollTop + list.clientHeight) list.scrollTop = el.offsetTop + el.offsetHeight - list.clientHeight
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, open, visible])

  // Reveal the next page as the user nears the bottom of the list.
  const onScroll = (e: UIEvent<HTMLUListElement>) => {
    const el = e.currentTarget
    syncView(el)
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 80) setVisible((v) => Math.min(v + PAGE_SIZE, matches.length))
  }

  // Draw the rows in/near view in their own typeface (one batched request per window).
  useEffect(() => {
    if (open) loadFontPreviews(matches.slice(Math.max(0, viewIdx - 10), Math.min(visible, viewIdx + 50)))
  }, [open, matches, visible, viewIdx])

  const choose = (f: FontChoice) => {
    setFont(f)
    setOpen(false)
    triggerRef.current?.focus()
  }

  const openList = () => {
    setQuery('')
    setCategory('')
    setOpen(true)
  }

  const moveActive = (next: number) => {
    const i = Math.min(Math.max(next, 0), matches.length - 1)
    scrollToActive.current = true
    setActive(i)
    setVisible((v) => Math.max(v, Math.min(i + 20, matches.length)))
  }

  // Combobox keys, handled on the search input.
  const onSearchKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') moveActive(active + 1)
    else if (e.key === 'ArrowUp') moveActive(active - 1)
    else if (e.key === 'PageDown') moveActive(active + 8)
    else if (e.key === 'PageUp') moveActive(active - 8)
    else if (e.key === 'Enter' && matches[active]) choose(matches[active])
    else return
    e.preventDefault()
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <div
        ref={rootRef}
        className="relative w-full max-w-sm"
        onMouseDown={(e) => {
          // Clicking inside the list (rows, chips, scrollbar) must not pull focus out of the
          // search box: non-focusable areas would otherwise hand focus to an ancestor (e.g. <main>)
          // and the blur handler below would close the dropdown.
          if (open && !(e.target instanceof HTMLInputElement) && listRef.current?.parentElement?.contains(e.target as Node)) e.preventDefault()
        }}
        onBlur={(e) => {
          // Tabbing out of the dropdown closes it (ignore blur with no target, e.g. scrollbar drags).
          if (open && e.relatedTarget && !rootRef.current?.contains(e.relatedTarget as Node)) setOpen(false)
        }}
      >
        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          onClick={() => (open ? setOpen(false) : openList())}
          onKeyDown={(e) => {
            if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
              e.preventDefault()
              openList()
            }
          }}
          className="flex w-full cursor-default items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-left text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400"
        >
          <span className="truncate" style={{ fontFamily: fontStack(font) }}>
            {font.family}
          </span>
          <ChevronUpDownIcon className="h-5 w-5 shrink-0 text-gray-400" />
        </button>

        {open && (
          <div className="absolute left-0 right-0 z-40 mt-1 rounded-xl border border-gray-200 bg-white p-2 shadow-xl">
            <div className="relative">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onSearchKeyDown}
                role="combobox"
                aria-expanded
                aria-controls={listId}
                aria-autocomplete="list"
                aria-label="Search fonts"
                aria-activedescendant={matches[active] ? optId(active) : undefined}
                placeholder="Search Google Fonts…"
                className="w-full rounded-lg border border-gray-300 bg-white py-1.5 pl-8 pr-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400"
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {[{ value: '', label: 'All' }, ...FONT_CATEGORIES].map((c) => (
                <button
                  key={c.value}
                  type="button"
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

            <ul id={listId} ref={listRef} role="listbox" aria-label="Fonts" onScroll={onScroll} className="relative mt-2 max-h-64 overflow-y-auto">
              {catalog.status === 'loading' && (
                <li className="px-3 py-2 text-sm text-gray-500">
                  Loading fonts <LoadingDots />
                </li>
              )}
              {catalog.status === 'error' && (
                <li className="px-3 py-2 text-sm text-red-600">
                  Couldn’t load the font list.{' '}
                  <button type="button" className="font-medium underline" onClick={catalog.retry}>
                    Retry
                  </button>
                </li>
              )}
              {matches.slice(0, visible).map((f, i) => (
                <li key={f.family} id={optId(i)} role="option" aria-selected={f.family === font.family} onMouseMove={() => i !== active && setActive(i)}>
                  <button
                    type="button"
                    title={f.family}
                    tabIndex={-1}
                    onClick={() => choose(f)}
                    className={clsx(
                      'flex w-full cursor-default items-center justify-between rounded-md px-3 py-1.5 text-left text-sm text-gray-800',
                      i === active && 'bg-gray-100 ring-2 ring-inset ring-brand-300',
                      f.family === font.family && 'bg-brand-50 font-medium',
                    )}
                  >
                    <span style={{ fontFamily: fontStack(f) }}>{f.family}</span>
                    <span className="flex items-center gap-2 text-xs text-gray-400">
                      {f.category}
                      {f.family === font.family && <CheckIcon className="h-4 w-4 text-brand-600" />}
                    </span>
                  </button>
                </li>
              ))}
              {catalog.status === 'ready' && matches.length === 0 && <li className="px-3 py-2 text-sm text-gray-500">No fonts match.</li>}
              {visible < matches.length && (
                <li className="px-3 py-2 text-xs text-gray-400">
                  Showing {visible} of {matches.length} — scroll for more
                </li>
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Fixed to the default typeface (Inter): symbol/icon fonts cannot render their own name. */}
      <div className="flex items-center gap-2" style={{ fontFamily: fontStack(DEFAULT_FONT) }}>
        <p className="text-sm text-gray-500">
          Selected: <span className="font-semibold text-gray-900">{font.family}</span>
          {font.stack ? '' : <span className="text-gray-400"> · {font.category}</span>}
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
