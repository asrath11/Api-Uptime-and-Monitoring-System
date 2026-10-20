import axios from 'axios'
import { z } from 'zod'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(
  /\/+$/,
  '',
)

const monitorSchema = z.object({
  _id: z.string(),
  name: z.string(),
  url: z.string(),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE']),
  intervalSeconds: z.number(),
  timeoutSeconds: z.number(),
  expectedStatusCode: z.number(),
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

export type Monitor = z.infer<typeof monitorSchema>
export type NewMonitor = {
  name: string
  url: string
  method: Monitor['method']
  intervalSeconds: number
  timeoutSeconds: number
  expectedStatusCode: number
}
export type MonitorCheck = z.infer<typeof checkResponseSchema>['data']

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
    method?: 'GET' | 'POST'
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
    data: monitor,
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
