import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent, type RefObject } from 'react'
import clsx from 'clsx'

const MIN_THUMB = 28
const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

/**
 * A thin scroll control for a scrollable element, in the style of the "On this page" rail: a 1px line
 * with a brand-coloured marker that grows on hover. Press anywhere on it to glide there, then drag.
 * Pair it with the target's native scrollbar hidden (`scrollbarHidden`). Pointer-only and decorative:
 * the wheel, touch and keys keep scrolling the element itself.
 *
 * Place it inside a `relative` wrapper around the target.
 */
export function ScrollRail({ target, className }: { target: RefObject<HTMLElement | null>; className?: string }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const thumbRef = useRef<HTMLSpanElement>(null)
  const frame = useRef(0)
  const [scrollable, setScrollable] = useState(false)
  const [dragging, setDragging] = useState(false)

  // Size and place the marker from the target's scroll state (direct style writes: no re-render per scroll).
  const update = () => {
    const el = target.current
    const thumb = thumbRef.current
    const track = trackRef.current
    if (!el || !thumb || !track) return
    const can = el.scrollHeight > el.clientHeight + 1
    setScrollable((s) => (s === can ? s : can))
    if (!can) return
    const trackH = track.clientHeight
    const h = Math.max(MIN_THUMB, (el.clientHeight / el.scrollHeight) * trackH)
    const max = el.scrollHeight - el.clientHeight
    const top = max > 0 ? (el.scrollTop / max) * (trackH - h) : 0
    thumb.style.height = `${h}px`
    thumb.style.transform = `translateY(${top}px)`
  }

  useLayoutEffect(() => {
    const el = target.current
    if (!el) return
    const schedule = () => {
      cancelAnimationFrame(frame.current)
      frame.current = requestAnimationFrame(update)
    }
    update()
    el.addEventListener('scroll', schedule, { passive: true })
    // rows added by lazy loading change scrollHeight without resizing the box
    const mo = new MutationObserver(schedule)
    mo.observe(el, { childList: true, subtree: true })
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedule)
    ro?.observe(el)
    return () => {
      cancelAnimationFrame(frame.current)
      el.removeEventListener('scroll', schedule)
      mo.disconnect()
      ro?.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target])

  useEffect(() => {
    if (scrollable) update()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollable])

  // Pointer position on the rail -> the scroll position that centres the marker there.
  const scrubTo = (clientY: number, smooth: boolean) => {
    const el = target.current
    const track = trackRef.current
    if (!el || !track) return
    const rect = track.getBoundingClientRect()
    const h = Math.max(MIN_THUMB, (el.clientHeight / el.scrollHeight) * rect.height)
    const ratio = Math.min(1, Math.max(0, (clientY - rect.top - h / 2) / (rect.height - h)))
    const top = ratio * (el.scrollHeight - el.clientHeight)
    if (smooth && !reducedMotion() && typeof el.scrollTo === 'function') el.scrollTo({ top, behavior: 'smooth' })
    else el.scrollTop = top
  }

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    e.preventDefault() // keep focus where it is (the search box)
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragging(true)
    scrubTo(e.clientY, true) // press = glide to that spot; dragging then tracks the pointer 1:1
  }
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (dragging) scrubTo(e.clientY, false)
  }
  const endDrag = (e: PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId)
    setDragging(false)
  }

  return (
    <div
      ref={trackRef}
      aria-hidden="true"
      data-scroll-rail
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      className={clsx(
        'group absolute inset-y-0 right-0 z-10 w-3 touch-none select-none',
        scrollable ? (dragging ? 'cursor-grabbing' : 'cursor-grab') : 'hidden',
        className,
      )}
    >
      <span className="absolute bottom-0 right-1 top-0 w-px bg-gray-200" />
      <span
        ref={thumbRef}
        className={clsx(
          'pointer-events-none absolute right-1 top-0 rounded-full bg-brand-600 transition-[width,margin] duration-150',
          dragging ? '-mr-px w-1' : 'w-0.5 group-hover:-mr-px group-hover:w-1',
        )}
      />
    </div>
  )
}

/** Classes that hide an element's native scrollbar while it still scrolls. */
export const scrollbarHidden = '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
