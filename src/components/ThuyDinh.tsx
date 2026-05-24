import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, useAnimations } from '@react-three/drei'
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js'

import * as THREE from 'three'

// === Tier 1 (hero) — preload immediately so the central pavilion is the first
// heavy asset on the wire. Loads in parallel with code chunks.
const CUNG_DINH_URL = '/cung-dinh.glb'
useGLTF.preload(CUNG_DINH_URL, true, true)

// === Tier 2 (background/side dressing) — DO NOT call preload here.
// These start downloading only after the DelayedLoader fires (see below),
// giving the hero scene + bg-video bandwidth headroom on slow connections.
const BUC_URL = '/buc-nhac-cong.glb'
const MUSICIAN_URL = '/musician.glb'

// Tier 2 GLBs start downloading this many ms after first render.
const TIER2_DELAY_MS = 2000

/**
 * Mounts its children after `delay` ms. While waiting, returns null so any
 * `useGLTF` inside them never fires its fetch. Lets us defer Tier 2 GLB
 * downloads without changing their component code.
 */
function DelayedMount({ delay, children }: { delay: number; children: React.ReactNode }) {
  const [show, setShow] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined') { setShow(true); return }
    // Use requestIdleCallback when available — even more deferential
    const ric = (window as any).requestIdleCallback ?? ((cb: any) => setTimeout(cb, delay))
    const cic = (window as any).cancelIdleCallback ?? clearTimeout
    const id = ric(() => setShow(true), { timeout: delay + 1000 })
    const fallback = setTimeout(() => setShow(true), delay)
    return () => { cic(id); clearTimeout(fallback) }
  }, [delay])
  return show ? <>{children}</> : null
}

const LERP_SPEEDS = [0.025, 0.03, 0.035, 0.028]
const PLATFORM_WIDTH = 1.2

/**
 * Vietnamese water puppet theater stage (Thủy Đình) — Thăng Long style.
 * Pink/magenta tiled roofs, gray stone pillars, red dragon panels,
 * salmon-pink side platforms with green fringe, blue backdrop curtains.
 */
export default function ThuyDinh() {
  // Roof tiles — terracotta red/orange like reference
  const roofTileMat = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 256; canvas.height = 256
    const ctx = canvas.getContext('2d')!
    // Base terracotta
    ctx.fillStyle = '#c05028'
    ctx.fillRect(0, 0, 256, 256)
    // Tile rows
    for (let row = 0; row < 16; row++) {
      const y = row * 16
      const offset = row % 2 === 0 ? 0 : 16
      ctx.fillStyle = row % 2 === 0 ? '#b84820' : '#c85830'
      for (let col = 0; col < 9; col++) {
        const x = col * 32 + offset
        // Tile shape — rounded bottom
        ctx.beginPath()
        ctx.moveTo(x + 2, y + 1)
        ctx.lineTo(x + 30, y + 1)
        ctx.lineTo(x + 28, y + 14)
        ctx.quadraticCurveTo(x + 16, y + 17, x + 4, y + 14)
        ctx.closePath()
        ctx.fill()
        // Highlight
        ctx.fillStyle = '#d86838'
        ctx.fillRect(x + 4, y + 2, 24, 3)
        ctx.fillStyle = row % 2 === 0 ? '#b84820' : '#c85830'
      }
      // Row shadow line
      ctx.fillStyle = '#903818'
      ctx.fillRect(0, y + 14, 256, 2)
    }
    const tex = new THREE.CanvasTexture(canvas)
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(4, 3)
    return new THREE.MeshStandardMaterial({
      map: tex, roughness: 0.6, emissive: '#803020', emissiveIntensity: 0.15,
    })
  }, [])
  const roofTileDark = useMemo(() => mat('#a04020', 0.55, '#803018', 0.2), [])
  const roofRidge = useMemo(() => mat('#d08030', 0.4, '#b06820', 0.3), [])

  // Gray stone — weathered look like reference
  const stoneGray = useMemo(() => mat('#889098', 0.6, '#687880', 0.1), [])
  const stoneDark = useMemo(() => mat('#687078', 0.65, '#586068', 0.08), [])
  const stoneBase = useMemo(() => mat('#788088', 0.6, '#607078', 0.08), [])

  // Red panels with gold trim — brighter
  const redPanel = useMemo(() => mat('#d04848', 0.45, '#b03838', 0.3), [])
  const redPanelDark = useMemo(() => mat('#b84040', 0.5, '#983030', 0.25), [])
  const gold = useMemo(() => mat('#f0c848', 0.18, '#d0a038', 0.55, 0.75), [])
  const goldDim = useMemo(() => mat('#d8b040', 0.25, '#b89030', 0.4, 0.6), [])

  // Salmon-pink side walls — significantly brighter
  const salmon = useMemo(() => mat('#d89888', 0.45, '#c08070', 0.25), [])
  const salmonDark = useMemo(() => mat('#c88070', 0.5, '#a86858', 0.2), [])

  // Green fringe — brighter
  const greenFringe = useMemo(() => mat('#2a8a4a', 0.5, '#1a6a38', 0.28), [])
  const greenDark = useMemo(() => mat('#2a7040', 0.55, '#1a5830', 0.22), [])

  // Dark teal/green curtains — like reference
  const curtainBlue = useMemo(() => mat('#c8986a', 0.55, '#a87850', 0.15), [])
  const curtainBlueDark = useMemo(() => mat('#d8a878', 0.5, '#b89060', 0.12), [])

  // Backdrop & wood — lighter
  const backdrop = useMemo(() => mat('#d8c8a8', 0.5, '#b8a888', 0.12), [])
  const wood = useMemo(() => mat('#5a4a30', 0.6, '#3a2a18', 0.12), [])
  const lattice = useMemo(() => mat('#90a0b8', 0.45, '#7888a0', 0.12), [])

  // Flag colors
  const flagRed = useMemo(() => mat('#cc2020', 0.5, '#aa1818', 0.25), [])
  const flagGreen = useMemo(() => mat('#208830', 0.5, '#106820', 0.2), [])
  const flagYellow = useMemo(() => mat('#d8c030', 0.45, '#b0a020', 0.2), [])

  return (
    <group position={[0, -0.4, -4.5]}>
      {/* ===== TIER 1 — CUNG ĐÌNH (hero pavilion, loads first) ===== */}
      <Suspense fallback={null}>
        <CungDinhModel />
      </Suspense>

      {/* ===== TIER 2 — Side platforms + musicians (delayed 2s) ===== */}
      <DelayedMount delay={TIER2_DELAY_MS}>
        {[-1, 1].map((side) => (
          <group key={`wing-${side}`} position={[side * 5, -0.5, 5.3]}>
            <Suspense fallback={null}>
              <BucModel />
            </Suspense>
            <Suspense fallback={null}>
              <MusicianModel side={side as -1 | 1} />
            </Suspense>
          </group>
        ))}
      </DelayedMount>










    </group>
  )
}

function mat(color: string, roughness: number, emissive: string, emissiveIntensity: number, metalness = 0.05) {
  // Handle potentially malformed hex gracefully
  return new THREE.MeshStandardMaterial({ color, roughness, metalness, emissive: emissive.length <= 7 ? emissive : color, emissiveIntensity })
}

function LatticePanel({ position, lattice, frame }: { position: [number, number, number]; lattice: THREE.Material; frame: THREE.Material }) {
  return (
    <group position={position}>
      <mesh material={frame}><boxGeometry args={[0.9, 1.5, 0.025]} /></mesh>
      {[-0.4, -0.15, 0.1, 0.35].map((y, i) => (
        <mesh key={`h${i}`} position={[0, y, 0.015]} material={lattice}><boxGeometry args={[0.75, 0.025, 0.01]} /></mesh>
      ))}
      {[-0.25, 0, 0.25].map((x, i) => (
        <mesh key={`v${i}`} position={[x, 0, 0.015]} material={lattice}><boxGeometry args={[0.025, 1.3, 0.01]} /></mesh>
      ))}
    </group>
  )
}

function WingFringeSide({ x, z, greenFringe }: { x: number; z: number; greenFringe: THREE.Material }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.5 + z * 5) * 0.04
  })
  return (
    <mesh ref={ref} position={[x, -0.15, z]} material={greenFringe}>
      <boxGeometry args={[0.01, 0.22, 0.015]} />
    </mesh>
  )
}

function WingFringe({ x, z, greenFringe }: { x: number; z: number; greenFringe: THREE.Material }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.z = Math.sin(clock.getElapsedTime() * 0.5 + x * 5) * 0.04
  })
  return (
    <mesh ref={ref} position={[x, -0.15, z]} material={greenFringe}>
      <boxGeometry args={[0.015, 0.22, 0.01]} />
    </mesh>
  )
}

/** Musician figure — traditional Vietnamese illustration style with cute round face */
function MusicianV2({ pose, gender, facingAngle, tunicColor, pantsColor, headwear, armsOut, index = 0, instrument = 'none' }: {
  pose: 'standing' | 'sitting'
  gender: 'male' | 'female'
  facingAngle: number
  tunicColor: string
  pantsColor: string
  headwear: 'khan' | 'bun' | 'pink-wrap' | 'none'
  armsOut?: boolean
  index?: number
  instrument?: 'none' | 'danNghiet' | 'danNhi' | 'saoTruoc' | 'danTyBa' | 'silk'
}) {
  const isFemale = gender === 'female'
  const isStanding = pose === 'standing'
  const skinColor = '#ecd8b8'
  const hairColor = '#1a1018'
  // Musicians stand still at the center of their assigned spot on the bục — no auto sway/movement.

  return (
    <group rotation={[0, facingAngle, 0]}>
      {/* === HEAD — round cute face with closed happy eyes === */}
      <mesh position={[0, isStanding ? 0.54 : 0.52, 0]}>
        <sphereGeometry args={[0.075, 32, 24]} />
        <meshStandardMaterial color={skinColor} roughness={0.5} emissive="#c8b090" emissiveIntensity={0.1} />
      </mesh>
      {/* Hair back shell */}
      <mesh position={[0, isStanding ? 0.56 : 0.54, -0.02]}>
        <sphereGeometry args={[0.078, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.65]} />
        <meshStandardMaterial color={hairColor} roughness={0.7} />
      </mesh>
      {/* Bangs/fringe */}
      <mesh position={[0, isStanding ? 0.59 : 0.57, 0.04]}>
        <boxGeometry args={[0.12, 0.025, 0.04]} />
        <meshStandardMaterial color={hairColor} roughness={0.7} />
      </mesh>
      {/* Closed happy eyes — curved lines ^_^ */}
      {[-0.025, 0.025].map((x, i) => (
        <mesh key={`eye-${i}`} position={[x, isStanding ? 0.545 : 0.525, 0.07]}>
          <boxGeometry args={[0.02, 0.006, 0.003]} />
          <meshBasicMaterial color="#2a1808" />
        </mesh>
      ))}
      {/* Rosy cheeks */}
      {[-0.04, 0.04].map((x, i) => (
        <mesh key={`ck-${i}`} position={[x, isStanding ? 0.53 : 0.51, 0.065]}>
          <sphereGeometry args={[0.012, 32, 24]} />
          <meshStandardMaterial color="#e09888" roughness={0.6} emissive="#c07868" emissiveIntensity={0.1} />
        </mesh>
      ))}
      {/* Tiny smile */}
      <mesh position={[0, isStanding ? 0.52 : 0.50, 0.072]}>
        <boxGeometry args={[0.02, 0.005, 0.003]} />
        <meshStandardMaterial color="#c06050" roughness={0.5} />
      </mesh>
      {/* Nose dot */}
      <mesh position={[0, isStanding ? 0.54 : 0.52, 0.075]}>
        <sphereGeometry args={[0.006, 32, 24]} />
        <meshStandardMaterial color={skinColor} roughness={0.5} />
      </mesh>

      {/* === HEADWEAR === */}
      {headwear === 'khan' && (
        /* Khăn đóng — dark male turban/headpiece */
        <group position={[0, isStanding ? 0.6 : 0.58, 0]}>
          <mesh><boxGeometry args={[0.13, 0.05, 0.11]} />
            <meshStandardMaterial color="#1a1828" roughness={0.65} /></mesh>
          <mesh position={[0, 0.015, 0.02]}><boxGeometry args={[0.11, 0.035, 0.06]} />
            <meshStandardMaterial color="#222238" roughness={0.6} /></mesh>
        </group>
      )}
      {headwear === 'bun' && (
        /* Hair bun on top */
        <group position={[0, isStanding ? 0.62 : 0.6, -0.01]}>
          <mesh><sphereGeometry args={[0.04, 32, 24]} />
            <meshStandardMaterial color={hairColor} roughness={0.7} /></mesh>
          {/* Decorative hairpin */}
          <mesh position={[0.02, 0.02, 0.01]}><boxGeometry args={[0.05, 0.006, 0.006]} />
            <meshStandardMaterial color="#d4a540" roughness={0.3} metalness={0.6} /></mesh>
        </group>
      )}
      {headwear === 'pink-wrap' && (
        /* Pink headwrap/khăn */
        <group position={[0, isStanding ? 0.58 : 0.56, 0]}>
          <mesh><sphereGeometry args={[0.082, 32, 24]} />
            <meshStandardMaterial color="#e8889a" roughness={0.55} emissive="#c07080" emissiveIntensity={0.1} /></mesh>
          {/* Wrap tail hanging */}
          <mesh position={[0.04, -0.04, -0.05]} rotation={[0.3, 0, 0.3]}>
            <boxGeometry args={[0.03, 0.1, 0.015]} />
            <meshStandardMaterial color="#e898a8" roughness={0.5} /></mesh>
        </group>
      )}

      {/* === BODY === */}
      {/* Upper body / áo */}
      <mesh position={[0, isStanding ? 0.32 : 0.30, 0]}>
        <boxGeometry args={[0.17, isStanding ? 0.3 : 0.28, 0.11]} />
        <meshStandardMaterial color={tunicColor} roughness={0.6} emissive={tunicColor} emissiveIntensity={0.06} />
      </mesh>
      {/* Collar V-neck */}
      <mesh position={[0, isStanding ? 0.44 : 0.42, 0.05]}>
        <boxGeometry args={[0.06, 0.06, 0.02]} />
        <meshStandardMaterial color={skinColor} roughness={0.5} />
      </mesh>
      {/* Belt/sash */}
      <mesh position={[0, isStanding ? 0.19 : 0.18, 0]}>
        <boxGeometry args={[0.18, 0.02, 0.12]} />
        <meshStandardMaterial color="#4a3a2a" roughness={0.5} />
      </mesh>

      {/* === LOWER BODY === */}
      {isStanding ? (
        /* Standing legs */
        <>
          <mesh position={[-0.04, 0.06, 0]}>
            <boxGeometry args={[0.07, 0.22, 0.08]} />
            <meshStandardMaterial color={pantsColor} roughness={0.65} />
          </mesh>
          <mesh position={[0.04, 0.06, 0]}>
            <boxGeometry args={[0.07, 0.22, 0.08]} />
            <meshStandardMaterial color={pantsColor} roughness={0.65} />
          </mesh>
          {/* Feet */}
          {[-0.04, 0.04].map((x, i) => (
            <mesh key={`ft-${i}`} position={[x, -0.05, 0.02]}>
              <boxGeometry args={[0.06, 0.02, 0.07]} />
              <meshStandardMaterial color="#2a2018" roughness={0.7} />
            </mesh>
          ))}
        </>
      ) : (
        /* Sitting — crossed/folded legs */
        <>
          <mesh position={[-0.04, 0.07, 0.02]}>
            <boxGeometry args={[0.07, 0.1, 0.1]} />
            <meshStandardMaterial color={pantsColor} roughness={0.7} />
          </mesh>
          <mesh position={[0.04, 0.07, 0.02]}>
            <boxGeometry args={[0.07, 0.1, 0.1]} />
            <meshStandardMaterial color={pantsColor} roughness={0.7} />
          </mesh>
          {/* Stool */}
          <mesh position={[0, -0.02, 0]}>
            <boxGeometry args={[0.18, 0.05, 0.16]} />
            <meshStandardMaterial color="#6a2020" roughness={0.6} emissive="#4a1010" emissiveIntensity={0.1} />
          </mesh>
        </>
      )}

      {/* === ARMS === */}
      {armsOut ? (
        /* Arms outstretched — singing/conducting pose */
        <>
          <mesh position={[-0.14, 0.35, 0.04]} rotation={[0.2, 0, -0.8]}>
            <capsuleGeometry args={[0.025, 0.14, 12, 24]} />
            <meshStandardMaterial color={tunicColor} roughness={0.6} emissive={tunicColor} emissiveIntensity={0.06} />
          </mesh>
          <mesh position={[0.14, 0.35, 0.04]} rotation={[0.2, 0, 0.8]}>
            <capsuleGeometry args={[0.025, 0.14, 12, 24]} />
            <meshStandardMaterial color={tunicColor} roughness={0.6} emissive={tunicColor} emissiveIntensity={0.06} />
          </mesh>
          {/* Hands */}
          <mesh position={[-0.24, 0.26, 0.06]}>
            <sphereGeometry args={[0.02, 32, 24]} />
            <meshStandardMaterial color={skinColor} roughness={0.5} />
          </mesh>
          <mesh position={[0.24, 0.26, 0.06]}>
            <sphereGeometry args={[0.02, 32, 24]} />
            <meshStandardMaterial color={skinColor} roughness={0.5} />
          </mesh>
        </>
      ) : (
        /* Normal arms — holding instrument */
        <>
          {/* Left arm */}
          <group position={[-0.11, 0.33, 0.04]} rotation={[0.3, 0, -0.35]}>
            <mesh>
              <capsuleGeometry args={[0.025, 0.14, 12, 24]} />
              <meshStandardMaterial color={tunicColor} roughness={0.6} emissive={tunicColor} emissiveIntensity={0.06} />
            </mesh>
            {/* Left hand */}
            <mesh position={[-0.06, -0.1, 0.04]}>
              <sphereGeometry args={[0.02, 32, 24]} />
              <meshStandardMaterial color={skinColor} roughness={0.5} />
            </mesh>
          </group>
          {/* Right arm with instrument */}
          <group position={[0.11, 0.33, 0.04]} rotation={[0.3, 0, 0.35]}>
            <mesh>
              <capsuleGeometry args={[0.025, 0.14, 12, 24]} />
              <meshStandardMaterial color={tunicColor} roughness={0.6} emissive={tunicColor} emissiveIntensity={0.06} />
            </mesh>
            {/* Right hand */}
            <mesh position={[0.06, -0.1, 0.04]}>
              <sphereGeometry args={[0.02, 32, 24]} />
              <meshStandardMaterial color={skinColor} roughness={0.5} />
            </mesh>
            {/* INSTRUMENTS in right hand */}
            {instrument === 'danNghiet' && (
              /* Đàn nguyệt — moon lute held in hand */
              <group position={[0.08, -0.12, 0.06]} rotation={[0.3, 0, 0.8]}>
                <mesh><cylinderGeometry args={[0.1, 0.1, 0.035, 24]} />
                  <meshStandardMaterial color="#8a5a28" roughness={0.45} emissive="#5a3818" emissiveIntensity={0.15} /></mesh>
                <mesh position={[0, 0, 0]}><cylinderGeometry args={[0.085, 0.085, 0.02, 24]} />
                  <meshStandardMaterial color="#d4a840" roughness={0.35} metalness={0.3} /></mesh>
                <mesh position={[0, 0.28, 0]}><boxGeometry args={[0.04, 0.38, 0.02]} />
                  <meshStandardMaterial color="#5a3018" roughness={0.5} /></mesh>
                <mesh position={[0, 0.5, 0]}><boxGeometry args={[0.06, 0.06, 0.02]} />
                  <meshStandardMaterial color="#4a2810" roughness={0.5} /></mesh>
                {[-0.03, 0.03].map((x, i) => (
                  <mesh key={`peg-${i}`} position={[x, 0.48, 0.015]}><boxGeometry args={[0.008, 0.04, 0.008]} />
                    <meshStandardMaterial color="#3a2010" roughness={0.6} /></mesh>
                ))}
                {[-0.008, 0.008].map((x, i) => (
                  <mesh key={`str-${i}`} position={[x, 0.16, 0.02]}><boxGeometry args={[0.002, 0.5, 0.002]} />
                    <meshStandardMaterial color="#c8c8c8" roughness={0.3} metalness={0.7} /></mesh>
                ))}
              </group>
            )}
            {instrument === 'danNhi' && (
              /* Đàn nhị — two-string fiddle */
              <group position={[0.05, -0.14, 0.08]} rotation={[0.5, 0.3, 0.2]}>
                <mesh><cylinderGeometry args={[0.05, 0.04, 0.1, 12]} />
                  <meshStandardMaterial color="#6a3a18" roughness={0.5} emissive="#4a2810" emissiveIntensity={0.12} /></mesh>
                <mesh position={[0, 0.3, 0]}><cylinderGeometry args={[0.012, 0.012, 0.52, 32]} />
                  <meshStandardMaterial color="#5a3018" roughness={0.5} /></mesh>
                <mesh position={[0, 0.58, 0]}><sphereGeometry args={[0.025, 32, 24]} />
                  <meshStandardMaterial color="#4a2810" roughness={0.5} /></mesh>
                <mesh position={[0.08, 0.2, 0]} rotation={[0, 0, 0.2]}><cylinderGeometry args={[0.003, 0.003, 0.4, 6]} />
                  <meshStandardMaterial color="#5a3818" roughness={0.5} /></mesh>
              </group>
            )}
            {instrument === 'saoTruoc' && (
              /* Sáo trúc — bamboo flute */
              <mesh position={[0.04, -0.08, 0.1]} rotation={[0.4, Math.PI / 2, 0.2]}>
                <cylinderGeometry args={[0.012, 0.012, 0.35, 32]} />
                <meshStandardMaterial color="#b8a050" roughness={0.4} emissive="#887830" emissiveIntensity={0.15} />
              </mesh>
            )}
            {instrument === 'danTyBa' && (
              /* Đàn tỳ bà — pipa lute */
              <group position={[0.06, -0.1, 0.06]} rotation={[0.3, 0.2, -0.4]}>
                <mesh scale={[1, 1.3, 0.3]}><sphereGeometry args={[0.1, 32, 24]} />
                  <meshStandardMaterial color="#b07830" roughness={0.4} emissive="#805020" emissiveIntensity={0.15} /></mesh>
                <mesh position={[0, 0.22, 0]}><boxGeometry args={[0.04, 0.22, 0.02]} />
                  <meshStandardMaterial color="#6a4020" roughness={0.5} /></mesh>
                <mesh position={[0, 0.35, 0]}><boxGeometry args={[0.05, 0.05, 0.015]} />
                  <meshStandardMaterial color="#4a2810" roughness={0.5} /></mesh>
                {[-0.01, 0.01].map((x, i) => (
                  <mesh key={`pstr-${i}`} position={[x, 0.1, 0.018]}><boxGeometry args={[0.002, 0.4, 0.002]} />
                    <meshStandardMaterial color="#c8c8c8" roughness={0.3} metalness={0.7} /></mesh>
                ))}
              </group>
            )}
            {instrument === 'silk' && (
              /* Silk ribbon */
              <>
                <mesh position={[0.04, -0.1, 0.08]} rotation={[0.2, 0.2, -0.5]}>
                  <boxGeometry args={[0.04, 0.3, 0.008]} />
                  <meshStandardMaterial color="#e8889a" roughness={0.5} emissive="#c06878" emissiveIntensity={0.15} side={THREE.DoubleSide} />
                </mesh>
                <mesh position={[0.06, -0.14, 0.1]} rotation={[0.3, 0.2, -0.8]}>
                  <boxGeometry args={[0.035, 0.2, 0.006]} />
                  <meshStandardMaterial color="#e898a8" roughness={0.5} emissive="#c07888" emissiveIntensity={0.12} side={THREE.DoubleSide} />
                </mesh>
              </>
            )}
          </group>
        </>
      )}
    </group>
  )
}

function Tassel({ x }: { x: number }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.z = Math.sin(clock.getElapsedTime() * 0.7 + x * 3) * 0.05
  })
  return (
    <mesh ref={ref} position={[x, -0.38, 0]}>
      <boxGeometry args={[0.012, 0.25, 0.008]} />
      <meshStandardMaterial color="#c8a030" roughness={0.35} metalness={0.65} emissive="#7a5818" emissiveIntensity={0.3} />
    </mesh>
  )
}

/**
 * Loads the Meshy AI pagoda GLB and places it where the procedural cung đình used to be:
 * wrapper transform `position={[0, -0.6, 0.5]}` and `scale={[1.3, 1, 1]}`, matching the
 * original inner cung-đình group. Uniform fit.scale matches old height (~6.05 units).
 */
function CungDinhModel() {
  const { scene } = useGLTF(CUNG_DINH_URL, true, true) as unknown as { scene: THREE.Group }

  const model = useMemo(() => {
    const c = scene.clone(true)
    c.traverse((obj) => {
      const m = obj as THREE.Mesh
      if (m.isMesh) { m.castShadow = true; m.receiveShadow = true }
    })
    return c
  }, [scene])

  const fit = useMemo(() => {
    const bbox = new THREE.Box3().setFromObject(model)
    const size = bbox.getSize(new THREE.Vector3())
    const center = bbox.getCenter(new THREE.Vector3())
    const TARGET_H = 4.5 // shrunk from 6.05 so the cung-đình takes less stage room
    const scale = TARGET_H / size.y
    return {
      offset: [-center.x, -bbox.min.y, -center.z] as [number, number, number],
      scale,
    }
  }, [model])

  return (
    <group position={[0, -0.2, 1.4]} scale={[fit.scale * 1.3, fit.scale, fit.scale]}>
      <primitive object={model} position={fit.offset} />
    </group>
  )
}

/**
 * Loads the Meshy "Red Lacquer Dragon Panel" GLB and places it as the side
 * platform (wing) without distortion. The model is naturally wide along X
 * (~4.14) and thin along Z (~1.17), so we rotate it 90° about Y to align its
 * long edge with the platform depth (Z), then scale UNIFORMLY so its height
 * lands at 1.22 — the top surface where the musicians stand (local y ≈ 1.25).
 */
const BUC_TARGET_H = 1.22 // matches old platform top surface height

function BucModel() {
  const { scene } = useGLTF(BUC_URL, true, true) as unknown as { scene: THREE.Group }

  const model = useMemo(() => {
    const c = scene.clone(true)
    c.traverse((obj) => {
      const m = obj as THREE.Mesh
      if (m.isMesh) { m.castShadow = true; m.receiveShadow = true }
    })
    return c
  }, [scene])

  const fit = useMemo(() => {
    const bbox = new THREE.Box3().setFromObject(model)
    const size = bbox.getSize(new THREE.Vector3())
    const center = bbox.getCenter(new THREE.Vector3())
    // Uniform scale (no stretching) — height drives it so the deck sits at 1.22.
    const scale = BUC_TARGET_H / size.y
    return {
      offset: [-center.x, -bbox.min.y, -center.z] as [number, number, number],
      scale,
    }
  }, [model])

  return (
    <group rotation={[0, Math.PI / 2, 0]} scale={fit.scale}>
      <primitive object={model} position={fit.offset} />
    </group>
  )
}

/**
 * Whole musician ensemble per side (Meshy GLB "Melodies Under the Pavilion").
 * Replaces the old 4 primitive musicians. The model is wide along X (~2.0) so we
 * rotate 90° about Y to run the row along the platform depth (Z) and face it
 * inward toward the stage. Grounded + uniformly scaled to MUSICIAN_TARGET_H,
 * placed at the same spot the old musician group occupied (wing y ≈ 1.0).
 */
const MUSICIAN_TARGET_H = 1.2

function MusicianModel({ side }: { side: -1 | 1 }) {
  const { scene, animations } = useGLTF(MUSICIAN_URL, true, true) as unknown as {
    scene: THREE.Group
    animations: THREE.AnimationClip[]
  }

  // Use SkeletonUtils.clone so skinned meshes (musicians) keep their rig when
  // we render the model twice (once per side) — vanilla clone() breaks skinning.
  const model = useMemo(() => {
    const c = SkeletonUtils.clone(scene) as THREE.Group
    c.traverse((obj) => {
      const m = obj as THREE.Mesh
      if (m.isMesh) { m.castShadow = true; m.receiveShadow = true }
    })
    return c
  }, [scene])

  const fit = useMemo(() => {
    const bbox = new THREE.Box3().setFromObject(model)
    const size = bbox.getSize(new THREE.Vector3())
    const center = bbox.getCenter(new THREE.Vector3())
    const scale = MUSICIAN_TARGET_H / size.y
    return {
      offset: [-center.x, -bbox.min.y, -center.z] as [number, number, number],
      scale,
    }
  }, [model])

  // Play any animation clips embedded in the GLB (musicians playing instruments).
  const { actions, mixer } = useAnimations(animations, model)
  useEffect(() => {
    const clip = Object.values(actions)[0]
    if (!clip) return
    // Different starting offset per side so left/right musicians don't move in sync
    clip.reset()
    clip.timeScale = 1
    clip.time = side === -1 ? 0 : Math.max(clip.getClip().duration * 0.45, 0)
    clip.play()
    return () => { clip.stop() }
  }, [actions, side])

  // Two distinct gentle motion styles — both soft, but visually different so
  // the two musician groups don't look like mirror copies of each other.
  //   Left  → pendulum: slow side-to-side rocking (like keeping a quiet beat)
  //   Right → bow & breathe: gentle forward nod with a soft chest breath
  const groupRef = useRef<THREE.Group>(null)
  const baseY = 1.0
  const baseYaw = side === -1 ? Math.PI / 2 : -Math.PI / 2

  useFrame(({ clock }) => {
    const g = groupRef.current
    if (!g) return
    const t = clock.getElapsedTime()

    if (side === -1) {
      // ===== LEFT — pendulum rocking (~+30% amplitude) =====
      const rock = Math.sin(t * 0.7)
      g.rotation.z = rock * 0.046                  // ±2.6°, the dominant motion
      g.position.y = baseY + Math.abs(rock) * 0.016 // slight rise at extremes
      // Tiny counter forward-back, much smaller
      g.rotation.x = Math.sin(t * 0.45) * 0.010    // ±0.6°
      // Head follows the rock direction (like balancing)
      g.rotation.y = baseYaw + rock * 0.033         // ±1.9°
      g.scale.setScalar(fit.scale)                  // no scale pulse
    } else {
      // ===== RIGHT — slow bow & breathe (~+30% amplitude) =====
      const breath = (Math.sin(t * 0.55) + 1) * 0.5  // 0..1, ~11s period
      g.rotation.x = breath * 0.065 - 0.013          // 0..+3°, mostly forward
      // Chest rises and falls with the breath
      g.position.y = baseY + Math.sin(t * 0.55) * 0.032 // ±3.2 cm
      // Very tiny sway to break stiffness
      g.rotation.z = Math.sin(t * 0.35 + 1.2) * 0.016   // ±0.9°
      // Head stays nearly fixed
      g.rotation.y = baseYaw + Math.sin(t * 0.4) * 0.010 // ±0.6°
      // Subtle breathing scale on the bow
      g.scale.setScalar(fit.scale * (1 + breath * 0.016))
    }

    // Keep mixer fed even if useFrame inside useAnimations isn't (defensive)
    if (mixer && !Object.keys(actions).length) mixer.update(0)
  })

  // Face inward: side -1 (left) → +X, side 1 (right) → -X. This rotation also
  // aligns the model's wide X-axis with the platform depth (Z).
  const rotY = side === -1 ? Math.PI / 2 : -Math.PI / 2

  return (
    <group ref={groupRef} position={[0, 1.0, 0]} rotation={[0, rotY, 0]} scale={fit.scale}>
      <primitive object={model} position={fit.offset} />
    </group>
  )
}
