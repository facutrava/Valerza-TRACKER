import { useState } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { Sidebar } from './components/Sidebar'
import { Dashboard } from './pages/Dashboard'
import { Aportes } from './pages/Aportes'
import { Clientes } from './pages/Clientes'
import { Objetivos } from './pages/Objetivos'
import { Cotizaciones } from './pages/Cotizaciones'
import { Reportes } from './pages/Reportes'
import { Login } from './pages/Login'
import { ResetPassword } from './pages/ResetPassword'
import { useAuth } from './context/AuthContext'
import { DataProvider } from './context/DataContext'
import { Logo } from './components/Logo'

function AuthenticatedApp() {
  const { session, loading, isPasswordRecovery } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Un link de recuperación de contraseña crea una sesión de recovery real,
  // sin importar en qué ruta haya caído el usuario — priorizarla sobre todo lo demás.
  if (isPasswordRecovery) {
    return <ResetPassword />
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-50 dark:bg-ink-950">
        <Logo className="h-8 w-8 animate-pulse" />
      </div>
    )
  }

  if (!session) {
    return <Login />
  }

  return (
    <DataProvider>
      <div className="min-h-screen">
        <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
        <main className="min-h-screen md:ml-60">
          <button
            onClick={() => setMobileOpen(true)}
            className="m-4 rounded-lg border border-ink-100 p-2 text-ink-500 dark:border-ink-800 dark:text-ink-300 md:hidden"
          >
            <Menu size={18} />
          </button>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/aportes" element={<Aportes />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/objetivos" element={<Objetivos />} />
            <Route path="/cotizaciones" element={<Cotizaciones />} />
            <Route path="/reportes" element={<Reportes />} />
          </Routes>
        </main>
      </div>
    </DataProvider>
  )
}

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/*" element={<AuthenticatedApp />} />
      </Routes>
    </HashRouter>
  )
}

export default App
