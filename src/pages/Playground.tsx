import { useEffect, useRef, useState, type ReactNode } from 'react'
import clsx from 'clsx'
import {
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  Squares2X2Icon,
  TrashIcon,
  ArrowPathIcon,
  ArrowRightIcon,
  ClockIcon,
  Cog6ToothIcon,
  HomeIcon,
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
  DataTable,
  FetchStatus,
  LoadingOverlay,
  ProgressBar,
  ProgressRing,
  Skeleton,
  SkeletonText,
  Spinner,
  Tabs,
  type DataTableColumn,
  type FetchState,
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
  { id: 'tabs', label: 'Tabs' },
  { id: 'forms', label: 'Form controls' },
  { id: 'avatars', label: 'Avatars' },
  { id: 'overlays', label: 'Modals' },
  { id: 'feedback', label: 'Feedback & cards' },
  { id: 'loading', label: 'Loading & status' },
  { id: 'table', label: 'Data table' },
]

/** A named demo cell: what it is called, and the component that renders it. */
function Tile({ name, component, children }: { name: string; component: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 p-4">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-2">
        <h3 className="text-sm font-semibold text-gray-900">{name}</h3>
        <code className="font-mono text-[11px] text-gray-400">{component}</code>
      </div>
      {children}
    </div>
  )
}

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
      className="group flex items-center gap-3 text-sm text-gray-700 focus:outline-none"
    >
      <span
        className={clsx(
          // the button is what receives focus, so the ring is driven from it via `group`
          'relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors group-focus-visible:ring-2 group-focus-visible:ring-brand-400 group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-white',
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
  status: STATUS[(i * 7 + Math.floor(i / 3)) % STATUS.length],
  seats: ((i * 13) % 9) + 1,
}))

type Person = (typeof PEOPLE)[number]

const USER_COLUMNS: DataTableColumn<Person>[] = [
  {
    id: 'user',
    header: 'User',
    width: 3,
    accessor: (p) => p.name,
    cell: (p, { dense }) => (
      <div className="flex items-center gap-3">
        <Avatar name={p.name} size={dense ? 'xs' : 'sm'} />
        <span className="font-medium text-gray-900">{p.name}</span>
      </div>
    ),
  },
  { id: 'role', header: 'Role', width: 2, accessor: (p) => p.role, filter: true, filterLabel: 'All roles' },
  {
    id: 'status',
    header: 'Status',
    width: 2,
    accessor: (p) => p.status.label,
    filter: true,
    filterLabel: 'All statuses',
    cell: (p) => (
      <Badge variant={p.status.variant} dot>
        {p.status.label}
      </Badge>
    ),
  },
  { id: 'seats', header: 'Seats', width: 1, accessor: (p) => p.seats, cell: (p) => <span className="weight-pill">{p.seats}</span> },
]

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

  // Tabs
  const [controlledTab, setControlledTab] = useState('b')
  const tabPanel = (text: string) => <p className="text-sm text-gray-600">{text}</p>

  // Loading & status
  const [progress, setProgress] = useState(0)
  const [running, setRunning] = useState(false)
  const [overlayLoading, setOverlayLoading] = useState(true)
  const [fetchState, setFetchState] = useState<FetchState>('idle')
  const attempts = useRef(0)

  useEffect(() => {
    if (!running) return
    const t = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          setRunning(false)
          return 100
        }
        return Math.min(100, p + 4)
      })
    }, 120)
    return () => clearInterval(t)
  }, [running])

  const simulateFetch = () => {
    setFetchState('loading')
    attempts.current += 1
    // odd attempts succeed, even attempts fail, so both outcomes can be seen
    const ok = attempts.current % 2 === 1
    setTimeout(() => setFetchState(ok ? 'success' : 'error'), 1600)
  }

  // Overlays
  const [modalSize, setModalSize] = useState<ModalSize | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleted, setDeleted] = useState(false)

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

      <Section id="tabs" title="Tabs" description="Arrow keys / Home / End move between tabs; only the selected tab is a Tab stop. Disabled tabs are skipped.">
        <div className="space-y-8">
          <div>
            <Label>Underline · icons and badge · one disabled</Label>
            <Tabs
              label="Project sections"
              items={[
                { id: 'overview', label: 'Overview', icon: <HomeIcon className="h-4 w-4" />, content: tabPanel('Overview panel. The line under the tab slides when the selection changes.') },
                { id: 'activity', label: 'Activity', icon: <ClockIcon className="h-4 w-4" />, badge: 12, content: tabPanel('Activity panel with a count badge on its tab.') },
                { id: 'settings', label: 'Settings', icon: <Cog6ToothIcon className="h-4 w-4" />, content: tabPanel('Settings panel.') },
                { id: 'billing', label: 'Billing', disabled: true, content: tabPanel('Not reachable.') },
              ]}
            />
          </div>

          <div>
            <Label>Pills · small</Label>
            <Tabs
              variant="pills"
              size="sm"
              label="Time range"
              items={[
                { id: 'day', label: 'Day', content: tabPanel('Showing the last 24 hours.') },
                { id: 'week', label: 'Week', content: tabPanel('Showing the last 7 days.') },
                { id: 'month', label: 'Month', badge: 3, content: tabPanel('Showing the last 30 days.') },
              ]}
            />
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <Label>Manual activation · keep panels mounted</Label>
              <Tabs
                activation="manual"
                keepMounted
                label="Draft"
                items={[
                  { id: 'a', label: 'Title', content: <Input aria-label="Title" placeholder="Type here, switch tab, come back…" /> },
                  { id: 'b', label: 'Body', content: <Input aria-label="Body" placeholder="Typed text is kept" /> },
                ]}
              />
              <p className="mt-2 text-xs text-gray-500">Arrows move focus only; Enter or Space selects.</p>
            </div>

            <div>
              <Label>Controlled · selected: {controlledTab}</Label>
              <Tabs
                fullWidth
                value={controlledTab}
                onChange={setControlledTab}
                label="Controlled example"
                items={[
                  { id: 'a', label: 'First', content: tabPanel('First panel.') },
                  { id: 'b', label: 'Second', content: tabPanel('Second panel.') },
                  { id: 'c', label: 'Third', content: tabPanel('Third panel.') },
                ]}
              />
              <div className="mt-2 flex gap-2">
                {['a', 'b', 'c'].map((id) => (
                  <Button key={id} size="xs" variant="secondary" onClick={() => setControlledTab(id)}>
                    Select {id}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="max-w-sm">
            <Label>Overflow · scrolls instead of wrapping</Label>
            <Tabs
              label="Many tabs"
              items={['Dashboard', 'Reports', 'Customers', 'Invoices', 'Subscriptions', 'Integrations', 'Audit log'].map((t) => ({ id: t, label: t, content: tabPanel(t + ' panel.') }))}
            />
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

      <Section id="feedback" title="Feedback & cards" description="Stat cards, .card, .weight-pill, inline alerts.">
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

      <Section
        id="loading"
        title="Loading & status"
        description="Every way the system shows that something is being fetched, is in progress, or has finished. Each tile is named, with the component that renders it."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Tile name="Spinner" component="<Spinner />">
            <div className="flex flex-wrap items-end gap-5 text-brand-600">
              {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((sz) => (
                <div key={sz} className="text-center">
                  <Spinner size={sz} />
                  <p className="mt-1 text-[11px] text-gray-500">{sz}</p>
                </div>
              ))}
              <Spinner size="lg" className="text-gray-400" />
              <Spinner size="lg" className="text-emerald-500" />
            </div>
          </Tile>

          <Tile name="Loading dots" component="<LoadingDots />">
            <div className="space-y-2 text-sm text-gray-700">
              <p className="flex items-center gap-2">
                Fetching <LoadingDots className="text-brand-600" />
              </p>
              <p className="flex items-center gap-2">
                Total: <LoadingDots />
              </p>
              <p className="text-xs text-gray-500">Drop into any cell or value that is still loading.</p>
            </div>
          </Tile>

          <Tile name="Button loading state" component="<Button loading />">
            <div className="flex flex-wrap gap-2">
              <Button loading>Saving</Button>
              <Button loading variant="secondary">
                Syncing
              </Button>
              <Button loading variant="outline" size="sm">
                Exporting
              </Button>
            </div>
          </Tile>

          <Tile name="Progress bar · determinate" component="<ProgressBar value />">
            <div className="space-y-3">
              <ProgressBar label="Upload" value={progress} showLabel />
              <ProgressBar label="Storage" value={72} tone="warning" showLabel size="sm" />
              <ProgressBar label="Complete" value={100} tone="success" showLabel size="lg" />
              <Button
                size="xs"
                variant="secondary"
                icon={<ArrowPathIcon className="h-4 w-4" />}
                onClick={() => {
                  setProgress(0)
                  setRunning(true)
                }}
                disabled={running}
              >
                {running ? 'Uploading…' : 'Run upload'}
              </Button>
            </div>
          </Tile>

          <Tile name="Progress bar · indeterminate" component="<ProgressBar />">
            <div className="space-y-3">
              <ProgressBar label="Loading" />
              <ProgressBar label="Working" tone="success" size="sm" />
              <p className="text-xs text-gray-500">When the duration is unknown.</p>
            </div>
          </Tile>

          <Tile name="Progress ring" component="<ProgressRing />">
            <div className="flex flex-wrap items-center gap-4">
              <ProgressRing label="Upload" value={progress} size={56} />
              <ProgressRing label="Disk" value={72} size={56} tone="warning" />
              <ProgressRing label="Done" value={100} size={56} tone="success" />
              <ProgressRing label="Loading" size={40} />
            </div>
          </Tile>

          <Tile name="Skeleton · text and avatar" component="<Skeleton /> <SkeletonText />">
            <div className="flex items-start gap-3" aria-busy="true">
              <Skeleton shape="circle" className="h-10 w-10 shrink-0" />
              <div className="flex-1 space-y-3">
                <Skeleton shape="text" className="h-4 w-1/2" />
                <SkeletonText lines={3} />
              </div>
            </div>
          </Tile>

          <Tile name="Skeleton · card" component="<Skeleton shape='rect' />">
            <div className="space-y-3" aria-busy="true">
              <Skeleton className="h-24 w-full" />
              <SkeletonText lines={2} />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
          </Tile>

          <Tile name="Loading overlay" component="<LoadingOverlay />">
            <div className="mb-3">
              <Toggle checked={overlayLoading} onChange={setOverlayLoading} label={overlayLoading ? 'Loading' : 'Loaded'} />
            </div>
            <LoadingOverlay loading={overlayLoading} label="Loading users…" className="rounded-lg">
              <div className="rounded-lg border border-gray-200 p-3">
                {['Ada Lovelace', 'Grace Hopper', 'Alan Turing'].map((n) => (
                  <div key={n} className="flex items-center gap-2 py-1.5 text-sm text-gray-700">
                    <Avatar name={n} size="xs" /> {n}
                  </div>
                ))}
              </div>
            </LoadingOverlay>
          </Tile>

          <Tile name="Fetch status" component="<FetchStatus />">
            <div className="space-y-2">
              <FetchStatus state={fetchState} onRetry={simulateFetch} messages={{ success: 'Loaded 47 records' }} />
              <Button size="xs" variant="secondary" onClick={simulateFetch} disabled={fetchState === 'loading'}>
                Simulate fetch
              </Button>
              <p className="text-xs text-gray-500">Idle → loading → success or error (alternates).</p>
            </div>
          </Tile>

          <Tile name="All fetch states" component="idle · loading · success · error">
            <div className="space-y-2">
              {(['idle', 'loading', 'success', 'error'] as const).map((st) => (
                <FetchStatus key={st} state={st} onRetry={() => {}} />
              ))}
            </div>
          </Tile>

          <Tile name="Refreshing icon" component="<ArrowPathIcon animate-spin />">
            <p className="flex items-center gap-2 text-sm text-gray-700">
              <ArrowPathIcon className="h-5 w-5 animate-spin text-brand-600 motion-reduce:animate-none" aria-hidden="true" />
              Refreshing…
            </p>
          </Tile>
        </div>
      </Section>

      <Section
        id="table"
        title="Data table"
        description="Sorting, search, column filters, pagination (above and below) and a density toggle are built into every DataTable."
      >
        <DataTable
          label="Users"
          rows={PEOPLE}
          rowKey={(p) => p.id}
          searchPlaceholder="Search users…"
          columns={USER_COLUMNS}
        />
      </Section>
    </>
  )
}
