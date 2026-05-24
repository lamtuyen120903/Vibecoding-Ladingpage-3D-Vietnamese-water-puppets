import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { ActId } from '../App'

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

  useFrame(() => {
    const cfg = actColors[currentAct]
    if (ambientRef.current) {
      ambientRef.current.intensity += (cfg.ambient - ambientRef.current.intensity) * 0.03
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
        castShadow
        shadow-mapSize={[768, 768]}
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
