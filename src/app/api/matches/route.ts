// src/app/api/matches/route.ts — Create a new draft match.
import { NextResponse } from 'next/server'
import { serviceSupabase } from '@/lib/supabase-server'
import { generateShortCode } from '@/lib/short-code'
import { generateDraftToken } from '@/lib/draft-token'
import { createInitialState } from '@/lib/padel-scoring'
import { defaultConfig, defaultOverlay, defaultTeams } from '@/types/match'

export async function POST() {
  const sb = serviceSupabase()
  const config = defaultConfig()

  // Retry on short-code collision (very rare with 32^6 = ~1B possibilities).
  for (let attempt = 0; attempt < 3; attempt++) {
    const payload = {
      short_code: generateShortCode(),
      draft_token: generateDraftToken(),
      status: 'draft' as const,
      config,
      state: createInitialState(config),
      teams: defaultTeams(),
      overlay: defaultOverlay(),
    }

    const { data, error } = await sb
      .from('matches')
      .insert(payload)
      .select('id, short_code, draft_token')
      .single()

    if (!error && data) {
      return NextResponse.json({
        id: data.id,
        shortCode: data.short_code,
        draftToken: data.draft_token,
      })
    }
    if (error?.code === '23505') continue // unique violation → retry with new code
    console.error('[api/matches] create failed', error)
    return NextResponse.json({ error: 'create_failed' }, { status: 500 })
  }
  return NextResponse.json({ error: 'short_code_collision' }, { status: 500 })
}
