import { notFound } from 'next/navigation'
import { serviceSupabase } from '@/lib/supabase-server'
import type { MatchRow } from '@/types/match'
import { OverlayClient } from './OverlayClient'

export const dynamic = 'force-dynamic'

export default async function OverlayPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const sb = serviceSupabase()
  const { data, error } = await sb.from('matches').select('*').eq('short_code', code).single()
  if (error || !data) return notFound()
  return <OverlayClient initial={data as unknown as MatchRow} />
}
