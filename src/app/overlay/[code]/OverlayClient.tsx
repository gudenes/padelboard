'use client'
import { useEffect } from 'react'
import { useMatchState } from '@/hooks/useMatchState'
import { MinimalChip } from '@/components/overlay/MinimalChip'
import type { MatchRow } from '@/types/match'

export function OverlayClient({ initial }: { initial: MatchRow }) {
  useEffect(() => {
    document.documentElement.classList.add('overlay')
    return () => document.documentElement.classList.remove('overlay')
  }, [])

  const row = useMatchState(initial.id, initial)
  // v1 ships with Minimal Chip only; other templates locked to Pro.
  return (
    <main className="relative w-screen h-screen overflow-hidden">
      <MinimalChip row={row} />
    </main>
  )
}
