import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Clock3,
  ExternalLink,
  Globe2,
  LoaderCircle,
  Pause,
  Pencil,
  Plus,
  Play,
  RefreshCw,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react'
import { z } from 'zod'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { SummaryCard } from '@/components/ui/summary-card'
import { toast } from 'sonner'
import { WorkspaceSidebar } from '@/features/monitors/components/WorkspaceSidebar'
import { AuthApiError } from '@/features/auth/api/authApi'
import { useAuth } from '@/features/auth/context/useAuth'
import {
  createMonitor,
  deleteMonitor,
  getMonitors,
  MonitorApiError,
  updateMonitor,
  type Monitor,
} from '@/features/monitors/api/monitorApi'

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
  const [isSaving, setIsSaving] = useState(false)
  const [updatingMonitorId, setUpdatingMonitorId] = useState<string | null>(null)
  const [deletingMonitorId, setDeletingMonitorId] = useState<string | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [editingMonitor, setEditingMonitor] = useState<Monitor | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(
    () => new URLSearchParams(location.search).get('addMonitor') === 'true',
  )
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [feedbackType, setFeedbackType] = useState<'success' | 'info' | 'warning'>('success')
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

  const handleRefresh = useCallback(() => {
    setError('')
    setIsRefreshing(true)
    void refreshMonitors()
  }, [refreshMonitors])

  useEffect(() => {
    const initialFetchId = window.setTimeout(() => void refreshMonitors(), 0)
    const intervalId = window.setInterval(() => void refreshMonitors(), 60_000)
    return () => {
      window.clearTimeout(initialFetchId)
      window.clearInterval(intervalId)
    }
  }, [refreshMonitors])

  useEffect(() => {
    if (!error) return
    toast.error(error, {
      action: monitors.length === 0
        ? { label: 'Try again', onClick: handleRefresh }
        : undefined,
    })
  }, [error, handleRefresh, monitors.length])

  useEffect(() => {
    if (feedback) toast[feedbackType](feedback)
  }, [feedback, feedbackType])

  const upCount = monitors.filter((monitor) => !monitor.isPaused && monitor.currentStatus === 'UP').length
  const downCount = monitors.filter((monitor) => !monitor.isPaused && monitor.currentStatus === 'DOWN').length
  const unknownCount = monitors.filter((monitor) => !monitor.isPaused && monitor.currentStatus === 'UNKNOWN').length
  const pausedCount = monitors.filter((monitor) => monitor.isPaused).length
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
      setFeedbackType('success')
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

  const handleToggleMonitoring = async (monitor: Monitor) => {
    setUpdatingMonitorId(monitor._id)
    setError('')
    setFeedback('')
    try {
      const updated = await updateMonitor(monitor._id, { isPaused: !monitor.isPaused })
      setMonitors((current) => current.map((item) => item._id === updated._id ? updated : item))
      setFeedbackType(updated.isPaused ? 'warning' : 'success')
      setFeedback(`${updated.name} monitoring ${updated.isPaused ? 'paused' : 'resumed'}.`)
    } catch (toggleError) {
      setError(
        toggleError instanceof MonitorApiError
          ? toggleError.message
          : `Unable to ${monitor.isPaused ? 'resume' : 'pause'} ${monitor.name}.`,
      )
    } finally {
      setUpdatingMonitorId(null)
    }
  }

  const handleSaveMonitor = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editingMonitor) return

    const formData = new FormData(event.currentTarget)
    const parsed = monitorFormSchema.safeParse({
      name: formData.get('name'),
      url: formData.get('url'),
      method: formData.get('method'),
      intervalSeconds: formData.get('intervalSeconds'),
      timeoutSeconds: formData.get('timeoutSeconds'),
    })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check the monitor settings.')
      return
    }

    setIsSaving(true)
    setError('')
    setFeedback('')
    try {
      const updated = await updateMonitor(editingMonitor._id, parsed.data)
      setMonitors((current) => current.map((monitor) => monitor._id === updated._id ? updated : monitor))
      setEditingMonitor(null)
      setFeedbackType('success')
      setFeedback(`${updated.name} settings saved.`)
    } catch (saveError) {
      setError(
        saveError instanceof MonitorApiError
          ? saveError.message
          : 'Unable to save monitor settings.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteMonitor = async (monitor: Monitor) => {
    setDeletingMonitorId(monitor._id)
    setError('')
    setFeedback('')
    try {
      await deleteMonitor(monitor._id)
      setMonitors((current) => current.filter((item) => item._id !== monitor._id))
      setPendingDeleteId(null)
      if (editingMonitor?._id === monitor._id) setEditingMonitor(null)
      setFeedbackType('success')
      setFeedback(`${monitor.name} was deleted.`)
    } catch (deleteError) {
      setError(
        deleteError instanceof MonitorApiError
          ? deleteError.message
          : `Unable to delete ${monitor.name}.`,
      )
    } finally {
      setDeletingMonitorId(null)
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

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Monitor summary">
            <SummaryCard
              label="Operational"
              value={isLoading ? '—' : upCount}
              tone="text-emerald-700"
            />
            <SummaryCard
              label="Down"
              value={isLoading ? '—' : downCount}
              tone="text-destructive"
            />
            <SummaryCard
              label="Awaiting first check"
              value={isLoading ? '—' : unknownCount}
            />
            <SummaryCard
              label="Paused"
              value={isLoading ? '—' : pausedCount}
              tone="text-amber-700"
            />
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

          {editingMonitor && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Edit {editingMonitor.name}</CardTitle>
                <CardDescription>Changes apply to future automated checks.</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" onSubmit={handleSaveMonitor}>
                  <FormField label="Monitor name">
                    <Input name="name" defaultValue={editingMonitor.name} maxLength={100} required />
                  </FormField>
                  <FormField label="Endpoint URL">
                    <Input name="url" type="url" defaultValue={editingMonitor.url} required />
                  </FormField>
                  <FormField label="Method">
                    <select
                      className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                      name="method"
                      defaultValue={editingMonitor.method}
                    >
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                      <option value="PUT">PUT</option>
                      <option value="DELETE">DELETE</option>
                    </select>
                  </FormField>
                  <FormField label="Check interval (seconds)">
                    <Input name="intervalSeconds" type="number" min="1" defaultValue={editingMonitor.intervalSeconds} required />
                  </FormField>
                  <FormField label="Timeout (seconds)">
                    <Input name="timeoutSeconds" type="number" min="1" defaultValue={editingMonitor.timeoutSeconds} required />
                  </FormField>
                  <div className="flex justify-end gap-2 sm:col-span-2 lg:col-span-3">
                    <Button variant="outline" type="button" disabled={isSaving} onClick={() => setEditingMonitor(null)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSaving}>
                      {isSaving && <LoaderCircle className="animate-spin" />}
                      {isSaving ? 'Saving…' : 'Save changes'}
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
                    const status = monitor.currentStatus.toLowerCase()
                    const statusClass = monitor.isPaused
                      ? 'border-amber-200 bg-amber-50 text-amber-800'
                      : status === 'up'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      : status === 'down'
                        ? 'border-red-200 bg-red-50 text-red-800'
                        : 'border-border bg-muted/40 text-muted-foreground'

                    return (
                      <article className="grid gap-3 px-4 py-4 md:grid-cols-[minmax(0,1.6fr)_minmax(120px,.8fr)_minmax(145px,1.1fr)_minmax(100px,.7fr)_auto] md:items-center md:gap-4" key={monitor._id}>
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground"><Globe2 size={17} /></span>
                          <div className="min-w-0">
                            <Link
                              className="block truncate text-sm font-medium hover:text-primary"
                              to={`/analytics/${monitor._id}`}
                            >
                              {monitor.name}
                            </Link>
                            <div className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                              <span className="font-semibold">{monitor.method}</span>
                              <span className="truncate">{getHostname(monitor.url)}</span>
                              <a className="shrink-0 hover:text-foreground" href={monitor.url} target="_blank" rel="noreferrer" aria-label={`Open ${monitor.name} endpoint`}>
                                <ExternalLink size={12} />
                              </a>
                            </div>
                          </div>
                        </div>
                        <div><span className="mr-2 text-[10px] text-muted-foreground md:hidden">Status</span><Badge className={statusClass}><span className={`size-1.5 rounded-full ${monitor.isPaused ? 'bg-amber-600' : status === 'up' ? 'bg-emerald-600' : status === 'down' ? 'bg-red-600' : 'bg-muted-foreground'}`} />{monitor.isPaused ? 'Paused' : statusLabels[monitor.currentStatus]}</Badge></div>
                        <div className="text-xs text-muted-foreground"><span className="mr-2 text-[10px] md:hidden">Last checked</span>{formatLastChecked(monitor.lastCheckedAt)}</div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Clock3 size={13} /><span className="md:hidden">Interval · </span>{formatInterval(monitor.intervalSeconds)}</div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            className="w-fit"
                            size="sm"
                            variant="outline"
                            onClick={() => void handleToggleMonitoring(monitor)}
                            disabled={updatingMonitorId !== null}
                          >
                            {updatingMonitorId === monitor._id
                              ? <LoaderCircle className="animate-spin" />
                              : monitor.isPaused ? <Play /> : <Pause />}
                            {updatingMonitorId === monitor._id
                              ? (monitor.isPaused ? 'Resuming…' : 'Pausing…')
                              : monitor.isPaused ? 'Resume' : 'Pause'}
                          </Button>
                          <Button
                            variant="outline"
                            size="icon-sm"
                            aria-label={`Edit ${monitor.name}`}
                            onClick={() => setEditingMonitor(monitor)}
                          >
                            <Pencil />
                          </Button>
                          {pendingDeleteId === monitor._id ? (
                            <div className="flex items-center gap-1">
                              <span className="mr-1 text-[10px] text-destructive">Delete?</span>
                              <Button
                                variant="destructive"
                                size="sm"
                                disabled={deletingMonitorId === monitor._id}
                                onClick={() => void handleDeleteMonitor(monitor)}
                              >
                                {deletingMonitorId === monitor._id
                                  ? <LoaderCircle className="animate-spin" />
                                  : <Trash2 />}
                                Confirm
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={deletingMonitorId === monitor._id}
                                onClick={() => setPendingDeleteId(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="icon-sm"
                              aria-label={`Delete ${monitor.name}`}
                              onClick={() => setPendingDeleteId(monitor._id)}
                            >
                              <Trash2 />
                            </Button>
                          )}
                        </div>
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

function FormField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1.5 text-xs font-medium">
      {label}
      {children}
    </label>
  )
}
