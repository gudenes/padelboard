// src/components/wizard/steps/StepFormat.tsx — Step 3 of the wizard.
'use client'
import type { MatchRow } from '@/types/match'
import { DEUCE_RULES, getDeuceRule, type MatchConfig, type MatchFormat } from '@/lib/padel-scoring'
import { FormatChipWithTip } from '../FormatChipWithTip'
import { RuleToggleWithTip } from '../RuleToggleWithTip'

const FORMATS: Array<{ id: MatchFormat; label: string; tip: string }> = [
  { id: 'bo3', label: 'Best of 3 full sets', tip: 'First team to win 2 sets wins the match. Standard for most club and tournament matches.' },
  { id: 'single-set', label: 'Single set', tip: 'First team to 6 games (with 2-game lead) wins. Fast format — great for short streams.' },
  { id: 'pro-set', label: 'Pro set', tip: 'First team to 9 games (with 2-game lead) wins the match. One long set, no best-of structure.' },
]

export function StepFormat({
  row, onChange,
}: {
  row: MatchRow
  onChange: (patch: { config: MatchConfig }) => void
}) {
  const cfg = row.config
  function update(patch: Partial<MatchConfig>) {
    onChange({ config: { ...cfg, ...patch } })
  }

  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)] mb-1.5">
        Step 3 of 3
      </div>
      <h2 className="text-[24px] font-bold tracking-tight mb-1.5">Match format</h2>
      <p className="text-[13px] text-[var(--color-muted)] mb-5">
        Pick the format and enable any rules you want. Hover any option for details.
      </p>

      <label className="block text-[11.5px] text-[var(--color-muted)] mb-2 font-medium">Format</label>
      <div className="flex flex-wrap gap-2">
        <FormatChipWithTip label="2 sets + super-tiebreak" active={cfg.format === 'bo3' && cfg.superTiebreak} tip="Play two sets. At one set each, play to 10 points, win by two." onClick={() => update({format:'bo3',superTiebreak:true})} />
        {FORMATS.map((f) => (
          <FormatChipWithTip
            key={f.id}
            label={f.label}
            active={cfg.format === f.id && !(f.id === 'bo3' && cfg.superTiebreak)}
            tip={f.tip}
            onClick={() => update({ format: f.id, superTiebreak:false })}
          />
        ))}
      </div>

      <label className="block text-[11.5px] text-[var(--color-muted)] mb-2 mt-7 font-medium">Rules</label>
      <fieldset className="mb-5">
        <legend className="text-sm font-semibold mb-2">At 40–40</legend>
        {DEUCE_RULES.map(rule => <label key={rule.id} className="flex items-start gap-3 p-3 rounded-lg border border-[var(--color-border)] mb-2 cursor-pointer">
          <input className="mt-1 accent-black" type="radio" name="wizard-deuce-rule" checked={getDeuceRule(cfg) === rule.id} onChange={() => update({deuceRule:rule.id, goldenPoint:rule.id === 'golden-point'})} />
          <span className="text-sm font-semibold">{rule.label}<span className="block text-xs font-normal text-[var(--color-muted)]">{rule.description}</span></span>
        </label>)}
      </fieldset>
      <RuleToggleWithTip
        title="Tiebreak at 6-6"
        subtitle="Standard 7-point tiebreak"
        tip="When a set reaches 6-6, play a standard 7-point tiebreak (win by 2) to close it."
        on={cfg.setTiebreakAt === 6}
        onToggle={(v) => update({ setTiebreakAt: v ? 6 : 'none' })}
      />
    </div>
  )
}
