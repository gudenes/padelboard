// src/components/wizard/TemplateCard.tsx — one selectable template card.
'use client'
import type { Template } from '@/lib/templates/types'
import type { MatchRow } from '@/types/match'
import { mergeColors } from '@/lib/templates/merge-colors'

export function TemplateCard({
  template, selected, onSelect, sampleRow,
}: {
  template: Template
  selected: boolean
  onSelect: () => void
  sampleRow: MatchRow
}) {
  const colors = mergeColors(template.defaults.colors, {})
  const Renderer = template.Renderer
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`grid grid-cols-[90px_1fr] gap-3.5 items-center p-3.5 rounded-2xl transition cursor-pointer text-left w-full ${
        selected
          ? 'border-[1.5px] border-[var(--color-lime)] ring-2 ring-[rgba(196,216,46,0.22)] bg-[rgba(196,216,46,0.04)]'
          : 'border-[1.5px] border-[var(--color-border)] hover:border-[var(--color-lime)] bg-white'
      }`}
    >
      <div
        className="aspect-[16/10] rounded-lg overflow-hidden relative"
        style={{ background: 'linear-gradient(180deg, #4a5c3a 0%, #1e2619 100%)' }}
      >
        <div style={{ transform: 'scale(0.32)', transformOrigin: 'top left', position: 'absolute', top: 4, left: 4 }}>
          <Renderer row={sampleRow} colors={colors} />
        </div>
      </div>
      <div>
        <div className="text-[14px] font-semibold">{template.name}</div>
        <div className="text-[11.5px] text-[var(--color-muted)] mt-0.5 leading-snug">
          {template.description}
        </div>
      </div>
    </button>
  )
}
