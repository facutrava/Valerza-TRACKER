export function ProgressBar({ pct, size = 'md' }: { pct: number; size?: 'sm' | 'md' }) {
  const clamped = Math.max(0, Math.min(pct, 1.5))
  const overshoot = clamped > 1
  const height = size === 'sm' ? 'h-1.5' : 'h-2.5'

  return (
    <div className={`w-full ${height} overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800`}>
      <div
        className={`${height} rounded-full transition-all ${
          overshoot ? 'bg-emerald-500' : pct >= 0.7 ? 'bg-brand-600' : 'bg-gold-800/70'
        }`}
        style={{ width: `${Math.min(clamped, 1) * 100}%` }}
      />
    </div>
  )
}
