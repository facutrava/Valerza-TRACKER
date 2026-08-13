import { HashRouter, Route, Routes } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'
import { Dashboard } from './pages/Dashboard'
import { Aportes } from './pages/Aportes'
import { Objetivos } from './pages/Objetivos'
import { Cotizaciones } from './pages/Cotizaciones'
import { Reportes } from './pages/Reportes'

function App() {
  return (
    <HashRouter>
      <div className="min-h-screen">
        <Sidebar />
        <main className="ml-60 min-h-screen">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/aportes" element={<Aportes />} />
            <Route path="/objetivos" element={<Objetivos />} />
            <Route path="/cotizaciones" element={<Cotizaciones />} />
            <Route path="/reportes" element={<Reportes />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  )
}

export default App
