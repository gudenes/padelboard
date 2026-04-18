'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useDraftMatch } from '@/hooks/useDraftMatch'
import { clearDraftToken, getDraftToken } from '@/lib/draft-token'
import type { MatchRow } from '@/types/match'
import { TeamCard } from '@/components/builder/TeamCard'
import { FormatSection } from '@/components/builder/FormatSection'
import { OverlaySection } from '@/components/builder/OverlaySection'
import { MinimalChip } from '@/components/overlay/MinimalChip'
import { Button } from '@/components/ui/Button'
import { AuthWallModal } from '@/components/auth/AuthWallModal'

export function Builder({ initial }: { initial: MatchRow }) {
  const { row, patch } = useDraftMatch(initial)
  const [authOpen, setAuthOpen] = useState(false)
  const params = useSearchParams()

  // Post-magic-link: finalize profile + claim draft.
  useEffect(() => {
    if (params.get('complete') !== '1') return
    const raw = localStorage.getItem('padelboard:pendingProfile')
    const matchId = localStorage.getItem('padelboard:claimMatchId')
    if (!raw || !matchId) return
    const { name, role } = JSON.parse(raw)
    const token = getDraftToken(matchId)
    fetch('/api/profile/complete', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name, role, matchId, draftToken: token }),
    }).then(async (r) => {
      if (r.ok) {
        localStorage.removeItem('padelboard:pendingProfile')
        localStorage.removeItem('padelboard:claimMatchId')
        clearDraftToken(matchId)
        location.href = `/m/${initial.short_code}`
      }
    })
  }, [params, initial.short_code])

  return (
    <main className="min-h-screen bg-[var(--color-bg)] p-7">
      <div className="max-w-[1320px] mx-auto">
        <Header row={row} />
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl overflow-hidden shadow-sm grid grid-cols-1 md:grid-cols-[1.15fr_1fr]">
          <div className="p-7 md:p-8 border-r border-[var(--color-border)]">
            <section className="mb-8">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)] mb-3.5">
                Teams &amp; players
              </h3>
              <TeamCard
                label="Team A"
                value={row.teams.a}
                onChange={(a) => patch({ teams: { ...row.teams, a } })}
              />
              <TeamCard
                label="Team B"
                value={row.teams.b}
                onChange={(b) => patch({ teams: { ...row.teams, b } })}
              />
            </section>
            <FormatSection value={row.config} onChange={(config) => patch({ config })} />
            <OverlaySection value={row.overlay} onChange={(overlay) => patch({ overlay })} />
          </div>
          <div className="p-7 md:p-8 bg-[#fafbf6]">
            <div className="text-xs text-[var(--color-muted)] mb-2.5 flex justify-between">
              <span>Live preview</span>
              <span className="bg-[var(--color-lime-tint)] px-2 py-0.5 rounded text-[11px] font-semibold">
                Minimal Chip
              </span>
            </div>
            <div className="relative aspect-video rounded-xl overflow-hidden bg-gradient-to-b from-[#4a5c3a] via-[#2d3a26] to-[#1e2619]">
              <MinimalChip row={row} />
            </div>
            <div className="mt-3.5 p-3 bg-white border border-[var(--color-border)] rounded-lg flex justify-between text-xs text-[var(--color-muted)]">
              <span>Overlay URL</span>
              <code className="bg-[var(--color-bg)] px-1.5 py-0.5 rounded text-[var(--color-text)] text-[11px] font-mono">
                padelboard.padellabs.tech/overlay/{row.short_code}
              </code>
            </div>
          </div>
        </div>
        <footer className="flex justify-between items-center py-5 px-8 border border-t-0 border-[var(--color-border)] bg-[var(--color-surface)] rounded-b-3xl -mt-[1px]">
          <span className="text-sm text-[var(--color-muted)]">
            Keep building — your OBS link is one click away.
          </span>
          <Button onClick={() => setAuthOpen(true)}>Get my OBS link →</Button>
        </footer>
      </div>
      <AuthWallModal open={authOpen} onClose={() => setAuthOpen(false)} matchId={row.id} />
    </main>
  )
}

function Header({ row }: { row: MatchRow }) {
  const title = `${row.teams.a.name || 'Team A'} vs ${row.teams.b.name || 'Team B'}`
  return (
    <div className="flex justify-between items-start mb-4 px-1">
      <div>
        <div className="text-xs text-[var(--color-muted)] mb-0.5">New match</div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      </div>
      <div className="text-xs text-[var(--color-muted)] flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-lime)] shadow-[0_0_0_3px_rgba(196,216,46,0.25)]" />
        Draft · autosaved
      </div>
    </div>
  )
}
