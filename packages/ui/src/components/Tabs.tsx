import { useCallback, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import clsx from 'clsx'

export interface TabItem {
  id: string
  label: ReactNode
  icon?: ReactNode
  /** Small trailing count or tag, e.g. 12. */
  badge?: ReactNode
  disabled?: boolean
  /** Panel content. Omit if you render panels yourself and only use the tab strip. */
  content?: ReactNode
}

export interface TabsProps {
  items: TabItem[]
  /** Controlled selection. Pair with `onChange`. */
  value?: string
  /** Initial selection when uncontrolled. Defaults to the first enabled tab. */
  defaultValue?: string
  onChange?: (id: string) => void
  /** `underline` (default) slides a line under the active tab; `pills` fills it. */
  variant?: 'underline' | 'pills'
  size?: 'sm' | 'md'
  /** `auto`: arrow keys select as they move focus. `manual`: arrows only move focus; Enter/Space select. */
  activation?: 'auto' | 'manual'
  /** Keep inactive panels mounted (hidden) so their state survives switching. Default: unmount. */
  keepMounted?: boolean
  /** Stretch tabs to share the full width. */
  fullWidth?: boolean
  /** Accessible name for the tab list. */
  label: string
  className?: string
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2.5 text-sm gap-2',
}

export function Tabs({
  items,
  value,
  defaultValue,
  onChange,
  variant = 'underline',
  size = 'md',
  activation = 'auto',
  keepMounted = false,
  fullWidth = false,
  label,
  className,
}: TabsProps) {
  const uid = useId()
  const firstEnabled = items.find((i) => !i.disabled)?.id ?? items[0]?.id
  const [internal, setInternal] = useState(defaultValue ?? firstEnabled)
  const selected = value ?? internal
  const select = (id: string) => {
    if (value === undefined) setInternal(id)
    onChange?.(id)
  }

  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const trackRef = useRef<HTMLDivElement>(null)
  const [line, setLine] = useState<{ left: number; width: number } | null>(null)

  const tabId = (id: string) => `${uid}-tab-${id}`
  const panelId = (id: string) => `${uid}-panel-${id}`

  // Place the sliding underline under the selected tab; re-measure when the strip resizes.
  const measure = useCallback(() => {
    const el = tabRefs.current[selected]
    if (el) setLine({ left: el.offsetLeft, width: el.offsetWidth })
  }, [selected])

  useLayoutEffect(() => {
    measure()
    const track = trackRef.current
    if (!track) return
    const ro = new ResizeObserver(measure)
    ro.observe(track)
    return () => ro.disconnect()
  }, [measure, items.length])

  // Roving tabindex: only the selected tab is a Tab stop; arrows move between the rest.
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const enabled = items.filter((i) => !i.disabled)
    if (enabled.length === 0) return
    const current = enabled.findIndex((i) => tabRefs.current[i.id] === document.activeElement)
    let next = -1
    if (e.key === 'ArrowRight') next = current < 0 ? 0 : (current + 1) % enabled.length
    else if (e.key === 'ArrowLeft') next = current < 0 ? enabled.length - 1 : (current - 1 + enabled.length) % enabled.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = enabled.length - 1
    if (next < 0) return
    e.preventDefault()
    const target = enabled[next]
    tabRefs.current[target.id]?.focus()
    tabRefs.current[target.id]?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    if (activation === 'auto') select(target.id)
  }

  return (
    <div className={className}>
      <div className={clsx(variant === 'underline' && 'border-b border-gray-200')}>
        {/* Scroll box with 6px of room on every side (cancelled by negative margins) so focus rings are not clipped. */}
        <div className="-m-1.5 scroll-px-2 overflow-x-auto p-1.5">
        <div
          ref={trackRef}
          role="tablist"
          aria-label={label}
          onKeyDown={onKeyDown}
          className={clsx('relative flex', variant === 'pills' && 'gap-1', fullWidth ? 'w-full' : 'w-max min-w-full')}
        >
          {items.map((item) => {
            const isSelected = item.id === selected
            return (
              <button
                key={item.id}
                ref={(node) => {
                  tabRefs.current[item.id] = node
                }}
                id={tabId(item.id)}
                type="button"
                role="tab"
                aria-selected={isSelected}
                aria-controls={item.content !== undefined && (isSelected || keepMounted) ? panelId(item.id) : undefined}
                tabIndex={isSelected ? 0 : -1}
                disabled={item.disabled}
                onClick={() => select(item.id)}
                className={clsx(
                  'inline-flex shrink-0 items-center justify-center whitespace-nowrap font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 disabled:cursor-not-allowed disabled:opacity-50',
                  sizes[size],
                  fullWidth && 'flex-1',
                  variant === 'underline'
                    ? clsx('rounded-t-lg', isSelected ? 'text-brand-700' : 'text-gray-500 hover:text-gray-800')
                    : clsx('rounded-full', isSelected ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-100'),
                )}
              >
                {item.icon}
                {item.label}
                {item.badge !== undefined && (
                  <span
                    className={clsx(
                      'rounded-full px-1.5 py-px text-[11px] font-semibold tabular-nums',
                      isSelected ? (variant === 'pills' ? 'bg-white/25 text-white' : 'bg-brand-100 text-brand-700') : 'bg-gray-100 text-gray-600',
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
          {variant === 'underline' && line && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-px left-0 h-0.5 rounded-full bg-brand-600 transition-[transform,width] duration-200 ease-out motion-reduce:transition-none"
              style={{ width: line.width, transform: `translateX(${line.left}px)` }}
            />
          )}
        </div>
        </div>
      </div>

      {items.map((item) => {
        const isSelected = item.id === selected
        if (item.content === undefined || (!isSelected && !keepMounted)) return null
        return (
          <div key={item.id} id={panelId(item.id)} role="tabpanel" aria-labelledby={tabId(item.id)} hidden={!isSelected} tabIndex={0} className="pt-4">
            {item.content}
          </div>
        )
      })}
    </div>
  )
}
