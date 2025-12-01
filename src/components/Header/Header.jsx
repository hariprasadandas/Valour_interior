import { NavLink } from 'react-router-dom'
import Logo from '../../assets/VTlogo.jpg'

const navLinks = [
  { to: '/', label: 'Products' },
  { to: '/quotations', label: 'Create Quote' },
  { to: '/quotation-history', label: 'Quote History' },
]

const Header = ({ user, onLogout }) => {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 shadow-sm backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-4">
          <div className="rounded-2xl border border-slate-100 bg-white/90 p-2 shadow-sm">
            <img
              src={Logo}
              alt="Valour Techmark logo"
              className="h-9 w-auto"
            />
          </div>
          <div className="space-y-0.5">
            <p className="text-lg font-semibold uppercase tracking-[0.4em] text-slate-900">
              Valour
            </p>
            <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">
              Interior Studio
            </p>
            {user ? (
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                Welcome, {user.name}
              </p>
            ) : (
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                Restricted preview
              </p>
            )}
          </div>
        </div>
        <nav className="flex flex-1 items-center justify-end gap-4">
          <ul className="flex flex-wrap items-center gap-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
            {navLinks.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  className={({ isActive }) =>
                    [
                      'transition-colors',
                      isActive
                        ? 'text-slate-900'
                        : 'text-slate-500 hover:text-slate-900',
                    ].join(' ')
                  }
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
          {user ? (
            <button
              type="button"
              onClick={onLogout}
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-900 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Logout
            </button>
          ) : null}
        </nav>
      </div>
    </header>
  )
}

export default Header