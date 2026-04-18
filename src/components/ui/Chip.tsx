import type { ButtonHTMLAttributes } from 'react'

export function Chip({
  active,
  className = '',
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  const base = 'px-3.5 py-2 rounded-full border text-[13px] transition cursor-pointer'
  const states = active
    ? 'bg-[var(--color-lime-tint)] border-[var(--color-lime)] text-[var(--color-text)] font-semibold'
    : 'bg-[var(--color-surface)] border-[var(--color-border-strong)] text-[var(--color-text)] hover:border-[var(--color-lime)]'
  return (
    <button className={`${base} ${states} ${className}`} {...rest}>
      {children}
    </button>
  )
}
