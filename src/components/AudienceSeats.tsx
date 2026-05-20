import { useMemo } from 'react'
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'

const SEATS_URL = '/seats-row.glb'
useGLTF.preload(SEATS_URL, false, true)

/**
 * Audience seating — 3 dãy ghế dựng từ Meshy GLB "Row of Red Velvet Seats".
 * Model gốc: rộng 2.15 × cao 0.40 × sâu 0.35 (1 dãy ngắn) → scale lên rồi lát
 * nhiều bản cho mỗi hàng để phủ bề ngang khu khán giả.
 *
 * Thông số dễ chỉnh: SEAT_SCALE (độ lớn) · ROW_Y_OFFSET (cao/thấp).
 */
const MODEL_W = 2.15
const SEAT_SCALE = 2.0
const ROW_W = MODEL_W * SEAT_SCALE // bề ngang 1 bản sau scale
const ROW_Y_OFFSET = -0.12 // hạ ghế xuống cho sát bậc

// 3 dãy: z lùi dần ra sau, y cao dần (kiểu khán đài), width = bề ngang mong muốn
const rows = [
  { z: 4.8, y: -0.55, width: 5.85 },
  { z: 5.5, y: -0.38, width: 7.15 },
  { z: 6.2, y: -0.18, width: 8.45 },
]

export default function AudienceSeats() {
  const { scene } = useGLTF(SEATS_URL, false, true) as unknown as { scene: THREE.Group }

  // Tạo sẵn tất cả bản sao ghế (mỗi vị trí cần 1 clone riêng), đã ground + canh giữa
  const placements = useMemo(() => {
    const base = scene.clone(true)
    base.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.isMesh) { m.castShadow = true; m.receiveShadow = true }
    })
    const bbox = new THREE.Box3().setFromObject(base)
    const center = bbox.getCenter(new THREE.Vector3())
    const offset = new THREE.Vector3(-center.x, -bbox.min.y, -center.z) // ground đáy về y=0

    const items: { key: string; obj: THREE.Group; y: number; z: number }[] = []
    rows.forEach((row, ri) => {
      const copies = Math.max(1, Math.round(row.width / ROW_W))
      for (let i = 0; i < copies; i++) {
        const obj = base.clone(true)
        const x = (i - (copies - 1) / 2) * MODEL_W // local (sẽ nhân SEAT_SCALE bởi group)
        obj.position.set(offset.x + x, offset.y, offset.z)
        items.push({ key: `${ri}-${i}`, obj, y: row.y + ROW_Y_OFFSET, z: row.z })
      }
    })
    return items
  }, [scene])

  return (
    <group>
      {/* Sàn tối quanh khu ghế */}
      <mesh position={[0, -0.82, 5.2]} receiveShadow>
        <boxGeometry args={[12, 0.06, 3.5]} />
        <meshStandardMaterial color="#050505" roughness={0.95} emissive="#020202" emissiveIntensity={0.01} />
      </mesh>

      {placements.map((it) => (
        <group key={it.key} position={[0, it.y, it.z]} rotation={[0, Math.PI, 0]} scale={SEAT_SCALE}>
          <primitive object={it.obj} />
        </group>
      ))}

      {/* Đèn vùng khán giả */}
      <pointLight position={[0, 3, 5.5]} intensity={5} color="#ffe8c0" distance={16} decay={1} />
      <pointLight position={[0, 0.5, 5.5]} intensity={1.5} color="#e0d0b0" distance={10} decay={1.3} />
    </group>
  )
}
