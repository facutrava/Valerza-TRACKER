/** Extrae un mensaje legible de cualquier error, incluidos objetos que no heredan de `Error`
 * (p. ej. errores de Postgrest en algunos casos), para no ocultar la causa real al usuario. */
export function mensajeDeError(e: unknown, fallback: string): string {
  if (e instanceof Error && e.message) return e.message
  if (e && typeof e === 'object' && 'message' in e && typeof (e as { message: unknown }).message === 'string') {
    return (e as { message: string }).message
  }
  return fallback
}
