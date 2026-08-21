const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]
const MESES_CORTOS = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
]

export function formatARS(monto: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(monto)
}

export function formatUSD(monto: number): string {
  return 'U$S ' + new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(monto)
}

/** Versión compacta de USD para ejes de gráficos (ej: "U$S 12k"). */
export function formatUSDCompacto(monto: number): string {
  return 'U$S ' + new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(monto / 1000) + 'k'
}

/** Versión compacta de ARS para ejes de gráficos (ej: "$ 1,2M"). */
export function formatARSCompacto(monto: number): string {
  return '$ ' + new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 }).format(monto / 1_000_000) + 'M'
}

export function formatMoneda(monto: number, moneda: 'ARS' | 'USD'): string {
  return moneda === 'ARS' ? formatARS(monto) : formatUSD(monto)
}

export function formatPct(valor: number): string {
  return new Intl.NumberFormat('es-AR', { style: 'percent', maximumFractionDigits: 1 }).format(valor)
}

export function monthKey(dateISO: string): string {
  return dateISO.slice(0, 7) // 'YYYY-MM'
}

export function quarterKey(dateISO: string): string {
  const [y, m] = dateISO.split('-').map(Number)
  const q = Math.ceil(m / 3)
  return `${y}-Q${q}`
}

export function yearKey(dateISO: string): string {
  return dateISO.slice(0, 4)
}

export function labelForPeriodo(periodoKey: string): string {
  if (/^\d{4}-\d{2}$/.test(periodoKey)) {
    const [y, m] = periodoKey.split('-')
    return `${MESES[Number(m) - 1]} ${y}`
  }
  if (/^\d{4}-Q[1-4]$/.test(periodoKey)) {
    const [y, q] = periodoKey.split('-')
    return `${q} ${y}`
  }
  return periodoKey // año solo
}

export function labelCortoPeriodo(periodoKey: string): string {
  if (/^\d{4}-\d{2}$/.test(periodoKey)) {
    const [, m] = periodoKey.split('-')
    return MESES_CORTOS[Number(m) - 1]
  }
  return periodoKey
}

export function mesNombre(mes: number): string {
  return MESES[mes - 1]
}

export function periodoKeyParaBloque(
  periodicidad: 'mensual' | 'trimestral' | 'anual',
  dateISO: string
): string {
  if (periodicidad === 'mensual') return monthKey(dateISO)
  if (periodicidad === 'trimestral') return quarterKey(dateISO)
  return yearKey(dateISO)
}
