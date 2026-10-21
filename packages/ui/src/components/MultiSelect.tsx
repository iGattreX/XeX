import { useEffect, useId, useRef, useState } from 'react'
import clsx from 'clsx'
import { ChevronDownIcon } from '@heroicons/react/20/solid'

export interface MultiSelectOption {
  value: string
  label: string
  /** Optional count shown beside the label. */
  count?: number
}

export interface MultiSelectProps {
  options: MultiSelectOption[]
  value: string[]
  onChange: (value: string[]) => void
  /** Text shown (and used as the accessible name) when nothing is selected, e.g. "All roles". */
  label: string
  className?: string
}

/** Dropdown with a checkbox per option. Esc / outside click / tabbing away closes it. */
export function MultiSelect({ options, value, onChange, label, className }: MultiSelectProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelId = useId()

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

  const labels = options.filter((o) => value.includes(o.value)).map((o) => o.label)
  const summary = labels.length === 0 ? label : labels.length <= 2 ? labels.join(', ') : `${labels.length} selected`

  const toggle = (v: string) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v])

  return (
    <div
      ref={rootRef}
      className={clsx('relative', className)}
      onBlur={(e) => {
        if (open && e.relatedTarget && !rootRef.current?.contains(e.relatedTarget as Node)) setOpen(false)
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={labels.length ? `${label}: ${labels.join(', ')}` : label}
        onClick={() => setOpen((o) => !o)}
        className={clsx(
          'flex w-full items-center justify-between gap-2 rounded-lg border bg-surface px-3 py-2 text-left text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400',
          value.length ? 'border-brand-500 text-gray-900' : 'border-gray-300 text-gray-500',
        )}
      >
        <span className="truncate">{summary}</span>
        <ChevronDownIcon className="h-5 w-5 shrink-0 text-gray-500" />
      </button>

      {open && (
        <div
          id={panelId}
          role="group"
          aria-label={label}
          // Pressing label text / padding must not shift focus to an ancestor (e.g. <main tabindex=-1>):
          // the blur handler would read that as tabbing away, close the panel and swallow the click.
          onMouseDown={(e) => {
            if (!(e.target instanceof HTMLInputElement)) e.preventDefault()
          }}
          className="absolute left-0 z-20 mt-1 max-h-64 min-w-full overflow-y-auto rounded-xl border border-gray-200 bg-surface p-1 shadow-sm"
        >
          {options.map((o) => (
            <label key={o.value} className="flex cursor-default items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-gray-800 hover:bg-gray-50">
              <input type="checkbox" className="h-4 w-4 rounded" checked={value.includes(o.value)} onChange={() => toggle(o.value)} />
              <span className="flex-1 whitespace-nowrap">{o.label}</span>
              {o.count !== undefined && <span className="text-xs tabular-nums text-gray-500">{o.count}</span>}
            </label>
          ))}
          {value.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="mt-1 w-full rounded-md border-t border-gray-100 px-2.5 py-1.5 text-left text-xs font-medium text-accent hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
            >
              Clear selection
            </button>
          )}
        </div>
      )}
    </div>
  )
}
