import { Avatar, Badge, type BadgeVariant, type DataTableColumn } from '@xex/ui'

// Sample data shared by the Controls page's table demo and the options explorer.

const FIRST = ['Ada', 'Grace', 'Linus', 'Margaret', 'Alan', 'Barbara', 'Dennis', 'Radia', 'Ken', 'Hedy', 'Tim', 'Katherine']
const LAST = ['Lovelace', 'Hopper', 'Torvalds', 'Hamilton', 'Turing', 'Liskov', 'Ritchie', 'Perlman', 'Thompson', 'Lamarr', 'Berners-Lee', 'Johnson']
export const ROLES = ['Admin', 'Editor', 'Viewer', 'Billing']
const STATUS: { label: string; variant: BadgeVariant }[] = [
  { label: 'Active', variant: 'success' },
  { label: 'Pending', variant: 'warning' },
  { label: 'Suspended', variant: 'danger' },
  { label: 'Invited', variant: 'info' },
]
export const PEOPLE = Array.from({ length: 47 }, (_, i) => ({
  id: i + 1,
  name: `${FIRST[i % FIRST.length]} ${LAST[(i * 5 + 3) % LAST.length]}`,
  role: ROLES[i % ROLES.length],
  status: STATUS[(i * 7 + Math.floor(i / 3)) % STATUS.length],
  seats: ((i * 13) % 9) + 1,
}))

export type Person = (typeof PEOPLE)[number]

export const USER_COLUMNS: DataTableColumn<Person>[] = [
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
