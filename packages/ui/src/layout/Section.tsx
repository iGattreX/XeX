import type { ReactNode } from 'react'
import clsx from 'clsx'

/** One entry in a page's "On this page" guide. */
export interface PageSection {
  id: string
  label: string
}

interface SectionProps {
  id: string
  title: string
  description?: string
  children: ReactNode
  /**
   * `card` (default): a bordered, shadowed panel. `plain`: no border, background or shadow, for
   * a Section that sits inside another panel or on a page that has its own container.
   */
  appearance?: 'card' | 'plain'
  /**
   * Inner spacing (24px all round) of a `plain` Section. Default true; turn it off when the Section
   * already sits inside padded content. A `card` is always padded, since its edges need the room.
   */
  padded?: boolean
}

export function Section({ id, title, description, children, appearance = 'card', padded = true }: SectionProps) {
  return (
    <section
      id={id}
      tabIndex={-1}
      data-appearance={appearance}
      className={clsx('scroll-mt-24 focus:outline-none', appearance === 'card' && 'card', (padded || appearance === 'card') && 'p-6')}
    >
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      {description && <p className="mt-0.5 text-sm text-gray-500">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  )
}
