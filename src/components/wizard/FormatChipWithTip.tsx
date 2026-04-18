// src/components/wizard/FormatChipWithTip.tsx — Format chip w/ tooltip.
'use client'
import { Tooltip } from './Tooltip'

export function FormatChipWithTip({
  label, active, tip, onClick,
}: {
  label: string
  active: boolean
  tip: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-[13px] font-medium transition ${
        active
          ? 'bg-[var(--color-lime-tint)] border-[var(--color-lime)] text-[var(--color-text)] font-semibold'
          : 'bg-white border-[var(--color-border-strong)] text-[var(--color-text)] hover:border-[var(--color-lime)]'
      }`}
    >
      {label}
      <Tooltip text={tip} />
    </button>
  )
}
