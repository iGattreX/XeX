import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import clsx from 'clsx'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid'
import { useTheme } from './ThemeContext'

/** A theme's primary colour, as shown beside its name. */
function Dot({ color }: { color: string }) {
  return <span className="h-4 w-4 shrink-0 rounded-full ring-1 ring-black/10" style={{ backgroundColor: color }} aria-hidden="true" />
}

/**
 * Dropdown to pick the colour theme: each option shows the theme's primary colour and its name.
 * Arrow keys / Home / End move, Enter or Space picks, Escape closes.
 */
export function ThemeSelect({ className, align = 'right' }: { className?: string; align?: 'left' | 'right' }) {
  const { theme, themes, setThemeId } = useTheme()
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const baseId = useId()
  const listId = `${baseId}-list`
  const optionId = (i: number) => `${baseId}-opt-${i}`
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const list = useRef<HTMLUListElement>(null)

  const openList = () => {
    setActive(Math.max(0, themes.findIndex((t) => t.id === theme.id)))
    setOpen(true)
  }

  const choose = (i: number) => {
    setThemeId(themes[i].id)
    setOpen(false)
    trigger.current?.focus()
  }

  // Close when the user presses anywhere else.
  useEffect(() => {
    if (!open) return
    const away = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', away)
    return () => document.removeEventListener('pointerdown', away)
  }, [open])

  // Keep the active option in view as the arrows move through a long list.
  useEffect(() => {
    if (open) list.current?.children[active]?.scrollIntoView({ block: 'nearest' })
  }, [open, active])

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const last = themes.length - 1
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault()
        openList()
      }
      return
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActive((i) => Math.min(last, i + 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setActive((i) => Math.max(0, i - 1))
        break
      case 'Home':
        e.preventDefault()
        setActive(0)
        break
      case 'End':
        e.preventDefault()
        setActive(last)
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        choose(active)
        break
      case 'Escape':
        e.preventDefault()
        e.stopPropagation()
        setOpen(false)
        break
      case 'Tab':
        setOpen(false)
        break
    }
  }

  return (
    <div ref={root} className={clsx('relative', className)}>
      <button
        ref={trigger}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? optionId(active) : undefined}
        aria-label={`Color theme: ${theme.name}`}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        className="flex w-44 items-center gap-2 rounded-lg border border-gray-300 bg-surface px-2.5 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
      >
        <Dot color={theme.shades[600]} />
        <span className="flex-1 truncate text-left">{theme.name}</span>
        <ChevronUpDownIcon className="h-4 w-4 shrink-0 text-gray-500" />
      </button>
      {open && (
        <ul
          ref={list}
          id={listId}
          role="listbox"
          aria-label="Color theme"
          // keep focus on the trigger while the pointer works the list (the same fix as the font picker)
          onMouseDown={(e) => e.preventDefault()}
          className={clsx(
            'absolute z-40 mt-2 max-h-[min(26rem,70vh)] w-56 overflow-auto rounded-xl border border-gray-200 bg-surface py-1 shadow-lg',
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          {themes.map((t, i) => (
            <li
              key={t.id}
              id={optionId(i)}
              role="option"
              aria-selected={t.id === theme.id}
              onClick={() => choose(i)}
              onMouseMove={() => active !== i && setActive(i)}
              className={clsx('flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-gray-900', i === active && 'bg-gray-100')}
            >
              <Dot color={t.shades[600]} />
              <span className="flex-1">{t.name}</span>
              {t.id === theme.id && <CheckIcon className="h-4 w-4 text-accent" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
