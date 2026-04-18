// src/hooks/useDraftMatch.ts — load a draft + debounce PATCHes to /api/matches/[id].
'use client'
import { useEffect, useRef, useState } from 'react'
import { getDraftToken } from '@/lib/draft-token'
import type { MatchRow } from '@/types/match'
import type { MatchConfig } from '@/lib/padel-scoring'

type PatchInput = {
  teams?: MatchRow['teams']
  overlay?: MatchRow['overlay']
  config?: MatchConfig
  tournamentLabel?: string
}

export function useDraftMatch(initial: MatchRow) {
  const [row, setRow] = useState<MatchRow>(initial)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pending = useRef<PatchInput>({})

  function patch(input: PatchInput) {
    setRow((prev) => ({
      ...prev,
      ...(input.teams ? { teams: input.teams } : {}),
      ...(input.overlay ? { overlay: input.overlay } : {}),
      ...(input.config ? { config: input.config } : {}),
      ...(input.tournamentLabel !== undefined ? { tournament_label: input.tournamentLabel } : {}),
    }))
    // Coalesce rapid edits into a single PATCH
    pending.current = { ...pending.current, ...input }
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(flush, 400)
  }

  async function flush() {
    const token = getDraftToken(initial.id)
    if (!token) return
    const body = { draftToken: token, ...pending.current }
    pending.current = {}
    await fetch(`/api/matches/${initial.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  return { row, patch }
}
