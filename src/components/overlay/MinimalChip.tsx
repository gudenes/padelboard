import type { MatchRow, TeamJson } from '@/types/match'
import { StatusBadges } from './StatusBadges'
import { TimerBadge } from './TimerBadge'

export function MinimalChip({ row }: { row: MatchRow }) {
  const { state, teams, overlay } = row
  const cg = state.currentGame as { a: number | string; b: number | string }
  const serveTeam = state.servingTeam

  const aSets = state.sets.map((s) => s.a)
  const bSets = state.sets.map((s) => s.b)

  return (
    <div
      className="absolute p-0 font-[var(--font-sans)] text-[var(--color-text)]"
      style={{
        top: overlay.position.startsWith('top') ? 20 : undefined,
        bottom: overlay.position.startsWith('bottom') ? 20 : undefined,
        left: overlay.position.endsWith('left') ? 20 : undefined,
        right: overlay.position.endsWith('right') ? 20 : undefined,
        transform: `scale(${overlay.scale})`,
        transformOrigin: overlay.position.replace('-', ' '),
      }}
    >
      <div className="bg-white/95 backdrop-blur rounded-xl p-3 shadow-[0_6px_24px_rgba(0,0,0,0.28)] min-w-[280px] flex flex-col gap-2.5">
        <TeamRow team={teams.a} serving={serveTeam === 'a'} sets={aSets} otherSets={bSets} points={cg.a} />
        <TeamRow team={teams.b} serving={serveTeam === 'b'} sets={bSets} otherSets={aSets} points={cg.b} />
      </div>
      <div className="mt-2.5 flex gap-2 items-center flex-wrap">
        {overlay.showTimer && (
          <TimerBadge
            startedAt={row.started_at}
            tournament={overlay.showTournament ? overlay.tournamentName : undefined}
            round={overlay.showTournament ? overlay.round : undefined}
          />
        )}
        <StatusBadges state={state} />
      </div>
    </div>
  )
}

function TeamRow({
  team,
  serving,
  sets,
  otherSets,
  points,
}: {
  team: TeamJson
  serving: boolean
  sets: number[]
  otherSets: number[]
  points: number | string
}) {
  return (
    <div className="flex items-center gap-2.5 text-[13px] font-semibold">
      <span
        className={`w-1.5 h-1.5 rounded-full ${serving ? '' : 'opacity-0'}`}
        style={{
          background: 'var(--color-lime)',
          boxShadow: serving ? '0 0 0 2px rgba(196,216,46,0.3)' : 'none',
        }}
      />
      <span className="w-[3px] h-[22px] rounded-sm" style={{ background: team.color }} />
      <div className="flex-1 leading-tight">
        {team.name || 'Team'}
        {team.country && (
          <small className="block text-[11px] font-medium text-[var(--color-muted)] mt-[1px]">
            {team.country}
          </small>
        )}
      </div>
      <div className="flex gap-0.5">
        {sets.map((s, i) => (
          <span
            key={i}
            className={`px-2 py-0.5 rounded-sm text-xs tabular-nums ${s > otherSets[i] ? 'bg-[var(--color-text)] text-white' : 'bg-[#f0f1ec]'}`}
          >
            {s}
          </span>
        ))}
      </div>
      <span
        className="px-2.5 py-0.5 rounded-sm text-[13px] font-bold tabular-nums"
        style={{ background: 'var(--color-lime)', color: 'var(--color-text)' }}
      >
        {points}
      </span>
    </div>
  )
}
