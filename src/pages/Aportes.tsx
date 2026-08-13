import { useMemo, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useData } from '../context/DataContext'
import { Modal } from '../components/Modal'
import { AporteForm, type AporteFormValues } from '../components/AporteForm'
import { MonedaBadge } from '../components/MonedaBadge'
import { PrimaryButton, Select } from '../components/Form'
import { formatMoneda } from '../utils/format'
import type { Aporte } from '../types'

export function Aportes() {
  const { bloques, aportes, crearAporte, actualizarAporte, eliminarAporte, loading } = useData()
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<Aporte | undefined>(undefined)
  const [saving, setSaving] = useState(false)
  const [filtroBloque, setFiltroBloque] = useState<string>('todos')

  const aportesFiltrados = useMemo(
    () => (filtroBloque === 'todos' ? aportes : aportes.filter((a) => a.bloque_id === filtroBloque)),
    [aportes, filtroBloque]
  )

  const nombreBloque = (id: string) => bloques.find((b) => b.id === id)?.nombre ?? '—'

  const abrirNuevo = () => {
    setEditando(undefined)
    setModalOpen(true)
  }
  const abrirEdicion = (a: Aporte) => {
    setEditando(a)
    setModalOpen(true)
  }

  const guardar = async (values: AporteFormValues) => {
    setSaving(true)
    try {
      const payload = {
        bloque_id: values.bloque_id,
        cliente_nombre: values.cliente_nombre.trim(),
        fecha: values.fecha,
        moneda: values.moneda,
        monto: Number(values.monto),
        tipo_cliente: values.tipo_cliente,
        cotizacion_mep_operacion: values.cotizacion_mep_operacion
          ? Number(values.cotizacion_mep_operacion)
          : null,
        nota: values.nota.trim() || null,
      }
      if (editando) await actualizarAporte(editando.id, payload)
      else await crearAporte(payload)
      setModalOpen(false)
    } finally {
      setSaving(false)
    }
  }

  const borrar = async (a: Aporte) => {
    if (!confirm(`¿Eliminar el aporte de ${a.cliente_nombre} (${formatMoneda(a.monto, a.moneda)})?`)) return
    await eliminarAporte(a.id)
  }

  return (
    <div className="space-y-6 p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 dark:text-ink-50">Aportes</h1>
          <p className="mt-0.5 text-sm text-ink-400">Carga individual de cada aporte de cliente, por bloque</p>
        </div>
        <PrimaryButton onClick={abrirNuevo} className="flex items-center gap-2">
          <Plus size={16} /> Nuevo aporte
        </PrimaryButton>
      </div>

      <div className="flex items-center gap-3">
        <Select value={filtroBloque} onChange={(e) => setFiltroBloque(e.target.value)} className="w-56">
          <option value="todos">Todos los bloques</option>
          {bloques.map((b) => (
            <option key={b.id} value={b.id}>
              {b.nombre}
            </option>
          ))}
        </Select>
        <span className="text-xs text-ink-400">{aportesFiltrados.length} aportes</span>
      </div>

      <div className="overflow-hidden rounded-xl border border-ink-100 bg-white shadow-card dark:border-ink-800 dark:bg-ink-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-100 bg-ink-50/60 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-400 dark:border-ink-800 dark:bg-ink-800/40">
              <th className="px-5 py-3">Fecha</th>
              <th className="px-5 py-3">Cliente</th>
              <th className="px-5 py-3">Bloque</th>
              <th className="px-5 py-3">Tipo</th>
              <th className="px-5 py-3 text-right">Monto</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-ink-400">
                  Cargando…
                </td>
              </tr>
            )}
            {!loading && aportesFiltrados.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-ink-400">
                  Todavía no cargaste ningún aporte.
                </td>
              </tr>
            )}
            {aportesFiltrados.map((a) => (
              <tr
                key={a.id}
                className="border-b border-ink-50 last:border-0 hover:bg-ink-50/50 dark:border-ink-800/60 dark:hover:bg-ink-800/30"
              >
                <td className="tabular px-5 py-3 text-ink-500">{a.fecha}</td>
                <td className="px-5 py-3 font-medium text-ink-900 dark:text-ink-50">
                  {a.cliente_nombre}
                  {a.nota && <div className="text-xs font-normal text-ink-400">{a.nota}</div>}
                </td>
                <td className="px-5 py-3 text-ink-500">{nombreBloque(a.bloque_id)}</td>
                <td className="px-5 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      a.tipo_cliente === 'nuevo'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-800/25 dark:text-emerald-200'
                        : 'bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-300'
                    }`}
                  >
                    {a.tipo_cliente === 'nuevo' ? 'Nuevo' : 'Existente'}
                  </span>
                </td>
                <td className="tabular px-5 py-3 text-right font-semibold text-ink-900 dark:text-ink-50">
                  <span className="mr-2 inline-block align-middle">
                    <MonedaBadge moneda={a.moneda} />
                  </span>
                  {formatMoneda(a.monto, a.moneda).replace(/^(ARS|U\$S)\s?/, '')}
                </td>
                <td className="px-5 py-3">
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => abrirEdicion(a)}
                      className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-ink-800"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => borrar(a)}
                      className="rounded-lg p-1.5 text-ink-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editando ? 'Editar aporte' : 'Nuevo aporte'}>
        <AporteForm
          bloques={bloques}
          aporte={editando}
          onSubmit={guardar}
          onCancel={() => setModalOpen(false)}
          saving={saving}
        />
      </Modal>
    </div>
  )
}
