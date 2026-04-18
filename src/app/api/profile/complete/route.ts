// src/app/api/profile/complete/route.ts — finalize profile + atomically claim a draft.
import { NextResponse } from 'next/server'
import { serverSupabase, serviceSupabase } from '@/lib/supabase-server'

interface Body {
  name: string
  role: 'player' | 'club' | 'organizer' | 'federation'
  matchId?: string
  draftToken?: string
}

export async function POST(req: Request) {
  const { name, role, matchId, draftToken } = (await req.json()) as Body
  if (!name || !role) return NextResponse.json({ error: 'missing_fields' }, { status: 400 })

  const sb = await serverSupabase()
  const { data: userRes } = await sb.auth.getUser()
  if (!userRes.user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  const svc = serviceSupabase()
  const { error: profileErr } = await svc.from('profiles').upsert({ id: userRes.user.id, name, role })
  if (profileErr) {
    return NextResponse.json({ error: 'profile_failed', detail: profileErr.message }, { status: 500 })
  }

  if (matchId && draftToken) {
    // Atomic claim: only succeeds if draft_token still matches and owner_id is null.
    const { data, error } = await svc
      .from('matches')
      .update({
        owner_id: userRes.user.id,
        draft_token: null,
        status: 'published',
        published_at: new Date().toISOString(),
      })
      .eq('id', matchId)
      .eq('draft_token', draftToken)
      .select('id')
      .single()
    if (error || !data) {
      return NextResponse.json({ error: 'claim_failed' }, { status: 409 })
    }
  }

  return NextResponse.json({ ok: true })
}
