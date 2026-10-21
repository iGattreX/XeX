import { useRef } from 'react'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ScrollRail, scrollbarHidden } from '../src'

function Demo({ scrollHeight }: { scrollHeight: number }) {
  const ref = useRef<HTMLUListElement | null>(null)
  return (
    <div className="relative">
      <ul
        className={scrollbarHidden}
        ref={(el) => {
          ref.current = el
          // jsdom has no layout: report the sizes a browser would
          if (el) {
            Object.defineProperty(el, 'scrollHeight', { value: scrollHeight, configurable: true })
            Object.defineProperty(el, 'clientHeight', { value: 100, configurable: true })
          }
        }}
      >
        <li>row</li>
      </ul>
      <ScrollRail target={ref} />
    </div>
  )
}

describe('ScrollRail', () => {
  it('is hidden while the content fits, and decorative (not announced)', () => {
    const { container } = render(<Demo scrollHeight={100} />)
    const rail = container.querySelector('[data-scroll-rail]')!
    expect(rail).toHaveAttribute('aria-hidden', 'true')
    expect(rail.className).toMatch(/(^| )hidden( |$)/)
  })

  it('shows when the content overflows', async () => {
    const { container } = render(<Demo scrollHeight={400} />)
    await new Promise((r) => setTimeout(r, 30))
    expect(container.querySelector('[data-scroll-rail]')!.className).not.toMatch(/(^| )hidden( |$)/)
  })

  it('exports classes that hide the native scrollbar', () => {
    expect(scrollbarHidden).toContain('scrollbar-width:none')
    expect(scrollbarHidden).toContain('::-webkit-scrollbar')
  })
})
