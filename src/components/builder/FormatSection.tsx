'use client'
import type { MatchConfig, MatchFormat } from '@/lib/padel-scoring'
import { Chip } from '@/components/ui/Chip'
import { Switch } from '@/components/ui/Switch'

const FORMATS: { id: MatchFormat; label: string }[] = [
  { id: 'bo3', label: 'Best of 3' },
  { id: 'bo5', label: 'Best of 5' },
  { id: 'single-set', label: 'Single set' },
  { id: 'pro-set', label: 'Pro set' },
]

export function FormatSection({
  value,
  onChange,
}: {
  value: MatchConfig
  onChange: (next: MatchConfig) => void
}) {
  return (
    <section className="mb-8">
      <SectionTitle>Match format</SectionTitle>
      <div className="flex flex-wrap gap-2">
        {FORMATS.map((f) => (
          <Chip
            key={f.id}
            active={value.format === f.id}
            onClick={() => onChange({ ...value, format: f.id })}
          >
            {f.label}
          </Chip>
        ))}
      </div>
      <div className="mt-4 divide-y divide-[var(--color-border)]">
        <ToggleRow
          title="Golden point"
          subtitle="At 40-40 the receiving team picks a side; next point wins."
          on={value.goldenPoint}
          onToggle={(next) => onChange({ ...value, goldenPoint: next })}
        />
        <ToggleRow
          title="Super-tiebreak in final set"
          subtitle="First to 10 (min 2-point lead) replaces a 3rd set."
          on={value.superTiebreak}
          onToggle={(next) => onChange({ ...value, superTiebreak: next })}
        />
        <ToggleRow
          title="Tiebreak at 6-6"
          subtitle="Standard 7-point tiebreak when a set reaches 6-6."
          on={value.setTiebreakAt === 6}
          onToggle={(next) => onChange({ ...value, setTiebreakAt: next ? 6 : 'none' })}
        />
      </div>
    </section>
  )
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
  onToggle: (next: boolean) => void
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

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)] mb-3.5">
      {children}
    </h3>
  )
}
