import { X } from 'lucide-react'
import type { ReactNode } from 'react'

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-xl border border-ink-100 bg-white p-6 shadow-2xl dark:border-ink-800 dark:bg-ink-900">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink-900 dark:text-ink-50">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-ink-800"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
