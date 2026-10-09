import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { Header } from './components/layout/Header'
import { PageGuide } from './components/layout/PageGuide'
import { Sidebar } from './components/layout/Sidebar'
import { ThemeSwitcher } from './components/ThemeSwitcher'
import { LoadingDots } from './components/ui'
import { PAGES } from './pages/registry'

const pageFromHash = () => PAGES.find((p) => p.id === window.location.hash.replace(/^#\/?/, ''))?.id ?? PAGES[0].id

export default function App() {
  const [pageId, setPageId] = useState(pageFromHash)
  const [menuOpen, setMenuOpen] = useState(false)
  const page = PAGES.find((p) => p.id === pageId) ?? PAGES[0]
  const [activeSection, setActiveSection] = useState(page.sections[0].id)
  const Page = page.component

  useEffect(() => {
    const onHash = () => setPageId(pageFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  // New page: back to top, first section active.
  useEffect(() => {
    setActiveSection(page.sections[0].id)
    window.scrollTo({ top: 0 })
  }, [page])

  // Scroll-spy: the last section whose top has passed the header is "active".
  // Looks elements up at event time, so lazily loaded pages work too.
  useEffect(() => {
    const onScroll = () => {
      let current = page.sections[0].id
      for (const s of page.sections) {
        const el = document.getElementById(s.id)
        if (el && el.getBoundingClientRect().top <= 120) current = s.id
      }
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) current = page.sections[page.sections.length - 1].id
      setActiveSection(current)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [page])

  const goPage = useCallback((id: string) => {
    window.location.hash = `/${id}`
    setPageId(id)
    setMenuOpen(false)
  }, [])

  const goSection = (id: string) => {
    setActiveSection(id)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const mainRef = useRef<HTMLElement>(null)

  return (
    <div className="flex min-h-screen">
      <a
        href="#main-content"
        onClick={(e) => {
          e.preventDefault() // the hash is used for routing
          mainRef.current?.focus()
          mainRef.current?.scrollIntoView()
        }}
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white focus:shadow-lg"
      >
        Skip to content
      </a>
      <Sidebar
        items={PAGES.map(({ id, label, icon }) => ({ id, label, icon }))}
        active={page.id}
        onSelect={goPage}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
      />
      <div className="min-w-0 flex-1">
        <Header title={page.title} subtitle={page.subtitle} actions={<ThemeSwitcher />} onMenu={() => setMenuOpen(true)} />
        <div className="flex w-full items-start gap-8 p-4 sm:p-6">
          <main id="main-content" ref={mainRef} tabIndex={-1} className="min-w-0 flex-1 space-y-8 focus:outline-none">
            <Suspense fallback={<p className="py-10 text-center text-gray-500">Loading <LoadingDots /></p>}>
              <Page />
            </Suspense>
          </main>
          <PageGuide sections={page.sections} active={activeSection} onSelect={goSection} />
        </div>
      </div>
    </div>
  )
}
