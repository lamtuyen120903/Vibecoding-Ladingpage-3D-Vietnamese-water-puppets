import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import type { StagePhase } from '../App'

interface CinematicCameraProps {
  phase: StagePhase
}

const WAYPOINTS = {
  opening: new THREE.Vector3(0, 2.8, 10),
  performing: new THREE.Vector3(0, 2.2, 9),
}

// Scene was framed for a 16:9 viewport with a 56° vertical FOV.
const BASE_FOV = 56
const BASE_ASPECT = 16 / 9
const DEG = Math.PI / 180

// Điểm camera ngắm vào — khung hình gốc (hướng vào sân khấu / thủy đình).
const STAGE_FOCUS = new THREE.Vector3(0, 0.5, -1)

export default function CinematicCamera({ phase }: CinematicCameraProps) {
  const controlsRef = useRef<any>(null)
  const { camera, size } = useThree()
  const targetPosition = useRef(new THREE.Vector3(0, 2.2, 9))
  const currentPosition = useRef(new THREE.Vector3(0, 2.2, 9))

  // Responsive framing — "contain" fit: GUARANTEE the whole scene stays in
  // frame at EVERY aspect ratio, so không component 3D nào (sân khấu, rối, ghế
  // khán giả hai bên) bị cắt dù màn hình rộng, hẹp hay dọc.
  //
  // Cảnh được dàn cho khung 16:9 với FOV dọc 56° → suy ra FOV ngang gốc.
  //  • baseVFov     = bề cao cảnh cần thấy (56°).
  //  • vFovForWidth = FOV dọc cần thiết để giữ TRỌN bề ngang cảnh ở tỉ lệ hiện tại.
  // Lấy max() của hai giá trị → FOV luôn đủ lớn để KHÔNG cắt cả trên/dưới lẫn
  // hai bên:
  //  • Màn rộng (ultrawide): baseVFov thắng → giữ nguyên trên/dưới, dư bề ngang.
  //  • Màn hẹp/dọc (điện thoại): vFovForWidth thắng → "lùi tầm nhìn" cho đủ bề
  //    ngang, ghế + rối hai bên vẫn nằm trong khung (rối co lại cho vừa).
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera
    const aspect = size.width / size.height
    const baseHFov = 2 * Math.atan(Math.tan((BASE_FOV * DEG) / 2) * BASE_ASPECT)
    const vFovForWidth = 2 * Math.atan(Math.tan(baseHFov / 2) / aspect)
    // Trần 110° đủ rộng cho cả màn dọc cực hẹp; vẫn kẹp để tránh méo quá mức.
    const fovDeg = THREE.MathUtils.clamp(
      Math.max(BASE_FOV, THREE.MathUtils.radToDeg(vFovForWidth)),
      20,
      110,
    )
    cam.fov = fovDeg
    cam.updateProjectionMatrix()

    // Lens shift dọc (off-axis) — CHỈ khi phải mở rộng FOV (màn hẹp/dọc). Neo
    // mép DƯỚI của khung vào đúng vạch đáy khung 16:9 gốc → ghế khán giả luôn
    // nằm sát mép dưới; phần FOV dư dồn lên TRÊN (trời) thay vì tạo khoảng đen.
    if (fovDeg > BASE_FOV + 0.01) {
      const halfBase = Math.tan((BASE_FOV * DEG) / 2)
      const halfNow = Math.tan((fovDeg * DEG) / 2)
      cam.projectionMatrix.elements[9] = 1 - halfBase / halfNow
      // QUAN TRỌNG: vá xong phải đồng bộ ma trận nghịch đảo, nếu không Raycaster
      // (dùng projectionMatrixInverse để bắn tia từ con trỏ) sẽ lệch với ảnh
      // render off-axis → click trượt con rối khi màn hình hẹp/dọc.
      cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert()
    }
  }, [camera, size])

  // Update target when phase changes
  useEffect(() => {
    targetPosition.current.copy(WAYPOINTS[phase] || WAYPOINTS.performing)
  }, [phase])

  // Initialize camera position
  useEffect(() => {
    camera.position.copy(WAYPOINTS.performing)
    currentPosition.current.copy(WAYPOINTS.performing)
  }, [camera])

  useFrame((_, delta) => {
    // Smooth lerp between current and target position
    currentPosition.current.lerp(targetPosition.current, delta * 1.5)

    // Apply to camera
    camera.position.copy(currentPosition.current)

    // Update controls target if they exist
    if (controlsRef.current) {
      controlsRef.current.target.lerp(STAGE_FOCUS, delta * 1.2)
      controlsRef.current.update()
    }
  })

  return (
    <OrbitControls
      ref={controlsRef}
      // Polar angle constraints: [Math.PI/6, Math.PI/2.2] (30° to ~82°)
      minPolarAngle={Math.PI / 6}
      maxPolarAngle={Math.PI / 2.2}
      // No azimuth constraint — full 360°
      // enableDamping for smooth motion
      enableDamping
      dampingFactor={0.05}
      // Subtle zoom constraints
      minDistance={6}
      maxDistance={14}
      // Don't allow panning (focus on stage)
      enablePan={false}
      // Smooth target following — ngắm vào vùng con rối (STAGE_FOCUS)
      target={[STAGE_FOCUS.x, STAGE_FOCUS.y, STAGE_FOCUS.z]}
    />
  )
}
