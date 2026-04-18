// src/app/api/logo/route.ts — upload a logo to Supabase Storage.
import { NextResponse } from 'next/server'
import { serverSupabase, serviceSupabase } from '@/lib/supabase-server'

const MAX_BYTES = 2 * 1024 * 1024

export async function POST(req: Request) {
  const form = await req.formData()
  const file = form.get('file') as File | null
  const matchId = form.get('matchId') as string | null
  const draftToken = form.get('draftToken') as string | null

  if (!file) return NextResponse.json({ error: 'no_file' }, { status: 400 })
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'too_large' }, { status: 413 })

  // Auth: owner session OR draft token
  const svc = serviceSupabase()
  let ownerId: string | null = null
  let draftMatch: { draft_token: string } | null = null

  if (matchId) {
    const { data } = await svc.from('matches').select('owner_id, draft_token').eq('id', matchId).single()
    ownerId = data?.owner_id ?? null
    draftMatch = data?.draft_token ? { draft_token: data.draft_token } : null
  }

  let authorized = false
  if (ownerId) {
    const sb = await serverSupabase()
    const { data: userRes } = await sb.auth.getUser()
    authorized = userRes.user?.id === ownerId
  } else if (draftMatch && draftToken && draftToken === draftMatch.draft_token) {
    authorized = true
  }
  if (!authorized) return NextResponse.json({ error: 'unauthorized' }, { status: 403 })

  // Upload to Supabase Storage
  const ext = (file.name.split('.').pop() || 'png').toLowerCase()
  const path = `logos/${matchId ?? 'anon'}-${Date.now()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())
  const { error: upErr } = await svc.storage.from('assets').upload(path, buffer, {
    contentType: file.type,
    upsert: false,
  })
  if (upErr) {
    console.error('[api/logo] upload failed', upErr)
    return NextResponse.json({ error: 'upload_failed' }, { status: 500 })
  }
  const { data: pub } = svc.storage.from('assets').getPublicUrl(path)
  return NextResponse.json({ url: pub.publicUrl })
}
