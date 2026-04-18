// src/app/api/matches/[id]/action/route.ts — apply a scoring action.
// Auth: either the signed-in owner OR the draft-token holder (for drafts).
import { NextResponse } from 'next/server'
import { serverSupabase, serviceSupabase } from '@/lib/supabase'
import { apply, type Action, type MatchState } from '@/lib/padel-scoring'

interface Body {
  action: Action
  draftToken?: string
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { action, draftToken } = (await req.json()) as Body
  if (!action?.kind) return NextResponse.json({ error: 'bad_action' }, { status: 400 })

  const svc = serviceSupabase()
  const { data: row, error } = await svc
    .from('matches')
    .select('id, status, draft_token, owner_id, state, started_at')
    .eq('id', id)
    .single()
  if (error || !row) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  // Authorization
  let authorized = false
  if (row.owner_id) {
    const sb = await serverSupabase()
    const { data: userRes } = await sb.auth.getUser()
    authorized = userRes.user?.id === row.owner_id
  } else if (row.status === 'draft' && draftToken && draftToken === row.draft_token) {
    authorized = true
  }
  if (!authorized) return NextResponse.json({ error: 'unauthorized' }, { status: 403 })

  const currentState = row.state as MatchState
  const nextState = apply(currentState, action)

  const updates: Record<string, unknown> = { state: nextState }
  if (!row.started_at && isMatchStarted(nextState)) {
    updates.started_at = new Date().toISOString()
  }
  if (nextState.phase === 'finished') {
    updates.status = 'finished'
    updates.finished_at = new Date().toISOString()
  }

  const { error: updErr } = await svc.from('matches').update(updates).eq('id', id)
  if (updErr) return NextResponse.json({ error: 'update_failed' }, { status: 500 })

  // Append to event log (best-effort — don't fail the request if this fails)
  await svc.from('match_events').insert({
    match_id: id,
    kind: action.kind,
    payload: 'team' in action ? { team: action.team } : null,
    state_after: nextState,
  })

  return NextResponse.json({ state: nextState })
}

function isMatchStarted(state: MatchState): boolean {
  const g = state.currentGame as { a: number | string; b: number | string }
  const gameHasPoints = g.a !== 0 || g.b !== 0
  const anyGamesPlayed = state.sets.some((s) => s.a + s.b > 0)
  return gameHasPoints || anyGamesPlayed
}
