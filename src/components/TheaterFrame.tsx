import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Theater framing — green tasseled barrier, overhead foliage.
 * Optimized: shared geometries, InstancedMesh for tassels.
 */
export default function TheaterFrame() {
  const greenDark = useMemo(() => mat('#1a5a3a', 0.65, '#0a3a20', 0.15), [])
  const greenFringe = useMemo(() => mat('#1a6a3a', 0.6, '#0a4a28', 0.2), [])
  const goldTrim = useMemo(() => mat('#c8a040', 0.35, '#a08030', 0.3, 0.6), [])
  const numberPlate = useMemo(() => mat('#d8c890', 0.75, '#b0a068', 0.1), [])
  const numSquareMat = useMemo(() => mat('#4a3a20', 0.8, '#2a1a08', 0.1), [])

  // Shared geometries
  const geo = useMemo(() => ({
    numPlate: new THREE.BoxGeometry(0.35, 0.25, 0.02),
    numSquare: new THREE.BoxGeometry(0.15, 0.15, 0.005),
    post: new THREE.BoxGeometry(0.06, 0.4, 0.2),
  }), [])

  return (
    <group>
      {/* ===== GREEN TASSELED BARRIER ===== */}
      <group position={[0, -0.4, 4.3]}>
        <mesh position={[0, -0.15, 0]} material={greenDark}>
          <boxGeometry args={[12, 0.6, 0.15]} />
        </mesh>
        <mesh position={[0, 0.16, 0]} material={goldTrim}>
          <boxGeometry args={[12.1, 0.04, 0.18]} />
        </mesh>
        <mesh position={[0, -0.46, 0]} material={goldTrim}>
          <boxGeometry args={[12.1, 0.03, 0.16]} />
        </mesh>

        {/* Tassels — InstancedMesh (40 → 1 draw call) */}
        <TasselRow count={40} startX={-5.8} spacing={0.145} material={greenFringe} />

        {/* Seat number plates */}
        {Array.from({ length: 20 }).map((_, i) => (
          <group key={`bn-${i}`} position={[-5.2 + i * 0.54, -0.12, 0.09]}>
            <mesh geometry={geo.numPlate} material={numberPlate} />
            <mesh position={[0, 0, 0.012]} geometry={geo.numSquare} material={numSquareMat} />
          </group>
        ))}

        {/* Decorative posts */}
        {[-4.5, -2.25, 0, 2.25, 4.5].map((x, i) => (
          <mesh key={`bp-${i}`} position={[x, 0, 0]} geometry={geo.post} material={goldTrim} />
        ))}
      </group>
    </group>
  )
}

/** InstancedMesh for animated tassels — 40 meshes → 1 draw call */
function TasselRow({ count, startX, spacing, material }: {
  count: number; startX: number; spacing: number; material: THREE.Material
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const geo = useMemo(() => new THREE.BoxGeometry(0.015, 0.2, 0.01), [])
  const dummy = useMemo(() => new THREE.Object3D(), [])

  // Set initial positions
  useMemo(() => {
    if (!meshRef.current) return
    for (let i = 0; i < count; i++) {
      dummy.position.set(startX + i * spacing, -0.55, 0.08)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }
    meshRef.current.instanceMatrix.needsUpdate = true
  }, [meshRef.current])

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    const t = clock.getElapsedTime()
    for (let i = 0; i < count; i++) {
      const x = startX + i * spacing
      dummy.position.set(x, -0.55, 0.08)
      dummy.rotation.set(0, 0, Math.sin(t * 0.5 + x * 4) * 0.04)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return <instancedMesh ref={meshRef} args={[geo, material, count]} />
}

function mat(color: string, roughness: number, emissive: string, emissiveIntensity: number, metalness = 0.05) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness, emissive, emissiveIntensity })
}
