import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Globe2,
  LoaderCircle,
  Plus,
  RefreshCw,
  Server,
  ShieldCheck,
  X,
} from 'lucide-react'
import { z } from 'zod'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Input } from '../../../components/ui/input'
import { WorkspaceSidebar } from '../../monitors/components/WorkspaceSidebar'
import { AuthApiError } from '../api/authApi'
import { useAuth } from '../context/useAuth'
import {
  createMonitor,
  getMonitors,
  MonitorApiError,
  runMonitorCheck,
  type Monitor,
} from '../../monitors/api/monitorApi'

const monitorFormSchema = z.object({
  name: z.string().trim().min(1, 'Give this monitor a name.').max(100),
  url: z.url('Enter a valid URL, including https://.'),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE']),
  intervalSeconds: z.coerce.number().int().min(1),
  timeoutSeconds: z.coerce.number().int().min(1),
})

const statusLabels: Record<Monitor['currentStatus'], string> = {
  UP: 'Operational',
  DOWN: 'Down',
  UNKNOWN: 'Awaiting check',
}

function formatLastChecked(value: string | null) {
  if (!value) return 'Not checked yet'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Check time unavailable'
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function formatInterval(seconds: number) {
  if (seconds < 60) return `Every ${seconds}s`
  if (seconds % 60 === 0) return `Every ${seconds / 60} min`
  return `Every ${Math.floor(seconds / 60)}m ${seconds % 60}s`
}

function getHostname(url: string) {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [monitors, setMonitors] = useState<Monitor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [checkingMonitorId, setCheckingMonitorId] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(
    () => new URLSearchParams(location.search).get('addMonitor') === 'true',
  )
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [isSigningOut, setIsSigningOut] = useState(false)

  const refreshMonitors = useCallback(async () => {
    try {
      setMonitors(await getMonitors())
      setError('')
    } catch (refreshError) {
      setError(
        refreshError instanceof MonitorApiError
          ? refreshError.message
          : 'Unable to load your monitors. Please try again.',
      )
    } finally {
      setIsRefreshing(false)
      setIsLoading(false)
    }
  }, [])

  const handleRefresh = () => {
    setError('')
    setIsRefreshing(true)
    void refreshMonitors()
  }

  useEffect(() => {
    const initialFetchId = window.setTimeout(() => void refreshMonitors(), 0)
    const intervalId = window.setInterval(() => void refreshMonitors(), 60_000)
    return () => {
      window.clearTimeout(initialFetchId)
      window.clearInterval(intervalId)
    }
  }, [refreshMonitors])

  const upCount = monitors.filter((monitor) => monitor.currentStatus === 'UP').length
  const downCount = monitors.filter((monitor) => monitor.currentStatus === 'DOWN').length
  const unknownCount = monitors.filter((monitor) => monitor.currentStatus === 'UNKNOWN').length
  const firstName = user?.name.trim().split(/\s+/)[0] || 'there'
  const handleCreateMonitor = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setFeedback('')
    const formData = new FormData(event.currentTarget)
    const parsed = monitorFormSchema.safeParse({
      name: formData.get('name'),
      url: formData.get('url'),
      method: formData.get('method'),
      intervalSeconds: formData.get('intervalSeconds'),
      timeoutSeconds: formData.get('timeoutSeconds'),
    })

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check the monitor details.')
      return
    }

    setIsSubmitting(true)
    try {
      const monitor = await createMonitor(parsed.data)
      setMonitors((current) => [monitor, ...current.filter((item) => item._id !== monitor._id)])
      setShowCreateForm(false)
      setFeedback(`${monitor.name} is now being monitored.`)
    } catch (createError) {
      setError(
        createError instanceof MonitorApiError
          ? createError.message
          : 'Unable to create this monitor. Please try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCheck = async (monitor: Monitor) => {
    setCheckingMonitorId(monitor._id)
    setError('')
    setFeedback('')
    try {
      const result = await runMonitorCheck(monitor._id)
      const status = result.status === 'RATE_LIMITED'
        ? 'rate limited'
        : result.status === 'UP'
          ? 'operational'
          : 'down'
      setFeedback(`${monitor.name}: ${status} · ${result.responseTimeMs} ms`)
      await refreshMonitors()
    } catch (checkError) {
      setError(
        checkError instanceof MonitorApiError
          ? checkError.message
          : `Unable to check ${monitor.name}. Please try again.`,
      )
    } finally {
      setCheckingMonitorId(null)
    }
  }

  const handleLogout = async () => {
    setError('')
    setIsSigningOut(true)
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
      setIsSigningOut(false)
    }
  }

  return (
    <main className="min-h-screen bg-muted/30 text-foreground md:flex">
      <WorkspaceSidebar
        user={user}
        activePage="overview"
        monitorCount={monitors.length}
        onSignOut={() => void handleLogout()}
        isSigningOut={isSigningOut}
      />

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-background/95 px-4 backdrop-blur sm:px-6 lg:px-10">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Workspace</span><span>/</span><strong className="font-medium text-foreground">Overview</strong>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              aria-label="Refresh monitors"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={isRefreshing ? 'animate-spin' : ''} />
            </Button>
            <Button onClick={() => setShowCreateForm((visible) => !visible)}>
              {showCreateForm ? <X /> : <Plus />}
              <span className="hidden sm:inline">{showCreateForm ? 'Close' : 'Add monitor'}</span>
            </Button>
          </div>
        </header>

        <div className="mx-auto max-w-7xl space-y-7 px-4 py-8 sm:px-6 lg:px-10">
          <section className="flex flex-wrap items-end justify-between gap-4" id="overview">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-emerald-700">
                <span className="size-2 rounded-full bg-emerald-500" />
                LIVE MONITORING
              </div>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Good to see you, {firstName}</h1>
              <p className="mt-1 text-sm text-muted-foreground">Here’s the health of your APIs at a glance.</p>
            </div>
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock3 size={14} /> Auto-refreshes every minute
            </p>
          </section>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive" role="alert">
              <AlertTriangle size={16} />
              <span>{error}</span>
              {monitors.length === 0 && <Button className="ml-auto" variant="link" onClick={handleRefresh}>Try again</Button>}
            </div>
          )}
          {feedback && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">
              <CheckCircle2 size={16} /> {feedback}
            </div>
          )}

          <section className="grid gap-3 sm:grid-cols-3" aria-label="Monitor summary">
            <StatCard icon={<Server />} label="Total endpoints" value={isLoading ? '—' : monitors.length} detail="Configured monitors" />
            <StatCard icon={<Check />} label="Operational" value={isLoading ? '—' : upCount} detail="Responding as expected" tone="green" />
            <StatCard icon={<AlertTriangle />} label="Needs attention" value={isLoading ? '—' : downCount} detail={`${unknownCount} awaiting first check`} tone="red" />
          </section>

          {showCreateForm && (
            <Card>
              <CardHeader className="flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle className="text-base">Add an endpoint</CardTitle>
                  <CardDescription className="mt-1">Set up an API to start checking its availability.</CardDescription>
                </div>
                <Button variant="ghost" size="icon" aria-label="Close form" onClick={() => setShowCreateForm(false)}>
                  <X />
                </Button>
              </CardHeader>
              <CardContent>
                <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" onSubmit={handleCreateMonitor}>
                  <FormField label="Monitor name">
                    <Input name="name" placeholder="Production API" maxLength={100} required />
                  </FormField>
                  <FormField label="Endpoint URL">
                    <Input name="url" type="url" placeholder="https://api.example.com/health" required />
                  </FormField>
                  <FormField label="Method">
                    <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50" name="method" defaultValue="GET">
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                      <option value="PUT">PUT</option>
                      <option value="DELETE">DELETE</option>
                    </select>
                  </FormField>
                  <FormField label="Check interval (sec)">
                    <Input name="intervalSeconds" type="number" min="1" defaultValue="60" required />
                  </FormField>
                  <FormField label="Timeout (sec)">
                    <Input name="timeoutSeconds" type="number" min="1" defaultValue="10" required />
                  </FormField>
                  <div className="flex justify-end gap-2 sm:col-span-2 lg:col-span-3">
                    <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)} disabled={isSubmitting}>Cancel</Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? <LoaderCircle className="animate-spin" /> : <Plus />}
                      {isSubmitting ? 'Adding…' : 'Create monitor'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <section className="scroll-mt-20 space-y-3" id="endpoints">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold tracking-tight">
                  Monitored endpoints
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">Availability and check configuration for your APIs.</p>
              </div>
              {monitors.length > 0 && <Badge className="border-border bg-background text-muted-foreground">{monitors.length} {monitors.length === 1 ? 'endpoint' : 'endpoints'}</Badge>}
            </div>

            {isLoading ? (
              <Card><CardContent className="flex min-h-36 items-center justify-center gap-2 text-sm text-muted-foreground">
                <LoaderCircle className="animate-spin text-primary" size={18} /> Loading your monitors…
              </CardContent></Card>
            ) : monitors.length === 0 ? (
              <Card>
                <CardContent className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
                  <span className="grid size-12 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><Globe2 size={22} /></span>
                  <h3 className="mt-4 text-sm font-semibold">No endpoints yet</h3>
                  <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">Add an API endpoint to start tracking its availability and response status.</p>
                  <Button className="mt-4" onClick={() => setShowCreateForm(true)}><Plus /> Add your first monitor</Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="overflow-hidden">
                <div className="hidden grid-cols-[minmax(0,1.6fr)_minmax(120px,.8fr)_minmax(145px,1.1fr)_minmax(100px,.7fr)_auto] items-center gap-4 border-b bg-muted/40 px-4 py-3 text-xs font-medium text-muted-foreground md:grid">
                  <span>Endpoint</span><span>Status</span><span>Last checked</span><span>Interval</span><span className="sr-only">Actions</span>
                </div>
                <div className="divide-y">
                  {monitors.map((monitor) => {
                    const checking = checkingMonitorId === monitor._id
                    const status = monitor.currentStatus.toLowerCase()
                    const statusClass = status === 'up'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      : status === 'down'
                        ? 'border-red-200 bg-red-50 text-red-800'
                        : 'border-border bg-muted/40 text-muted-foreground'

                    return (
                      <article className="grid gap-3 px-4 py-4 md:grid-cols-[minmax(0,1.6fr)_minmax(120px,.8fr)_minmax(145px,1.1fr)_minmax(100px,.7fr)_auto] md:items-center md:gap-4" key={monitor._id}>
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground"><Globe2 size={17} /></span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{monitor.name}</p>
                            <div className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                              <span className="font-semibold">{monitor.method}</span>
                              <span className="truncate">{getHostname(monitor.url)}</span>
                              <a className="shrink-0 hover:text-foreground" href={monitor.url} target="_blank" rel="noreferrer" aria-label={`Open ${monitor.name} endpoint`}>
                                <ExternalLink size={12} />
                              </a>
                            </div>
                          </div>
                        </div>
                        <div><span className="mr-2 text-[10px] text-muted-foreground md:hidden">Status</span><Badge className={statusClass}><span className={`size-1.5 rounded-full ${status === 'up' ? 'bg-emerald-600' : status === 'down' ? 'bg-red-600' : 'bg-muted-foreground'}`} />{statusLabels[monitor.currentStatus]}</Badge></div>
                        <div className="text-xs text-muted-foreground"><span className="mr-2 text-[10px] md:hidden">Last checked</span>{formatLastChecked(monitor.lastCheckedAt)}</div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Clock3 size={13} /><span className="md:hidden">Interval · </span>{formatInterval(monitor.intervalSeconds)}</div>
                        <Button className="w-fit" size="sm" variant="outline" onClick={() => void handleCheck(monitor)} disabled={checkingMonitorId !== null}>
                          {checking ? <LoaderCircle className="animate-spin" /> : <RefreshCw />}
                          {checking ? 'Checking…' : 'Check now'}
                        </Button>
                      </article>
                    )
                  })}
                </div>
              </Card>
            )}
          </section>

          <footer className="flex flex-wrap items-center justify-between gap-3 border-t pt-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-emerald-700" /> Your monitoring data is private to your account.</span>
            <span>Pulsewatch · API monitoring</span>
          </footer>
        </div>
      </div>
    </main>
  )
}

function StatCard({
  icon,
  label,
  value,
  detail,
  tone = 'blue',
}: {
  icon: ReactNode
  label: string
  value: string | number
  detail: string
  tone?: 'blue' | 'green' | 'red'
}) {
  const iconTone = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-emerald-50 text-emerald-700',
    red: 'bg-red-50 text-red-700',
  }[tone]

  return (
    <Card>
      <CardContent className="flex items-start gap-3 p-4 sm:p-5">
        <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${iconTone}`}>{icon}</span>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{detail}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function FormField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1.5 text-xs font-medium">
      {label}
      {children}
    </label>
  )
}
