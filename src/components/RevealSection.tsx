import { motion, useInView } from 'framer-motion'
import { useRef, type ReactNode } from 'react'

interface RevealSectionProps {
  /** Recibe `inView` para poder retrasar el montaje de gráficos hasta que la sección sea visible
   * (así las barras "llenan" al hacer scroll, en vez de haber animado ya fuera de pantalla). */
  children: ReactNode | ((inView: boolean) => ReactNode)
  className?: string
  delay?: number
}

export function RevealSection({ children, className, delay = 0 }: RevealSectionProps) {
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.2 })

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      className={className}
    >
      {typeof children === 'function' ? children(inView) : children}
    </motion.section>
  )
}
