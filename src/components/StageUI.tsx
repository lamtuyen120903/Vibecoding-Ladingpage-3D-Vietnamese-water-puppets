import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ActId } from '../App'
import { projects } from '../data/projects'
import './StageUI.css'

interface Props {
  currentAct: ActId
  onActChange: (act: ActId) => void
  hoveredPuppet: string | null
}

const guideItems: { icon: string; text: string }[] = [
  { icon: '🪆', text: 'Click vào con rối để xem chi tiết dự án' },
  { icon: '🎭', text: 'Chọn màn diễn ở thanh trên cùng (Giới thiệu / Automation / Vibe Coding / Video AI)' },
  { icon: '✨', text: 'Di chuột lên rối để thấy tên dự án' },
  { icon: '♫', text: 'Nút nhạc ở góc dưới phải để bật/tắt nhạc nền' },
  { icon: '⎋', text: 'Bấm vùng tối ngoài cửa sổ dự án để đóng' },
]

type Placement = 'top' | 'bottom' | 'left' | 'right' | 'center'
interface TourStep {
  title: string
  body: string
  target?: string
  placement?: Placement
}

const tutorialSteps: TourStep[] = [
  {
    title: 'Chào mừng',
    body: 'Đây là portfolio mô phỏng sân khấu Múa Rối Nước. Mình sẽ dẫn bạn qua các nút trên trang. Bấm "Tiếp" để bắt đầu.',
    placement: 'center',
  },
  {
    title: 'Chọn màn diễn',
    body: 'Thanh trên cùng có 4 màn: Giới thiệu, Automation, Vibe Coding, Video AI. Bấm để chuyển — mỗi màn hiện một nhóm con rối / dự án khác nhau.',
    target: '.stage-ui-acts',
    placement: 'bottom',
  },
  {
    title: 'Tương tác với rối',
    body: 'Trên sân khấu — di chuột lên 1 con rối sẽ thấy tên dự án; bấm vào con rối → cửa sổ dự án mở ra ngay.',
    placement: 'center',
  },
  {
    title: 'Bật / tắt nhạc nền',
    body: 'Nút tròn ở góc dưới phải bật / tắt nhạc nền truyền thống. Nhạc sẽ tự phát ngay lần tương tác đầu tiên.',
    target: '[data-tour="music"]',
    placement: 'left',
  },
  {
    title: 'Bảng hướng dẫn',
    body: 'Bảng này luôn ở góc trên phải. Bấm nút ? để mở lại bất cứ lúc nào. Tab "Điều khiển" có các phím tắt nhanh.',
    target: '.stage-ui-guide',
    placement: 'left',
  },
]

const acts: { id: ActId; label: string; sub: string }[] = [
  { id: 'intro', label: 'Màn', sub: 'Giới thiệu' },
  { id: 'automation', label: 'Màn', sub: 'Automation' },
  { id: 'vibecoding', label: 'Màn', sub: 'Vibe Coding' },
  { id: 'video', label: 'Màn', sub: 'Video AI / Edit Video' },
]

export default function StageUI({ currentAct, onActChange, hoveredPuppet }: Props) {
  // Tour auto-starts the first time a visitor reaches the stage. After they
  // finish (or dismiss) it, we set a localStorage flag so it doesn't pop up
  // every subsequent visit. Clearing localStorage shows it again.
  const [guideOpen, setGuideOpen] = useState(false)
  const [guideTab, setGuideTab] = useState<'controls' | 'tutorial'>('controls')
  const [tourActive, setTourActive] = useState(false)
  const [tourStep, setTourStep] = useState(0)

  useEffect(() => {
    if (typeof window === 'undefined') return
    // Always auto-launch on every visit (no localStorage gate).
    const id = setTimeout(() => {
      setTourStep(0)
      setTourActive(true)
    }, 700)
    return () => clearTimeout(id)
  }, [])
  const hoveredProject = hoveredPuppet
    ? projects.find(p => p.id === hoveredPuppet) || (hoveredPuppet === 'intro-personal' ? { title: 'Giới thiệu cá nhân', shortDescription: 'Click để xem' } : null)
    : null

  const startTour = () => {
    setTourStep(0)
    setTourActive(true)
    setGuideOpen(false) // hide the panel so it doesn't block the tour
  }
  const stopTour = () => {
    setTourActive(false)
    setGuideOpen(true)
  }
  const nextStep = () => {
    if (tourStep >= tutorialSteps.length - 1) stopTour()
    else setTourStep(s => s + 1)
  }
  const prevStep = () => setTourStep(s => Math.max(0, s - 1))

  return (
    <>
      {/* Act selector — top center */}
      <div className="stage-ui-acts">
        <span className="stage-ui-label">Chọn màn diễn</span>
        <div className="stage-ui-act-buttons">
          {acts.map(act => (
            <button
              key={act.id}
              className={`stage-ui-act-btn ${currentAct === act.id ? 'stage-ui-act-btn--active' : ''}`}
              onClick={() => onActChange(act.id)}
            >
              <span className="stage-ui-act-name">{act.label}</span>
              <span className="stage-ui-act-sub">{act.sub}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Puppet tooltip — bottom center */}
      {hoveredProject && (
        <div className="stage-ui-tooltip">
          <span className="stage-ui-tooltip-title">{hoveredProject.title}</span>
          <span className="stage-ui-tooltip-desc">{hoveredProject.shortDescription}</span>
          <span className="stage-ui-tooltip-cue">Click để xem chi tiết</span>
        </div>
      )}

      {/* Guide panel — top right */}
      <div className={`stage-ui-guide ${guideOpen ? 'stage-ui-guide--open' : ''}`}>
        <button
          className="stage-ui-guide-toggle"
          onClick={() => setGuideOpen(v => !v)}
          aria-label={guideOpen ? 'Đóng hướng dẫn' : 'Mở hướng dẫn'}
          title={guideOpen ? 'Đóng hướng dẫn' : 'Hướng dẫn'}
        >
          {guideOpen ? '✕' : '?'}
        </button>
        {guideOpen && (
          <div className="stage-ui-guide-panel">
            <div className="stage-ui-guide-title">Hướng dẫn</div>
            <div className="stage-ui-guide-tabs">
              <button
                className={`stage-ui-guide-tab ${guideTab === 'controls' ? 'stage-ui-guide-tab--active' : ''}`}
                onClick={() => setGuideTab('controls')}
              >Điều khiển</button>
              <button
                className={`stage-ui-guide-tab ${guideTab === 'tutorial' ? 'stage-ui-guide-tab--active' : ''}`}
                onClick={() => setGuideTab('tutorial')}
              >Tutorial</button>
            </div>
            {guideTab === 'controls' ? (
              <ul className="stage-ui-guide-list">
                {guideItems.map((item, i) => (
                  <li key={i} className="stage-ui-guide-item">
                    <span className="stage-ui-guide-icon">{item.icon}</span>
                    <span className="stage-ui-guide-text">{item.text}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <>
                <button className="stage-ui-tour-start" onClick={startTour}>
                  ▶ Bắt đầu hướng dẫn tương tác
                </button>
                <ol className="stage-ui-guide-steps">
                  {tutorialSteps.map((step, i) => (
                    <li key={i} className="stage-ui-guide-step">
                      <span className="stage-ui-guide-step-num">{i + 1}</span>
                      <div className="stage-ui-guide-step-body">
                        <div className="stage-ui-guide-step-title">{step.title}</div>
                        <div className="stage-ui-guide-step-text">{step.body}</div>
                      </div>
                    </li>
                  ))}
                </ol>
              </>
            )}
          </div>
        )}
      </div>

      {tourActive && (
        <TourOverlay
          step={tutorialSteps[tourStep]}
          stepIndex={tourStep}
          total={tutorialSteps.length}
          onPrev={prevStep}
          onNext={nextStep}
          onSkip={stopTour}
        />
      )}
    </>
  )
}

interface TourOverlayProps {
  step: TourStep
  stepIndex: number
  total: number
  onPrev: () => void
  onNext: () => void
  onSkip: () => void
}

function TourOverlay({ step, stepIndex, total, onPrev, onNext, onSkip }: TourOverlayProps) {
  const [rect, setRect] = useState<DOMRect | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  // Real card dimensions — measured from the DOM so placement stays correct on
  // every screen size (the card width changes via CSS clamp / media queries).
  const [cardSize, setCardSize] = useState({ w: 360, h: 240 })

  useLayoutEffect(() => {
    if (!step.target) { setRect(null); return }
    const update = () => {
      const el = document.querySelector(step.target!)
      setRect(el ? (el as HTMLElement).getBoundingClientRect() : null)
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    const id = window.setInterval(update, 250) // catch layout shifts
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
      window.clearInterval(id)
    }
  }, [step.target])

  // Measure the actual rendered card so we never position it with a guessed size.
  useLayoutEffect(() => {
    const el = cardRef.current
    if (!el) return
    const measure = () => {
      const r = el.getBoundingClientRect()
      setCardSize(prev =>
        Math.abs(prev.w - r.width) > 1 || Math.abs(prev.h - r.height) > 1
          ? { w: r.width, h: r.height }
          : prev,
      )
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    window.addEventListener('resize', measure)
    return () => { ro.disconnect(); window.removeEventListener('resize', measure) }
  }, [step])

  // Compute card placement
  const placement: Placement = step.placement ?? (rect ? 'bottom' : 'center')
  const cardStyle = computeCardStyle(rect, placement, cardSize.w, cardSize.h)
  const ringStyle = rect ? {
    top: rect.top - 8,
    left: rect.left - 8,
    width: rect.width + 16,
    height: rect.height + 16,
  } : null

  // Spotlight rectangles (4 dark panels around the target hole)
  const spotlightRects = rect ? computeSpotlightRects(rect) : null

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onSkip()
      else if (e.key === 'ArrowRight' || e.key === 'Enter') onNext()
      else if (e.key === 'ArrowLeft') onPrev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onPrev, onNext, onSkip])

  return (
    <div className="tour-root">
      {spotlightRects ? (
        spotlightRects.map((r, i) => (
          <div key={i} className="tour-mask" style={r} />
        ))
      ) : (
        <div className="tour-mask tour-mask--full" />
      )}
      {ringStyle && <div className="tour-ring" style={ringStyle} />}
      <div ref={cardRef} className={`tour-card tour-card--${placement}`} style={cardStyle}>
        <div className="tour-card-step">Bước {stepIndex + 1} / {total}</div>
        <div className="tour-card-title">{step.title}</div>
        <div className="tour-card-body">{step.body}</div>
        <div className="tour-card-buttons">
          <button className="tour-btn tour-btn--ghost" onClick={onSkip}>Bỏ qua</button>
          <button className="tour-btn tour-btn--ghost" onClick={onPrev} disabled={stepIndex === 0}>← Trước</button>
          <button className="tour-btn tour-btn--primary" onClick={onNext}>
            {stepIndex === total - 1 ? 'Hoàn tất' : 'Tiếp →'}
          </button>
        </div>
      </div>
    </div>
  )
}

function computeCardStyle(rect: DOMRect | null, placement: Placement, cardW = 360, cardH = 240): React.CSSProperties {
  if (!rect || placement === 'center') {
    return {
      top: '50%', left: '50%',
      transform: 'translate(-50%, -50%)',
    }
  }
  const margin = 16
  const edge = 16 // viewport edge gap
  const vw = window.innerWidth
  const vh = window.innerHeight

  let top: number, left: number
  switch (placement) {
    case 'bottom':
      top = rect.bottom + margin
      left = rect.left + rect.width / 2 - cardW / 2
      break
    case 'top':
      top = rect.top - margin - cardH
      left = rect.left + rect.width / 2 - cardW / 2
      break
    case 'right':
      top = rect.top + rect.height / 2 - cardH / 2
      left = rect.right + margin
      break
    case 'left':
      top = rect.top + rect.height / 2 - cardH / 2
      left = rect.left - margin - cardW
      break
  }

  // If left placement would push card off-screen on the left, flip to right (and vice versa).
  if (left < edge && placement === 'left') {
    left = rect.right + margin
  }
  if (left + cardW > vw - edge && placement === 'right') {
    left = rect.left - margin - cardW
  }
  // Same for top/bottom.
  if (top < edge && placement === 'top') {
    top = rect.bottom + margin
  }
  if (top + cardH > vh - edge && placement === 'bottom') {
    top = rect.top - margin - cardH
  }

  // Final clamp so card always stays inside viewport.
  left = clamp(left, edge, vw - cardW - edge)
  top = clamp(top, edge, vh - cardH - edge)
  return { top, left }
}

function computeSpotlightRects(rect: DOMRect): React.CSSProperties[] {
  const pad = 8
  const top = rect.top - pad
  const bottom = rect.bottom + pad
  const left = rect.left - pad
  const right = rect.right + pad
  return [
    // Top strip
    { top: 0, left: 0, width: '100vw', height: Math.max(0, top) },
    // Bottom strip
    { top: bottom, left: 0, width: '100vw', height: `calc(100vh - ${bottom}px)` },
    // Left strip
    { top, left: 0, width: Math.max(0, left), height: Math.max(0, bottom - top) },
    // Right strip
    { top, left: right, width: `calc(100vw - ${right}px)`, height: Math.max(0, bottom - top) },
  ]
}

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)) }
