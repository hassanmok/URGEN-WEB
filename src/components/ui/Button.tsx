import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline'

const variants: Record<Variant, string> = {
  primary:
    'bg-gradient-to-l from-urgen-purple to-urgen-magenta text-white shadow-lg shadow-urgen-purple/25 hover:brightness-105 active:scale-[0.98]',
  secondary: 'bg-slate-100 text-urgen-navy hover:bg-slate-200 active:scale-[0.98]',
  ghost: 'bg-transparent text-urgen-navy hover:bg-slate-100',
  outline:
    'border-2 border-urgen-purple/40 text-urgen-navy bg-white/80 backdrop-blur hover:border-urgen-purple hover:bg-white',
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  children: ReactNode
}

export function Button({
  variant = 'primary',
  className = '',
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-urgen-purple disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
