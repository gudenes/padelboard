'use client'

const DEFAULT_COLORS = ['#c4d82e', '#0a84ff', '#ff453a', '#ff9500', '#af52de', '#1a1d1a']

export function ColorDots({
  value,
  onChange,
  options = DEFAULT_COLORS,
}: {
  value: string
  onChange: (color: string) => void
  options?: string[]
}) {
  return (
    <div className="flex items-center gap-2.5">
      {options.map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          className={`w-6 h-6 rounded-full ring-inset ring-1 ring-black/10 transition ${value === c ? 'ring-2 ring-[var(--color-lime)]' : ''}`}
          style={{ background: c }}
          aria-label={`color ${c}`}
        />
      ))}
    </div>
  )
}
