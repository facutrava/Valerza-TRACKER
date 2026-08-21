import { useRef, type ChangeEvent } from 'react'
import { Input } from './Form'
import { formatearCrudo, soloDigitosYComa } from '../utils/numero'

interface NumeroInputProps {
  /** Valor "crudo": sólo dígitos y, como mucho, una coma decimal (sin puntos de miles). */
  value: string
  onChange: (crudo: string) => void
  placeholder?: string
  required?: boolean
  className?: string
}

/** Input numérico que muestra separador de miles (".") y decimal ("," ) en formato es-AR
 * mientras se escribe, preservando la posición del cursor. */
export function NumeroInput({ value, onChange, placeholder, required, className }: NumeroInputProps) {
  const ref = useRef<HTMLInputElement>(null)

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.target
    const cursorPrevio = input.selectionStart ?? input.value.length
    const digitosPrevios = (input.value.slice(0, cursorPrevio).match(/[0-9,]/g) ?? []).length

    const crudo = soloDigitosYComa(input.value)
    onChange(crudo)

    requestAnimationFrame(() => {
      const el = ref.current
      if (!el) return
      const visual = formatearCrudo(crudo)
      let contados = 0
      let pos = 0
      while (pos < visual.length && contados < digitosPrevios) {
        if (/[0-9,]/.test(visual[pos])) contados++
        pos++
      }
      el.setSelectionRange(pos, pos)
    })
  }

  return (
    <Input
      ref={ref}
      inputMode="decimal"
      value={formatearCrudo(value)}
      onChange={handleChange}
      placeholder={placeholder}
      required={required}
      className={className}
    />
  )
}
