import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowDown, ArrowUp, ArrowUpDown, Download, Pencil, Plus, Trash2 } from 'lucide-react'
import { useData } from '../context/DataContext'
import { useToast } from '../context/ToastContext'
import { useConfirm } from '../context/ConfirmContext'
import { Modal } from '../components/Modal'
import { SkeletonTableRows } from '../components/Skeleton'
import { AporteForm, type AporteFormValues } from '../components/AporteForm'
import { MonedaBadge } from '../components/MonedaBadge'
import { GhostButton, Input, PrimaryButton, Select } from '../components/Form'
import { formatMoneda, mesNombre } from '../utils/format'
import { descargarCSV } from '../utils/csv'
import { mensajeDeError } from '../utils/errors'
import { crudoANumero } from '../utils/numero'
import type { Aporte } from '../types'

type CampoOrden = 'fecha' | 'cliente_nombre' | 'monto' | 'bloque' | 'tipo_cliente' | 'id_operacion' | 'tipo_operacion'

const PAGINA = 25

export function Aportes() {
  const { bloques, aportes, crearAporte, actualizarAporte, eliminarAporte, loading } = useData()
  const toast = useToast()
  const confirm = useConfirm()
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<Aporte | undefined>(undefined)
  const [saving, setSaving] = useState(false)
  const [filtroBloque, setFiltroBloque] = useState<string>('todos')
  const [filtroTexto, setFiltroTexto] = useState('')
  const [filtroDesde, setFiltroDesde] = useState('')
  const [filtroHasta, setFiltroHasta] = useState('')
  const [filtroMes, setFiltroMes] = useState('')
  const [orden, setOrden] = useState<{ campo: CampoOrden; dir: 'asc' | 'desc' }>({ campo: 'fecha', dir: 'desc' })
  const [visibleCount, setVisibleCount] = useState(PAGINA)

  const nombreBloque = (id: string) => bloques.find((b) => b.id === id)?.nombre ?? '—'

  const mesesDisponibles = useMemo(() => {
    const set = new Set(aportes.map((a) => a.fecha.slice(0, 7)))
    return Array.from(set)
      .sort()
      .reverse()
      .map((ym) => {
        const [anio, mes] = ym.split('-').map(Number)
        return { valor: ym, label: `${mesNombre(mes)} ${anio}` }
      })
  }, [aportes])

  const aplicarFiltroMes = (valor: string) => {
    setFiltroMes(valor)
    if (!valor) {
      setFiltroDesde('')
      setFiltroHasta('')
      return
    }
    const [anio, mes] = valor.split('-').map(Number)
    const ultimoDia = new Date(anio, mes, 0).getDate()
    setFiltroDesde(`${valor}-01`)
    setFiltroHasta(`${valor}-${String(ultimoDia).padStart(2, '0')}`)
  }

  const onCambiarDesde = (valor: string) => {
    setFiltroDesde(valor)
    setFiltroMes('')
  }

  const onCambiarHasta = (valor: string) => {
    setFiltroHasta(valor)
    setFiltroMes('')
  }

  const aportesFiltrados = useMemo(() => {
    const texto = filtroTexto.trim().toLowerCase()
    return aportes.filter((a) => {
      if (filtroBloque !== 'todos' && a.bloque_id !== filtroBloque) return false
      if (texto && !a.cliente_nombre.toLowerCase().includes(texto)) return false
      if (filtroDesde && a.fecha < filtroDesde) return false
      if (filtroHasta && a.fecha > filtroHasta) return false
      return true
    })
  }, [aportes, filtroBloque, filtroTexto, filtroDesde, filtroHasta])

  const aportesOrdenados = useMemo(() => {
    const signo = orden.dir === 'asc' ? 1 : -1
    return [...aportesFiltrados].sort((a, b) => {
      if (orden.campo === 'monto') return (a.monto - b.monto) * signo
      if (orden.campo === 'bloque') return nombreBloque(a.bloque_id).localeCompare(nombreBloque(b.bloque_id)) * signo
      if (orden.campo === 'id_operacion') return (a.id_operacion ?? '').localeCompare(b.id_operacion ?? '') * signo
      const va = a[orden.campo]
      const vb = b[orden.campo]
      return va < vb ? -signo : va > vb ? signo : 0
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aportesFiltrados, orden])

  useEffect(() => {
    setVisibleCount(PAGINA)
  }, [filtroBloque, filtroTexto, filtroDesde, filtroHasta, filtroMes, orden])

  const aportesPaginados = aportesOrdenados.slice(0, visibleCount)

  const CAMPOS_ASC_POR_DEFECTO: CampoOrden[] = ['cliente_nombre', 'bloque', 'tipo_cliente', 'id_operacion', 'tipo_operacion']

  const ordenarPor = (campo: CampoOrden) => {
    setOrden((o) =>
      o.campo === campo
        ? { campo, dir: o.dir === 'asc' ? 'desc' : 'asc' }
        : { campo, dir: CAMPOS_ASC_POR_DEFECTO.includes(campo) ? 'asc' : 'desc' }
    )
  }

  const IconoOrden = ({ campo }: { campo: CampoOrden }) => {
    if (orden.campo !== campo) return <ArrowUpDown size={12} className="opacity-40" />
    return orden.dir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
  }

  const exportarCSV = () => {
    descargarCSV(
      `aportes_${new Date().toISOString().slice(0, 10)}.csv`,
      ['Fecha', 'Cliente', 'Bloque', 'Tipo', 'Moneda', 'Monto', 'Nota'],
      aportesOrdenados.map((a) => [
        a.fecha,
        a.cliente_nombre,
        nombreBloque(a.bloque_id),
        a.tipo_cliente === 'nuevo' ? 'Nuevo' : 'Existente',
        a.moneda,
        a.monto,
        a.nota ?? '',
      ])
    )
  }

  const abrirNuevo = () => {
    setEditando(undefined)
    setModalOpen(true)
  }
  const abrirEdicion = (a: Aporte) => {
    setEditando(a)
    setModalOpen(true)
  }

  const guardar = async (values: AporteFormValues) => {
    const palabrasNombre = values.cliente_nombre.trim().split(/\s+/).filter(Boolean)
    if (palabrasNombre.length < 2) {
      toast.error('Ingresá nombre y apellido del cliente')
      return
    }
    const monto = crudoANumero(values.monto)
    if (!monto || monto <= 0) {
      toast.error('Ingresá un monto válido')
      return
    }
    if (!values.id_operacion.trim()) {
      toast.error('Ingresá el ID de la operación')
      return
    }
    if (!values.canal) {
      toast.error('Seleccioná un canal')
      return
    }
    setSaving(true)
    try {
      const payload = {
        bloque_id: values.bloque_id,
        cliente_nombre: values.cliente_nombre.trim(),
        fecha: values.fecha,
        moneda: values.moneda,
        monto,
        tipo_cliente: values.tipo_cliente,
        cotizacion_mep_operacion: values.cotizacion_mep_operacion
          ? crudoANumero(values.cotizacion_mep_operacion)
          : null,
        id_operacion: values.id_operacion.trim(),
        tipo_operacion: values.tipo_operacion,
        canal: values.canal,
        nota: values.nota.trim() || null,
      }
      if (editando) await actualizarAporte(editando.id, payload)
      else await crearAporte(payload)
      setModalOpen(false)
      toast.success(editando ? 'Aporte actualizado' : 'Aporte guardado')
    } catch (e) {
      toast.error(mensajeDeError(e, 'No se pudo guardar el aporte'))
    } finally {
      setSaving(false)
    }
  }

  const borrar = async (a: Aporte) => {
    const ok = await confirm({
      title: 'Eliminar aporte',
      message: `¿Eliminar el aporte de ${a.cliente_nombre} (${formatMoneda(a.monto, a.moneda)})?`,
      danger: true,
    })
    if (!ok) return
    try {
      await eliminarAporte(a.id)
      toast.success('Aporte eliminado')
    } catch (e) {
      toast.error(mensajeDeError(e, 'No se pudo eliminar el aporte'))
    }
  }

  return (
    <div className="space-y-6 p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 dark:text-ink-50">Aportes</h1>
          <p className="mt-0.5 text-sm text-ink-400">Carga individual de cada aporte de cliente, por bloque</p>
        </div>
        <div className="flex items-center gap-2">
          <GhostButton onClick={exportarCSV} className="flex items-center gap-2">
            <Download size={16} /> Exportar CSV
          </GhostButton>
          <PrimaryButton onClick={abrirNuevo} className="flex items-center gap-2">
            <Plus size={16} /> Nuevo aporte
          </PrimaryButton>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[180px] flex-1 sm:max-w-xs">
          <Input
            value={filtroTexto}
            onChange={(e) => setFiltroTexto(e.target.value)}
            placeholder="Buscar cliente..."
          />
        </div>
        <div className="w-40 shrink-0">
          <Select value={filtroBloque} onChange={(e) => setFiltroBloque(e.target.value)}>
            <option value="todos">Todos los bloques</option>
            {bloques.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nombre}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-36 shrink-0">
          <Select value={filtroMes} onChange={(e) => aplicarFiltroMes(e.target.value)}>
            <option value="">Todos los meses</option>
            {mesesDisponibles.map((m) => (
              <option key={m.valor} value={m.valor}>
                {m.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <div className="w-[9.5rem]">
            <Input
              type="date"
              value={filtroDesde}
              onChange={(e) => onCambiarDesde(e.target.value)}
              title="Desde"
            />
          </div>
          <span className="text-xs text-ink-300 dark:text-ink-600">–</span>
          <div className="w-[9.5rem]">
            <Input
              type="date"
              value={filtroHasta}
              onChange={(e) => onCambiarHasta(e.target.value)}
              title="Hasta"
            />
          </div>
        </div>
        <span className="ml-auto shrink-0 text-xs text-ink-400">{aportesFiltrados.length} aportes</span>
      </div>

      <div className="overflow-hidden rounded-xl border border-ink-100 bg-white shadow-card dark:border-ink-800 dark:bg-ink-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-100 bg-ink-50/60 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-400 dark:border-ink-800 dark:bg-ink-800/40">
              <th className="px-5 py-3">
                <button onClick={() => ordenarPor('fecha')} className="flex items-center gap-1 hover:text-ink-700 dark:hover:text-ink-100">
                  Fecha <IconoOrden campo="fecha" />
                </button>
              </th>
              <th className="px-5 py-3">
                <button onClick={() => ordenarPor('id_operacion')} className="flex items-center gap-1 hover:text-ink-700 dark:hover:text-ink-100">
                  ID <IconoOrden campo="id_operacion" />
                </button>
              </th>
              <th className="px-5 py-3">
                <button onClick={() => ordenarPor('cliente_nombre')} className="flex items-center gap-1 hover:text-ink-700 dark:hover:text-ink-100">
                  Cliente <IconoOrden campo="cliente_nombre" />
                </button>
              </th>
              <th className="px-5 py-3">
                <button onClick={() => ordenarPor('bloque')} className="flex items-center gap-1 hover:text-ink-700 dark:hover:text-ink-100">
                  Bloque <IconoOrden campo="bloque" />
                </button>
              </th>
              <th className="px-5 py-3">
                <button onClick={() => ordenarPor('tipo_cliente')} className="flex items-center gap-1 hover:text-ink-700 dark:hover:text-ink-100">
                  Tipo <IconoOrden campo="tipo_cliente" />
                </button>
              </th>
              <th className="px-5 py-3">
                <button onClick={() => ordenarPor('tipo_operacion')} className="flex items-center gap-1 hover:text-ink-700 dark:hover:text-ink-100">
                  Operación <IconoOrden campo="tipo_operacion" />
                </button>
              </th>
              <th className="px-5 py-3 text-right">
                <button onClick={() => ordenarPor('monto')} className="ml-auto flex items-center gap-1 hover:text-ink-700 dark:hover:text-ink-100">
                  Monto <IconoOrden campo="monto" />
                </button>
              </th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading && <SkeletonTableRows cols={8} rows={5} />}
            {!loading && aportesFiltrados.length === 0 && (
              <tr>
                <td colSpan={8} className="px-5 py-8 text-center text-ink-400">
                  Todavía no cargaste ningún aporte.
                </td>
              </tr>
            )}
            <AnimatePresence initial={false}>
              {aportesPaginados.map((a) => {
                const monedaMostrada = a.cotizacion_mep_operacion
                  ? a.moneda === 'ARS'
                    ? 'USD'
                    : 'ARS'
                  : a.moneda
                const montoMostrado = a.cotizacion_mep_operacion
                  ? a.moneda === 'ARS'
                    ? a.monto / a.cotizacion_mep_operacion
                    : a.monto * a.cotizacion_mep_operacion
                  : a.monto
                return (
                <motion.tr
                  key={a.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="border-b border-ink-50 last:border-0 hover:bg-ink-50/50 dark:border-ink-800/60 dark:hover:bg-ink-800/30"
                >
                <td className="tabular px-5 py-3 text-ink-500">{a.fecha}</td>
                <td className="tabular px-5 py-3 text-ink-500">{a.id_operacion || '—'}</td>
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
                <td className="px-5 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      a.tipo_operacion === 'renovacion'
                        ? 'bg-gold-100 text-gold-800 dark:bg-gold-800/25 dark:text-gold-100'
                        : 'bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-300'
                    }`}
                  >
                    {a.tipo_operacion === 'renovacion' ? 'Renovación' : 'Nueva'}
                  </span>
                </td>
                <td className="tabular px-5 py-3 text-right font-semibold text-ink-900 dark:text-ink-50">
                  <span
                    className="inline-flex items-center justify-end gap-2 whitespace-nowrap"
                    title={
                      a.cotizacion_mep_operacion
                        ? `Convertido de ${formatMoneda(a.monto, a.moneda)} con cotización ${a.cotizacion_mep_operacion}`
                        : undefined
                    }
                  >
                    <MonedaBadge moneda={monedaMostrada} />
                    {formatMoneda(montoMostrado, monedaMostrada).replace(/^(ARS|U\$S)\s?/, '')}
                  </span>
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
                </motion.tr>
                )
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {aportesOrdenados.length > visibleCount && (
        <div className="flex justify-center">
          <GhostButton onClick={() => setVisibleCount((v) => v + PAGINA)}>
            Cargar más ({aportesOrdenados.length - visibleCount} restantes)
          </GhostButton>
        </div>
      )}

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
