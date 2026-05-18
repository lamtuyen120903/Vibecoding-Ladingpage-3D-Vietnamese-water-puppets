// Parse ThuyDinh.tsx and compute the precise AABB of the procedural "cung đình"
// inner group (the group at line 93 with position [0, -0.6, 0.5] scale [1.3, 1, 1]).
// Handles per-mesh rotations and nested <group position rotation> wrappers.
import { readFileSync } from 'node:fs'

const SRC = readFileSync('src/components/ThuyDinh.tsx', 'utf8')

// Extract the inner cung-đình block — from `<group position={[0, -0.6, 0.5]} scale={[1.3, 1, 1]}>`
// to its matching closing tag. We slice up to the SIDE PLATFORMS comment, then walk back to
// the last `</group>` so we capture only the cung-đình closing brace, not the outer ThuyDinh one.
const startMarker = '<group position={[0, -0.6, 0.5]} scale={[1.3, 1, 1]}>'
const endMarker = '{/* ===== SIDE PLATFORMS (wings)'
const startIdx = SRC.indexOf(startMarker)
const endIdx = SRC.indexOf(endMarker, startIdx)
if (startIdx < 0 || endIdx < 0) throw new Error('cung-đình block not found')
let block = SRC.slice(startIdx + startMarker.length, endIdx)
const lastClose = block.lastIndexOf('</group>')
block = block.slice(0, lastClose)

// Simple tokenizer — walk character-by-character, tracking nested <group> ... </group> contexts.
// For each <mesh ... /> or <mesh ...>...</mesh>, extract position/rotation and the first <boxGeometry|cylinderGeometry|sphereGeometry|coneGeometry>.

function parseNumArr(s) {
  // s like "[0, 1.5, -0.6]" or "[Math.PI / 4, 0, 0]" → evaluate numbers
  // Strip the [ ] and split by , at top level
  s = s.trim()
  if (!s.startsWith('[') || !s.endsWith(']')) return null
  const inner = s.slice(1, -1)
  // Split by commas
  const parts = []
  let depth = 0, cur = ''
  for (const ch of inner) {
    if (ch === '(' || ch === '[' || ch === '{') depth++
    if (ch === ')' || ch === ']' || ch === '}') depth--
    if (ch === ',' && depth === 0) { parts.push(cur); cur = '' } else cur += ch
  }
  if (cur.trim()) parts.push(cur)
  return parts.map((p) => {
    try {
      // Evaluate simple expressions like "Math.PI / 4" or numbers
      return Function('"use strict";return (' + p + ')')()
    } catch { return NaN }
  })
}

// Find positions of <group ...> and </group> for nesting
// We'll do a manual walk.

// Stack: outermost is the cung-đình group's own transform (position [0, -0.6, 0.5] scale [1.3, 1, 1]),
// so measurements come out in ThuyDinh-local coords. World adds outer ThuyDinh offset (0, -0.4, -4.5).
const transformStack = [{ pos: [0, -0.6, 0.5], rot: [0,0,0], scale: [1.3, 1, 1] }]
const aabb = { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] }

function applyTransformChain(stack, localPos) {
  // Apply each frame from outermost to innermost; each multiplies local by scale, rotates, translates.
  // Stack order: stack[0] outermost ... stack[N-1] innermost (current frame)
  let p = localPos.slice()
  for (let i = stack.length - 1; i >= 0; i--) {
    const { pos, rot, scale } = stack[i]
    p = [p[0]*scale[0], p[1]*scale[1], p[2]*scale[2]]
    // Apply rotation Z then Y then X (three.js default: 'XYZ' order means rotate X first then Y then Z; for converting local→world we apply in reverse order: Z, then Y, then X)
    const [rx, ry, rz] = rot
    // rotate around Z
    {
      const c = Math.cos(rz), s = Math.sin(rz)
      p = [c*p[0] - s*p[1], s*p[0] + c*p[1], p[2]]
    }
    // rotate around Y
    {
      const c = Math.cos(ry), s = Math.sin(ry)
      p = [c*p[0] + s*p[2], p[1], -s*p[0] + c*p[2]]
    }
    // rotate around X
    {
      const c = Math.cos(rx), s = Math.sin(rx)
      p = [p[0], c*p[1] - s*p[2], s*p[1] + c*p[2]]
    }
    p = [p[0] + pos[0], p[1] + pos[1], p[2] + pos[2]]
  }
  return p
}

function expandBoxCorners(size) {
  const [w, h, d] = size
  const r = []
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1])
    r.push([sx*w/2, sy*h/2, sz*d/2])
  return r
}
function expandCylinderSamples(rt, rb, h) {
  // sample 16 around top & bottom rings + top/bottom centers
  const r = []
  for (const [ring, y] of [[rt, h/2], [rb, -h/2]]) {
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2
      r.push([Math.cos(a)*ring, y, Math.sin(a)*ring])
    }
  }
  return r
}
function expandSphereSamples(rad) {
  // 8 cardinals (good enough for AABB of sphere = ±r each axis)
  return [
    [rad,0,0],[-rad,0,0],[0,rad,0],[0,-rad,0],[0,0,rad],[0,0,-rad],
    [rad*0.707, rad*0.707, 0], [-rad*0.707, -rad*0.707, 0],
  ]
}
function expandConeSamples(rad, h) {
  // base ring + apex
  const r = [[0, h/2, 0]]
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2
    r.push([Math.cos(a)*rad, -h/2, Math.sin(a)*rad])
  }
  return r
}

function recordMesh(meshPos, meshRot, samples) {
  // For each sample, apply mesh local transform (rotation around mesh center, then translation),
  // then propagate up through the transform stack.
  for (const s of samples) {
    let p = s.slice()
    const [rx, ry, rz] = meshRot
    {
      const c = Math.cos(rz), s2 = Math.sin(rz)
      p = [c*p[0] - s2*p[1], s2*p[0] + c*p[1], p[2]]
    }
    {
      const c = Math.cos(ry), s2 = Math.sin(ry)
      p = [c*p[0] + s2*p[2], p[1], -s2*p[0] + c*p[2]]
    }
    {
      const c = Math.cos(rx), s2 = Math.sin(rx)
      p = [p[0], c*p[1] - s2*p[2], s2*p[1] + c*p[2]]
    }
    p = [p[0] + meshPos[0], p[1] + meshPos[1], p[2] + meshPos[2]]
    const w = applyTransformChain(transformStack, p)
    for (let k = 0; k < 3; k++) {
      if (w[k] < aabb.min[k]) aabb.min[k] = w[k]
      if (w[k] > aabb.max[k]) aabb.max[k] = w[k]
    }
  }
}

// Walk tokens
// Find all relevant tags via simple regex passes that also track <group> nesting in document order.
const TAG = /<(group|mesh)([^>]*?)(\/?)>|<\/(group|mesh)>|<(boxGeometry|cylinderGeometry|sphereGeometry|coneGeometry|capsuleGeometry|circleGeometry)([^>]*?)\/?>/g
let m
let currentMeshPos = null, currentMeshRot = null
let meshOpen = false
let meshCount = 0, ignoredCount = 0

function attrValue(attrs, name) {
  const re = new RegExp(name + "=\\{(\\[[^\\]]*\\])\\}")
  const r = attrs.match(re)
  return r ? parseNumArr(r[1]) : null
}

while ((m = TAG.exec(block))) {
  const tag = m[1] || m[4] || m[5]
  const attrs = m[2] || m[6] || ''
  const selfClose = (m[3] === '/') || (m[5] != null) // geometries are self-closing
  const isClose = !!m[4]

  if (tag === 'group') {
    if (isClose) {
      transformStack.pop()
    } else {
      const pos = attrValue(attrs, 'position') || [0,0,0]
      const rot = attrValue(attrs, 'rotation') || [0,0,0]
      const sc = attrValue(attrs, 'scale') || [1,1,1]
      transformStack.push({ pos, rot, scale: sc })
    }
  } else if (tag === 'mesh') {
    if (isClose) {
      meshOpen = false
      currentMeshPos = null
      currentMeshRot = null
    } else {
      currentMeshPos = attrValue(attrs, 'position') || [0,0,0]
      currentMeshRot = attrValue(attrs, 'rotation') || [0,0,0]
      if (selfClose) { /* no geometry — ignore */ ignoredCount++; currentMeshPos = null }
      else meshOpen = true
    }
  } else if (currentMeshPos) {
    // geometry — extract args
    const ar = attrs.match(/args=\{(\[[^\]]*\])\}/)
    if (ar) {
      const a = parseNumArr(ar[1]) || []
      let samples = null
      if (tag === 'boxGeometry') samples = expandBoxCorners([a[0]||0, a[1]||0, a[2]||0])
      else if (tag === 'cylinderGeometry') samples = expandCylinderSamples(a[0]||0, a[1]||0, a[2]||0)
      else if (tag === 'sphereGeometry') samples = expandSphereSamples(a[0]||0)
      else if (tag === 'coneGeometry') samples = expandConeSamples(a[0]||0, a[1]||0)
      else if (tag === 'capsuleGeometry') samples = expandCylinderSamples(a[0]||0, a[0]||0, (a[1]||0) + 2*(a[0]||0))
      else if (tag === 'circleGeometry') samples = expandSphereSamples(a[0]||0)
      if (samples) {
        recordMesh(currentMeshPos, currentMeshRot, samples)
        meshCount++
      }
    }
  }
}

const sz = [aabb.max[0]-aabb.min[0], aabb.max[1]-aabb.min[1], aabb.max[2]-aabb.min[2]]
console.log('Procedural cung đình — measured from JSX')
console.log('Meshes counted:', meshCount, '(ignored without geometry:', ignoredCount, ')')
console.log('AABB.min', aabb.min.map(v => v.toFixed(4)))
console.log('AABB.max', aabb.max.map(v => v.toFixed(4)))
console.log('size X (rộng) =', sz[0].toFixed(4), 'units')
console.log('size Y (cao)  =', sz[1].toFixed(4), 'units')
console.log('size Z (sâu)  =', sz[2].toFixed(4), 'units')
console.log('')
console.log('Note: world position adds outer ThuyDinh offset (0, -0.4, -4.5).')
console.log('World y bottom =', (aabb.min[1] - 0.4).toFixed(4), '— world y top =', (aabb.max[1] - 0.4).toFixed(4))
console.log('World z near  =', (aabb.max[2] - 4.5).toFixed(4), '— world z far  =', (aabb.min[2] - 4.5).toFixed(4))
