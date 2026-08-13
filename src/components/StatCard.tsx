import type { ReactNode } from 'react'

interface StatCardProps {
  eyebrow: string
  value: string
  sub?: string
  accent?: 'brand' | 'ink' | 'gold' | 'dollar'
  icon?: ReactNode
  /** 'hero' = tarjeta destacada, con el número mucho más grande. */
  size?: 'default' | 'hero'
}

const accentMap = {
  brand: 'from-brand-600/15',
  ink: 'from-ink-700/15',
  gold: 'from-gold-800/15',
  dollar: 'from-dollar-800/15',
}

export function StatCard({ eyebrow, value, sub, accent = 'brand', icon, size = 'default' }: StatCardProps) {
  const isHero = size === 'hero'
  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-ink-100 bg-white shadow-card dark:border-ink-800 dark:bg-ink-900 ${
        isHero ? 'p-8' : 'p-5'
      }`}
    >
      {/* acento diagonal en la esquina — eco del corte angular del isotipo Valerza */}
      <div
        className={`pointer-events-none absolute -right-6 -top-6 h-24 w-24 rotate-45 bg-gradient-to-br ${accentMap[accent]} to-transparent`}
      />
      {isHero ? (
        <div className="relative flex flex-wrap items-center justify-center gap-4">
          {icon && <div className="shrink-0 text-brand-600 dark:text-brand-400">{icon}</div>}
          <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">{eyebrow}</div>
          <div className="tabular whitespace-nowrap text-4xl font-bold tracking-tight text-ink-900 dark:text-ink-50 sm:text-5xl">
            {value}
          </div>
        </div>
      ) : (
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <div className="flex min-h-[2.5em] items-end text-[11px] font-semibold uppercase leading-tight tracking-wider text-ink-400">
              {eyebrow}
            </div>
            <div className="tabular mt-1.5 whitespace-nowrap text-[1.375rem] font-bold tracking-tight text-ink-900 dark:text-ink-50">
              {value}
            </div>
            {sub && <div className="mt-1 text-xs text-ink-400">{sub}</div>}
          </div>
          {icon && <div className="text-brand-600 dark:text-brand-400">{icon}</div>}
        </div>
      )}
    </div>
  )
}
