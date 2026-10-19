import * as React from 'react'
import { Link } from 'react-router-dom'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ochre' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  to?: string
}

export const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-river-900 text-white hover:bg-river-800 active:bg-river-950 shadow-sm hover:shadow focus-visible:ring-2 focus-visible:ring-river-600 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  secondary:
    'bg-canopy-700 text-white hover:bg-canopy-600 active:bg-canopy-800 shadow-sm hover:shadow focus-visible:ring-2 focus-visible:ring-canopy-600 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  ochre:
    'bg-ochre-600 text-white hover:bg-ochre-700 active:bg-ochre-800 shadow-sm hover:shadow focus-visible:ring-2 focus-visible:ring-ochre-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  outline:
    'border border-sand-300 text-sand-900 bg-white hover:bg-sand-50 hover:border-sand-400 active:bg-sand-100 shadow-subtle focus-visible:ring-2 focus-visible:ring-river-600 disabled:opacity-50 disabled:pointer-events-none',
  ghost:
    'text-sand-700 hover:bg-sand-100 hover:text-sand-900 active:bg-sand-200 focus-visible:ring-2 focus-visible:ring-river-600 disabled:opacity-50 disabled:pointer-events-none',
  danger:
    'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
}

export const sizeClasses: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-3 py-1.5 text-xs font-semibold rounded-lg gap-1.5',
  md: 'px-4 py-2.5 text-sm font-semibold rounded-xl gap-2',
  lg: 'px-6 py-3.5 text-base font-semibold rounded-xl gap-2.5',
}

export function getButtonClassName({
  variant = 'primary',
  size = 'md',
  className = '',
}: {
  variant?: ButtonProps['variant']
  size?: ButtonProps['size']
  className?: string
} = {}) {
  return `inline-flex items-center justify-center font-sans tracking-tight transition-all duration-150 active:scale-[0.99] select-none ${sizeClasses[size]} ${variantClasses[variant]} ${className}`
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className = '',
    variant = 'primary',
    size = 'md',
    disabled,
    children,
    type = 'button',
    to,
    ...props
  },
  ref
) {
  const combinedClasses = getButtonClassName({ variant, size, className })

  if (to) {
    return (
      <Link to={to} className={combinedClasses} tabIndex={disabled ? -1 : undefined}>
        {children}
      </Link>
    )
  }

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      className={combinedClasses}
      {...props}
    >
      {children}
    </button>
  )
})
