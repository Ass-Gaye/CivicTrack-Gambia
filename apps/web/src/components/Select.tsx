import * as React from 'react'
import { ChevronDown } from 'lucide-react'

interface Option {
  value: string
  label: string
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: Option[]
  error?: string
  required?: boolean
  placeholder?: string
  hint?: string
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  function Select({ label, options, error, required, placeholder, className = '', hint, id, ...props }, ref) {
    const selectId = id || React.useId()

    return (
      <div className="mb-4">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-semibold text-sand-800 mb-1.5">
            {label}
            {required && <span className="text-ochre-600 ml-1 font-bold" aria-hidden="true">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            id={selectId}
            ref={ref}
            className={`block w-full appearance-none rounded-xl border bg-white px-3.5 py-2.5 pr-10 text-sm text-sand-950 focus:outline-none focus:ring-4 focus:ring-river-500/10 focus:border-river-600 transition-all duration-150 cursor-pointer ${
              error ? 'border-red-400 bg-red-50/20 focus:border-red-500 focus:ring-red-500/10' : 'border-sand-300 hover:border-sand-400'
            } ${className}`}
            {...props}
          >
            {placeholder && (
              <option value="" disabled className="text-sand-400">
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="text-sand-900 py-1">
                {opt.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-sand-500">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
        {hint && !error && <p className="mt-1.5 text-xs text-sand-600">{hint}</p>}
        {error && <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>}
      </div>
    )
  }
)
