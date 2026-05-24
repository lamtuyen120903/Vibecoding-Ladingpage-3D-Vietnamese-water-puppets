import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { ActId } from '../App'
import { usePerfTier } from './perfTier'

interface Props {
  currentAct: ActId
}

const actColors: Record<ActId, { ambient: number; dirIntensity: number }> = {
  intro: { ambient: 1.0, dirIntensity: 1.8 },
  automation: { ambient: 1.05, dirIntensity: 1.9 },
  vibecoding: { ambient: 1.1, dirIntensity: 2.0 },
  video: { ambient: 1.15, dirIntensity: 2.1 },
}

export default function StageLighting({ currentAct }: Props) {
  const ambientRef = useRef<THREE.AmbientLight>(null)
  const sunRef = useRef<THREE.DirectionalLight>(null)
  const tier = usePerfTier()

  // Shadows are by far the heaviest GPU cost on this scene (the whole scene
  // re-renders from the light's POV every frame). Drop them on low-end so the
  // weak machine still hits 30+ fps. Ambient/dir-light intensity is bumped a
  // touch in that case so the floor doesn't go visibly flatter.
  const shadowsOn = tier !== 'low'
  const shadowMapSize = tier === 'high' ? 1024 : 512

  useFrame(() => {
    const cfg = actColors[currentAct]
    if (ambientRef.current) {
      const target = cfg.ambient + (shadowsOn ? 0 : 0.12)
      ambientRef.current.intensity += (target - ambientRef.current.intensity) * 0.03
    }
    if (sunRef.current) {
      sunRef.current.intensity += (cfg.dirIntensity - sunRef.current.intensity) * 0.03
    }
  })

  return (
    <>
      {/* Ambient — warm environment fill */}
      <ambientLight ref={ambientRef} intensity={1.0} color="#f0e8d8" />

      {/* Hemisphere — sky/ground color bleed */}
      <hemisphereLight
        color="#f8f0e0"
        groundColor="#c8a878"
        intensity={0.6}
      />

      {/* Main directional — warm sunlight from upper-front-right */}
      <directionalLight
        ref={sunRef}
        position={[5, 10, 8]}
        intensity={1.8}
        color="#f8e8c8"
        castShadow={shadowsOn}
        shadow-mapSize={[shadowMapSize, shadowMapSize]}
        shadow-bias={-0.0008}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={10}
        shadow-camera-bottom={-6}
        shadow-camera-near={1}
        shadow-camera-far={30}
      />

      {/* Secondary directional — cooler fill from left */}
      <directionalLight
        position={[-6, 8, 4]}
        intensity={0.8}
        color="#d8d8f0"
      />

      {/* Back directional — rim light */}
      <directionalLight
        position={[0, 6, -10]}
        intensity={0.5}
        color="#e8d8c0"
      />
    </>
  )
}
