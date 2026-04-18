'use client'
import type { TemplateId } from '@/types/match'

interface Template {
  id: TemplateId
  name: string
  description: string
  tier: 'free' | 'pro'
  preview: React.ReactNode
}

const TEMPLATES: Template[] = [
  {
    id: 'minimal',
    name: 'Minimal Chip',
    description: 'Compact corner anchor. Modern, low-intrusion.',
    tier: 'free',
    preview: <MockChip />,
  },
  {
    id: 'broadcast',
    name: 'Broadcast Bar',
    description: 'Full-width bottom bar. DAZN / Premier Padel feel.',
    tier: 'pro',
    preview: <MockBar />,
  },
  {
    id: 'split',
    name: 'Split Badge',
    description: 'Centered broadcast badge. Lighter than Broadcast Bar.',
    tier: 'pro',
    preview: <MockSplit />,
  },
]

export function TemplateBrowser({
  open,
  value,
  onPick,
  onClose,
}: {
  open: boolean
  value: TemplateId
  onPick: (id: TemplateId) => void
  onClose: () => void
}) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[var(--color-surface)] rounded-[var(--radius-xl)] max-w-4xl w-full p-6 md:p-8 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-semibold">Browse templates</h2>
          <button onClick={onClose} className="text-[var(--color-muted)] hover:text-[var(--color-text)]">
            Close
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TEMPLATES.map((t) => {
            const isLocked = t.tier === 'pro'
            const isActive = value === t.id
            return (
              <button
                key={t.id}
                onClick={() => !isLocked && onPick(t.id)}
                className={`relative text-left p-4 rounded-xl border transition ${
                  isActive
                    ? 'border-[var(--color-lime)] ring-2 ring-[rgba(196,216,46,0.25)]'
                    : 'border-[var(--color-border)] hover:border-[var(--color-lime)]'
                } ${isLocked ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer'}`}
                disabled={isLocked}
              >
                {isLocked && (
                  <span className="absolute top-3 right-3 px-2 py-0.5 bg-[var(--color-lime-tint)] border border-[rgba(196,216,46,0.6)] text-[10px] font-bold uppercase tracking-wider rounded">
                    Pro
                  </span>
                )}
                <div className="h-32 bg-gradient-to-b from-[#4a5c3a] to-[#1e2619] rounded-lg mb-3 relative overflow-hidden">
                  {t.preview}
                </div>
                <h3 className="font-semibold text-[15px]">{t.name}</h3>
                <p className="text-xs text-[var(--color-muted)] mt-1 leading-snug">
                  {t.description}
                </p>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function MockChip() {
  return (
    <div className="absolute top-3 left-3 bg-white/95 rounded-md px-2 py-1 text-[9px]">
      ● Team A 6 40<br />
      &nbsp;&nbsp; Team B 4 30
    </div>
  )
}

function MockBar() {
  return (
    <div className="absolute left-3 right-3 bottom-3 bg-white/95 rounded-md py-1 px-2 text-[9px] flex justify-between">
      Team A · 6 40<span>|</span>Team B · 4 30
    </div>
  )
}

function MockSplit() {
  return (
    <div className="absolute left-1/2 -translate-x-1/2 bottom-3 flex gap-0">
      <span className="bg-white/95 px-2 py-1 rounded-l text-[9px]">Team A</span>
      <span className="bg-black text-white px-2 py-1 text-[9px]">6·4</span>
      <span className="bg-white/95 px-2 py-1 rounded-r text-[9px]">Team B</span>
    </div>
  )
}
