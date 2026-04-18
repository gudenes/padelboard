// src/hooks/useMatchState.ts — subscribe to a match row via Supabase Realtime.
'use client'
import { useEffect, useState } from 'react'
import { browserSupabase } from '@/lib/supabase'
import type { MatchRow } from '@/types/match'

export function useMatchState(matchId: string, initial: MatchRow): MatchRow {
  const [row, setRow] = useState<MatchRow>(initial)

  useEffect(() => {
    const sb = browserSupabase()
    const chan = sb
      .channel(`match:${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'matches',
          filter: `id=eq.${matchId}`,
        },
        (payload) => {
          setRow((prev) => ({ ...prev, ...(payload.new as Partial<MatchRow>) }))
        },
      )
      .subscribe()
    return () => {
      void sb.removeChannel(chan)
    }
  }, [matchId])

  return row
}
