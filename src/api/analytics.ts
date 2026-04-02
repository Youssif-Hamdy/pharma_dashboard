import api from './axios'
import { getAnalyticsSessionId } from '../lib/analyticsSession'

/** GET /api/analytics/summary */
export interface AnalyticsSummary {
  total: number
  uniqueVisitors: number
  byEvent?: { _id: string; count: number }[]
}

/** GET /api/analytics/trend?event=page_view */
export interface AnalyticsTrendPoint {
  date: string
  count: number
}

/** GET /api/analytics/product-views?limit=10 */
export interface AnalyticsProductViewRow {
  count: number
  productId?: string
  name?: string
  slug?: string
  sku?: string
  [key: string]: unknown
}

/** GET /api/analytics/page-views */
export interface AnalyticsPageViewRow {
  _id: string
  count: number
}

export interface AnalyticsEventPayload {
  name: string
  category: string
  properties: Record<string, unknown>
  sessionId: string
  userId: string
  path: string
  referrer: string
  source: string
}

export interface BatchEventItem {
  name: string
  category: string
  properties: Record<string, unknown>
}

export function createEventPayload(
  name: string,
  category: string,
  opts?: {
    properties?: Record<string, unknown>
    userId?: string
    path?: string
    referrer?: string
    source?: string
  },
): AnalyticsEventPayload {
  return {
    name,
    category,
    properties: opts?.properties ?? {},
    sessionId: getAnalyticsSessionId(),
    userId: opts?.userId ?? 'dashboard',
    path: opts?.path ?? (typeof window !== 'undefined' ? window.location.pathname : ''),
    referrer: opts?.referrer ?? (typeof document !== 'undefined' ? document.referrer : ''),
    source: opts?.source ?? 'web',
  }
}

export async function postAnalyticsEvent(body: AnalyticsEventPayload) {
  return api.post('/analytics/events', body)
}

export async function getAnalyticsEvents(params?: Record<string, string>) {
  return api.get('/analytics/events', { params })
}

export async function postAnalyticsBatch(events: BatchEventItem[]) {
  return api.post('/analytics/events/batch', { events })
}

export async function getAnalyticsSummary() {
  return api.get<AnalyticsSummary>('/analytics/summary')
}

export async function getAnalyticsTrend(event = 'page_view') {
  return api.get<AnalyticsTrendPoint[]>('/analytics/trend', { params: { event } })
}

export async function getAnalyticsProductViews(limit = 10) {
  return api.get<AnalyticsProductViewRow[]>('/analytics/product-views', { params: { limit } })
}

export async function getAnalyticsPageViews() {
  return api.get<AnalyticsPageViewRow[]>('/analytics/page-views')
}

export async function deleteAnalyticsEvent(id: string) {
  return api.delete(`/analytics/events/${id}`)
}
