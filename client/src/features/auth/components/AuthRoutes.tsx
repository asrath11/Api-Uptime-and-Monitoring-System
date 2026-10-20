import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

function AuthLoading() {
  return (
    <main className="auth-state" role="status">
      <span className="auth-state-spinner" />
      <p>Checking your session…</p>
    </main>
  )
}

export function PublicOnlyRoute() {
  const { user, isLoading } = useAuth()

  if (isLoading) return <AuthLoading />
  return user ? <Navigate to="/dashboard" replace /> : <Outlet />
}

export function ProtectedRoute() {
  const { user, isLoading } = useAuth()

  if (isLoading) return <AuthLoading />
  return user ? <Outlet /> : <Navigate to="/login" replace />
}

export function HomeRedirect() {
  const { user, isLoading } = useAuth()

  if (isLoading) return <AuthLoading />
  return <Navigate to={user ? '/dashboard' : '/login'} replace />
}
