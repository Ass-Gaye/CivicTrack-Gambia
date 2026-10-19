import * as React from 'react'
import { CheckCircle2, Clock, Eye, UserCheck, AlertCircle, XCircle } from 'lucide-react'

const statusConfig: Record<
  string,
  {
    bg: string
    text: string
    border: string
    dot: string
    label: string
    icon: React.ElementType
  }
> = {
  SUBMITTED: {
    bg: 'bg-ochre-50',
    text: 'text-ochre-800',
    border: 'border-ochre-200',
    dot: 'bg-ochre-500',
    label: 'Submitted',
    icon: Clock,
  },
  UNDER_REVIEW: {
    bg: 'bg-river-50',
    text: 'text-river-800',
    border: 'border-river-200',
    dot: 'bg-river-500',
    label: 'Under Review',
    icon: Eye,
  },
  ASSIGNED: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-800',
    border: 'border-indigo-200',
    dot: 'bg-indigo-500',
    label: 'Assigned',
    icon: UserCheck,
  },
  IN_PROGRESS: {
    bg: 'bg-amber-50',
    text: 'text-amber-900',
    border: 'border-amber-200',
    dot: 'bg-amber-500 animate-pulse',
    label: 'In Progress',
    icon: AlertCircle,
  },
  RESOLVED: {
    bg: 'bg-canopy-50',
    text: 'text-canopy-800',
    border: 'border-canopy-200',
    dot: 'bg-canopy-600',
    label: 'Resolved',
    icon: CheckCircle2,
  },
  REJECTED: {
    bg: 'bg-red-50',
    text: 'text-red-800',
    border: 'border-red-200',
    dot: 'bg-red-500',
    label: 'Rejected',
    icon: XCircle,
  },
}

interface StatusBadgeProps {
  status: string
  className?: string
  showIcon?: boolean
}

export function StatusBadge({ status, className = '', showIcon = true }: StatusBadgeProps) {
  const config = statusConfig[status] ?? {
    bg: 'bg-sand-100',
    text: 'text-sand-800',
    border: 'border-sand-300',
    dot: 'bg-sand-500',
    label: status,
    icon: Clock,
  }

  const IconComponent = config.icon

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border tracking-tight ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} aria-hidden="true" />
      {showIcon && <IconComponent className="w-3.5 h-3.5 opacity-80" />}
      <span>{config.label}</span>
    </span>
  )
}
