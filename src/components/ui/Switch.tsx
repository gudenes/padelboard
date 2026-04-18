'use client'

export function Switch({ on, onToggle }: { on: boolean; onToggle: (next: boolean) => void }) {
  return (
    <button
      onClick={() => onToggle(!on)}
      className={`relative w-9 h-5 rounded-full transition ${on ? 'bg-[var(--color-lime)]' : 'bg-[var(--color-border-strong)]'}`}
      aria-pressed={on}
    >
      <span
        className={`absolute top-[3px] w-3.5 h-3.5 rounded-full bg-white shadow transition-all ${on ? 'right-[3px]' : 'left-[3px]'}`}
      />
    </button>
  )
}
