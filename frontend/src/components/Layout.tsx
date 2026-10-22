import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { useCart } from '../cart'

const links = [
  { to: '/', label: 'Inicio' },
  { to: '/tienda', label: 'Urnas' },
  { to: '/plantas', label: 'Plantas' },
  { to: '/asistente', label: 'Ceremonia' },
  { to: '/impacto', label: 'Impacto' },
  { to: '/cesta', label: 'Cesta' },
]

function CartIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden
    >
      <path d="M6 6h15l-1.5 9h-12z" />
      <path d="M6 6 5 3H2" />
      <circle cx="9" cy="20" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="18" cy="20" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function Layout() {
  const cart = useCart()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [shown, setShown] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [cursor, setCursor] = useState({ x: 0, y: 0, label: '' })
  const isHome = location.pathname === '/'
  const overlayHero = isHome || /^\/tienda\/.+/.test(location.pathname)

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (open) {
      setMounted(true)
      const frame = requestAnimationFrame(() => setShown(true))
      return () => cancelAnimationFrame(frame)
    }
    setShown(false)
    const timer = window.setTimeout(() => setMounted(false), 900)
    return () => window.clearTimeout(timer)
  }, [open])

  useEffect(() => {
    let last = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      setHidden(y > last && y > 40)
      last = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const move = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest('[data-cursor]') : null
      setCursor({
        x: event.clientX,
        y: event.clientY,
        label: target?.getAttribute('data-cursor') ?? '',
      })
    }
    window.addEventListener('mousemove', move)
    return () => window.removeEventListener('mousemove', move)
  }, [])

  const chip =
    'flex items-center justify-center rounded-full border border-[var(--page-line)] bg-[var(--page-surface)]/90 text-[var(--page-ink)] shadow-sm backdrop-blur-sm'

  return (
    <div className="min-h-screen bg-[var(--page-bg)] text-[var(--page-ink)]">
      {isHome && (
        <div className="fixed top-0 right-0 z-40 flex items-center gap-1.5 p-2.5 sm:p-3 md:p-4">
          <Link
            to="/cesta"
            data-cursor="Cesta"
            className={`relative ${chip}`}
            style={{ width: 22, height: 22 }}
            aria-label={`Cesta${cart.count > 0 ? `, ${cart.count} productos` : ''}`}
          >
            <CartIcon size={12} />
            {cart.count > 0 && (
              <span
                className="absolute flex items-center justify-center rounded-full bg-[var(--page-ink)] font-semibold text-[var(--page-bg)]"
                style={{ top: -3, right: -3, minWidth: 12, height: 12, fontSize: 8, padding: '0 2px' }}
              >
                {cart.count}
              </span>
            )}
          </Link>
          <button
            type="button"
            className={`tracking-[0.12em] uppercase md:hidden ${chip}`}
            style={{ height: 22, padding: '0 8px', fontSize: 8 }}
            data-cursor="Abrir"
            onClick={() => setOpen(true)}
            aria-label="Abrir menú"
          >
            Menú
          </button>
        </div>
      )}

      <header
        className={`site-header fixed inset-x-0 top-0 z-30 flex items-center justify-between px-4 py-3 sm:px-5 sm:py-4 md:px-10 ${isHome || (hidden && !open) ? 'is-hidden' : ''} ${overlayHero ? '' : 'border-b border-[var(--page-line)] bg-[var(--header-bg)]'}`}
      >
        <Link
          to="/"
          className="font-['Playfair_Display'] text-2xl tracking-tight text-[var(--page-ink)] md:text-3xl"
          data-cursor="Inicio"
        >
          Eternal
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-[var(--page-ink)] md:flex">
          {links
            .filter((link) => link.to !== '/cesta')
            .map((link) => (
              <Link key={link.to} to={link.to} className="hover:opacity-70">
                {link.label}
              </Link>
            ))}
        </nav>
        <div className="flex items-center gap-3 text-sm text-[var(--page-ink)] sm:gap-5">
          <Link to="/cesta" data-cursor="Cesta" className="inline-flex items-center gap-1.5" aria-label="Cesta">
            <CartIcon size={14} />
            <span className="hidden sm:inline">Cesta{cart.count > 0 ? ` (${cart.count})` : ''}</span>
            {cart.count > 0 && <span className="sm:hidden text-xs">({cart.count})</span>}
          </Link>
          <button type="button" className="md:hidden" data-cursor="Abrir" onClick={() => setOpen(true)}>
            Menú
          </button>
        </div>
      </header>

      {mounted && (
        <nav className={`full-menu fixed inset-0 z-40 flex flex-col bg-[#16382c] px-6 py-8 text-bg md:px-12 ${shown ? 'is-open' : ''}`}>
          <div className="flex items-center justify-between">
            <p className="display text-3xl">Eternal</p>
            <button type="button" className="text-xs tracking-[0.16em] uppercase" onClick={() => setOpen(false)}>
              Cerrar
            </button>
          </div>
          <div className="flex flex-1 flex-col justify-center gap-3">
            {links.map((link) => (
              <Link key={link.to} to={link.to} className="display text-5xl uppercase leading-none md:text-7xl">
                {link.label}
              </Link>
            ))}
          </div>
        </nav>
      )}

      <div className={overlayHero ? '' : 'pt-24'}>
        <Outlet />
      </div>

      <footer className="border-t border-[var(--page-line)] bg-[var(--page-surface)] px-5 py-14 text-[var(--page-ink)] md:px-12">
        <div className="mx-auto grid max-w-6xl gap-10 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <p className="font-['Playfair_Display'] text-3xl">Eternal</p>
            <p className="mt-3 text-sm leading-relaxed text-[var(--page-muted)]">
              Urnas biodegradables y la semilla que crece con ellas.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold">Tienda</p>
            <div className="mt-3 flex flex-col gap-2 text-sm text-[var(--page-muted)]">
              <Link to="/tienda">Urnas</Link>
              <Link to="/plantas">Plantas</Link>
              <Link to="/cesta">Cesta</Link>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold">Ceremonia</p>
            <div className="mt-3 flex flex-col gap-2 text-sm text-[var(--page-muted)]">
              <Link to="/asistente">Armar un rito</Link>
              <Link to="/impacto">Impacto</Link>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold">Contacto</p>
            <a className="mt-3 block text-sm text-[var(--page-muted)]" href="mailto:vaniibalbastro@gmail.com">
              vaniibalbastro@gmail.com
            </a>
          </div>
        </div>
      </footer>

      <div
        className={`cursor-pill pointer-events-none fixed z-50 hidden items-center gap-2 rounded-full bg-white px-3 py-2 text-[11px] font-semibold tracking-[0.14em] text-moss uppercase md:inline-flex ${cursor.label ? 'is-on' : ''}`}
        style={{ left: cursor.x, top: cursor.y }}
      >
        <span className="diamond !bg-moss" />
        {cursor.label}
      </div>
    </div>
  )
}
