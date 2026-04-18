// src/app/api/palette/route.ts — Generate an AI palette from a logo URL.
import { NextResponse } from 'next/server'
import { generatePaletteFromLogo } from '@/lib/claude-palette'

const recentRequests = new Map<string, number[]>() // IP → timestamps (in-memory, dev-simple)

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const recent = (recentRequests.get(ip) ?? []).filter((t) => now - t < 60_000)
  recent.push(now)
  recentRequests.set(ip, recent)
  return recent.length > 10
}

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (isRateLimited(ip)) return NextResponse.json({ error: 'rate_limited' }, { status: 429 })

  const { logoUrl, templateId } = (await req.json()) as { logoUrl?: string; templateId?: string }
  if (!logoUrl || !templateId) return NextResponse.json({ error: 'missing_fields' }, { status: 400 })

  try {
    const result = await generatePaletteFromLogo(logoUrl, templateId)
    return NextResponse.json(result)
  } catch (err) {
    console.error('[api/palette] failed', err)
    return NextResponse.json({ error: 'ai_failed', detail: String(err) }, { status: 502 })
  }
}
