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
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import type { AnalyticsRange, MonitorAnalytics } from '../api/monitorApi'

function buildChartData(
  trend: MonitorAnalytics['trend'],
  range: AnalyticsRange,
) {
  const isHourly = range === '24h'
  const bucketMilliseconds = isHourly ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000
  const now = new Date()
  const currentBucket = isHourly
    ? Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours())
    : Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  const bucketCount = isHourly ? 24 : range === '7d' ? 7 : 30
  const buckets = new Map(
    trend.map((point) => [
      Math.floor(new Date(point.timestamp).getTime() / bucketMilliseconds) * bucketMilliseconds,
      point,
    ]),
  )

  return Array.from({ length: bucketCount }, (_, index) => {
    const timestamp = currentBucket - (bucketCount - 1 - index) * bucketMilliseconds
    const point = buckets.get(timestamp)
    return {
      timestamp,
      label: new Intl.DateTimeFormat(
        undefined,
        isHourly ? { hour: 'numeric' } : { month: 'short', day: 'numeric' },
      ).format(timestamp),
      avgResponseTime: point?.avgResponseTime ?? null,
      successful: point?.successful ?? 0,
      failed: point?.failed ?? 0,
      rateLimited: point?.rateLimited ?? 0,
    }
  })
}

function formatChartTime(timestamp: number | undefined, range: AnalyticsRange) {
  if (timestamp === undefined || !Number.isFinite(timestamp)) return ''

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    ...(range === '24h' ? { hour: 'numeric' as const } : {}),
  }).format(timestamp)
}

export default function MonitorAnalyticsCharts({
  analytics,
  range,
}: {
  analytics: MonitorAnalytics
  range: AnalyticsRange
}) {
  const chartData = buildChartData(analytics.trend, range)
  const bucketDescription = range === '24h' ? 'Hourly' : 'Daily'

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card className="min-w-0">
        <CardHeader>
          <CardTitle className="text-sm">Average response time</CardTitle>
          <CardDescription>{bucketDescription} average, milliseconds</CardDescription>
        </CardHeader>
        <CardContent className="h-72 pr-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={24} fontSize={11} />
              <YAxis tickLine={false} axisLine={false} width={45} fontSize={11} />
              <Tooltip
                labelFormatter={(_, payload) => formatChartTime(payload?.[0]?.payload?.timestamp, range)}
                formatter={(value) => [value == null ? 'No checks' : `${value} ms`, 'Avg response']}
              />
              <Line
                type="monotone"
                dataKey="avgResponseTime"
                name="Average response"
                stroke="#0d8a65"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="min-w-0">
        <CardHeader>
          <CardTitle className="text-sm">Check outcomes</CardTitle>
          <CardDescription>{bucketDescription} successful, failed, and rate-limited checks</CardDescription>
        </CardHeader>
        <CardContent className="h-72 pr-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={24} fontSize={11} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={35} fontSize={11} />
              <Tooltip
                labelFormatter={(_, payload) => formatChartTime(payload?.[0]?.payload?.timestamp, range)}
              />
              <Legend />
              <Bar dataKey="successful" name="Successful" stackId="checks" fill="#0d8a65" radius={[2, 2, 0, 0]} />
              <Bar dataKey="failed" name="Failed" stackId="checks" fill="#dc5b54" />
              <Bar dataKey="rateLimited" name="Rate limited" stackId="checks" fill="#e7a23b" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
  