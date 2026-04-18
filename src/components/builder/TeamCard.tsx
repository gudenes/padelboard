'use client'
import type { TeamJson } from '@/types/match'
import { Input } from '@/components/ui/Input'
import { ColorDots } from '@/components/ui/ColorDots'

export function TeamCard({
  label,
  value,
  onChange,
}: {
  label: string
  value: TeamJson
  onChange: (next: TeamJson) => void
}) {
  return (
    <div className="p-4 border border-[var(--color-border)] rounded-[var(--radius-sm)] bg-[var(--color-surface)] mb-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
          <span
            className="w-2.5 h-2.5 rounded-full ring-inset ring-1 ring-black/10"
            style={{ background: value.color }}
          />
          {label}
        </div>
      </div>
      <Label text="Team name" />
      <Input value={value.name} onChange={(e) => onChange({ ...value, name: e.target.value })} />
      <div className="grid grid-cols-2 gap-2.5 mt-3">
        <div>
          <Label text="Player 1" />
          <Input
            value={value.players[0]}
            onChange={(e) => onChange({ ...value, players: [e.target.value, value.players[1]] })}
          />
        </div>
        <div>
          <Label text="Player 2" />
          <Input
            value={value.players[1]}
            onChange={(e) => onChange({ ...value, players: [value.players[0], e.target.value] })}
          />
        </div>
      </div>
      <div className="mt-3">
        <Label text="Color" />
        <ColorDots value={value.color} onChange={(c) => onChange({ ...value, color: c })} />
      </div>
    </div>
  )
}

function Label({ text }: { text: string }) {
  return <label className="block text-xs text-[var(--color-muted)] mb-1.5">{text}</label>
}
