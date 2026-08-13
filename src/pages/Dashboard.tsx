import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AlertTriangle, TrendingUp, Wallet, Target as TargetIcon } from 'lucide-react'
import { useData } from '../context/DataContext'
import { StatCard } from '../components/StatCard'
import { ProgressBar } from '../components/ProgressBar'
import {
  cumplimientoAcumulado,
  resultadosAnio,
  totalConsolidadoUSD,
} from '../utils/calculations'
import { formatARS, formatPct, formatUSD } from '../utils/format'

const currentYear = new Date().getFullYear()

export function Dashboard() {
  const { bloques, objetivos, aportes, historico, cotizaciones, loading } = useData()
  const [anio, setAnio] = useState(currentYear)

  const aniosDisponibles = useMemo(() => {
    const set = new Set<number>([currentYear])
    objetivos.forEach((o) => set.add(o.anio))
    historico.forEach((h) => set.add(h.anio))
    return Array.from(set).sort()
  }, [objetivos, historico])

  const on = bloques.find((b) => b.slug === 'on')
  const amerian = bloques.find((b) => b.slug === 'amerian')
  const martinBronce = bloques.find((b) => b.slug === 'martin_bronce')

  if (loading) {
    return <div className="p-8 text-sm text-ink-400">Cargando resultados…</div>
  }

  if (!on || !amerian || !martinBronce) {
    return (
      <div className="p-8 text-sm text-ink-400">
        No se encontraron los bloques en la base. Verificá haber corrido supabase/seed.sql.
      </div>
    )
  }

  const onAcumulado = cumplimientoAcumulado(on, anio, objetivos, aportes, historico)
  const amerianAcumulado = cumplimientoAcumulado(amerian, anio, objetivos, aportes, historico)
  const mbAcumulado = cumplimientoAcumulado(martinBronce, anio, objetivos, aportes, historico)

  const consolidados = [on, amerian, martinBronce].map((b) => ({
    bloque: b,
    ...totalConsolidadoUSD(b, aportes, historico, cotizaciones),
  }))
  const totalUSDGlobal = consolidados.reduce((s, c) => s + c.totalUSD, 0)
  const pendientesGlobal = consolidados.reduce((s, c) => s + c.pendienteCount, 0)

  const comparacionData = [
    { nombre: 'ON (ARS)', pct: onAcumulado.ars ?? 0, color: '#B01C2E' },
    { nombre: 'ON (USD)', pct: onAcumulado.usd ?? 0, color: '#7A1727' },
    { nombre: 'Amerian', pct: amerianAcumulado.usd ?? 0, color: '#1E40AF' },
    { nombre: 'Martín Bronce', pct: mbAcumulado.usd ?? 0, color: '#92400E' },
  ]

  const onResultados = resultadosAnio(on, anio, objetivos, aportes, historico)
  const amerianResultados = resultadosAnio(amerian, anio, objetivos, aportes, historico)

  return (
    <div className="space-y-8 p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 dark:text-ink-50">
            Panel de resultados
          </h1>
          <p className="mt-0.5 text-sm text-ink-400">Cumplimiento de objetivos y capital captado por bloque</p>
        </div>
        <select
          value={anio}
          onChange={(e) => setAnio(Number(e.target.value))}
          className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm font-semibold text-ink-700 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-100"
        >
          {aniosDisponibles.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>

      {pendientesGlobal > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-gold-800/25 bg-gold-100/60 px-4 py-3 text-sm text-gold-800 dark:border-gold-800/40 dark:bg-gold-800/10 dark:text-gold-100">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <span>
            Hay {pendientesGlobal} movimiento{pendientesGlobal > 1 ? 's' : ''} en pesos sin cotización MEP de
            cierre de mes cargada — no se están incluyendo en el capital consolidado en USD. Completala en{' '}
            <strong>Cotizaciones MEP</strong>.
          </span>
        </div>
      )}

      {/* KPIs principales */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          eyebrow="Capital acumulado (USD)"
          value={formatUSD(totalUSDGlobal)}
          sub="Todos los bloques, todo el histórico"
          accent="brand"
          icon={<Wallet size={20} />}
        />
        <StatCard
          eyebrow={`ON · cumplimiento ${anio} (ARS)`}
          value={onAcumulado.ars !== null ? formatPct(onAcumulado.ars) : '—'}
          sub={`${formatARS(onAcumulado.logradoArs)} de ${formatARS(onAcumulado.objetivoArs)}`}
          accent="brand"
          icon={<TargetIcon size={20} />}
        />
        <StatCard
          eyebrow={`ON · cumplimiento ${anio} (USD)`}
          value={onAcumulado.usd !== null ? formatPct(onAcumulado.usd) : '—'}
          sub={`${formatUSD(onAcumulado.logradoUsd)} de ${formatUSD(onAcumulado.objetivoUsd)}`}
          accent="dollar"
          icon={<TargetIcon size={20} />}
        />
        <StatCard
          eyebrow={`Amerian · cumplimiento ${anio}`}
          value={amerianAcumulado.usd !== null ? formatPct(amerianAcumulado.usd) : '—'}
          sub={`${formatUSD(amerianAcumulado.logradoUsd)} de ${formatUSD(amerianAcumulado.objetivoUsd)}`}
          accent="ink"
          icon={<TrendingUp size={20} />}
        />
      </div>

      {/* Comparación entre bloques */}
      <section className="rounded-xl border border-ink-100 bg-white p-6 shadow-card dark:border-ink-800 dark:bg-ink-900">
        <h2 className="text-base font-bold text-ink-900 dark:text-ink-50">Comparación entre bloques</h2>
        <p className="mt-0.5 text-xs text-ink-400">% de cumplimiento acumulado a la fecha, por bloque y moneda</p>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparacionData} layout="vertical" margin={{ left: 12, right: 24 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-ink-100 dark:stroke-ink-800" />
              <XAxis type="number" tickFormatter={(v) => formatPct(v)} stroke="currentColor" className="text-ink-400" fontSize={12} />
              <YAxis type="category" dataKey="nombre" width={100} stroke="currentColor" className="text-ink-500" fontSize={12} />
              <Tooltip formatter={(v) => formatPct(Number(v))} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="pct" radius={[0, 6, 6, 0]}>
                {comparacionData.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Martín Bronce — objetivo anual */}
      <section className="rounded-xl border border-ink-100 bg-white p-6 shadow-card dark:border-ink-800 dark:bg-ink-900">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-ink-900 dark:text-ink-50">Martín Bronce — objetivo {anio}</h2>
            <p className="mt-0.5 text-xs text-ink-400">Objetivo anual único en USD</p>
          </div>
          <span className="tabular text-lg font-bold text-ink-900 dark:text-ink-50">
            {mbAcumulado.usd !== null ? formatPct(mbAcumulado.usd) : '—'}
          </span>
        </div>
        <div className="mt-4">
          <ProgressBar pct={mbAcumulado.usd ?? 0} />
          <div className="tabular mt-2 flex justify-between text-xs text-ink-400">
            <span>{formatUSD(mbAcumulado.logradoUsd)} captado</span>
            <span>Objetivo: {formatUSD(mbAcumulado.objetivoUsd)}</span>
          </div>
        </div>
      </section>

      {/* Evolución ON */}
      <section className="rounded-xl border border-ink-100 bg-white p-6 shadow-card dark:border-ink-800 dark:bg-ink-900">
        <h2 className="text-base font-bold text-ink-900 dark:text-ink-50">Evolución mensual — ON</h2>
        <p className="mt-0.5 text-xs text-ink-400">Objetivo vs. facturación captada, en pesos</p>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={onResultados.map((r) => ({ ...r, labelCorto: r.label.split(' ')[0].slice(0, 3) }))}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-ink-100 dark:stroke-ink-800" />
              <XAxis dataKey="labelCorto" stroke="currentColor" className="text-ink-400" fontSize={12} />
              <YAxis tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`} stroke="currentColor" className="text-ink-400" fontSize={12} />
              <Tooltip
                formatter={(v) => formatARS(Number(v))}
                labelFormatter={(l, p) => (p?.[0]?.payload?.label as string) ?? l}
                contentStyle={{ borderRadius: 8, fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="objetivo_ars" name="Objetivo" fill="#d9dade" radius={[4, 4, 0, 0]} />
              <Bar dataKey="logrado_ars" name="Facturación" fill="#B01C2E" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Evolución Amerian */}
      <section className="rounded-xl border border-ink-100 bg-white p-6 shadow-card dark:border-ink-800 dark:bg-ink-900">
        <h2 className="text-base font-bold text-ink-900 dark:text-ink-50">Evolución trimestral — Amerian</h2>
        <p className="mt-0.5 text-xs text-ink-400">Objetivo vs. facturación captada, en dólares</p>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={amerianResultados}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-ink-100 dark:stroke-ink-800" />
              <XAxis dataKey="label" stroke="currentColor" className="text-ink-400" fontSize={12} />
              <YAxis tickFormatter={(v) => `U$S ${(v / 1000).toFixed(0)}k`} stroke="currentColor" className="text-ink-400" fontSize={12} />
              <Tooltip formatter={(v) => formatUSD(Number(v))} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="objetivo_usd" name="Objetivo" fill="#d9dade" radius={[4, 4, 0, 0]} />
              <Bar dataKey="logrado_usd" name="Facturación" fill="#1e40af" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  )
}
