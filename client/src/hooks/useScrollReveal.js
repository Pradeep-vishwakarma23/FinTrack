import { useEffect, useRef, useState } from 'react'

/**
 * useScrollReveal: Viewport-triggered animation hook using IntersectionObserver.
 * Automatically respects prefers-reduced-motion.
 */
export function useScrollReveal(options = { threshold: 0.15, triggerOnce: true }) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion) {
      setIsVisible(true)
      return
    }

    if (!('IntersectionObserver' in window)) {
      setIsVisible(true)
      return
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry && entry.isIntersecting) {
        setIsVisible(true)
        if (options.triggerOnce !== false && ref.current) {
          observer.unobserve(ref.current)
        }
      } else if (options.triggerOnce === false) {
        setIsVisible(false)
      }
    }, options)

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      if (observer) observer.disconnect()
    }
  }, [options.threshold, options.triggerOnce])

  return [ref, isVisible]
}

export default useScrollReveal
