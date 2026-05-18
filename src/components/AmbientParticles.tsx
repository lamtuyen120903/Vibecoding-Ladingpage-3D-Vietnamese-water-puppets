import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const FIREFLY_COUNT = 140

// Warm yellow to soft green color range
const COLOR_WARM = new THREE.Color('#f8e868')
const COLOR_GREEN = new THREE.Color('#88f088')

export default function AmbientParticles() {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  // Each firefly has a "home" point and orbits around it with extra Brownian noise,
  // so the swarm fills the whole visible volume and roams freely.
  const particleData = useMemo(() => {
    const data: Array<{
      baseX: number
      baseY: number
      baseZ: number
      // Orbit (slow circular drift around home point)
      orbitRadius: number
      orbitSpeed: number
      orbitPhase: number
      orbitTiltY: number
      orbitTiltZ: number
      // Brownian noise (small jitter on top of orbit)
      noisePhaseX: number
      noisePhaseY: number
      noisePhaseZ: number
      noiseSpeedX: number
      noiseSpeedY: number
      noiseSpeedZ: number
      noiseAmpX: number
      noiseAmpY: number
      noiseAmpZ: number
      // Blink
      blinkPhase: number
      blinkSpeed: number
    }> = []

    for (let i = 0; i < FIREFLY_COUNT; i++) {
      // Wide spread covering the full visible scene
      const angle = Math.random() * Math.PI * 2
      const radius = 1 + Math.random() * 14 // up to 15 units from center
      data.push({
        baseX: Math.cos(angle) * radius,
        baseY: -1 + Math.random() * 9,           // y ∈ [-1, 8]
        baseZ: -10 + Math.sin(angle) * radius * 0.8 + Math.random() * 8, // wider z spread
        orbitRadius: 0.8 + Math.random() * 2.5,
        orbitSpeed: 0.15 + Math.random() * 0.35,
        orbitPhase: Math.random() * Math.PI * 2,
        orbitTiltY: (Math.random() - 0.5) * 1.5, // tilt orbit plane in Y
        orbitTiltZ: (Math.random() - 0.5) * 1.5, // tilt orbit plane in Z
        noisePhaseX: Math.random() * Math.PI * 2,
        noisePhaseY: Math.random() * Math.PI * 2,
        noisePhaseZ: Math.random() * Math.PI * 2,
        noiseSpeedX: 0.4 + Math.random() * 0.6,
        noiseSpeedY: 0.3 + Math.random() * 0.5,
        noiseSpeedZ: 0.35 + Math.random() * 0.55,
        noiseAmpX: 0.35 + Math.random() * 0.4,
        noiseAmpY: 0.25 + Math.random() * 0.35,
        noiseAmpZ: 0.3 + Math.random() * 0.4,
        blinkPhase: Math.random() * Math.PI * 2,
        blinkSpeed: 1.5 + Math.random() * 2.0,
      })
    }
    return data
  }, [])

  // Precompute colors for each firefly
  const colors = useMemo(() => {
    const colorArray = new Float32Array(FIREFLY_COUNT * 3)
    for (let i = 0; i < FIREFLY_COUNT; i++) {
      const t = Math.random()
      const c = COLOR_WARM.clone().lerp(COLOR_GREEN, t)
      colorArray[i * 3] = c.r
      colorArray[i * 3 + 1] = c.g
      colorArray[i * 3 + 2] = c.b
    }
    return colorArray
  }, [])

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    const elapsed = clock.getElapsedTime()

    for (let i = 0; i < FIREFLY_COUNT; i++) {
      const p = particleData[i]

      // Orbit drift — slow circle around home point, tilted in Y/Z
      const orbitT = elapsed * p.orbitSpeed + p.orbitPhase
      const ox = Math.cos(orbitT) * p.orbitRadius
      const oz = Math.sin(orbitT) * p.orbitRadius
      const oy = Math.sin(orbitT * 0.7) * p.orbitRadius * 0.5

      // Brownian jitter
      const nx = Math.sin(elapsed * p.noiseSpeedX + p.noisePhaseX) * p.noiseAmpX
      const ny = Math.cos(elapsed * p.noiseSpeedY + p.noisePhaseY) * p.noiseAmpY
      const nz = Math.sin(elapsed * p.noiseSpeedZ + p.noisePhaseZ) * p.noiseAmpZ

      dummy.position.set(
        p.baseX + ox + p.orbitTiltY * oy + nx,
        p.baseY + oy + p.orbitTiltZ * ox * 0.3 + ny,
        p.baseZ + oz + nz,
      )

      // Blink animation — sin wave controlling opacity + size
      const blink = (Math.sin(elapsed * p.blinkSpeed + p.blinkPhase) + 1) * 0.5
      const scale = 0.045 + blink * 0.045
      dummy.scale.set(scale, scale, scale)

      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)

      // Apply color with blink intensity via setColorAt
      const colorIdx = i * 3
      const r = colors[colorIdx] * (0.6 + blink * 0.4)
      const g = colors[colorIdx + 1] * (0.6 + blink * 0.4)
      const b = colors[colorIdx + 2] * (0.5 + blink * 0.5)
      meshRef.current.setColorAt(i, new THREE.Color(r, g, b))
    }

    meshRef.current.instanceMatrix.needsUpdate = true
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true
  })

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, FIREFLY_COUNT]}
      frustumCulled={false}
    >
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial
        color="#c8f088"
        transparent
        opacity={0.85}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </instancedMesh>
  )
}
