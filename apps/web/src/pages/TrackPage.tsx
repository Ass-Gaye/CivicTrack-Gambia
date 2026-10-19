import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, ShieldCheck, ArrowLeft, ArrowRight } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { Card } from '@/components/Card'
import { Loading } from '@/components/Loading'
import { useReports } from '@/hooks/useReports'

export function TrackPage() {
  const navigate = useNavigate()
  const [reference, setReference] = useState('')
  const [error, setError] = useState<string | null>(null)
  const { trackReport, loading } = useReports()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const cleaned = reference.trim()
    if (!cleaned) {
      setError('Please enter a valid tracking reference code.')
      return
    }
    try {
      await trackReport(cleaned)
      navigate(`/track/${encodeURIComponent(cleaned)}`)
    } catch {
      // error handled by hook
    }
  }

  return (
    <div className="min-h-screen bg-sand-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-xl mx-auto py-12 px-4 sm:px-6 lg:px-8 w-full">
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-sand-600 hover:text-river-900 mb-3 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Homepage
          </Link>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-canopy-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-canopy-700">Citizen Transparency</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-sand-900 tracking-tight">
            Track a Community Report
          </h1>
          <p className="mt-1 text-sm text-sand-600">
            Enter your official reference code to view live status updates, inspection milestones, and municipal notes.
          </p>
        </div>

        <Card padding="lg" className="shadow-card">
          {loading ? (
            <Loading message="Locating report in municipal records…" />
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                name="reference"
                label="Tracking Reference Code *"
                placeholder="e.g. CTG-2026-ABC123"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                error={error ?? undefined}
                hint="Your code was provided upon report submission and looks like CTG-2026-XXXXXX."
                icon={<Search className="w-4 h-4 text-sand-400" />}
                className="font-mono text-base uppercase tracking-wider placeholder:font-sans placeholder:normal-case placeholder:tracking-normal"
              />

              <Button type="submit" variant="primary" size="lg" className="w-full">
                <Search className="w-4 h-4 mr-1.5" /> Check Report Status
              </Button>
            </form>
          )}

          <div className="mt-6 pt-5 border-t border-sand-200">
            <span className="text-xs font-bold uppercase tracking-wider text-sand-500 block mb-2">
              Don't have a code yet?
            </span>
            <Link
              to="/report"
              className="inline-flex items-center gap-1 text-xs font-semibold text-river-700 hover:text-river-900"
            >
              Submit a new community report <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </Card>

        {/* What You Can See Card */}
        <div className="mt-6 rounded-2xl border border-sand-200 bg-white p-5 shadow-subtle flex items-start gap-3.5">
          <div className="p-2 rounded-xl bg-river-50 text-river-700 flex-shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-sand-900 mb-1">Public Transparency Guarantee</h3>
            <p className="text-xs text-sand-600 leading-relaxed">
              Anyone with this reference code can inspect the verification status, assigned crew notes, and completion
              dates. Citizen phone numbers and email addresses remain strictly private.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
