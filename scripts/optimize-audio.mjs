// Re-encode bg-music.mp3 (and any other public/*.mp3) to a smaller bitrate.
// Uses ffmpeg-static so no system install is needed.
//
//   - Target: 96 kbps stereo (transparent for background music loops)
//   - Strips ID3 tags (small but cumulative)
//
// Originals backed up to public/_original_audio/ on first run.
//
// Usage:  node scripts/optimize-audio.mjs

import { spawn } from 'node:child_process'
import { mkdir, copyFile, stat, unlink, rename } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, basename } from 'node:path'
import ffmpegPath from 'ffmpeg-static'

const ROOT   = new URL('..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')
const PUBLIC = join(ROOT, 'public')
const BACKUP = join(PUBLIC, '_original_audio')

const TARGETS = [
  // 64k mono = transparent for background music loops, ~half the size.
  { name: 'bg-music.mp3', bitrate: '64k', channels: 1 },
]

const fmtMb = (n) => (n / 1024 / 1024).toFixed(2) + ' MB'

function ffmpeg(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(ffmpegPath, args, { stdio: ['ignore', 'pipe', 'pipe'] })
    let stderr = ''
    proc.stderr.on('data', (d) => { stderr += d })
    proc.on('close', (code) => code === 0
      ? resolve()
      : reject(new Error(`ffmpeg exited ${code}\n${stderr.split('\n').slice(-15).join('\n')}`)))
    proc.on('error', reject)
  })
}

async function processOne({ name, bitrate, channels = 2 }) {
  const src = join(PUBLIC, name)
  if (!existsSync(src)) { console.log(`[audio] skip ${name} (not found)`); return }

  await mkdir(BACKUP, { recursive: true })
  const backup = join(BACKUP, name)
  if (!existsSync(backup)) {
    await copyFile(src, backup)
    console.log(`[audio] backed up ${name} -> public/_original_audio/`)
  }

  const before = (await stat(backup)).size
  console.log(`[audio] encoding ${name} (${fmtMb(before)}) -> MP3 ${bitrate}`)

  const out = src + '.tmp.mp3'
  const args = [
    '-y',
    '-i', backup,
    '-c:a', 'libmp3lame',
    '-b:a', bitrate,
    '-ac', String(channels),
    '-ar', '44100',
    '-map_metadata', '-1', // strip ID3 tags
    out,
  ]
  await ffmpeg(args)

  // Replace original with retry (Windows file locks)
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
  if (lastErr) throw new Error(`could not replace ${name}: ${lastErr.message}`)

  const after = (await stat(src)).size
  const pct = (1 - after / before) * 100
  console.log(`[audio]   done ${name}: ${fmtMb(before)} -> ${fmtMb(after)} (${pct.toFixed(1)}% smaller)`)
}

async function main() {
  for (const t of TARGETS) {
    try { await processOne(t) } catch (e) { console.error(`[audio] !`, e.message) }
  }
}
main().catch((e) => { console.error(e); process.exit(1) })
void basename
