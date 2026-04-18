// src/app/auth/callback/route.ts — Supabase magic-link callback.
// Exchanges the code for a session, then redirects back to the builder
// with ?complete=1 so the client-side code can finalize profile + claim match.
import { NextResponse } from 'next/server'
import { serverSupabase, serviceSupabase } from '@/lib/supabase-server'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const matchId = url.searchParams.get('match')

  const sb = await serverSupabase()
  if (code) {
    const { error } = await sb.auth.exchangeCodeForSession(code)
    if (error) {
      return NextResponse.redirect(`${url.origin}/?auth_error=${encodeURIComponent(error.message)}`)
    }
  }

  const { data: userRes } = await sb.auth.getUser()
  if (!userRes.user) {
    return NextResponse.redirect(`${url.origin}/?auth_error=no_session`)
  }

  if (!matchId) return NextResponse.redirect(`${url.origin}/dashboard`)

  const svc = serviceSupabase()
  const { data } = await svc.from('matches').select('short_code').eq('id', matchId).single()
  const shortCode = data?.short_code
  if (!shortCode) return NextResponse.redirect(`${url.origin}/dashboard`)

  return NextResponse.redirect(`${url.origin}/m/${shortCode}?complete=1`)
}
