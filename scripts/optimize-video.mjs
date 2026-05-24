// Re-encode public/bg-video.mp4 (and water.mp4) to web-friendly H.264.
// Uses ffmpeg-static so no system install is needed.
//
//   - 1080p cap, 30 fps
//   - H.264 (yuv420p, faststart) — universal browser support incl. iOS Safari
//   - CRF 26 + medium preset → typical ~3-6 MB for a 10-30s loop
//   - Strips audio (bg-video is muted anyway, saves ~10-20%)
//
// Usage:  node scripts/optimize-video.mjs
// Originals backed up to public/_original_video/ on first run.

import { spawn } from 'node:child_process'
import { mkdir, copyFile, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, basename } from 'node:path'
import ffmpegPath from 'ffmpeg-static'

const ROOT   = new URL('..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')
const PUBLIC = join(ROOT, 'public')
const BACKUP = join(PUBLIC, '_original_video')

// Files to re-encode + their target settings
const TARGETS = [
  { name: 'bg-video.mp4', crf: 26, scale: 1080, fps: 30, audio: false },
  { name: 'water.mp4',    crf: 28, scale: 720,  fps: 24, audio: false },
]

const fmtMb = (n) => (n / 1024 / 1024).toFixed(2) + ' MB'

function ffmpeg(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(ffmpegPath, args, { stdio: ['ignore', 'pipe', 'pipe'] })
    let stderr = ''
    proc.stderr.on('data', (d) => { stderr += d })
    proc.on('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`ffmpeg exited ${code}\n${stderr.split('\n').slice(-15).join('\n')}`))
    })
    proc.on('error', reject)
  })
}

async function processOne({ name, crf, scale, fps, audio }) {
  const src = join(PUBLIC, name)
  if (!existsSync(src)) {
    console.log(`[video] skip ${name} (not found)`)
    return
  }

  await mkdir(BACKUP, { recursive: true })
  const backup = join(BACKUP, name)
  if (!existsSync(backup)) {
    await copyFile(src, backup)
    console.log(`[video] backed up ${name} -> public/_original_video/`)
  }

  const before = (await stat(backup)).size
  console.log(`[video] encoding ${name} (${fmtMb(before)}) -> H.264 ${scale}p @ ${fps}fps, crf ${crf}`)

  // Try to write in-place first (single ffmpeg call with -y).
  // If the dest is locked (e.g. Windows + open browser tab), fall back to
  // writing a temp then atomic-rename, with a short retry loop for transient
  // Windows file locks.
  const directArgs = [
    '-y',
    '-i', backup,
    '-vf', `scale=-2:${scale}:flags=lanczos,fps=${fps}`,
    '-c:v', 'libx264',
    '-preset', 'medium',
    '-crf', String(crf),
    '-profile:v', 'high',
    '-level', '4.1',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    ...(audio ? ['-c:a', 'aac', '-b:a', '96k'] : ['-an']),
    src,
  ]

  try {
    // Pre-delete to drop most "file in use" cases on Windows
    const { unlink } = await import('node:fs/promises')
    try { await unlink(src) } catch {}
    await ffmpeg(directArgs)
  } catch (e) {
    // Fall back to tmp + rename with retry
    const out = src + '.tmp.mp4'
    const args = [...directArgs.slice(0, -1), out]
    await ffmpeg(args)
    const { rename, unlink } = await import('node:fs/promises')
    let lastErr
    for (let i = 0; i < 5; i++) {
      try {
        try { await unlink(src) } catch {}
        await rename(out, src)
        lastErr = null
        break
      } catch (err) {
        lastErr = err
        await new Promise((r) => setTimeout(r, 600))
      }
    }
    if (lastErr) throw new Error(`could not replace ${name}: ${lastErr.message}. Close any open browser tab on the deployed site / local preview and retry.`)
  }

  const after = (await stat(src)).size
  const pct = (1 - after / before) * 100
  console.log(`[video]   done ${name}: ${fmtMb(before)} -> ${fmtMb(after)} (${pct.toFixed(1)}% smaller)`)
}

async function main() {
  console.log(`[video] using ffmpeg at ${ffmpegPath}`)
  for (const t of TARGETS) {
    try { await processOne(t) } catch (e) { console.error(`[video] ! ${t.name}:`, e.message) }
  }
}
main().catch((e) => { console.error(e); process.exit(1) })

// Silence unused import warning
void basename
