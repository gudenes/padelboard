// src/lib/templates/classic.tsx — FIP-inspired. Adds match timer + tournament strip.
'use client'
import { useEffect, useState } from 'react'
import type { Template, TemplateRendererProps } from './types'

export const classic: Template = {
  id: 'classic',
  name: 'Classic',
  description: 'Adds match timer + tournament label. Great for tournaments.',
  defaults: {
    colors: {
      timerChip: { bg: '#ffffff', text: '#1a1d1a' },
      boardBg: { bg: '#0f2b5b', text: '#ffffff' },
      divider: { color: 'rgba(255,255,255,0.1)' },
      statusBadge: { bg: '#c4d82e', text: '#1a1d1a' },
      tournamentStrip: { bg: '#0a1e42', text: '#ffffff' },
    },
  },
  slots: [
    { key: 'timerChip', label: 'Timer chip', fields: ['bg', 'text'] },
    { key: 'boardBg', label: 'Board', fields: ['bg', 'text'] },
    { key: 'divider', label: 'Dividers', fields: ['color'] },
    { key: 'statusBadge', label: 'Status badges', fields: ['bg', 'text'] },
    { key: 'tournamentStrip', label: 'Tournament strip', fields: ['bg', 'text'] },
  ],
  Renderer: ClassicRenderer,
}

function ClassicRenderer({ row, colors }: TemplateRendererProps) {
  const { state, teams, overlay } = row
  const cg = state.currentGame as { a: number | string; b: number | string }
  const sets = state.sets
  const setCount = Math.max(sets.length, 1)
  const elapsed = useElapsed(row.started_at)

  const posStyle: React.CSSProperties = {
    top: overlay.position.startsWith('top') ? 20 : undefined,
    bottom: overlay.position.startsWith('bottom') ? 20 : undefined,
    left: overlay.position.endsWith('left') ? 20 : undefined,
    right: overlay.position.endsWith('right') ? 20 : undefined,
    transform: `scale(${overlay.scale})`,
    transformOrigin: overlay.position.replace('-', ' '),
  }

  return (
    <div className="absolute" style={posStyle}>
      {overlay.showTimer && row.started_at && (
        <div
          className="inline-block px-2 py-1 rounded text-[11px] font-extrabold tabular-nums mb-1"
          style={{ background: colors.timerChip.bg, color: colors.timerChip.text }}
        >
          {elapsed}
        </div>
      )}
      <div
        className="rounded overflow-hidden min-w-[260px]"
        style={{ background: colors.boardBg.bg, color: colors.boardBg.text }}
      >
        <TeamRow team="a" teams={teams} sets={sets} points={cg.a} setCount={setCount} />
        <div style={{ height: 1, background: colors.divider.color }} />
        <TeamRow team="b" teams={teams} sets={sets} points={cg.b} setCount={setCount} />
      </div>
      {overlay.showTournament && (overlay.tournamentName || overlay.round) && (
        <div
          className="rounded mt-0.5 px-3 py-1 text-[10px] font-semibold tracking-wider uppercase"
          style={{ background: colors.tournamentStrip.bg, color: colors.tournamentStrip.text }}
        >
          {[overlay.tournamentName, overlay.round].filter(Boolean).join(' — ')}
        </div>
      )}
    </div>
  )
}

function TeamRow({
  team, teams, sets, points, setCount,
}: {
  team: 'a' | 'b'
  teams: { a: { name: string }; b: { name: string } }
  sets: Array<{ a: number; b: number }>
  points: number | string
  setCount: number
}) {
  return (
    <div className="flex items-center px-3 py-1.5 text-[12px] font-bold">
      <span className="flex-1 truncate mr-3">{teams[team].name || (team === 'a' ? 'Team A' : 'Team B')}</span>
      {Array.from({ length: setCount }, (_, i) => (
        <span key={i} className="w-6 text-center tabular-nums">{sets[i]?.[team] ?? 0}</span>
      ))}
      <span className="w-8 text-center tabular-nums font-extrabold">{points}</span>
    </div>
  )
}

function useElapsed(startedAt: string | null): string {
  const [elapsed, setElapsed] = useState('00:00')
  useEffect(() => {
    if (!startedAt) return
    const start = new Date(startedAt).getTime()
    const tick = () => {
      const ms = Date.now() - start
      const s = Math.floor(ms / 1000)
      const h = Math.floor(s / 3600)
      const m = Math.floor((s % 3600) / 60)
      const sec = s % 60
      const pad = (n: number) => String(n).padStart(2, '0')
      setElapsed(h > 0 ? `${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [startedAt])
  return elapsed
}
