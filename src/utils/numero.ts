// Formato de entrada numérica es-AR: "." separa miles, "," separa decimales.
// El estado del formulario guarda el valor "crudo": sólo dígitos y, como mucho, una coma
// (sin puntos de miles) — se formatea sólo para mostrarlo en el input.

/** Deja pasar sólo dígitos y, como mucho, una coma decimal. */
export function soloDigitosYComa(s: string): string {
  let out = ''
  let comaUsada = false
  for (const ch of s) {
    if (ch >= '0' && ch <= '9') out += ch
    else if (ch === ',' && !comaUsada) {
      out += ','
      comaUsada = true
    }
  }
  return out
}

/** Inserta puntos de miles en la parte entera de un valor "crudo". */
export function formatearCrudo(crudo: string): string {
  const [entero, decimal] = crudo.split(',')
  const enteroFmt = entero ? new Intl.NumberFormat('es-AR').format(BigInt(entero)) : ''
  return decimal !== undefined ? `${enteroFmt},${decimal}` : enteroFmt
}

/** Convierte un valor "crudo" (coma decimal) al número que representa. NaN si está vacío/inválido. */
export function crudoANumero(crudo: string): number {
  if (!crudo) return NaN
  return Number(crudo.replace(',', '.'))
}

/** Convierte un número a su representación "cruda" editable (coma como decimal). */
export function numeroACrudo(n: number): string {
  return String(n).replace('.', ',')
}
