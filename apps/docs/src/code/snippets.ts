// The code shown in the Controls page's code dock. Pure strings, so a test can check that every
// component the library exports has an entry here (packages/ui/tests/snippets.test.ts).
//
// A snippet is a function of what the demo control shows: its props (`data-code-props`, one per line
// when there are several) and the text inside it (`data-code-label`). The code on screen therefore
// matches the control the user is looking at, not a generic example.

type Snippet = (props?: string, label?: string) => string

const attrs = (p?: string) => (p ? ` ${p}` : '')

const propList = (props: string | string[]) => (Array.isArray(props) ? props : props.split('\n')).filter(Boolean)

/** A self-closing element: on one line when short, otherwise one prop per line. */
function el(tag: string, props: string | string[]): string {
  const list = propList(props)
  const inline = list.join(' ')
  if (list.length === 0) return `<${tag} />`
  return inline.length <= 64 ? `<${tag} ${inline} />` : `<${tag}\n  ${list.join('\n  ')}\n/>`
}

/** An element with children. */
function block(tag: string, props: string | string[], children: string): string {
  const list = propList(props)
  const inline = list.join(' ')
  const open = inline.length <= 64 ? `<${tag}${inline ? ' ' + inline : ''}>` : `<${tag}\n  ${list.join('\n  ')}\n>`
  const body = children.includes('\n') || children.length > 40 ? `\n  ${children.split('\n').join('\n  ')}\n` : children
  return `${open}${body}</${tag}>`
}

const TABS: Record<string, string[]> = {
  underline: [
    'label="Project sections"',
    'items={[',
    `  { id: 'overview', label: 'Overview', icon: <HomeIcon className="h-4 w-4" />, content: <Overview /> },`,
    `  { id: 'activity', label: 'Activity', icon: <ClockIcon className="h-4 w-4" />, badge: 12, content: <Activity /> },`,
    `  { id: 'settings', label: 'Settings', icon: <Cog6ToothIcon className="h-4 w-4" />, content: <Settings /> },`,
    `  { id: 'billing', label: 'Billing', disabled: true, content: <Billing /> },`,
    ']}',
  ],
  pills: [
    'variant="pills"',
    'size="sm"',
    'label="Time range"',
    'items={[',
    `  { id: 'day', label: 'Day', content: <Day /> },`,
    `  { id: 'week', label: 'Week', content: <Week /> },`,
    `  { id: 'month', label: 'Month', badge: 3, content: <Month /> },`,
    ']}',
  ],
  manual: [
    'activation="manual"',
    'keepMounted',
    'label="Draft"',
    'items={[',
    `  { id: 'a', label: 'Title', content: <Input aria-label="Title" /> },`,
    `  { id: 'b', label: 'Body', content: <Input aria-label="Body" /> },`,
    ']}',
  ],
  controlled: [
    'fullWidth',
    'value={tab}',
    'onChange={setTab}',
    'label="Controlled example"',
    'items={[',
    `  { id: 'a', label: 'First', content: <First /> },`,
    `  { id: 'b', label: 'Second', content: <Second /> },`,
    `  { id: 'c', label: 'Third', content: <Third /> },`,
    ']}',
  ],
  overflow: [
    'label="Many tabs"',
    'items={sections.map((s) => ({ id: s, label: s, content: <Panel name={s} /> }))}',
  ],
}

export const SNIPPETS: Record<string, Snippet> = {
  Button: (p, label) => `<Button${attrs(p ?? 'variant="primary" size="md"')}>${label ?? 'Save'}</Button>`,
  Badge: (p, label) => `<Badge${attrs(p ?? 'variant="success"')}>${label ?? 'Active'}</Badge>`,
  Avatar: (p) => `<Avatar${attrs(p ?? 'name="Grace Hopper" size="md"')} />`,
  Input: (p) => el('Input', p ?? ['label="Full name"', 'placeholder="Ada Lovelace"', 'hint="At least 3 characters"']),
  Textarea: (p) => el('Textarea', p ?? ['label="Notes"', 'placeholder="Write something…"', 'rows={3}']),
  Select: (p) =>
    el('Select', p ?? ['label="Role"', 'value={role}', 'onChange={(e) => setRole(e.target.value)}', "options={[{ value: 'admin', label: 'Admin' }, { value: 'member', label: 'Member' }]}"]),
  ScrollRail: () =>
    `<div className="relative">\n  <ul ref={listRef} className={\`max-h-64 overflow-y-auto pr-3 \${scrollbarHidden}\`}>…</ul>\n  <ScrollRail target={listRef} />\n</div>`,
  Tooltip: (p) => block('Tooltip', p ?? ['content="Save your work"'], '<Button>Save</Button>'),
  Combobox: (p) =>
    el('Combobox', p ?? ['label="Country"', 'value={country}', 'onChange={setCountry}', "options={[{ value: 'fr', label: 'France' }, { value: 'de', label: 'Germany' }]}"]),
  MultiSelect: () => `<MultiSelect\n  label="Status"\n  options={[{ value: 'open', label: 'Open' }, { value: 'closed', label: 'Closed' }]}\n  value={selected}\n  onChange={setSelected}\n/>`,
  Checkbox: (p) => el('Checkbox', p ?? ['label="I agree to the terms"', 'checked={agree}', 'onChange={(e) => setAgree(e.target.checked)}']),
  Radio: () => `<Radio name="plan" value="pro" label="Pro" checked={plan === 'pro'} onChange={() => setPlan('pro')} />`,
  RadioGroup: (p) =>
    el('RadioGroup', p ?? ['label="Plan"', 'value={plan}', 'onChange={setPlan}', "options={[{ value: 'free', label: 'Free' }, { value: 'pro', label: 'Pro' }]}"]),
  Switch: (p) => el('Switch', p ?? ['checked={notify}', 'onChange={setNotify}', 'label="Notifications"']),
  SegmentedControl: () => `<SegmentedControl\n  label="Density"\n  value={density}\n  onChange={setDensity}\n  options={[{ value: 'comfortable', label: 'Comfortable' }, { value: 'compact', label: 'Compact' }]}\n/>`,
  Tabs: (p) => el('Tabs', p && !TABS[p] ? p : (TABS[p ?? 'underline'] ?? TABS.underline)), // p: a demo's key, or a props list
  Modal: (p, label) =>
    block(
      'Modal',
      [
        'open={open}',
        'onClose={() => setOpen(false)}',
        ...(p ? [p] : []),
        `title="${label ?? 'Edit project'}"`,
        'footer={',
        '  <>',
        '    <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>',
        '    <Button onClick={save}>Save changes</Button>',
        '  </>',
        '}',
      ],
      '…',
    ),
  ConfirmDialog: () => `<ConfirmDialog\n  open={open}\n  title="Delete this project?"\n  message="All files and history will be permanently removed. This cannot be undone."\n  onCancel={() => setOpen(false)}\n  onConfirm={remove}\n/>`,
  DataTable: (p) =>
    p
      ? el('DataTable', p)
      : [
      '<DataTable',
      '  label="Users"',
      '  rows={people}',
      '  rowKey={(p) => p.id}',
      '  // cards="auto" (default) adds a Cards layout and switches to it when narrow',
      '  searchPlaceholder="Search users…"',
      '  columns={[',
      "    { id: 'user', header: 'User', width: 3, accessor: (p) => p.name, cell: (p) => <UserCell person={p} /> },",
      "    { id: 'role', header: 'Role', width: 2, accessor: (p) => p.role, filter: true, filterLabel: 'All roles' },",
      "    { id: 'status', header: 'Status', width: 2, accessor: (p) => p.status.label, filter: true, filterLabel: 'All statuses' },",
      "    { id: 'seats', header: 'Seats', width: 1, accessor: (p) => p.seats },",
      '  ]}',
      '  detail={(p) => <PersonForm person={p} />} // opens beside the list; on cards it replaces it, with Back',
      '/>',
    ].join('\n'),
  PaginationBar: () => `<PaginationBar\n  page={page}\n  totalPages={totalPages}\n  total={total}\n  pageSize={pageSize}\n  onPageChange={setPage}\n  onPageSizeChange={setPageSize}\n/>`,
  Spinner: (p) => el('Spinner', p ?? 'size="md"'),
  LoadingDots: (p) => `Fetching <LoadingDots${attrs(p)} />`,
  ProgressBar: (p) => el('ProgressBar', p ?? ['label="Upload"', 'value={progress}', 'showLabel']),
  ProgressRing: (p) => el('ProgressRing', p ?? ['label="Upload"', 'value={progress}', 'size={56}']),
  Skeleton: (p) => el('Skeleton', p ?? 'shape="circle" className="h-10 w-10"'),
  SkeletonText: (p) => el('SkeletonText', p ?? 'lines={3}'),
  LoadingOverlay: (p) => block('LoadingOverlay', p ?? ['loading={isLoading}', 'label="Loading users…"'], '<UserList />'),
  FetchStatus: (p) => el('FetchStatus', p ?? ['state={state}', 'onRetry={refetch}', "messages={{ success: 'Loaded 47 records' }}"]),
  ThemeProvider: () => `<ThemeProvider storagePrefix="my-app">\n  <App />\n</ThemeProvider>`,
  ThemeSwitcher: (p) => `<ThemeSwitcher${attrs(p ?? 'showLabels')} />`,
  ThemeSelect: () => `<ThemeSelect />`,
  ModeToggle: () => `<ModeToggle />`,
  Sidebar: () => `<Sidebar\n  items={[{ id: 'home', label: 'Home', icon: HomeIcon }]}\n  active={page}\n  onSelect={setPage}\n  open={drawerOpen}\n  onClose={() => setDrawerOpen(false)}\n  brand={<SidebarBrand name="Acme" />}\n/>`,
  SidebarBrand: () => `<SidebarBrand name="Acme" mark={<BoltIcon className="h-5 w-5" />} />`,
  Header: (p) =>
    el('Header', p ?? ['title="Dashboard"', 'subtitle="Everything at a glance"', 'density="compact"', 'onMenu={() => setDrawerOpen(true)}', 'actions={<ThemeSwitcher variant="dropdown" />}']),
  PageGuide: () => `<PageGuide sections={[{ id: 'intro', label: 'Intro' }, { id: 'usage', label: 'Usage' }]} />`,
  Section: (p, label) => block('Section', p ?? ['id="intro"', 'title="Intro"', 'description="Shown in the On this page guide"'], label ?? '…'),
  FontPicker: () => `<FontPicker />`,

  // Not components: native inputs and global classes the system styles. Listed here so every
  // control on the Controls page can show how to get that look.
  Range: () => `<input type="range" aria-label="Volume" min={0} max={100} value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="w-full accent-brand-600" />`,
  FileInput: () =>
    `<input\n  type="file"\n  aria-label="Upload a file"\n  className="block w-full text-sm text-gray-600 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-accent-soft file:px-3 file:py-2 file:text-sm file:font-medium file:text-accent hover:file:bg-accent-softer"\n/>`,
  StatCard: (p, label) => {
    const [name, value] = (label ?? 'Revenue|$48.2k').split('|')
    return `<div className="${p ?? 'stat-indigo'} rounded-xl p-4">\n  <p className="text-xs font-semibold uppercase tracking-wide">${name}</p>\n  <p className="mt-1 text-2xl font-bold">${value}</p>\n</div>`
  },
  WeightPill: (_p, label) => `<span className="weight-pill">${label ?? '12'}</span>`,
  Alert: (p, label) => {
    const tone = p ?? 'success'
    const icon = tone === 'warning' ? 'ExclamationCircleIcon' : 'CheckCircleIcon'
    return `<div className="flex items-center gap-2 rounded-lg bg-${tone}-soft px-3 py-2 text-sm text-${tone}-ink">\n  <${icon} className="h-5 w-5" /> ${label ?? 'Changes saved successfully.'}\n</div>`
  },
  BrandShades: (p) => `<div className="h-12 rounded-lg bg-brand-${p ?? '500'}" /> {/* brand-50 … brand-900 follow the theme */}`,
  Gradient: () => `<div className="rounded-xl bg-gradient-to-r from-accent-soft to-accent-softer p-4 text-accent-strong ring-1 ring-accent-line">…</div>`,
  RefreshingIcon: () => `<ArrowPathIcon className="h-5 w-5 animate-spin text-accent motion-reduce:animate-none" aria-hidden="true" />`,
}

/** Snippets that are not exports of @xex/ui, so need no @xex import and are not required of the library. */
export const NON_COMPONENT_SNIPPETS = ['Range', 'FileInput', 'StatCard', 'WeightPill', 'Alert', 'BrandShades', 'Gradient', 'RefreshingIcon']

const FROM: Record<string, string> = { FontPicker: '@xex/ui/font-picker' }

// Heroicons the demos use as filled 20px icons (the rest are outline 24px).
const SOLID_ICONS = new Set(['CheckCircleIcon', 'ExclamationCircleIcon'])

function iconImports(text: string): string[] {
  const icons = [...new Set(text.match(/\b\w+Icon\b/g) ?? [])].sort()
  const outline = icons.filter((i) => !SOLID_ICONS.has(i))
  const solid = icons.filter((i) => SOLID_ICONS.has(i))
  return [
    ...(outline.length ? [`import { ${outline.join(', ')} } from '@heroicons/react/24/outline'`] : []),
    ...(solid.length ? [`import { ${solid.join(', ')} } from '@heroicons/react/20/solid'`] : []),
  ]
}

/** The full text shown for a control: its import lines, then the JSX. */
export function codeFor(name: string, props?: string, label?: string): string | null {
  const snippet = SNIPPETS[name]
  if (!snippet) return null
  const text = snippet(props, label)
  const imports: string[] = []
  if (!NON_COMPONENT_SNIPPETS.includes(name)) {
    const used = new Set([name])
    // children used inside the example also need importing
    for (const other of Object.keys(SNIPPETS)) if (other !== name && !NON_COMPONENT_SNIPPETS.includes(other) && new RegExp(`<${other}[\\s/>]`).test(text)) used.add(other)
    const groups = new Map<string, string[]>()
    for (const n of used) groups.set(FROM[n] ?? '@xex/ui', [...(groups.get(FROM[n] ?? '@xex/ui') ?? []), n])
    imports.push(...[...groups].map(([from, names]) => `import { ${names.sort().join(', ')} } from '${from}'`))
  }
  imports.push(...iconImports(text))
  return imports.length ? `${imports.join('\n')}\n\n${text}` : text
}
