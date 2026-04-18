// src/components/customizer/AIResultCard.tsx — shows AI palette result + Apply button.
'use client'

interface Palette {
  primary: string
  accent: string
  textOnPrimary: string
  textOnAccent: string
}

export function AIResultCard({
  palette, reasoning, onApply,
}: {
  palette: Palette
  reasoning: string
  onApply: () => void
}) {
  return (
    <div className="mt-3.5 p-3 bg-white border border-[var(--color-border)] rounded-xl flex items-center gap-3">
      <div className="flex gap-1 flex-shrink-0">
        {[palette.primary, palette.accent, palette.textOnPrimary, palette.textOnAccent].map((c, i) => (
          <div key={i} className="w-6 h-6 rounded ring-inset ring-1 ring-black/10" style={{ background: c }} />
        ))}
      </div>
      <div className="flex-1 text-[11.5px] text-[var(--color-muted)] leading-snug">
        <strong className="text-[var(--color-text)]">Suggested palette.</strong> {reasoning}
      </div>
      <button
        type="button"
        onClick={onApply}
        className="text-[11px] px-3 py-1.5 rounded-full bg-[var(--color-lime)] text-[var(--color-text)] font-semibold flex-shrink-0"
      >
        Apply palette
      </button>
    </div>
  )
}
