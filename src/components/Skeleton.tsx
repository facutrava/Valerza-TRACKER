export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-ink-100 dark:bg-ink-800 ${className}`} />
}

export function SkeletonTableRows({ cols, rows = 4 }: { cols: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }, (_, r) => (
        <tr key={r} className="border-b border-ink-50 last:border-0 dark:border-ink-800/60">
          {Array.from({ length: cols }, (_, c) => (
            <td key={c} className="px-5 py-3">
              <Skeleton className="h-4 w-full max-w-[10rem]" />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}
