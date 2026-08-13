import { useMemo, useState } from 'react'
import { Check } from 'lucide-react'
import { useData } from '../context/DataContext'
import { periodosDelAnio } from '../utils/calculations'
import { formatMoneda, labelForPeriodo } from '../utils/format'
import { MonedaBadge } from '../components/MonedaBadge'

const currentYear = new Date().getFullYear()

function FilaObjetivo({
  bloqueId,
  periodoKey,
  anio,
  moneda,
  montoActual,
}: {
  bloqueId: string
  periodoKey: string
  anio: number
  moneda: 'ARS' | 'USD'
  montoActual: number | null
}) {
  const { upsertObjetivo } = useData()
  const [valor, setValor] = useState(montoActual !== null ? String(montoActual) : '')
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)

  const guardar = async () => {
    if (!valor) return
    setSaving(true)
    try {
      await upsertObjetivo({ bloque_id: bloqueId, periodo_key: periodoKey, anio, moneda, monto: Number(valor) })
      setDirty(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <tr className="border-b border-ink-50 last:border-0 dark:border-ink-800/60">
      <td className="px-5 py-2.5 text-sm text-ink-600 dark:text-ink-300">{labelForPeriodo(periodoKey)}</td>
      <td className="px-5 py-2.5">
        <MonedaBadge moneda={moneda} />
      </td>
      <td className="px-5 py-2.5">
        <div className="flex items-center gap-2">
          <input
            type="number"
            step="0.01"
            value={valor}
            onChange={(e) => {
              setValor(e.target.value)
              setDirty(true)
            }}
            placeholder="Sin definir"
            className="tabular w-40 rounded-lg border border-ink-200 bg-white px-2.5 py-1.5 text-sm text-ink-900 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/15 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-50"
          />
          {dirty && (
            <button
              onClick={guardar}
              disabled={saving}
              className="rounded-lg bg-brand-600 p-1.5 text-white hover:bg-brand-700 disabled:opacity-50"
              title="Guardar"
            >
              <Check size={14} />
            </button>
          )}
        </div>
      </td>
      <td className="px-5 py-2.5 text-right text-xs text-ink-400">
        {montoActual !== null ? formatMoneda(montoActual, moneda) : '—'}
      </td>
    </tr>
  )
}

export function Objetivos() {
  const { bloques, objetivos, loading } = useData()
  const [anio, setAnio] = useState(currentYear)

  const aniosDisponibles = useMemo(() => {
    const set = new Set<number>([currentYear, currentYear + 1])
    objetivos.forEach((o) => set.add(o.anio))
    return Array.from(set).sort()
  }, [objetivos])

  if (loading) return <div className="p-8 text-sm text-ink-400">Cargando…</div>

  return (
    <div className="space-y-8 p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 dark:text-ink-50">Objetivos</h1>
          <p className="mt-0.5 text-sm text-ink-400">
            Metas fijadas por Valerza para cada bloque. Se pueden cargar de antemano al arrancar un año nuevo.
          </p>
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

      {bloques.map((bloque) => {
        const periodos = periodosDelAnio(bloque.periodicidad, anio)
        const monedas: ('ARS' | 'USD')[] = bloque.moneda_objetivo === 'DUAL' ? ['ARS', 'USD'] : ['USD']

        return (
          <section
            key={bloque.id}
            className="overflow-hidden rounded-xl border border-ink-100 bg-white shadow-card dark:border-ink-800 dark:bg-ink-900"
          >
            <div className="border-b border-ink-100 px-5 py-3.5 dark:border-ink-800">
              <h2 className="font-bold text-ink-900 dark:text-ink-50">{bloque.nombre}</h2>
              <p className="text-xs capitalize text-ink-400">Periodicidad {bloque.periodicidad}</p>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-ink-50/60 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-400 dark:bg-ink-800/40">
                  <th className="px-5 py-2.5">Período</th>
                  <th className="px-5 py-2.5">Moneda</th>
                  <th className="px-5 py-2.5">Objetivo</th>
                  <th className="px-5 py-2.5 text-right">Guardado</th>
                </tr>
              </thead>
              <tbody>
                {periodos.map((periodoKey) =>
                  monedas.map((moneda) => {
                    const existente = objetivos.find(
                      (o) => o.bloque_id === bloque.id && o.periodo_key === periodoKey && o.moneda === moneda
                    )
                    return (
                      <FilaObjetivo
                        key={`${periodoKey}-${moneda}`}
                        bloqueId={bloque.id}
                        periodoKey={periodoKey}
                        anio={anio}
                        moneda={moneda}
                        montoActual={existente?.monto ?? null}
                      />
                    )
                  })
                )}
              </tbody>
            </table>
          </section>
        )
      })}
    </div>
  )
}
