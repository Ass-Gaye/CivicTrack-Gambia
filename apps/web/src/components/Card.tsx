import * as React from 'react'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg'
  interactive?: boolean
}

export function Card({
  children,
  className = '',
  padding = 'md',
  interactive = false,
  ...props
}: CardProps) {
  const paddingClasses: Record<NonNullable<CardProps['padding']>, string> = {
    none: '',
    sm: 'p-4 sm:p-5',
    md: 'p-6 sm:p-7',
    lg: 'p-7 sm:p-9',
  }

  return (
    <div
      className={`bg-white rounded-2xl border border-sand-200/90 shadow-card transition-all duration-200 ${
        interactive ? 'hover:shadow-hover hover:-translate-y-0.5 hover:border-sand-300 cursor-pointer' : ''
      } ${paddingClasses[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
