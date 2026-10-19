import * as React from 'react'
import { Loader2 } from 'lucide-react'

interface LoadingProps {
  message?: string
  className?: string
}

export function Loading({ message = 'Loading…', className = '' }: LoadingProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-10 ${className}`}>
      <div className="relative">
        <Loader2 className="w-8 h-8 text-river-600 animate-spin" />
        <div className="w-2 h-2 rounded-full bg-ochre-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      </div>
      <p className="text-sm font-medium text-sand-600 tracking-tight">{message}</p>
    </div>
  )
}

export function ButtonLoading({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-river-900 text-white font-semibold text-sm disabled:opacity-60 cursor-not-allowed shadow-sm"
      disabled
      {...props}
    >
      <Loader2 className="w-4 h-4 text-white animate-spin" />
      {children}
    </button>
  )
}
