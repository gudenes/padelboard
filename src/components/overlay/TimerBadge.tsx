'use client'
import { useEffect, useState } from 'react'

export function TimerBadge({
  startedAt,
  tournament,
  round,
}: {
  startedAt: string | null
  tournament?: string
  round?: string
}) {
  const [elapsed, setElapsed] = useState('')

  useEffect(() => {
    if (!startedAt) return
    const start = new Date(startedAt).getTime()
    const tick = () => setElapsed(formatHHMMSS(Date.now() - start))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [startedAt])

  const parts = [startedAt && `⏱ ${elapsed}`, tournament, round].filter(Boolean)
  if (parts.length === 0) return null

  return (
    <div className="inline-block px-2.5 py-1 rounded-md bg-black/85 text-white text-[11px] font-medium tabular-nums tracking-wider">
      {parts.join(' · ')}
    </div>
  )
}

function formatHHMMSS(ms: number): string {
  const s = Math.floor(ms / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${pad(h)}:${pad(m)}:${pad(sec)}`
}
