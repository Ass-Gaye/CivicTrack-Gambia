import { AlertOctagon } from 'lucide-react'

interface ErrorMessageProps {
  message: string
  className?: string
}

export function ErrorMessage({ message, className = '' }: ErrorMessageProps) {
  return (
    <div
      role="alert"
      className={`flex items-start gap-3 rounded-xl border border-red-200 bg-red-50/80 p-4 text-red-900 shadow-subtle ${className}`}
    >
      <AlertOctagon className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
      <div>
        <h4 className="text-sm font-semibold text-red-900">Action Required</h4>
        <p className="mt-0.5 text-xs text-red-700 leading-relaxed">{message}</p>
      </div>
    </div>
  )
}
