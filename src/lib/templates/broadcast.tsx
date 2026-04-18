// src/lib/templates/broadcast.tsx — WPT-inspired. Bold 3-column.
import type { Template, TemplateRendererProps } from './types'

export const broadcast: Template = {
  id: 'broadcast',
  name: 'Broadcast',
  description: 'Bold 3-column. Highest visibility. WPT-inspired.',
  defaults: {
    colors: {
      playerRow: { bg: '#0a3d91', text: '#ffffff' },
      gamesCol: { bg: '#ffffff', text: '#0a3d91' },
      scoreAccent: { bg: '#ffcf2e', text: '#0a3d91' },
      serverDot: { color: '#ffcf2e' },
      statusBadge: { bg: '#c4d82e', text: '#1a1d1a' },
      divider: { color: 'rgba(255,255,255,0.15)' },
    },
  },
  slots: [
    { key: 'playerRow', label: 'Player rows', fields: ['bg', 'text'] },
    { key: 'gamesCol', label: 'Games column', fields: ['bg', 'text'] },
    { key: 'scoreAccent', label: 'Score accent', fields: ['bg', 'text'] },
    { key: 'serverDot', label: 'Server dot', fields: ['color'] },
    { key: 'statusBadge', label: 'Status badges', fields: ['bg', 'text'] },
    { key: 'divider', label: 'Dividers', fields: ['color'] },
  ],
  Renderer: BroadcastRenderer,
}

function BroadcastRenderer({ row, colors }: TemplateRendererProps) {
  const { state, teams, overlay } = row
  const cg = state.currentGame as { a: number | string; b: number | string }
  const serveTeam = state.servingTeam
  const sets = state.sets
  const setCount = Math.max(sets.length, 1)

  const posStyle: React.CSSProperties = {
    top: overlay.position.startsWith('top') ? 20 : undefined,
    bottom: overlay.position.startsWith('bottom') ? 20 : undefined,
    left: overlay.position.endsWith('left') ? 20 : undefined,
    right: overlay.position.endsWith('right') ? 20 : undefined,
    transform: `scale(${overlay.scale})`,
    transformOrigin: overlay.position.replace('-', ' '),
  }

  return (
    <div className="absolute font-[var(--font-sans)]" style={posStyle}>
      <div
        className="grid grid-cols-[1fr_auto_auto] rounded-lg overflow-hidden shadow-[0_6px_20px_rgba(0,0,0,0.45)]"
        style={{ background: colors.playerRow.bg, color: colors.playerRow.text }}
      >
        <div className="flex flex-col">
          <Row top team="a" teams={teams} serving={serveTeam === 'a'} colors={colors} />
          <Row team="b" teams={teams} serving={serveTeam === 'b'} colors={colors} />
        </div>

        {Array.from({ length: setCount }, (_, i) => (
          <div key={i} className="flex flex-col">
            <GameCell val={sets[i]?.a ?? 0} colors={colors} />
            <GameCell val={sets[i]?.b ?? 0} colors={colors} bordered />
          </div>
        ))}

        <div
          className="flex flex-col justify-center items-center min-w-[42px]"
          style={{ background: colors.scoreAccent.bg, color: colors.scoreAccent.text }}
        >
          <div className="flex-1 flex items-center justify-center py-1.5 font-extrabold text-[13px] w-full">
            {cg.a}
          </div>
          <div
            className="flex-1 flex items-center justify-center py-1.5 font-extrabold text-[13px] w-full"
            style={{ borderTop: `1px solid rgba(0,0,0,0.15)` }}
          >
            {cg.b}
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({
  top, team, teams, serving, colors,
}: {
  top?: boolean
  team: 'a' | 'b'
  teams: { a: { name: string }; b: { name: string } }
  serving: boolean
  colors: Record<string, Record<string, string>>
}) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 text-[12px] font-bold"
      style={top ? { borderBottom: `1px solid ${colors.divider.color}` } : undefined}
    >
      <span
        className="w-[5px] h-[5px] rounded-full"
        style={{ background: serving ? colors.serverDot.color : 'transparent' }}
      />
      {teams[team].name || (team === 'a' ? 'Team A' : 'Team B')}
    </div>
  )
}

function GameCell({
  val, colors, bordered,
}: {
  val: number
  colors: Record<string, Record<string, string>>
  bordered?: boolean
}) {
  return (
    <div
      className="flex items-center justify-center px-2.5 py-2 text-[12px] font-bold min-w-[28px]"
      style={{
        background: colors.gamesCol.bg,
        color: colors.gamesCol.text,
        borderLeft: `1px solid ${colors.gamesCol.text}22`,
        borderTop: bordered ? `1px solid ${colors.gamesCol.text}22` : undefined,
      }}
    >
      {val}
    </div>
  )
}
