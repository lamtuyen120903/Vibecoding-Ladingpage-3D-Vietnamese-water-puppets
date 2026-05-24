/**
 * Adaptive performance tier — global state, no React context overhead.
 * drei's PerformanceMonitor (inside the Canvas) drives transitions; any
 * component can subscribe via `usePerfTier()` and downgrade what it does
 * (particle counts, shadow casters, expensive shaders) on the fly.
 *
 * Tiers (visual quality is preserved on `high`; the others trade off):
 *   high   → full firefly count, shadows on, post-FX on
 *   medium → ~60% particles, shadows on, post-FX off, DPR cap 1.5
 *   low    → ~30% particles, shadows off, post-FX off, DPR cap 1
 */
import { useEffect, useState } from 'react'

export type PerfTier = 'high' | 'medium' | 'low'

let current: PerfTier = 'high'
const listeners = new Set<(t: PerfTier) => void>()

export function getPerfTier(): PerfTier {
  return current
}

export function setPerfTier(next: PerfTier): void {
  if (next === current) return
  current = next
  listeners.forEach((cb) => cb(next))
}

export function usePerfTier(): PerfTier {
  const [tier, setTier] = useState(current)
  useEffect(() => {
    listeners.add(setTier)
    // Re-sync in case the tier changed between hook init and effect mount
    if (current !== tier) setTier(current)
    return () => { listeners.delete(setTier) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return tier
}

/** Convenience: scale a baseline count for the current tier. */
export function tierScale(tier: PerfTier): number {
  return tier === 'high' ? 1 : tier === 'medium' ? 0.6 : 0.3
}
