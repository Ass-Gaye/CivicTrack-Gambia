import * as React from 'react'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  required?: boolean
  hint?: string
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ label, error, required, className = '', hint, id, ...props }, ref) {
    const textareaId = id || React.useId()

    return (
      <div className="mb-4">
        {label && (
          <label htmlFor={textareaId} className="block text-sm font-semibold text-sand-800 mb-1.5">
            {label}
            {required && <span className="text-ochre-600 ml-1 font-bold" aria-hidden="true">*</span>}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          className={`block w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-sand-950 placeholder-sand-400 focus:outline-none focus:ring-4 focus:ring-river-500/10 focus:border-river-600 transition-all duration-150 leading-relaxed ${
            error ? 'border-red-400 bg-red-50/20 focus:border-red-500 focus:ring-red-500/10' : 'border-sand-300 hover:border-sand-400'
          } ${className}`}
          rows={4}
          {...props}
        />
        {hint && !error && <p className="mt-1.5 text-xs text-sand-600">{hint}</p>}
        {error && <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>}
      </div>
    )
  }
)
