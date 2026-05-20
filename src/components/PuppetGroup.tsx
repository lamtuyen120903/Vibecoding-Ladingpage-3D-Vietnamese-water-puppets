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
  title: 'Đặng Lam Tuyền',
  category: 'intro',
  shortDescription: '🤖 Marketing Growth | Automation (N8N) | AI Integration | E-commerce Growth | Vibe Coding',
  storyText: `Tôi thiết kế các giải pháp tự động hóa thông minh giúp doanh nghiệp phát triển và loại bỏ quy trình thủ công. Hãy nói chuyện về automation → github.com/lamtuyen120903 🚀

NHỮNG GÌ TÔI XÂY DỰNG:
• N8N automation workflows kết nối Zalo, Facebook, Telegram, và WordPress
• Telegram bots thu thập dữ liệu, tăng engagement khách hàng, và thúc đẩy chuyển đổi
• Giải pháp AI-powered: chatbots e-commerce, xử lý video, hệ thống dự đoán
• Business Intelligence dashboards chuyển đổi dữ liệu thành insight hành động
• Process automations giảm công việc thủ công 60%+ đồng thời cải thiện độ chính xác

💡 TÁC ĐỘNG:
✓ 20+ production workflows triển khai trên nhiều nền tảng
✓ Tăng 30% engagement rate thông qua smart automation
✓ Phát triển cộng đồng 20% thông qua chiến lược engagement có mục tiêu
✓ Tiết kiệm 60% thời gian trong các quy trình kinh doanh quan trọng`,
  tools: ['Marketing Growth', 'Automation', 'n8n', 'AI Integration', 'E-commerce', 'Vibe Coding'],
  images: ['/intro-portrait.jpg', '/intro-hoian.jpg'],
  videos: [],
  websiteUrl: '',
  featured: true,
  contact: {
    linkedin: 'https://www.linkedin.com/in/dang-lam-tuyen/',
    github: 'https://github.com/lamtuyen120903',
    email: 'danglamtuyen03@gmail.com',
    phone: '+84 843131739',
  },
}

export default function PuppetGroup({ currentAct, phase, onPuppetClick, onPuppetHover }: Props) {
  const [highlightedId, setHighlightedId] = useState<string | null>(null)

  // During opening: show ALL puppets dancing together
  // During performing: show only current act's puppets
  const configs = useMemo(() => {
    if (phase === 'opening') {
      // All puppets on stage, all dancing — mỗi nhóm canh giữa nên cần giãn
      // theo chiều sâu (z) + lệch ngang nhẹ để thành đám đông nhiều hàng,
      // tránh chồng khít lên nhau.
      const groups: { cfgs: PuppetConfig[]; z: number; x: number }[] = [
        { cfgs: makeActConfigs('automation'), z: 0, x: 0 },
        { cfgs: makeActConfigs('vibecoding'), z: 1.0, x: 0.45 },
        { cfgs: makeActConfigs('video'), z: 2.0, x: -0.45 },
      ]
      const all: PuppetConfig[] = [makeIntroConfig()]
      groups.forEach(({ cfgs, z, x }) => {
        cfgs.forEach(cfg => {
          all.push({
            ...cfg,
            position: [cfg.position[0] + x, cfg.position[1], cfg.position[2] + z],
          })
        })
      })
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
    return makeActConfigs(currentAct)
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
    scale: 1.3,
    animation: 'dance',
    animationSpeed: 1,
    animationOffset: 0,
  }
}

// Bảng màu trang phục riêng cho từng màn để dễ phân biệt thị giác
type ActCategory = 'automation' | 'vibecoding' | 'video'
const PALETTES: Record<ActCategory, { outfits: string[]; secondaries: string[]; headwears: string[] }> = {
  // Automation — teal / đỏ son / xanh navy / nâu gỗ
  automation: {
    outfits: ['#1a6a5a', '#8a2020', '#2a4a8a', '#6a3a1a', '#1a5a3a', '#5a1a5a'],
    secondaries: ['#c8a040', '#1a6a5a', '#c4953a', '#2a6a4a', '#8a6a30', '#c87040'],
    headwears: ['#8b1a1a', '#1a5a3a', '#c4953a', '#2a3a6a', '#6a3a1a', '#3a1a4a'],
  },
  // Vibe Coding — xanh dương / tím công nghệ
  vibecoding: {
    outfits: ['#2a3a8a', '#3a2a7a', '#1a5a8a', '#5a2a7a', '#2a6a7a', '#3a3a6a', '#4a2a6a'],
    secondaries: ['#c4953a', '#5ac8d0', '#c4953a', '#c8a040', '#5a9ad0', '#c4953a', '#a05ad0'],
    headwears: ['#c4953a', '#2a3a8a', '#c4953a', '#3a2a7a', '#c4953a', '#1a5a8a', '#c4953a'],
  },
  // Video AI — đỏ son / cam ấm / vàng đồng (tông điện ảnh)
  video: {
    outfits: ['#8a2020', '#a83020', '#7a1a3a', '#9a4020', '#8a2030', '#a82040', '#7a2a20'],
    secondaries: ['#c4953a', '#d4a94a', '#c87040', '#c4953a', '#d4a94a', '#c87040', '#c4953a'],
    headwears: ['#c4953a', '#8b1a1a', '#c4953a', '#a83020', '#c4953a', '#7a1a3a', '#c4953a'],
  },
}

// Dựng rối cho 1 màn — tự dàn hàng cân giữa, so le độ sâu (z) để không bị thẳng tắp.
function makeActConfigs(category: ActCategory): PuppetConfig[] {
  const projs = getProjectsByCategory(category)
  const pal = PALETTES[category]
  const cols = projs.length
  const maxWidth = 6.4 // ngân sách bề ngang sân khấu
  const spacing = Math.min(1.3, maxWidth / Math.max(1, cols))
  const startX = -((cols - 1) * spacing) / 2
  const scale = cols > 5 ? 0.95 : 1.1 // rối là chủ thể chính → to hơn; 7 rối thì nhỏ lại chút cho vừa khung

  return projs.map((p, i) => ({
    id: p.id,
    position: [startX + i * spacing, -0.5, 0.8 + (i % 2) * 0.6] as [number, number, number],
    skin: '#d4a070',
    outfit: pal.outfits[i % pal.outfits.length],
    outfitSecondary: pal.secondaries[i % pal.secondaries.length],
    headwear: pal.headwears[i % pal.headwears.length],
    scale,
    animation: 'dance',
    animationSpeed: 1,
    animationOffset: 0,
    groupIndex: i,
    groupTotal: cols,
  }))
}
