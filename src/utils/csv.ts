function celda(valor: string | number): string {
  const texto = String(valor)
  return /[",\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto
}

export function descargarCSV(nombreArchivo: string, headers: string[], rows: (string | number)[][]) {
  const lineas = [headers, ...rows].map((fila) => fila.map(celda).join(','))
  const csv = '﻿' + lineas.join('\n') // BOM para que Excel abra bien los acentos
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombreArchivo
  a.click()
  URL.revokeObjectURL(url)
}
