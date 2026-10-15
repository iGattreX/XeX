import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { axe } from 'vitest-axe'
import { describe, expect, it } from 'vitest'
import {
  Avatar,
  Badge,
  Button,
  DataTable,
  FetchStatus,
  Input,
  Modal,
  PaginationBar,
  ProgressBar,
  ProgressRing,
  SegmentedControl,
  Select,
  Tabs,
  ThemeProvider,
} from '../src'

// jsdom has no layout or computed colour, so this checks structure (names, roles, ARIA, labels).
// Colour contrast is checked in a real browser: see apps/docs/e2e.
async function expectNoViolations(ui: ReactElement) {
  const { container } = render(<ThemeProvider>{ui}</ThemeProvider>)
  const results = await axe(container, { rules: { 'color-contrast': { enabled: false } } })
  expect(results).toHaveNoViolations()
}

describe('accessibility (structure)', () => {
  it('buttons, badges, avatars', async () => {
    await expectNoViolations(
      <div>
        <Button>Save</Button>
        <Button loading>Saving</Button>
        <Badge variant="success" dot>
          Active
        </Badge>
        <Avatar name="Ada Lovelace" />
      </div>,
    )
  })

  it('form controls', async () => {
    await expectNoViolations(
      <form>
        <Input label="Name" hint="Required" />
        <Input label="Email" error="Invalid address" />
        <Select
          label="Role"
          placeholder="Choose…"
          options={[
            { value: 'a', label: 'Admin' },
            { value: 'b', label: 'Editor' },
          ]}
        />
        <SegmentedControl
          label="Density"
          value="a"
          onChange={() => {}}
          options={[
            { value: 'a', label: 'Comfortable' },
            { value: 'b', label: 'Compact' },
          ]}
        />
      </form>,
    )
  })

  it('tabs', async () => {
    await expectNoViolations(
      <Tabs
        label="Sections"
        items={[
          { id: 'a', label: 'One', content: 'A' },
          { id: 'b', label: 'Two', content: 'B', disabled: true },
        ]}
      />,
    )
  })

  it('modal', async () => {
    await expectNoViolations(
      <Modal open onClose={() => {}} title="Settings" footer={<Button>Save</Button>}>
        <Input label="Name" />
      </Modal>,
    )
  })

  it('data table with pagination', async () => {
    await expectNoViolations(
      <DataTable
        label="People"
        rows={[
          { id: 1, name: 'Ada', role: 'Admin' },
          { id: 2, name: 'Bob', role: 'Editor' },
        ]}
        rowKey={(r) => r.id}
        columns={[
          { id: 'name', header: 'Name', accessor: (r) => r.name },
          { id: 'role', header: 'Role', accessor: (r) => r.role, filter: true },
        ]}
      />,
    )
    await expectNoViolations(<PaginationBar page={2} totalPages={9} total={90} pageSize={10} onPageChange={() => {}} />)
  })

  it('progress and status', async () => {
    await expectNoViolations(
      <div>
        <ProgressBar label="Upload" value={40} showLabel />
        <ProgressBar label="Loading" />
        <ProgressRing label="Disk" value={72} />
        <FetchStatus state="error" onRetry={() => {}} />
        <FetchStatus state="loading" />
      </div>,
    )
  })
})
