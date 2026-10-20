import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { Activity, LogOut, ShieldCheck } from 'lucide-react'
import { AuthApiError } from '../api/authApi'
import { useAuth } from '../context/useAuth'

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleLogout = async () => {
    setError('')
    setIsSubmitting(true)
    try {
      await logout()
      navigate('/login', { replace: true })
    } catch (logoutError) {
      setError(
        logoutError instanceof AuthApiError
          ? logoutError.message
          : 'Unable to sign out. Please try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <Link className="brand dashboard-brand" to="/dashboard">
          <span className="brand-mark"><Activity size={20} strokeWidth={2.5} /></span>
          <span>pulsewatch</span>
        </Link>
        <button className="dashboard-logout" type="button" onClick={handleLogout} disabled={isSubmitting}>
          <LogOut size={16} /> {isSubmitting ? 'Signing out…' : 'Sign out'}
        </button>
      </header>
      <section className="dashboard-welcome">
        <span className="dashboard-kicker"><ShieldCheck size={15} /> SECURE SESSION ACTIVE</span>
        <h1>Welcome, {user?.name}</h1>
        <p>You’re signed in as <strong>{user?.email}</strong>.</p>
        <p className="dashboard-placeholder">
          Your account is connected. API monitoring will appear here once the dashboard is added.
        </p>
        {error && <p className="form-notice dashboard-error" role="alert">{error}</p>}
      </section>
    </main>
  )
}
