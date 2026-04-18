// src/components/wizard/Tooltip.tsx — Hover-triggered tooltip with (i) trigger.
'use client'
import { useState } from 'react'

export function Tooltip({ text, children }: { text: string; children?: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <span
      className="relative inline-flex items-center"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children ?? (
        <button
          type="button"
          className="inline-flex items-center justify-center w-3.5 h-3.5 ml-1 rounded-full bg-black/10 text-[var(--color-muted)] text-[10px] font-bold cursor-help"
          aria-label="More info"
        >
          i
        </button>
      )}
      {open && (
        <span
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-[var(--color-text)] text-white text-[11.5px] font-medium text-center leading-snug rounded-lg px-3 py-2 shadow-lg pointer-events-none z-10"
        >
          {text}
          <span
            className="absolute top-full left-1/2 -translate-x-1/2"
            style={{
              borderWidth: 5,
              borderStyle: 'solid',
              borderColor: 'var(--color-text) transparent transparent transparent',
            }}
          />
        </span>
      )}
    </span>
  )
}
