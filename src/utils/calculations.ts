import type { Aporte, Bloque, CotizacionMensual, HistoricoMigrado, Objetivo, Periodicidad } from '../types'
import { labelForPeriodo, monthKey, periodoKeyParaBloque, quarterKey, yearKey } from './format'

/** Todos los periodo_key de un año para una periodicidad dada, en orden. */
export function periodosDelAnio(periodicidad: Periodicidad, anio: number): string[] {
  if (periodicidad === 'mensual') {
    return Array.from({ length: 12 }, (_, i) => `${anio}-${String(i + 1).padStart(2, '0')}`)
  }
  if (periodicidad === 'trimestral') {
    return [1, 2, 3, 4].map((q) => `${anio}-Q${q}`)
  }
  return [String(anio)]
}

export interface ResultadoPeriodo {
  periodo_key: string
  label: string
  objetivo_ars: number | null
  objetivo_usd: number | null
  logrado_ars: number
  logrado_usd: number
  cumplimiento_ars: number | null
  cumplimiento_usd: number | null
}

/** Suma histórico + aportes de un bloque, agrupado por período y moneda. */
function agregarLogrado(
  bloque: Bloque,
  aportes: Aporte[],
  historico: HistoricoMigrado[]
): Record<string, { ARS: number; USD: number }> {
  const acc: Record<string, { ARS: number; USD: number }> = {}
  const add = (periodoKey: string, moneda: 'ARS' | 'USD', monto: number) => {
    if (!acc[periodoKey]) acc[periodoKey] = { ARS: 0, USD: 0 }
    acc[periodoKey][moneda] += monto
  }

  for (const h of historico.filter((h) => h.bloque_id === bloque.id)) {
    add(h.periodo_key, h.moneda, h.monto)
  }

  for (const a of aportes.filter((a) => a.bloque_id === bloque.id)) {
    const periodoKey = periodoKeyParaBloque(bloque.periodicidad, a.fecha)
    if (bloque.moneda_objetivo === 'DUAL') {
      // ON: cada moneda cuenta directo contra su propio objetivo, sin conversión
      add(periodoKey, a.moneda, a.monto)
    } else {
      // AMERIAN / MARTIN BRONCE: objetivo único en USD.
      // Un aporte en USD cuenta directo; uno en ARS se convierte con la
      // cotización cargada en el momento de esa operación puntual.
      if (a.moneda === 'USD') {
        add(periodoKey, 'USD', a.monto)
      } else if (a.cotizacion_mep_operacion) {
        add(periodoKey, 'USD', a.monto / a.cotizacion_mep_operacion)
      }
      // Si es ARS y todavía no tiene cotización cargada, no se suma hasta que se complete.
    }
  }

  return acc
}

/** Resultado completo (objetivo, logrado, % cumplimiento) de cada período de un año para un bloque. */
export function resultadosAnio(
  bloque: Bloque,
  anio: number,
  objetivos: Objetivo[],
  aportes: Aporte[],
  historico: HistoricoMigrado[]
): ResultadoPeriodo[] {
  const periodos = periodosDelAnio(bloque.periodicidad, anio)
  const logrado = agregarLogrado(bloque, aportes, historico)
  const objByPeriodo: Record<string, { ARS?: number; USD?: number }> = {}
  for (const o of objetivos.filter((o) => o.bloque_id === bloque.id && o.anio === anio)) {
    if (!objByPeriodo[o.periodo_key]) objByPeriodo[o.periodo_key] = {}
    objByPeriodo[o.periodo_key][o.moneda] = o.monto
  }

  return periodos.map((periodoKey) => {
    const obj = objByPeriodo[periodoKey] || {}
    const log = logrado[periodoKey] || { ARS: 0, USD: 0 }
    const objetivoArs = obj.ARS ?? (bloque.moneda_objetivo === 'DUAL' ? null : null)
    const objetivoUsd = obj.USD ?? null
    return {
      periodo_key: periodoKey,
      label: labelForPeriodo(periodoKey),
      objetivo_ars: bloque.moneda_objetivo === 'DUAL' ? objetivoArs : null,
      objetivo_usd: objetivoUsd,
      logrado_ars: log.ARS,
      logrado_usd: log.USD,
      cumplimiento_ars:
        bloque.moneda_objetivo === 'DUAL' && objetivoArs ? log.ARS / objetivoArs : null,
      cumplimiento_usd: objetivoUsd ? log.USD / objetivoUsd : null,
    }
  })
}

/** Cumplimiento acumulado a la fecha (suma logrado / suma objetivo de los períodos ya transcurridos). */
export function cumplimientoAcumulado(
  bloque: Bloque,
  anio: number,
  objetivos: Objetivo[],
  aportes: Aporte[],
  historico: HistoricoMigrado[],
  soloHastaHoy = true
): { ars: number | null; usd: number | null; logradoArs: number; logradoUsd: number; objetivoArs: number; objetivoUsd: number } {
  const resultados = resultadosAnio(bloque, anio, objetivos, aportes, historico)
  const hoyKey = periodoKeyParaBloque(bloque.periodicidad, new Date().toISOString().slice(0, 10))
  const transcurridos = soloHastaHoy
    ? resultados.filter((r) => r.periodo_key <= hoyKey)
    : resultados

  const objetivoArs = transcurridos.reduce((s, r) => s + (r.objetivo_ars ?? 0), 0)
  const objetivoUsd = transcurridos.reduce((s, r) => s + (r.objetivo_usd ?? 0), 0)
  const logradoArs = transcurridos.reduce((s, r) => s + r.logrado_ars, 0)
  const logradoUsd = transcurridos.reduce((s, r) => s + r.logrado_usd, 0)

  return {
    ars: objetivoArs ? logradoArs / objetivoArs : null,
    usd: objetivoUsd ? logradoUsd / objetivoUsd : null,
    logradoArs,
    logradoUsd,
    objetivoArs,
    objetivoUsd,
  }
}

function cotizacionDe(anio: number, mes: number, cotizaciones: CotizacionMensual[]): number | null {
  return cotizaciones.find((c) => c.anio === anio && c.mes === mes)?.valor_mep ?? null
}

/** Convierte un monto a USD usando la cotización de cierre del mes correspondiente (no la de la operación). */
export function usdEquivalenteConsolidado(
  monto: number,
  moneda: 'ARS' | 'USD',
  fechaOPeriodo: string, // fecha ISO completa, o un periodo_key mensual 'YYYY-MM'
  cotizaciones: CotizacionMensual[]
): number | null {
  if (moneda === 'USD') return monto
  const ym = /^\d{4}-\d{2}$/.test(fechaOPeriodo) ? fechaOPeriodo : monthKey(fechaOPeriodo)
  const [anio, mes] = ym.split('-').map(Number)
  const mep = cotizacionDe(anio, mes, cotizaciones)
  return mep ? monto / mep : null
}

export interface TotalConsolidado {
  totalUSD: number
  pendienteCount: number
}

/** Total en USD de un bloque (histórico + aportes), convirtiendo ARS con el MEP de cierre de mes. */
export function totalConsolidadoUSD(
  bloque: Bloque,
  aportes: Aporte[],
  historico: HistoricoMigrado[],
  cotizaciones: CotizacionMensual[]
): TotalConsolidado {
  let totalUSD = 0
  let pendienteCount = 0

  for (const h of historico.filter((h) => h.bloque_id === bloque.id)) {
    // El histórico solo tiene granularidad mensual para ON (moneda ARS);
    // AMERIAN/MARTIN BRONCE históricos ya están en USD nativo.
    const eq = usdEquivalenteConsolidado(h.monto, h.moneda, h.periodo_key, cotizaciones)
    if (eq === null) pendienteCount++
    else totalUSD += eq
  }

  for (const a of aportes.filter((a) => a.bloque_id === bloque.id)) {
    const eq = usdEquivalenteConsolidado(a.monto, a.moneda, a.fecha, cotizaciones)
    if (eq === null) pendienteCount++
    else totalUSD += eq
  }

  return { totalUSD, pendienteCount }
}

export function periodoActual(periodicidad: Periodicidad): string {
  return periodoKeyParaBloque(periodicidad, new Date().toISOString().slice(0, 10))
}

function ultimoDiaDelMes(anio: number, mes: number): number {
  return new Date(anio, mes, 0).getDate()
}

/** Rango de fechas [inicio, fin] (ISO) que cubre un periodo_key, según su periodicidad. */
export function rangoDePeriodo(periodicidad: Periodicidad, periodoKey: string): [string, string] {
  if (periodicidad === 'mensual') {
    const [anio, mes] = periodoKey.split('-').map(Number)
    return [`${periodoKey}-01`, `${periodoKey}-${String(ultimoDiaDelMes(anio, mes)).padStart(2, '0')}`]
  }
  if (periodicidad === 'trimestral') {
    const [anioStr, qStr] = periodoKey.split('-Q')
    const anio = Number(anioStr)
    const q = Number(qStr)
    const mesInicio = (q - 1) * 3 + 1
    const mesFin = mesInicio + 2
    return [
      `${anio}-${String(mesInicio).padStart(2, '0')}-01`,
      `${anio}-${String(mesFin).padStart(2, '0')}-${String(ultimoDiaDelMes(anio, mesFin)).padStart(2, '0')}`,
    ]
  }
  return [`${periodoKey}-01-01`, `${periodoKey}-12-31`]
}

function seSuperponen(aInicio: string, aFin: string, bInicio: string, bFin: string): boolean {
  return aInicio <= bFin && aFin >= bInicio
}

export interface ResumenRango {
  objetivo_ars: number
  objetivo_usd: number
  logrado_ars: number
  logrado_usd: number
  periodos: ResultadoPeriodo[]
}

/** Suma objetivo/logrado de un bloque para todos los períodos que se superponen con un rango de fechas. */
export function resumenRango(
  bloque: Bloque,
  startISO: string,
  endISO: string,
  objetivos: Objetivo[],
  aportes: Aporte[],
  historico: HistoricoMigrado[]
): ResumenRango {
  const anioInicio = Number(startISO.slice(0, 4))
  const anioFin = Number(endISO.slice(0, 4))
  const periodosIncluidos: ResultadoPeriodo[] = []

  for (let anio = anioInicio; anio <= anioFin; anio++) {
    const resultados = resultadosAnio(bloque, anio, objetivos, aportes, historico)
    for (const r of resultados) {
      const [pInicio, pFin] = rangoDePeriodo(bloque.periodicidad, r.periodo_key)
      if (seSuperponen(pInicio, pFin, startISO, endISO)) periodosIncluidos.push(r)
    }
  }

  return {
    objetivo_ars: periodosIncluidos.reduce((s, r) => s + (r.objetivo_ars ?? 0), 0),
    objetivo_usd: periodosIncluidos.reduce((s, r) => s + (r.objetivo_usd ?? 0), 0),
    logrado_ars: periodosIncluidos.reduce((s, r) => s + r.logrado_ars, 0),
    logrado_usd: periodosIncluidos.reduce((s, r) => s + r.logrado_usd, 0),
    periodos: periodosIncluidos,
  }
}

export { monthKey, quarterKey, yearKey }
