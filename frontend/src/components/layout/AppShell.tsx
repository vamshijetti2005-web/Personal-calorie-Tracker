import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const links = [
  { to: "/", label: "Today" },
  { to: "/diary", label: "Diary" },
  { to: "/log", label: "Log meal" },
  { to: "/goals", label: "Goals" },
  { to: "/reports", label: "Reports" },
  { to: "/chat", label: "Chat" },
];

export function AppShell() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="border-b border-mist bg-forest-dark text-cream lg:border-b-0 lg:border-r lg:border-forest">
        <div className="flex items-center justify-between px-5 py-5 lg:block">
          <div>
            <p className="font-display text-2xl tracking-tight">Nourish</p>
            <p className="text-xs uppercase tracking-[0.18em] text-cream/60">Calorie tracker</p>
          </div>
          <button className="text-sm text-cream/70 lg:hidden" onClick={logout}>
            Sign out
          </button>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:block lg:space-y-1 lg:px-3">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                `block whitespace-nowrap rounded-xl px-3 py-2 text-sm transition ${
                  isActive ? "bg-cream/15 text-cream" : "text-cream/70 hover:bg-cream/10 hover:text-cream"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden px-5 py-6 lg:block">
          <p className="text-sm font-medium">{user?.displayName}</p>
          <p className="truncate text-xs text-cream/55">{user?.email}</p>
          <button className="mt-3 text-sm text-cream/70 underline-offset-2 hover:underline" onClick={logout}>
            Sign out
          </button>
        </div>
      </aside>
      <main className="px-4 py-6 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
