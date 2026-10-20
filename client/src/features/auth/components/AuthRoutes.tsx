import { Navigate, Outlet } from 'react-router-dom'
import { LoaderCircle } from 'lucide-react'
import { useAuth } from '../context/useAuth'

function AuthLoading() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background text-sm text-muted-foreground" role="status">
      <LoaderCircle className="size-6 animate-spin text-primary" />
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
