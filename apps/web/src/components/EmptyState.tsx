import * as React from 'react'
import { Inbox } from 'lucide-react'

interface EmptyStateProps {
  title: string
  description?: string
  icon?: React.ElementType
  action?: React.ReactNode
  className?: string
}

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-12 px-4 ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-sand-100 border border-sand-200 flex items-center justify-center mb-4 text-sand-500 shadow-subtle">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-base font-bold text-sand-900 mb-1">{title}</h3>
      {description && <p className="text-sm text-sand-600 max-w-sm mb-5 leading-relaxed">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  )
}
