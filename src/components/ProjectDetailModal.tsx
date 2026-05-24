import { useEffect, useState } from 'react'
import type { Project } from '../data/projects'
import './ProjectDetailModal.css'

// CSS-driven open/close timings — keep in sync with .pdm-overlay / .pdm-panel
// animations in ProjectDetailModal.css.
const CLOSE_DURATION_MS = 300

interface Props {
  project: Project | null
  onClose: () => void
}

const categoryLabels: Record<string, string> = {
  intro: 'Giới thiệu',
  automation: 'Automation',
  vibecoding: 'Vibe Coding',
  video: 'Video AI / Edit Video',
}

// Nhãn nút mở link tùy theo loại màn
const linkLabels: Record<string, string> = {
  automation: 'Xem trên GitHub →',
  vibecoding: 'Xem trên GitHub →',
  video: 'Xem video →',
}

export default function ProjectDetailModal({ project, onClose }: Props) {
  // Render the previous project content during the close animation so the
  // panel fades out with its actual contents instead of going blank.
  const [shown, setShown] = useState<Project | null>(project)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    if (project) { setShown(project); setClosing(false); return }
    if (shown) {
      setClosing(true)
      const id = setTimeout(() => { setShown(null); setClosing(false) }, CLOSE_DURATION_MS)
      return () => clearTimeout(id)
    }
  }, [project])

  if (!shown) return null

  const sections = shown.storyText.split('\n\n').filter(Boolean)
  // Re-bind under the kept-around `shown` so the rest of the JSX reads
  // exactly like the original.
  const p = shown

  return (
    <div
      className={`pdm-overlay${closing ? ' pdm-overlay--closing' : ''}`}
      onClick={onClose}
    >
      <div
        className={`pdm-panel${closing ? ' pdm-panel--closing' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
            {/* Close button */}
            <button className="pdm-close" onClick={onClose}>&#10005;</button>

            {/* Header */}
            <div className="pdm-header">
              <span className="pdm-category">{categoryLabels[p.category]}</span>
              <h2 className="pdm-title">{p.title}</h2>
              <p className="pdm-short">{p.shortDescription}</p>
            </div>

            {/* Media gallery — bỏ qua với màn video (chỉ hiện player) và project chưa có ảnh */}
            {p.category !== 'video' && p.images.length > 0 && (
            <div className="pdm-gallery">
              {p.images.map((img, i) => (
                <div key={i} className="pdm-gallery-item">
                  <div className="pdm-gallery-placeholder">
                    <span className="pdm-gallery-icon">&#9670;</span>
                    <span className="pdm-gallery-label">Hinh {i + 1}</span>
                  </div>
                  <img
                    className="pdm-gallery-img"
                    src={img}
                    alt={`${p.title} ${i + 1}`}
                    loading="lazy"
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                </div>
              ))}
            </div>
            )}

            {/* Video section */}
            {p.driveFileId ? (
              <div className="pdm-video-section">
                <div className="pdm-video-embed">
                  <iframe
                    src={`https://drive.google.com/file/d/${p.driveFileId}/preview?autoplay=1`}
                    title={p.title}
                    allow="autoplay; fullscreen"
                    allowFullScreen
                  />
                </div>
              </div>
            ) : p.videos.length > 0 ? (
              <div className="pdm-video-section">
                <div className="pdm-video-placeholder">
                  <span className="pdm-gallery-icon">&#9654;</span>
                  <span className="pdm-gallery-label">Video demo</span>
                </div>
              </div>
            ) : null}

            {/* Story / Case study */}
            <div className="pdm-story">
              {sections.map((section, i) => (
                <p key={i} className="pdm-story-paragraph">{section}</p>
              ))}
            </div>

            {/* Tech stack */}
            <div className="pdm-tech">
              <h4 className="pdm-tech-label">Công cụ sử dụng</h4>
              <div className="pdm-tech-list">
                {p.tools.map((tool) => (
                  <span key={tool} className="pdm-tech-item">{tool}</span>
                ))}
              </div>
            </div>

            {/* Contact */}
            {p.contact && (
              <div className="pdm-contact">
                <h4 className="pdm-tech-label">Lien he</h4>
                <div className="pdm-contact-list">
                  {p.contact.linkedin && (
                    <a className="pdm-contact-item" href={p.contact.linkedin} target="_blank" rel="noopener noreferrer">
                      <span className="pdm-contact-icon">
                        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z"/></svg>
                      </span> LinkedIn
                    </a>
                  )}
                  {p.contact.github && (
                    <a className="pdm-contact-item" href={p.contact.github} target="_blank" rel="noopener noreferrer">
                      <span className="pdm-contact-icon">
                        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.04-.02-2.05-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.21.09 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5.99.11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.34-5.47-5.96 0-1.32.47-2.39 1.24-3.23-.12-.31-.54-1.53.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6.01 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.24 2.87.12 3.18.77.84 1.24 1.91 1.24 3.23 0 4.63-2.81 5.65-5.49 5.95.43.37.81 1.1.81 2.22 0 1.6-.01 2.89-.01 3.29 0 .32.22.7.83.58A12.01 12.01 0 0 0 24 12.5C24 5.87 18.63.5 12 .5z"/></svg>
                      </span> GitHub
                    </a>
                  )}
                  {p.contact.email && (
                    <a className="pdm-contact-item" href={`mailto:${p.contact.email}`}>
                      <span className="pdm-contact-icon">
                        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"/></svg>
                      </span> {p.contact.email}
                    </a>
                  )}
                  {p.contact.phone && (
                    <a className="pdm-contact-item" href={`tel:${p.contact.phone.replace(/\s/g, '')}`}>
                      <span className="pdm-contact-icon">
                        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6.62 10.79a15.53 15.53 0 0 0 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1C10.07 21 3 13.93 3 5c0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.24.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
                      </span> {p.contact.phone}
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="pdm-actions">
              {p.websiteUrl && p.category !== 'video' && (
                <a
                  href={p.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pdm-btn pdm-btn--primary"
                >
                  {linkLabels[p.category] ?? 'Xem website demo →'}
                </a>
              )}
              <button className="pdm-btn pdm-btn--secondary" onClick={onClose}>
                Quay lại sân khấu
              </button>
            </div>
      </div>
    </div>
  )
}
