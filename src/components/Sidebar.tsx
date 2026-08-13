import { LayoutDashboard, ListPlus, Target, DollarSign, FileDown, Moon, Sun } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { ValerzaMark } from './ValerzaMark'
import { useTheme } from '../context/ThemeContext'

const links = [
  { to: '/', label: 'Panel', icon: LayoutDashboard, end: true },
  { to: '/aportes', label: 'Aportes', icon: ListPlus },
  { to: '/objetivos', label: 'Objetivos', icon: Target },
  { to: '/cotizaciones', label: 'Cotizaciones MEP', icon: DollarSign },
  { to: '/reportes', label: 'Reportes', icon: FileDown },
]

export function Sidebar() {
  const { theme, toggleTheme } = useTheme()

  return (
    <aside className="fixed inset-y-0 left-0 z-20 flex w-60 flex-col border-r border-ink-100 bg-white dark:border-ink-800 dark:bg-ink-900">
      <div className="flex items-center gap-2.5 px-5 py-6">
        <ValerzaMark className="h-6 w-6 shrink-0" />
        <div className="leading-tight">
          <div className="text-[15px] font-extrabold tracking-tight text-ink-900 dark:text-ink-50">Valerza</div>
          <div className="text-[11px] font-medium uppercase tracking-wider text-ink-400">Resultados</div>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-3">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-600 text-white shadow-card'
                  : 'text-ink-500 hover:bg-ink-50 hover:text-ink-800 dark:text-ink-400 dark:hover:bg-ink-800 dark:hover:text-ink-100'
              }`
            }
          >
            <Icon size={17} strokeWidth={2.25} />
            {label}
          </NavLink>
        ))}
      </nav>

      <button
        onClick={toggleTheme}
        className="mx-3 mb-5 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-500 transition-colors hover:bg-ink-50 hover:text-ink-800 dark:text-ink-400 dark:hover:bg-ink-800 dark:hover:text-ink-100"
      >
        {theme === 'dark' ? <Sun size={17} strokeWidth={2.25} /> : <Moon size={17} strokeWidth={2.25} />}
        {theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
      </button>
    </aside>
  )
}
