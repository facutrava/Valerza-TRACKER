import { ModalShell } from './Modal'
import { GhostButton, PrimaryButton } from './Form'

export function ConfirmDialog({
  open,
  title,
  message,
  danger,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  message: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <ModalShell open={open} onClose={onCancel} maxWidth="max-w-sm">
      <h2 className="text-lg font-bold text-ink-900 dark:text-ink-50">{title}</h2>
      <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">{message}</p>
      <div className="mt-6 flex justify-end gap-2">
        <GhostButton onClick={onCancel}>Cancelar</GhostButton>
        <PrimaryButton onClick={onConfirm}>{danger ? 'Eliminar' : 'Confirmar'}</PrimaryButton>
      </div>
    </ModalShell>
  )
}
