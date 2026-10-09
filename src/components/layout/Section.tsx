import type { ReactNode } from 'react'

/** One entry in a page's "On this page" guide. */
export interface PageSection {
  id: string
  label: string
}

export function Section({ id, title, description, children }: { id: string; title: string; description?: string; children: ReactNode }) {
  return (
    <section id={id} className="card scroll-mt-24 p-6">
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      {description && <p className="mt-0.5 text-sm text-gray-500">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  )
}
