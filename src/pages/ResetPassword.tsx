import { useState, type FormEvent } from 'react'
import { Logo } from '../components/Logo'
import { Field, Input, PrimaryButton } from '../components/Form'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { supabase } from '../lib/supabase'

export function ResetPassword() {
  const { clearPasswordRecovery, signOut } = useAuth()
  const toast = useToast()
  const [password, setPassword] = useState('')
  const [enviando, setEnviando] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setEnviando(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      toast.success('Contraseña actualizada. Iniciá sesión con la nueva.')
      clearPasswordRecovery()
      await signOut()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo actualizar la contraseña')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50 px-4 dark:bg-ink-950">
      <div className="w-full max-w-sm rounded-2xl border border-ink-100 bg-white p-8 shadow-card dark:border-ink-800 dark:bg-ink-900">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-50 dark:bg-ink-800">
            <Logo className="h-8 w-8" />
          </div>
          <h1 className="mt-5 text-lg font-extrabold tracking-tight text-ink-900 dark:text-ink-50">
            Nueva contraseña
          </h1>
          <p className="mt-1.5 text-sm text-ink-400">Elegí una nueva contraseña para tu cuenta</p>
        </div>

        <form onSubmit={onSubmit} className="mt-7 space-y-3.5">
          <Field label="Contraseña nueva">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </Field>
          <PrimaryButton type="submit" disabled={enviando} className="w-full">
            {enviando ? 'Guardando...' : 'Guardar contraseña'}
          </PrimaryButton>
        </form>
      </div>
    </div>
  )
}
