import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
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
import { AlertTriangle, TrendingUp, TrendingDown, Minus, Wallet, Target as TargetIcon } from 'lucide-react'
import { useData } from '../context/DataContext'
import { StatCard } from '../components/StatCard'
import { Skeleton } from '../components/Skeleton'
import { RevealSection } from '../components/RevealSection'
import {
  cumplimientoAcumulado,
  fraccionAnioTranscurrida,
  resultadosAnio,
  totalConsolidadoUSD,
} from '../utils/calculations'
import { formatARS, formatARSCompacto, formatPct, formatUSD, formatUSDCompacto } from '../utils/format'

const currentYear = new Date().getFullYear()

/** Props de animación compartidas por todas las barras de los gráficos del panel — "fill up" al montar. */
const CHART_ANIM = { isAnimationActive: true, animationDuration: 900, animationEasing: 'ease-out' } as const
/** Para gráficos con dos series: la segunda barra arranca un poco después, para que el llenado se note más. */
const CHART_ANIM_2 = { ...CHART_ANIM, animationBegin: 200 } as const

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
    <div className="rounded-lg border border-ink-100 bg-white p-3 text-xs shadow-card transition-opacity duration-150 dark:border-ink-800 dark:bg-ink-900">
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

interface ObjetivoLogradoGenericoDatum {
  label: string
  objetivo: number
  logrado: number
}

/** Igual que ObjetivoLogradoTooltip pero con formato de moneda configurable — usado por los
 * dos gráficos de ON (ARS/USD), que no siempre están en dólares. */
function ObjetivoLogradoGenericoTooltip({
  active,
  payload,
  color,
  format,
}: {
  active?: boolean
  payload?: { payload: ObjetivoLogradoGenericoDatum }[]
  color: string
  format: (n: number) => string
}) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  const pct = d.objetivo ? d.logrado / d.objetivo : null
  return (
    <ChartTooltipCard
      title={d.label}
      rows={[
        {
          label: 'Facturación',
          value: format(d.logrado),
          color,
          sub: pct !== null ? `${formatPct(pct)} del objetivo` : undefined,
        },
        { label: 'Objetivo', value: format(d.objetivo), color: '#9aa0ab' },
      ]}
    />
  )
}

function OnArsEvolucionTooltip(props: { active?: boolean; payload?: { payload: ObjetivoLogradoGenericoDatum }[] }) {
  return <ObjetivoLogradoGenericoTooltip {...props} color="#B01C2E" format={formatARS} />
}

function OnUsdEvolucionTooltip(props: { active?: boolean; payload?: { payload: ObjetivoLogradoGenericoDatum }[] }) {
  return <ObjetivoLogradoGenericoTooltip {...props} color="#1e40af" format={formatUSD} />
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
    return (
      <div className="space-y-8 p-8">
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
        {Array.from({ length: 2 }, (_, i) => (
          <Skeleton key={i} className="h-64 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (!on || !amerian || !martinBronce) {
    return (
      <div className="p-8 text-sm text-ink-400">
        No se encontraron los bloques en la base. Verificá haber corrido supabase/seed.sql.
      </div>
    )
  }

  if (objetivos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-16 text-center">
        <TargetIcon size={32} className="text-ink-300 dark:text-ink-600" />
        <h2 className="text-lg font-bold text-ink-900 dark:text-ink-50">Todavía no cargaste objetivos</h2>
        <p className="max-w-sm text-sm text-ink-400">
          Cargá los objetivos de tus bloques para empezar a ver el cumplimiento y el capital captado en este panel.
        </p>
        <Link
          to="/objetivos"
          className="mt-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-card transition-colors hover:bg-brand-700"
        >
          Ir a Objetivos
        </Link>
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

  // Comparativa año a año + proyección de ritmo (solo tiene sentido para el año en curso)
  const onAcumuladoPrev = cumplimientoAcumulado(on, anio - 1, objetivos, aportes, historico, false)
  const amerianAcumuladoPrev = cumplimientoAcumulado(amerian, anio - 1, objetivos, aportes, historico, false)
  const mbAcumuladoPrev = cumplimientoAcumulado(martinBronce, anio - 1, objetivos, aportes, historico, false)

  const esAnioActual = anio === currentYear
  const fraccionTranscurrida = fraccionAnioTranscurrida(anio)
  const onHastaHoy = cumplimientoAcumulado(on, anio, objetivos, aportes, historico, true)
  const amerianHastaHoy = cumplimientoAcumulado(amerian, anio, objetivos, aportes, historico, true)
  const mbHastaHoy = cumplimientoAcumulado(martinBronce, anio, objetivos, aportes, historico, true)

  const analisisAnualData = [
    {
      nombre: 'ON (ARS)',
      moneda: 'ARS' as const,
      logrado: onAcumulado.logradoArs,
      logradoAnterior: onAcumuladoPrev.logradoArs,
      objetivoTotal: onAcumulado.objetivoArs,
      logradoHastaHoy: onHastaHoy.logradoArs,
    },
    {
      nombre: 'ON (USD)',
      moneda: 'USD' as const,
      logrado: onAcumulado.logradoUsd,
      logradoAnterior: onAcumuladoPrev.logradoUsd,
      objetivoTotal: onAcumulado.objetivoUsd,
      logradoHastaHoy: onHastaHoy.logradoUsd,
    },
    {
      nombre: 'Amerian',
      moneda: 'USD' as const,
      logrado: amerianAcumulado.logradoUsd,
      logradoAnterior: amerianAcumuladoPrev.logradoUsd,
      objetivoTotal: amerianAcumulado.objetivoUsd,
      logradoHastaHoy: amerianHastaHoy.logradoUsd,
    },
    {
      nombre: 'Martín Bronce',
      moneda: 'USD' as const,
      logrado: mbAcumulado.logradoUsd,
      logradoAnterior: mbAcumuladoPrev.logradoUsd,
      objetivoTotal: mbAcumulado.objetivoUsd,
      logradoHastaHoy: mbHastaHoy.logradoUsd,
    },
  ].map((r) => ({
    ...r,
    deltaPct: r.logradoAnterior > 0 ? (r.logrado - r.logradoAnterior) / r.logradoAnterior : null,
    proyeccionPct:
      esAnioActual && r.objetivoTotal > 0 ? r.logradoHastaHoy / fraccionTranscurrida / r.objetivoTotal : null,
  }))

  const UMBRAL_ATRASO = 0.85
  const bloquesAtrasados = analisisAnualData.filter((r) => r.proyeccionPct !== null && r.proyeccionPct < UMBRAL_ATRASO)

  const hoy = new Date()
  const cotizacionMesActual = cotizaciones.some(
    (c) => c.anio === hoy.getFullYear() && c.mes === hoy.getMonth() + 1
  )

  const onResultados = resultadosAnio(on, anio, objetivos, aportes, historico)
  const onArsData = onResultados.map((r) => ({
    labelCorto: r.label.split(' ')[0].slice(0, 3),
    label: r.label,
    objetivo: r.objetivo_ars ?? 0,
    logrado: r.logrado_ars,
  }))
  const onUsdData = onResultados.map((r) => ({
    labelCorto: r.label.split(' ')[0].slice(0, 3),
    label: r.label,
    objetivo: r.objetivo_usd ?? 0,
    logrado: r.logrado_usd,
  }))
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

      <AnimatePresence initial={false}>
        {pendientesGlobal > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-start gap-3 overflow-hidden rounded-xl border border-gold-800/25 bg-gold-100/60 px-4 py-3 text-sm text-gold-800 dark:border-gold-800/40 dark:bg-gold-800/10 dark:text-gold-100"
          >
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
            <span>
              Hay {pendientesGlobal} movimiento{pendientesGlobal > 1 ? 's' : ''} en pesos sin cotización MEP de
              cierre de mes cargada — no se están incluyendo en el capital consolidado en USD. Completala en{' '}
              <strong>Cotizaciones MEP</strong>.
            </span>
          </motion.div>
        )}

        {!cotizacionMesActual && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="flex items-start gap-3 overflow-hidden rounded-xl border border-dollar-800/25 bg-dollar-100/60 px-4 py-3 text-sm text-dollar-800 dark:border-dollar-800/40 dark:bg-dollar-800/10 dark:text-dollar-100"
          >
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
            <span>
              Todavía no cargaste la cotización MEP de este mes.{' '}
              <Link to="/cotizaciones" className="font-semibold underline">
                Cargarla en Cotizaciones MEP
              </Link>
              .
            </span>
          </motion.div>
        )}

        {bloquesAtrasados.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="flex items-start gap-3 overflow-hidden rounded-xl border border-brand-600/25 bg-brand-50 px-4 py-3 text-sm text-brand-700 dark:border-brand-600/40 dark:bg-brand-900/10 dark:text-brand-200"
          >
            <TrendingDown size={18} className="mt-0.5 shrink-0" />
            <span>
              Al ritmo actual, {bloquesAtrasados.length > 1 ? 'estos bloques van' : 'este bloque va'} a cerrar el año
              por debajo del objetivo:{' '}
              <strong>
                {bloquesAtrasados.map((r) => `${r.nombre} (${formatPct(r.proyeccionPct ?? 0)})`).join(', ')}
              </strong>
              .
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Capital acumulado */}
      <StatCard
        eyebrow="Capital acumulado (USD)"
        value={formatUSD(totalUSDGlobal)}
        numericValue={totalUSDGlobal}
        format={formatUSD}
        accent="brand"
        icon={<Wallet size={28} />}
        size="hero"
      />

      {/* KPIs principales */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          eyebrow={`ON · facturación ${anio} (ARS)`}
          value={formatARS(onAcumulado.logradoArs)}
          numericValue={onAcumulado.logradoArs}
          format={formatARS}
          sub={onAcumulado.ars !== null ? `${formatPct(onAcumulado.ars)} del objetivo (${formatARS(onAcumulado.objetivoArs)})` : `Objetivo: ${formatARS(onAcumulado.objetivoArs)}`}
          accent="brand"
          icon={<TargetIcon size={20} />}
          delay={0}
        />
        <StatCard
          eyebrow={`ON · facturación ${anio} (USD)`}
          value={formatUSD(onAcumulado.logradoUsd)}
          numericValue={onAcumulado.logradoUsd}
          format={formatUSD}
          sub={onAcumulado.usd !== null ? `${formatPct(onAcumulado.usd)} del objetivo (${formatUSD(onAcumulado.objetivoUsd)})` : `Objetivo: ${formatUSD(onAcumulado.objetivoUsd)}`}
          accent="dollar"
          icon={<TargetIcon size={20} />}
          delay={0.06}
        />
        <StatCard
          eyebrow={`Amerian · facturación ${anio}`}
          value={formatUSD(amerianAcumulado.logradoUsd)}
          numericValue={amerianAcumulado.logradoUsd}
          format={formatUSD}
          sub={amerianAcumulado.usd !== null ? `${formatPct(amerianAcumulado.usd)} del objetivo (${formatUSD(amerianAcumulado.objetivoUsd)})` : `Objetivo: ${formatUSD(amerianAcumulado.objetivoUsd)}`}
          accent="ink"
          icon={<TrendingUp size={20} />}
          delay={0.12}
        />
        <StatCard
          eyebrow={`Martín Bronce · facturación ${anio}`}
          value={formatUSD(mbAcumulado.logradoUsd)}
          numericValue={mbAcumulado.logradoUsd}
          format={formatUSD}
          sub={mbAcumulado.usd !== null ? `${formatPct(mbAcumulado.usd)} del objetivo (${formatUSD(mbAcumulado.objetivoUsd)})` : `Objetivo: ${formatUSD(mbAcumulado.objetivoUsd)}`}
          accent="gold"
          icon={<TrendingUp size={20} />}
          delay={0.18}
        />
      </div>

      {/* Comparación entre bloques */}
      <RevealSection className="rounded-xl border border-ink-100 bg-white p-6 shadow-card dark:border-ink-800 dark:bg-ink-900">
        {(inView) => (
          <>
            <h2 className="text-base font-bold text-ink-900 dark:text-ink-50">Comparación entre bloques</h2>
            <p className="mt-0.5 text-xs text-ink-400">% de cumplimiento acumulado a la fecha, por bloque y moneda</p>
            <div className="mt-4 h-64">
              {inView && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparacionData} margin={{ left: 12, right: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-ink-100 dark:stroke-ink-800" />
                    <XAxis type="category" dataKey="nombre" stroke="currentColor" className="text-ink-500" fontSize={12} />
                    <YAxis type="number" tickFormatter={(v) => formatPct(v)} stroke="currentColor" className="text-ink-400" fontSize={12} />
                    <Tooltip content={<ComparacionTooltip />} {...tooltipAnchorProps} />
                    <Bar dataKey="pct" name="Cumplimiento" radius={[6, 6, 0, 0]} {...CHART_ANIM}>
                      {comparacionData.map((d, i) => (
                        <Cell key={i} fill={d.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </>
        )}
      </RevealSection>

      {/* Comparativa año a año + proyección de ritmo */}
      <RevealSection className="overflow-hidden rounded-xl border border-ink-100 bg-white shadow-card dark:border-ink-800 dark:bg-ink-900">
        {(inView) => (
          <>
            <div className="px-6 pt-6">
              <h2 className="text-base font-bold text-ink-900 dark:text-ink-50">Comparativa y proyección</h2>
              <p className="mt-0.5 text-xs text-ink-400">
                {anio} vs {anio - 1}
                {esAnioActual && ' · proyección a fin de año, según el ritmo actual'}
              </p>
            </div>
            <table className="mt-4 w-full text-sm">
              <thead>
                <tr className="border-b border-ink-100 bg-ink-50/60 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-400 dark:border-ink-800 dark:bg-ink-800/40">
                  <th className="px-6 py-2.5">Bloque</th>
                  <th className="px-6 py-2.5 text-right">{anio}</th>
                  <th className="px-6 py-2.5 text-right">{anio - 1}</th>
                  <th className="px-6 py-2.5 text-right">Variación</th>
                  {esAnioActual && <th className="px-6 py-2.5 text-right">Proyección</th>}
                </tr>
              </thead>
              <tbody>
                {analisisAnualData.map((r, i) => {
                  const format = r.moneda === 'ARS' ? formatARS : formatUSD
                  return (
                    <motion.tr
                      key={r.nombre}
                      initial={{ opacity: 0, x: -10 }}
                      animate={inView ? { opacity: 1, x: 0 } : undefined}
                      transition={{ duration: 0.3, delay: i * 0.06 }}
                      className="border-b border-ink-50 last:border-0 dark:border-ink-800/60"
                    >
                      <td className="px-6 py-2.5 text-ink-700 dark:text-ink-200">{r.nombre}</td>
                      <td className="tabular px-6 py-2.5 text-right font-semibold text-ink-900 dark:text-ink-50">
                        {format(r.logrado)}
                      </td>
                      <td className="tabular px-6 py-2.5 text-right text-ink-400">
                        {r.logradoAnterior > 0 ? format(r.logradoAnterior) : '—'}
                      </td>
                      <td className="tabular px-6 py-2.5 text-right">
                        {r.deltaPct === null ? (
                          <span className="text-ink-300 dark:text-ink-600">s/d</span>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-1 font-semibold ${
                              r.deltaPct > 0
                                ? 'text-emerald-600'
                                : r.deltaPct < 0
                                  ? 'text-brand-600'
                                  : 'text-ink-400'
                            }`}
                          >
                            {r.deltaPct > 0 ? (
                              <TrendingUp size={13} />
                            ) : r.deltaPct < 0 ? (
                              <TrendingDown size={13} />
                            ) : (
                              <Minus size={13} />
                            )}
                            {formatPct(Math.abs(r.deltaPct))}
                          </span>
                        )}
                      </td>
                      {esAnioActual && (
                        <td className="tabular px-6 py-2.5 text-right text-ink-500">
                          {r.proyeccionPct === null ? '—' : formatPct(r.proyeccionPct)}
                        </td>
                      )}
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </>
        )}
      </RevealSection>

      {/* Martín Bronce — objetivo anual */}
      <RevealSection className="rounded-xl border border-ink-100 bg-white p-6 shadow-card dark:border-ink-800 dark:bg-ink-900">
        {(inView) => (
          <>
            <div>
              <h2 className="text-base font-bold text-ink-900 dark:text-ink-50">Martín Bronce — objetivo {anio}</h2>
              <p className="mt-0.5 text-xs text-ink-400">Objetivo anual único en USD</p>
            </div>
            <div className="tabular mt-4 flex justify-between text-xs text-ink-400">
              <span>{formatUSD(mbAcumulado.logradoUsd)} captado</span>
              <span>Objetivo: {formatUSD(mbAcumulado.objetivoUsd)}</span>
            </div>
            <div className="mt-6 h-56">
              {inView && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mbResultados}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-ink-100 dark:stroke-ink-800" />
                    <XAxis dataKey="label" stroke="currentColor" className="text-ink-400" fontSize={12} />
                    <YAxis tickFormatter={formatUSDCompacto} stroke="currentColor" className="text-ink-400" fontSize={12} />
                    <Tooltip content={<MbEvolucionTooltip />} {...tooltipAnchorProps} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="objetivo_usd" name="Objetivo" fill="#d9dade" radius={[4, 4, 0, 0]} {...CHART_ANIM} />
                    <Bar dataKey="logrado_usd" name="Facturación" fill="#92400E" radius={[4, 4, 0, 0]} {...CHART_ANIM_2} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </>
        )}
      </RevealSection>

      {/* Evolución ON — ARS y USD por separado */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RevealSection className="rounded-xl border border-ink-100 bg-white p-6 shadow-card dark:border-ink-800 dark:bg-ink-900">
          {(inView) => (
            <>
              <h2 className="text-base font-bold text-ink-900 dark:text-ink-50">Evolución mensual — ON (ARS)</h2>
              <p className="mt-0.5 text-xs text-ink-400">Objetivo vs. facturación captada, en pesos</p>
              <div className="tabular mt-4 flex justify-between text-xs text-ink-400">
                <span>{formatARS(onAcumulado.logradoArs)} captado</span>
                <span>Objetivo: {formatARS(onAcumulado.objetivoArs)}</span>
              </div>
              <div className="mt-4 h-64">
                {inView && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={onArsData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-ink-100 dark:stroke-ink-800" />
                      <XAxis dataKey="labelCorto" stroke="currentColor" className="text-ink-400" fontSize={12} />
                      <YAxis tickFormatter={formatARSCompacto} stroke="currentColor" className="text-ink-400" fontSize={12} />
                      <Tooltip content={<OnArsEvolucionTooltip />} {...tooltipAnchorProps} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="objetivo" name="Objetivo" fill="#d9dade" radius={[4, 4, 0, 0]} {...CHART_ANIM} />
                      <Bar dataKey="logrado" name="Facturación" fill="#B01C2E" radius={[4, 4, 0, 0]} {...CHART_ANIM_2} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </>
          )}
        </RevealSection>

        <RevealSection className="rounded-xl border border-ink-100 bg-white p-6 shadow-card dark:border-ink-800 dark:bg-ink-900" delay={0.08}>
          {(inView) => (
            <>
              <h2 className="text-base font-bold text-ink-900 dark:text-ink-50">Evolución mensual — ON (USD)</h2>
              <p className="mt-0.5 text-xs text-ink-400">Objetivo vs. facturación captada, en dólares</p>
              <div className="tabular mt-4 flex justify-between text-xs text-ink-400">
                <span>{formatUSD(onAcumulado.logradoUsd)} captado</span>
                <span>Objetivo: {formatUSD(onAcumulado.objetivoUsd)}</span>
              </div>
              <div className="mt-4 h-64">
                {inView && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={onUsdData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-ink-100 dark:stroke-ink-800" />
                      <XAxis dataKey="labelCorto" stroke="currentColor" className="text-ink-400" fontSize={12} />
                      <YAxis tickFormatter={formatUSDCompacto} stroke="currentColor" className="text-ink-400" fontSize={12} />
                      <Tooltip content={<OnUsdEvolucionTooltip />} {...tooltipAnchorProps} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="objetivo" name="Objetivo" fill="#d9dade" radius={[4, 4, 0, 0]} {...CHART_ANIM} />
                      <Bar dataKey="logrado" name="Facturación" fill="#1e40af" radius={[4, 4, 0, 0]} {...CHART_ANIM_2} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </>
          )}
        </RevealSection>
      </div>

      {/* Evolución Amerian */}
      <RevealSection className="rounded-xl border border-ink-100 bg-white p-6 shadow-card dark:border-ink-800 dark:bg-ink-900">
        {(inView) => (
          <>
            <h2 className="text-base font-bold text-ink-900 dark:text-ink-50">Evolución trimestral — Amerian</h2>
            <p className="mt-0.5 text-xs text-ink-400">Objetivo vs. facturación captada, en dólares</p>
            <div className="mt-4 h-64">
              {inView && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={amerianResultados}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-ink-100 dark:stroke-ink-800" />
                    <XAxis dataKey="label" stroke="currentColor" className="text-ink-400" fontSize={12} />
                    <YAxis tickFormatter={formatUSDCompacto} stroke="currentColor" className="text-ink-400" fontSize={12} />
                    <Tooltip content={<AmerianEvolucionTooltip />} {...tooltipAnchorProps} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="objetivo_usd" name="Objetivo" fill="#d9dade" radius={[4, 4, 0, 0]} {...CHART_ANIM} />
                    <Bar dataKey="logrado_usd" name="Facturación" fill="#1e40af" radius={[4, 4, 0, 0]} {...CHART_ANIM_2} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </>
        )}
      </RevealSection>
    </div>
  )
}
