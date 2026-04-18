// src/app/m/[code]/page.tsx — routes to Builder (draft) or Operator (published).
import { notFound } from 'next/navigation'
import { serviceSupabase } from '@/lib/supabase'
import type { MatchRow } from '@/types/match'
import { Builder } from './Builder'
import { Operator } from './Operator'

export const dynamic = 'force-dynamic'

export default async function MatchPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const sb = serviceSupabase()
  const { data } = await sb.from('matches').select('*').eq('short_code', code).single()
  if (!data) return notFound()
  const row = data as unknown as MatchRow
  if (row.status === 'draft') return <Builder initial={row} />
  return <Operator initial={row} />
}
