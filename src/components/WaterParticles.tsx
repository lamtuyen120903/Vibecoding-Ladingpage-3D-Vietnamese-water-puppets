import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { ActId, StagePhase } from '../App'
import { usePerfTier } from './perfTier'
import { noRaycast } from './noRaycast'

const MAX_PARTICLES = 150

// Shader for circular splash sprites with alpha fade
const particleVertexShader = `
  attribute float aSize;
  attribute float aLife;
  attribute vec3 aVelocity;

  uniform float uTime;
  uniform float uDeltaTime;

  varying float vLife;
  varying float vAlpha;

  void main() {
    vLife = aLife;

    vec3 pos = position;

    // Gravity + drag physics in shader
    float gravity = -4.0;
    float drag = 0.98;

    // Simple physics: apply velocity, gravity, drag
    vec3 vel = aVelocity;
    vel.y += gravity * uDeltaTime;
    vel *= drag;
    pos += vel * uDeltaTime;

    // Alpha fades as life decreases
    vAlpha = clamp(aLife * 2.0, 0.0, 1.0) * smoothstep(0.0, 0.2, aLife);

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Size attenuates with distance and life
    gl_PointSize = aSize * (300.0 / -mvPosition.z) * vAlpha;
  }
`

const particleFragmentShader = `
  varying float vLife;
  varying float vAlpha;

  void main() {
    // Circular sprite with soft edge
    vec2 center = gl_PointCoord - 0.5;
    float dist = length(center);
    if (dist > 0.5) discard;

    // Soft circular falloff
    float alpha = smoothstep(0.5, 0.2, dist) * vAlpha;

    // Bright water splash color — teal/white
    vec3 color = mix(vec3(0.35, 0.75, 0.72), vec3(0.9, 0.95, 1.0), vLife * 0.5);

    gl_FragColor = vec4(color, alpha * 0.8);
  }
`

interface WaterParticlesProps {
  currentAct: ActId
  phase: StagePhase
}

export default function WaterParticles({ currentAct, phase }: WaterParticlesProps) {
  const tier = usePerfTier()
  // Throttle emission rate by tier — fewer splash bursts on weak GPUs.
  const emitIntervalScale = tier === 'high' ? 1 : tier === 'medium' ? 1.6 : 2.5
  // Skip the per-frame life-decay loop on low tier 2 out of 3 frames.
  const lowTierSkipMask = tier === 'low' ? 2 : 0
  const frameTickRef = useRef(0)

  const meshRef = useRef<THREE.Points>(null)
  const lastEmitTimeRef = useRef(0)
  const emitIndexRef = useRef(0)
  const prevTimeRef = useRef(0)

  // Particle data buffers — typed arrays for GPU
  const { positions, velocities, lives, sizes } = useMemo(() => {
    const positions = new Float32Array(MAX_PARTICLES * 3)
    const velocities = new Float32Array(MAX_PARTICLES * 3)
    const lives = new Float32Array(MAX_PARTICLES)
    const sizes = new Float32Array(MAX_PARTICLES)

    // Initialize all as dead
    for (let i = 0; i < MAX_PARTICLES; i++) {
      lives[i] = 0
      sizes[i] = 0.08 + Math.random() * 0.06
    }

    return { positions, velocities, lives, sizes }
  }, [])

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('aVelocity', new THREE.BufferAttribute(velocities, 3))
    geo.setAttribute('aLife', new THREE.BufferAttribute(lives, 1))
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
    return geo
  }, [positions, velocities, lives, sizes])

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: particleVertexShader,
      fragmentShader: particleFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uDeltaTime: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  }, [])

  // Emit particles at a position (splash from puppet emergence)
  const emit = (x: number, y: number, z: number) => {
    const count = 8 + Math.floor(Math.random() * 6) // 8-13 particles per burst
    const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute
    const velAttr = geometry.getAttribute('aVelocity') as THREE.BufferAttribute
    const lifeAttr = geometry.getAttribute('aLife') as THREE.BufferAttribute

    for (let i = 0; i < count; i++) {
      const idx = emitIndexRef.current
      const i3 = idx * 3

      // Position at emission point
      positions[i3] = x + (Math.random() - 0.5) * 0.3
      positions[i3 + 1] = y
      positions[i3 + 2] = z + (Math.random() - 0.5) * 0.3

      // Random velocity — mostly upward with spread
      velocities[i3] = (Math.random() - 0.5) * 1.5
      velocities[i3 + 1] = 1.5 + Math.random() * 2.0 // upward burst
      velocities[i3 + 2] = (Math.random() - 0.5) * 1.5

      // Life starts at 1, decrements each frame
      lives[idx] = 1.0

      emitIndexRef.current = (emitIndexRef.current + 1) % MAX_PARTICLES
    }

    posAttr.needsUpdate = true
    velAttr.needsUpdate = true
    lifeAttr.needsUpdate = true
  }

  useFrame(({ clock }) => {
    if (!meshRef.current) return

    // On low tier, only run the per-frame work every Nth frame
    frameTickRef.current += 1
    if (lowTierSkipMask && (frameTickRef.current % (lowTierSkipMask + 1)) !== 0) return

    const elapsed = clock.getElapsedTime()
    const delta = elapsed - prevTimeRef.current
    prevTimeRef.current = elapsed
    const mat = material
    mat.uniforms.uTime.value = elapsed
    mat.uniforms.uDeltaTime.value = delta

    // Decay life for all particles
    const lifeAttr = geometry.getAttribute('aLife') as THREE.BufferAttribute
    let needsUpdate = false
    for (let i = 0; i < MAX_PARTICLES; i++) {
      if (lives[i] > 0) {
        lives[i] -= delta * 1.2 // life decays over ~0.8s
        if (lives[i] < 0) lives[i] = 0
        needsUpdate = true
      }
    }
    if (needsUpdate) lifeAttr.needsUpdate = true

    // Emit particles when puppets emerge from water (tier-throttled).
    const performingInterval = 0.15 * emitIntervalScale
    const openingInterval    = 0.08 * emitIntervalScale

    if (phase === 'performing' && elapsed - lastEmitTimeRef.current > performingInterval) {
      const poolX = (Math.random() - 0.5) * 6
      const poolZ = -1 + (Math.random() - 0.5) * 4
      emit(poolX, -0.5, poolZ)
      lastEmitTimeRef.current = elapsed
    }

    if (phase === 'opening' && elapsed - lastEmitTimeRef.current > openingInterval) {
      const poolX = (Math.random() - 0.5) * 7
      const poolZ = -1 + (Math.random() - 0.5) * 5
      emit(poolX, -0.6, poolZ)
      lastEmitTimeRef.current = elapsed
    }
  })

  return (
    <points
      ref={meshRef}
      geometry={geometry}
      material={material}
      frustumCulled={false}
      raycast={noRaycast}
    />
  )
}
