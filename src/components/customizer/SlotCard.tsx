// src/components/customizer/SlotCard.tsx — one color slot with per-field swatches.
'use client'
import type { ColorSlot, SlotColors } from '@/lib/templates/types'

export function SlotCard({
  slot, value, onChange,
}: {
  slot: ColorSlot
  value: SlotColors
  onChange: (next: SlotColors) => void
}) {
  return (
    <div className="bg-white border border-[var(--color-border)] rounded-xl p-3">
      <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)] mb-2">
        {slot.label}
      </div>
      <div className="flex gap-1.5">
        {slot.fields.map((f) => (
          <label key={f} className="flex-1 cursor-pointer">
            <input
              type="color"
              value={toHex(value[f])}
              onChange={(e) => onChange({ ...value, [f]: e.target.value })}
              className="sr-only"
            />
            <div
              className="w-full h-7 rounded-md border border-black/10 mb-1"
              style={{ background: value[f] ?? '#000000' }}
            />
            <div className="text-[10px] text-[var(--color-muted)] text-center capitalize">
              {f}
            </div>
          </label>
        ))}
      </div>
    </div>
  )
}

// Native <input type="color"> requires hex without alpha. Strip rgba → approximate hex.
function toHex(color: string | undefined): string {
  if (!color) return '#000000'
  if (color.startsWith('#') && color.length === 7) return color
  const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i)
  if (!m) return '#000000'
  const [r, g, b] = [m[1], m[2], m[3]].map(Number)
  return '#' + [r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')
}
