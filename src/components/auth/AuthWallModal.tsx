'use client'
import { useState } from 'react'
import { browserSupabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

type Role = 'player' | 'club' | 'organizer' | 'federation'

export function AuthWallModal({
  open,
  onClose,
  matchId,
}: {
  open: boolean
  onClose: () => void
  matchId: string
}) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<Role>('player')
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)

  if (!open) return null

  async function submit() {
    if (!email || !name) return
    setSending(true)
    // Stash profile fields + match id to apply on callback.
    // Use localStorage (not sessionStorage) — magic-link often opens in a new
    // tab, which has its own empty sessionStorage. localStorage is shared.
    localStorage.setItem('padelboard:pendingProfile', JSON.stringify({ name, role }))
    localStorage.setItem('padelboard:claimMatchId', matchId)
    const sb = browserSupabase()
    const redirectTo = `${location.origin}/auth/callback?match=${matchId}`
    await sb.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo, shouldCreateUser: true },
    })
    setSent(true)
    setSending(false)
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-md w-full p-7 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {sent ? (
          <div>
            <h2 className="text-xl font-semibold mb-2">Check your email</h2>
            <p className="text-sm text-[var(--color-muted)]">
              We sent a sign-in link to <strong>{email}</strong>. Click it to unlock your OBS link.
              Keep this tab open.
            </p>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-semibold mb-1.5">Get your OBS link</h2>
            <p className="text-sm text-[var(--color-muted)] mb-5">
              Free forever. Takes 10 seconds. Your scoreboard stays yours.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-[var(--color-muted)] mb-1.5">Email</label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--color-muted)] mb-1.5">Name</label>
                <Input
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--color-muted)] mb-1.5">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="w-full px-3.5 py-2.5 border border-[var(--color-border-strong)] bg-white rounded-[var(--radius-sm)] text-sm"
                >
                  <option value="player">Player</option>
                  <option value="club">Club</option>
                  <option value="organizer">Tournament organizer</option>
                  <option value="federation">Federation</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={submit} disabled={sending || !email || !name}>
                {sending ? 'Sending…' : 'Send magic link'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
