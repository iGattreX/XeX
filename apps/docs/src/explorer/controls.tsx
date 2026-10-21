import type { ReactNode } from 'react'
import { Avatar, Badge, Button, Combobox, DataTable, Header, Input, ProgressBar, Section, Spinner, Switch, Tabs } from '@xex/ui'
import { PEOPLE, USER_COLUMNS } from '../pages/demoData'

// What the "Explore options" section knows about each control: the options it takes (name, kind,
// allowed values, default), and how to render it from the chosen values. Kept by hand for the
// controls below; packages/ui/tests/explorer.test.ts checks every entry against the real
// component, so a renamed or removed option cannot linger here.

export type Values = Record<string, string | number | boolean>

/**
 * `default` is the component's own default (an option equal to it is left out of the code);
 * `initial` is where the explorer starts, when that differs (so the preview is not empty);
 * `always` lists the option in the code even at its default (it changes what the component is).
 */
type PropBase = {
  name: string
  initial?: string | number | boolean
  always?: boolean
  /** Demo state the control needs, not an option: not shown in the panel or the code. */
  hidden?: boolean
  /** Only offered (and listed in the code) while these other options have these values. */
  when?: Record<string, string>
}

export type PropDef = PropBase &
  (
    | { kind: 'select'; options: string[]; default: string }
    | { kind: 'boolean'; default: boolean }
    | { kind: 'text'; default: string }
    | { kind: 'number'; default: number; min: number; max: number }
    /** A list of items, one per line, that the control is built from. */
    | { kind: 'lines'; default: string }
  )

export interface ExplorerControl {
  /** Matches the control's entry in code/snippets.ts. */
  id: string
  props: PropDef[]
  /** The option that is the control's content (a button's label), shown as children rather than an attribute. */
  children?: string
  /** Attributes always shown in the code but not adjustable (a Section's id). */
  codeBase?: string[]
  /** Replaces the generated attributes in the code, for controls that need wiring (state and handlers). */
  codeProps?: (values: Values, attrs: string[]) => string[]
  render: (values: Values, set: (name: string, value: string | number | boolean) => void) => ReactNode
  /** Extra classes for the preview area. */
  previewClass?: string
}

const s = (v: Values, name: string) => String(v[name])
/** The items a Combobox demo is built from: one per non-empty line. */
const itemsOf = (v: Values) => s(v, 'items').split('\n').map((x) => x.trim()).filter(Boolean)
const PICK_SEP = '\u001f'
const COMBOBOX_ITEMS = ['Argentina', 'Brazil', 'Canada', 'Denmark', 'Egypt', 'France', 'Germany', 'India', 'Japan', 'Kenya'].join('\n')
const b = (v: Values, name: string) => v[name] === true
const n = (v: Values, name: string) => Number(v[name])

export const CONTROLS: ExplorerControl[] = [
  {
    id: 'Button',
    children: 'label',
    props: [
      { name: 'variant', kind: 'select', options: ['primary', 'secondary', 'ghost', 'danger', 'outline'], default: 'primary' },
      { name: 'size', kind: 'select', options: ['xs', 'sm', 'md', 'lg'], default: 'md' },
      { name: 'loading', kind: 'boolean', default: false },
      { name: 'disabled', kind: 'boolean', default: false },
      { name: 'label', kind: 'text', default: 'Save changes' },
    ],
    render: (v) => (
      <Button variant={s(v, 'variant') as 'primary'} size={s(v, 'size') as 'md'} loading={b(v, 'loading')} disabled={b(v, 'disabled')}>
        {s(v, 'label')}
      </Button>
    ),
  },
  {
    id: 'Badge',
    children: 'label',
    props: [
      { name: 'variant', kind: 'select', options: ['default', 'success', 'warning', 'danger', 'info', 'purple', 'gray'], default: 'default' },
      { name: 'dot', kind: 'boolean', default: false },
      { name: 'label', kind: 'text', default: 'Active' },
    ],
    render: (v) => (
      <Badge variant={s(v, 'variant') as 'default'} dot={b(v, 'dot')}>
        {s(v, 'label')}
      </Badge>
    ),
  },
  {
    id: 'Avatar',
    props: [
      { name: 'name', kind: 'text', default: 'Grace Hopper' },
      { name: 'size', kind: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl'], default: 'md' },
    ],
    render: (v) => <Avatar name={s(v, 'name')} size={s(v, 'size') as 'md'} />,
  },
  {
    id: 'Input',
    props: [
      { name: 'label', kind: 'text', default: 'Full name' },
      { name: 'placeholder', kind: 'text', default: 'Ada Lovelace' },
      { name: 'type', kind: 'select', options: ['text', 'email', 'password', 'number', 'date'], default: 'text' },
      { name: 'hint', kind: 'text', default: '' },
      { name: 'error', kind: 'text', default: '' },
      { name: 'disabled', kind: 'boolean', default: false },
    ],
    render: (v) => (
      <Input
        key={s(v, 'type')}
        className="w-64"
        label={s(v, 'label')}
        placeholder={s(v, 'placeholder')}
        type={s(v, 'type')}
        hint={s(v, 'hint') || undefined}
        error={s(v, 'error') || undefined}
        disabled={b(v, 'disabled')}
      />
    ),
  },
  {
    id: 'Combobox',
    props: [
      { name: 'multiple', kind: 'boolean', default: false },
      { name: 'label', kind: 'text', default: '', initial: 'Country' },
      { name: 'placeholder', kind: 'text', default: 'Select…', initial: 'Choose a country' },
      { name: 'searchable', kind: 'select', options: ['auto', 'true', 'false'], default: 'auto' },
      { name: 'hint', kind: 'text', default: '' },
      { name: 'error', kind: 'text', default: '' },
      { name: 'disabled', kind: 'boolean', default: false },
      // the items to choose from; they are the options of the control (a value and a label each)
      { name: 'items', kind: 'lines', default: '', initial: COMBOBOX_ITEMS },
      // the chosen value(s) are demo state, not an option
      { name: 'picked', kind: 'text', default: '', hidden: true },
    ],
    codeProps: (v, attrs) => {
      const multi = b(v, 'multiple')
      const items = itemsOf(v)
      const quote = (text: string) => `'${text.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
      const rows = items.map((i) => `    { value: ${quote(i)}, label: ${quote(i)} },`)
      const options = rows.length ? `options={[\n${rows.join('\n')}\n  ]}` : 'options={[]}'
      return [...attrs.filter((a) => !a.startsWith('items=')), multi ? 'value={values}' : 'value={value}', multi ? 'onChange={setValues}' : 'onChange={setValue}', options]
    },
    render: (v, set) => {
      const items = itemsOf(v)
      const common = {
        label: s(v, 'label') || undefined,
        'aria-label': s(v, 'label') ? undefined : 'Items',
        placeholder: s(v, 'placeholder'),
        searchable: s(v, 'searchable') === 'auto' ? ('auto' as const) : s(v, 'searchable') === 'true',
        hint: s(v, 'hint') || undefined,
        error: s(v, 'error') || undefined,
        disabled: b(v, 'disabled'),
        options: items.map((c) => ({ value: c, label: c })),
      }
      const picked = s(v, 'picked')
      return (
        <div className="w-64">
          {b(v, 'multiple') ? (
            <Combobox
              key="multiple"
              {...common}
              multiple
              value={picked.split(PICK_SEP).filter((x) => items.includes(x))}
              onChange={(chosen) => set('picked', chosen.join(PICK_SEP))}
            />
          ) : (
            <Combobox key="single" {...common} value={items.includes(picked) ? picked : ''} onChange={(c) => set('picked', c)} />
          )}
        </div>
      )
    },
  },
  {
    id: 'Switch',
    props: [
      { name: 'label', kind: 'text', default: 'Notifications' },
      { name: 'checked', kind: 'boolean', default: false, initial: true },
      { name: 'disabled', kind: 'boolean', default: false },
    ],
    codeProps: (_v, attrs) => ['checked={on}', 'onChange={setOn}', ...attrs.filter((a) => a.startsWith('label=') || a === 'disabled')],
    render: (v, set) => <Switch checked={b(v, 'checked')} onChange={(on) => set('checked', on)} label={s(v, 'label')} disabled={b(v, 'disabled')} />,
  },
  {
    id: 'ProgressBar',
    props: [
      { name: 'label', kind: 'text', default: 'Upload' },
      // with no value the bar is indeterminate, so a value is always part of the code
      { name: 'value', kind: 'number', default: 0, initial: 60, min: 0, max: 100, always: true },
      { name: 'tone', kind: 'select', options: ['brand', 'success', 'warning', 'danger'], default: 'brand' },
      { name: 'size', kind: 'select', options: ['sm', 'md', 'lg'], default: 'md' },
      { name: 'showLabel', kind: 'boolean', default: false, initial: true },
    ],
    render: (v) => <ProgressBar className="w-72" label={s(v, 'label')} value={n(v, 'value')} tone={s(v, 'tone') as 'brand'} size={s(v, 'size') as 'md'} showLabel={b(v, 'showLabel')} />,
  },
  {
    id: 'Spinner',
    props: [{ name: 'size', kind: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl'], default: 'md' }],
    render: (v) => (
      <span className="text-accent">
        <Spinner size={s(v, 'size') as 'md'} />
      </span>
    ),
  },
  {
    id: 'Section',
    children: 'content',
    codeBase: ['id="billing"'],
    props: [
      { name: 'title', kind: 'text', default: 'Billing' },
      { name: 'description', kind: 'text', default: 'Plans and invoices' },
      { name: 'appearance', kind: 'select', options: ['card', 'plain'], default: 'card' },
      // a card is always padded; only a plain Section can drop its padding
      { name: 'padded', kind: 'boolean', default: true, when: { appearance: 'plain' } },
      { name: 'content', kind: 'text', default: 'Section content goes here.' },
    ],
    render: (v) => (
      <div className="w-full max-w-lg">
        {/* The dashed line is only a guide to where the Section's box ends (so padding shows); it is not part of the code. */}
        <div className="[&>section]:outline [&>section]:outline-1 [&>section]:-outline-offset-1 [&>section]:outline-dashed [&>section]:outline-gray-400">
          <Section id="explorer-section-preview" title={s(v, 'title')} description={s(v, 'description') || undefined} appearance={s(v, 'appearance') as 'card'} padded={b(v, 'padded')}>
            <p className="text-sm text-gray-700">{s(v, 'content')}</p>
          </Section>
        </div>
        <p className="mt-2 text-center text-xs text-gray-500">Dashed line: the edge of the Section's box (a guide, not part of the code)</p>
      </div>
    ),
  },
  {
    id: 'Header',
    props: [
      { name: 'title', kind: 'text', default: 'Dashboard' },
      { name: 'subtitle', kind: 'text', default: 'Everything at a glance' },
      { name: 'density', kind: 'select', options: ['comfortable', 'compact'], default: 'comfortable' },
    ],
    previewClass: '!min-h-0 items-start overflow-hidden !p-0',
    render: (v) => (
      // the real header sticks to the top of the page; inside the preview it should sit still
      <div className="w-full [&_header]:!static">
        <Header title={s(v, 'title')} subtitle={s(v, 'subtitle') || undefined} density={s(v, 'density') as 'comfortable'} actions={<Button size="sm">Action</Button>} />
      </div>
    ),
  },
  {
    id: 'Tabs',
    codeProps: (_v, attrs) => [...attrs, 'label="Project sections"', 'items={items}'],
    props: [
      { name: 'variant', kind: 'select', options: ['underline', 'pills'], default: 'underline' },
      { name: 'size', kind: 'select', options: ['sm', 'md'], default: 'md' },
      { name: 'activation', kind: 'select', options: ['auto', 'manual'], default: 'auto' },
      { name: 'fullWidth', kind: 'boolean', default: false },
      { name: 'keepMounted', kind: 'boolean', default: false },
    ],
    render: (v) => (
      <div className="w-full max-w-lg">
        <Tabs
          key={s(v, 'activation')}
          label="Project sections"
          variant={s(v, 'variant') as 'underline'}
          size={s(v, 'size') as 'md'}
          activation={s(v, 'activation') as 'auto'}
          fullWidth={b(v, 'fullWidth')}
          keepMounted={b(v, 'keepMounted')}
          items={[
            { id: 'overview', label: 'Overview', content: <p className="text-sm text-gray-600">Overview panel.</p> },
            { id: 'activity', label: 'Activity', badge: 12, content: <p className="text-sm text-gray-600">Activity panel.</p> },
            { id: 'settings', label: 'Settings', content: <p className="text-sm text-gray-600">Settings panel.</p> },
          ]}
        />
      </div>
    ),
  },
  {
    id: 'DataTable',
    codeBase: ['label="Users"', 'rows={people}', 'rowKey={(p) => p.id}', 'columns={columns}'],
    props: [
      { name: 'cards', kind: 'select', options: ['auto', 'always', 'never'], default: 'auto' },
      { name: 'detail', kind: 'boolean', default: false },
      { name: 'searchable', kind: 'boolean', default: true },
    ],
    previewClass: 'items-stretch',
    render: (v) => (
      <div className="w-full min-w-0">
        <DataTable
          key={`${s(v, 'cards')}-${s(v, 'searchable')}`}
          label="Users"
          rows={PEOPLE}
          rowKey={(p) => p.id}
          columns={USER_COLUMNS}
          cards={s(v, 'cards') as 'auto'}
          detail={b(v, 'detail')}
          searchable={b(v, 'searchable')}
          defaultPageSize={5}
        />
      </div>
    ),
  },
]
