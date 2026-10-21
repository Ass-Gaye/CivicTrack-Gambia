import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Search,
  Droplets,
  Trash2,
  Construction,
  Lightbulb,
  Building2,
  Wrench,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Clock,
  MapPin,
} from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'

const CATEGORIES = [
  {
    id: 'BLOCKED_DRAIN',
    title: 'Blocked drains & flooding',
    description: 'Stagnant water, clogged gutters, and drainage overflow affecting streets or homes.',
    icon: Droplets,
    badge: 'Urgent in Rainy Season',
    color: 'text-river-600 bg-river-50 border-river-200',
  },
  {
    id: 'WASTE_DISPOSAL',
    title: 'Improper waste disposal',
    description: 'Illegal dumping sites, overflowing public bins, or hazardous refuse in community areas.',
    icon: Trash2,
    badge: 'Public Health',
    color: 'text-amber-700 bg-amber-50 border-amber-200',
  },
  {
    id: 'DAMAGED_ROAD',
    title: 'Damaged roads & potholes',
    description: 'Deep potholes, eroded road shoulders, washouts, and unpassable community roads.',
    icon: Construction,
    badge: 'Traffic & Transit',
    color: 'text-ochre-700 bg-ochre-50 border-ochre-200',
  },
  {
    id: 'STREETLIGHT',
    title: 'Streetlight problems',
    description: 'Unlit street lamps, broken solar poles, and exposed electrical cables endangering pedestrians.',
    icon: Lightbulb,
    badge: 'Community Safety',
    color: 'text-yellow-700 bg-yellow-50 border-yellow-200',
  },
  {
    id: 'DAMAGED_FACILITY',
    title: 'Public facilities & schools',
    description: 'Damaged community taps, municipal market stalls, broken clinic perimeter walls.',
    icon: Building2,
    badge: 'Civic Asset',
    color: 'text-canopy-700 bg-canopy-50 border-canopy-200',
  },
  {
    id: 'OTHER',
    title: 'Other public infrastructure',
    description: 'Fallen utility poles, damaged footbridges, open manholes, or unclassified civic hazards.',
    icon: Wrench,
    badge: 'General',
    color: 'text-sand-700 bg-sand-100 border-sand-200',
  },
]

const STEPS = [
  {
    number: '01',
    title: 'Submit issue without an account',
    description: 'Snap a picture, describe the problem, and pin the location. No password or registration needed.',
    icon: FileText,
  },
  {
    number: '02',
    title: 'Receive your tracking code',
    description: 'Get an official reference code (e.g. CTG-2026-ABC123) and a confirmation email with your tracking details. Save both for future reference.',
    icon: ShieldCheck,
  },
  {
    number: '03',
    title: 'Follow official status and notes',
    description: 'Check back anytime. See whenever municipal teams inspect, assign, or resolve the issue.',
    icon: Clock,
  },
]

const COUNCILS = [
  'Banjul City Council (BCC)',
  'Kanifing Municipal Council (KMC)',
  'Brikama Area Council (BAC)',
  'Kerewan Area Council (KAC)',
  'Mansakonko Area Council',
  'Janjanbureh Area Council',
  'Basse Area Council (URR)',
]

export function HomePage() {
  const navigate = useNavigate()
  const [quickRef, setQuickRef] = useState('')

  const handleQuickTrack = (e: React.FormEvent) => {
    e.preventDefault()
    if (quickRef.trim()) {
      navigate(`/track/${encodeURIComponent(quickRef.trim())}`)
    }
  }

  return (
    <div className="min-h-screen bg-sand-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden app-background text-white pt-12 pb-20 px-4 sm:px-6 lg:px-8 border-b border-river-800/40">
          {/* Subtle civic watermark pattern */}
          <div
            className="absolute inset-0 opacity-5 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
              backgroundSize: '32px 32px',
            }}
            aria-hidden="true"
          />

          <div className="relative max-w-5xl mx-auto">
            {/* Top national badge */}
            <div className="flex items-center justify-center mb-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-river-800/80 border border-river-700/80 text-sand-200 text-xs font-semibold tracking-wide shadow-sm">
                <span className="w-2 h-2 rounded-full bg-canopy-400 animate-pulse" />
                <span>Republic of The Gambia • Community Infrastructure Registry</span>
              </div>
            </div>

            {/* Main Headline */}
            <div className="text-center max-w-3xl mx-auto mb-10">
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.12] mb-5 text-white">
                Report community problems. Hold public works accountable.
              </h1>
              <p className="text-base sm:text-xl text-river-200 leading-relaxed font-normal">
                An open civic platform connecting residents across Gambian municipalities with real-time public issue
                tracking — from clogged drainage canals to damaged streets.
              </p>
            </div>

            {/* Dual Action Hero Console */}
            <div className="max-w-2xl mx-auto bg-white/10 backdrop-blur-md rounded-2xl p-2 sm:p-3 border border-white/15 shadow-elevated">
              <div className="bg-white rounded-xl p-4 sm:p-6 text-sand-900 shadow-sm">
                <div className="grid sm:grid-cols-2 gap-4 items-center">
                  {/* Left: Quick Report */}
                  <div className="sm:border-r sm:border-sand-200 sm:pr-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-river-700 block mb-1">
                      New Incident?
                    </span>
                    <h2 className="text-base font-bold text-sand-900 mb-2">Notice a problem in your street?</h2>
                    <p className="text-xs text-sand-600 mb-4 leading-relaxed">
                      Takes under 2 minutes. No account or password needed.
                    </p>
                    <Button to="/report" variant="ochre" size="md" className="w-full">
                      Report Issue Now <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>

                  {/* Right: Instant Reference Tracker */}
                  <div className="sm:pl-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-canopy-700 block mb-1">
                      Existing Report?
                    </span>
                    <h2 className="text-base font-bold text-sand-900 mb-2">Track progress by reference</h2>
                    <form onSubmit={handleQuickTrack} className="space-y-2">
                      <div className="relative">
                        <input
                          type="text"
                          value={quickRef}
                          onChange={(e) => setQuickRef(e.target.value)}
                          placeholder="e.g. CTG-2026-ABC123"
                          className="w-full px-3 py-2 text-xs sm:text-sm font-mono rounded-lg border border-sand-300 focus:outline-none focus:ring-2 focus:ring-river-500 uppercase placeholder:normal-case placeholder:font-sans"
                        />
                      </div>
                      <Button type="submit" variant="primary" size="md" className="w-full">
                        <Search className="w-4 h-4 mr-1.5" /> Check Status
                      </Button>
                    </form>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick trust metrics */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-river-200">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-canopy-400" /> Free & Open to All Citizens
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-canopy-400" /> 100% Public Reference Transparency
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-canopy-400" /> Private Citizen Phone & Email
              </span>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-sand-200/60 shadow-subtle">
              <span className="text-xs font-bold uppercase tracking-wider text-river-700 block mb-1">
                Public Infrastructure
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-sand-900 tracking-tight">
                What issues can you report?
              </h2>
              <p className="text-sm text-sand-700 mt-1 max-w-xl">
                Choose a category below to submit a localized report directly into the public works tracking queue.
              </p>
            </div>
            <Link
              to="/report"
              className="inline-flex items-center gap-1 text-sm font-semibold text-river-700 hover:text-river-900 transition-colors"
            >
              View Full Form <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon
              return (
                <Link
                  key={cat.id}
                  to={`/report?category=${cat.id}`}
                  className="group relative flex flex-col justify-between p-6 rounded-2xl bg-white/85 border border-sand-200/60 shadow-card hover:shadow-hover hover:border-river-300 hover:-translate-y-0.5 transition-all duration-200 backdrop-blur-sm"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center border ${cat.color} group-hover:scale-105 transition-transform`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-semibold text-sand-500 bg-sand-100 px-2 py-0.5 rounded-md">
                        {cat.badge}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-sand-900 group-hover:text-river-800 transition-colors mb-2">
                      {cat.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-sand-600 leading-relaxed mb-4">{cat.description}</p>
                  </div>

                  <div className="pt-3 border-t border-sand-100 flex items-center justify-between text-xs font-semibold text-river-700 group-hover:text-river-900">
                    <span>Report this issue</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              )
            })}
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-16 bg-sand-100/25 border-y border-sand-200/40 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-12 bg-white/80 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-sand-200/60 shadow-subtle">
              <span className="text-xs font-bold uppercase tracking-wider text-river-700 block mb-1">
                Civic Workflow
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-sand-900 tracking-tight">
                Simple, transparent 3-step reporting
              </h2>
              <p className="text-sm text-sand-700 mt-2">
                Designed for accessibility on any mobile browser across urban and rural communities.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 relative">
              {STEPS.map((step, idx) => {
                const Icon = step.icon
                return (
                  <Card key={step.number} padding="lg" className="relative flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="font-mono text-2xl font-black text-river-300">{step.number}</span>
                        <div className="w-10 h-10 rounded-xl bg-sand-100 flex items-center justify-center text-river-700">
                          <Icon className="w-5 h-5" />
                        </div>
                      </div>
                      <h3 className="text-base font-bold text-sand-900 mb-2">{step.title}</h3>
                      <p className="text-xs sm:text-sm text-sand-600 leading-relaxed">{step.description}</p>
                    </div>
                    {idx < STEPS.length - 1 && (
                      <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-20 text-sand-400">
                        <ArrowRight className="w-5 h-5" />
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>
          </div>
        </section>

        {/* Municipal Coverage Notice */}
        <section className="py-14 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
          <div className="rounded-2xl border border-sand-200/60 bg-white/85 p-6 sm:p-8 shadow-card backdrop-blur-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-river-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-river-700">
                    Municipal & Regional Coverage
                  </span>
                </div>
                <h3 className="text-lg font-bold text-sand-900 mb-1">Serving all 7 Local Government Areas</h3>
                <p className="text-xs sm:text-sm text-sand-600 max-w-xl">
                  Citizens can pinpoint reports anywhere across the Kombos, Greater Banjul Area, and the inland
                  divisions.
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5 max-w-md">
                {COUNCILS.map((council) => (
                  <span
                    key={council}
                    className="text-[11px] font-semibold text-sand-700 bg-sand-100 border border-sand-200/80 px-2.5 py-1 rounded-lg"
                  >
                    {council}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Prototype Transparency Notice */}
        <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <div className="rounded-2xl border border-ochre-200 bg-ochre-50/70 p-6 flex items-start gap-4 shadow-subtle">
            <div className="p-2 rounded-xl bg-ochre-100 text-ochre-700 flex-shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-ochre-900 mb-1">Civic Transparency & Prototype Notice</h4>
              <p className="text-xs text-ochre-800 leading-relaxed">
                CivicTrack Gambia is an independent civic technology prototype demonstrated for public works efficiency.
                Submissions do not constitute legal government filings. Data is demonstration-only and stored securely
                in a local database instance.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Authoritative Civic Footer */}
      <footer className="border-t border-sand-200 bg-sand-950 text-sand-300 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid sm:grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-river-800 flex items-center justify-center text-canopy-400 overflow-hidden">
                <img src="/assets/logo.jpeg" alt="CivicTrack Gambia logo" className="w-full h-full object-cover" />
              </div>
              <span className="font-extrabold text-white tracking-tight">CivicTrack Gambia</span>
            </div>
            <p className="text-xs text-sand-400 leading-relaxed">
              Empowering citizen voices with real-time public infrastructure accountability across The Gambia.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Citizen Services</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/report" className="hover:text-white transition-colors">
                  Report a Community Issue
                </Link>
              </li>
              <li>
                <Link to="/track" className="hover:text-white transition-colors">
                  Track Existing Reference
                </Link>
              </li>
              <li>
                <Link to="/report?category=BLOCKED_DRAIN" className="hover:text-white transition-colors">
                  Drainage & Floods
                </Link>
              </li>
              <li>
                <Link to="/report?category=DAMAGED_ROAD" className="hover:text-white transition-colors">
                  Roads & Potholes
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Operations</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/officer/login" className="hover:text-white transition-colors">
                  Municipal Officer Portal
                </Link>
              </li>
              <li>
                <Link to="/officer/dashboard" className="hover:text-white transition-colors">
                  Operations Dashboard
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">National Colors</h4>
            <div className="h-2 w-full gambia-ribbon-horizontal rounded-full mb-3" />
            <p className="text-[11px] text-sand-500">
              Red for the sun & savannah • Blue for River Gambia • Green for agriculture & forests.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 border-t border-sand-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-sand-500">
          <span>CivicTrack Gambia — Open Public Technology Initiative</span>
          <span>Prototype v1.0 • Built with React, Tailwind & PostgreSQL</span>
        </div>
      </footer>
    </div>
  )
}
