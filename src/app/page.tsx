'use client'
import { useState } from 'react'
import { saveDraftToken } from '@/lib/draft-token'
import { Button } from '@/components/ui/Button'

export default function Home() {
  const [creating, setCreating] = useState(false)

  async function create() {
    setCreating(true)
    const r = await fetch('/api/matches', { method: 'POST' })
    const json = (await r.json()) as { id: string; shortCode: string; draftToken: string }
    saveDraftToken(json.id, json.draftToken)
    location.href = `/m/${json.shortCode}`
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <div className="max-w-xl">
        <h1 className="text-4xl font-bold tracking-tight mb-3">Padelboard</h1>
        <p className="text-lg text-[var(--color-muted)] mb-7">
          A free, padel-native streaming scoreboard. Golden point, super-tiebreak, doubles serve —
          all built in. Paste an OBS link, control from your phone.
        </p>
        <Button onClick={create} disabled={creating}>
          {creating ? 'Creating…' : 'Create a scoreboard →'}
        </Button>
        <p className="text-xs text-[var(--color-muted)] mt-4">Free forever. No signup to try.</p>
      </div>
    </main>
  )
}
