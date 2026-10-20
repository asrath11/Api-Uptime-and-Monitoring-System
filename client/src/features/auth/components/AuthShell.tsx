import type { ReactNode } from 'react'
import { Activity, Check, ShieldCheck, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'

type AuthShellProps = {
  children: ReactNode
  mode: 'login' | 'signup'
}

const monitorLines = [34, 46, 40, 58, 48, 64, 52, 72, 60, 78, 66, 84]

export default function AuthShell({ children, mode }: AuthShellProps) {
  return (
    <main className="auth-layout">
      <aside className="brand-panel">
        <div className="brand-content">
          <Link className="brand" to="/login" aria-label="Pulsewatch home">
            <span className="brand-mark">
              <Activity size={21} strokeWidth={2.5} />
            </span>
            <span>pulsewatch</span>
          </Link>

          <div className="brand-message">
            <span className="eyebrow"><span className="live-dot" /> API HEALTH, AT A GLANCE</span>
            <h1>Know the moment<br />something changes.</h1>
            <p>
              Catch downtime early, keep your team in the loop, and give every
              endpoint the attention it deserves.
            </p>
          </div>

          <div className="monitor-card" aria-label="Example API uptime chart">
            <div className="monitor-heading">
              <span className="monitor-icon"><Activity size={16} /></span>
              <span>
                <strong>API response time</strong>
                <small>Production · last 24 hours</small>
              </span>
              <span className="monitor-live"><i /> LIVE</span>
            </div>
            <div className="chart">
              <div className="chart-grid" />
              <svg viewBox="0 0 420 94" preserveAspectRatio="none" aria-hidden="true">
                <defs>
                  <linearGradient id="chart-fill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#63e6be" stopOpacity=".26" />
                    <stop offset="100%" stopColor="#63e6be" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d={`M0 70 ${monitorLines.map((height, index) => `L${index * 38 + 4} ${94 - height}`).join(' ')} L420 23 L420 94 L0 94 Z`}
                  fill="url(#chart-fill)"
                />
                <path
                  d={`M0 70 ${monitorLines.map((height, index) => `L${index * 38 + 4} ${94 - height}`).join(' ')} L420 23`}
                  fill="none"
                  stroke="#63e6be"
                  strokeWidth="2.5"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </div>
            <div className="monitor-footer">
              <span><strong>142</strong><small> ms avg</small></span>
              <span className="uptime-label"><Check size={13} /> 99.98% uptime</span>
            </div>
          </div>
        </div>

        <div className="brand-footer">
          <span><ShieldCheck size={15} /> Your data stays yours</span>
          <span>Simple monitoring. Fewer surprises.</span>
        </div>
        <div className="glow glow-one" />
        <div className="glow glow-two" />
      </aside>

      <section className="form-panel">
        <div className="mobile-brand">
          <span className="brand-mark"><Activity size={20} strokeWidth={2.5} /></span>
          <span>pulsewatch</span>
        </div>
        <div className="form-panel-top">
          <span className="secure-note"><ShieldCheck size={15} /> Secure workspace access</span>
          <span className="help-link">Need help?</span>
        </div>
        <div className="auth-content">
          <div className="auth-heading">
            <span className="form-kicker"><Zap size={14} /> {mode === 'signup' ? 'GET STARTED' : 'WELCOME BACK'}</span>
            <h2>{mode === 'signup' ? 'Create your account' : 'Sign in to Pulsewatch'}</h2>
            <p>
              {mode === 'signup'
                ? 'Start keeping an eye on your APIs in just a few steps.'
                : 'Your APIs are waiting. Sign in to check on them.'}
            </p>
          </div>
          {children}
        </div>
        <p className="legal-note">
          By continuing, you agree to our <a href="#terms">Terms of Service</a> and{' '}
          <a href="#privacy">Privacy Policy</a>.
        </p>
      </section>
    </main>
  )
}
