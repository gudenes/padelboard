// src/lib/templates/premier.tsx — Premier-inspired. Dark + gold, minimal.
import type { Template, TemplateRendererProps } from './types'

export const premier: Template = {
  id: 'premier',
  name: 'Premier',
  description: 'Dark + gold. Premium broadcast feel.',
  defaults: {
    colors: {
      board: { bg: '#0f0f0f', text: '#ffffff' },
      frame: { color: '#c4a860' },
      setScore: { text: '#c4a860' },
      currentPoints: { text: '#ffffff' },
      serverDot: { color: '#c4a860' },
      statusBadge: { bg: '#c4a860', text: '#0f0f0f' },
    },
  },
  slots: [
    { key: 'board', label: 'Board', fields: ['bg', 'text'] },
    { key: 'frame', label: 'Border', fields: ['color'] },
    { key: 'setScore', label: 'Set scores', fields: ['text'] },
    { key: 'currentPoints', label: 'Current points', fields: ['text'] },
    { key: 'serverDot', label: 'Server dot', fields: ['color'] },
    { key: 'statusBadge', label: 'Status badges', fields: ['bg', 'text'] },
  ],
  Renderer: PremierRenderer,
}

function PremierRenderer({ row, colors }: TemplateRendererProps) {
  const { state, teams, overlay } = row
  const cg = state.currentGame as { a: number | string; b: number | string }
  const sets = state.sets
  const setCount = Math.max(sets.length, 1)
  const serveTeam = state.servingTeam

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
      <div
        className="rounded px-3 py-2 min-w-[260px]"
        style={{
          background: colors.board.bg,
          color: colors.board.text,
          border: `1px solid ${colors.frame.color}`,
        }}
      >
        <TeamRow
          team="a" teams={teams} sets={sets} points={cg.a} setCount={setCount}
          serving={serveTeam === 'a'} colors={colors}
        />
        <TeamRow
          team="b" teams={teams} sets={sets} points={cg.b} setCount={setCount}
          serving={serveTeam === 'b'} colors={colors}
        />
      </div>
    </div>
  )
}

function TeamRow({
  team, teams, sets, points, setCount, serving, colors,
}: {
  team: 'a' | 'b'
  teams: { a: { name: string }; b: { name: string } }
  sets: Array<{ a: number; b: number }>
  points: number | string
  setCount: number
  serving: boolean
  colors: Record<string, Record<string, string>>
}) {
  return (
    <div className="flex items-center gap-2 py-1 text-[12px] font-bold">
      <span
        className="w-[5px] h-[5px] rounded-full"
        style={{ background: serving ? colors.serverDot.color : 'transparent' }}
      />
      <span className="flex-1 truncate">{teams[team].name || (team === 'a' ? 'Team A' : 'Team B')}</span>
      {Array.from({ length: setCount }, (_, i) => (
        <span
          key={i}
          className="w-6 text-center tabular-nums"
          style={{ color: colors.setScore.text }}
        >
          {sets[i]?.[team] ?? 0}
        </span>
      ))}
      <span
        className="w-7 text-center tabular-nums font-extrabold"
        style={{ color: colors.currentPoints.text }}
      >
        {points}
      </span>
    </div>
  )
}
