export function MonedaBadge({ moneda }: { moneda: 'ARS' | 'USD' }) {
  const isArs = moneda === 'ARS'
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
        isArs
          ? 'bg-gold-100 text-gold-800 dark:bg-gold-800/25 dark:text-gold-100'
          : 'bg-dollar-100 text-dollar-800 dark:bg-dollar-800/25 dark:text-dollar-100'
      }`}
    >
      {moneda}
    </span>
  )
}
