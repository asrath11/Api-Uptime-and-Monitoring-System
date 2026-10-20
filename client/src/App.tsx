import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom'
import {
  HomeRedirect,
  ProtectedRoute,
  PublicOnlyRoute,
} from '@/features/auth/components/AuthRoutes'
import { AuthProvider } from '@/features/auth/context/AuthProvider'
import { ThemeProvider } from '@/context/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import DashboardPage from '@/features/auth/pages/DashboardPage'
import LoginPage from '@/features/auth/pages/LoginPage'
import SignupPage from '@/features/auth/pages/SignupPage'
import MonitorDetailsPage from '@/features/monitors/pages/MonitorDetailsPage'

function LegacyMonitorRedirect() {
  const { monitorId } = useParams()
  return <Navigate to={monitorId ? `/analytics/${monitorId}` : '/dashboard'} replace />
}

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<HomeRedirect />} />
            <Route element={<PublicOnlyRoute />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
            </Route>
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/endpoints" element={<Navigate to="/dashboard" replace />} />
              <Route path="/endpoints/:monitorId" element={<LegacyMonitorRedirect />} />
              <Route path="/analytics/:monitorId" element={<MonitorDetailsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
