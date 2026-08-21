import { useEffect, useState } from 'react'
import type { Aporte, Bloque, Canal, Moneda, TipoCliente, TipoOperacion } from '../types'
import { Field, Input, Select, PrimaryButton, GhostButton } from './Form'
import { NumeroInput } from './NumeroInput'
import { numeroACrudo } from '../utils/numero'

const CANALES: { value: Canal; label: string }[] = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'efectivo_transferencia', label: 'Efect/transf' },
  { value: 'on_valerza', label: 'ON Valerza' },
  { value: 'on_amerian', label: 'ON Amerian' },
]

export interface AporteFormValues {
  bloque_id: string
  cliente_nombre: string
  fecha: string
  moneda: Moneda
  monto: string
  tipo_cliente: TipoCliente
  cotizacion_mep_operacion: string
  id_operacion: string
  tipo_operacion: TipoOperacion
  canal: Canal | ''
  nota: string
}

function valoresIniciales(bloques: Bloque[], aporte?: Aporte): AporteFormValues {
  return {
    bloque_id: aporte?.bloque_id ?? bloques[0]?.id ?? '',
    cliente_nombre: aporte?.cliente_nombre ?? '',
    fecha: aporte?.fecha ?? new Date().toISOString().slice(0, 10),
    moneda: aporte?.moneda ?? 'ARS',
    monto: aporte ? numeroACrudo(aporte.monto) : '',
    tipo_cliente: aporte?.tipo_cliente ?? 'existente',
    cotizacion_mep_operacion: aporte?.cotizacion_mep_operacion ? numeroACrudo(aporte.cotizacion_mep_operacion) : '',
    id_operacion: aporte?.id_operacion ?? '',
    tipo_operacion: aporte?.tipo_operacion ?? 'nueva',
    canal: aporte?.canal ?? '',
    nota: aporte?.nota ?? '',
  }
}

export function AporteForm({
  bloques,
  aporte,
  onSubmit,
  onCancel,
  saving,
}: {
  bloques: Bloque[]
  aporte?: Aporte
  onSubmit: (values: AporteFormValues) => void
  onCancel: () => void
  saving?: boolean
}) {
  const [values, setValues] = useState<AporteFormValues>(valoresIniciales(bloques, aporte))
  const [convertir, setConvertir] = useState(Boolean(aporte?.cotizacion_mep_operacion))

  const bloqueSeleccionado = bloques.find((b) => b.id === values.bloque_id)
  // Objetivo único en USD (AMERIAN / MARTIN BRONCE): la cotización es obligatoria para poder
  // medir el cumplimiento, no hay otro destino posible para un aporte en pesos.
  const cotizacionObligatoria = bloqueSeleccionado?.moneda_objetivo === 'USD' && values.moneda === 'ARS'
  // ON tiene objetivo propio en ARS y en USD: un aporte cuenta por defecto contra el objetivo
  // de su misma moneda. El checkbox "Dolarizar o pesificar" es la señal explícita para que,
  // en su lugar, cuente contra el objetivo de la otra moneda (requiere cotización).
  const puedeConvertir = bloqueSeleccionado?.moneda_objetivo === 'DUAL'
  const mostrarCotizacion = cotizacionObligatoria || (puedeConvertir && convertir)

  const set = <K extends keyof AporteFormValues>(key: K, val: AporteFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: val }))

  useEffect(() => {
    if (!mostrarCotizacion) set('cotizacion_mep_operacion', '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mostrarCotizacion])

  useEffect(() => {
    if (!puedeConvertir) setConvertir(false)
  }, [puedeConvertir])

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit(values)
      }}
      className="space-y-4"
    >
      <Field label="Bloque">
        <Select value={values.bloque_id} onChange={(e) => set('bloque_id', e.target.value)} required>
          {bloques.map((b) => (
            <option key={b.id} value={b.id}>
              {b.nombre}
            </option>
          ))}
        </Select>
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Cliente">
          <Input
            value={values.cliente_nombre}
            onChange={(e) => set('cliente_nombre', e.target.value.toUpperCase())}
            placeholder="NOMBRE Y APELLIDO"
            required
          />
        </Field>
        <Field label="Fecha">
          <Input type="date" value={values.fecha} onChange={(e) => set('fecha', e.target.value)} required />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Moneda">
          <Select value={values.moneda} onChange={(e) => set('moneda', e.target.value as Moneda)} required>
            <option value="ARS">ARS — Pesos</option>
            <option value="USD">USD — Dólares</option>
          </Select>
        </Field>
        <Field label="Monto">
          <NumeroInput
            value={values.monto}
            onChange={(crudo) => set('monto', crudo)}
            placeholder="0,00"
            required
          />
        </Field>
      </div>

      {puedeConvertir && (
        <label className="flex items-center gap-2 text-sm font-medium text-ink-700 dark:text-ink-200">
          <input
            type="checkbox"
            checked={convertir}
            onChange={(e) => setConvertir(e.target.checked)}
            className="h-4 w-4 rounded border-ink-300 accent-brand-600 dark:border-ink-600"
          />
          Dolarizar o pesificar este aporte
        </label>
      )}

      {mostrarCotizacion && (
        <Field label="Cotización para Dolarización o Pesificación">
          <NumeroInput
            value={values.cotizacion_mep_operacion}
            onChange={(crudo) => set('cotizacion_mep_operacion', crudo)}
            placeholder="Ej: 1.505,00"
            required={cotizacionObligatoria || (puedeConvertir && convertir)}
          />
        </Field>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Field label="ID">
          <Input
            value={values.id_operacion}
            onChange={(e) => set('id_operacion', e.target.value.replace(/\D/g, ''))}
            placeholder="Ej: 00123"
            inputMode="numeric"
            required
          />
        </Field>
        <Field label="Canal">
          <Select value={values.canal} onChange={(e) => set('canal', e.target.value as Canal | '')} required>
            <option value="" disabled>
              Seleccioná un canal
            </option>
            {CANALES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Tipo de operación">
          <Select
            value={values.tipo_operacion}
            onChange={(e) => set('tipo_operacion', e.target.value as TipoOperacion)}
            required
          >
            <option value="nueva">Nueva</option>
            <option value="renovacion">Renovación</option>
          </Select>
        </Field>
        <Field label="Tipo de cliente">
          <Select
            value={values.tipo_cliente}
            onChange={(e) => set('tipo_cliente', e.target.value as TipoCliente)}
            required
          >
            <option value="existente">Existente</option>
            <option value="nuevo">Nuevo</option>
          </Select>
        </Field>
      </div>

      <Field label="Nota (opcional)">
        <Input
          value={values.nota}
          onChange={(e) => set('nota', e.target.value.toUpperCase())}
          placeholder="DETALLE ADICIONAL..."
        />
      </Field>

      <div className="flex justify-end gap-2 pt-2">
        <GhostButton type="button" onClick={onCancel}>
          Cancelar
        </GhostButton>
        <PrimaryButton type="submit" disabled={saving}>
          {saving ? 'Guardando…' : aporte ? 'Guardar cambios' : 'Cargar aporte'}
        </PrimaryButton>
      </div>
    </form>
  )
}
