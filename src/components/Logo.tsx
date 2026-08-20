export function Logo({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M4 30 L15 17 L22 22 L36 6"
        stroke="#B01C2E"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M27 6 L36 6 L36 15" stroke="#B01C2E" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="4" cy="30" r="3" fill="#B01C2E" />
      <circle cx="15" cy="17" r="3" fill="#B01C2E" />
      <circle cx="22" cy="22" r="3" fill="#B01C2E" />
      <circle cx="36" cy="6" r="3" fill="#1F2937" />
    </svg>
  )
}
