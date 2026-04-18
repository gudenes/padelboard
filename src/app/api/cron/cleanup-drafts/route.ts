// src/app/api/cron/cleanup-drafts/route.ts — nightly cleanup of anonymous drafts >7 days old.
import { NextResponse } from 'next/server'
import { serviceSupabase } from '@/lib/supabase-server'

export async function GET(req: Request) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const svc = serviceSupabase()
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { error, count } = await svc
    .from('matches')
    .delete({ count: 'exact' })
    .eq('status', 'draft')
    .is('owner_id', null)
    .lt('created_at', sevenDaysAgo)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ deleted: count ?? 0 })
}
