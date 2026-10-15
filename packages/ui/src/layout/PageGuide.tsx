import { useCallback, useLayoutEffect, useRef, useState, type PointerEvent } from 'react'
import clsx from 'clsx'
import type { PageSection } from './Section'

/** Distance from the viewport top at which a section counts as "reached" (matches `scroll-mt-24`). */
const OFFSET = 96

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * ScrollY at which each section is "reached". Sections too close to the page bottom to ever
 * reach the offset are spread evenly over the final stretch, so the marker still arrives at
 * the last section exactly when the page bottoms out.
 */
function anchors(ids: string[]): number[] {
  const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
  const ys = ids.map((id) => {
    const el = document.getElementById(id)
    return el ? Math.max(0, el.getBoundingClientRect().top + window.scrollY - OFFSET) : 0
  })
  for (let i = 1; i < ys.length; i++) ys[i] = Math.max(ys[i], ys[i - 1])
  const k = ys.findIndex((y) => y >= max - 1)
  if (k >= 0) {
    const base = k > 0 ? ys[k - 1] : 0
    for (let i = k; i < ys.length; i++) ys[i] = base + ((max - base) * (i - k + 1)) / (ys.length - k)
  }
  return ys
}

/** Fractional section index for a scroll position (2.5 = halfway between sections 2 and 3). */
function posAt(ys: number[], y: number): number {
  const n = ys.length
  if (n === 0 || y <= ys[0]) return 0
  let i = n - 1
  while (i > 0 && ys[i] > y) i--
  if (i >= n - 1) return n - 1
  const span = ys[i + 1] - ys[i]
  return span > 0 ? i + (y - ys[i]) / span : i
}

function scrollYFor(ys: number[], pos: number): number {
  const i = Math.min(Math.floor(pos), ys.length - 1)
  if (i >= ys.length - 1) return ys[ys.length - 1]
  return ys[i] + (ys[i + 1] - ys[i]) * (pos - i)
}

/**
 * Floating "On this page" guide (xl+ only). The marker's position is a continuous function of
 * the page's scroll position, so it glides with the page instead of hopping between items.
 * The rail itself is a pointer scrubber: press or drag it to scroll the page. It is hidden from
 * assistive tech and the tab order; the links below it are the keyboard / screen-reader route.
 */
export function PageGuide({ sections }: { sections: PageSection[] }) {
  const ids = sections.map((s) => s.id)
  const idsKey = ids.join('|')
  const scrollerRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const markerRef = useRef<HTMLSpanElement>(null)
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const [active, setActive] = useState(0)
  const [dragging, setDragging] = useState(false)
  const frame = useRef(0)

  const update = useCallback(() => {
    const items = itemRefs.current.slice(0, idsKey.split('|').length) // drop refs left over from a longer page
    const marker = markerRef.current
    const scroller = scrollerRef.current
    if (!marker || !scroller || items.length === 0 || items.some((el) => !el)) return
    const pos = posAt(anchors(idsKey.split('|')), window.scrollY)
    const i = Math.min(Math.floor(pos), items.length - 1)
    const next = items[Math.min(i + 1, items.length - 1)]!
    const top = items[i]!.offsetTop + (next.offsetTop - items[i]!.offsetTop) * (pos - i)
    const height = items[i]!.offsetHeight
    marker.style.height = `${height}px`
    marker.style.transform = `translateY(${top}px)`

    // Keep the marker inside the list's own scroll area (instant, so it never fights the marker).
    if (top < scroller.scrollTop + 8) scroller.scrollTop = Math.max(0, top - 8)
    else if (top + height > scroller.scrollTop + scroller.clientHeight - 8) scroller.scrollTop = top + height - scroller.clientHeight + 8

    setActive(Math.round(pos))
  }, [idsKey])

  // Track the page: scroll (once per frame), resize, and content-size changes (lazy pages, fonts).
  useLayoutEffect(() => {
    const schedule = () => {
      cancelAnimationFrame(frame.current)
      frame.current = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    const ro = new ResizeObserver(schedule)
    ro.observe(document.body)
    return () => {
      cancelAnimationFrame(frame.current)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      ro.disconnect()
    }
  }, [update])

  const goTo = (index: number, focusTarget = false) => {
    const ys = anchors(ids)
    const i = Math.min(Math.max(index, 0), ids.length - 1)
    window.scrollTo({ top: ys[i], behavior: reducedMotion() ? 'auto' : 'smooth' })
    // Like a native in-page link: keyboard users continue from the section they jumped to.
    if (focusTarget) document.getElementById(ids[i])?.focus({ preventScroll: true })
  }

  // Pointer position on the rail -> fractional section index (by item centres) -> page scroll.
  const scrubTo = (clientY: number, smooth: boolean) => {
    const items = itemRefs.current.slice(0, ids.length)
    const track = trackRef.current
    if (!track || items.some((el) => !el)) return
    const y = clientY - track.getBoundingClientRect().top
    const centres = items.map((el) => el!.offsetTop + el!.offsetHeight / 2)
    let pos = 0
    if (y >= centres[centres.length - 1]) pos = centres.length - 1
    else if (y > centres[0]) {
      let i = 0
      while (centres[i + 1] < y) i++
      pos = i + (y - centres[i]) / (centres[i + 1] - centres[i])
    }
    window.scrollTo({ top: scrollYFor(anchors(ids), pos), behavior: smooth && !reducedMotion() ? 'smooth' : 'auto' })
  }

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
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
    <aside aria-label="On this page" className="sticky top-24 hidden w-52 shrink-0 self-start xl:block">
      <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-gray-500">On this page</p>
      {/* -m/p-1.5: room inside the scroll box so focus outlines are not clipped */}
      <div ref={scrollerRef} className="-m-1.5 max-h-[calc(100vh-10rem)] overflow-y-auto overscroll-contain p-1.5">
        <div ref={trackRef} className="group relative">
          {/* The rail: a wide, invisible hit area over a 1px line, with the marker on top. */}
          <div
            aria-hidden="true"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            className={clsx('absolute -left-2 bottom-0 top-0 z-10 w-5 touch-none select-none', dragging ? 'cursor-grabbing' : 'cursor-grab')}
          />
          <span aria-hidden="true" className="absolute bottom-0 left-0 top-0 w-px bg-gray-200" />
          <span
            ref={markerRef}
            aria-hidden="true"
            className={clsx(
              'pointer-events-none absolute left-0 top-0 rounded-full bg-brand-600 transition-[width,margin] duration-150',
              dragging ? '-ml-px w-1' : 'w-0.5 group-hover:-ml-px group-hover:w-1',
            )}
          />
          <ul className="space-y-0.5 pl-0">
            {sections.map((s, i) => (
              <li key={s.id}>
                <a
                  ref={(node) => {
                    itemRefs.current[i] = node
                  }}
                  href={`#${s.id}`}
                  aria-current={i === active ? 'location' : undefined}
                  onClick={(e) => {
                    e.preventDefault()
                    goTo(i, e.detail === 0) // detail 0 = activated from the keyboard
                  }}
                  className={clsx(
                    'block py-1.5 pl-3 pr-2 text-sm transition-colors',
                    i === active ? 'font-medium text-accent' : 'text-gray-500 hover:text-gray-900',
                  )}
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  )
}
