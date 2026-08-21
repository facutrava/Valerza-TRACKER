// Tipos centrales de la app. Reflejan 1:1 las tablas de supabase/schema.sql

export type Periodicidad = 'mensual' | 'trimestral' | 'anual'
export type Moneda = 'ARS' | 'USD'
export type TipoCliente = 'nuevo' | 'existente'
export type TipoOperacion = 'nueva' | 'renovacion'
export type Canal = 'efectivo' | 'transferencia' | 'cheque' | 'efectivo_transferencia' | 'on_valerza' | 'on_amerian'

// slug fijo de cada bloque, usado en todo el código para no depender de nombres editables
export type BloqueSlug = 'on' | 'amerian' | 'martin_bronce'

export interface Bloque {
  id: string
  slug: BloqueSlug
  nombre: string
  periodicidad: Periodicidad
  // 'DUAL' = tiene objetivo propio en ARS y en USD, medidos independiente (caso ON)
  moneda_objetivo: 'ARS' | 'USD' | 'DUAL'
  orden: number
}

export interface Objetivo {
  id: string
  bloque_id: string
  // 'YYYY-MM' mensual | 'YYYY-Q1'..'Q4' trimestral | 'YYYY' anual
  periodo_key: string
  anio: number
  moneda: Moneda
  monto: number
}

export interface Aporte {
  id: string
  bloque_id: string
  cliente_nombre: string
  fecha: string // ISO yyyy-mm-dd
  moneda: Moneda
  monto: number
  tipo_cliente: TipoCliente
  // MEP cargado en el momento de la operación. Obligatorio cuando la moneda del aporte no
  // coincide con la moneda del objetivo único del bloque (ARS en AMERIAN / MARTIN BRONCE).
  // Opcional en bloques DUAL (ON): si se carga, ese aporte se convierte y cuenta contra el
  // objetivo de la otra moneda (ARS→USD o USD→ARS) en vez del objetivo de su propia moneda.
  cotizacion_mep_operacion: number | null
  // Identificador propio de la operación (numeración interna del usuario, no la PK).
  id_operacion: string | null
  tipo_operacion: TipoOperacion
  canal: Canal | null
  nota: string | null
  created_at: string
  updated_at: string
}

// Totales agregados de Ene-Jul 2026, migrados desde la planilla de Excel sin detalle de cliente
export interface HistoricoMigrado {
  id: string
  bloque_id: string
  periodo_key: string
  anio: number
  moneda: Moneda
  monto: number
}

// Cotización MEP de referencia cargada al cierre de cada mes, usada SOLO
// para convertir a USD en las vistas consolidadas (no para el cumplimiento por bloque)
export interface CotizacionMensual {
  id: string
  anio: number
  mes: number // 1-12
  valor_mep: number
}

export interface PeriodoResultado {
  periodo_key: string
  label: string
  objetivo_ars: number | null
  objetivo_usd: number | null
  logrado_ars: number | null
  logrado_usd: number | null
  cumplimiento_ars: number | null // 0-1+
  cumplimiento_usd: number | null
  logrado_usd_consolidado: number // todo convertido a USD, para comparar entre bloques
}
