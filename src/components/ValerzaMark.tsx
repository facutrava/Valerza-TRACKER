export function ValerzaMark({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 6 L16 34 L20 34 L10 6 Z" fill="#B01C2E" />
      <path d="M18 6 L24 20 L30 6" stroke="#9CA3AF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="30" cy="8" r="2.6" fill="#1F2937" />
    </svg>
  )
}
