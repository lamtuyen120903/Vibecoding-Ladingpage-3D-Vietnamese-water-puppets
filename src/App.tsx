import { useState, useCallback, useEffect, useRef, lazy, Suspense } from 'react'
import PuppetStage from './components/PuppetStage'
import PerfMonitor from './components/PerfMonitor'
import LoadingScreen from './components/LoadingScreen'
import type { Project } from './data/projects'
import './App.css'

// Heavy non-critical UI — split out of the initial bundle.
// StageUI only mounts after the 8s opening sequence; the modal only on demand.
const StageUI = lazy(() => import('./components/StageUI'))
const ProjectDetailModal = lazy(() => import('./components/ProjectDetailModal'))

export type ActId = 'intro' | 'automation' | 'vibecoding' | 'video'
export type StagePhase = 'opening' | 'performing'

function App() {
  const [phase, setPhase] = useState<StagePhase>('opening')
  const [currentAct, setCurrentAct] = useState<ActId>('intro')
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [hoveredPuppet, setHoveredPuppet] = useState<string | null>(null)
  const [showOpeningText, setShowOpeningText] = useState(true)
  const [musicPlaying, setMusicPlaying] = useState(true)
  // Initial-load gate. Stays true until the 3D models have finished
  // streaming in (or the LoadingScreen safety timeout fires). While
  // showLoading is true, we don't run the 8s opening timer — so the user
  // never sees the puppets popping in behind a half-finished intro on slow
  // connections.
  const [showLoading, setShowLoading] = useState(true)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Lazy-init audio: create the element only on the first user gesture so we
  // don't pay the 2.8 MB download up-front (autoplay is blocked anyway).
  useEffect(() => {
    const tryPlay = () => {
      if (!audioRef.current) {
        const audio = new Audio('/bg-music.mp3')
        audio.loop = true
        audio.volume = 0.35
        audio.preload = 'auto'
        audioRef.current = audio
      }
      audioRef.current.play().catch(() => {})
    }
    document.addEventListener('click', tryPlay, { once: true })
    document.addEventListener('keydown', tryPlay, { once: true })
    return () => {
      const audio = audioRef.current
      if (audio) { audio.pause(); audio.src = '' }
      document.removeEventListener('click', tryPlay)
      document.removeEventListener('keydown', tryPlay)
    }
  }, [])

  const toggleMusic = useCallback(() => {
    const audio = audioRef.current
    if (!audio) {
      // First-ever click on the music button counts as the gesture
      const a = new Audio('/bg-music.mp3')
      a.loop = true
      a.volume = 0.35
      audioRef.current = a
      a.play().catch(() => {})
      setMusicPlaying(true)
      return
    }
    if (musicPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setMusicPlaying(!musicPlaying)
  }, [musicPlaying])

  // Opening sequence: show all puppets dancing for 8 seconds, then transition.
  // Only start the timer once the initial loading screen is gone — otherwise
  // a slow connection would burn the 8s intro while the puppets are still
  // streaming in behind the LoadingScreen.
  useEffect(() => {
    if (phase !== 'opening' || showLoading) return
    const textTimer = setTimeout(() => setShowOpeningText(false), 5000)
    const phaseTimer = setTimeout(() => setPhase('performing'), 8000)
    return () => {
      clearTimeout(textTimer)
      clearTimeout(phaseTimer)
    }
  }, [phase, showLoading])

  // Pre-warm StageUI/Modal chunks during the opening sequence so the transition
  // at t=8s feels instant without bloating the initial bundle.
  useEffect(() => {
    if (phase !== 'opening') return
    const t = setTimeout(() => {
      import('./components/StageUI')
      import('./components/ProjectDetailModal')
    }, 3000)
    return () => clearTimeout(t)
  }, [phase])

  const handleActChange = useCallback((act: ActId) => {
    setCurrentAct(act)
    setSelectedProject(null)
    setHoveredPuppet(null)
  }, [])

  const handleSkipOpening = useCallback(() => {
    setPhase('performing')
    setShowOpeningText(false)
  }, [])

  return (
    <div className="stage-container">
      <PerfMonitor />

      {/* Initial loading overlay — tracks GLB download progress and sits
          above everything until the heavy models are ready. */}
      {showLoading && <LoadingScreen onDone={() => setShowLoading(false)} />}

      <video
        className="bg-video"
        src="/bg-video.mp4"
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
      />

      <PuppetStage
        currentAct={currentAct}
        phase={phase}
        onPuppetClick={setSelectedProject}
        onPuppetHover={setHoveredPuppet}
      />

      {/* Opening overlay */}
      {phase === 'opening' && (
        <div className="opening-overlay" onClick={handleSkipOpening}>
          {showOpeningText && (
            <div className="opening-text">
              <h1 className="opening-title">Lam Tuyền's Portfolio</h1>
              <p className="opening-desc">Automation · Vibe Coding · Edit Video</p>
            </div>
          )}
          <div className="opening-skip">Click để bắt đầu</div>
        </div>
      )}

      {/* Music toggle */}
      <button
        data-tour="music"
        className="stage-music-btn"
        onClick={toggleMusic}
        title={musicPlaying ? 'Tắt nhạc' : 'Bật nhạc'}
      >
        {musicPlaying ? '♫' : '♪'}
      </button>

      {phase === 'performing' && (
        <Suspense fallback={null}>
          <StageUI
            currentAct={currentAct}
            onActChange={handleActChange}
            hoveredPuppet={hoveredPuppet}
          />
          <ProjectDetailModal
            project={selectedProject}
            onClose={() => setSelectedProject(null)}
          />
        </Suspense>
      )}
    </div>
  )
}

export default App
