import type { ReactNode } from 'react'
import { Activity, Check, ShieldCheck, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'

type AuthShellProps = {
  children: ReactNode
  mode: 'login' | 'signup'
}

const monitorLines = [34, 46, 40, 58, 48, 64, 52, 72, 60, 78, 66, 84]

export default function AuthShell({ children, mode }: AuthShellProps) {
  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
      <aside className="relative hidden min-h-screen flex-col justify-between overflow-hidden bg-[radial-gradient(ellipse_at_60%_52%,rgb(29_77_102_/_36%),transparent_51%),linear-gradient(145deg,#102135_0%,#10283a_51%,#0b1a2a_100%)] px-10 py-8 text-slate-100 lg:flex xl:px-16">
        <div className="pointer-events-none absolute -right-44 top-[12%] size-80 rounded-full bg-emerald-400/20 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-52 -left-40 size-80 rounded-full bg-emerald-500/15 blur-[120px]" />
        <div className="relative z-10">
          <Link className="inline-flex items-center gap-3 text-lg font-semibold tracking-tight text-slate-50" to="/login" aria-label="Pulsewatch home">
            <span className="grid size-9 place-items-center rounded-xl border border-emerald-300/30 bg-emerald-300/10 text-emerald-300">
              <Activity size={21} strokeWidth={2.5} />
            </span>
            pulsewatch
          </Link>

          <div className="mt-[clamp(3.5rem,10vh,6.5rem)] max-w-xl">
            <span className="inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.14em] text-emerald-200">
              <span className="size-2 rounded-full bg-emerald-300 shadow-[0_0_0_4px_rgb(104_224_184_/_12%)]" />
              API HEALTH, AT A GLANCE
            </span>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.12] tracking-[-0.055em] text-slate-50 xl:text-5xl">
              Know the moment<br />something changes.
            </h1>
            <p className="mt-4 max-w-md text-sm leading-7 text-slate-300">
              Catch downtime early, keep your team in the loop, and give every
              endpoint the attention it deserves.
            </p>
          </div>

          <Card className="mt-10 max-w-md border-white/10 bg-slate-800/70 text-slate-100 shadow-2xl shadow-black/20 backdrop-blur">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <span className="grid size-8 place-items-center rounded-lg bg-emerald-300/10 text-emerald-300">
                  <Activity size={16} />
                </span>
                <span className="min-w-0">
                  <strong className="block text-xs font-semibold">API response time</strong>
                  <small className="mt-1 block text-[10px] text-slate-400">Production · last 24 hours</small>
                </span>
                <span className="ml-auto inline-flex items-center gap-1.5 text-[9px] font-bold tracking-wider text-emerald-200">
                  <span className="size-1.5 rounded-full bg-emerald-300" /> LIVE
                </span>
              </div>
              <div className="relative mt-5 h-24 overflow-hidden">
                <div className="absolute inset-0 bg-[repeating-linear-gradient(to_bottom,transparent_0_22px,rgb(177_199_214_/_9%)_22px_23px)]" />
                <svg className="relative size-full" viewBox="0 0 420 94" preserveAspectRatio="none" aria-hidden="true">
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
              <div className="flex items-center justify-between border-t border-white/10 pt-3 text-[10px] text-slate-300">
                <span><strong className="text-sm text-white">142</strong><small className="text-slate-400"> ms avg</small></span>
                <span className="inline-flex items-center gap-1 text-emerald-200"><Check size={13} /> 99.98% uptime</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="relative z-10 flex items-center justify-between gap-4 text-[10px] text-slate-400">
          <span className="inline-flex items-center gap-1.5"><ShieldCheck size={15} className="text-emerald-300" /> Your data stays yours</span>
          <span>Simple monitoring. Fewer surprises.</span>
        </div>
      </aside>

      <section className="flex min-h-screen flex-col px-6 py-6 sm:px-10 lg:px-12">
        <div className="flex items-center justify-between gap-4">
          <Link className="inline-flex items-center gap-2.5 text-base font-semibold tracking-tight text-foreground lg:hidden" to="/login" aria-label="Pulsewatch home">
            <span className="grid size-8 place-items-center rounded-lg border border-emerald-300/30 bg-emerald-50 text-emerald-700">
              <Activity size={19} strokeWidth={2.5} />
            </span>
            pulsewatch
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <ShieldCheck size={15} className="text-emerald-700" /> Secure workspace access
            </span>
            <ThemeToggle />
          </div>
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          <div className="mb-7">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[0.12em] text-emerald-700">
              <Zap size={14} /> {mode === 'signup' ? 'GET STARTED' : 'WELCOME BACK'}
            </span>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
              {mode === 'signup' ? 'Create your account' : 'Sign in to Pulsewatch'}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {mode === 'signup'
                ? 'Start keeping an eye on your APIs in just a few steps.'
                : 'Your APIs are waiting. Sign in to check on them.'}
            </p>
          </div>
          {children}
        </div>
        <p className="mx-auto max-w-md text-center text-[11px] leading-5 text-muted-foreground">
          By continuing, you agree to our <a className="font-medium text-foreground underline-offset-4 hover:underline" href="#terms">Terms of Service</a> and{' '}
          <a className="font-medium text-foreground underline-offset-4 hover:underline" href="#privacy">Privacy Policy</a>.
        </p>
      </section>
    </main>
  )
}
