// src/app/dashboard/page.tsx — "My matches" list for signed-in users.
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { serverSupabase, serviceSupabase } from '@/lib/supabase-server'
import type { MatchRow } from '@/types/match'

export const dynamic = 'force-dynamic'

export default async function Dashboard() {
  const sb = await serverSupabase()
  const { data: userRes } = await sb.auth.getUser()
  if (!userRes.user) redirect('/')

  const svc = serviceSupabase()
  const { data } = await svc
    .from('matches')
    .select('*')
    .eq('owner_id', userRes.user.id)
    .order('created_at', { ascending: false })

  const rows = (data ?? []) as unknown as MatchRow[]

  return (
    <main className="min-h-screen p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-5">Your matches</h1>
      {rows.length === 0 && (
        <p className="text-[var(--color-muted)] text-sm">
          No matches yet.{' '}
          <Link href="/" className="underline">
            Create one
          </Link>
          .
        </p>
      )}
      <ul className="space-y-3">
        {rows.map((r) => (
          <li
            key={r.id}
            className="p-4 bg-white border border-[var(--color-border)] rounded-xl"
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="font-semibold">
                  {r.teams.a.name || 'Team A'} vs {r.teams.b.name || 'Team B'}
                </div>
                <div className="text-xs text-[var(--color-muted)] mt-0.5">
                  {r.status.toUpperCase()} · {new Date(r.created_at).toLocaleString()}
                </div>
              </div>
              <Link href={`/m/${r.short_code}`} className="text-sm underline">
                Open →
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </main>
  )
}
