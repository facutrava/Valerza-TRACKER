import { LayoutDashboard, ListPlus, Users, Target, DollarSign, FileDown, Moon, Sun, LogOut } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { NavLink } from 'react-router-dom'
import { Logo } from './Logo'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'

const links = [
  { to: '/', label: 'Panel', icon: LayoutDashboard, end: true },
  { to: '/aportes', label: 'Aportes', icon: ListPlus },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/objetivos', label: 'Objetivos', icon: Target },
  { to: '/cotizaciones', label: 'Cotizaciones MEP', icon: DollarSign },
  { to: '/reportes', label: 'Reportes', icon: FileDown },
]

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { theme, toggleTheme } = useTheme()
  const { session, signOut } = useAuth()
  const email = session?.user.email
  const meta = session?.user.user_metadata as Record<string, string> | undefined
  const avatarUrl = meta?.avatar_url
  const nombreCompleto =
    meta?.full_name || meta?.name || [meta?.nombre, meta?.apellido].filter(Boolean).join(' ') || undefined

  return (
    <>
      <div className="flex items-center gap-2.5 px-5 py-6">
        <Logo className="h-6 w-6 shrink-0" />
        <div className="leading-tight">
          <div className="text-[15px] font-extrabold tracking-tight text-ink-900 dark:text-ink-50">Sales Tracker</div>
          <div className="text-[11px] font-medium uppercase tracking-wider text-ink-400">Resultados</div>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-3">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
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
        className="mx-3 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-500 transition-colors hover:bg-ink-50 hover:text-ink-800 dark:text-ink-400 dark:hover:bg-ink-800 dark:hover:text-ink-100"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={theme}
            initial={{ opacity: 0, rotate: -90 }}
            animate={{ opacity: 1, rotate: 0 }}
            exit={{ opacity: 0, rotate: 90 }}
            transition={{ duration: 0.2 }}
            className="flex"
          >
            {theme === 'dark' ? <Sun size={17} strokeWidth={2.25} /> : <Moon size={17} strokeWidth={2.25} />}
          </motion.span>
        </AnimatePresence>
        {theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
      </button>

      <div className="mx-3 mb-5 mt-2 flex items-center gap-2.5 rounded-lg border border-ink-100 px-3 py-2.5 dark:border-ink-800">
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="h-7 w-7 shrink-0 rounded-full" referrerPolicy="no-referrer" />
        ) : (
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
            {(nombreCompleto ?? email)?.[0]?.toUpperCase() ?? '?'}
          </div>
        )}
        <div className="min-w-0 flex-1 leading-tight">
          {nombreCompleto && (
            <div className="truncate text-xs font-semibold text-ink-800 dark:text-ink-100">{nombreCompleto}</div>
          )}
          <div className="truncate text-[11px] font-medium text-ink-400">{email}</div>
        </div>
        <button
          onClick={signOut}
          title="Cerrar sesión"
          className="shrink-0 rounded-md p-1.5 text-ink-400 transition-colors hover:bg-ink-50 hover:text-ink-800 dark:hover:bg-ink-800 dark:hover:text-ink-100"
        >
          <LogOut size={16} strokeWidth={2.25} />
        </button>
      </div>
    </>
  )
}

export function Sidebar({
  mobileOpen = false,
  onCloseMobile,
}: {
  mobileOpen?: boolean
  onCloseMobile?: () => void
}) {
  return (
    <>
      {/* Desktop: sidebar fija, siempre visible, sin cambios de comportamiento */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r border-ink-100 bg-white dark:border-ink-800 dark:bg-ink-900 md:flex">
        <SidebarContent />
      </aside>

      {/* Mobile: drawer off-canvas */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-30 md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="absolute inset-0 bg-ink-950/50"
              onClick={onCloseMobile}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.22, ease: 'easeOut' }}
              className="relative flex h-full w-64 flex-col border-r border-ink-100 bg-white dark:border-ink-800 dark:bg-ink-900"
            >
              <SidebarContent onNavigate={onCloseMobile} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
