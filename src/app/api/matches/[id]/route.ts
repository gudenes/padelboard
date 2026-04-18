// src/app/api/matches/[id]/route.ts — PATCH a draft match (draft-token auth).
import { NextResponse } from 'next/server'
import { serviceSupabase } from '@/lib/supabase-server'
import { createInitialState, type MatchConfig } from '@/lib/padel-scoring'
import type { OverlayJson, TeamsJson } from '@/types/match'

interface PatchBody {
  draftToken: string
  teams?: TeamsJson
  overlay?: OverlayJson
  config?: MatchConfig
  tournamentLabel?: string
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const body = (await req.json()) as PatchBody

  if (!body?.draftToken) {
    return NextResponse.json({ error: 'missing_token' }, { status: 401 })
  }

  const sb = serviceSupabase()
  const { data: row, error: fetchErr } = await sb
    .from('matches')
    .select('id, status, draft_token')
    .eq('id', id)
    .single()

  if (fetchErr || !row) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  if (row.status !== 'draft') return NextResponse.json({ error: 'not_a_draft' }, { status: 409 })
  if (row.draft_token !== body.draftToken) {
    return NextResponse.json({ error: 'bad_token' }, { status: 403 })
  }

  const patch: Record<string, unknown> = {}
  if (body.teams) patch.teams = body.teams
  if (body.overlay) patch.overlay = body.overlay
  if (body.tournamentLabel !== undefined) patch.tournament_label = body.tournamentLabel
  // Changing config rebuilds the initial state so they stay in sync.
  if (body.config) {
    patch.config = body.config
    patch.state = createInitialState(body.config)
  }

  const { error: updErr } = await sb.from('matches').update(patch).eq('id', id)
  if (updErr) return NextResponse.json({ error: 'update_failed' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
