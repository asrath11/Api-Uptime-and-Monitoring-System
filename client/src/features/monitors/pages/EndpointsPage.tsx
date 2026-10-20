import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import {
  AlertCircle,
  ArrowUpRight,
  Clock3,
  ExternalLink,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import { Alert } from '../../../components/ui/alert'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Input } from '../../../components/ui/input'
import { AuthApiError } from '../../auth/api/authApi'
import { useAuth } from '../../auth/context/useAuth'
import {
  deleteMonitor,
  getMonitors,
  MonitorApiError,
  updateMonitor,
  type Monitor,
} from '../api/monitorApi'
import { WorkspaceSidebar } from '../components/WorkspaceSidebar'

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

function formatDate(value: string | null) {
  if (!value) return 'Not checked yet'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Check time unavailable'
    : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

function getHostname(url: string) {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

export default function EndpointsPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [monitors, setMonitors] = useState<Monitor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [editingMonitor, setEditingMonitor] = useState<Monitor | null>(null)
  const [deletingMonitorId, setDeletingMonitorId] = useState<string | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')

  const refreshMonitors = useCallback(async () => {
    try {
      setMonitors(await getMonitors())
      setError('')
    } catch (fetchError) {
      setError(
        fetchError instanceof MonitorApiError
          ? fetchError.message
          : 'Unable to load your endpoints.',
      )
    } finally {
      setIsRefreshing(false)
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const fetchId = window.setTimeout(() => void refreshMonitors(), 0)
    return () => window.clearTimeout(fetchId)
  }, [refreshMonitors])

  const handleSignOut = async () => {
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

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
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
      setError(parsed.error.issues[0]?.message ?? 'Check the endpoint settings.')
      return
    }

    setIsSaving(true)
    setError('')
    setFeedback('')
    try {
      const updated = await updateMonitor(editingMonitor._id, parsed.data)
      setMonitors((current) => current.map((monitor) => monitor._id === updated._id ? updated : monitor))
      setEditingMonitor(null)
      setFeedback(`${updated.name} settings saved.`)
    } catch (saveError) {
      setError(
        saveError instanceof MonitorApiError
          ? saveError.message
          : 'Unable to save endpoint settings.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (monitor: Monitor) => {
    setDeletingMonitorId(monitor._id)
    setError('')
    setFeedback('')
    try {
      await deleteMonitor(monitor._id)
      setMonitors((current) => current.filter((item) => item._id !== monitor._id))
      setPendingDeleteId(null)
      if (editingMonitor?._id === monitor._id) setEditingMonitor(null)
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

  const counts = {
    up: monitors.filter((monitor) => monitor.currentStatus === 'UP').length,
    down: monitors.filter((monitor) => monitor.currentStatus === 'DOWN').length,
    unknown: monitors.filter((monitor) => monitor.currentStatus === 'UNKNOWN').length,
  }

  return (
    <main className="min-h-screen bg-muted/30 text-foreground md:flex">
      <WorkspaceSidebar
        user={user}
        activePage="endpoints"
        monitorCount={monitors.length}
        onSignOut={() => void handleSignOut()}
        isSigningOut={isSigningOut}
      />
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-background/95 px-4 backdrop-blur sm:px-6 lg:px-10">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link className="hover:text-foreground" to="/dashboard">Workspace</Link>
            <span>/</span><strong className="font-medium text-foreground">Endpoints</strong>
          </div>
          <Button
            variant="outline"
            size="icon"
            aria-label="Refresh endpoints"
            disabled={isRefreshing}
            onClick={() => {
              setIsRefreshing(true)
              void refreshMonitors()
            }}
          >
            <RefreshCw className={isRefreshing ? 'animate-spin' : ''} />
          </Button>
        </header>

        <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-10">
          <section className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-wider text-emerald-700">MONITOR MANAGEMENT</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Endpoints</h1>
              <p className="mt-1 text-sm text-muted-foreground">Edit monitor settings, inspect check history, and remove endpoints.</p>
            </div>
            <Button onClick={() => navigate('/dashboard?addMonitor=true')}>
              <Plus /> Add endpoint
            </Button>
          </section>

          {error && <Alert><AlertCircle className="mt-0.5 size-4 shrink-0" /><span>{error}</span></Alert>}
          {feedback && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">
              <span className="size-2 rounded-full bg-emerald-600" />{feedback}
            </div>
          )}

          <section className="grid gap-3 sm:grid-cols-3" aria-label="Endpoint status summary">
            <SummaryCard label="Operational" value={isLoading ? '—' : counts.up} tone="text-emerald-700" />
            <SummaryCard label="Down" value={isLoading ? '—' : counts.down} tone="text-destructive" />
            <SummaryCard label="Awaiting first check" value={isLoading ? '—' : counts.unknown} />
          </section>

          {editingMonitor && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Edit {editingMonitor.name}</CardTitle>
                <CardDescription>Changes apply to future automated checks.</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" onSubmit={handleSave}>
                  <FormField label="Monitor name">
                    <Input name="name" defaultValue={editingMonitor.name} maxLength={100} required />
                  </FormField>
                  <FormField label="Endpoint URL">
                    <Input name="url" type="url" defaultValue={editingMonitor.url} required />
                  </FormField>
                  <FormField label="Method">
                    <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50" name="method" defaultValue={editingMonitor.method}>
                      <option value="GET">GET</option><option value="POST">POST</option>
                      <option value="PUT">PUT</option><option value="DELETE">DELETE</option>
                    </select>
                  </FormField>
                  <FormField label="Check interval (seconds)">
                    <Input name="intervalSeconds" type="number" min="1" defaultValue={editingMonitor.intervalSeconds} required />
                  </FormField>
                  <FormField label="Timeout (seconds)">
                    <Input name="timeoutSeconds" type="number" min="1" defaultValue={editingMonitor.timeoutSeconds} required />
                  </FormField>
                  <div className="flex justify-end gap-2 sm:col-span-2 lg:col-span-3">
                    <Button variant="outline" type="button" disabled={isSaving} onClick={() => setEditingMonitor(null)}>Cancel</Button>
                    <Button type="submit" disabled={isSaving}>
                      {isSaving && <LoaderCircle className="animate-spin" />}
                      {isSaving ? 'Saving…' : 'Save changes'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold">All monitors</h2>
                <p className="mt-1 text-xs text-muted-foreground">Select an endpoint to view its analytics and check history.</p>
              </div>
              <Badge className="border-border bg-background text-muted-foreground">{monitors.length} total</Badge>
            </div>

            {isLoading ? (
              <Card><CardContent className="flex min-h-36 items-center justify-center gap-2 text-sm text-muted-foreground">
                <LoaderCircle className="animate-spin text-primary" size={18} /> Loading endpoints…
              </CardContent></Card>
            ) : monitors.length === 0 ? (
              <Card><CardContent className="flex min-h-56 flex-col items-center justify-center p-8 text-center">
                <h3 className="text-sm font-semibold">No endpoints configured</h3>
                <p className="mt-1 max-w-sm text-xs text-muted-foreground">Create a monitor from your overview to start tracking an API.</p>
                <Button className="mt-4" onClick={() => navigate('/dashboard?addMonitor=true')}><Plus /> Create a monitor</Button>
              </CardContent></Card>
            ) : (
              <Card className="overflow-hidden">
                <div className="hidden grid-cols-[minmax(0,1.5fr)_minmax(120px,.7fr)_minmax(145px,1fr)_auto] items-center gap-4 border-b bg-muted/40 px-4 py-3 text-xs font-medium text-muted-foreground md:grid">
                  <span>Endpoint</span><span>Status</span><span>Last checked</span><span>Manage</span>
                </div>
                <div className="divide-y">
                  {monitors.map((monitor) => {
                    const status = monitor.currentStatus.toLowerCase()
                    const statusClass = status === 'up'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      : status === 'down'
                        ? 'border-red-200 bg-red-50 text-red-800'
                        : 'border-border bg-muted/40 text-muted-foreground'

                    return (
                      <article className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[minmax(0,1.5fr)_minmax(120px,.7fr)_minmax(145px,1fr)_auto] md:items-center md:gap-4" key={monitor._id}>
                        <Link className="group flex min-w-0 items-center gap-3" to={`/endpoints/${monitor._id}`}>
                          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground"><ArrowUpRight size={17} /></span>
                          <span className="min-w-0">
                            <strong className="block truncate text-sm font-medium group-hover:text-primary">{monitor.name}</strong>
                            <span className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                              <span className="shrink-0 font-semibold">{monitor.method}</span>
                              <span className="truncate">{getHostname(monitor.url)}</span>
                              <ExternalLink className="size-3 shrink-0" />
                            </span>
                          </span>
                        </Link>
                        <div><span className="mr-2 text-[10px] text-muted-foreground md:hidden">Status</span><Badge className={statusClass}><span className={`size-1.5 rounded-full ${status === 'up' ? 'bg-emerald-600' : status === 'down' ? 'bg-red-600' : 'bg-muted-foreground'}`} />{statusLabels[monitor.currentStatus]}</Badge></div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Clock3 size={13} /><span className="md:hidden">Last checked · </span>{formatDate(monitor.lastCheckedAt)}</div>
                        <div className="flex items-center gap-1">
                          <Button variant="outline" size="icon-sm" aria-label={`Edit ${monitor.name}`} onClick={() => { setEditingMonitor(monitor); setError('') }}><Pencil /></Button>
                          {pendingDeleteId === monitor._id ? (
                            <div className="flex items-center gap-1">
                              <span className="mr-1 text-[10px] text-destructive">Delete?</span>
                              <Button variant="destructive" size="sm" disabled={deletingMonitorId === monitor._id} onClick={() => void handleDelete(monitor)}>
                                {deletingMonitorId === monitor._id ? <LoaderCircle className="animate-spin" /> : <Trash2 />}
                                Confirm
                              </Button>
                              <Button variant="ghost" size="sm" disabled={deletingMonitorId === monitor._id} onClick={() => setPendingDeleteId(null)}>Cancel</Button>
                            </div>
                          ) : (
                            <Button variant="outline" size="icon-sm" aria-label={`Delete ${monitor.name}`} onClick={() => setPendingDeleteId(monitor._id)}><Trash2 /></Button>
                          )}
                        </div>
                      </article>
                    )
                  })}
                </div>
              </Card>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}

function SummaryCard({ label, value, tone = 'text-foreground' }: { label: string; value: string | number; tone?: string }) {
  return (
    <Card><CardContent className="p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tracking-tight ${tone}`}>{value}</p>
    </CardContent></Card>
  )
}

function FormField({ label, children }: { label: string; children: ReactNode }) {
  return <label className="grid gap-1.5 text-xs font-medium">{label}{children}</label>
}
