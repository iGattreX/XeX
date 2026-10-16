// The code shown in the Controls page's code dock. Pure strings, so a test can check that every
// component the library exports has an entry here (packages/ui/tests/snippets.test.ts).
//
// A snippet is a function of the props the demo control currently shows (`data-code-props`),
// e.g. `variant="danger" size="lg"`, so the code matches what the user is looking at.

type Snippet = (props?: string) => string

const attrs = (p?: string) => (p ? ` ${p}` : '')

export const SNIPPETS: Record<string, Snippet> = {
  Button: (p) => `<Button${attrs(p ?? 'variant="primary" size="md"')}>Save</Button>`,
  Badge: (p) => `<Badge${attrs(p ?? 'variant="success"')}>Active</Badge>`,
  Avatar: (p) => `<Avatar${attrs(p ?? 'name="Grace Hopper" size="md"')} />`,
  Input: (p) => `<Input${attrs(p)} label="Full name" placeholder="Ada Lovelace" hint="At least 3 characters" />`,
  Textarea: () => `<Textarea label="Notes" placeholder="Write something…" rows={3} />`,
  Select: () => `<Select\n  label="Role"\n  value={role}\n  onChange={(e) => setRole(e.target.value)}\n  options={[{ value: 'admin', label: 'Admin' }, { value: 'member', label: 'Member' }]}\n/>`,
  MultiSelect: () => `<MultiSelect\n  label="Status"\n  options={[{ value: 'open', label: 'Open' }, { value: 'closed', label: 'Closed' }]}\n  value={selected}\n  onChange={setSelected}\n/>`,
  Checkbox: () => `<Checkbox label="I agree to the terms" checked={agree} onChange={(e) => setAgree(e.target.checked)} />`,
  Radio: () => `<Radio name="plan" value="pro" label="Pro" checked={plan === 'pro'} onChange={() => setPlan('pro')} />`,
  RadioGroup: () => `<RadioGroup\n  label="Plan"\n  value={plan}\n  onChange={setPlan}\n  options={[{ value: 'free', label: 'Free' }, { value: 'pro', label: 'Pro' }]}\n/>`,
  Switch: () => `<Switch checked={notify} onChange={setNotify} label="Notifications" />`,
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
}

const FROM: Record<string, string> = { FontPicker: '@xex/ui/font-picker' }

/** The full text shown for a control: its import line, then the JSX. */
export function codeFor(name: string, props?: string): string | null {
  const snippet = SNIPPETS[name]
  if (!snippet) return null
  const used = new Set([name])
  // children used inside the example also need importing
  const text = snippet(props)
  for (const other of Object.keys(SNIPPETS)) if (other !== name && new RegExp(`<${other}[\\s/>]`).test(text)) used.add(other)
  const groups = new Map<string, string[]>()
  for (const n of used) groups.set(FROM[n] ?? '@xex/ui', [...(groups.get(FROM[n] ?? '@xex/ui') ?? []), n])
  const imports = [...groups].map(([from, names]) => `import { ${names.sort().join(', ')} } from '${from}'`).join('\n')
  return `${imports}\n\n${text}`
}
