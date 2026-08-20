import { animate } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

export function useCountUp(target: number, duration = 0.8) {
  const [display, setDisplay] = useState(target)
  const prev = useRef(target)

  useEffect(() => {
    const from = prev.current
    prev.current = target
    const controls = animate(from, target, {
      duration,
      ease: 'easeOut',
      onUpdate: setDisplay,
    })
    return () => controls.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target])

  return display
}
