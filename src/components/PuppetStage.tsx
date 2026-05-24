import { Canvas } from '@react-three/fiber'
import { Suspense, lazy, useMemo } from 'react'
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

// Postprocessing pulls in a 160KB chunk — only load it when actually rendered.
const EnhancedPostProcessing = lazy(() => import('./EnhancedPostProcessing'))

interface Props {
  currentAct: ActId
  phase: StagePhase
  onPuppetClick: (project: Project) => void
  onPuppetHover: (id: string | null) => void
}

export default function PuppetStage({ currentAct, phase, onPuppetClick, onPuppetHover }: Props) {
  // Detect low-power devices so we can dial down GPU cost without changing the look.
  const { dprCap, antialias, enablePost } = useMemo(() => {
    if (typeof window === 'undefined') return { dprCap: 1.5, antialias: true, enablePost: true }
    const ua = navigator.userAgent
    const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua)
    const cores = navigator.hardwareConcurrency ?? 4
    const lowEnd = isMobile || cores <= 4
    return {
      dprCap: lowEnd ? 1.25 : 1.75,
      antialias: !lowEnd,
      enablePost: !lowEnd,
    }
  }, [])

  return (
    <Canvas
      camera={{ position: [0, 2.2, 9], fov: 56, near: 0.1, far: 60 }}
      gl={{
        antialias,
        alpha: true,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.3,
      }}
      shadows
      dpr={[1, dprCap]}
      frameloop="always"
      style={{ width: '100%', height: '100%', background: 'transparent' }}
    >
      <Suspense fallback={null}>
        <CinematicCamera phase={phase} />
        <StageLighting currentAct={currentAct} />
        <ThuyDinh />
        <WaterSurface />
        <PuppetGroup
          currentAct={currentAct}
          phase={phase}
          onPuppetClick={onPuppetClick}
          onPuppetHover={onPuppetHover}
        />
        <AudienceSeats />
        <TheaterFrame />
        <WaterParticles currentAct={currentAct} phase={phase} />
        <AmbientParticles />
        {enablePost && (
          <Suspense fallback={null}>
            <EnhancedPostProcessing />
          </Suspense>
        )}
      </Suspense>
    </Canvas>
  )
}
