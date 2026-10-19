import * as React from 'react'
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { HomePage } from '@/pages/HomePage'
import { ReportSubmitPage } from '@/pages/ReportSubmitPage'
import { TrackPage } from '@/pages/TrackPage'
import { TrackResultPage } from '@/pages/TrackResultPage'
import { OfficerLoginPage } from '@/pages/OfficerLoginPage'
import { OfficerDashboardPage } from '@/pages/OfficerDashboardPage'
import { OfficerReportDetailPage } from '@/pages/OfficerReportDetailPage'

/**
 * Protects officer-only routes. Redirects to the officer login when there is no
 * active session. After signing in, the user is sent back to the intended page.
 */
function ProtectedOfficerRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return null
  }

  if (!user) {
    return <Navigate to="/officer/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

export function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/report" element={<ReportSubmitPage />} />
        <Route path="/track" element={<TrackPage />} />
        <Route path="/track/:reference" element={<TrackResultPage />} />

        <Route path="/officer/login" element={<OfficerLoginPage />} />
        <Route
          path="/officer/*"
          element={
            <ProtectedOfficerRoute>
              <Routes>
                <Route path="dashboard" element={<OfficerDashboardPage />} />
                <Route path="reports" element={<OfficerDashboardPage />} />
                <Route path="reports/:id" element={<OfficerReportDetailPage />} />
              </Routes>
            </ProtectedOfficerRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
