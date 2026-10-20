import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import type {
  AnalyticsRange,
  MonitorAnalytics,
} from "@/features/monitors/api/monitorApi";

function buildChartData(
  trend: MonitorAnalytics["trend"],
  range: AnalyticsRange,
) {
  const isHourly = range === "24h";
  const bucketMilliseconds = isHourly ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

  const now = new Date();

  const currentBucket = isHourly
    ? Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        now.getUTCHours(),
      )
    : Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

  const bucketCount = isHourly ? 24 : range === "7d" ? 7 : 30;

  const buckets = new Map(
    trend.map((point) => [
      Math.floor(new Date(point.timestamp).getTime() / bucketMilliseconds) *
        bucketMilliseconds,
      point,
    ]),
  );

  return Array.from({ length: bucketCount }, (_, index) => {
    const timestamp =
      currentBucket - (bucketCount - 1 - index) * bucketMilliseconds;

    const point = buckets.get(timestamp);

    return {
      timestamp,
      label: new Intl.DateTimeFormat(
        undefined,
        isHourly
          ? { hour: "numeric", timeZone: "UTC" }
          : {
              month: "short",
              day: "numeric",
              timeZone: "UTC",
            },
      ).format(timestamp),
      avgResponseTime: point?.avgResponseTime ?? null,
      minResponseTime: point?.minResponseTime ?? null,
      maxResponseTime: point?.maxResponseTime ?? null,
      successful: point?.successful ?? 0,
      failed: point?.failed ?? 0,
      rateLimited: point?.rateLimited ?? 0,
    };
  });
}

function formatChartTime(timestamp: number | undefined, range: AnalyticsRange) {
  if (timestamp === undefined || !Number.isFinite(timestamp)) {
    return "";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    ...(range === "24h" ? { hour: "numeric" as const } : {}),
  }).format(timestamp);
}

function formatCheckTime(timestamp: number | undefined) {
  if (timestamp === undefined || !Number.isFinite(timestamp)) {
    return "";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(timestamp);
}

const tooltipContentStyle = {
  backgroundColor: "var(--popover)",
  borderColor: "var(--border)",
  borderRadius: "var(--radius)",
  color: "var(--popover-foreground)",
  fontSize: 12,
};

const axisTickStyle = {
  fill: "var(--muted-foreground)",
  fontSize: 11,
};

export default function MonitorAnalyticsCharts({
  analytics,
  range,
}: {
  analytics: MonitorAnalytics;
  range: AnalyticsRange;
}) {
  const chartData = buildChartData(analytics.trend, range);

  const responseTimeData = analytics.responseChecks
    .map((check) => ({
      timestamp: new Date(check.timestamp).getTime(),
      responseMs: check.responseMs,
    }))
    .filter(
      (check) =>
        Number.isFinite(check.timestamp) && Number.isFinite(check.responseMs),
    )
    .sort((a, b) => a.timestamp - b.timestamp);

  const bucketDescription = range === "24h" ? "Hourly" : "Daily";

  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2">
      {/* Response time chart */}
      <Card className="min-w-0 overflow-hidden">
        <CardHeader>
          <CardTitle className="text-sm">Response times</CardTitle>
          <CardDescription>
            Individual check response times in milliseconds
          </CardDescription>
        </CardHeader>

        <CardContent className="min-w-0 space-y-3 pr-4">
          <div className="h-56 w-full min-w-0">
            {responseTimeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={responseTimeData}
                  margin={{ top: 8, right: 12, bottom: 4, left: 4 }}
                >
                  <CartesianGrid
                    stroke="var(--border)"
                    strokeDasharray="3 3"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="timestamp"
                    type="number"
                    scale="time"
                    domain={["dataMin", "dataMax"]}
                    tickFormatter={(value) =>
                      formatChartTime(Number(value), range)
                    }
                    tickCount={5}
                    minTickGap={32}
                    tickLine={false}
                    axisLine={false}
                    tick={axisTickStyle}
                    padding={{ left: 4, right: 4 }}
                    fontSize={11}
                  />

                  <YAxis
                    width={48}
                    tickLine={false}
                    axisLine={false}
                    tick={axisTickStyle}
                    tickFormatter={(value) => `${value} ms`}
                    domain={[0, "auto"]}
                    allowDecimals={false}
                    fontSize={11}
                  />

                  <Tooltip
                    labelFormatter={(value) => formatCheckTime(Number(value))}
                    formatter={(value) => [
                      value == null ? "No data" : `${value} ms`,
                      "Response time",
                    ]}
                    contentStyle={tooltipContentStyle}
                  />

                  <Line
                    type="monotone"
                    dataKey="responseMs"
                    name="Response time"
                    stroke="#0d8a65"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                    connectNulls={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
                No response-time data available for this period.
              </div>
            )}
          </div>

          {analytics.responseChecksTruncated && (
            <p className="text-center text-xs text-muted-foreground">
              Showing the latest 5,000 checks in this range.
            </p>
          )}

          <div
            className="grid grid-cols-1 gap-2 sm:grid-cols-3"
            role="group"
            aria-label="Response time summary"
          >
            {[
              {
                label: "Average",
                value: analytics.avgResponseTime,
                color: "#2B2C28",
              },
              {
                label: "Minimum",
                value: analytics.minResponseTime,
                color: "#0d8a65",
              },
              {
                label: "Maximum",
                value: analytics.maxResponseTime,
                color: "#880d1e",
              },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                className="min-w-0 rounded-md border px-3 py-2 text-white"
                style={{ backgroundColor: color }}
              >
                <p className="text-[11px] opacity-80">{label}</p>

                <p className="mt-1 text-sm font-semibold tabular-nums">
                  {analytics.count > 0 && value != null ? (
                    <>
                      {value}
                      <span className="ml-1 text-xs font-normal opacity-70">
                        ms
                      </span>
                    </>
                  ) : (
                    "—"
                  )}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Check outcomes chart */}
      <Card className="min-w-0 overflow-hidden">
        <CardHeader>
          <CardTitle className="text-sm">Check outcomes</CardTitle>
          <CardDescription>
            {bucketDescription} successful, failed, and rate-limited checks
          </CardDescription>
        </CardHeader>

        <CardContent className="h-72 min-w-0 pr-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 8, right: 8, bottom: 4, left: 0 }}
            >
              <CartesianGrid
                stroke="var(--border)"
                strokeDasharray="3 3"
                vertical={false}
              />

              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={axisTickStyle}
                minTickGap={24}
                interval="preserveStartEnd"
                fontSize={11}
              />

              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                tick={axisTickStyle}
                width={35}
                fontSize={11}
              />

              <Tooltip
                labelFormatter={(_, payload) =>
                  formatChartTime(payload?.[0]?.payload?.timestamp, range)
                }
                contentStyle={tooltipContentStyle}
              />

              <Legend wrapperStyle={{ fontSize: 12 }} />

              <Bar
                dataKey="successful"
                name="Successful"
                stackId="checks"
                fill="#0d8a65"
                radius={[2, 2, 0, 0]}
                isAnimationActive={false}
              />

              <Bar
                dataKey="failed"
                name="Failed"
                stackId="checks"
                fill="#dc5b54"
                isAnimationActive={false}
              />

              <Bar
                dataKey="rateLimited"
                name="Rate limited"
                stackId="checks"
                fill="#e7a23b"
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
