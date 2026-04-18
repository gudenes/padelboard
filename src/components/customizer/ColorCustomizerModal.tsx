// src/components/customizer/ColorCustomizerModal.tsx — full customizer flow.
'use client'
import { useState } from 'react'
import type { MatchRow, OverlayJson } from '@/types/match'
import { getTemplate } from '@/lib/templates/registry'
import { mergeColors } from '@/lib/templates/merge-colors'
import { getDraftToken } from '@/lib/draft-token'
import { Button } from '@/components/ui/Button'
import { StageCourt } from '@/components/wizard/StageCourt'
import { OverlayRenderer } from '@/components/overlay/OverlayRenderer'
import { LogoUploadZone } from './LogoUploadZone'
import { SlotCard } from './SlotCard'
import { AIResultCard } from './AIResultCard'

interface Palette {
  primary: string
  accent: string
  textOnPrimary: string
  textOnAccent: string
}

export function ColorCustomizerModal({
  open, onClose, row, onChange,
}: {
  open: boolean
  onClose: () => void
  row: MatchRow
  onChange: (patch: { overlay: OverlayJson }) => void
}) {
  const [uploading, setUploading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResult, setAiResult] = useState<{ palette: Palette; slotAssignments: Record<string, Record<string, string>>; reasoning: string } | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)

  if (!open) return null

  const template = getTemplate(row.overlay.template)
  if (!template) return null

  const effectiveColors = mergeColors(template.defaults.colors, row.overlay.customColors)

  async function handleUpload(file: File) {
    setUploading(true)
    setAiError(null)
    setAiResult(null)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('matchId', row.id)
      const dt = getDraftToken(row.id)
      if (dt) form.append('draftToken', dt)
      const r = await fetch('/api/logo', { method: 'POST', body: form })
      const json = await r.json()
      if (!r.ok) throw new Error(json.error ?? 'upload_failed')
      const nextOverlay = { ...row.overlay, tournamentLogoUrl: json.url as string }
      onChange({ overlay: nextOverlay })
      // Immediately kick off AI palette
      await generatePalette(json.url)
    } catch (err) {
      setAiError(String(err))
    } finally {
      setUploading(false)
    }
  }

  async function generatePalette(logoUrl: string) {
    if (!template) return
    setAiLoading(true)
    try {
      const r = await fetch('/api/palette', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ logoUrl, templateId: template.id }),
      })
      const json = await r.json()
      if (!r.ok) throw new Error(json.error ?? 'ai_failed')
      setAiResult(json)
    } catch (err) {
      setAiError(String(err))
    } finally {
      setAiLoading(false)
    }
  }

  function applyAI() {
    if (!aiResult) return
    onChange({ overlay: { ...row.overlay, customColors: aiResult.slotAssignments } })
  }

  function updateSlot(slotKey: string, value: Record<string, string>) {
    const nextCustom = { ...row.overlay.customColors, [slotKey]: { ...(row.overlay.customColors[slotKey] ?? {}), ...value } }
    onChange({ overlay: { ...row.overlay, customColors: nextCustom } })
  }

  function reset() {
    onChange({ overlay: { ...row.overlay, customColors: {} } })
    setAiResult(null)
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-[880px] w-full max-h-[90vh] overflow-auto shadow-[0_30px_80px_rgba(0,0,0,0.3)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-7 pt-6 pb-4 border-b border-[var(--color-border)]">
          <div>
            <div className="text-[20px] font-bold tracking-tight">Customize colors</div>
            <div className="text-[12.5px] text-[var(--color-muted)] mt-0.5">{template.name} template</div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[var(--color-bg)] text-[var(--color-muted)] text-base"
          >
            ×
          </button>
        </div>

        <div className="p-5 bg-[#fafbf6] border-b border-[var(--color-border)]">
          <div className="h-[140px]">
            <StageCourt>
              <OverlayRenderer row={row} />
            </StageCourt>
          </div>
        </div>

        <div className="p-7">
          <div className="text-[13px] font-bold uppercase tracking-wider text-[var(--color-muted)] mb-3.5">
            AI palette from logo
          </div>
          <LogoUploadZone logoUrl={row.overlay.tournamentLogoUrl} onUpload={handleUpload} uploading={uploading} />
          {aiLoading && <div className="text-[12px] text-[var(--color-muted)] mb-4">Generating palette…</div>}
          {aiError && <div className="text-[12px] text-red-600 mb-4">AI failed: {aiError}</div>}
          {aiResult && (
            <AIResultCard palette={aiResult.palette} reasoning={aiResult.reasoning} onApply={applyAI} />
          )}

          <div className="flex items-center justify-between mt-6 mb-3.5">
            <div className="text-[13px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
              Fine-tune per slot
            </div>
            <button
              type="button"
              onClick={reset}
              className="text-[11px] text-[var(--color-muted)] px-2.5 py-1 rounded-md border border-[var(--color-border-strong)] bg-white"
            >
              ↻ Reset to template defaults
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {template.slots.map((slot) => (
              <SlotCard
                key={slot.key}
                slot={slot}
                value={effectiveColors[slot.key] ?? {}}
                onChange={(value) => updateSlot(slot.key, value)}
              />
            ))}
          </div>
        </div>

        <div className="px-7 py-4 border-t border-[var(--color-border)] flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Done</Button>
        </div>
      </div>
    </div>
  )
}
