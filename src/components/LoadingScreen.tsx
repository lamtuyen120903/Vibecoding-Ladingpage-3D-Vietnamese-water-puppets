import { useEffect, useRef, useState } from 'react'
import { useProgress } from '@react-three/drei'
import './LoadingScreen.css'

interface Props {
  /** Fired once the screen has finished its fade-out and can be unmounted. */
  onDone: () => void
}

// Don't flash the loader for cached/instant loads — keep it on screen for at
// least this long so the brand frame is always readable.
const MIN_DISPLAY_MS = 900
// Safety net: if the loading manager never reports completion (e.g. errors,
// no GLBs registered), hide the screen anyway so the user can use the site.
const TIMEOUT_MS = 20000
// Match the CSS fade-out animation duration.
const FADE_OUT_MS = 600

export default function LoadingScreen({ onDone }: Props) {
  const { progress, active, loaded, total, errors } = useProgress()
  const [hiding, setHiding] = useState(false)
  const mountedAt = useRef(Date.now())
  // Track whether the loading manager has actually picked up any work. If
  // total is still 0, "progress=100" doesn't mean anything yet.
  const sawActivity = useRef(false)
  if (active || total > 0) sawActivity.current = true

  // Latch the "fully loaded" signal. Tier-2 GLBs (musician, side platforms)
  // start downloading ~2s after mount, which would otherwise push `progress`
  // back down from 100% → ~50% and keep us blocking the user. Once we've
  // hit 100% with no active loaders, we consider the initial scene ready —
  // late-arriving assets stream in behind the existing opening overlay.
  const hasReachedFull = useRef(false)
  if (sawActivity.current && !active && total > 0 && loaded >= total) {
    hasReachedFull.current = true
  }

  // Displayed progress is monotonic — never goes backwards, so the user
  // doesn't see an ugly 100% → 50% bounce when the next tier kicks in.
  const rawProgress = sawActivity.current ? Math.min(100, Math.floor(progress)) : 0
  const peakProgress = useRef(0)
  if (rawProgress > peakProgress.current) peakProgress.current = rawProgress
  const displayProgress = hasReachedFull.current ? 100 : peakProgress.current

  const everythingLoaded = hasReachedFull.current
  // Errors should also unblock the user — show what we have.
  const failed = errors.length > 0

  // Stabilise the parent's onDone callback so progress-driven re-renders
  // don't repeatedly clear/restart the fade-out timer.
  const onDoneRef = useRef(onDone)
  useEffect(() => { onDoneRef.current = onDone }, [onDone])

  // Schedule the fade-out once loading is done (respecting the minimum).
  useEffect(() => {
    if (!everythingLoaded && !failed) return
    const elapsed = Date.now() - mountedAt.current
    const wait = Math.max(0, MIN_DISPLAY_MS - elapsed)
    const t = setTimeout(() => setHiding(true), wait)
    return () => clearTimeout(t)
  }, [everythingLoaded, failed])

  // Hard timeout — don't trap the user on a stalled connection.
  useEffect(() => {
    const t = setTimeout(() => setHiding(true), TIMEOUT_MS)
    return () => clearTimeout(t)
  }, [])

  // After the fade-out animation, tell the parent to unmount us.
  useEffect(() => {
    if (!hiding) return
    const t = setTimeout(() => onDoneRef.current(), FADE_OUT_MS)
    return () => clearTimeout(t)
  }, [hiding])

  const tip = failed
    ? 'Một vài tài nguyên tải lỗi — vẫn tiếp tục…'
    : displayProgress < 100
      ? 'Đang tải sân khấu…'
      : 'Sẵn sàng — chuẩn bị màn diễn'

  return (
    <div
      className={`loading-screen${hiding ? ' loading-screen--hiding' : ''}`}
      role="status"
      aria-live="polite"
      aria-label="Đang tải nội dung"
    >
      <div className="loading-frame">
        {/* Decorative Vietnamese lantern */}
        <div className="loading-lantern" aria-hidden="true">
          <div className="loading-lantern__cap" />
          <div className="loading-lantern__body">
            <div className="loading-lantern__glow" />
            <div className="loading-lantern__rib loading-lantern__rib--l" />
            <div className="loading-lantern__rib loading-lantern__rib--r" />
          </div>
          <div className="loading-lantern__base" />
          <div className="loading-lantern__tassel" />
        </div>

        <div className="loading-title">PORTFOLIO OF LAM TUYEN</div>
        <div className="loading-subtitle">wait a second</div>

        <div className="loading-bar" aria-hidden="true">
          <div className="loading-bar__fill" style={{ width: `${displayProgress}%` }} />
        </div>
        <div className="loading-percent">
          {displayProgress}<span className="loading-percent__sign">%</span>
        </div>

        <div className="loading-tip">{tip}</div>
      </div>
    </div>
  )
}
