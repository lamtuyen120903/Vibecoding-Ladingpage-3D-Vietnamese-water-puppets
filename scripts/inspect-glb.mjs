// Parse GLB header, walk accessors for POSITION attributes, compute world AABB.
import { readFileSync } from 'node:fs'

const path = process.argv[2]
if (!path) throw new Error('usage: node inspect-glb.mjs <path>')

const buf = readFileSync(path)
const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength)

if (dv.getUint32(0, true) !== 0x46546c67) throw new Error('Not a GLB')
const jsonLen = dv.getUint32(12, true)
if (dv.getUint32(16, true) !== 0x4e4f534a) throw new Error('First chunk is not JSON')
const json = JSON.parse(new TextDecoder().decode(buf.subarray(20, 20 + jsonLen)))

const { nodes = [], meshes = [], accessors = [], scenes = [], scene = 0 } = json

function mat4Identity() { return [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1] }
function mat4Mul(a, b) {
  const r = new Array(16)
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
    r[i*4+j] = a[i*4]*b[j] + a[i*4+1]*b[4+j] + a[i*4+2]*b[8+j] + a[i*4+3]*b[12+j]
  }
  return r
}
function fromTRS(t = [0,0,0], r = [0,0,0,1], s = [1,1,1]) {
  const [x,y,z,w] = r
  const xx=x*x, yy=y*y, zz=z*z, xy=x*y, xz=x*z, yz=y*z, wx=w*x, wy=w*y, wz=w*z
  return [
    (1-2*(yy+zz))*s[0], 2*(xy+wz)*s[0],   2*(xz-wy)*s[0],   0,
    2*(xy-wz)*s[1],     (1-2*(xx+zz))*s[1], 2*(yz+wx)*s[1], 0,
    2*(xz+wy)*s[2],     2*(yz-wx)*s[2],   (1-2*(xx+yy))*s[2], 0,
    t[0], t[1], t[2], 1,
  ]
}
function transformPoint(m, p) {
  const [x, y, z] = p
  return [m[0]*x + m[4]*y + m[8]*z + m[12], m[1]*x + m[5]*y + m[9]*z + m[13], m[2]*x + m[6]*y + m[10]*z + m[14]]
}

function computeNodeMatrix(idx, parent) {
  const n = nodes[idx]
  const local = n.matrix ?? fromTRS(n.translation, n.rotation, n.scale)
  return mat4Mul(parent, local)
}
function walk(idx, parent) {
  const world = computeNodeMatrix(idx, parent)
  nodes[idx].__world = world
  for (const c of nodes[idx].children || []) walk(c, world)
}
for (const r of scenes[scene].nodes) walk(r, mat4Identity())

const aabb = { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] }
for (let i = 0; i < nodes.length; i++) {
  const n = nodes[i]
  if (n.mesh == null) continue
  for (const p of meshes[n.mesh].primitives) {
    const a = accessors[p.attributes.POSITION]
    if (!a.min || !a.max) continue
    for (const x of [a.min[0], a.max[0]]) for (const y of [a.min[1], a.max[1]]) for (const z of [a.min[2], a.max[2]]) {
      const w = transformPoint(n.__world, [x, y, z])
      for (let k = 0; k < 3; k++) { if (w[k] < aabb.min[k]) aabb.min[k] = w[k]; if (w[k] > aabb.max[k]) aabb.max[k] = w[k] }
    }
  }
}

const sz = [aabb.max[0] - aabb.min[0], aabb.max[1] - aabb.min[1], aabb.max[2] - aabb.min[2]]
console.log('GLB:', path)
console.log('AABB.min', aabb.min.map(v => v.toFixed(4)))
console.log('AABB.max', aabb.max.map(v => v.toFixed(4)))
console.log('size X', sz[0].toFixed(4), 'Y', sz[1].toFixed(4), 'Z', sz[2].toFixed(4))
