import { cloneElement, isValidElement, useEffect, useId, useLayoutEffect, useRef, useState, type ReactElement, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'

type Placement = 'top' | 'bottom' | 'left' | 'right'

export interface TooltipProps {
  /** What the tooltip says. Keep it short: a name or a hint, not essential information. */
  content: ReactNode
  /** The element the tooltip describes: one element that can take `aria-describedby` (a button, a link, an input). */
  children: ReactElement
  /**
   * `pointer` (default): just below and right of the mouse pointer, clear of the cursor, as the browser's own tooltips (below the control for
   * keyboard focus, where there is no pointer). Or a side of the control. Either way it moves to where there is
   * room rather than leave the screen.
   */
  placement?: Placement | 'pointer'
  /** Milliseconds of hovering before it opens. Keyboard focus opens it at once. Default 300. */
  delay?: number
  /** Turn the tooltip off (it renders nothing extra). */
  disabled?: boolean
  /** Classes for the wrapper (default `inline-flex`): where it sits in a layout, or when it is hidden. */
  className?: string
}

const OPPOSITE: Record<Placement, Placement> = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' }

const GAP = 6 // between the control and the tooltip
// Clear of the cursor image, which hangs below and to the right of the pointer's hotspot (a hand is bigger than an arrow).
const POINTER_OFFSET = 24 // below the pointer
const POINTER_OFFSET_X = 14 // and to its right
const MARGIN = 8 // the tooltip never gets closer than this to the edge of the screen
const LONG_PRESS_MS = 500
const TOUCH_VISIBLE_MS = 2500

interface Spot {
  left: number
  top: number
}

/**
 * Where the tooltip goes: on the preferred side if it fits, else the opposite side, else the side with
 * the most room; then slid along that side, and finally clamped, so it is always fully inside the screen.
 */
/** Below and a little right of the pointer (clear of the cursor image), or above it when there is no room below; clamped to the screen. */
export function placeAtPointer(point: { x: number; y: number }, size: { width: number; height: number }, viewport: { width: number; height: number }): Spot {
  const below = point.y + POINTER_OFFSET
  const top = below + size.height <= viewport.height - MARGIN ? below : point.y - GAP - size.height
  return {
    left: Math.min(Math.max(point.x + POINTER_OFFSET_X, MARGIN), Math.max(MARGIN, viewport.width - MARGIN - size.width)),
    top: Math.min(Math.max(top, MARGIN), Math.max(MARGIN, viewport.height - MARGIN - size.height)),
  }
}

export function placeTooltip(target: DOMRect, size: { width: number; height: number }, viewport: { width: number; height: number }, preferred: Placement): Spot {
  const room: Record<Placement, number> = {
    top: target.top - GAP - MARGIN,
    bottom: viewport.height - target.bottom - GAP - MARGIN,
    left: target.left - GAP - MARGIN,
    right: viewport.width - target.right - GAP - MARGIN,
  }
  const need = (p: Placement) => (p === 'top' || p === 'bottom' ? size.height : size.width)
  const fits = (p: Placement) => room[p] >= need(p)
  const side = fits(preferred)
    ? preferred
    : fits(OPPOSITE[preferred])
      ? OPPOSITE[preferred]
      : (Object.keys(room) as Placement[]).reduce((best, p) => (room[p] > room[best] ? p : best), preferred)

  let left: number
  let top: number
  if (side === 'top' || side === 'bottom') {
    left = target.left + target.width / 2 - size.width / 2
    top = side === 'top' ? target.top - GAP - size.height : target.bottom + GAP
  } else {
    top = target.top + target.height / 2 - size.height / 2
    left = side === 'left' ? target.left - GAP - size.width : target.right + GAP
  }
  return {
    left: Math.min(Math.max(left, MARGIN), Math.max(MARGIN, viewport.width - MARGIN - size.width)),
    top: Math.min(Math.max(top, MARGIN), Math.max(MARGIN, viewport.height - MARGIN - size.height)),
  }
}

/**
 * A short label for a control, shown on hover or keyboard focus (and on a long press on touch screens),
 * in place of the browser's `title` tooltip: it follows the theme, appears quickly, can be dismissed with
 * Escape, stays open while the pointer is over it, and is always kept inside the screen (and clear of any
 * overflow clipping and from the stacking layer of whatever it sits in, since it is drawn at the top level of the
 * page and positioned against the viewport). The text is linked to the control with
 * `aria-describedby`, so screen readers read it whether or not it is showing.
 */
export function Tooltip({ content, children, placement = 'top', delay = 300, disabled = false, className }: TooltipProps) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [spot, setSpot] = useState<Spot | null>(null)
  const wrapper = useRef<HTMLSpanElement>(null)
  const tip = useRef<HTMLSpanElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const pressTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  // Where the mouse is, and whether the tooltip opened because of it (else: keyboard focus or a long press).
  const pointer = useRef<{ x: number; y: number } | null>(null)
  const viaPointer = useRef(false)

  const clear = () => {
    clearTimeout(timer.current)
    clearTimeout(pressTimer.current)
  }
  const show = (after: number, fromPointer = false) => {
    clear()
    viaPointer.current = fromPointer
    timer.current = setTimeout(() => setOpen(true), after)
  }
  const hide = (after = 0) => {
    clear()
    timer.current = setTimeout(() => setOpen(false), after) // a short grace so the pointer can cross the gap to the tooltip
  }
  useEffect(() => clear, [])

  // Measure and place it before it is painted, and again if the page scrolls or resizes while it is open.
  useLayoutEffect(() => {
    if (!open) {
      setSpot(null)
      return
    }
    const place = () => {
      if (!wrapper.current || !tip.current) return
      const size = { width: tip.current.offsetWidth, height: tip.current.offsetHeight }
      // the area inside any scrollbars (innerWidth/innerHeight include them, and a tooltip must not slide under one)
      const viewport = { width: document.documentElement.clientWidth, height: document.documentElement.clientHeight }
      const next =
        placement === 'pointer' && viaPointer.current && pointer.current
          ? placeAtPointer(pointer.current, size, viewport) // where the mouse was when it opened; it does not follow
          : placeTooltip(wrapper.current.getBoundingClientRect(), size, viewport, placement === 'pointer' ? 'bottom' : placement)
      setSpot((s) => (s && s.left === next.left && s.top === next.top ? s : next))
    }
    place()
    window.addEventListener('scroll', place, true)
    window.addEventListener('resize', place)
    return () => {
      window.removeEventListener('scroll', place, true)
      window.removeEventListener('resize', place)
    }
  }, [open, placement, content])

  // Escape dismisses it without moving focus.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  if (disabled || !isValidElement(children)) return children

  return (
    <span
      ref={wrapper}
      className={clsx('relative', className ?? 'inline-flex')}
      onMouseEnter={(e) => {
        pointer.current = { x: e.clientX, y: e.clientY }
        show(delay, true)
      }}
      onMouseMove={(e) => {
        if (!open) pointer.current = { x: e.clientX, y: e.clientY } // until it opens, the spot follows the mouse
      }}
      onMouseLeave={() => hide(100)}
      onFocusCapture={(e) => {
        // keyboard focus only: clicking a control should not also pop a tooltip
        if ((e.target as HTMLElement).matches?.(':focus-visible')) show(0)
      }}
      onBlurCapture={() => hide()}
      onPointerDown={(e) => {
        if (e.pointerType === 'touch') {
          clear()
          pressTimer.current = setTimeout(() => {
            setOpen(true)
            timer.current = setTimeout(() => setOpen(false), TOUCH_VISIBLE_MS)
          }, LONG_PRESS_MS)
        } else hide() // a click dismisses it
      }}
      onPointerUp={() => clearTimeout(pressTimer.current)}
      onPointerCancel={() => clearTimeout(pressTimer.current)}
    >
      {cloneElement(children as ReactElement<{ 'aria-describedby'?: string }>, {
        'aria-describedby': [(children.props as { 'aria-describedby'?: string })['aria-describedby'], id].filter(Boolean).join(' '),
      })}
      {createPortal(
        <span
          ref={tip}
          id={id}
          role="tooltip"
          // Always in the document, so aria-describedby can read it; only drawn while open. In a portal at the
          // top of the page and fixed to the viewport: no overflow container can clip it, and no parent's
          // stacking layer (a header, a drawer) can put it behind other content. Measured, then placed, before paint.
          hidden={!open}
          style={{ position: 'fixed', left: spot?.left ?? 0, top: spot?.top ?? 0, visibility: spot ? 'visible' : 'hidden' }}
          className="pointer-events-auto z-[100] w-max max-w-[min(20rem,calc(100vw-1rem))] rounded-md bg-gray-900 px-2 py-1 text-xs font-medium leading-snug text-surface shadow-sm"
        >
          {content}
        </span>,
        document.body,
      )}
    </span>
  )
}
