import { useState, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Logo } from '../components/Logo'
import { Field, Input, PrimaryButton } from '../components/Form'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

type Modo = 'iniciar' | 'crear'

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" width="18" height="18">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.95-2.9l-3.88-3.02c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.26v3.12A11.99 11.99 0 0 0 12 24Z"
      />
      <path fill="#FBBC05" d="M5.27 14.27a7.2 7.2 0 0 1 0-4.54V6.62H1.26a12 12 0 0 0 0 10.77l4.01-3.12Z" />
      <path
        fill="#EA4335"
        d="M12 4.75c1.76 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.26 6.62l4.01 3.12C6.22 6.86 8.87 4.75 12 4.75Z"
      />
    </svg>
  )
}

function traducirError(mensaje: string) {
  if (mensaje.includes('Invalid login credentials')) return 'Email o contraseña incorrectos.'
  if (mensaje.includes('Email not confirmed')) return 'Todavía no confirmaste tu email. Revisá tu bandeja de entrada.'
  if (mensaje.includes('User already registered')) return 'Ya existe una cuenta con ese email.'
  if (mensaje.includes('Password should be at least')) return 'La contraseña debe tener al menos 6 caracteres.'
  return mensaje
}

export function Login() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, sendPasswordReset, resendConfirmation } = useAuth()
  const toast = useToast()
  const [modo, setModo] = useState<Modo>('iniciar')
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [enviandoReset, setEnviandoReset] = useState(false)
  const [emailSinConfirmar, setEmailSinConfirmar] = useState(false)
  const [enviandoConfirmacion, setEnviandoConfirmacion] = useState(false)

  const cambiarModo = (m: Modo) => {
    setModo(m)
    setError(null)
    setMensaje(null)
    setEmailSinConfirmar(false)
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setMensaje(null)
    setEmailSinConfirmar(false)
    setEnviando(true)
    try {
      if (modo === 'crear') {
        await signUpWithEmail({ email, password, nombre, apellido })
        setMensaje('Te enviamos un email de confirmación. Confirmá tu cuenta y después iniciá sesión.')
      } else {
        await signInWithEmail(email, password)
      }
    } catch (err) {
      const mensajeError = err instanceof Error ? err.message : 'Ocurrió un error inesperado.'
      setError(traducirError(mensajeError))
      setEmailSinConfirmar(mensajeError.includes('Email not confirmed'))
    } finally {
      setEnviando(false)
    }
  }

  const onReenviarConfirmacion = async () => {
    setEnviandoConfirmacion(true)
    try {
      await resendConfirmation(email)
      toast.success('Te reenviamos el email de confirmación')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo reenviar el email')
    } finally {
      setEnviandoConfirmacion(false)
    }
  }

  const onOlvideContrasena = async () => {
    if (!email) {
      setError('Ingresá tu email arriba y volvé a tocar el link.')
      return
    }
    setEnviandoReset(true)
    try {
      await sendPasswordReset(email)
      toast.success('Te enviamos un email para restablecer tu contraseña')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo enviar el email')
    } finally {
      setEnviandoReset(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50 px-4 dark:bg-ink-950">
      <div className="w-full max-w-sm rounded-2xl border border-ink-100 bg-white p-8 shadow-card dark:border-ink-800 dark:bg-ink-900">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-50 dark:bg-ink-800">
            <Logo className="h-8 w-8" />
          </div>
          <h1 className="mt-5 text-lg font-extrabold tracking-tight text-ink-900 dark:text-ink-50">Sales Tracker</h1>
          <p className="mt-1.5 text-sm text-ink-400">
            {modo === 'iniciar' ? 'Iniciá sesión para ver y cargar tus resultados' : 'Creá tu cuenta para empezar'}
          </p>
        </div>

        <button
          onClick={signInWithGoogle}
          className="mt-7 flex w-full items-center justify-center gap-3 rounded-lg border border-ink-100 bg-white px-4 py-2.5 text-sm font-semibold text-ink-700 shadow-card transition-colors hover:bg-ink-50 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-100 dark:hover:bg-ink-700"
        >
          <GoogleIcon />
          Continuar con Google
        </button>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-ink-100 dark:bg-ink-800" />
          <span className="text-xs font-medium uppercase tracking-wide text-ink-300 dark:text-ink-600">o</span>
          <div className="h-px flex-1 bg-ink-100 dark:bg-ink-800" />
        </div>

        <form onSubmit={onSubmit} className="space-y-3.5">
          <AnimatePresence initial={false}>
            {modo === 'crear' && (
              <motion.div
                key="nombre-apellido"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Nombre">
                    <Input value={nombre} onChange={(e) => setNombre(e.target.value)} required />
                  </Field>
                  <Field label="Apellido">
                    <Input value={apellido} onChange={(e) => setApellido(e.target.value)} required />
                  </Field>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <Field label="Email">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>
          <Field label="Contraseña">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </Field>

          {modo === 'iniciar' && (
            <button
              type="button"
              onClick={onOlvideContrasena}
              disabled={enviandoReset}
              className="text-xs font-medium text-ink-400 hover:text-brand-600 hover:underline"
            >
              {enviandoReset ? 'Enviando...' : '¿Olvidaste tu contraseña?'}
            </button>
          )}

          {error && (
            <div>
              <p className="text-sm text-brand-600">{error}</p>
              {emailSinConfirmar && (
                <button
                  type="button"
                  onClick={onReenviarConfirmacion}
                  disabled={enviandoConfirmacion}
                  className="mt-1 text-xs font-semibold text-brand-600 hover:underline"
                >
                  {enviandoConfirmacion ? 'Enviando...' : 'Reenviar email de confirmación'}
                </button>
              )}
            </div>
          )}
          {mensaje && <p className="text-sm text-dollar-800 dark:text-dollar-100">{mensaje}</p>}

          <PrimaryButton type="submit" disabled={enviando} className="w-full">
            {enviando ? 'Espera...' : modo === 'iniciar' ? 'Iniciar sesión' : 'Crear cuenta'}
          </PrimaryButton>
        </form>

        <p className="mt-6 text-center text-xs text-ink-400">
          {modo === 'iniciar' ? (
            <>
              ¿No tenés cuenta?{' '}
              <button onClick={() => cambiarModo('crear')} className="font-semibold text-brand-600 hover:underline">
                Creá una
              </button>
            </>
          ) : (
            <>
              ¿Ya tenés cuenta?{' '}
              <button onClick={() => cambiarModo('iniciar')} className="font-semibold text-brand-600 hover:underline">
                Iniciá sesión
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  )
}
