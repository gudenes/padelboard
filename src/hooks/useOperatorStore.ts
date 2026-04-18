// src/hooks/useOperatorStore.ts — Zustand store for the operator UI with optimistic writes.
'use client'
import { create } from 'zustand'
import type { Action, MatchState } from '@/lib/padel-scoring'
import { apply } from '@/lib/padel-scoring'

interface OperatorStore {
  state: MatchState | null
  pending: number
  setInitial: (s: MatchState) => void
  act: (matchId: string, action: Action) => Promise<void>
  acceptRemote: (s: MatchState) => void
}

export const useOperatorStore = create<OperatorStore>((set, get) => ({
  state: null,
  pending: 0,
  setInitial: (s) => set({ state: s }),
  acceptRemote: (s) => {
    // Only accept if we have no pending optimistic writes.
    if (get().pending === 0) set({ state: s })
  },
  act: async (matchId, action) => {
    const current = get().state
    if (!current) return
    // Optimistic update
    const optimistic = apply(current, action)
    set({ state: optimistic, pending: get().pending + 1 })
    try {
      const r = await fetch(`/api/matches/${matchId}/action`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const json = (await r.json()) as { state?: MatchState }
      if (r.ok && json.state) set({ state: json.state })
    } finally {
      set({ pending: Math.max(0, get().pending - 1) })
    }
  },
}))
