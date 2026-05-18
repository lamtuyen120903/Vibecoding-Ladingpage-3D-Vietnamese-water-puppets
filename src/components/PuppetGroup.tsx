import { useMemo, useState } from 'react'
import type { ActId, StagePhase } from '../App'
import type { Project } from '../data/projects'
import { getProjectsByCategory, projects } from '../data/projects'
import Puppet from './Puppet'
import type { PuppetConfig } from './Puppet'

interface Props {
  currentAct: ActId
  phase: StagePhase
  onPuppetClick: (project: Project) => void
  onPuppetHover: (id: string | null) => void
}

// Personal info "project" for intro act
const introProject: Project = {
  id: 'intro-personal',
  title: 'Xin chao — Gioi thieu',
  category: 'analysis',
  shortDescription: 'Toi la mot nguoi xay dung Analysis, Automation va AI — nhung mach ngam phia sau san khau.',
  storyText: `Phia truoc la chuyen dong. Phia sau la he thong.\n\nToi lam viec voi du lieu, tu dong hoa quy trinh, va ung dung AI de tao ra nhung he thong chay ngam — chinh xac, nhip nhang, va hieu qua.\n\nPortfolio nay la mot buoi bieu dien mua roi nuoc — moi man dien la mot goc nhin vao cong viec cua toi.`,
  tools: ['Analysis', 'Automation', 'AI', 'n8n', 'Three.js'],
  images: [],
  videos: [],
  websiteUrl: '',
  featured: true,
}

export default function PuppetGroup({ currentAct, phase, onPuppetClick, onPuppetHover }: Props) {
  const [highlightedId, setHighlightedId] = useState<string | null>(null)

  // During opening: show ALL puppets dancing together
  // During performing: show only current act's puppets
  const configs = useMemo(() => {
    if (phase === 'opening') {
      // All puppets on stage, all dancing
      const all = [
        makeIntroConfig(),
        ...makeAutomationConfigs(),
        ...makeAIConfigs(),
      ]
      return all.map(cfg => ({
        ...cfg,
        animation: 'dance',
        animationSpeed: 1,
        animationOffset: 0,
      }))
    }
    if (currentAct === 'intro') {
      return [makeIntroConfig()]
    }
    if (currentAct === 'automation') {
      return makeAutomationConfigs()
    }
    return makeAIConfigs()
  }, [currentAct, phase])

  const projectMap = useMemo(() => {
    const map: Record<string, Project> = { 'intro-personal': introProject }
    projects.forEach(p => { map[p.id] = p })
    return map
  }, [])

  return (
    <group>
      {configs.map(cfg => (
        <Puppet
          key={cfg.id}
          config={cfg}
          highlighted={highlightedId === cfg.id}
          onClick={() => {
            const proj = projectMap[cfg.id]
            if (proj) onPuppetClick(proj)
          }}
          onHover={(h) => {
            setHighlightedId(h ? cfg.id : null)
            onPuppetHover(h ? cfg.id : null)
          }}
        />
      ))}
    </group>
  )
}

// Màn 1: Giới thiệu — 1 rối chính cúi chào + vẫy tay
function makeIntroConfig(): PuppetConfig {
  return {
    id: 'intro-personal',
    position: [0, -0.5, 1],
    skin: '#d4a070',
    outfit: '#a82020',
    outfitSecondary: '#c8a040',
    headwear: '#8b1a1a',
    scale: 0.95,
    animation: 'dance',
    animationSpeed: 1,
    animationOffset: 0,
  }
}

// Màn 2: Automation — toàn bộ rối múa "dance" đồng đều
function makeAutomationConfigs(): PuppetConfig[] {
  const projs = getProjectsByCategory('automation')
  const outfits = ['#1a6a5a', '#8a2020', '#2a4a8a', '#6a3a1a', '#1a5a3a', '#5a1a5a']
  const secondaries = ['#c8a040', '#1a6a5a', '#c4953a', '#2a6a4a', '#8a6a30', '#c87040']
  const headwears = ['#8b1a1a', '#1a5a3a', '#c4953a', '#2a3a6a', '#6a3a1a', '#3a1a4a']

  return projs.map((p, i) => {
    const cols = projs.length
    const spacing = Math.min(1.2, 5 / cols)
    const startX = -((cols - 1) * spacing) / 2
    return {
      id: p.id,
      position: [startX + i * spacing, -0.5, 0.8 + (i % 2) * 0.6] as [number, number, number],
      skin: '#d4a070',
      outfit: outfits[i % outfits.length],
      outfitSecondary: secondaries[i % secondaries.length],
      headwear: headwears[i % headwears.length],
      scale: 0.8,
      animation: 'dance',
      animationSpeed: 1,
      animationOffset: 0,
      groupIndex: i,
      groupTotal: cols,
    }
  })
}

// Màn 3: Vibe Coding — toàn bộ rối múa "dance" đồng đều
function makeAIConfigs(): PuppetConfig[] {
  const projs = getProjectsByCategory('ai')

  return projs.map((p, i) => {
    const cols = projs.length
    const spacing = 1.8
    const startX = -((cols - 1) * spacing) / 2
    return {
      id: p.id,
      position: [startX + i * spacing, -0.5, 1] as [number, number, number],
      skin: '#d4a070',
      outfit: '#2a3a6a',
      outfitSecondary: '#c4953a',
      headwear: '#c4953a',
      scale: 0.85,
      animation: 'dance',
      animationSpeed: 1,
      animationOffset: 0,
    }
  })
}
