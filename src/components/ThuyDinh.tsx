import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'

import * as THREE from 'three'

const CUNG_DINH_URL = '/cung-dinh.glb'
useGLTF.preload(CUNG_DINH_URL, false, true)

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
      {/* ===== CUNG ĐÌNH — Thăng Long water puppet theater (reference-accurate) ===== */}
      <CungDinhModel />
      {/* ===== SIDE PLATFORMS (wings) — beside the water pool ===== */}
      {[-1, 1].map((side) => (
        <group key={`wing-${side}`} position={[side * 5.2, -0.5, 5.3]}>
          {/* Platform base */}
          <mesh position={[0, 0.6, 0]} material={salmon}>
            <boxGeometry args={[1.5, 1.2, 4.5]} />
          </mesh>
          {/* Top surface */}
          <mesh position={[0, 1.22, 0]} material={salmonDark}>
            <boxGeometry args={[1.6, 0.04, 4.6]} />
          </mesh>
          {/* Front face panel — Vietnamese decorative motifs */}
          <mesh position={[0, 0.6, 2.28]} material={salmon}>
            <boxGeometry args={[1.4, 1, 0.04]} />
          </mesh>
          {/* Red center panel with gold dragon border */}
          <mesh position={[0, 0.6, 2.31]} material={redPanel}>
            <boxGeometry args={[0.9, 0.7, 0.02]} />
          </mesh>
          {/* Gold border frame around red panel */}
          <mesh position={[0, 0.96, 2.32]} material={gold}>
            <boxGeometry args={[0.95, 0.03, 0.015]} />
          </mesh>
          <mesh position={[0, 0.24, 2.32]} material={gold}>
            <boxGeometry args={[0.95, 0.03, 0.015]} />
          </mesh>
          <mesh position={[-0.46, 0.6, 2.32]} material={gold}>
            <boxGeometry args={[0.03, 0.7, 0.015]} />
          </mesh>
          <mesh position={[0.46, 0.6, 2.32]} material={gold}>
            <boxGeometry args={[0.03, 0.7, 0.015]} />
          </mesh>
          {/* Hoa văn chữ Thọ / 壽 pattern — concentric gold squares */}
          <mesh position={[0, 0.6, 2.33]} material={gold}>
            <boxGeometry args={[0.4, 0.4, 0.01]} />
          </mesh>
          <mesh position={[0, 0.6, 2.335]} material={redPanel}>
            <boxGeometry args={[0.3, 0.3, 0.008]} />
          </mesh>
          <mesh position={[0, 0.6, 2.34]} material={gold}>
            <boxGeometry args={[0.18, 0.18, 0.006]} />
          </mesh>
          {/* Corner dragon scrollwork — gold swirls at 4 corners */}
          {[[-0.32, 0.82], [0.32, 0.82], [-0.32, 0.38], [0.32, 0.38]].map(([cx, cy], ci) => (
            <group key={`scroll-${ci}`} position={[cx, cy, 2.33]}>
              <mesh material={gold}><boxGeometry args={[0.12, 0.02, 0.008]} /></mesh>
              <mesh material={gold}><boxGeometry args={[0.02, 0.12, 0.008]} /></mesh>
              <mesh position={[ci < 2 ? 0.04 : -0.04, ci % 2 === 0 ? -0.04 : 0.04, 0]} material={gold}>
                <sphereGeometry args={[0.025, 32, 24]} />
              </mesh>
            </group>
          ))}
          {/* Side decorative panels — lotus petal motifs */}
          {[-0.6, 0.6].map((px, pi) => (
            <group key={`lotus-${pi}`} position={[px, 0.6, 2.32]}>
              {/* Lotus petal shape — layered ovals */}
              <mesh material={gold}><sphereGeometry args={[0.08, 32, 24]} /></mesh>
              <mesh position={[0, 0.08, 0]} material={goldDim} rotation={[0, 0, 0.3]}>
                <boxGeometry args={[0.06, 0.06, 0.008]} />
              </mesh>
              <mesh position={[0, -0.08, 0]} material={goldDim} rotation={[0, 0, -0.3]}>
                <boxGeometry args={[0.06, 0.06, 0.008]} />
              </mesh>
            </group>
          ))}

          {/* Inner face panels (facing water) — salmon with red/gold motifs */}
          <mesh position={[side * -0.76, 0.6, 0]} material={salmon}>
            <boxGeometry args={[0.04, 1, 4.4]} />
          </mesh>
          {/* Red panels with gold trim along inner wall */}
          {[-1.5, -0.5, 0.5, 1.5].map((lz, li) => (
            <group key={`inner-motif-${li}`} position={[side * -0.78, 0.6, lz]}>
              <mesh material={redPanel}><boxGeometry args={[0.02, 0.6, 0.5]} /></mesh>
              <mesh position={[0, 0.32, 0]} material={gold}><boxGeometry args={[0.015, 0.02, 0.55]} /></mesh>
              <mesh position={[0, -0.32, 0]} material={gold}><boxGeometry args={[0.015, 0.02, 0.55]} /></mesh>
              {/* Small gold diamond/hoa văn */}
              <mesh material={gold} rotation={[0, 0, Math.PI / 4]}><boxGeometry args={[0.06, 0.06, 0.015]} /></mesh>
            </group>
          ))}

          {/* Gold trim on top edges */}
          <mesh position={[0, 1.24, 2.3]} material={goldDim}>
            <boxGeometry args={[1.6, 0.04, 0.04]} />
          </mesh>
          <mesh position={[side * -0.77, 1.24, 0]} material={goldDim}>
            <boxGeometry args={[0.04, 0.04, 4.6]} />
          </mesh>

          {/* Railing — inner side (facing water) — dark wood balustrade */}
          {/* Top rail */}
          <mesh position={[side * -0.77, 1.65, 0]} material={wood}>
            <boxGeometry args={[0.06, 0.05, 4.5]} />
          </mesh>
          {/* Bottom rail */}
          <mesh position={[side * -0.77, 1.28, 0]} material={wood}>
            <boxGeometry args={[0.05, 0.04, 4.5]} />
          </mesh>
          {/* Vertical balusters */}
          {Array.from({ length: 28 }).map((_, bi) => (
            <mesh key={`bal-${bi}`} position={[side * -0.77, 1.46, -2.1 + bi * 0.16]} material={wood}>
              <boxGeometry args={[0.02, 0.32, 0.025]} />
            </mesh>
          ))}
          {/* Corner posts */}
          {[-2.2, 2.2].map((rz, ri) => (
            <mesh key={`cpost-${ri}`} position={[side * -0.77, 1.46, rz]} material={wood}>
              <boxGeometry args={[0.05, 0.42, 0.05]} />
            </mesh>
          ))}

          {/* Railing — front face (facing audience) */}
          <mesh position={[0, 1.65, 2.28]} material={wood}>
            <boxGeometry args={[1.55, 0.05, 0.06]} />
          </mesh>
          <mesh position={[0, 1.28, 2.28]} material={wood}>
            <boxGeometry args={[1.5, 0.04, 0.05]} />
          </mesh>
          {Array.from({ length: 10 }).map((_, bi) => (
            <mesh key={`fbal-${bi}`} position={[-0.65 + bi * 0.145, 1.46, 2.28]} material={wood}>
              <boxGeometry args={[0.025, 0.32, 0.02]} />
            </mesh>
          ))}
          {[-0.72, 0.72].map((rx, ri) => (
            <mesh key={`fcpost-${ri}`} position={[rx, 1.46, 2.28]} material={wood}>
              <boxGeometry args={[0.05, 0.42, 0.05]} />
            </mesh>
          ))}

          {/* Musicians on platform — 4 per side, styled like traditional illustration */}
          {side === -1 ? (
            <group position={[0, 1.25, 0]} scale={1.5}>
              {/* 1. Nam — đàn nguyệt (standing, holding lute) */}
              <group position={[0, 0, -1.3]}>
                <MusicianV2 pose="standing" gender="male" facingAngle={Math.PI / 2}
                  tunicColor="#1a1a28" pantsColor="#1a1a28" headwear="khan"
                  index={0} instrument="danNghiet" />
              </group>
              {/* 2. Nam — đàn nhị (sitting) */}
              <group position={[0, 0, -0.4]}>
                <MusicianV2 pose="sitting" gender="male" facingAngle={Math.PI / 2}
                  tunicColor="#1a1a28" pantsColor="#1a1a28" headwear="khan"
                  index={1} instrument="danNhi" />
              </group>
              {/* 3. Nữ — sáo trúc (standing) */}
              <group position={[0, 0, 0.3]}>
                <MusicianV2 pose="standing" gender="female" facingAngle={Math.PI / 2}
                  tunicColor="#e8e0d8" pantsColor="#1a1a28" headwear="bun"
                  index={2} instrument="saoTruoc" />
              </group>
              {/* 4. Nam — ca sĩ/chỉ huy (standing, singing) */}
              <group position={[0, 0, 1]}>
                <MusicianV2 pose="standing" gender="male" facingAngle={Math.PI / 2}
                  tunicColor="#1a2a3a" pantsColor="#1a1a28" headwear="none" armsOut
                  index={3} />
              </group>
            </group>
          ) : (
            <group position={[0, 1.25, 0]} scale={1.5}>
              {/* 1. Nữ — ca sĩ (standing, singing) */}
              <group position={[0, 0, -1.3]}>
                <MusicianV2 pose="standing" gender="female" facingAngle={-Math.PI / 2}
                  tunicColor="#1a1a28" pantsColor="#1a1a28" headwear="bun" armsOut
                  index={4} />
              </group>
              {/* 2. Nam — trống (standing, with drum on tripod) */}
              <group position={[0, 0, -0.4]}>
                <MusicianV2 pose="standing" gender="male" facingAngle={-Math.PI / 2}
                  tunicColor="#1a1a28" pantsColor="#1a1a28" headwear="khan"
                  index={5} />
                {/* Trống — drum on tripod stand */}
                <group position={[-0.2, 0.08, 0]}>
                  <mesh><cylinderGeometry args={[0.07, 0.06, 0.1, 32]} />
                    <meshStandardMaterial color="#5a2a10" roughness={0.5} emissive="#3a1808" emissiveIntensity={0.12} /></mesh>
                  {/* Drum head */}
                  <mesh position={[0, 0.052, 0]}><cylinderGeometry args={[0.072, 0.072, 0.008, 32]} />
                    <meshStandardMaterial color="#d8c898" roughness={0.6} /></mesh>
                  {/* Gold rim */}
                  <mesh position={[0, 0.048, 0]}><cylinderGeometry args={[0.075, 0.075, 0.006, 32]} />
                    <meshStandardMaterial color="#c8a040" roughness={0.3} metalness={0.5} /></mesh>
                  {/* Tripod legs */}
                  {[0, 2.1, 4.2].map((a, i) => (
                    <mesh key={`tleg-${i}`} position={[Math.sin(a) * 0.04, -0.12, Math.cos(a) * 0.04]}
                      rotation={[Math.cos(a) * 0.25, 0, -Math.sin(a) * 0.25]}>
                      <cylinderGeometry args={[0.008, 0.008, 0.2, 6]} />
                      <meshStandardMaterial color="#3a2010" roughness={0.6} />
                    </mesh>
                  ))}
                </group>
                {/* Drum sticks */}
                <group>
                  <mesh position={[-0.22, 0.26, 0.06]} rotation={[0.5, 0, -0.3]}>
                    <cylinderGeometry args={[0.005, 0.005, 0.18, 6]} />
                    <meshStandardMaterial color="#5a3818" roughness={0.5} />
                  </mesh>
                  <mesh position={[-0.18, 0.26, 0.06]} rotation={[0.5, 0, -0.2]}>
                    <cylinderGeometry args={[0.005, 0.005, 0.18, 6]} />
                    <meshStandardMaterial color="#5a3818" roughness={0.5} />
                  </mesh>
                </group>
              </group>
              {/* 3. Nam — đàn tỳ bà (standing) */}
              <group position={[0, 0, 0.3]}>
                <MusicianV2 pose="standing" gender="male" facingAngle={-Math.PI / 2}
                  tunicColor="#1a1a28" pantsColor="#1a1a28" headwear="khan"
                  index={6} instrument="danTyBa" />
              </group>
              {/* 4. Nữ — khăn hồng, cầm dải lụa */}
              <group position={[0, 0, 1]}>
                <MusicianV2 pose="standing" gender="female" facingAngle={-Math.PI / 2}
                  tunicColor="#1a1a28" pantsColor="#1a1a28" headwear="pink-wrap"
                  index={7} instrument="silk" />
              </group>
            </group>
          )}
        </group>
      ))}






      {/* ===== SIDE WALLS with 壽 (thọ) lattice panels ===== */}
      {[-3.2, 3.2].map((x, i) => (
        <group key={`sw-${i}`} position={[x, 1.5, 0.3]}>
          <mesh material={stoneGray}>
            <boxGeometry args={[0.6, 2.8, 1.8]} />
          </mesh>
          <mesh position={[0, 0.2, 0.92]} material={stoneBase}>
            <boxGeometry args={[0.5, 1.8, 0.04]} />
          </mesh>
          <mesh position={[0, 0.2, 0.95]} material={goldDim}>
            <boxGeometry args={[0.55, 1.9, 0.02]} />
          </mesh>
          {[-0.15, 0, 0.15].map((lx, li) => (
            <mesh key={`tv-${li}`} position={[lx, 0.2, 0.97]} material={stoneGray}>
              <boxGeometry args={[0.025, 1.5, 0.01]} />
            </mesh>
          ))}
          {[-0.5, -0.15, 0.2, 0.55].map((ly, li) => (
            <mesh key={`th-${li}`} position={[0, ly, 0.97]} material={stoneGray}>
              <boxGeometry args={[0.4, 0.025, 0.01]} />
            </mesh>
          ))}
          <mesh position={[0, 0.5, 0.97]} material={stoneGray}>
            <boxGeometry args={[0.25, 0.25, 0.01]} />
          </mesh>
          <mesh position={[0, -0.1, 0.97]} material={stoneGray}>
            <boxGeometry args={[0.25, 0.25, 0.01]} />
          </mesh>
        </group>
      ))}




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
  const groupRef = useRef<THREE.Group>(null)
  const seed = useMemo(() => Math.random() * 100, [])

  // Autonomous movement within platform bounds
  const baseXRef = useRef(0)
  const currentXRef = useRef(0)
  const timeOffset = useMemo(() => seed * 0.1, [seed])

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    const t = clock.getElapsedTime() + timeOffset

    // Autonomous smooth movement within platform bounds
    const targetX = Math.sin(t * 0.4 + index * 1.5) * 0.5 * PLATFORM_WIDTH
    currentXRef.current = THREE.MathUtils.lerp(currentXRef.current, targetX, 0.02)
    groupRef.current.position.x = currentXRef.current

    // Body sway — playing music
    groupRef.current.rotation.y = facingAngle + Math.sin(t * 1.6) * 0.1
    groupRef.current.rotation.z = Math.sin(t * 2.4 + 1) * 0.05
    // Head bob
    if (groupRef.current.children[0]) {
      groupRef.current.children[0].position.y = (isStanding ? 0.54 : 0.52) + Math.sin(t * 3) * 0.015
    }
  })

  return (
    <group ref={groupRef} rotation={[0, facingAngle, 0]}>
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
  const { scene } = useGLTF(CUNG_DINH_URL, false, true) as unknown as { scene: THREE.Group }

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
