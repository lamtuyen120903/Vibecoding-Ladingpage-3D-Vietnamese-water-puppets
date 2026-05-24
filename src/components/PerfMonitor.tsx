/**
 * Performance monitor — split into two pieces:
 *
 *   <PerfMonitor />         → mount once at app root (outside <Canvas>).
 *                             Tracks Core Web Vitals + asset load times.
 *
 *   <CanvasPerfMonitor />   → mount INSIDE <Canvas>. Tracks live FPS, draw
 *                             calls and triangle count from the R3F renderer.
 *
 * Metrics flow:
 *   - console.table summary every 5s (dev + prod)
 *   - window.__perf object always available for ad-hoc inspection
 *   - if `window.va` is defined (Vercel Analytics), metrics are forwarded
 *   - opt-in: ?perf=1 in URL shows the on-screen HUD
 */
import { useEffect, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals'

declare global {
  interface Window {
    __perf: PerfSnapshot
    va?: (event: 'event', name: string, data?: Record<string, unknown>) => void
  }
}

export interface PerfSnapshot {
  fps: number
  fpsMin: number
  fpsAvg: number
  drawCalls: number
  triangles: number
  programs: number
  geometries: number
  textures: number
  jsHeapMB: number | null
  // Web Vitals
  lcp?: number
  fcp?: number
  cls?: number
  inp?: number
  ttfb?: number
  // Asset timings (name → ms)
  assets: Record<string, number>
}

const snap: PerfSnapshot = {
  fps: 0, fpsMin: Infinity, fpsAvg: 0,
  drawCalls: 0, triangles: 0, programs: 0, geometries: 0, textures: 0,
  jsHeapMB: null, assets: {},
}
if (typeof window !== 'undefined') window.__perf = snap

function report(name: string, value: number, extra?: Record<string, unknown>) {
  // eslint-disable-next-line no-console
  console.log(`[perf] ${name}=${value.toFixed?.(2) ?? value}`, extra ?? '')
  window.va?.('event', `perf:${name}`, { value, ...extra })
}

function bindWebVitals() {
  const handler = (m: Metric) => {
    const v = m.value
    if (m.name === 'LCP') snap.lcp = v
    if (m.name === 'FCP') snap.fcp = v
    if (m.name === 'CLS') snap.cls = v
    if (m.name === 'INP') snap.inp = v
    if (m.name === 'TTFB') snap.ttfb = v
    report(m.name.toLowerCase(), v, { id: m.id, rating: m.rating })
  }
  onLCP(handler)
  onFCP(handler)
  onCLS(handler)
  onINP(handler)
  onTTFB(handler)
}

function bindAssetTimings() {
  if (typeof PerformanceObserver === 'undefined') return
  const obs = new PerformanceObserver((list) => {
    for (const entry of list.getEntries() as PerformanceResourceTiming[]) {
      if (!/\.(glb|gltf|webp|png|jpg|mp4|mp3)/.test(entry.name)) continue
      const ms = entry.responseEnd - entry.startTime
      const name = entry.name.split('/').pop() ?? entry.name
      snap.assets[name] = ms
      report(`asset:${name}`, ms, { transferSize: entry.transferSize })
    }
  })
  obs.observe({ type: 'resource', buffered: true })
}

let summaryTimer: number | null = null
function startSummaryLoop(showHud: boolean, setHud: (v: PerfSnapshot) => void) {
  if (summaryTimer) return
  summaryTimer = window.setInterval(() => {
    // Memory (Chrome only)
    const mem = (performance as any).memory
    if (mem) snap.jsHeapMB = Math.round(mem.usedJSHeapSize / 1024 / 1024)

    // eslint-disable-next-line no-console
    console.table({
      'FPS (now/avg/min)': `${snap.fps.toFixed(0)} / ${snap.fpsAvg.toFixed(0)} / ${snap.fpsMin === Infinity ? '-' : snap.fpsMin.toFixed(0)}`,
      'Draw calls': snap.drawCalls,
      'Triangles': snap.triangles.toLocaleString(),
      'Programs': snap.programs,
      'Geometries': snap.geometries,
      'Textures': snap.textures,
      'JS heap (MB)': snap.jsHeapMB ?? '-',
      'LCP (ms)': snap.lcp?.toFixed(0) ?? '-',
      'CLS': snap.cls?.toFixed(3) ?? '-',
      'INP (ms)': snap.inp?.toFixed(0) ?? '-',
    })

    if (showHud) setHud({ ...snap })
  }, 5000)
}

/**
 * App-root monitor. No Three.js dependency — safe to mount anywhere.
 */
export default function PerfMonitor() {
  const [hud, setHud] = useState<PerfSnapshot | null>(null)
  const showHudRef = useRef(false)

  useEffect(() => {
    const showHud = typeof window !== 'undefined' && new URLSearchParams(location.search).has('perf')
    showHudRef.current = showHud
    bindWebVitals()
    bindAssetTimings()
    startSummaryLoop(showHud, setHud)
    return () => {
      if (summaryTimer) { clearInterval(summaryTimer); summaryTimer = null }
    }
  }, [])

  if (!hud) return null

  return (
    <div style={{
      position: 'fixed', top: 8, left: 8, zIndex: 9999,
      padding: '8px 10px', borderRadius: 6,
      background: 'rgba(0,0,0,0.72)', color: '#e0d0a0',
      font: '11px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace',
      pointerEvents: 'none', minWidth: 200,
    }}>
      <div><b>FPS</b> {hud.fps.toFixed(0)} (avg {hud.fpsAvg.toFixed(0)}, min {hud.fpsMin === Infinity ? '-' : hud.fpsMin.toFixed(0)})</div>
      <div><b>Draws</b> {hud.drawCalls} · <b>Tri</b> {hud.triangles.toLocaleString()}</div>
      <div><b>Geo</b> {hud.geometries} · <b>Tex</b> {hud.textures} · <b>Prog</b> {hud.programs}</div>
      {hud.jsHeapMB != null && <div><b>Heap</b> {hud.jsHeapMB} MB</div>}
      {hud.lcp != null && <div><b>LCP</b> {hud.lcp.toFixed(0)} ms</div>}
      {hud.inp != null && <div><b>INP</b> {hud.inp.toFixed(0)} ms</div>}
    </div>
  )
}

/**
 * Lives INSIDE the R3F <Canvas>. Samples renderer.info + computes a sliding-
 * window FPS so the outer PerfMonitor can log + display it.
 */
export function CanvasPerfMonitor() {
  const { gl } = useThree()

  const last = useRef(performance.now())
  const accum = useRef(0)
  const frames = useRef(0)
  const samples = useRef<number[]>([])

  useFrame(() => {
    const now = performance.now()
    const dt = now - last.current
    last.current = now
    accum.current += dt
    frames.current += 1

    // Update every ~500ms for a stable readout
    if (accum.current >= 500) {
      const fps = (frames.current * 1000) / accum.current
      snap.fps = fps
      snap.fpsMin = Math.min(snap.fpsMin, fps)
      samples.current.push(fps)
      if (samples.current.length > 60) samples.current.shift()
      snap.fpsAvg = samples.current.reduce((s, v) => s + v, 0) / samples.current.length

      const info = gl.info
      snap.drawCalls  = info.render.calls
      snap.triangles  = info.render.triangles
      snap.programs   = info.programs?.length ?? 0
      snap.geometries = info.memory.geometries
      snap.textures   = info.memory.textures

      accum.current = 0
      frames.current = 0
    }
  })

  return null
}
