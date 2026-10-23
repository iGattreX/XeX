import { useEffect, useRef, type ComponentType, type ReactNode, type SVGProps } from 'react'
import clsx from 'clsx'
import { ChevronLeftIcon, ChevronRightIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useDialogFocus } from '../components/keyboard'
import { Tooltip } from '../components/Tooltip'

export interface NavEntry {
  id: string
  label: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  /** Pages shown indented beneath this one. */
  children?: NavEntry[]
}

interface SidebarProps {
  items: NavEntry[]
  active: string
  onSelect: (id: string) => void
  /** Drawer state: whether the slide-over navigation is showing (small screens, or when `collapsed`). */
  open: boolean
  onClose: () => void
  /**
   * The user has collapsed the navigation to give the page more room. On wide screens it then behaves
   * as it does on narrow ones: hidden, and opened as a slide-over drawer from the header's menu button.
   */
  collapsed?: boolean
  /**
   * Collapse (when docked) or pin open again (when collapsed). Omit to hide the button and keep the
   * sidebar always docked on wide screens.
   */
  onToggleCollapse?: () => void
  /**
   * Logo and name shown at the top. Pass your own element (an image, a link, anything), or a
   * `<SidebarBrand name="Acme" mark="A" />` for the standard look. Defaults to the XeX brand.
   */
  brand?: ReactNode
}

interface SidebarBrandProps {
  /** App name beside the mark. */
  name?: string
  /** What goes in the coloured square: a letter, an icon or an `<img>`. Defaults to the name's first letter. */
  mark?: ReactNode
}

/** The standard sidebar brand: a theme-coloured square mark plus the app name. */
export function SidebarBrand({ name = 'XeX', mark }: SidebarBrandProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">{mark ?? name.charAt(0)}</span>
      <span className="truncate text-lg font-bold tracking-tight text-gray-900">{name}</span>
    </div>
  )
}

const iconButton =
  'rounded-lg p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400'

function NavLink({ entry, active, onSelect, small = false }: { entry: NavEntry; active: string; onSelect: (id: string) => void; small?: boolean }) {
  const Icon = entry.icon
  return (
    <a
      href={`#/${entry.id}`}
      aria-current={entry.id === active ? 'page' : undefined}
      onClick={(e) => {
        e.preventDefault()
        onSelect(entry.id)
      }}
      className={entry.id === active ? 'nav-item-active' : 'nav-item-inactive'}
    >
      <Icon className={small ? 'h-4 w-4' : 'h-5 w-5'} />
      {entry.label}
    </a>
  )
}

/** App navigation: docked at lg+ (collapsible), slide-over drawer below, or when collapsed. */
export function Sidebar({ items, active, onSelect, open, onClose, collapsed = false, onToggleCollapse, brand }: SidebarProps) {
  const asideRef = useRef<HTMLElement>(null)
  // Drawer mode only (open is never set while docked): focus in, trap Tab, restore on close.
  const trapTab = useDialogFocus(open, asideRef, {
    initialFocus: () => asideRef.current?.querySelector<HTMLElement>('[aria-current="page"]'),
  })

  // Growing past the drawer breakpoint while open should drop the drawer state, unless the user
  // collapsed the navigation (then the drawer is how it is used at every width).
  useEffect(() => {
    if (!open || collapsed) return
    const mq = window.matchMedia('(min-width: 1024px)')
    const onChange = () => mq.matches && onClose()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [open, collapsed, onClose])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const docked = !collapsed // at lg+, in the page flow

  return (
    <>
      {open && <div className={clsx('fixed inset-0 z-40 bg-black/40 backdrop-blur-sm', docked && 'lg:hidden')} onClick={onClose} aria-hidden="true" />}
      <aside
        ref={asideRef}
        aria-label="Main navigation"
        data-collapsed={collapsed || undefined}
        onKeyDown={open ? trapTab : undefined}
        className={clsx(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-gray-200 bg-surface duration-200',
          docked && 'lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:w-60 lg:shrink-0 lg:translate-x-0',
          // Hidden drawer: invisible = out of the tab order. It switches off only after the slide-out
          // finishes, but switches on immediately so focus can move in on open.
          open
            ? 'visible translate-x-0 shadow-2xl transition-transform'
            : clsx('invisible -translate-x-full transition-[transform,visibility]', docked && 'lg:visible'),
        )}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <div className="min-w-0">{brand ?? <SidebarBrand />}</div>
          <div className="flex items-center gap-1">
            {onToggleCollapse && (
              <Tooltip content={collapsed ? 'Keep navigation open' : 'Collapse navigation'} placement="pointer" className="hidden lg:inline-flex">
                <button
                  type="button"
                  onClick={onToggleCollapse}
                  aria-label={collapsed ? 'Keep navigation open' : 'Collapse navigation'}
                  className={clsx(iconButton, 'opacity-40 transition-opacity hover:opacity-100 focus-visible:opacity-100')}
                >
                  {collapsed ? <ChevronRightIcon className="h-4 w-4" /> : <ChevronLeftIcon className="h-4 w-4" />}
                </button>
              </Tooltip>
            )}
            <button type="button" onClick={onClose} aria-label="Close navigation" className={clsx(iconButton, docked && 'lg:hidden')}>
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4 pt-2">
          {items.map((item) => (
            <div key={item.id}>
              <NavLink entry={item} active={active} onSelect={onSelect} />
              {item.children && item.children.length > 0 && (
                <div className="ml-5 mt-1 space-y-1 border-l border-gray-200 pl-2">
                  {item.children.map((child) => (
                    <NavLink key={child.id} entry={child} active={active} onSelect={onSelect} small />
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </aside>
    </>
  )
}
