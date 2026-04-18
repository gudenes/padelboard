// src/components/wizard/RuleToggleWithTip.tsx — Rule toggle row w/ tooltip.
'use client'
import { Switch } from '@/components/ui/Switch'
import { Tooltip } from './Tooltip'

export function RuleToggleWithTip({
  title, subtitle, tip, on, onToggle,
}: {
  title: string
  subtitle: string
  tip: string
  on: boolean
  onToggle: (next: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[var(--color-border)] last:border-b-0">
      <div>
        <div className="flex items-center text-[13.5px] font-medium">
          {title}
          <Tooltip text={tip} />
        </div>
        <div className="text-[11.5px] text-[var(--color-muted)] mt-0.5">{subtitle}</div>
      </div>
      <Switch on={on} onToggle={onToggle} />
    </div>
  )
}
