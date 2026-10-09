import { useMemo, useState, type ReactNode } from 'react'
import clsx from 'clsx'
import {
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  Squares2X2Icon,
  TrashIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline'
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/20/solid'
import { SHADE_STEPS } from '../theme/themes'
import { useTheme } from '../context/ThemeContext'
import type { PageSection } from '../components/layout/Section'
import { Section } from '../components/layout/Section'
import { ThemeSwitcher } from '../components/ThemeSwitcher'
import { FontPicker } from '../components/FontPicker'
import {
  Avatar,
  Badge,
  Button,
  ConfirmDialog,
  Input,
  LoadingDots,
  Modal,
  PaginationBar,
  Select,
  type AvatarSize,
  type BadgeVariant,
  type ButtonSize,
  type ButtonVariant,
  type ModalSize,
} from '../components/ui'

export const SECTIONS: PageSection[] = [
  { id: 'theme', label: 'Theme' },
  { id: 'buttons', label: 'Buttons' },
  { id: 'badges', label: 'Badges' },
  { id: 'forms', label: 'Form controls' },
  { id: 'avatars', label: 'Avatars' },
  { id: 'overlays', label: 'Modals' },
  { id: 'feedback', label: 'Feedback & cards' },
  { id: 'table', label: 'Table & pagination' },
]

const Label = ({ children }: { children: ReactNode }) => (
  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">{children}</p>
)

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3 text-sm text-gray-700 focus:outline-none"
    >
      <span
        className={clsx(
          'relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-brand-400',
          checked ? 'bg-brand-600' : 'bg-gray-300',
        )}
      >
        <span className={clsx('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all', checked ? 'left-[22px]' : 'left-0.5')} />
      </span>
      {label}
    </button>
  )
}

const BUTTON_VARIANTS: ButtonVariant[] = ['primary', 'secondary', 'ghost', 'danger', 'outline']
const BUTTON_SIZES: ButtonSize[] = ['xs', 'sm', 'md', 'lg']
const BADGE_VARIANTS: BadgeVariant[] = ['default', 'success', 'warning', 'danger', 'info', 'purple', 'gray']
const AVATAR_SIZES: AvatarSize[] = ['xs', 'sm', 'md', 'lg', 'xl']
const MODAL_SIZES: ModalSize[] = ['sm', 'md', 'lg', 'xl']

const FIRST = ['Ada', 'Grace', 'Linus', 'Margaret', 'Alan', 'Barbara', 'Dennis', 'Radia', 'Ken', 'Hedy', 'Tim', 'Katherine']
const LAST = ['Lovelace', 'Hopper', 'Torvalds', 'Hamilton', 'Turing', 'Liskov', 'Ritchie', 'Perlman', 'Thompson', 'Lamarr', 'Berners-Lee', 'Johnson']
const ROLES = ['Admin', 'Editor', 'Viewer', 'Billing']
const STATUS: { label: string; variant: BadgeVariant }[] = [
  { label: 'Active', variant: 'success' },
  { label: 'Pending', variant: 'warning' },
  { label: 'Suspended', variant: 'danger' },
  { label: 'Invited', variant: 'info' },
]
const PEOPLE = Array.from({ length: 47 }, (_, i) => ({
  id: i + 1,
  name: `${FIRST[i % FIRST.length]} ${LAST[(i * 5 + 3) % LAST.length]}`,
  role: ROLES[i % ROLES.length],
  status: STATUS[(i * 7) % STATUS.length],
  seats: ((i * 13) % 9) + 1,
}))

export function Playground() {
  const { theme, font } = useTheme()

  // Buttons
  const [loading, setLoading] = useState(false)
  const demoLoad = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 1800)
  }

  // Forms
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [notify, setNotify] = useState(true)
  const [plan, setPlan] = useState('pro')
  const [volume, setVolume] = useState(40)
  const [agree, setAgree] = useState(false)
  const submitted = name.length > 0 && name.length < 3

  // Overlays
  const [modalSize, setModalSize] = useState<ModalSize | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleted, setDeleted] = useState(false)

  // Table
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [dense, setDense] = useState(false)
  const totalPages = Math.max(1, Math.ceil(PEOPLE.length / pageSize))
  const rows = useMemo(() => PEOPLE.slice((page - 1) * pageSize, page * pageSize), [page, pageSize])

  return (
    <>
      <Section id="theme" title="Theme" description={`Active: ${theme.name}. Choice persists in localStorage; shades are written to --brand-* on <html>.`}>
        <ThemeSwitcher showLabels />
        <div className="mt-5">
          <Label>Font · {font.family}</Label>
          <FontPicker />
          <p className="mt-3 text-sm text-gray-600">The quick brown fox jumps over the lazy dog — 0123456789</p>
        </div>
        <div className="mt-5 grid grid-cols-5 gap-2 sm:grid-cols-10">
          {SHADE_STEPS.map((s) => (
            <div key={s} className="text-center">
              <div className="h-12 rounded-lg border border-gray-200" style={{ backgroundColor: `var(--brand-${s})` }} />
              <p className="mt-1 text-[11px] font-medium text-gray-500">{s}</p>
              <p className="font-mono text-[10px] text-gray-400">{theme.shades[s]}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 rounded-xl bg-gradient-to-r from-brand-50 to-brand-100 p-4 text-sm font-medium text-brand-800 ring-1 ring-brand-200">
          Gradient + ring + text utilities all follow the theme.
        </div>
      </Section>

      <Section id="buttons" title="Buttons" description="5 variants × 4 sizes, icon slots, and a loading state.">
        <div className="space-y-5">
          {BUTTON_SIZES.map((size) => (
            <div key={size}>
              <Label>{size}</Label>
              <div className="flex flex-wrap items-center gap-3">
                {BUTTON_VARIANTS.map((v) => (
                  <Button key={v} variant={v} size={size}>
                    {v}
                  </Button>
                ))}
              </div>
            </div>
          ))}
          <div>
            <Label>Icons, loading, disabled</Label>
            <div className="flex flex-wrap items-center gap-3">
              <Button icon={<PlusIcon className="h-4 w-4" />}>New item</Button>
              <Button variant="secondary" iconRight={<ArrowRightIcon className="h-4 w-4" />}>
                Continue
              </Button>
              <Button variant="outline" icon={<ArrowDownTrayIcon className="h-4 w-4" />}>
                Export
              </Button>
              <Button variant="danger" icon={<TrashIcon className="h-4 w-4" />}>
                Remove
              </Button>
              <Button loading={loading} onClick={demoLoad}>
                {loading ? 'Saving…' : 'Click to load'}
              </Button>
              <Button disabled>Disabled</Button>
              <Button variant="secondary" disabled>
                Disabled
              </Button>
            </div>
          </div>
        </div>
      </Section>

      <Section id="badges" title="Badges" description="Soft pills, with and without a status dot.">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {BADGE_VARIANTS.map((v) => (
              <Badge key={v} variant={v}>
                {v}
              </Badge>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {BADGE_VARIANTS.map((v) => (
              <Badge key={v} variant={v} dot>
                {v}
              </Badge>
            ))}
          </div>
        </div>
      </Section>

      <Section id="forms" title="Form controls" description="Input, Select, plus native checkbox / radio / range / textarea / date / file styled to the theme.">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <Input label="Full name" placeholder="Ada Lovelace" value={name} onChange={(e) => setName(e.target.value)} hint="At least 3 characters" error={submitted ? 'Too short' : undefined} />
          <Input label="Search" placeholder="Search anything…" icon={<MagnifyingGlassIcon />} />
          <Input label="Email" type="email" placeholder="you@company.com" />
          <Input label="Disabled" disabled defaultValue="Read only value" />
          <Input label="Password" type="password" placeholder="••••••••" />
          <Input label="Number" type="number" defaultValue={3} />
          <Select
            label="Role"
            placeholder="Select a role…"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            options={ROLES.map((r) => ({ value: r.toLowerCase(), label: r }))}
            error={role === '' ? 'Pick a role to continue' : undefined}
          />
          <Select label="Region" hint="Native select, custom chevron" defaultValue="eu" options={[{ value: 'us', label: 'United States' }, { value: 'eu', label: 'Europe' }, { value: 'ap', label: 'Asia Pacific' }]} />
          <Select label="Disabled select" disabled defaultValue="a" options={[{ value: 'a', label: 'Unavailable' }]} />
          <Input label="Date" type="date" />
          <div className="md:col-span-2 xl:col-span-3">
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="notes">
              Notes (textarea)
            </label>
            <textarea
              id="notes"
              rows={3}
              placeholder="Write something…"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400"
            />
          </div>
          <div>
            <Label>Checkbox</Label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="h-4 w-4 rounded" />
              I agree to the terms {agree && <CheckCircleIcon className="h-5 w-5 text-emerald-500" />}
            </label>
          </div>
          <div>
            <Label>Radio</Label>
            <div className="flex gap-4 text-sm text-gray-700">
              {['free', 'pro', 'team'].map((p) => (
                <label key={p} className="flex items-center gap-2 capitalize">
                  <input type="radio" name="plan" value={p} checked={plan === p} onChange={() => setPlan(p)} className="h-4 w-4" />
                  {p}
                </label>
              ))}
            </div>
          </div>
          <div>
            <Label>Switch</Label>
            <Toggle checked={notify} onChange={setNotify} label={notify ? 'Notifications on' : 'Notifications off'} />
          </div>
          <div>
            <Label>Range · {volume}</Label>
            <input type="range" min={0} max={100} value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="w-full" />
          </div>
          <div className="md:col-span-2 xl:col-span-3">
            <Label>File</Label>
            <input
              type="file"
              className="block w-full text-sm text-gray-600 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100"
            />
          </div>
        </div>
      </Section>

      <Section id="avatars" title="Avatars" description="Inline hex backgrounds, independent of the brand theme.">
        <div className="flex flex-wrap items-end gap-4">
          {AVATAR_SIZES.map((s) => (
            <div key={s} className="text-center">
              <Avatar name="Grace Hopper" size={s} />
              <p className="mt-1 text-[11px] text-gray-500">{s}</p>
            </div>
          ))}
          <div className="ml-4 flex -space-x-2">
            {PEOPLE.slice(0, 6).map((p) => (
              <Avatar key={p.id} name={p.name} size="md" className="ring-2 ring-white" />
            ))}
          </div>
        </div>
      </Section>

      <Section id="overlays" title="Modal & ConfirmDialog" description="Esc or backdrop click closes. Body scrolls independently.">
        <div className="flex flex-wrap items-center gap-3">
          {MODAL_SIZES.map((s) => (
            <Button key={s} variant="secondary" onClick={() => setModalSize(s)}>
              Modal {s}
            </Button>
          ))}
          <Button variant="danger" icon={<TrashIcon className="h-4 w-4" />} onClick={() => setConfirmOpen(true)}>
            Delete project…
          </Button>
          {deleted && <Badge variant="danger" dot>Deleted (demo)</Badge>}
        </div>
        <Modal
          open={modalSize !== null}
          onClose={() => setModalSize(null)}
          size={modalSize ?? 'md'}
          title={`Modal · ${modalSize}`}
          footer={
            <>
              <Button variant="secondary" onClick={() => setModalSize(null)}>Cancel</Button>
              <Button onClick={() => setModalSize(null)}>Save changes</Button>
            </>
          }
        >
          <p className="text-sm text-gray-600">This is the scrolling body. Add enough content and only this area scrolls.</p>
          <div className="mt-4 space-y-3">
            <Input label="Project name" defaultValue="XeX" />
            <Select label="Visibility" defaultValue="private" options={[{ value: 'private', label: 'Private' }, { value: 'public', label: 'Public' }]} />
            {Array.from({ length: 8 }, (_, i) => (
              <p key={i} className="text-sm text-gray-500">Filler paragraph {i + 1} to demonstrate independent scrolling inside the panel.</p>
            ))}
          </div>
        </Modal>
        <ConfirmDialog
          open={confirmOpen}
          title="Delete this project?"
          message="All files and history will be permanently removed. This cannot be undone."
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => {
            setConfirmOpen(false)
            setDeleted(true)
          }}
        />
      </Section>

      <Section id="feedback" title="Feedback & cards" description="LoadingDots, stat cards, .card, .weight-pill, inline alerts.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { cls: 'stat-indigo', label: 'Revenue', value: '$48.2k' },
            { cls: 'stat-emerald', label: 'Active', value: '1,284' },
            { cls: 'stat-amber', label: 'Pending', value: '37' },
            { cls: 'stat-rose', label: 'Churned', value: '12' },
            { cls: 'stat-sky', label: 'Trials', value: '96' },
          ].map((s) => (
            <div key={s.cls} className={clsx(s.cls, 'rounded-xl p-4')}>
              <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{s.label}</p>
              <p className="mt-1 text-2xl font-bold">{s.value}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-6 text-sm text-gray-700">
          <span className="flex items-center gap-2">
            Fetching <LoadingDots className="text-brand-600" />
          </span>
          <span className="flex items-center gap-2">
            Total: <LoadingDots />
          </span>
          <span className="flex items-center gap-2">
            Weights <span className="weight-pill">3</span> <span className="weight-pill">12</span> <span className="weight-pill">100</span>
          </span>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <div className="flex items-center gap-2 rounded-lg bg-emerald-100 px-3 py-2 text-sm text-emerald-700">
            <CheckCircleIcon className="h-5 w-5" /> Changes saved successfully.
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-amber-100 px-3 py-2 text-sm text-amber-700">
            <ExclamationCircleIcon className="h-5 w-5" /> Your trial ends in 3 days.
          </div>
        </div>
        <div className="mt-5 flex items-center gap-3 text-gray-500">
          <Squares2X2Icon className="h-6 w-6" /> <span className="text-xs">outline 24 = neutral</span>
          <CheckCircleIcon className="h-5 w-5 text-brand-600" /> <span className="text-xs">solid 20 = status/emphasis</span>
        </div>
      </Section>

      <Section id="table" title="Table & PaginationBar" description="Page numbers collapse with …; the right slot hosts a density toggle.">
        <div className="overflow-hidden rounded-xl border border-gray-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-2.5 font-semibold">User</th>
                <th className="px-4 py-2.5 font-semibold">Role</th>
                <th className="px-4 py-2.5 font-semibold">Status</th>
                <th className="px-4 py-2.5 font-semibold">Seats</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className={clsx('px-4', dense ? 'py-1.5' : 'py-3')}>
                    <div className="flex items-center gap-3">
                      <Avatar name={p.name} size={dense ? 'xs' : 'sm'} />
                      <span className="font-medium text-gray-900">{p.name}</span>
                    </div>
                  </td>
                  <td className={clsx('px-4 text-gray-600', dense ? 'py-1.5' : 'py-3')}>{p.role}</td>
                  <td className={clsx('px-4', dense ? 'py-1.5' : 'py-3')}>
                    <Badge variant={p.status.variant} dot>{p.status.label}</Badge>
                  </td>
                  <td className={clsx('px-4', dense ? 'py-1.5' : 'py-3')}>
                    <span className="weight-pill">{p.seats}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <PaginationBar
            page={page}
            totalPages={totalPages}
            total={PEOPLE.length}
            pageSize={pageSize}
            onPageChange={setPage}
            pageSizeOptions={[5, 10, 25]}
            onPageSizeChange={(n) => {
              setPageSize(n)
              setPage(1)
            }}
            right={
              <Button size="xs" variant="ghost" onClick={() => setDense((d) => !d)}>
                {dense ? 'Comfortable' : 'Compact'}
              </Button>
            }
          />
        </div>
      </Section>
    </>
  )
}
