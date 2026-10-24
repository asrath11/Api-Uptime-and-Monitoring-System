import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  LoaderCircle,
  Pause,
  Play,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AuthApiError } from "@/features/auth/api/authApi";
import { useAuth } from "@/features/auth/context/useAuth";
import {
  getMonitor,
  getMonitorAnalytics,
  MonitorApiError,
  updateMonitor,
  type AnalyticsRange,
  type Monitor,
  type MonitorAnalytics,
} from "@/features/monitors/api/monitorApi";
import { WorkspaceSidebar } from "@/features/monitors/components/WorkspaceSidebar";
import {
  Card as AnalyticsCard,
  CardContent as AnalyticsCardContent,
} from "@/components/ui/card";

const MonitorAnalyticsCharts = lazy(
  () => import("@/features/monitors/components/MonitorAnalyticsCharts"),
);

export default function MonitorDetailsPage() {
  const { monitorId } = useParams<{ monitorId: string }>();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [monitor, setMonitor] = useState<Monitor | null>(null);
  const [analytics, setAnalytics] = useState<MonitorAnalytics | null>(null);
  const [analyticsRange, setAnalyticsRange] = useState<AnalyticsRange>("24h");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUpdatingMonitoring, setIsUpdatingMonitoring] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  const refreshDetails = useCallback(async () => {
    if (!monitorId) {
      setError("A monitor ID is required.");
      setIsLoading(false);
      return;
    }
    try {
      const [monitorResult, analyticsResult] = await Promise.all([
        getMonitor(monitorId),
        getMonitorAnalytics(monitorId, analyticsRange),
      ]);
      setMonitor(monitorResult);
      setAnalytics(analyticsResult);
      setError("");
    } catch (loadError) {
      setError(
        loadError instanceof MonitorApiError
          ? loadError.message
          : "Unable to load monitor details.",
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [analyticsRange, monitorId]);

  useEffect(() => {
    const fetchId = window.setTimeout(() => void refreshDetails(), 0);
    return () => window.clearTimeout(fetchId);
  }, [refreshDetails]);

  const handleToggleMonitoring = async () => {
    if (!monitorId || !monitor) return;
    setIsUpdatingMonitoring(true);
    setError("");
    setFeedback("");
    try {
      const updated = await updateMonitor(monitorId, {
        isPaused: !monitor.isPaused,
      });
      setMonitor(updated);
      setFeedback(
        `${updated.name} monitoring ${updated.isPaused ? "paused" : "resumed"}.`,
      );
    } catch (toggleError) {
      setError(
        toggleError instanceof MonitorApiError
          ? toggleError.message
          : `Unable to ${monitor.isPaused ? "resume" : "pause"} monitoring.`,
      );
    } finally {
      setIsUpdatingMonitoring(false);
    }
  };

  const handleSignOut = async () => {
    setError("");
    setIsSigningOut(true);
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (logoutError) {
      setError(
        logoutError instanceof AuthApiError
          ? logoutError.message
          : "Unable to sign out. Please try again.",
      );
    } finally {
      setIsSigningOut(false);
    }
  };

  const rateLimited =
    analytics?.rateLimited ?? analytics?.rateLimitedCount ?? 0;

  return (
    <main className="min-h-screen bg-muted/30 text-foreground md:flex">
      <WorkspaceSidebar
        user={user}
        onSignOut={() => void handleSignOut()}
        isSigningOut={isSigningOut}
      />
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-background/95 px-4 backdrop-blur sm:px-6 lg:px-10">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link className="hover:text-foreground" to="/dashboard">
              Workspace
            </Link>
            <span>/</span>
            <Link className="hover:text-foreground" to="/dashboard">
              Overview
            </Link>
            {monitor && (
              <>
                <span>/</span>
                <strong className="max-w-40 truncate font-medium text-foreground">
                  {monitor.name}
                </strong>
              </>
            )}
          </div>
          <div className="flex gap-2">
            {monitor && (
              <Button
                variant="outline"
                onClick={() => void handleToggleMonitoring()}
                disabled={isUpdatingMonitoring}
              >
                {isUpdatingMonitoring ? (
                  <LoaderCircle className="animate-spin" />
                ) : monitor.isPaused ? (
                  <Play />
                ) : (
                  <Pause />
                )}
                <span className="hidden sm:inline">
                  {isUpdatingMonitoring
                    ? monitor.isPaused
                      ? "Resuming…"
                      : "Pausing…"
                    : monitor.isPaused
                      ? "Resume"
                      : "Pause"}
                </span>
              </Button>
            )}
            <Button
              variant="outline"
              size="icon"
              aria-label="Refresh monitor data"
              disabled={isRefreshing}
              onClick={() => {
                setIsRefreshing(true);
                void refreshDetails();
              }}
            >
              <RefreshCw className={isRefreshing ? "animate-spin" : ""} />
            </Button>
          </div>
        </header>

        <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-10">
          <Link
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            to="/dashboard"
          >
            <ArrowLeft size={14} /> Back to overview
          </Link>

          {error && (
            <Alert>
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>{error}</span>
            </Alert>
          )}
          {feedback && (
            <div
              className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm text-success"
              role="status"
            >
              <ShieldCheck size={16} /> {feedback}
            </div>
          )}

          {isLoading ? (
            <Card>
              <CardContent className="flex min-h-48 items-center justify-center gap-2 text-sm text-muted-foreground">
                <LoaderCircle className="animate-spin text-primary" size={18} />{" "}
                Loading monitor details…
              </CardContent>
            </Card>
          ) : monitor ? (
            <>
              <section className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-semibold tracking-wider text-primary">
                    ENDPOINT DETAILS
                  </p>
                  <h1 className="mt-2 wrap-break-words text-2xl font-semibold tracking-tight sm:text-3xl">
                    {monitor.name}
                  </h1>
                  <a
                    className="mt-1 block break-all text-sm text-muted-foreground hover:text-primary"
                    href={monitor.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {monitor.url}
                  </a>
                </div>
                <Badge
                  className={
                    monitor.isPaused
                      ? "border-warning/30 bg-warning/10 text-warning"
                      : monitor.currentStatus === "UP"
                        ? "border-success/30 bg-success/10 text-success"
                        : monitor.currentStatus === "DOWN"
                          ? "border-destructive/30 bg-destructive/10 text-destructive"
                          : "border-border bg-background text-muted-foreground"
                  }
                >
                  <span
                    className={`size-1.5 rounded-full ${monitor.isPaused ? "bg-warning" : monitor.currentStatus === "UP" ? "bg-success" : monitor.currentStatus === "DOWN" ? "bg-destructive" : "bg-muted-foreground"}`}
                  />
                  {monitor.isPaused
                    ? "Paused"
                    : monitor.currentStatus === "UP"
                      ? "Operational"
                      : monitor.currentStatus === "DOWN"
                        ? "Down"
                        : "Awaiting check"}
                </Badge>
              </section>

              <section
                className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
                aria-label="Monitor analytics"
              >
                <MetricCard
                  label="Uptime"
                  value={
                    analytics && analytics.count > 0
                      ? `${analytics.upTimePercentage.toFixed(2)}%`
                      : "—"
                  }
                  detail={
                    analytics
                      ? `${analytics.success} successful checks`
                      : "No analytics available"
                  }
                />
                <MetricCard
                  label="Average response"
                  value={
                    analytics && analytics.count > 0
                      ? `${analytics.avgResponseTime} ms`
                      : "—"
                  }
                  detail={`${analytics?.count ?? 0} recorded checks`}
                />
                <MetricCard
                  label="Failed checks"
                  value={analytics?.failure ?? "—"}
                  detail="Unexpected status or request error"
                  tone={analytics?.failure ? "text-destructive" : ""}
                />
                <MetricCard
                  label="Rate limited"
                  value={analytics ? rateLimited : "—"}
                  detail="HTTP 429 responses"
                />
              </section>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Activity size={17} /> Monitor configuration
                  </CardTitle>
                  <CardDescription>
                    {monitor.isPaused
                      ? "Automatic health checks are paused."
                      : "Current settings used by scheduled health checks."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <ConfigItem label="Request method" value={monitor.method} />
                  <ConfigItem
                    label="Check interval"
                    value={formatInterval(monitor.intervalSeconds)}
                  />
                  <ConfigItem
                    label="Request timeout"
                    value={`${monitor.timeoutSeconds}s`}
                  />
                </CardContent>
              </Card>

              <section
                className="space-y-3"
                aria-labelledby="analytics-heading"
              >
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2
                      className="text-base font-semibold"
                      id="analytics-heading"
                    >
                      Analytics
                    </h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Response time and check outcomes over the selected period.
                    </p>
                  </div>
                  <div
                    className="flex items-center gap-1 rounded-lg border bg-background p-1"
                    aria-label="Analytics time range"
                  >
                    {(
                      [
                        ["24h", "24 hours"],
                        ["7d", "7 days"],
                        ["30d", "30 days"],
                      ] as const
                    ).map(([range, label]) => (
                      <Button
                        key={range}
                        size="sm"
                        variant={analyticsRange === range ? "default" : "ghost"}
                        aria-pressed={analyticsRange === range}
                        disabled={isRefreshing}
                        onClick={() => {
                          setIsRefreshing(true);
                          setAnalyticsRange(range);
                        }}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>
                {!analytics || analytics.count === 0 ? (
                  <Card>
                    <CardContent className="flex min-h-52 flex-col items-center justify-center p-8 text-center">
                      <Activity className="size-6 text-muted-foreground" />
                      <h3 className="mt-3 text-sm font-semibold">
                        No analytics yet
                      </h3>
                      <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                        {monitor.isPaused
                          ? "Resume monitoring to collect check history and populate analytics."
                          : "Scheduled checks will populate analytics as monitoring data is collected."}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <Suspense
                    fallback={
                      <AnalyticsCard>
                        <AnalyticsCardContent className="flex h-72 items-center justify-center gap-2 text-sm text-muted-foreground">
                          <LoaderCircle
                            className="animate-spin text-primary"
                            size={18}
                          />{" "}
                          Loading analytics charts…
                        </AnalyticsCardContent>
                      </AnalyticsCard>
                    }
                  >
                    <MonitorAnalyticsCharts
                      analytics={analytics}
                      range={analytics.range}
                    />
                  </Suspense>
                )}
              </section>
            </>
          ) : (
            <Card>
              <CardContent className="flex min-h-44 flex-col items-center justify-center p-8 text-center">
                <h2 className="text-sm font-semibold">Monitor unavailable</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  This monitor may have been deleted or is not accessible.
                </p>
                <Button
                  className="mt-4"
                  variant="outline"
                  onClick={() => navigate("/dashboard")}
                >
                  Return to overview
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}

function MetricCard({
  label,
  value,
  detail,
  tone = "",
}: {
  label: string;
  value: string | number;
  detail: string;
  tone?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`mt-1 text-2xl font-semibold tracking-tight ${tone}`}>
          {value}
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}

function ConfigItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}

function formatInterval(seconds: number) {
  if (seconds < 60) return `Every ${seconds}s`;
  if (seconds % 60 === 0) return `Every ${seconds / 60} min`;
  return `Every ${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}
