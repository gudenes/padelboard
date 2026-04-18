// src/components/wizard/steps/StepPlayers.tsx — Step 2 of the wizard.
'use client'
import type { MatchRow, TeamJson, TeamsJson } from '@/types/match'
import { Input } from '@/components/ui/Input'

export function StepPlayers({
  row, onChange,
}: {
  row: MatchRow
  onChange: (patch: { teams: TeamsJson }) => void
}) {
  function updateTeam(side: 'a' | 'b', patch: Partial<TeamJson>) {
    onChange({ teams: { ...row.teams, [side]: { ...row.teams[side], ...patch } } })
  }

  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)] mb-1.5">
        Step 2 of 3
      </div>
      <h2 className="text-[24px] font-bold tracking-tight mb-1.5">Who&apos;s playing?</h2>
      <p className="text-[13px] text-[var(--color-muted)] mb-5">
        Enter team names and the two players per team. You can edit these later.
      </p>

      <TeamBlock
        label="Team A"
        dotColor="#0a3d91"
        team={row.teams.a}
        placeholder={{ team: 'Team A', p1: 'Player 1', p2: 'Player 2' }}
        onChange={(patch) => updateTeam('a', patch)}
      />
      <TeamBlock
        label="Team B"
        dotColor="#b91c1c"
        team={row.teams.b}
        placeholder={{ team: 'Team B', p1: 'Player 1', p2: 'Player 2' }}
        onChange={(patch) => updateTeam('b', patch)}
      />
    </div>
  )
}

function TeamBlock({
  label, dotColor, team, placeholder, onChange,
}: {
  label: string
  dotColor: string
  team: TeamJson
  placeholder: { team: string; p1: string; p2: string }
  onChange: (patch: Partial<TeamJson>) => void
}) {
  return (
    <div className="bg-white border border-[var(--color-border)] rounded-xl p-4 mb-3">
      <div className="flex items-center gap-2 mb-3 text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: dotColor }} />
        {label}
      </div>
      <label className="block text-[11.5px] text-[var(--color-muted)] mb-1.5 font-medium">Team name</label>
      <Input
        value={team.name}
        placeholder={placeholder.team}
        onChange={(e) => onChange({ name: e.target.value })}
      />
      <div className="grid grid-cols-2 gap-2.5 mt-3">
        <div>
          <label className="block text-[11.5px] text-[var(--color-muted)] mb-1.5 font-medium">Player 1</label>
          <Input
            value={team.players[0]}
            placeholder={placeholder.p1}
            onChange={(e) => onChange({ players: [e.target.value, team.players[1]] })}
          />
        </div>
        <div>
          <label className="block text-[11.5px] text-[var(--color-muted)] mb-1.5 font-medium">Player 2</label>
          <Input
            value={team.players[1]}
            placeholder={placeholder.p2}
            onChange={(e) => onChange({ players: [team.players[0], e.target.value] })}
          />
        </div>
      </div>
    </div>
  )
}
