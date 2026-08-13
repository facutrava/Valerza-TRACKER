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
import {
  cumplimientoAcumulado,
  resultadosAnio,
  totalConsolidadoUSD,
} from '../utils/calculations'
import { formatARS, formatPct, formatUSD } from '../utils/format'

const currentYear = new Date().getFullYear()

interface TooltipRow {
  label: string
  value: string
  color: string
  sub?: string
}

/** Tarjeta flotante compartida por todos los gráficos de barras del panel: monto de capital
 * en grande, color del bloque/serie, y % de cumplimiento como dato secundario. */
function ChartTooltipCard({ title, rows }: { title: string; rows: TooltipRow[] }) {
  return (
    <div className="rounded-lg border border-ink-100 bg-white p-3 text-xs shadow-card dark:border-ink-800 dark:bg-ink-900">
      <div className="mb-2 font-semibold text-ink-900 dark:text-ink-50">{title}</div>
      {rows.map((r, i) => (
        <div key={r.label} className={i > 0 ? 'mt-2' : undefined}>
          <div className="flex items-center justify-between gap-6">
            <span style={{ color: r.color }}>{r.label}</span>
            <span className="tabular font-semibold text-ink-900 dark:text-ink-50">{r.value}</span>
          </div>
          {r.sub && <div className="tabular text-[11px] text-ink-400">{r.sub}</div>}
        </div>
      ))}
    </div>
  )
}

/** Props comunes que evitan que la tarjeta tape la barra bajo el cursor. */
const tooltipAnchorProps = {
  position: { y: 0 },
  cursor: { fill: 'rgba(148, 163, 184, 0.12)' },
  wrapperStyle: { zIndex: 20 },
} as const

interface ComparacionDatum {
  nombre: string
  monto: number
  moneda: 'ARS' | 'USD'
  pct: number
  color: string
}

function ComparacionTooltip({ active, payload }: { active?: boolean; payload?: { payload: ComparacionDatum }[] }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <ChartTooltipCard
      title={d.nombre}
      rows={[
        {
          label: 'Capital captado',
          value: d.moneda === 'ARS' ? formatARS(d.monto) : formatUSD(d.monto),
          color: d.color,
          sub: `${formatPct(d.pct)} del objetivo`,
        },
      ]}
    />
  )
}

interface OnTooltipDatum {
  label: string
  cumplimiento_ars: number
  cumplimiento_usd: number
  logrado_ars: number
  logrado_usd: number
}

function OnEvolucionTooltip({ active, payload }: { active?: boolean; payload?: { payload: OnTooltipDatum }[] }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <ChartTooltipCard
      title={d.label}
      rows={[
        { label: 'Facturación ARS', value: formatARS(d.logrado_ars), color: '#B01C2E', sub: `${formatPct(d.cumplimiento_ars)} del objetivo` },
        { label: 'Facturación USD', value: formatUSD(d.logrado_usd), color: '#1e40af', sub: `${formatPct(d.cumplimiento_usd)} del objetivo` },
      ]}
    />
  )
}

interface ObjetivoLogradoDatum {
  label: string
  objetivo_usd: number
  logrado_usd: number
}

function ObjetivoLogradoTooltip({
  active,
  payload,
  color,
}: {
  active?: boolean
  payload?: { payload: ObjetivoLogradoDatum }[]
  color: string
}) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  const pct = d.objetivo_usd ? d.logrado_usd / d.objetivo_usd : null
  return (
    <ChartTooltipCard
      title={d.label}
      rows={[
        {
          label: 'Facturación',
          value: formatUSD(d.logrado_usd),
          color,
          sub: pct !== null ? `${formatPct(pct)} del objetivo` : undefined,
        },
        { label: 'Objetivo', value: formatUSD(d.objetivo_usd), color: '#9aa0ab' },
      ]}
    />
  )
}

function AmerianEvolucionTooltip(props: { active?: boolean; payload?: { payload: ObjetivoLogradoDatum }[] }) {
  return <ObjetivoLogradoTooltip {...props} color="#1e40af" />
}

function MbEvolucionTooltip(props: { active?: boolean; payload?: { payload: ObjetivoLogradoDatum }[] }) {
  return <ObjetivoLogradoTooltip {...props} color="#92400E" />
}

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

  const onAcumulado = cumplimientoAcumulado(on, anio, objetivos, aportes, historico, false)
  const amerianAcumulado = cumplimientoAcumulado(amerian, anio, objetivos, aportes, historico, false)
  const mbAcumulado = cumplimientoAcumulado(martinBronce, anio, objetivos, aportes, historico, false)

  const consolidados = [on, amerian, martinBronce].map((b) => ({
    bloque: b,
    ...totalConsolidadoUSD(b, aportes, historico, cotizaciones),
  }))
  const totalUSDGlobal = consolidados.reduce((s, c) => s + c.totalUSD, 0)
  const pendientesGlobal = consolidados.reduce((s, c) => s + c.pendienteCount, 0)

  const comparacionData = [
    { nombre: 'ON (ARS)', monto: onAcumulado.logradoArs, moneda: 'ARS' as const, pct: onAcumulado.ars ?? 0, color: '#B01C2E' },
    { nombre: 'ON (USD)', monto: onAcumulado.logradoUsd, moneda: 'USD' as const, pct: onAcumulado.usd ?? 0, color: '#7A1727' },
    { nombre: 'Amerian', monto: amerianAcumulado.logradoUsd, moneda: 'USD' as const, pct: amerianAcumulado.usd ?? 0, color: '#1E40AF' },
    { nombre: 'Martín Bronce', monto: mbAcumulado.logradoUsd, moneda: 'USD' as const, pct: mbAcumulado.usd ?? 0, color: '#92400E' },
  ]

  const onResultados = resultadosAnio(on, anio, objetivos, aportes, historico)
  const amerianResultados = resultadosAnio(amerian, anio, objetivos, aportes, historico)
  const mbResultados = aniosDisponibles.map((a) => {
    const [r] = resultadosAnio(martinBronce, a, objetivos, aportes, historico)
    return { label: String(a), objetivo_usd: r.objetivo_usd ?? 0, logrado_usd: r.logrado_usd }
  })

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
          eyebrow={`ON · facturación ${anio} (ARS)`}
          value={formatARS(onAcumulado.logradoArs)}
          sub={onAcumulado.ars !== null ? `${formatPct(onAcumulado.ars)} del objetivo (${formatARS(onAcumulado.objetivoArs)})` : `Objetivo: ${formatARS(onAcumulado.objetivoArs)}`}
          accent="brand"
          icon={<TargetIcon size={20} />}
        />
        <StatCard
          eyebrow={`ON · facturación ${anio} (USD)`}
          value={formatUSD(onAcumulado.logradoUsd)}
          sub={onAcumulado.usd !== null ? `${formatPct(onAcumulado.usd)} del objetivo (${formatUSD(onAcumulado.objetivoUsd)})` : `Objetivo: ${formatUSD(onAcumulado.objetivoUsd)}`}
          accent="dollar"
          icon={<TargetIcon size={20} />}
        />
        <StatCard
          eyebrow={`Amerian · facturación ${anio}`}
          value={formatUSD(amerianAcumulado.logradoUsd)}
          sub={amerianAcumulado.usd !== null ? `${formatPct(amerianAcumulado.usd)} del objetivo (${formatUSD(amerianAcumulado.objetivoUsd)})` : `Objetivo: ${formatUSD(amerianAcumulado.objetivoUsd)}`}
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
            <BarChart data={comparacionData} margin={{ left: 12, right: 24 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-ink-100 dark:stroke-ink-800" />
              <XAxis type="category" dataKey="nombre" stroke="currentColor" className="text-ink-500" fontSize={12} />
              <YAxis type="number" tickFormatter={(v) => formatPct(v)} stroke="currentColor" className="text-ink-400" fontSize={12} />
              <Tooltip content={<ComparacionTooltip />} {...tooltipAnchorProps} />
              <Bar dataKey="pct" name="Cumplimiento" radius={[6, 6, 0, 0]}>
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
        <div>
          <h2 className="text-base font-bold text-ink-900 dark:text-ink-50">Martín Bronce — objetivo {anio}</h2>
          <p className="mt-0.5 text-xs text-ink-400">Objetivo anual único en USD</p>
        </div>
        <div className="tabular mt-4 flex justify-between text-xs text-ink-400">
          <span>{formatUSD(mbAcumulado.logradoUsd)} captado</span>
          <span>Objetivo: {formatUSD(mbAcumulado.objetivoUsd)}</span>
        </div>
        <div className="mt-6 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mbResultados}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-ink-100 dark:stroke-ink-800" />
              <XAxis dataKey="label" stroke="currentColor" className="text-ink-400" fontSize={12} />
              <YAxis tickFormatter={(v) => `U$S ${(v / 1000).toFixed(0)}k`} stroke="currentColor" className="text-ink-400" fontSize={12} />
              <Tooltip content={<MbEvolucionTooltip />} {...tooltipAnchorProps} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="objetivo_usd" name="Objetivo" fill="#d9dade" radius={[4, 4, 0, 0]} />
              <Bar dataKey="logrado_usd" name="Facturación" fill="#92400E" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Evolución ON */}
      <section className="rounded-xl border border-ink-100 bg-white p-6 shadow-card dark:border-ink-800 dark:bg-ink-900">
        <h2 className="text-base font-bold text-ink-900 dark:text-ink-50">Evolución mensual — ON</h2>
        <p className="mt-0.5 text-xs text-ink-400">% de cumplimiento del objetivo, en pesos y en dólares</p>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={onResultados.map((r) => ({
                labelCorto: r.label.split(' ')[0].slice(0, 3),
                label: r.label,
                cumplimiento_ars: r.cumplimiento_ars ?? 0,
                cumplimiento_usd: r.cumplimiento_usd ?? 0,
                logrado_ars: r.logrado_ars,
                logrado_usd: r.logrado_usd,
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-ink-100 dark:stroke-ink-800" />
              <XAxis dataKey="labelCorto" stroke="currentColor" className="text-ink-400" fontSize={12} />
              <YAxis tickFormatter={(v) => formatPct(v)} stroke="currentColor" className="text-ink-400" fontSize={12} />
              <Tooltip content={<OnEvolucionTooltip />} {...tooltipAnchorProps} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="cumplimiento_ars" name="Facturación ARS" fill="#B01C2E" radius={[4, 4, 0, 0]} />
              <Bar dataKey="cumplimiento_usd" name="Facturación USD" fill="#1e40af" radius={[4, 4, 0, 0]} />
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
              <Tooltip content={<AmerianEvolucionTooltip />} {...tooltipAnchorProps} />
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
