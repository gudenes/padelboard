'use client'
import { useState } from 'react'
import { QRCode } from '@/components/ui/QRCode'
import { Button } from '@/components/ui/Button'

export function ShareDialog({
  open,
  onClose,
  shortCode,
}: {
  open: boolean
  onClose: () => void
  shortCode: string
}) {
  const [copied, setCopied] = useState<'overlay' | 'control' | null>(null)
  if (!open) return null
  const origin = typeof window === 'undefined' ? '' : window.location.origin
  const overlay = `${origin}/overlay/${shortCode}`
  const control = `${origin}/m/${shortCode}`

  async function copy(text: string, which: 'overlay' | 'control') {
    await navigator.clipboard.writeText(text)
    setCopied(which)
    setTimeout(() => setCopied(null), 1500)
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-md w-full p-7 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold mb-3">Share your scoreboard</h2>
        <div className="space-y-4 text-sm">
          <div>
            <div className="text-xs text-[var(--color-muted)] mb-1.5">Paste into OBS as a browser source</div>
            <div className="flex gap-2">
              <code className="flex-1 bg-[var(--color-bg)] px-2.5 py-2 rounded font-mono text-[12px] break-all">
                {overlay}
              </code>
              <Button variant="ghost" onClick={() => copy(overlay, 'overlay')}>
                {copied === 'overlay' ? '✓' : 'Copy'}
              </Button>
            </div>
          </div>
          <div>
            <div className="text-xs text-[var(--color-muted)] mb-1.5">Open on your phone to control the score</div>
            <div className="flex gap-2 items-start">
              <code className="flex-1 bg-[var(--color-bg)] px-2.5 py-2 rounded font-mono text-[12px] break-all">
                {control}
              </code>
              <Button variant="ghost" onClick={() => copy(control, 'control')}>
                {copied === 'control' ? '✓' : 'Copy'}
              </Button>
            </div>
            <div className="mt-3 flex justify-center">
              <QRCode value={control} size={180} />
            </div>
          </div>
        </div>
        <div className="mt-5 text-right">
          <Button onClick={onClose}>Done</Button>
        </div>
      </div>
    </div>
  )
}
