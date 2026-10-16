import * as ui from '@xex/ui'
import { Section, type PageSection } from '@xex/ui'

// Groups are curated; the list of names is read from the package itself, so a component that is
// exported but not placed in a group still shows up (under "Other") and can never go missing.
const GROUPS: { id: string; label: string; names: string[] }[] = [
  { id: 'actions', label: 'Actions & display', names: ['Button', 'Badge', 'Avatar'] },
  { id: 'inputs', label: 'Form inputs', names: ['Input', 'Textarea', 'Select', 'MultiSelect', 'Checkbox', 'Radio', 'RadioGroup', 'Switch', 'SegmentedControl'] },
  { id: 'overlays', label: 'Overlays', names: ['Modal', 'ConfirmDialog'] },
  { id: 'navdata', label: 'Navigation & data', names: ['Tabs', 'DataTable', 'PaginationBar'] },
  { id: 'status', label: 'Loading & status', names: ['Spinner', 'LoadingDots', 'ProgressBar', 'ProgressRing', 'Skeleton', 'SkeletonText', 'LoadingOverlay', 'FetchStatus'] },
  { id: 'shell', label: 'App shell', names: ['Sidebar', 'SidebarBrand', 'Header', 'PageGuide', 'Section'] },
  { id: 'theming', label: 'Theming', names: ['ThemeProvider', 'ThemeSwitcher'] },
]

/** Exports that are functions named in PascalCase are components. */
const exported = Object.entries(ui)
  .filter(([name, value]) => /^[A-Z]/.test(name) && (typeof value === 'function' || typeof value === 'object') && name !== 'AVATAR_COLORS')
  .map(([name]) => name)

const placed = new Set(GROUPS.flatMap((g) => g.names))
const other = exported.filter((n) => !placed.has(n)).sort()

const ALL_GROUPS = [
  ...GROUPS.map((g) => ({ ...g, names: g.names.filter((n) => exported.includes(n)) })),
  ...(other.length ? [{ id: 'other', label: 'Other', names: other }] : []),
]

export const COMPONENT_SECTIONS: PageSection[] = [...ALL_GROUPS.map((g) => ({ id: g.id, label: g.label })), { id: 'font-picker', label: 'Optional' }]

export function Components() {
  return (
    <>
      <p className="text-sm text-gray-600">
        Everything below is a named export of <code className="rounded bg-gray-100 px-1">@xex/ui</code>. If a control is not on this page, the
        library does not have it yet. Variants are string props, for example{' '}
        <code className="rounded bg-gray-100 px-1">{'<Button variant="danger" size="sm">'}</code>.
      </p>
      {ALL_GROUPS.map((g) => (
        <Section key={g.id} id={g.id} title={g.label}>
          <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {g.names.map((n) => (
              <li key={n} className="rounded-lg border border-gray-200 px-3 py-2">
                <p className="text-sm font-semibold text-gray-900">{n}</p>
                <code className="text-xs text-gray-500">{`import { ${n} } from '@xex/ui'`}</code>
              </li>
            ))}
          </ul>
        </Section>
      ))}
      <Section id="font-picker" title="Optional" description="Pulls in the Google Fonts catalog, so it is a separate entry point.">
        <div className="rounded-lg border border-gray-200 px-3 py-2">
          <p className="text-sm font-semibold text-gray-900">FontPicker</p>
          <code className="text-xs text-gray-500">{`import { FontPicker } from '@xex/ui/font-picker'`}</code>
        </div>
      </Section>
    </>
  )
}
