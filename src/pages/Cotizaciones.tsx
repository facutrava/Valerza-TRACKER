import { useState } from 'react'
import { useData } from '../context/DataContext'
import { Field, Input, PrimaryButton, Select } from '../components/Form'
import { mesNombre } from '../utils/format'

const currentYear = new Date().getFullYear()

export function Cotizaciones() {
  const { cotizaciones, upsertCotizacion, loading } = useData()
  const [anio, setAnio] = useState(currentYear)
  const [mes, setMes] = useState(new Date().getMonth() + 1)
  const [valor, setValor] = useState('')
  const [saving, setSaving] = useState(false)

  const guardar = async () => {
    if (!valor) return
    setSaving(true)
    try {
      await upsertCotizacion({ anio, mes, valor_mep: Number(valor) })
      setValor('')
    } finally {
      setSaving(false)
    }
  }

  const ordenadas = [...cotizaciones].sort((a, b) => (a.anio === b.anio ? b.mes - a.mes : b.anio - a.anio))

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 dark:text-ink-50">Cotizaciones MEP</h1>
        <p className="mt-0.5 text-sm text-ink-400 max-w-2xl">
          Cotización de cierre de cada mes. Se usa únicamente para convertir a USD los aportes en pesos en las
          vistas consolidadas del panel — no afecta el cumplimiento de objetivo de cada bloque.
        </p>
      </div>

      <div className="rounded-xl border border-ink-100 bg-white p-6 shadow-card dark:border-ink-800 dark:bg-ink-900">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <Field label="Año">
            <Select value={anio} onChange={(e) => setAnio(Number(e.target.value))}>
              {[currentYear - 1, currentYear, currentYear + 1].map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Mes">
            <Select value={mes} onChange={(e) => setMes(Number(e.target.value))}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {mesNombre(m)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Cotización MEP">
            <Input
              type="number"
              step="0.01"
              min="0"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="Ej: 1520.50"
            />
          </Field>
          <div className="flex items-end">
            <PrimaryButton onClick={guardar} disabled={saving || !valor} className="w-full">
              {saving ? 'Guardando…' : 'Guardar'}
            </PrimaryButton>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-ink-100 bg-white shadow-card dark:border-ink-800 dark:bg-ink-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-100 bg-ink-50/60 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-400 dark:border-ink-800 dark:bg-ink-800/40">
              <th className="px-5 py-3">Mes</th>
              <th className="px-5 py-3">Año</th>
              <th className="px-5 py-3 text-right">Cotización MEP</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={3} className="px-5 py-8 text-center text-ink-400">
                  Cargando…
                </td>
              </tr>
            )}
            {!loading && ordenadas.length === 0 && (
              <tr>
                <td colSpan={3} className="px-5 py-8 text-center text-ink-400">
                  Todavía no cargaste ninguna cotización.
                </td>
              </tr>
            )}
            {ordenadas.map((c) => (
              <tr key={c.id} className="border-b border-ink-50 last:border-0 dark:border-ink-800/60">
                <td className="px-5 py-2.5 text-ink-700 dark:text-ink-200">{mesNombre(c.mes)}</td>
                <td className="px-5 py-2.5 text-ink-500">{c.anio}</td>
                <td className="tabular px-5 py-2.5 text-right font-semibold text-ink-900 dark:text-ink-50">
                  ${c.valor_mep.toLocaleString('es-AR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
