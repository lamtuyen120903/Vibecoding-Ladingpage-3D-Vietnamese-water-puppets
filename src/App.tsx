import { useState, useCallback, useEffect, useRef } from 'react'
import PuppetStage from './components/PuppetStage'
import StageUI from './components/StageUI'
import ProjectDetailModal from './components/ProjectDetailModal'
import type { Project } from './data/projects'
import './App.css'

export type ActId = 'intro' | 'automation' | 'ai'
export type StagePhase = 'opening' | 'performing'

function App() {
  const [phase, setPhase] = useState<StagePhase>('opening')
  const [currentAct, setCurrentAct] = useState<ActId>('intro')
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [hoveredPuppet, setHoveredPuppet] = useState<string | null>(null)
  const [showOpeningText, setShowOpeningText] = useState(true)
  const [musicPlaying, setMusicPlaying] = useState(true)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const audio = new Audio('/bg-music.mp3')
    audio.loop = true
    audio.volume = 0.35
    audioRef.current = audio
    // Auto-play on first user interaction (browser requires gesture)
    const tryPlay = () => {
      audio.play().catch(() => {})
    }
    tryPlay()
    document.addEventListener('click', tryPlay, { once: true })
    document.addEventListener('keydown', tryPlay, { once: true })
    return () => {
      audio.pause(); audio.src = ''
      document.removeEventListener('click', tryPlay)
      document.removeEventListener('keydown', tryPlay)
    }
  }, [])

  const toggleMusic = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (musicPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setMusicPlaying(!musicPlaying)
  }, [musicPlaying])

  // Opening sequence: show all puppets dancing for 8 seconds, then transition
  useEffect(() => {
    if (phase === 'opening') {
      const textTimer = setTimeout(() => setShowOpeningText(false), 5000)
      const phaseTimer = setTimeout(() => setPhase('performing'), 8000)
      return () => {
        clearTimeout(textTimer)
        clearTimeout(phaseTimer)
      }
    }
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
              <h1 className="opening-title">Múa Rối Nước</h1>
              <p className="opening-subtitle">Vietnamese Water Puppet Theater</p>
              <p className="opening-desc">Portfolio — Analysis · Automation · AI</p>
            </div>
          )}
          <div className="opening-skip">Click để bắt đầu</div>
        </div>
      )}

      {/* Music toggle */}
      <button
        data-tour="music"
        onClick={toggleMusic}
        style={{
          position: 'fixed', bottom: 20, right: 20, zIndex: 100,
          width: 44, height: 44, borderRadius: '50%',
          background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)',
          color: '#f0e0c0', fontSize: 20, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(8px)',
        }}
        title={musicPlaying ? 'Tắt nhạc' : 'Bật nhạc'}
      >
        {musicPlaying ? '\u266B' : '\u266A'}
      </button>

      {phase === 'performing' && (
        <>
          <StageUI
            currentAct={currentAct}
            onActChange={handleActChange}
            hoveredPuppet={hoveredPuppet}
          />
          <ProjectDetailModal
            project={selectedProject}
            onClose={() => setSelectedProject(null)}
          />
        </>
      )}
    </div>
  )
}

export default App
