// Optimize PNG/JPG in /public:
//  - Resize down if larger than max dimensions (lossless cap for huge originals)
//  - Re-encode PNGs as WebP (q=88), keep originals as fallback for old browsers
//  - Re-encode JPGs as WebP (q=85) AND mozjpeg-recompress the JPG in place
//
// Originals are backed up to /public/_original_img on first run.
//
// Usage: node scripts/optimize-images.mjs
import { readdir, mkdir, copyFile, stat, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, extname, basename } from 'node:path'
import sharp from 'sharp'

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')
const PUBLIC_DIR = join(ROOT, 'public')
const BACKUP_DIR = join(PUBLIC_DIR, '_original_img')

const MAX_DIMENSION = 2400 // cap large hero images; smaller ones unchanged
// Higher quality so mobile retina screens don't show compression artifacts.
// q=95 keeps the file ~3x larger than q=85 but is visually near-lossless.
const WEBP_Q_PNG = 95   // for screenshots / UI with text & sharp edges
const WEBP_Q_PHOTO = 92 // for natural photos
const JPG_Q = 90        // mozjpeg fallback (legacy browsers only)
const REENCODE_FALLBACK = false // skip re-encoding original PNG/JPG (keep first-pass smaller copies)

const exts = new Set(['.png', '.jpg', '.jpeg'])

function fmtMb(n) { return (n / 1024 / 1024).toFixed(2) + ' MB' }
function fmtKb(n) { return (n / 1024).toFixed(1) + ' KB' }
function fmt(n)  { return n > 1024 * 1024 ? fmtMb(n) : fmtKb(n) }

async function processOne(name) {
  const src = join(PUBLIC_DIR, name)
  const ext = extname(name).toLowerCase()
  const stem = basename(name, ext)

  const before = (await stat(src)).size

  // backup once
  await mkdir(BACKUP_DIR, { recursive: true })
  const backup = join(BACKUP_DIR, name)
  if (!existsSync(backup)) await copyFile(src, backup)

  // `.rotate()` (no args) auto-applies EXIF Orientation and then strips it.
  // Without this, phone photos that store "rotate 180/90/270" in EXIF get
  // re-encoded as-stored and come out flipped — exactly what happened to
  // intro-hoian.jpg in the first pass.
  const img = sharp(backup).rotate()
  const meta = await img.metadata()
  const longest = Math.max(meta.width ?? 0, meta.height ?? 0)
  const needResize = longest > MAX_DIMENSION
  const resizedPipeline = needResize
    ? img.resize({ width: meta.width >= meta.height ? MAX_DIMENSION : null,
                   height: meta.height > meta.width ? MAX_DIMENSION : null,
                   withoutEnlargement: true })
    : img

  // 1) write modern WebP alongside (keeps original extension for fallback)
  const webpPath = join(PUBLIC_DIR, `${stem}.webp`)
  const webpQ = ext === '.png' ? WEBP_Q_PNG : WEBP_Q_PHOTO
  await resizedPipeline.clone()
    .webp({ quality: webpQ, effort: 6 })
    .toFile(webpPath)
  const webpSize = (await stat(webpPath)).size

  // 2) optionally re-encode the original format in place (skipped by default
  //    now — keep the existing small fallback PNG/JPGs that ship to legacy
  //    browsers; nearly all modern browsers will pick the WebP anyway).
  let fallbackSize = (await stat(src)).size
  if (REENCODE_FALLBACK) {
    if (ext === '.png') {
      await resizedPipeline.clone()
        .png({ compressionLevel: 9, palette: true, quality: 90 })
        .toFile(src + '.tmp')
    } else {
      await resizedPipeline.clone()
        .jpeg({ quality: JPG_Q, mozjpeg: true, progressive: true })
        .toFile(src + '.tmp')
    }
    const { rename } = await import('node:fs/promises')
    await rename(src + '.tmp', src)
    fallbackSize = (await stat(src)).size
  }

  console.log(
    `  ${name.padEnd(34)}  ${fmt(before).padStart(10)}  ->  ` +
    `webp ${fmt(webpSize).padStart(10)}   fallback ${fmt(fallbackSize).padStart(10)}` +
    (needResize ? `  (resized to <=${MAX_DIMENSION}px)` : '')
  )

  return { before, webp: webpSize, fallback: fallbackSize }
}

async function main() {
  const entries = (await readdir(PUBLIC_DIR))
    .filter((f) => exts.has(extname(f).toLowerCase()))
    .sort()

  if (!entries.length) {
    console.log('No images found in public/')
    return
  }

  console.log(`Optimizing ${entries.length} image(s) in public/\n`)
  let totalBefore = 0, totalWebp = 0, totalFallback = 0

  for (const name of entries) {
    try {
      const r = await processOne(name)
      totalBefore += r.before
      totalWebp += r.webp
      totalFallback += r.fallback
    } catch (e) {
      console.warn(`  ! failed on ${name}:`, e.message)
    }
  }

  console.log('\n================ SUMMARY ================')
  console.log(`before:           ${fmt(totalBefore)}`)
  console.log(`webp (new):       ${fmt(totalWebp)}  (${(100 - totalWebp / totalBefore * 100).toFixed(1)}% smaller)`)
  console.log(`fallback in place:${fmt(totalFallback)}  (${(100 - totalFallback / totalBefore * 100).toFixed(1)}% smaller)`)
  console.log(`originals backed up: public/_original_img/`)
  console.log('\nTip: switch <img src> / projects.ts to .webp where you can. Keep the')
  console.log('     original-extension copies as <picture> fallbacks for older browsers.')
}

main().catch((e) => { console.error(e); process.exit(1) })
