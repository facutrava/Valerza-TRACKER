import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Users } from 'lucide-react'
import { useData } from '../context/DataContext'
import { Input } from '../components/Form'
import { Skeleton } from '../components/Skeleton'
import { formatARS, formatUSD } from '../utils/format'

interface ResumenCliente {
  nombre: string
  cantidad: number
  totalArs: number
  totalUsd: number
  ultimoAporte: string
  bloques: string[]
}

export function Clientes() {
  const { aportes, bloques, loading } = useData()
  const [filtroTexto, setFiltroTexto] = useState('')

  const nombreBloque = (id: string) => bloques.find((b) => b.id === id)?.nombre ?? '—'

  const resumen = useMemo(() => {
    const porCliente = new Map<string, ResumenCliente>()
    for (const a of aportes) {
      const key = a.cliente_nombre.trim().toLowerCase()
      const bloqueNombre = nombreBloque(a.bloque_id)
      const actual = porCliente.get(key)
      if (!actual) {
        porCliente.set(key, {
          nombre: a.cliente_nombre.trim(),
          cantidad: 1,
          totalArs: a.moneda === 'ARS' ? a.monto : 0,
          totalUsd: a.moneda === 'USD' ? a.monto : 0,
          ultimoAporte: a.fecha,
          bloques: [bloqueNombre],
        })
      } else {
        actual.cantidad += 1
        if (a.moneda === 'ARS') actual.totalArs += a.monto
        else actual.totalUsd += a.monto
        if (a.fecha > actual.ultimoAporte) actual.ultimoAporte = a.fecha
        if (!actual.bloques.includes(bloqueNombre)) actual.bloques.push(bloqueNombre)
      }
    }
    return Array.from(porCliente.values()).sort((a, b) => (a.ultimoAporte < b.ultimoAporte ? 1 : -1))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aportes, bloques])

  const filtrados = useMemo(() => {
    const texto = filtroTexto.trim().toLowerCase()
    return texto ? resumen.filter((c) => c.nombre.toLowerCase().includes(texto)) : resumen
  }, [resumen, filtroTexto])

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 dark:text-ink-50">Clientes</h1>
        <p className="mt-0.5 text-sm text-ink-400">Capital aportado agrupado por cliente, en todos los bloques</p>
      </div>

      <div className="flex items-center gap-3">
        <Input
          value={filtroTexto}
          onChange={(e) => setFiltroTexto(e.target.value)}
          placeholder="Buscar cliente..."
          className="w-56"
        />
        <span className="text-xs text-ink-400">{filtrados.length} clientes</span>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : filtrados.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-ink-100 bg-white p-16 text-center shadow-card dark:border-ink-800 dark:bg-ink-900">
          <Users size={28} className="text-ink-300 dark:text-ink-600" />
          <p className="text-sm text-ink-400">
            {aportes.length === 0 ? 'Todavía no cargaste aportes.' : 'Ningún cliente coincide con la búsqueda.'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-ink-100 bg-white shadow-card dark:border-ink-800 dark:bg-ink-900">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 bg-ink-50/60 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-400 dark:border-ink-800 dark:bg-ink-800/40">
                <th className="px-5 py-3">Cliente</th>
                <th className="px-5 py-3">Bloques</th>
                <th className="px-5 py-3 text-right">Aportes</th>
                <th className="px-5 py-3 text-right">Total ARS</th>
                <th className="px-5 py-3 text-right">Total USD</th>
                <th className="px-5 py-3">Último aporte</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {filtrados.map((c) => (
                  <motion.tr
                    key={c.nombre}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="border-b border-ink-50 last:border-0 hover:bg-ink-50/50 dark:border-ink-800/60 dark:hover:bg-ink-800/30"
                  >
                    <td className="px-5 py-3 font-medium text-ink-900 dark:text-ink-50">{c.nombre}</td>
                    <td className="px-5 py-3 text-xs text-ink-500">{c.bloques.join(', ')}</td>
                    <td className="tabular px-5 py-3 text-right text-ink-500">{c.cantidad}</td>
                    <td className="tabular px-5 py-3 text-right font-semibold text-ink-900 dark:text-ink-50">
                      {c.totalArs > 0 ? formatARS(c.totalArs) : '—'}
                    </td>
                    <td className="tabular px-5 py-3 text-right font-semibold text-ink-900 dark:text-ink-50">
                      {c.totalUsd > 0 ? formatUSD(c.totalUsd) : '—'}
                    </td>
                    <td className="tabular px-5 py-3 text-ink-500">{c.ultimoAporte}</td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
