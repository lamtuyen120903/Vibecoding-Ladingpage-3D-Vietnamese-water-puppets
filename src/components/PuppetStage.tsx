import { Canvas } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import { Suspense, lazy, useMemo, useState } from 'react'
import * as THREE from 'three'
import type { ActId, StagePhase } from '../App'
import type { Project } from '../data/projects'
import ThuyDinh from './ThuyDinh'
import WaterSurface from './WaterSurface'
import PuppetGroup from './PuppetGroup'
import StageLighting from './StageLighting'
import AudienceSeats from './AudienceSeats'
import TheaterFrame from './TheaterFrame'
import WaterParticles from './WaterParticles'
import AmbientParticles from './AmbientParticles'
import CinematicCamera from './CinematicCamera'
import { CanvasPerfMonitor } from './PerfMonitor'
import { setPerfTier } from './perfTier'

// Postprocessing pulls in a 160KB chunk — only load it when actually rendered.
const EnhancedPostProcessing = lazy(() => import('./EnhancedPostProcessing'))

interface Props {
  currentAct: ActId
  phase: StagePhase
  onPuppetClick: (project: Project) => void
  onPuppetHover: (id: string | null) => void
}

export default function PuppetStage({ currentAct, phase, onPuppetClick, onPuppetHover }: Props) {
  // Initial DPR cap — clamp to the device's native ratio (up to 2).
  // PerformanceMonitor below will adjust this down if FPS drops on weak GPUs.
  const initialDpr = useMemo(() => {
    if (typeof window === 'undefined') return 1.75
    return Math.min(Math.max(window.devicePixelRatio || 1, 1), 2)
  }, [])

  const [dpr, setDpr] = useState(initialDpr)
  const [enablePost, setEnablePost] = useState(true)

  return (
    <Canvas
      camera={{ position: [0, 2.2, 9], fov: 56, near: 0.1, far: 60 }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.3,
      }}
      shadows={{ type: THREE.PCFSoftShadowMap, autoUpdate: true }}
      dpr={dpr}
      frameloop="always"
      style={{ width: '100%', height: '100%', background: 'transparent' }}
    >
      {/* Adapt to whatever GPU we end up on. Range 0.5..2 keeps models sharp
          when the laptop can afford it, and drops resolution under load
          rather than rendering at a fixed (laggy) high DPR. */}
      <CanvasPerfMonitor />
      <PerformanceMonitor
        bounds={() => [45, 60]}
        flipflops={3}
        onIncline={() => {
          setDpr((d) => Math.min(2, d + 0.25))
          setPerfTier('high')
        }}
        onDecline={() => {
          setDpr((d) => Math.max(0.75, d - 0.25))
          setPerfTier('medium')
          setEnablePost(false)
        }}
        onFallback={() => {
          setDpr(1)
          setEnablePost(false)
          setPerfTier('low')
        }}
      />

      <CinematicCamera phase={phase} />
      <StageLighting currentAct={currentAct} />

      {/* Lightweight scene shell renders immediately. Each heavy GLB has its
          own Suspense boundary so a slow-loading model doesn't blank out
          everything else — the seats/water/lights stay visible while
          ThuyDinh or the musicians stream in. */}
      <Suspense fallback={null}>
        <WaterSurface />
      </Suspense>

      <Suspense fallback={null}>
        <ThuyDinh />
      </Suspense>

      <Suspense fallback={null}>
        <PuppetGroup
          currentAct={currentAct}
          phase={phase}
          onPuppetClick={onPuppetClick}
          onPuppetHover={onPuppetHover}
        />
      </Suspense>

      <Suspense fallback={null}>
        <AudienceSeats />
      </Suspense>

      <TheaterFrame />
      <WaterParticles currentAct={currentAct} phase={phase} />
      <AmbientParticles />

      {enablePost && (
        <Suspense fallback={null}>
          <EnhancedPostProcessing />
        </Suspense>
      )}
    </Canvas>
  )
}
