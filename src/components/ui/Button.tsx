import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'ghost' | 'icon'

export function Button({
  variant = 'primary',
  className = '',
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const base =
    'inline-flex items-center justify-center font-semibold transition active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none'
  const styles = {
    primary:
      'bg-[var(--color-lime)] text-[var(--color-text)] px-7 py-3 rounded-full shadow-[0_4px_16px_rgba(196,216,46,0.35)] hover:shadow-[0_6px_20px_rgba(196,216,46,0.45)]',
    ghost:
      'bg-transparent text-[var(--color-text)] px-5 py-2 rounded-full border border-[var(--color-border-strong)] hover:bg-[var(--color-lime-tint)]',
    icon:
      'w-8 h-8 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-lime)] hover:bg-[var(--color-lime-tint)]',
  }
  return (
    <button className={`${base} ${styles[variant]} ${className}`} {...rest}>
      {children}
    </button>
  )
}
