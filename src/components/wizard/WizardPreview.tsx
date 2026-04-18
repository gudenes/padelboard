// src/components/wizard/WizardPreview.tsx — Right preview panel.
'use client'
import type { MatchRow } from '@/types/match'
import { getTemplate } from '@/lib/templates/registry'
import { OverlayRenderer } from '@/components/overlay/OverlayRenderer'
import { StageCourt } from './StageCourt'

export function WizardPreview({ row }: { row: MatchRow }) {
  const template = getTemplate(row.overlay.template)
  const templateName = template?.name ?? 'Minimal'
  const overlayUrl = typeof window !== 'undefined'
    ? `${window.location.host}/overlay/${row.short_code}`
    : `padelboard.padellabs.tech/overlay/${row.short_code}`

  return (
    <aside className="bg-[#fafbf6] p-6 flex flex-col">
      <div className="flex justify-between items-center mb-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">
        <span>Live preview</span>
        <span className="bg-[var(--color-lime-tint)] px-2 py-0.5 rounded-full text-[10px] font-semibold normal-case tracking-normal text-[var(--color-text)]">
          {templateName}
        </span>
      </div>
      <StageCourt>
        <OverlayRenderer row={row} />
      </StageCourt>
      <div className="mt-4 p-3 bg-white border border-[var(--color-border)] rounded-lg text-[11.5px] text-[var(--color-muted)] flex flex-col gap-1">
        <span className="font-medium text-[var(--color-text)]">Overlay URL</span>
        <code className="bg-[var(--color-bg)] px-1.5 py-0.5 rounded text-[10.5px] text-[var(--color-text)] font-mono">
          {overlayUrl}
        </code>
      </div>
    </aside>
  )
}
