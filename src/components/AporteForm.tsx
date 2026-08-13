import { useState } from 'react'
import type { Aporte, Bloque, Moneda, TipoCliente } from '../types'
import { Field, Input, Select, PrimaryButton, GhostButton } from './Form'

export interface AporteFormValues {
  bloque_id: string
  cliente_nombre: string
  fecha: string
  moneda: Moneda
  monto: string
  tipo_cliente: TipoCliente
  cotizacion_mep_operacion: string
  nota: string
}

function valoresIniciales(bloques: Bloque[], aporte?: Aporte): AporteFormValues {
  return {
    bloque_id: aporte?.bloque_id ?? bloques[0]?.id ?? '',
    cliente_nombre: aporte?.cliente_nombre ?? '',
    fecha: aporte?.fecha ?? new Date().toISOString().slice(0, 10),
    moneda: aporte?.moneda ?? 'ARS',
    monto: aporte ? String(aporte.monto) : '',
    tipo_cliente: aporte?.tipo_cliente ?? 'existente',
    cotizacion_mep_operacion: aporte?.cotizacion_mep_operacion ? String(aporte.cotizacion_mep_operacion) : '',
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

  const bloqueSeleccionado = bloques.find((b) => b.id === values.bloque_id)
  // La cotización por operación solo aplica cuando el objetivo del bloque es único en USD
  // (AMERIAN / MARTIN BRONCE) y el aporte viene en ARS.
  const necesitaCotizacion = bloqueSeleccionado?.moneda_objetivo === 'USD' && values.moneda === 'ARS'

  const set = <K extends keyof AporteFormValues>(key: K, val: AporteFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: val }))

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
            onChange={(e) => set('cliente_nombre', e.target.value)}
            placeholder="Nombre y apellido"
            required
          />
        </Field>
        <Field label="Fecha">
          <Input type="date" value={values.fecha} onChange={(e) => set('fecha', e.target.value)} required />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Moneda">
          <Select value={values.moneda} onChange={(e) => set('moneda', e.target.value as Moneda)}>
            <option value="ARS">ARS — Pesos</option>
            <option value="USD">USD — Dólares</option>
          </Select>
        </Field>
        <Field label="Monto">
          <Input
            type="number"
            step="0.01"
            min="0"
            value={values.monto}
            onChange={(e) => set('monto', e.target.value)}
            placeholder="0.00"
            required
          />
        </Field>
      </div>

      {necesitaCotizacion && (
        <Field label="Cotización MEP de la operación">
          <Input
            type="number"
            step="0.01"
            min="0"
            value={values.cotizacion_mep_operacion}
            onChange={(e) => set('cotizacion_mep_operacion', e.target.value)}
            placeholder="Ej: 1505.00"
            required
          />
          <p className="mt-1 text-xs text-ink-400">
            Este aporte es en pesos pero el objetivo de {bloqueSeleccionado?.nombre} es en dólares — se necesita
            la cotización de esta operación puntual para medir el cumplimiento.
          </p>
        </Field>
      )}

      <Field label="Tipo de cliente">
        <Select value={values.tipo_cliente} onChange={(e) => set('tipo_cliente', e.target.value as TipoCliente)}>
          <option value="existente">Existente</option>
          <option value="nuevo">Nuevo para Valerza</option>
        </Select>
      </Field>

      <Field label="Nota (opcional)">
        <Input
          value={values.nota}
          onChange={(e) => set('nota', e.target.value)}
          placeholder="Canal, clase de instrumento, detalle adicional..."
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
