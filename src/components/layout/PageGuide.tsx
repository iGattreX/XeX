import clsx from 'clsx'
import type { PageSection } from './Section'

/**
 * Floating "On this page" guide for the current page. Only rendered at xl+
 * (≥1280px), where there is room to the right of the content; it disappears
 * entirely on narrower screens.
 */
export function PageGuide({ sections, active, onSelect }: { sections: PageSection[]; active: string; onSelect: (id: string) => void }) {
  return (
    <aside aria-label="On this page" className="sticky top-24 hidden w-52 shrink-0 self-start xl:block">
      <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-gray-500">On this page</p>
      <ul className="space-y-0.5 border-l border-gray-200">
        {sections.map((s) => (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              aria-current={s.id === active ? 'location' : undefined}
              onClick={(e) => {
                e.preventDefault()
                onSelect(s.id)
              }}
              className={clsx(
                '-ml-px block border-l-2 py-1.5 pl-3 pr-2 text-sm transition-colors',
                s.id === active
                  ? 'border-brand-600 font-medium text-brand-700'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-900',
              )}
            >
              {s.label}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  )
}
