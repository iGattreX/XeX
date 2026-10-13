import { useEffect, useRef, type ComponentType, type SVGProps } from 'react'
import clsx from 'clsx'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useDialogFocus } from '../ui/keyboard'

export interface NavEntry {
  id: string
  label: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
}

interface SidebarProps {
  items: NavEntry[]
  active: string
  onSelect: (id: string) => void
  /** Mobile drawer state; ignored at lg+, where the sidebar is always visible. */
  open: boolean
  onClose: () => void
}

/** App navigation: persistent at lg+, slide-over drawer below. */
export function Sidebar({ items, active, onSelect, open, onClose }: SidebarProps) {
  const asideRef = useRef<HTMLElement>(null)
  // Drawer mode only (open is never set at lg+): focus in, trap Tab, restore on close.
  const trapTab = useDialogFocus(open, asideRef, {
    initialFocus: () => asideRef.current?.querySelector<HTMLElement>('[aria-current="page"]'),
  })

  // Growing past the drawer breakpoint while open should drop the drawer state.
  useEffect(() => {
    if (!open) return
    const mq = window.matchMedia('(min-width: 1024px)')
    const onChange = () => mq.matches && onClose()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden" onClick={onClose} aria-hidden="true" />}
      <aside
        ref={asideRef}
        aria-label="Main navigation"
        onKeyDown={open ? trapTab : undefined}
        className={clsx(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-gray-200 bg-white duration-200',
          'lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:w-60 lg:shrink-0 lg:translate-x-0',
          // Closed on small screens: invisible = out of the tab order. It switches off only after
          // the slide-out finishes, but switches on immediately so focus can move in on open.
          open ? 'visible translate-x-0 shadow-2xl transition-transform' : 'invisible -translate-x-full transition-[transform,visibility] lg:visible',
        )}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">X</span>
            <span className="text-lg font-bold tracking-tight text-gray-900">XeX</span>
          </div>
          <button type="button" onClick={onClose} aria-label="Close navigation" className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 lg:hidden">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4 pt-2">
          {items.map(({ id, label, icon: Icon }) => (
            <a
              key={id}
              href={`#/${id}`}
              aria-current={id === active ? 'page' : undefined}
              onClick={(e) => {
                e.preventDefault()
                onSelect(id)
              }}
              className={id === active ? 'nav-item-active' : 'nav-item-inactive'}
            >
              <Icon className="h-5 w-5" />
              {label}
            </a>
          ))}
        </nav>
      </aside>
    </>
  )
}
