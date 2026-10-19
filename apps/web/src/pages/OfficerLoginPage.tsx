import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShieldCheck, Mail, Lock, ArrowLeft, Sparkles } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { Card } from '@/components/Card'
import { Loading } from '@/components/Loading'
import { useAuth } from '@/hooks/useAuth'

export function OfficerLoginPage() {
  const navigate = useNavigate()
  const { signIn, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleFillDemo = () => {
    setEmail('officer@civictrack.gm')
    setPassword('DemoOfficerPass123!')
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    try {
      await signIn(email, password)
      navigate('/officer/dashboard', { replace: true })
    } catch (err: any) {
      const is401 = err?.status === 401 || err?.response?.status === 401
      setError(
        is401
          ? 'Invalid credentials. If using local dev, click "Fill Demo Credentials" below.'
          : 'Unable to connect to the authentication service. Please try again.'
      )
    }
  }

  return (
    <div className="min-h-screen bg-sand-50 flex flex-col font-sans">
      <Navbar isOfficer />

      <main className="flex-1 max-w-md mx-auto py-12 px-4 sm:px-6 w-full flex flex-col justify-center">
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-sand-600 hover:text-river-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Citizen Portal
          </Link>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-river-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-river-700">Internal Operations</span>
          </div>
          <h1 className="text-2xl font-extrabold text-sand-900 tracking-tight">Municipal Officer Sign In</h1>
          <p className="mt-1 text-xs sm:text-sm text-sand-600">
            Authorized access for municipal engineers, inspectors, and ward administrators.
          </p>
        </div>

        <Card padding="lg" className="shadow-card">
          {loading ? (
            <Loading message="Authenticating credentials…" />
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Municipal Email Address"
                type="email"
                required
                placeholder="officer@civictrack.gm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail className="w-4 h-4 text-sand-400" />}
              />

              <Input
                label="Access Password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock className="w-4 h-4 text-sand-400" />}
              />

              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-800">
                  {error}
                </div>
              )}

              <Button type="submit" variant="primary" size="lg" className="w-full">
                <ShieldCheck className="w-4 h-4 mr-1.5" /> Enter Operations Console
              </Button>
            </form>
          )}

          {/* Quick Demo Credentials Assistant */}
          <div className="mt-6 pt-5 border-t border-sand-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-sand-500">Hackathon Demo Access</span>
              <button
                type="button"
                onClick={handleFillDemo}
                className="inline-flex items-center gap-1 text-xs font-semibold text-river-700 hover:text-river-900 bg-river-50 border border-river-200 px-2 py-0.5 rounded-md transition-colors"
              >
                <Sparkles className="w-3 h-3 text-ochre-500" />
                Fill Demo Credentials
              </button>
            </div>
            <div className="bg-sand-50 rounded-xl p-3 border border-sand-200 text-xs font-mono text-sand-700 space-y-1">
              <div>Email: officer@civictrack.gm</div>
              <div>Password: DemoOfficerPass123!</div>
            </div>
          </div>
        </Card>

        <p className="mt-6 text-center text-xs text-sand-500">
          Looking to report a problem?{' '}
          <Link to="/report" className="font-semibold text-river-700 hover:text-river-900 underline">
            Citizens report here without an account.
          </Link>
        </p>
      </main>
    </div>
  )
}
