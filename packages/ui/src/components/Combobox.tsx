import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode, type UIEvent } from 'react'
import clsx from 'clsx'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { ScrollRail, scrollbarHidden } from './ScrollRail'

export interface ComboboxOption {
  value: string
  label: string
  /** Shown before the label (a colour swatch, an avatar). */
  icon?: ReactNode
  /** Secondary text at the right (a count, a category). */
  meta?: ReactNode
  /** Extra words the search also matches. */
  keywords?: string
  disabled?: boolean
}

interface ComboboxBase {
  options: ComboboxOption[]
  /** Visible label above the control. */
  label?: string
  /** Accessible name of the trigger when there is no visible `label` (or you want it to include the value). */
  'aria-label'?: string
  /** Shown when nothing is selected. */
  placeholder?: string
  hint?: string
  error?: string
  disabled?: boolean
  /** Submitted with a form: a hidden input carries the value(s). */
  name?: string
  id?: string
  className?: string
  /** Classes for the trigger button (size, width). */
  triggerClassName?: string
  /** Classes for the popup (width). Default: as wide as the trigger. */
  popupClassName?: string
  /** Which edge the popup lines up with. It flips by itself if it would run off the screen. */
  align?: 'left' | 'right'
  /** A search box in the popup. `auto` (default): only when there are more than 8 options. */
  searchable?: boolean | 'auto'
  searchPlaceholder?: string
  /** Controlled search text; with `filterOptions={false}` you do the filtering (and paging) yourself. */
  query?: string
  onQueryChange?: (query: string) => void
  /** Filter the options by the search text (default true). Turn off when you filter or page them yourself. */
  filterOptions?: boolean
  emptyMessage?: string
  /** Custom trigger content for the selected option (single) — a font name in its own typeface. */
  renderValue?: (selected: ComboboxOption | undefined) => ReactNode
  /** Custom row content. */
  renderOption?: (option: ComboboxOption, state: { selected: boolean; active: boolean }) => ReactNode
  /** Under the search box, e.g. category chips. */
  header?: ReactNode
  /** A notice at the top of the list (loading, error). */
  notice?: ReactNode
  /** After the last option, e.g. "Showing 40 of 1,500". */
  footer?: ReactNode
  onOpenChange?: (open: boolean) => void
  /** The list was scrolled; for lazy work such as loading fonts for the rows in view. */
  onListScroll?: (list: HTMLUListElement) => void
  /** The list was scrolled near its end: load more. */
  onReachEnd?: () => void
  /** Text for the multi-select's clear action. */
  clearLabel?: string
}

export type ComboboxProps =
  | (ComboboxBase & { multiple?: false; value: string; onChange: (value: string) => void })
  | (ComboboxBase & { multiple: true; value: string[]; onChange: (value: string[]) => void })

const SEARCH_AUTO_THRESHOLD = 8

/**
 * One dropdown for everything richer than the browser's own `<select>`: single or multiple choice,
 * optional search, icons, and slots for a header, notices and lazy loading. Built on the standard
 * combobox/listbox pattern: arrows, Home/End, PageUp/Down, Enter (and Space when there is no search
 * box) to choose, Escape to close. `FontPicker`, `ThemeSelect` and `MultiSelect` are built on it.
 * For a plain form field, `Select` (the native control) is still the better default, especially on phones.
 */
export function Combobox(props: ComboboxProps) {
  const {
    options,
    label,
    placeholder = 'Select…',
    hint,
    error,
    disabled,
    name,
    id,
    className,
    triggerClassName,
    popupClassName,
    align = 'left',
    searchable = 'auto',
    searchPlaceholder = 'Search…',
    filterOptions = true,
    emptyMessage = 'No matches.',
    renderValue,
    renderOption,
    header,
    notice,
    footer,
    onOpenChange,
    onListScroll,
    onReachEnd,
    clearLabel = 'Clear selection',
  } = props
  const multiple = props.multiple === true
  const selectedValues: string[] = multiple ? (props.value as string[]) : props.value ? [props.value as string] : []

  const uid = useId()
  const triggerId = id ?? `${uid}-trigger`
  const listId = `${uid}-list`
  const noteId = `${uid}-note`
  const optionId = (i: number) => `${uid}-opt-${i}`

  const [open, setOpenState] = useState(false)
  const [internalQuery, setInternalQuery] = useState('')
  const query = props.query ?? internalQuery
  const setQuery = (q: string) => {
    setInternalQuery(q)
    props.onQueryChange?.(q)
  }
  const [active, setActive] = useState(0)
  const [keyboardNav, setKeyboardNav] = useState(false)
  const [side, setSide] = useState<'left' | 'right'>(align)
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const popup = useRef<HTMLDivElement>(null)
  const list = useRef<HTMLUListElement>(null)
  const search = useRef<HTMLInputElement>(null)
  const centerSelected = useRef(false) // scroll the selected row into the middle once it exists
  const scrollToActive = useRef(false) // after arrow keys only, so wheel and scrollbar are never fought

  const hasSearch = searchable === 'auto' ? options.length > SEARCH_AUTO_THRESHOLD : searchable
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!filterOptions || !q) return options
    return options.filter((o) => `${o.label} ${o.keywords ?? ''}`.toLowerCase().includes(q))
  }, [options, query, filterOptions])

  const setOpen = (next: boolean) => {
    if (next === open) return
    setOpenState(next)
    onOpenChange?.(next)
  }

  const openList = () => {
    if (disabled) return
    setQuery('')
    const sel = options.findIndex((o) => selectedValues.includes(o.value))
    setActive(Math.max(0, sel))
    setKeyboardNav(false)
    centerSelected.current = true // stays armed until the selected row exists (a lazy list may add it later) or the user scrolls
    setSide(align)
    setOpen(true)
  }

  const closeList = (returnFocus = true) => {
    setOpen(false)
    if (returnFocus) trigger.current?.focus()
  }

  const choose = (o: ComboboxOption | undefined) => {
    if (!o || o.disabled) return
    if (multiple) {
      const cur = props.value as string[]
      ;(props.onChange as (v: string[]) => void)(cur.includes(o.value) ? cur.filter((v) => v !== o.value) : [...cur, o.value])
    } else {
      ;(props.onChange as (v: string) => void)(o.value)
      closeList()
    }
  }

  // Close when the user presses anywhere else.
  useEffect(() => {
    if (!open) return
    const away = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', away)
    return () => document.removeEventListener('pointerdown', away)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // The search box takes focus when the popup opens (not on touch screens, where it would raise the keyboard).
  useEffect(() => {
    if (open && hasSearch && !window.matchMedia?.('(pointer: coarse)').matches) search.current?.focus()
  }, [open, hasSearch])

  // Keep the popup on screen: flip to the other edge if it would run off.
  useLayoutEffect(() => {
    if (!open || !popup.current) return
    const r = popup.current.getBoundingClientRect()
    if (side === 'left' && r.right > window.innerWidth - 8 && r.width < window.innerWidth) setSide('right')
    else if (side === 'right' && r.left < 8) setSide('left')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Centre the selected row the first time it is rendered after opening.
  useLayoutEffect(() => {
    if (!open || !centerSelected.current) return
    const l = list.current
    const el = l?.querySelector<HTMLElement>('[aria-selected="true"]')
    if (!l || !el) return
    l.scrollTop = el.offsetTop - l.clientHeight / 2 + el.clientHeight / 2
    centerSelected.current = false
    onListScroll?.(l)
  })

  // After arrow-key navigation keep the highlighted row inside the scrolled area.
  useLayoutEffect(() => {
    if (!open || !scrollToActive.current) return
    const l = list.current
    const el = document.getElementById(optionId(active))
    if (!l || !el) return
    scrollToActive.current = false
    if (el.offsetTop < l.scrollTop) l.scrollTop = el.offsetTop
    else if (el.offsetTop + el.offsetHeight > l.scrollTop + l.clientHeight) l.scrollTop = el.offsetTop + el.offsetHeight - l.clientHeight
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, open, shown])

  // A new search starts again from the top.
  useEffect(() => {
    if (!open) return
    setActive(0)
    centerSelected.current = false
    if (list.current) list.current.scrollTop = 0
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  const move = (to: number) => {
    const i = Math.min(Math.max(to, 0), shown.length - 1)
    setKeyboardNav(true)
    centerSelected.current = false
    scrollToActive.current = true
    setActive(i)
    if (i >= shown.length - 3) onReachEnd?.()
  }

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (!open) {
      if (e.target === trigger.current && ['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault()
        openList()
      }
      return
    }
    switch (e.key) {
      case 'ArrowDown':
        move(active + 1)
        break
      case 'ArrowUp':
        move(active - 1)
        break
      case 'PageDown':
        move(active + 8)
        break
      case 'PageUp':
        move(active - 8)
        break
      case 'Home':
        if (hasSearch) return // Home/End move the caret in the search box
        move(0)
        break
      case 'End':
        if (hasSearch) return
        move(shown.length - 1)
        break
      case 'Enter':
        choose(shown[active])
        break
      case ' ':
        if (hasSearch) return // a space is part of the search text
        choose(shown[active])
        break
      case 'Escape':
        e.stopPropagation()
        closeList()
        break
      case 'Tab':
        setOpen(false)
        return
      default:
        return
    }
    e.preventDefault()
  }

  const onScroll = (e: UIEvent<HTMLUListElement>) => {
    const el = e.currentTarget
    onListScroll?.(el)
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 80) onReachEnd?.()
  }

  const selectedOptions = options.filter((o) => selectedValues.includes(o.value))
  const note = error ?? hint
  const activeId = open && shown[active] ? optionId(active) : undefined

  let triggerContent: ReactNode
  if (multiple) {
    const names = selectedOptions.map((o) => o.label)
    // the placeholder is grey, as in single mode; chosen values are normal text
    triggerContent = (
      <span className={clsx('truncate', names.length === 0 && 'text-gray-500')}>
        {names.length === 0 ? placeholder : names.length <= 2 ? names.join(', ') : `${names.length} selected`}
      </span>
    )
  } else if (renderValue) {
    triggerContent = renderValue(selectedOptions[0])
  } else {
    triggerContent = selectedOptions[0] ? (
      <span className="flex min-w-0 items-center gap-2">
        {selectedOptions[0].icon}
        <span className="truncate">{selectedOptions[0].label}</span>
      </span>
    ) : (
      <span className="truncate text-gray-500">{placeholder}</span>
    )
  }

  const triggerName =
    props['aria-label'] ?? (label ? `${label}${selectedOptions.length ? `: ${selectedOptions.map((o) => o.label).join(', ')}` : ''}` : undefined)

  return (
    <div
      ref={root}
      className={clsx('relative', className)}
      onBlur={(e) => {
        // Tabbing out closes it (a blur with no target, e.g. a scrollbar drag, does not).
        if (open && e.relatedTarget && !root.current?.contains(e.relatedTarget as Node)) setOpen(false)
      }}
    >
      {label && (
        <label htmlFor={triggerId} className="mb-1 block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <button
        ref={trigger}
        id={triggerId}
        type="button"
        // with a search box, the box is the combobox and the trigger is a plain popup button
        role={hasSearch ? undefined : 'combobox'}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open && !hasSearch ? activeId : undefined}
        aria-label={triggerName}
        aria-invalid={!!error || undefined}
        aria-describedby={note ? noteId : undefined}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        className={clsx(
          'flex w-full cursor-default items-center justify-between gap-2 rounded-lg border bg-surface px-3 py-2 text-left text-sm text-gray-900',
          'focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400',
          error ? 'border-danger' : multiple && selectedValues.length ? 'border-brand-500' : 'border-gray-300',
          triggerClassName,
        )}
      >
        <span className="min-w-0 flex-1">{triggerContent}</span>
        <ChevronUpDownIcon className="h-5 w-5 shrink-0 text-gray-500" />
      </button>

      {open && (
        <div
          ref={popup}
          // Pressing rows, chips, padding or the scrollbar must not pull focus out of the control:
          // non-focusable areas would hand it to an ancestor and the blur handler would close the popup.
          onMouseDown={(e) => {
            if (!(e.target instanceof HTMLInputElement)) e.preventDefault()
          }}
          className={clsx(
            'absolute z-40 mt-1 rounded-lg border border-gray-200 bg-surface shadow-sm',
            side === 'right' ? 'right-0' : 'left-0',
            popupClassName ?? 'w-full min-w-max',
            hasSearch || header ? 'p-2' : 'p-1',
          )}
        >
          {hasSearch && (
            <div className="relative">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                ref={search}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                role="combobox"
                aria-expanded
                aria-controls={listId}
                aria-autocomplete="list"
                aria-activedescendant={activeId}
                aria-label={`Search ${label ?? props['aria-label'] ?? 'options'}`}
                placeholder={searchPlaceholder}
                className="w-full rounded-md border border-gray-300 bg-surface py-1.5 pl-8 pr-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400"
              />
            </div>
          )}
          {header && <div className="mt-2">{header}</div>}
          <div className={clsx('relative', (hasSearch || header) && 'mt-2')}>
          <ul
            ref={list}
            id={listId}
            role="listbox"
            aria-label={label ?? props['aria-label'] ?? 'Options'}
            aria-multiselectable={multiple || undefined}
            onScroll={onScroll}
            onWheel={() => (centerSelected.current = false)}
            onPointerDown={() => (centerSelected.current = false)}
            className={clsx('relative max-h-64 overflow-y-auto pr-3', scrollbarHidden)}
          >
            {notice && <li role="presentation">{notice}</li>}
            {shown.map((o, i) => {
              const selected = selectedValues.includes(o.value)
              return (
                <li
                  key={o.value}
                  id={optionId(i)}
                  role="option"
                  aria-selected={selected}
                  aria-disabled={o.disabled || undefined}
                  onClick={() => choose(o)}
                  onMouseMove={() => {
                    setKeyboardNav(false)
                    if (i !== active) setActive(i)
                  }}
                  className={clsx(
                    'flex cursor-default items-center gap-2 rounded-md px-3 py-1.5 text-sm text-gray-800',
                    i === active && 'bg-gray-100',
                    // keyboard focus indicator; not shown on hover
                    i === active && keyboardNav && 'ring-2 ring-inset ring-brand-300',
                    selected && !multiple && 'bg-accent-soft font-medium',
                    o.disabled && 'opacity-50',
                  )}
                >
                  {renderOption ? (
                    renderOption(o, { selected, active: i === active })
                  ) : (
                    <>
                      {multiple && (
                        <span
                          aria-hidden="true"
                          className={clsx('flex h-4 w-4 shrink-0 items-center justify-center rounded border', selected ? 'border-brand-600 bg-brand-600 text-white' : 'border-gray-300 bg-surface')}
                        >
                          {selected && <CheckIcon className="h-3 w-3" />}
                        </span>
                      )}
                      {o.icon}
                      <span className="flex-1 whitespace-nowrap">{o.label}</span>
                      {o.meta !== undefined && <span className="text-xs tabular-nums text-gray-600">{o.meta}</span>}
                      {!multiple && selected && <CheckIcon className="h-4 w-4 shrink-0 text-accent" />}
                    </>
                  )}
                </li>
              )
            })}
            {shown.length === 0 && !notice && (
              <li role="presentation" className="px-3 py-2 text-sm text-gray-500">
                {emptyMessage}
              </li>
            )}
            {footer && <li role="presentation">{footer}</li>}
          </ul>
          <ScrollRail target={list} />
          </div>
          {multiple && selectedValues.length > 0 && (
            <button
              type="button"
              onClick={() => (props.onChange as (v: string[]) => void)([])}
              className="mt-1 w-full rounded-md border-t border-gray-100 px-2.5 py-1.5 text-left text-xs font-medium text-accent hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
            >
              {clearLabel}
            </button>
          )}
        </div>
      )}

      {name && (multiple ? selectedValues.map((v) => <input key={v} type="hidden" name={name} value={v} />) : <input type="hidden" name={name} value={selectedValues[0] ?? ''} />)}

      {note && (
        <p id={noteId} className={clsx('mt-1 text-xs', error ? 'text-danger-ink' : 'text-gray-500')}>
          {note}
        </p>
      )}
    </div>
  )
}
