// The code shown in the Controls page's code dock. Pure strings, so a test can check that every
// component the library exports has an entry here (packages/ui/tests/snippets.test.ts).
//
// A snippet is a function of the props the demo control currently shows (`data-code-props`),
// e.g. `variant="danger" size="lg"`, so the code matches what the user is looking at.

type Snippet = (props?: string, label?: string) => string

const attrs = (p?: string) => (p ? ` ${p}` : '')

/**
 * A self-closing element from props given one per line, as the demo shows them: kept on one line
 * when short, otherwise one prop per line.
 */
function el(tag: string, props: string | string[]): string {
  const list = (Array.isArray(props) ? props : props.split('\n')).filter(Boolean)
  const inline = list.join(' ')
  return inline.length <= 64 ? `<${tag} ${inline} />` : `<${tag}\n  ${list.join('\n  ')}\n/>`
}

export const SNIPPETS: Record<string, Snippet> = {
  Button: (p, label) => `<Button${attrs(p ?? 'variant="primary" size="md"')}>${label ?? 'Save'}</Button>`,
  Badge: (p) => `<Badge${attrs(p ?? 'variant="success"')}>Active</Badge>`,
  Avatar: (p) => `<Avatar${attrs(p ?? 'name="Grace Hopper" size="md"')} />`,
  Input: (p) => el('Input', p ?? ['label="Full name"', 'placeholder="Ada Lovelace"', 'hint="At least 3 characters"']),
  Textarea: (p) => el('Textarea', p ?? ['label="Notes"', 'placeholder="Write something…"', 'rows={3}']),
  Select: (p) =>
    el('Select', p ?? ['label="Role"', 'value={role}', 'onChange={(e) => setRole(e.target.value)}', "options={[{ value: 'admin', label: 'Admin' }, { value: 'member', label: 'Member' }]}"]),
  MultiSelect: () => `<MultiSelect\n  label="Status"\n  options={[{ value: 'open', label: 'Open' }, { value: 'closed', label: 'Closed' }]}\n  value={selected}\n  onChange={setSelected}\n/>`,
  Checkbox: (p) => el('Checkbox', p ?? ['label="I agree to the terms"', 'checked={agree}', 'onChange={(e) => setAgree(e.target.checked)}']),
  Radio: () => `<Radio name="plan" value="pro" label="Pro" checked={plan === 'pro'} onChange={() => setPlan('pro')} />`,
  RadioGroup: (p) =>
    el('RadioGroup', p ?? ['label="Plan"', 'value={plan}', 'onChange={setPlan}', "options={[{ value: 'free', label: 'Free' }, { value: 'pro', label: 'Pro' }]}"]),
  Switch: (p) => el('Switch', p ?? ['checked={notify}', 'onChange={setNotify}', 'label="Notifications"']),
  SegmentedControl: () => `<SegmentedControl\n  label="Density"\n  value={density}\n  onChange={setDensity}\n  options={[{ value: 'comfortable', label: 'Comfortable' }, { value: 'compact', label: 'Compact' }]}\n/>`,
  Tabs: () => `<Tabs\n  label="Project sections"\n  items={[\n    { id: 'overview', label: 'Overview', content: <Overview /> },\n    { id: 'activity', label: 'Activity', badge: 12, content: <Activity /> },\n  ]}\n/>`,
  Modal: (p) => `<Modal open={open} onClose={() => setOpen(false)}${attrs(p)} title="Edit project" footer={<Button onClick={save}>Save</Button>}>\n  …\n</Modal>`,
  ConfirmDialog: () => `<ConfirmDialog\n  open={open}\n  title="Delete this project?"\n  message="This cannot be undone."\n  onCancel={() => setOpen(false)}\n  onConfirm={remove}\n/>`,
  DataTable: () => `<DataTable\n  label="Users"\n  rows={users}\n  rowKey={(u) => u.id}\n  columns={[
    { id: 'name', header: 'Name', accessor: (u) => u.name },
    { id: 'role', header: 'Role', accessor: (u) => u.role, filter: true },
  ]}\n/>`,
  PaginationBar: () => `<PaginationBar
  page={page}
  totalPages={totalPages}
  total={total}
  pageSize={pageSize}
  onPageChange={setPage}
  onPageSizeChange={setPageSize}
/>`,
  Spinner: () => `<Spinner size="md" />`,
  LoadingDots: () => `Fetching <LoadingDots />`,
  ProgressBar: () => `<ProgressBar label="Upload" value={progress} showLabel />`,
  ProgressRing: () => `<ProgressRing label="Upload" value={progress} size={56} />`,
  Skeleton: () => `<Skeleton shape="circle" className="h-10 w-10" />`,
  SkeletonText: () => `<SkeletonText lines={3} />`,
  LoadingOverlay: () => `<LoadingOverlay loading={isLoading} label="Loading users…">\n  <UserList />\n</LoadingOverlay>`,
  FetchStatus: () => `<FetchStatus state={state} onRetry={refetch} messages={{ success: 'Loaded 47 records' }} />`,
  ThemeProvider: () => `<ThemeProvider storagePrefix="my-app">\n  <App />\n</ThemeProvider>`,
  ThemeSwitcher: () => `<ThemeSwitcher showLabels />`,
  Sidebar: () => `<Sidebar\n  items={[{ id: 'home', label: 'Home', icon: HomeIcon }]}\n  active={page}\n  onSelect={setPage}\n  open={drawerOpen}\n  onClose={() => setDrawerOpen(false)}\n  brand={<SidebarBrand name="Acme" />}\n/>`,
  SidebarBrand: () => `<SidebarBrand name="Acme" mark={<BoltIcon className="h-5 w-5" />} />`,
  Header: () => `<Header title="Dashboard" subtitle="Everything at a glance" onMenu={() => setDrawerOpen(true)} actions={<ThemeSwitcher />} />`,
  PageGuide: () => `<PageGuide sections={[{ id: 'intro', label: 'Intro' }, { id: 'usage', label: 'Usage' }]} />`,
  Section: () => `<Section id="intro" title="Intro" description="Shown in the On this page guide">\n  …\n</Section>`,
  FontPicker: () => `<FontPicker />`,

  // Not components: native inputs and global classes the system styles. Listed here so every
  // control on the Controls page can show how to get that look.
  Range: () => `<input type="range" aria-label="Volume" min={0} max={100} value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="w-full accent-brand-600" />`,
  FileInput: () => `<input
  type="file"
  aria-label="Upload a file"
  className="block w-full text-sm text-gray-600 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-accent-soft file:px-3 file:py-2 file:text-sm file:font-medium file:text-accent hover:file:bg-accent-softer"
/>`,
  StatCard: (p) => `<div className="${p ?? 'stat-indigo'} rounded-xl p-4">
  <p className="text-xs font-semibold uppercase tracking-wide">Revenue</p>
  <p className="mt-1 text-2xl font-bold">$48.2k</p>
</div>`,
  WeightPill: () => `<span className="weight-pill">12</span>`,
  Alert: (p) => `<div className="flex items-center gap-2 rounded-lg bg-${p ?? 'success'}-soft px-3 py-2 text-sm text-${p ?? 'success'}-ink">
  <CheckCircleIcon className="h-5 w-5" /> Changes saved successfully.
</div>`,
  BrandShades: () => `<div className="h-12 rounded-lg bg-brand-500" /> {/* brand-50 … brand-900 follow the theme */}`,
  Gradient: () => `<div className="rounded-xl bg-gradient-to-r from-accent-soft to-accent-softer p-4 text-accent-strong ring-1 ring-accent-line">…</div>`,
  RefreshingIcon: () => `<ArrowPathIcon className="h-5 w-5 animate-spin text-accent motion-reduce:animate-none" aria-hidden="true" />`,
}

/** Snippets that are not exports of @xex/ui, so need no import line and are not required of the library. */
export const NON_COMPONENT_SNIPPETS = ['Range', 'FileInput', 'StatCard', 'WeightPill', 'Alert', 'BrandShades', 'Gradient', 'RefreshingIcon']

const FROM: Record<string, string> = { FontPicker: '@xex/ui/font-picker' }

/** The full text shown for a control: its import line, then the JSX. */
export function codeFor(name: string, props?: string, label?: string): string | null {
  const snippet = SNIPPETS[name]
  if (!snippet) return null
  if (NON_COMPONENT_SNIPPETS.includes(name)) return snippet(props, label)
  const used = new Set([name])
  // children used inside the example also need importing
  const text = snippet(props, label)
  for (const other of Object.keys(SNIPPETS)) if (other !== name && new RegExp(`<${other}[\\s/>]`).test(text)) used.add(other)
  const groups = new Map<string, string[]>()
  for (const n of used) groups.set(FROM[n] ?? '@xex/ui', [...(groups.get(FROM[n] ?? '@xex/ui') ?? []), n])
  const imports = [...groups].map(([from, names]) => `import { ${names.sort().join(', ')} } from '${from}'`).join('\n')
  // Heroicons used in the example are imported from their own package
  const icons = [...new Set(text.match(/\b\w+Icon\b/g) ?? [])].sort()
  const iconImport = icons.length ? `\nimport { ${icons.join(', ')} } from '@heroicons/react/24/outline'` : ''
  return `${imports}${iconImport}\n\n${text}`
}
