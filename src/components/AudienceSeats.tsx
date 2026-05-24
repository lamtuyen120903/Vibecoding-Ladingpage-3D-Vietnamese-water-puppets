import { useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'
import { useGLTF, Instances, Instance, Merged } from '@react-three/drei'

const SEATS_URL = '/seats-row.glb'
useGLTF.preload(SEATS_URL, true, true)

/**
 * Audience seating — 3 dãy ghế dựng từ Meshy GLB "Row of Red Velvet Seats".
 * Model gốc: rộng 2.15 × cao 0.40 × sâu 0.35 (1 dãy ngắn) → scale lên rồi lát
 * nhiều bản cho mỗi hàng để phủ bề ngang khu khán giả.
 *
 * Trước đây: scene.clone(true) cho mỗi bản → N×meshes draw calls.
 * Bây giờ: drei <Merged> gom các unique meshes trong GLB rồi instance lại,
 * mỗi mesh thành 1 draw call duy nhất bất kể số bản (chục cho tới hàng trăm).
 */
const MODEL_W = 2.15
const SEAT_SCALE = 2.0
const ROW_Y_OFFSET = -0.12
// Cap how many seat-row copies each row can have. Lower = less audience
// density and less shadow/JS work. Was implicitly 3-4 per row (~10 total).
const MAX_COPIES_PER_ROW = 2

// width ≈ MODEL_W * SEAT_SCALE * (desired copies). MAX_COPIES_PER_ROW also caps.
// Front row narrower → stadium-style audience (closer to stage = smaller wing-out).
const rows = [
  { z: 4.8, y: -0.55, width: 4.3 },  // ~1 copy (focused front)
  { z: 5.5, y: -0.38, width: 8.6 },  // 2 copies
  { z: 6.2, y: -0.18, width: 8.6 },  // 2 copies
]

interface Placement {
  key: string
  position: [number, number, number]
}

export default function AudienceSeats() {
  const { scene } = useGLTF(SEATS_URL, true, true) as unknown as { scene: THREE.Group }

  // Compute placements (positions of each row-copy) — pure data, no clones.
  // The whole row-copy gets scaled by SEAT_SCALE later, so:
  //   - x-spacing in WORLD space = MODEL_W * SEAT_SCALE (so copies sit edge to edge)
  //   - the horizontal centering offset (in model coords) is applied INSIDE the
  //     scaled wrapper, so it gets scaled with the geometry
  const { placements, groundOffsetY, centerOffsetX } = useMemo(() => {
    const bbox = new THREE.Box3().setFromObject(scene)
    const center = bbox.getCenter(new THREE.Vector3())
    const groundOffsetY = -bbox.min.y // lift so y=0 sits on the floor (model coords)
    const centerOffsetX = -center.x   // model coords; applied inside scale group

    const worldSpacing = MODEL_W * SEAT_SCALE
    const items: Placement[] = []
    rows.forEach((row, ri) => {
      const copies = Math.min(
        MAX_COPIES_PER_ROW,
        Math.max(1, Math.round(row.width / worldSpacing)),
      )
      for (let i = 0; i < copies; i++) {
        const x = (i - (copies - 1) / 2) * worldSpacing
        items.push({
          key: `${ri}-${i}`,
          position: [x, row.y + ROW_Y_OFFSET, row.z],
        })
      }
    })
    return { placements: items, groundOffsetY, centerOffsetX }
  }, [scene])

  // Collect every unique mesh inside the GLB so <Merged> can instance them all.
  // Seats sit in the audience area facing the stage — they barely appear in
  // the main light's shadow frustum and dark velvet hides cast shadow anyway.
  // Disabling cast/receive removes the seats from the shadow pass entirely,
  // which is the biggest single GPU cost in this scene.
  const meshes = useMemo(() => {
    const out: Record<string, THREE.Mesh> = {}
    let idx = 0
    scene.traverse((obj) => {
      const m = obj as THREE.Mesh
      if (m.isMesh) {
        m.castShadow = false
        m.receiveShadow = false
        out[m.name || `m${idx++}`] = m
      }
    })
    return out
  }, [scene])

  return (
    <group>
      {/* Sàn tối quanh khu ghế */}
      <mesh position={[0, -0.82, 5.15]} receiveShadow>
        <boxGeometry args={[8.9, 0.06, 1.3]} />
        <meshStandardMaterial color="#050505" roughness={0.95} emissive="#020202" emissiveIntensity={0.01} />
      </mesh>

      {/* Đèn vùng khán giả — chỉ 2 đèn, không castShadow để tiết kiệm */}
      <pointLight position={[0, 3, 5.5]} intensity={5} color="#ffe8c0" distance={16} decay={1} />
      <pointLight position={[0, 0.5, 5.5]} intensity={1.5} color="#e0d0b0" distance={10} decay={1.3} />

      {/* Instanced seat rows — every mesh inside the GLB becomes ONE draw call
          regardless of how many row copies we render. */}
      <Merged meshes={meshes}>
        {(Instances: Record<string, React.ComponentType<any>>) => (
          <>
            {placements.map((p) => (
              <group
                key={p.key}
                position={p.position}
                rotation={[0, Math.PI, 0]}
                scale={SEAT_SCALE}
              >
                {/* Both offsets are in MODEL coords here (inside the scale
                    wrapper), so the model is centered + grounded properly. */}
                <group position={[centerOffsetX, groundOffsetY, 0]}>
                  {Object.keys(Instances).map((name) => {
                    const Inst = Instances[name]
                    return <Inst key={name} />
                  })}
                </group>
              </group>
            ))}
          </>
        )}
      </Merged>
    </group>
  )
}

// `Instances`/`Instance` re-exports — keeps import order stable even though
// the body uses `Merged` directly above.
void Instances; void Instance
