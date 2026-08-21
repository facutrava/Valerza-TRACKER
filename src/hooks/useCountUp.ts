import { animate } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

export function useCountUp(target: number, duration = 1.1) {
  const [display, setDisplay] = useState(0)
  const prev = useRef(0)
  const isFirst = useRef(true)

  useEffect(() => {
    const from = prev.current
    prev.current = target
    const controls = animate(from, target, {
      duration: isFirst.current ? duration : 0.7,
      ease: 'easeOut',
      onUpdate: setDisplay,
    })
    isFirst.current = false
    return () => controls.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target])

  return display
}
