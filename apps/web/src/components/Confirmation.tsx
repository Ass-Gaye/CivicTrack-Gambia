import { CheckCircle2, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { Button } from './Button'

interface ConfirmationProps {
  title: string
  description?: string
  referenceCode?: string
  actionLabel?: string
  onAction?: () => void
}

export function Confirmation({
  title,
  description,
  referenceCode,
  actionLabel,
  onAction,
}: ConfirmationProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (!referenceCode) return
    navigator.clipboard.writeText(referenceCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4 max-w-md mx-auto">
      <div className="w-16 h-16 rounded-2xl bg-canopy-100 border border-canopy-200 flex items-center justify-center mb-5 text-canopy-700 shadow-sm">
        <CheckCircle2 className="w-9 h-9" />
      </div>

      <h2 className="text-2xl font-extrabold text-sand-900 tracking-tight mb-2">{title}</h2>
      {description && <p className="text-sm text-sand-600 mb-6 leading-relaxed">{description}</p>}

      {referenceCode && (
        <div className="w-full mb-6 p-4 rounded-2xl bg-sand-50 border border-sand-200 text-left">
          <span className="block text-xs font-bold uppercase tracking-wider text-sand-500 mb-1.5">
            Your Official Tracking Code
          </span>
          <div className="flex items-center justify-between gap-3 bg-white border border-sand-300 rounded-xl px-3.5 py-2.5">
            <span className="font-mono text-base font-bold text-river-900 tracking-wide">
              {referenceCode}
            </span>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-sand-100 hover:bg-sand-200 text-sand-700 transition-colors"
              aria-label="Copy reference code"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-canopy-600" />
                  <span className="text-canopy-700">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <p className="mt-2 text-xs text-sand-500">
            Save this code to check progress or receive public inspection notes.
          </p>
        </div>
      )}

      {actionLabel && onAction && (
        <Button onClick={onAction} variant="primary" size="lg" className="w-full">
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
