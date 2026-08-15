import { useEffect, useState, type ReactNode } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../context/authState'

const navItems = [
  { to: '/', label: 'Today', icon: '◒' },
  { to: '/diary', label: 'Diary', icon: '≡' },
  { to: '/log', label: 'Log meal', icon: '+' },
  { to: '/goals', label: 'Goals', icon: '◎' },
  { to: '/reports', label: 'Reports', icon: '↗' },
]

export function AppShell() {
  const [online, setOnline] = useState<boolean | null>(null)
  const { user, logout } = useAuth()

  useEffect(() => {
    api
      .health()
      .then(() => setOnline(true))
      .catch(() => setOnline(false))
  }, [])

  return (
    <div className="min-h-screen bg-[#f6f3eb] lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="relative border-b border-white/10 bg-emerald-950 text-white lg:sticky lg:top-0 lg:h-screen lg:border-r">
        <div className="flex items-center justify-between px-5 py-5 lg:block lg:px-7 lg:py-8">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-2xl bg-amber-400 font-display text-xl text-emerald-950">
              N
            </div>
            <div>
              <p className="font-display text-2xl leading-none">Nourish</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-emerald-100/60">
                Daily nutrition
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 lg:hidden">
            <Status online={online} />
            <button
              type="button"
              className="text-xs font-semibold text-emerald-50/70"
              onClick={logout}
            >
              Sign out
            </button>
          </div>
        </div>

        <nav className="flex gap-1 overflow-x-auto px-3 pb-4 lg:block lg:space-y-1 lg:px-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex min-w-max items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition lg:w-full ${
                  isActive
                    ? 'bg-white/[0.13] text-white'
                    : 'text-emerald-50/65 hover:bg-white/[0.07] hover:text-white'
                }`
              }
            >
              <span
                aria-hidden="true"
                className="grid size-6 place-items-center text-lg"
              >
                {item.icon}
              </span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 hidden w-[250px] border-t border-white/10 p-5 lg:block">
          <Status online={online} />
          <p className="mt-3 truncate text-sm font-semibold text-white">
            {user?.displayName}
          </p>
          <p className="truncate text-xs text-emerald-50/45">{user?.email}</p>
          <button
            type="button"
            className="mt-3 text-xs font-semibold text-emerald-100/65 hover:text-white"
            onClick={logout}
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="min-w-0 px-4 py-6 sm:px-7 lg:px-10 lg:py-9">
        <div className="mx-auto max-w-6xl">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

function Status({
  online,
  className = '',
}: {
  online: boolean | null
  className?: string
}) {
  const label =
    online === null ? 'Checking API' : online ? 'API connected' : 'API offline'
  return (
    <div
      className={`flex items-center gap-2 text-xs text-emerald-50/70 ${className}`}
    >
      <span
        className={`size-2 rounded-full ${
          online === null
            ? 'bg-amber-300'
            : online
              ? 'bg-emerald-300'
              : 'bg-red-400'
        }`}
      />
      {label}
    </div>
  )
}

export function LinkButton({
  children,
  to,
}: {
  children: ReactNode
  to: string
}) {
  return (
    <NavLink
      to={to}
      className="inline-flex min-h-10 items-center justify-center rounded-xl bg-emerald-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
    >
      {children}
    </NavLink>
  )
}
