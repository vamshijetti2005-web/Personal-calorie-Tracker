import type {
  CalorieReport,
  EntryInput,
  FoodEntry,
  Goal,
  GoalInput,
  GoalVsActualReport,
  MacroReport,
  MealType,
  MicronutrientReport,
  PageResponse,
} from './types'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

type ApiErrorBody = {
  status?: number
  code?: string
  message?: string
  fieldErrors?: Record<string, string>
}

export class ApiError extends Error {
  status: number
  code?: string
  fieldErrors: Record<string, string>

  constructor(
    message: string,
    status: number,
    code?: string,
    fieldErrors: Record<string, string> = {},
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.fieldErrors = fieldErrors
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers })
  if (response.status === 204) return undefined as T

  const body = (await response.json().catch(() => null)) as T | ApiErrorBody | null
  if (!response.ok) {
    const error = body as ApiErrorBody | null
    throw new ApiError(
      error?.message ?? `Request failed (${response.status})`,
      response.status,
      error?.code,
      error?.fieldErrors,
    )
  }
  return body as T
}

function query(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value))
  }
  return `?${search.toString()}`
}

export const api = {
  health: () => request<{ ok: boolean; service: string }>('/api/health'),

  goals: {
    current: () => request<Goal>('/api/goals/current'),
    list: (limit = 20, offset = 0) =>
      request<PageResponse<Goal>>(`/api/goals${query({ limit, offset })}`),
    create: (input: GoalInput) =>
      request<Goal>('/api/goals', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    delete: (id: string) =>
      request<void>(`/api/goals/${id}`, { method: 'DELETE' }),
  },

  entries: {
    get: (id: string) => request<FoodEntry>(`/api/entries/${id}`),
    list: (params: {
      from: string
      to: string
      mealType?: MealType | ''
      limit?: number
      offset?: number
    }) =>
      request<PageResponse<FoodEntry>>(
        `/api/entries${query({
          from: params.from,
          to: params.to,
          mealType: params.mealType || undefined,
          limit: params.limit ?? 20,
          offset: params.offset ?? 0,
        })}`,
      ),
    create: (input: EntryInput) =>
      request<FoodEntry>('/api/entries', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    update: (id: string, input: Partial<EntryInput>) =>
      request<FoodEntry>(`/api/entries/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    delete: (id: string) =>
      request<void>(`/api/entries/${id}`, { method: 'DELETE' }),
  },

  reports: {
    calories: (from: string, to: string, granularity: 'day' | 'week') =>
      request<CalorieReport>(
        `/api/reports/calories${query({ from, to, granularity })}`,
      ),
    macros: (from: string, to: string, granularity: 'day' | 'week') =>
      request<MacroReport>(
        `/api/reports/macros${query({ from, to, granularity })}`,
      ),
    micros: (from: string, to: string) =>
      request<MicronutrientReport>(
        `/api/reports/micros${query({ from, to })}`,
      ),
    goalVsActual: (from: string, to: string) =>
      request<GoalVsActualReport>(
        `/api/reports/goal-vs-actual${query({ from, to })}`,
      ),
  },
}
