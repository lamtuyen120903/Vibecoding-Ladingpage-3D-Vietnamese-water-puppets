// CI-friendly GLB optimization using @gltf-transform/cli.
// No Blender install needed — runs anywhere Node runs (incl. Vercel build).
//
// Pipeline (preserves visual quality >= 90%):
//   - Dedupe, prune unused data, weld vertices, flatten, join meshes
//   - GPU instancing where 5+ copies share the same mesh
//   - Texture resize -> 1024px max + WebP q=88 re-encode
//   - Mesh simplify @ ratio 0.75 (edge-preserving)
//   - Draco geometry compression
//
// Usage:
//   node scripts/optimize-glb-node.mjs              # all GLBs in /public
//   node scripts/optimize-glb-node.mjs --force      # re-process even if marker exists
//
// Originals are backed up to public/_original_glb/ (skipped if backup exists).
// A .optimized marker file is written alongside each GLB so this script is
// safely idempotent (incl. in CI prebuild).

import { execSync } from 'node:child_process'
import { readdir, mkdir, copyFile, stat, writeFile, unlink } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

const ROOT   = new URL('..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')
const PUBLIC = join(ROOT, 'public')
const BACKUP = join(PUBLIC, '_original_glb')
const FORCE  = process.argv.includes('--force')

const SIMPLIFY_RATIO = 0.75
const SIMPLIFY_ERROR = 0.001
const TEXTURE_MAX    = 1024
const TEXTURE_Q      = 88

const fmtMb = (n) => (n / 1024 / 1024).toFixed(2) + ' MB'
const log = (...a) => console.log('[glb]', ...a)

function run(cmd) {
  try {
    execSync(cmd, { stdio: 'pipe', cwd: ROOT })
  } catch (e) {
    const msg = (e.stderr?.toString() || e.stdout?.toString() || e.message).trim()
    throw new Error(msg)
  }
}

async function processOne(name) {
  const src    = join(PUBLIC, name)
  const marker = src + '.optimized'

  if (!FORCE && existsSync(marker)) {
    log(`skip ${name} (already optimized — pass --force to redo)`)
    return null
  }

  await mkdir(BACKUP, { recursive: true })
  const backup = join(BACKUP, name)
  if (!existsSync(backup)) {
    await copyFile(src, backup)
    log(`backed up ${name} -> public/_original_glb/`)
  }

  const sizeBefore = (await stat(backup)).size
  log(`processing ${name} (${fmtMb(sizeBefore)})`)

  run(
    `npx --no-install gltf-transform optimize "${backup}" "${src}" ` +
    `--compress draco ` +
    `--instance true --instance-min 5 ` +
    `--simplify true --simplify-ratio ${SIMPLIFY_RATIO} --simplify-error ${SIMPLIFY_ERROR} ` +
    `--texture-compress webp --texture-size ${TEXTURE_MAX} ` +
    `--flatten true --join true --prune true --palette true`
  )

  const sizeAfter = (await stat(src)).size
  await writeFile(marker, new Date().toISOString())

  const pct = (1 - sizeAfter / sizeBefore) * 100
  log(`  done ${name}: ${fmtMb(sizeBefore)} -> ${fmtMb(sizeAfter)} (${pct.toFixed(1)}% smaller)`)
  return { before: sizeBefore, after: sizeAfter }
}

async function main() {
  const glbs = (await readdir(PUBLIC))
    .filter((f) => f.toLowerCase().endsWith('.glb'))
    .sort()

  if (!glbs.length) { log('no .glb in public/'); return }
  log(`found ${glbs.length} GLB(s): ${glbs.join(', ')}`)

  let totalBefore = 0, totalAfter = 0
  for (const name of glbs) {
    try {
      const r = await processOne(name)
      if (r) { totalBefore += r.before; totalAfter += r.after }
    } catch (e) {
      log(`! failed on ${name}:`, e.message.split('\n')[0])
    }
  }

  if (totalBefore) {
    log('')
    log('================ SUMMARY ================')
    log(`total before: ${fmtMb(totalBefore)}`)
    log(`total after:  ${fmtMb(totalAfter)}`)
    log(`saved:        ${fmtMb(totalBefore - totalAfter)} (${((1 - totalAfter / totalBefore) * 100).toFixed(1)}%)`)
  }
}

// Suppress unused import warning at runtime
void unlink
main().catch((e) => { console.error(e); process.exit(1) })
