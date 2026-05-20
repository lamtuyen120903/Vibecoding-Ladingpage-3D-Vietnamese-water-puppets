import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import * as THREE from 'three'
import type { ActId, StagePhase } from '../App'
import type { Project } from '../data/projects'
import ThuyDinh from './ThuyDinh'
import WaterSurface from './WaterSurface'
import PuppetGroup from './PuppetGroup'
import StageLighting from './StageLighting'
import AudienceSeats from './AudienceSeats'
import TheaterFrame from './TheaterFrame'
import EnhancedPostProcessing from './EnhancedPostProcessing'
import WaterParticles from './WaterParticles'
import AmbientParticles from './AmbientParticles'
import CinematicCamera from './CinematicCamera'

interface Props {
  currentAct: ActId
  phase: StagePhase
  onPuppetClick: (project: Project) => void
  onPuppetHover: (id: string | null) => void
}

export default function PuppetStage({ currentAct, phase, onPuppetClick, onPuppetHover }: Props) {
  return (
    <Canvas
      camera={{ position: [0, 2.2, 9], fov: 56, near: 0.1, far: 60 }}
      gl={{
        antialias: true,
        alpha: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.3,
      }}
      shadows
      dpr={[1, 2]}
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
        {/* Enhanced post-processing: Bloom + Vignette + ChromaticAberration */}
        <EnhancedPostProcessing />
      </Suspense>
    </Canvas>
  )
}
