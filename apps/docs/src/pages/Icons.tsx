import { useEffect, useMemo, useState, type ComponentType, type SVGProps } from 'react'
import clsx from 'clsx'
import * as Outline24 from '@heroicons/react/24/outline'
import * as Solid24 from '@heroicons/react/24/solid'
import * as Solid20 from '@heroicons/react/20/solid'
import * as Solid16 from '@heroicons/react/16/solid'
import { MagnifyingGlassIcon, ClipboardDocumentIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { CheckIcon, CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon, BellIcon } from '@heroicons/react/20/solid'
import { Badge, Button, Input, PaginationBar, Section, Select, radioGroupKeyDown } from '@xex/ui'

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>

const SETS = {
  '24/outline': { label: 'Outline 24', path: '@heroicons/react/24/outline', icons: Outline24 },
  '24/solid': { label: 'Solid 24', path: '@heroicons/react/24/solid', icons: Solid24 },
  '20/solid': { label: 'Solid 20', path: '@heroicons/react/20/solid', icons: Solid20 },
  '16/solid': { label: 'Solid 16', path: '@heroicons/react/16/solid', icons: Solid16 },
} as const
type SetId = keyof typeof SETS

const namesOf = (id: SetId) =>
  Object.keys(SETS[id].icons)
    .filter((k) => k.endsWith('Icon'))
    .sort()

// Only valid Tailwind steps. Full class strings so Tailwind can see them.
const SIZES = [
  { value: 'w-4 h-4', label: 'w-4 h-4 (16px)' },
  { value: 'w-5 h-5', label: 'w-5 h-5 (20px)' },
  { value: 'w-6 h-6', label: 'w-6 h-6 (24px)' },
  { value: 'w-8 h-8', label: 'w-8 h-8 (32px)' },
  { value: 'w-10 h-10', label: 'w-10 h-10 (40px)' },
]

// Full class strings so Tailwind can see them. '' = inherit (default).
const COLORS = [
  { id: 'default', label: 'Default (inherit)', text: '', swatch: 'bg-gray-700' },
  { id: 'brand', label: 'Brand (theme)', text: 'text-accent', swatch: 'bg-brand-600' },
  { id: 'gray', label: 'Gray', text: 'text-gray-500', swatch: 'bg-gray-400' },
  { id: 'red', label: 'Red', text: 'text-red-500', swatch: 'bg-red-500' },
  { id: 'amber', label: 'Amber', text: 'text-amber-500', swatch: 'bg-amber-500' },
  { id: 'emerald', label: 'Emerald', text: 'text-emerald-500', swatch: 'bg-emerald-500' },
  { id: 'sky', label: 'Sky', text: 'text-sky-500', swatch: 'bg-sky-500' },
  { id: 'purple', label: 'Purple', text: 'text-purple-500', swatch: 'bg-purple-500' },
]

const PAGE_SIZE = 48

function lookup(set: SetId, name: string): IconComponent | undefined {
  return (SETS[set].icons as unknown as Record<string, IconComponent>)[name]
}

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null)
  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(null), 1500)
    return () => clearTimeout(t)
  }, [copied])
  const copy = (key: string, text: string) => {
    navigator.clipboard?.writeText(text).then(
      () => setCopied(key),
      () => setCopied(null),
    )
  }
  return { copied, copy }
}

export function Icons() {
  const [set, setSet] = useState<SetId>('24/outline')
  const [query, setQuery] = useState('')
  const [size, setSize] = useState(SIZES[2].value)
  const [colorId, setColorId] = useState('default')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<string | null>(null)
  const { copied, copy } = useCopy()

  const names = useMemo(() => namesOf(set), [set])
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/\s+/g, '')
    return q ? names.filter((n) => n.toLowerCase().includes(q)) : names
  }, [names, query])

  useEffect(() => setPage(1), [set, query])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageNames = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const Selected = selected ? lookup(set, selected) : undefined

  const importLine = (name: string) => `import { ${name} } from '${SETS[set].path}'`
  const color = COLORS.find((c) => c.id === colorId) ?? COLORS[0]
  const iconClass = clsx(size, color.text)
  const jsx = (name: string) => `<${name} className="${iconClass}" />`

  return (
    <>
      <Section id="guidelines" title="Guidelines" description="Heroicons v2, via @heroicons/react — no icon font, no extra UI framework.">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3 text-gray-600">
              <Outline24.Cog6ToothIcon className="h-6 w-6" />
              <Outline24.HomeIcon className="h-6 w-6" />
              <Outline24.UsersIcon className="h-6 w-6" />
            </div>
            <p className="mt-3 text-sm font-semibold text-gray-900">Outline · 24</p>
            <p className="text-xs text-gray-500">Default and neutral: navigation, toolbars, buttons.</p>
          </div>
          <div className="rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <CheckCircleIcon className="h-5 w-5 text-emerald-500" />
              <ExclamationTriangleIcon className="h-5 w-5 text-amber-500" />
              <XCircleIcon className="h-5 w-5 text-red-500" />
              <BellIcon className="h-5 w-5 text-accent" />
            </div>
            <p className="mt-3 text-sm font-semibold text-gray-900">Solid · 24 / 20</p>
            <p className="text-xs text-gray-500">Emphasis and status. Use 20/solid for small inline icons.</p>
          </div>
          <div className="rounded-xl border border-gray-200 p-4">
            <p className="font-mono text-xs text-danger-ink">w-4.5 h-4.5 ✗</p>
            <p className="font-mono text-xs text-success-ink">w-4 h-4 · w-5 h-5 · w-6 h-6 ✓</p>
            <p className="mt-3 text-sm font-semibold text-gray-900">Valid steps only</p>
            <p className="text-xs text-gray-500">Fractional steps like w-4.5 don’t exist; Tailwind drops them and the SVG stays unconstrained.</p>
          </div>
        </div>
      </Section>

      <Section id="sizes" title="Sizes" description="Size with Tailwind w-/h- classes; icons inherit currentColor.">
        <div className="flex flex-wrap items-end gap-8">
          {SIZES.map((s) => (
            <div key={s.value} className="text-center">
              <Outline24.HeartIcon className={clsx(s.value, 'mx-auto text-accent')} />
              <p className="mt-2 font-mono text-[11px] text-gray-500">{s.value.split(' ')[0]}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button size="xs" icon={<Outline24.PlusIcon className="h-4 w-4" />}>
            xs → w-4
          </Button>
          <Button size="md" icon={<Outline24.PlusIcon className="h-4 w-4" />}>
            md → w-4
          </Button>
          <Button size="lg" icon={<Outline24.PlusIcon className="h-5 w-5" />}>
            lg → w-5
          </Button>
        </div>
      </Section>

      <Section id="browser" title="Icon browser" description="Every Heroicon. Click one to see its import, then copy it.">
        <div className="grid gap-4 md:grid-cols-3">
          <Input label="Search" placeholder="e.g. arrow, user, bell…" icon={<MagnifyingGlassIcon />} value={query} onChange={(e) => setQuery(e.target.value)} />
          <Select
            label="Style"
            value={set}
            onChange={(e) => setSet(e.target.value as SetId)}
            options={(Object.keys(SETS) as SetId[]).map((id) => ({ value: id, label: SETS[id].label }))}
          />
          <Select label="Preview size" value={size} onChange={(e) => setSize(e.target.value)} options={SIZES} />
        </div>

        <div className="mt-4">
          <p className="mb-1.5 text-sm font-medium text-gray-700">Color · {color.label}</p>
          <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Icon color" onKeyDown={radioGroupKeyDown}>
            {COLORS.map((c) => (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={c.id === colorId}
                tabIndex={c.id === colorId ? 0 : -1}
                aria-label={c.label}
                title={c.label}
                onClick={() => setColorId(c.id)}
                className={clsx(
                  'flex h-7 w-7 items-center justify-center rounded-full ring-offset-1 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
                  c.swatch,
                  c.id === colorId ? 'ring-2 ring-gray-400' : 'hover:ring-2 hover:ring-gray-300',
                )}
              >
                {c.id === colorId && <CheckIcon className="h-4 w-4 text-white" />}
              </button>
            ))}
          </div>
        </div>

        {Selected && selected && (
          <div className="mt-5 flex flex-wrap items-center gap-5 rounded-xl border border-accent-line bg-accent-soft p-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-surface text-gray-800 shadow-sm">
              <Selected className={iconClass} />
            </div>
            <div className="min-w-0 flex-1 space-y-1.5">
              <p className="font-semibold text-gray-900">{selected}</p>
              {[importLine(selected), jsx(selected)].map((line) => (
                <div key={line} className="flex items-center gap-2">
                  <code className="min-w-0 flex-1 truncate rounded-md bg-surface px-2 py-1 font-mono text-xs text-gray-700">{line}</code>
                  <Button
                    size="xs"
                    variant="secondary"
                    icon={<ClipboardDocumentIcon className="h-4 w-4" />}
                    onClick={() => copy(line, line)}
                    aria-label="Copy"
                  >
                    {copied === line ? 'Copied' : 'Copy'}
                  </Button>
                </div>
              ))}
            </div>
            <Button size="xs" variant="ghost" aria-label="Clear selection" icon={<XMarkIcon className="h-4 w-4" />} onClick={() => setSelected(null)} />
          </div>
        )}

        <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10">
          {pageNames.map((name) => {
            const Icon = lookup(set, name)!
            return (
              <button
                key={name}
                type="button"
                title={name}
                onClick={() => setSelected(name)}
                className={clsx(
                  'flex flex-col items-center gap-2 rounded-lg border p-3 text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
                  name === selected ? 'border-brand-500 bg-accent-soft' : 'border-gray-200',
                )}
              >
                <Icon className={iconClass} />
                <span className="w-full truncate text-center text-[11px] text-gray-500">{name.replace(/Icon$/, '')}</span>
              </button>
            )
          })}
        </div>
        {filtered.length === 0 && <p className="py-8 text-center text-sm text-gray-500">No icons match “{query}”.</p>}

        <div className="mt-5 overflow-hidden rounded-xl border border-gray-200">
          <PaginationBar page={page} totalPages={totalPages} total={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} right={<Badge variant="gray">{names.length} icons</Badge>} />
        </div>
      </Section>
    </>
  )
}

export default Icons
