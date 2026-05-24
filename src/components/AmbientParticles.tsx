import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { usePerfTier, tierScale } from './perfTier'
import { noRaycast } from './noRaycast'

const FIREFLY_MAX = 140

// Warm yellow to soft green color range
const COLOR_WARM = new THREE.Color('#f8e868')
const COLOR_GREEN = new THREE.Color('#88f088')

export default function AmbientParticles() {
  const tier = usePerfTier()
  // Cap how many fireflies actually animate per frame. Geometry stays at MAX
  // so we don't recreate the InstancedMesh on tier change — the extras are
  // pinned at scale 0 once via initFrame below.
  const activeCount = Math.max(20, Math.round(FIREFLY_MAX * tierScale(tier)))

  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  // Reuse a single THREE.Color across the loop so we don't allocate
  // (FIREFLY_MAX × 60fps = 8,400) garbage objects per second.
  const tmpColor = useMemo(() => new THREE.Color(), [])

  // Each firefly has a "home" point and orbits around it with extra Brownian noise,
  // so the swarm fills the whole visible volume and roams freely.
  const particleData = useMemo(() => {
    const data: Array<{
      baseX: number
      baseY: number
      baseZ: number
      orbitRadius: number
      orbitSpeed: number
      orbitPhase: number
      orbitTiltY: number
      orbitTiltZ: number
      noisePhaseX: number
      noisePhaseY: number
      noisePhaseZ: number
      noiseSpeedX: number
      noiseSpeedY: number
      noiseSpeedZ: number
      noiseAmpX: number
      noiseAmpY: number
      noiseAmpZ: number
      blinkPhase: number
      blinkSpeed: number
    }> = []

    for (let i = 0; i < FIREFLY_MAX; i++) {
      const angle = Math.random() * Math.PI * 2
      const radius = 1 + Math.random() * 14
      data.push({
        baseX: Math.cos(angle) * radius,
        baseY: -1 + Math.random() * 9,
        baseZ: -10 + Math.sin(angle) * radius * 0.8 + Math.random() * 8,
        orbitRadius: 0.8 + Math.random() * 2.5,
        orbitSpeed: 0.15 + Math.random() * 0.35,
        orbitPhase: Math.random() * Math.PI * 2,
        orbitTiltY: (Math.random() - 0.5) * 1.5,
        orbitTiltZ: (Math.random() - 0.5) * 1.5,
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
    const colorArray = new Float32Array(FIREFLY_MAX * 3)
    for (let i = 0; i < FIREFLY_MAX; i++) {
      const t = Math.random()
      const c = COLOR_WARM.clone().lerp(COLOR_GREEN, t)
      colorArray[i * 3] = c.r
      colorArray[i * 3 + 1] = c.g
      colorArray[i * 3 + 2] = c.b
    }
    return colorArray
  }, [])

  // Hide the inactive tail (instances above activeCount) by zeroing their
  // matrix. Runs every render when activeCount changes — cheap.
  const lastActiveRef = useRef(-1)

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    const elapsed = clock.getElapsedTime()
    const mesh = meshRef.current

    // Re-zero any newly-inactive instances when the tier drops
    if (lastActiveRef.current !== activeCount) {
      if (activeCount < lastActiveRef.current || lastActiveRef.current < 0) {
        dummy.scale.set(0, 0, 0)
        dummy.position.set(0, -1000, 0)
        dummy.updateMatrix()
        for (let i = activeCount; i < FIREFLY_MAX; i++) {
          mesh.setMatrixAt(i, dummy.matrix)
        }
        mesh.instanceMatrix.needsUpdate = true
      }
      lastActiveRef.current = activeCount
    }

    for (let i = 0; i < activeCount; i++) {
      const p = particleData[i]

      const orbitT = elapsed * p.orbitSpeed + p.orbitPhase
      const ox = Math.cos(orbitT) * p.orbitRadius
      const oz = Math.sin(orbitT) * p.orbitRadius
      const oy = Math.sin(orbitT * 0.7) * p.orbitRadius * 0.5

      const nx = Math.sin(elapsed * p.noiseSpeedX + p.noisePhaseX) * p.noiseAmpX
      const ny = Math.cos(elapsed * p.noiseSpeedY + p.noisePhaseY) * p.noiseAmpY
      const nz = Math.sin(elapsed * p.noiseSpeedZ + p.noisePhaseZ) * p.noiseAmpZ

      dummy.position.set(
        p.baseX + ox + p.orbitTiltY * oy + nx,
        p.baseY + oy + p.orbitTiltZ * ox * 0.3 + ny,
        p.baseZ + oz + nz,
      )

      const blink = (Math.sin(elapsed * p.blinkSpeed + p.blinkPhase) + 1) * 0.5
      const scale = 0.045 + blink * 0.045
      dummy.scale.set(scale, scale, scale)

      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)

      // Reuse the shared Color instance — no allocation per particle.
      const ci = i * 3
      tmpColor.setRGB(
        colors[ci]     * (0.6 + blink * 0.4),
        colors[ci + 1] * (0.6 + blink * 0.4),
        colors[ci + 2] * (0.5 + blink * 0.5),
      )
      mesh.setColorAt(i, tmpColor)
    }

    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  })

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, FIREFLY_MAX]}
      frustumCulled={false}
      raycast={noRaycast}
    >
      <sphereGeometry args={[1, 6, 6]} />
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
