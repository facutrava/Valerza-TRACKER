import { useMemo, useState } from 'react'
import { FileDown } from 'lucide-react'
import { useData } from '../context/DataContext'
import { Field, Input, PrimaryButton, Select } from '../components/Form'
import { resumenRango, rangoDePeriodo } from '../utils/calculations'
import { formatARS, formatPct, formatUSD, mesNombre } from '../utils/format'
import { generarReportePDF } from '../utils/pdf'

const currentYear = new Date().getFullYear()
type Modo = 'mes' | 'trimestre' | 'anio' | 'personalizado'

export function Reportes() {
  const { bloques, objetivos, aportes, historico } = useData()
  const [modo, setModo] = useState<Modo>('mes')
  const [anio, setAnio] = useState(currentYear)
  const [mes, setMes] = useState(new Date().getMonth() + 1)
  const [trimestre, setTrimestre] = useState(1)
  const [desde, setDesde] = useState(new Date().toISOString().slice(0, 10))
  const [hasta, setHasta] = useState(new Date().toISOString().slice(0, 10))
  const [preparadoPara, setPreparadoPara] = useState('')

  const { startISO, endISO, rangoLabel } = useMemo(() => {
    if (modo === 'mes') {
      const [s, e] = rangoDePeriodo('mensual', `${anio}-${String(mes).padStart(2, '0')}`)
      return { startISO: s, endISO: e, rangoLabel: `${mesNombre(mes)} ${anio}` }
    }
    if (modo === 'trimestre') {
      const [s, e] = rangoDePeriodo('trimestral', `${anio}-Q${trimestre}`)
      return { startISO: s, endISO: e, rangoLabel: `Q${trimestre} ${anio}` }
    }
    if (modo === 'anio') {
      const [s, e] = rangoDePeriodo('anual', String(anio))
      return { startISO: s, endISO: e, rangoLabel: `Año ${anio}` }
    }
    return { startISO: desde, endISO: hasta, rangoLabel: `${desde} al ${hasta}` }
  }, [modo, anio, mes, trimestre, desde, hasta])

  const resumenes = useMemo(
    () =>
      bloques.map((bloque) => ({
        bloque,
        resumen: resumenRango(bloque, startISO, endISO, objetivos, aportes, historico),
      })),
    [bloques, startISO, endISO, objetivos, aportes, historico]
  )

  const aportesEnRango = useMemo(
    () => aportes.filter((a) => a.fecha >= startISO && a.fecha <= endISO),
    [aportes, startISO, endISO]
  )

  const nombreBloque = (id: string) => bloques.find((b) => b.id === id)?.nombre ?? '—'

  const exportar = () => {
    generarReportePDF({
      preparadoPara,
      rangoLabel,
      fechaGeneracion: new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' }),
      resumenes,
      aportesEnRango,
      nombreBloque,
    })
  }

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 dark:text-ink-50">Reportes</h1>
        <p className="mt-0.5 text-sm text-ink-400">Generá un PDF con la identidad de Valerza para mostrar resultados</p>
      </div>

      <div className="rounded-xl border border-ink-100 bg-white p-6 shadow-card dark:border-ink-800 dark:bg-ink-900">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Rango">
            <Select value={modo} onChange={(e) => setModo(e.target.value as Modo)}>
              <option value="mes">Mes puntual</option>
              <option value="trimestre">Trimestre</option>
              <option value="anio">Año completo</option>
              <option value="personalizado">Rango personalizado</option>
            </Select>
          </Field>

          {(modo === 'mes' || modo === 'trimestre' || modo === 'anio') && (
            <Field label="Año">
              <Select value={anio} onChange={(e) => setAnio(Number(e.target.value))}>
                {[currentYear - 1, currentYear, currentYear + 1].map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          {modo === 'mes' && (
            <Field label="Mes">
              <Select value={mes} onChange={(e) => setMes(Number(e.target.value))}>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {mesNombre(m)}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          {modo === 'trimestre' && (
            <Field label="Trimestre">
              <Select value={trimestre} onChange={(e) => setTrimestre(Number(e.target.value))}>
                {[1, 2, 3, 4].map((q) => (
                  <option key={q} value={q}>
                    Q{q}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          {modo === 'personalizado' && (
            <>
              <Field label="Desde">
                <Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
              </Field>
              <Field label="Hasta">
                <Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
              </Field>
            </>
          )}

          <Field label="Preparado para (opcional)">
            <Input
              value={preparadoPara}
              onChange={(e) => setPreparadoPara(e.target.value)}
              placeholder="Ej: Gerencia Comercial"
            />
          </Field>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-ink-100 pt-5 dark:border-ink-800">
          <span className="text-xs text-ink-400">
            Rango seleccionado: <strong className="text-ink-600 dark:text-ink-200">{rangoLabel}</strong>
          </span>
          <PrimaryButton onClick={exportar} className="flex items-center gap-2">
            <FileDown size={16} /> Exportar PDF
          </PrimaryButton>
        </div>
      </div>

      {/* Previsualización simple del contenido del reporte */}
      <div className="overflow-hidden rounded-xl border border-ink-100 bg-white shadow-card dark:border-ink-800 dark:bg-ink-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-100 bg-ink-50/60 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-400 dark:border-ink-800 dark:bg-ink-800/40">
              <th className="px-5 py-3">Bloque</th>
              <th className="px-5 py-3">Moneda</th>
              <th className="px-5 py-3 text-right">Objetivo</th>
              <th className="px-5 py-3 text-right">Logrado</th>
              <th className="px-5 py-3 text-right">Cumplimiento</th>
            </tr>
          </thead>
          <tbody>
            {resumenes.flatMap(({ bloque, resumen }) => {
              const filas = []
              if (bloque.moneda_objetivo === 'DUAL') {
                filas.push(
                  <tr key={bloque.id + 'ars'} className="border-b border-ink-50 dark:border-ink-800/60">
                    <td className="px-5 py-2.5 font-medium text-ink-900 dark:text-ink-50">{bloque.nombre}</td>
                    <td className="px-5 py-2.5 text-ink-500">ARS</td>
                    <td className="tabular px-5 py-2.5 text-right text-ink-500">{formatARS(resumen.objetivo_ars)}</td>
                    <td className="tabular px-5 py-2.5 text-right text-ink-900 dark:text-ink-50">{formatARS(resumen.logrado_ars)}</td>
                    <td className="tabular px-5 py-2.5 text-right font-semibold text-ink-900 dark:text-ink-50">
                      {resumen.objetivo_ars ? formatPct(resumen.logrado_ars / resumen.objetivo_ars) : '—'}
                    </td>
                  </tr>
                )
              }
              filas.push(
                <tr key={bloque.id + 'usd'} className="border-b border-ink-50 last:border-0 dark:border-ink-800/60">
                  <td className="px-5 py-2.5 font-medium text-ink-900 dark:text-ink-50">
                    {bloque.moneda_objetivo === 'DUAL' ? '' : bloque.nombre}
                  </td>
                  <td className="px-5 py-2.5 text-ink-500">USD</td>
                  <td className="tabular px-5 py-2.5 text-right text-ink-500">{formatUSD(resumen.objetivo_usd)}</td>
                  <td className="tabular px-5 py-2.5 text-right text-ink-900 dark:text-ink-50">{formatUSD(resumen.logrado_usd)}</td>
                  <td className="tabular px-5 py-2.5 text-right font-semibold text-ink-900 dark:text-ink-50">
                    {resumen.objetivo_usd ? formatPct(resumen.logrado_usd / resumen.objetivo_usd) : '—'}
                  </td>
                </tr>
              )
              return filas
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
