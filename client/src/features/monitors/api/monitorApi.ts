import axios from 'axios'
import { z } from 'zod'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(
  /\/+$/,
  '',
)

export type AnalyticsRange = '24h' | '7d' | '30d'

const monitorSchema = z.object({
  _id: z.string(),
  name: z.string(),
  url: z.string(),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE']),
  intervalSeconds: z.number(),
  timeoutSeconds: z.number(),
  currentStatus: z.enum(['UP', 'DOWN', 'UNKNOWN']),
  lastCheckedAt: z.string().nullable(),
})

const monitorListSchema = z.object({
  success: z.literal(true),
  data: z.array(monitorSchema),
})

const createMonitorResponseSchema = z.object({
  success: z.literal(true),
  data: monitorSchema,
})

const checkResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    status: z.enum(['UP', 'DOWN', 'RATE_LIMITED']),
    responseTimeMs: z.number(),
  }),
})

const analyticsResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    monitorId: z.string(),
    analytics: z.object({
      range: z.enum(['24h', '7d', '30d']),
      count: z.number(),
      avgResponseTime: z.number(),
      success: z.number(),
      failure: z.number(),
      rateLimited: z.number().optional(),
      rateLimitedCount: z.number().optional(),
      upTimePercentage: z.number(),
      trend: z.array(
        z.object({
          timestamp: z.string(),
          avgResponseTime: z.number(),
          successful: z.number(),
          failed: z.number(),
          rateLimited: z.number(),
          count: z.number(),
        }),
      ),
    }),
  }),
})

export type Monitor = z.infer<typeof monitorSchema>
export type NewMonitor = {
  name: string
  url: string
  method: Monitor['method']
  intervalSeconds: number
  timeoutSeconds: number
}
export type MonitorCheck = z.infer<typeof checkResponseSchema>['data']
export type MonitorAnalytics = z.infer<typeof analyticsResponseSchema>['data']['analytics']

export class MonitorApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'MonitorApiError'
    this.status = status
  }
}

async function request(
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
    data?: unknown
  } = {},
): Promise<unknown> {
  try {
    const response = await axios.request<unknown>({
      baseURL: API_BASE_URL,
      url: path,
      method: options.method ?? 'GET',
      data: options.data,
      withCredentials: true,
      headers: { Accept: 'application/json' },
    })
    return response.data
  } catch (error) {
    if (!axios.isAxiosError(error)) {
      throw error
    }

    if (!error.response) {
      throw new MonitorApiError(
        'Unable to reach the server. Check your connection and try again.',
        0,
      )
    }

    const payload: unknown = error.response.data
    const message =
      typeof payload === 'object' && payload !== null && 'message' in payload &&
      typeof payload.message === 'string'
        ? payload.message
        : 'The request could not be completed.'

    throw new MonitorApiError(message, error.response.status)
  }
}

export async function getMonitors(): Promise<Monitor[]> {
  const payload = await request('/monitors')
  const result = monitorListSchema.safeParse(payload)
  if (!result.success) {
    throw new MonitorApiError(
      'The server returned an unexpected monitor list.',
      502,
    )
  }
  return result.data.data
}

export async function createMonitor(
  monitor: NewMonitor,
): Promise<Monitor> {
  const payload = await request('/monitors', {
    method: 'POST',
    data: { ...monitor, expectedStatusCode: 200 },
  })
  const result = createMonitorResponseSchema.safeParse(payload)
  if (!result.success) {
    throw new MonitorApiError(
      'The server returned an unexpected monitor response.',
      502,
    )
  }
  return result.data.data
}

export async function updateMonitor(
  monitorId: string,
  updates: Partial<NewMonitor>,
): Promise<Monitor> {
  const payload = await request(`/monitors/${monitorId}`, {
    method: 'PATCH',
    data: updates,
  })
  const result = createMonitorResponseSchema.safeParse(payload)
  if (!result.success) {
    throw new MonitorApiError(
      'The server returned an unexpected monitor response.',
      502,
    )
  }
  return result.data.data
}

export async function deleteMonitor(monitorId: string): Promise<void> {
  const payload = await request(`/monitors/${monitorId}`, {
    method: 'DELETE',
  })
  const result = z.object({ success: z.literal(true) }).safeParse(payload)
  if (!result.success) {
    throw new MonitorApiError(
      'The server returned an unexpected delete response.',
      502,
    )
  }
}

export async function getMonitor(monitorId: string): Promise<Monitor> {
  const payload = await request(`/monitors/${monitorId}`)
  const result = createMonitorResponseSchema.safeParse(payload)
  if (!result.success) {
    throw new MonitorApiError(
      'The server returned an unexpected monitor response.',
      502,
    )
  }
  return result.data.data
}

export async function getMonitorAnalytics(
  monitorId: string,
  range: AnalyticsRange = '24h',
): Promise<MonitorAnalytics> {
  const payload = await request(
    `/monitors/${monitorId}/analytics?range=${range}`,
  )
  const result = analyticsResponseSchema.safeParse(payload)
  if (!result.success) {
    throw new MonitorApiError(
      'The server returned unexpected monitor analytics.',
      502,
    )
  }
  return result.data.data.analytics
}

export async function runMonitorCheck(
  monitorId: string,
): Promise<MonitorCheck> {
  const payload = await request(`/monitors/${monitorId}/checks`, {
    method: 'POST',
  })
  const result = checkResponseSchema.safeParse(payload)
  if (!result.success) {
    throw new MonitorApiError(
      'The server returned an unexpected check result.',
      502,
    )
  }
  return result.data.data
}
