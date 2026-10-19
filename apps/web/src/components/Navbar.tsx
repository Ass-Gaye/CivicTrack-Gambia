import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, PlusCircle, Search, Shield, Home, LayoutDashboard, FileText } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface NavbarProps {
  isOfficer?: boolean
}

export function Navbar({ isOfficer = false }: NavbarProps) {
  const location = useLocation()
  const { user, signOut } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const navItems = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/report', label: 'Report Issue', icon: PlusCircle },
    { to: '/track', label: 'Track Report', icon: Search },
  ]

  const officerItems = [
    { to: '/officer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/officer/reports', label: 'All Reports', icon: FileText },
  ]

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-sand-200/90 shadow-subtle">
      {/* Gambian National Colors Ribbon */}
      <div className="h-1 w-full gambia-ribbon-horizontal" aria-hidden="true" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo & Civic Emblem */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-river-900 flex items-center justify-center text-white shadow-sm group-hover:bg-river-800 transition-colors">
              <svg className="w-5 h-5 text-canopy-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-extrabold text-lg text-river-950 tracking-tight">CivicTrack</span>
                <span className="font-extrabold text-lg text-canopy-600 tracking-tight">Gambia</span>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-sand-500 block">
                {isOfficer ? 'Municipal Operations' : 'Citizen Infrastructure Portal'}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {!isOfficer &&
              navItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.to)
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
                      active
                        ? 'bg-river-50 text-river-900 border border-river-200/60 shadow-subtle'
                        : 'text-sand-700 hover:text-river-900 hover:bg-sand-100/80'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? 'text-river-700' : 'text-sand-400'}`} />
                    {item.label}
                  </Link>
                )
              })}

            {isOfficer &&
              officerItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.to)
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
                      active
                        ? 'bg-river-900 text-white shadow-sm'
                        : 'text-sand-700 hover:text-river-900 hover:bg-sand-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                )
              })}
          </nav>

          {/* Action Area */}
          <div className="flex items-center gap-2.5">
            {isOfficer ? (
              <>
                {user && (
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-sand-100 border border-sand-200/80 text-xs font-semibold text-sand-800">
                    <Shield className="w-3.5 h-3.5 text-river-600" />
                    <span>{user.name}</span>
                  </div>
                )}
                <button
                  onClick={signOut}
                  className="px-3 py-1.5 rounded-xl border border-sand-300 text-xs font-semibold text-sand-700 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors"
                >
                  Sign out
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/track"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-sand-700 hover:text-river-900 rounded-xl hover:bg-sand-100 transition-colors"
                >
                  <Search className="w-3.5 h-3.5" />
                  Track Status
                </Link>
                <Link
                  to="/report"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-river-900 hover:bg-river-800 text-white text-xs sm:text-sm font-semibold shadow-sm hover:shadow transition-all"
                >
                  <PlusCircle className="w-4 h-4 text-canopy-400" />
                  Report Issue
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-sand-600 hover:bg-sand-100 hover:text-sand-900 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-sand-200 bg-white px-4 py-3 space-y-1 shadow-lg animate-fadeIn">
          {(!isOfficer ? navItems : officerItems).map((item) => {
            const Icon = item.icon
            const active = isActive(item.to)
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  active ? 'bg-river-50 text-river-900' : 'text-sand-700 hover:bg-sand-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-river-600' : 'text-sand-400'}`} />
                {item.label}
              </Link>
            )
          })}
          {!isOfficer && (
            <div className="pt-2 mt-2 border-t border-sand-100">
              <Link
                to="/officer/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-sand-500 hover:text-river-900"
              >
                <Shield className="w-3.5 h-3.5" />
                Officer Login
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  )
}
