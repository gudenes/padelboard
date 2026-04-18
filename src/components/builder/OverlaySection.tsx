'use client'
import { useState } from 'react'
import type { OverlayJson } from '@/types/match'
import { Chip } from '@/components/ui/Chip'
import { Switch } from '@/components/ui/Switch'
import { Slider } from '@/components/ui/Slider'
import { ColorDots } from '@/components/ui/ColorDots'
import { Input } from '@/components/ui/Input'
import { TemplateBrowser } from './TemplateBrowser'

const TEMPLATE_LABEL: Record<OverlayJson['template'], string> = {
  minimal: 'Minimal Chip',
  broadcast: 'Broadcast Bar',
  split: 'Split Badge',
}

export function OverlaySection({
  value,
  onChange,
}: {
  value: OverlayJson
  onChange: (next: OverlayJson) => void
}) {
  const [browseOpen, setBrowseOpen] = useState(false)

  return (
    <section className="mb-8">
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)] mb-3.5">
        Overlay
      </h3>

      <Label text="Style" />
      <div className="flex gap-2 items-center flex-wrap">
        <Chip active>{TEMPLATE_LABEL[value.template]}</Chip>
        <Chip onClick={() => setBrowseOpen(true)}>Browse templates</Chip>
      </div>

      <TemplateBrowser
        open={browseOpen}
        value={value.template}
        onPick={(id) => {
          onChange({ ...value, template: id })
          setBrowseOpen(false)
        }}
        onClose={() => setBrowseOpen(false)}
      />

      <div className="mt-4">
        <Label text="Accent color" />
        <ColorDots
          value={value.customColors.accent}
          onChange={(c) => onChange({ ...value, customColors: { accent: c } })}
        />
      </div>

      <div className="mt-4">
        <Label text={`Size — ${Math.round(value.scale * 100)}%`} />
        <Slider
          value={value.scale * 100}
          min={50}
          max={150}
          onChange={(n) => onChange({ ...value, scale: n / 100 })}
        />
      </div>

      <div className="grid grid-cols-2 gap-2.5 mt-4">
        <div>
          <Label text="Tournament" />
          <Input
            value={value.tournamentName ?? ''}
            onChange={(e) => onChange({ ...value, tournamentName: e.target.value })}
          />
        </div>
        <div>
          <Label text="Round" />
          <Input
            value={value.round ?? ''}
            onChange={(e) => onChange({ ...value, round: e.target.value })}
          />
        </div>
      </div>

      <div className="mt-4 divide-y divide-[var(--color-border)]">
        <ToggleRow
          title="Show match duration"
          subtitle="Elapsed time since first point."
          on={value.showTimer}
          onToggle={(b) => onChange({ ...value, showTimer: b })}
        />
        <ToggleRow
          title="Show tournament label"
          subtitle="Tournament and round on the overlay."
          on={value.showTournament}
          onToggle={(b) => onChange({ ...value, showTournament: b })}
        />
      </div>
    </section>
  )
}

function Label({ text }: { text: string }) {
  return <label className="block text-xs text-[var(--color-muted)] mb-1.5">{text}</label>
}

function ToggleRow({
  title,
  subtitle,
  on,
  onToggle,
}: {
  title: string
  subtitle: string
  on: boolean
  onToggle: (n: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div className="text-sm">
        {title}
        <small className="block text-xs text-[var(--color-muted)] mt-0.5">{subtitle}</small>
      </div>
      <Switch on={on} onToggle={onToggle} />
    </div>
  )
}
