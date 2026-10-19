import * as React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  required?: boolean
  icon?: React.ReactNode
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>
  hint?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input({ label, error, required, className = '', icon, inputProps, hint, id, ...props }, ref) {
    const inputId = id || React.useId()

    return (
      <div className="mb-4">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-semibold text-sand-800 mb-1.5">
            {label}
            {required && <span className="text-ochre-600 ml-1 font-bold" aria-hidden="true">*</span>}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sand-500 pointer-events-none">
              {icon}
            </div>
          )}
          <input
            id={inputId}
            type="text"
            ref={ref}
            className={`block w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-sand-950 placeholder-sand-400 focus:outline-none focus:ring-4 focus:ring-river-500/10 focus:border-river-600 transition-all duration-150 ${
              icon ? 'pl-10' : ''
            } ${error ? 'border-red-400 bg-red-50/20 focus:border-red-500 focus:ring-red-500/10' : 'border-sand-300 hover:border-sand-400'} ${className}`}
            {...props}
            {...inputProps}
          />
        </div>
        {hint && !error && <p className="mt-1.5 text-xs text-sand-600">{hint}</p>}
        {error && <p className="mt-1.5 text-xs font-medium text-red-600 flex items-center gap-1">{error}</p>}
      </div>
    )
  }
)
