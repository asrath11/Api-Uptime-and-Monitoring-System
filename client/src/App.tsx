import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import {
  HomeRedirect,
  ProtectedRoute,
  PublicOnlyRoute,
} from './features/auth/components/AuthRoutes'
import { AuthProvider } from './features/auth/context/AuthProvider'
import DashboardPage from './features/auth/pages/DashboardPage'
import LoginPage from './features/auth/pages/LoginPage'
import SignupPage from './features/auth/pages/SignupPage'

function App() {
  return (
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
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
