import { useCallback, useEffect, useLayoutEffect, useState, type FocusEvent, type PointerEvent } from 'react'
import { CheckIcon, ChevronDownIcon, CodeBracketIcon, MapPinIcon, Square2StackIcon } from '@heroicons/react/24/outline'
import { createPortal } from 'react-dom'
import clsx from 'clsx'
import { codeFor } from './snippets'

interface Target {
  name: string
  props?: string
  /** Text inside the control, when it matters to the code (e.g. a button's label). */
  label?: string
  /** The demo element, so the dock can take the user back to it. */
  el?: HTMLElement
  /** Title of the page section the control is in, e.g. "Buttons". */
  section?: string
}

interface Spot {
  rect: DOMRect
}

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
const FOCUSABLE = 'button, input, select, textarea, a[href], [role="switch"], [tabindex]'

const FAINT = 'opacity-40 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100'
const OPEN_KEY = 'xex-docs-code-open'

const readOpen = () => {
  try {
    return localStorage.getItem(OPEN_KEY) === '1'
  } catch {
    return false
  }
}

/**
 * Tracks which demo control the user last used. Mark a control (or a group) with `data-code="Name"`,
 * and optionally `data-code-props='variant="danger"'` to reflect what it currently shows; spread
 * `handlers` on a wrapper around the page. Pressing or focusing inside a marked element selects it.
 * `locate()` scrolls back to that control and spotlights it.
 */
export function useCodeDock() {
  const [target, setTarget] = useState<Target | null>(null)
  const [spot, setSpot] = useState<Spot | null>(null)

  const pick = (e: FocusEvent | PointerEvent) => {
    const el = (e.target as Element).closest?.('[data-code]') as HTMLElement | null | undefined
    if (!el) return
    const next: Target = {
      name: el.dataset.code!,
      props: el.dataset.codeProps,
      label: el.dataset.codeLabel,
      el,
      section: el.closest('section')?.querySelector('h2')?.textContent ?? undefined,
    }
    setTarget((t) => (t && t.el === next.el && t.props === next.props && t.label === next.label ? t : next))
  }

  const clearSpot = useCallback(() => setSpot(null), [])

  /** Scroll the control into view, focus it, then dim everything else for a moment. */
  const locate = async () => {
    const el = target?.el
    if (!el || !el.isConnected) return
    // Already on screen (clear of the sticky header and this bar)? Then spotlight straight away.
    const inset = document.querySelector('section[aria-label^="Code for"]')?.getBoundingClientRect().bottom ?? 0
    const r = el.getBoundingClientRect()
    const tooTall = r.height > window.innerHeight - inset
    const onScreen = tooTall ? r.top < window.innerHeight && r.bottom > inset : r.top >= inset && r.bottom <= window.innerHeight

    const focusTarget = el.matches(FOCUSABLE) ? el : el.querySelector<HTMLElement>(FOCUSABLE)
    if (onScreen) {
      focusTarget?.focus({ preventScroll: true })
      setSpot({ rect: r })
      return
    }

    const smooth = !reducedMotion()
    el.scrollIntoView({ block: 'center', behavior: smooth ? 'smooth' : 'auto' })
    focusTarget?.focus({ preventScroll: true })
    if (smooth) {
      // wait until the smooth scroll has actually stopped: the control's position is unchanged for a few frames
      await new Promise<void>((resolve) => {
        let last = NaN
        let still = 0
        const started = performance.now()
        const tick = () => {
          const y = el.getBoundingClientRect().top
          still = y === last ? still + 1 : 0
          last = y
          if (still >= 4 || performance.now() - started > 1500) resolve()
          else requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      })
    }
    setSpot({ rect: el.getBoundingClientRect() })
  }

  return {
    target,
    spot,
    locate,
    clearSpot,
    handlers: { onFocusCapture: pick, onPointerDownCapture: pick },
  }
}

/**
 * Fades the rest of the page for a moment so the chosen control stands alone, then restores it.
 * Any scroll, key press or click ends it early, since the cut-out would no longer line up.
 */
function Spotlight({ spot, onDone }: { spot: Spot; onDone: () => void }) {
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const raf = requestAnimationFrame(() => setShown(true))
    const hold = setTimeout(() => setShown(false), 1500)
    const done = setTimeout(onDone, 1500 + 450)
    const end = () => setShown(false)
    window.addEventListener('scroll', end, { once: true, passive: true })
    window.addEventListener('keydown', end, { once: true })
    window.addEventListener('pointerdown', end, { once: true })
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(hold)
      clearTimeout(done)
      window.removeEventListener('scroll', end)
      window.removeEventListener('keydown', end)
      window.removeEventListener('pointerdown', end)
    }
  }, [onDone])

  const pad = 8
  const { left, top, width, height } = spot.rect
  // In the body, not inside the dock, so the dock itself stays clear (it sits above, at z-20).
  return createPortal(
    <div
      aria-hidden="true"
      className={clsx(
        'pointer-events-none fixed z-10 rounded-xl transition-opacity ease-out motion-reduce:transition-none',
        shown ? 'opacity-100 duration-300' : 'opacity-0 duration-[400ms]',
      )}
      style={{
        left: left - pad,
        top: top - pad,
        width: width + pad * 2,
        height: height + pad * 2,
        // the huge shadow is the dimmed page; the box itself is the clear "hole" around the control
        boxShadow: '0 0 0 200vmax color-mix(in srgb, var(--canvas) 82%, transparent)',
      }}
    />,
    document.body,
  )
}

/** A thin theme-coloured bar that expands to the code for the control the user last used. */
export function CodeDock({ target, spot, onLocate, onSpotDone }: { target: Target | null; spot: Spot | null; onLocate: () => void; onSpotDone: () => void }) {
  const [open, setOpen] = useState(readOpen)
  const [copied, setCopied] = useState(false)

  const toggle = () => {
    const next = !open
    setOpen(next)
    try {
      localStorage.setItem(OPEN_KEY, next ? '1' : '0')
    } catch {
      /* storage unavailable: works for this session */
    }
  }

  const code = target ? codeFor(target.name, target.props, target.label) : null

  const copy = async () => {
    if (!code) return
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard blocked: the text is still selectable */
    }
  }

  // Sits just under the sticky page header, whatever height that has at the current width.
  const [top, setTop] = useState(0)
  useLayoutEffect(() => {
    const header = document.querySelector('header')
    if (!header) return
    const measure = () => setTop(header.getBoundingClientRect().height)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(header)
    return () => ro.disconnect()
  }, [])

  return (
    <section aria-label="Code for the control you are using" style={{ top }} className="sticky z-20 -mb-5 -mt-4 bg-canvas pt-1">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls="code-dock-panel"
        className="group block w-full rounded text-[11px] font-medium leading-none text-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
      >
        {/* Lines and icons are faint (decorative); the words stay at full text contrast */}
        <span className="flex items-center gap-3">
          <span className={clsx('h-px flex-1 bg-current', FAINT)} aria-hidden="true" />
          <span className="flex items-center gap-1">
            <CodeBracketIcon className={clsx('h-3.5 w-3.5', FAINT)} />
            {open ? 'Hide code' : 'Expand for code'}
            <ChevronDownIcon className={clsx('h-3 w-3 transition-[transform,opacity] duration-300 motion-reduce:transition-none', FAINT, open && 'rotate-180')} />
          </span>
          <span className={clsx('h-px flex-1 bg-current', FAINT)} aria-hidden="true" />
        </span>
      </button>

      {/* Grows from 0 to its natural height (and back), then a second line closes the section.
          `invisible` once collapsed keeps it out of the tab order and the accessibility tree. */}
      <div
        id="code-dock-panel"
        className={clsx(
          'grid transition-[grid-template-rows,visibility] duration-300 ease-out motion-reduce:transition-none',
          open ? 'visible grid-rows-[1fr]' : 'invisible grid-rows-[0fr]',
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="px-1 py-3">
            {code && target ? (
              <>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="min-w-0 truncate text-sm font-semibold text-gray-900">
                    {target.name}
                    {target.section && <span className="font-normal text-gray-500"> · {target.section}</span>}
                  </p>
                  <div className="flex shrink-0 items-center">
                  <button
                    type="button"
                    onClick={onLocate}
                    disabled={!target.el?.isConnected}
                    aria-label={`Show the ${target.name} control`}
                    title={target.el?.isConnected ? 'Scroll to this control' : 'This control is no longer on the page'}
                    className="flex items-center gap-1 rounded-lg p-1.5 text-xs text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <MapPinIcon className="h-4 w-4" />
                    Show control
                  </button>
                  <button
                    type="button"
                    onClick={copy}
                    aria-label={`Copy ${target.name} code`}
                    className="flex items-center gap-1 rounded-lg p-1.5 text-xs text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
                  >
                    {copied ? <CheckIcon className="h-4 w-4 text-success" /> : <Square2StackIcon className="h-4 w-4" />}
                    <span aria-live="polite">{copied ? 'Copied' : ''}</span>
                  </button>
                  </div>
                </div>
                <pre tabIndex={0} aria-label={`${target.name} code`} className="max-h-56 overflow-auto rounded-lg bg-gray-100 p-3 text-xs leading-relaxed text-gray-900">
                  <code>{code}</code>
                </pre>
              </>
            ) : (
              <p className="text-sm text-gray-600">Use any control on this page and its code appears here.</p>
            )}
          </div>
          <div className="h-px bg-gray-500 opacity-40" aria-hidden="true" />
        </div>
      </div>
      {spot && <Spotlight spot={spot} onDone={onSpotDone} />}
    </section>
  )
}
