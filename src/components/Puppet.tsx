import { useRef, useMemo, useState, useCallback, useEffect } from 'react'
import { useFrame, ThreeEvent } from '@react-three/fiber'
import { useGLTF, useAnimations } from '@react-three/drei'
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js'
import * as THREE from 'three'

const MODEL_URL = '/puppet-girl.glb'
useGLTF.preload(MODEL_URL, false, true)

// Stretch the intro choreography (originally 5s) → ~7s for all puppets.
const PERFORM_TIME_SCALE = 1.4
const PERFORM_DURATION_MS = 5000 * PERFORM_TIME_SCALE // 7000 ms

export interface PuppetConfig {
  id: string
  position: [number, number, number]
  skin: string
  outfit: string
  outfitSecondary: string
  headwear: string
  scale: number
  animation: string
  animationSpeed: number
  animationOffset: number
  /** Index within the group — used for staggered entrance */
  groupIndex?: number
  /** Total puppets in the group */
  groupTotal?: number
}

interface Props {
  config: PuppetConfig
  highlighted: boolean
  onClick?: () => void
  onHover?: (hovering: boolean) => void
}

export default function Puppet({ config, highlighted, onClick, onHover }: Props) {
  const groupRef = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)
  const [performing, setPerforming] = useState(false)
  const performStartRef = useRef(0)

  const glow = highlighted || hovered || performing

  // === Load + clone GLB model (skinned mesh requires SkeletonUtils.clone) ===
  const { scene, animations } = useGLTF(MODEL_URL, false, true) as unknown as {
    scene: THREE.Group
    animations: THREE.AnimationClip[]
  }

  const clonedScene = useMemo(() => {
    const c = SkeletonUtils.clone(scene) as THREE.Group
    c.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const m = obj as THREE.Mesh
        m.castShadow = true
        m.receiveShadow = true
      }
    })
    return c
  }, [scene])

  const { actions } = useAnimations(animations, clonedScene)

  // Play the embedded animation (Meshy export contains one clip)
  useEffect(() => {
    const clip = Object.values(actions)[0]
    if (!clip) return
    clip.reset()
    clip.timeScale = config.animationSpeed
    clip.time = (config.animationOffset || 0) % Math.max(clip.getClip().duration, 0.0001)
    clip.play()
    return () => {
      clip.stop()
    }
  }, [actions, config.animationSpeed, config.animationOffset])

  // Speed up animation when puppet is glowing/performing for extra liveliness
  useEffect(() => {
    const clip = Object.values(actions)[0]
    if (!clip) return
    clip.timeScale = config.animationSpeed * (performing ? 1.6 : glow ? 1.2 : 1)
  }, [glow, performing, actions, config.animationSpeed])

  // === Materials — apply glow tint to the model when hovered/highlighted ===
  const baseMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#38883a', roughness: 0.5, emissive: '#286828', emissiveIntensity: 0.18,
  }), [])
  const goldMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#e0b848', roughness: 0.2, metalness: 0.7, emissive: '#b89038', emissiveIntensity: 0.35,
  }), [])
  const rodMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#8a5a30', roughness: 0.6, emissive: '#4a3018', emissiveIntensity: 0.08,
  }), [])

  // Brighten the model's own materials when highlighted by walking the clone tree
  useEffect(() => {
    clonedScene.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (!mesh.isMesh) return
      const apply = (mat: THREE.Material) => {
        const m = mat as THREE.MeshStandardMaterial
        if ((m as any).isMeshStandardMaterial || (m as any).isMeshPhysicalMaterial) {
          if (!(m as any).__origEmissive) {
            (m as any).__origEmissive = m.emissive ? m.emissive.clone() : new THREE.Color(0, 0, 0)
            ;(m as any).__origEmissiveI = m.emissiveIntensity ?? 0
          }
          if (glow) {
            m.emissive = new THREE.Color('#d4a94a')
            m.emissiveIntensity = 0.35
          } else {
            m.emissive = (m as any).__origEmissive.clone()
            m.emissiveIntensity = (m as any).__origEmissiveI
          }
          m.needsUpdate = true
        }
      }
      if (Array.isArray(mesh.material)) mesh.material.forEach(apply)
      else if (mesh.material) apply(mesh.material)
    })
  }, [glow, clonedScene])

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    const elapsed = clock.getElapsedTime()
    const t = elapsed * config.animationSpeed + config.animationOffset
    const g = groupRef.current

    // === PERFORMANCE khi click — màn giới thiệu cho mọi con rối (slowed ×PERFORM_TIME_SCALE) ===
    if (performing) {
      if (performStartRef.current < 0) performStartRef.current = elapsed
      // Stretch the original 5s intro choreography to PERFORM_DURATION seconds.
      const ptRaw = elapsed - performStartRef.current
      const pt = ptRaw / PERFORM_TIME_SCALE
      const baseY = config.position[1]
      const baseX = config.position[0]

      if (pt < 1.2) {
        const rise = Math.min(pt / 1.0, 1)
        const eased = rise * rise * (3 - 2 * rise)
        g.position.y = baseY - 0.5 + eased * 0.5
        g.position.x = baseX
        g.rotation.set(0, 0, 0)
        g.rotation.z = Math.sin(pt * 8) * 0.02 * (1 - eased)
      }
      else if (pt < 2.8) {
        const p2 = pt - 1.2
        g.position.x = baseX
        g.rotation.z = 0
        let dip = 0
        if (p2 < 0.3) { dip = (p2 / 0.3) * 0.08 }
        else if (p2 < 0.5) { dip = 0.08 }
        else if (p2 < 0.9) { dip = 0.08 + ((p2 - 0.5) / 0.4) * 0.12 }
        else if (p2 < 1.2) { dip = 0.2 }
        else { const up = Math.min((p2 - 1.2) / 0.4, 1); dip = 0.2 * (1 - up * up) }
        g.position.y = baseY - dip
        g.rotation.x = dip * 1.2
      }
      else if (pt < 3.8) {
        const p3 = pt - 2.8
        g.position.x = baseX; g.position.y = baseY; g.rotation.x = 0
        if (p3 < 0.2) { g.rotation.y = -(p3 / 0.2) * 0.26 }
        else if (p3 < 0.4) { g.rotation.y = -0.26 }
        else if (p3 < 0.6) { g.rotation.y = -0.26 + ((p3 - 0.4) / 0.2) * 0.52 }
        else if (p3 < 0.8) { g.rotation.y = 0.26 }
        else { g.rotation.y = 0.26 * (1 - Math.min((p3 - 0.8) / 0.2, 1)) }
      }
      else if (pt < 4.6) {
        const p4 = pt - 3.8
        g.position.x = baseX; g.position.y = baseY; g.rotation.set(0, 0, 0)
        g.rotation.z = Math.sin(p4 * 20) * 0.08
      }
      else {
        const p5 = pt - 4.6
        g.position.x = baseX
        g.position.y = baseY + Math.sin(p5 * 3) * 0.015
        g.rotation.x = 0
        g.rotation.y = Math.sin(p5 * 1.5) * 0.04
        g.rotation.z = Math.sin(p5 * 2) * 0.015
      }

      const performScale = config.scale * 1.15
      g.scale.lerp(new THREE.Vector3(performScale, performScale, performScale), 0.08)
      return
    }

    // === NORMAL IDLE — water bob + gentle sway (model has its own arm animation) ===
    const anim = config.animation
    g.position.y = config.position[1] + Math.sin(t * 0.6) * 0.03

    if (anim === 'idle') {
      g.rotation.y = Math.sin(t * 0.3) * 0.1
      g.rotation.z = Math.sin(t * 0.4) * 0.03
    } else if (anim === 'bow') {
      const bowCycle = (Math.sin(t * 0.4) + 1) * 0.5
      g.rotation.x = bowCycle * 0.25
      g.rotation.y = Math.sin(t * 0.3) * 0.15
    } else if (anim === 'wave') {
      g.rotation.y = Math.sin(t * 0.4) * 0.15
    } else if (anim === 'dance') {
      g.rotation.y = Math.sin(t * 0.6) * 0.25
      g.rotation.z = Math.sin(t * 0.8) * 0.08
      g.position.x = config.position[0] + Math.sin(t * 0.5) * 0.2
    } else if (anim === 'glow') {
      g.rotation.y = Math.sin(t * 0.3) * 0.2
    }

    const targetScale = glow ? config.scale * 1.15 : config.scale
    g.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1)
  })

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setHovered(true)
    onHover?.(true)
    document.body.style.cursor = 'pointer'
  }

  const handlePointerOut = () => {
    setHovered(false)
    onHover?.(false)
    document.body.style.cursor = 'default'
  }

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    if (performing) return
    setPerforming(true)
    performStartRef.current = -1

    setTimeout(() => {
      setPerforming(false)
      onClick?.()
    }, PERFORM_DURATION_MS)
  }, [performing, onClick])

  return (
    <group
      ref={groupRef}
      position={config.position}
      scale={config.scale}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
      {/* ===== Floating platform/base — kept from original ===== */}
      <mesh position={[0, -0.08, 0]} material={baseMat}>
        <cylinderGeometry args={[0.28, 0.32, 0.1, 32]} />
      </mesh>
      <mesh position={[0, -0.02, 0]} material={goldMat}>
        <cylinderGeometry args={[0.3, 0.3, 0.02, 32]} />
      </mesh>

      {/* ===== Meshy AI Girl model =====
          Place model at platform top, sized to roughly match prior puppet height (~1 unit). */}
      <primitive object={clonedScene} position={[0, 0, 0]} scale={0.65} />

      {/* ===== Control rod into water — kept ===== */}
      <mesh position={[0, -0.25, 0]} material={rodMat}>
        <cylinderGeometry args={[0.012, 0.015, 0.4, 32]} />
      </mesh>

      {/* Highlight glow */}
      {glow && (
        <pointLight position={[0, 0.6, 0.3]} intensity={1.5} color="#d4a94a" distance={3} decay={2} />
      )}
      {config.animation === 'glow' && (
        <pointLight position={[0, 0.5, 0]} intensity={0.5} color="#d4a94a" distance={2} decay={2} />
      )}
    </group>
  )
}
