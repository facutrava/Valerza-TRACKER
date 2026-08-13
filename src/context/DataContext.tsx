import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { Aporte, Bloque, CotizacionMensual, HistoricoMigrado, Objetivo } from '../types'

interface DataContextValue {
  bloques: Bloque[]
  objetivos: Objetivo[]
  aportes: Aporte[]
  historico: HistoricoMigrado[]
  cotizaciones: CotizacionMensual[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  crearAporte: (a: Omit<Aporte, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  actualizarAporte: (id: string, a: Partial<Aporte>) => Promise<void>
  eliminarAporte: (id: string) => Promise<void>
  upsertObjetivo: (o: Omit<Objetivo, 'id'>) => Promise<void>
  upsertCotizacion: (c: Omit<CotizacionMensual, 'id'>) => Promise<void>
  bloquePorSlug: (slug: string) => Bloque | undefined
}

const DataContext = createContext<DataContextValue | undefined>(undefined)

export function DataProvider({ children }: { children: ReactNode }) {
  const [bloques, setBloques] = useState<Bloque[]>([])
  const [objetivos, setObjetivos] = useState<Objetivo[]>([])
  const [aportes, setAportes] = useState<Aporte[]>([])
  const [historico, setHistorico] = useState<HistoricoMigrado[]>([])
  const [cotizaciones, setCotizaciones] = useState<CotizacionMensual[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [b, o, a, h, c] = await Promise.all([
        supabase.from('bloques').select('*').order('orden'),
        supabase.from('objetivos').select('*'),
        supabase.from('aportes').select('*').order('fecha', { ascending: false }),
        supabase.from('historico_migrado').select('*'),
        supabase.from('cotizaciones_mensuales').select('*'),
      ])
      for (const r of [b, o, a, h, c]) {
        if (r.error) throw r.error
      }
      setBloques(b.data as Bloque[])
      setObjetivos(o.data as Objetivo[])
      setAportes(a.data as Aporte[])
      setHistorico(h.data as HistoricoMigrado[])
      setCotizaciones(c.data as CotizacionMensual[])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando datos de Supabase')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const crearAporte: DataContextValue['crearAporte'] = async (a) => {
    const { error } = await supabase.from('aportes').insert(a)
    if (error) throw error
    await fetchAll()
  }

  const actualizarAporte: DataContextValue['actualizarAporte'] = async (id, a) => {
    const { error } = await supabase.from('aportes').update(a).eq('id', id)
    if (error) throw error
    await fetchAll()
  }

  const eliminarAporte: DataContextValue['eliminarAporte'] = async (id) => {
    const { error } = await supabase.from('aportes').delete().eq('id', id)
    if (error) throw error
    await fetchAll()
  }

  const upsertObjetivo: DataContextValue['upsertObjetivo'] = async (o) => {
    const { error } = await supabase
      .from('objetivos')
      .upsert(o, { onConflict: 'bloque_id,periodo_key,moneda' })
    if (error) throw error
    await fetchAll()
  }

  const upsertCotizacion: DataContextValue['upsertCotizacion'] = async (c) => {
    const { error } = await supabase
      .from('cotizaciones_mensuales')
      .upsert(c, { onConflict: 'anio,mes' })
    if (error) throw error
    await fetchAll()
  }

  const bloquePorSlug = useCallback((slug: string) => bloques.find((b) => b.slug === slug), [bloques])

  const value = useMemo(
    () => ({
      bloques,
      objetivos,
      aportes,
      historico,
      cotizaciones,
      loading,
      error,
      refetch: fetchAll,
      crearAporte,
      actualizarAporte,
      eliminarAporte,
      upsertObjetivo,
      upsertCotizacion,
      bloquePorSlug,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bloques, objetivos, aportes, historico, cotizaciones, loading, error]
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData debe usarse dentro de DataProvider')
  return ctx
}
