'use client'
import { useEffect, useState } from 'react'
import type { MatchRow } from '@/types/match'
import { useOperatorStore } from '@/hooks/useOperatorStore'
import { useMatchState } from '@/hooks/useMatchState'
import { Button } from '@/components/ui/Button'
import { ShareDialog } from './ShareDialog'

export function Operator({ initial }: { initial: MatchRow }) {
  const row = useMatchState(initial.id, initial)
  const { state, setInitial, act, acceptRemote } = useOperatorStore()
  const [shareOpen, setShareOpen] = useState(false)

  useEffect(() => {
    setInitial(initial.state)
  }, [initial.state, setInitial])

  useEffect(() => {
    acceptRemote(row.state)
  }, [row.state, acceptRemote])

  if (!state) return null

  const cg = state.currentGame as { a: number | string; b: number | string }
  const scoreText = (t: 'a' | 'b') => {
    const sets = state.sets.map((s) => s[t]).join('·')
    return `${sets}·${cg[t]}`
  }

  return (
    <main className="min-h-screen bg-[var(--color-bg)] p-5 flex flex-col gap-4 max-w-sm mx-auto">
      <button
        onClick={() => setShareOpen(true)}
        className="text-left p-4 bg-white rounded-xl border border-[var(--color-border)]"
      >
        <div className="text-xs text-[var(--color-muted)] mb-1">Share OBS link</div>
        <div className="text-sm font-semibold truncate">
          {typeof window !== 'undefined' ? window.location.origin : ''}/overlay/{initial.short_code}
        </div>
      </button>

      <div className="bg-white rounded-xl border border-[var(--color-border)] p-4 text-sm">
        <div className="flex justify-between items-center mb-1">
          <span className="font-semibold">{initial.teams.a.name || 'Team A'}</span>
          <span className="tabular-nums">{scoreText('a')}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-semibold">{initial.teams.b.name || 'Team B'}</span>
          <span className="tabular-nums">{scoreText('b')}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={() => act(initial.id, { kind: 'point_for', team: 'a' })}
          className="h-28 text-base"
        >
          +1 {initial.teams.a.name || 'Team A'}
        </Button>
        <Button
          onClick={() => act(initial.id, { kind: 'point_for', team: 'b' })}
          className="h-28 text-base"
        >
          +1 {initial.teams.b.name || 'Team B'}
        </Button>
      </div>

      <Button variant="ghost" onClick={() => act(initial.id, { kind: 'undo' })}>
        ↶ Undo
      </Button>

      <SettingsDrawer matchId={initial.id} />
      <ShareDialog open={shareOpen} onClose={() => setShareOpen(false)} shortCode={initial.short_code} />
    </main>
  )
}

function SettingsDrawer({ matchId }: { matchId: string }) {
  const { act } = useOperatorStore()
  const [open, setOpen] = useState(false)
  if (!open)
    return (
      <Button variant="ghost" onClick={() => setOpen(true)}>
        ⚙ Settings
      </Button>
    )
  return (
    <div className="bg-white rounded-xl border border-[var(--color-border)] p-4 space-y-2">
      <button
        className="w-full text-left text-sm py-2"
        onClick={() => act(matchId, { kind: 'mark_retirement', team: 'a' })}
      >
        Team A retired
      </button>
      <button
        className="w-full text-left text-sm py-2"
        onClick={() => act(matchId, { kind: 'mark_retirement', team: 'b' })}
      >
        Team B retired
      </button>
      <button
        className="w-full text-left text-sm py-2"
        onClick={() => act(matchId, { kind: 'mark_walkover', team: 'b' })}
      >
        Walkover (A wins)
      </button>
      <button
        className="w-full text-left text-sm py-2"
        onClick={() => act(matchId, { kind: 'mark_walkover', team: 'a' })}
      >
        Walkover (B wins)
      </button>
      <button
        className="w-full text-left text-sm py-2 text-red-600"
        onClick={() => {
          if (confirm('Reset match?')) act(matchId, { kind: 'reset' })
        }}
      >
        Reset match
      </button>
      <button
        className="w-full text-right text-xs text-[var(--color-muted)]"
        onClick={() => setOpen(false)}
      >
        Close
      </button>
    </div>
  )
}
