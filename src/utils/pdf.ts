import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Aporte, Bloque } from '../types'
import type { ResumenRango } from './calculations'
import { formatARS, formatMoneda, formatPct, formatUSD } from './format'

const ROJO: [number, number, number] = [176, 28, 46]
const NAVY: [number, number, number] = [31, 41, 55]
const GRIS_TEXTO: [number, number, number] = [107, 114, 128]
const GRIS_CLARO: [number, number, number] = [244, 244, 246]

interface ReporteInput {
  preparadoPara: string
  rangoLabel: string
  fechaGeneracion: string
  resumenes: { bloque: Bloque; resumen: ResumenRango }[]
  aportesEnRango: Aporte[]
  nombreBloque: (id: string) => string
}

export function generarReportePDF(input: ReporteInput) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 40
  let y = 50

  // Header — isotipo textual + línea roja, igual que las simulaciones institucionales
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(...NAVY)
  doc.text('Valerza', margin, y)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...GRIS_TEXTO)
  doc.text('FECHA DE GENERACIÓN', pageWidth - margin, y - 12, { align: 'right' })
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...NAVY)
  doc.text(input.fechaGeneracion, pageWidth - margin, y, { align: 'right' })

  y += 12
  doc.setDrawColor(...ROJO)
  doc.setLineWidth(2)
  doc.line(margin, y, pageWidth - margin, y)

  y += 32
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(...NAVY)
  doc.text('Resumen de Resultados Comerciales', margin, y)

  y += 18
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(...GRIS_TEXTO)
  doc.text(`Preparado para ${input.preparadoPara || 'Valerza'}  ·  Período: ${input.rangoLabel}`, margin, y)

  y += 26

  // Tabla resumen por bloque
  const filas: (string | number)[][] = []
  for (const { bloque, resumen } of input.resumenes) {
    if (bloque.moneda_objetivo === 'DUAL') {
      filas.push([
        bloque.nombre,
        'ARS',
        formatARS(resumen.objetivo_ars),
        formatARS(resumen.logrado_ars),
        resumen.objetivo_ars ? formatPct(resumen.logrado_ars / resumen.objetivo_ars) : '—',
      ])
      filas.push([
        bloque.nombre,
        'USD',
        formatUSD(resumen.objetivo_usd),
        formatUSD(resumen.logrado_usd),
        resumen.objetivo_usd ? formatPct(resumen.logrado_usd / resumen.objetivo_usd) : '—',
      ])
    } else {
      filas.push([
        bloque.nombre,
        'USD',
        formatUSD(resumen.objetivo_usd),
        formatUSD(resumen.logrado_usd),
        resumen.objetivo_usd ? formatPct(resumen.logrado_usd / resumen.objetivo_usd) : '—',
      ])
    }
  }

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Bloque', 'Moneda', 'Objetivo', 'Logrado', 'Cumplimiento']],
    body: filas,
    styles: { font: 'helvetica', fontSize: 9.5, cellPadding: 8, textColor: NAVY },
    headStyles: { fillColor: ROJO, textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: GRIS_CLARO },
    columnStyles: {
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right', fontStyle: 'bold' },
    },
  })

  // @ts-expect-error jspdf-autotable extiende el doc en runtime
  y = doc.lastAutoTable.finalY + 34

  // Detalle de aportes en el rango (nivel cliente)
  if (input.aportesEnRango.length > 0) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(...NAVY)
    doc.text('Detalle de aportes del período', margin, y)
    y += 10

    const filasAportes = [...input.aportesEnRango]
      .sort((a, b) => a.fecha.localeCompare(b.fecha))
      .map((a) => [
        a.fecha,
        a.cliente_nombre,
        input.nombreBloque(a.bloque_id),
        a.tipo_cliente === 'nuevo' ? 'Nuevo' : 'Existente',
        formatMoneda(a.monto, a.moneda),
      ])

    autoTable(doc, {
      startY: y + 8,
      margin: { left: margin, right: margin },
      head: [['Fecha', 'Cliente', 'Bloque', 'Tipo', 'Monto']],
      body: filasAportes,
      styles: { font: 'helvetica', fontSize: 9, cellPadding: 6, textColor: NAVY },
      headStyles: { fillColor: NAVY, textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: GRIS_CLARO },
      columnStyles: { 4: { halign: 'right', fontStyle: 'bold' } },
    })
  }

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...GRIS_TEXTO)
  doc.text(
    'Documento de uso interno, generado automáticamente a partir del registro de resultados comerciales.',
    margin,
    doc.internal.pageSize.getHeight() - 24
  )

  doc.save(`Valerza_Resultados_${input.rangoLabel.replace(/\s+/g, '_')}.pdf`)
}
