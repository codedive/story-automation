import { NavLink } from 'react-router-dom'

const NAV_ITEMS = [
  { label: 'Dashboard', to: '/' },
  { label: 'Categories', to: '/' },
  { label: 'All Stories', to: '/stories' },
  { label: 'Settings', to: '/settings' },
]

export default function Sidebar() {
  return (
    <aside className="hidden w-56 shrink-0 border-r border-slate-200 bg-white md:block">
      <nav className="flex flex-col gap-1 p-4">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
