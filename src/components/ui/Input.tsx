import type { InputHTMLAttributes } from 'react'

export function Input({ className = '', ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full px-3.5 py-2.5 border border-[var(--color-border-strong)] bg-[var(--color-surface)] rounded-[var(--radius-sm)] text-[14px] text-[var(--color-text)] outline-none focus:border-[var(--color-lime)] focus:shadow-[0_0_0_3px_rgba(196,216,46,0.2)] transition ${className}`}
      {...rest}
    />
  )
}
