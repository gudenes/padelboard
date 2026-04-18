// src/components/wizard/steps/StepTemplate.tsx — Step 1 of the wizard.
'use client'
import { useState } from 'react'
import type { MatchRow, OverlayJson, TemplateId } from '@/types/match'
import { allTemplates } from '@/lib/templates/registry'
import { Button } from '@/components/ui/Button'
import { TemplateCard } from '../TemplateCard'
import { ColorCustomizerModal } from '@/components/customizer/ColorCustomizerModal'

export function StepTemplate({
  row, onChange,
}: {
  row: MatchRow
  onChange: (patch: { overlay: OverlayJson }) => void
}) {
  const [customizerOpen, setCustomizerOpen] = useState(false)
  const templates = allTemplates()

  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)] mb-1.5">
        Step 1 of 3
      </div>
      <h2 className="text-[24px] font-bold tracking-tight mb-1.5">Pick a template</h2>
      <p className="text-[13px] text-[var(--color-muted)] mb-5">
        Swap any time — fully free, no lock-ins.
      </p>

      <div className="flex flex-col gap-2.5">
        {templates.map((t) => (
          <TemplateCard
            key={t.id}
            template={t}
            selected={row.overlay.template === t.id}
            onSelect={() => onChange({ overlay: { ...row.overlay, template: t.id as TemplateId } })}
            sampleRow={row}
          />
        ))}
      </div>

      <div className="mt-5 p-4 bg-[#fafbf6] border border-[var(--color-border)] rounded-xl flex items-center justify-between">
        <div>
          <div className="text-[12.5px] font-medium">Customize colors</div>
          <div className="text-[11px] text-[var(--color-muted)] mt-0.5">
            Upload your tournament logo — AI suggests a palette — fine-tune per element.
          </div>
        </div>
        <Button variant="ghost" onClick={() => setCustomizerOpen(true)}>
          Open customizer →
        </Button>
      </div>

      <ColorCustomizerModal
        open={customizerOpen}
        onClose={() => setCustomizerOpen(false)}
        row={row}
        onChange={onChange}
      />
    </div>
  )
}
