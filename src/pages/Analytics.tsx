import { useEffect, useMemo, useState } from 'react'
import { Users, Eye, BarChart3, Loader2 } from 'lucide-react'
import Navbar from '../components/Navbar'
import {
  getAnalyticsSummary,
  getAnalyticsTrend,
  getAnalyticsProductViews,
  getAnalyticsPageViews,
  type AnalyticsSummary,
  type AnalyticsTrendPoint,
  type AnalyticsProductViewRow,
  type AnalyticsPageViewRow,
} from '../api/analytics'

const primary = '#00875A'
const primaryMuted = '#1a5c3a'

function formatShortDate(iso: string) {
  const d = new Date(iso + (iso.includes('T') ? '' : 'T12:00:00'))
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })
}

function AnalyticsTrendChart({ data }: { data: AnalyticsTrendPoint[] }) {
  const { pathD, points, maxY } = useMemo(() => {
    if (!data.length) return { pathD: '', points: [] as { x: number; y: number; label: string; n: number }[], maxY: 0 }
    const w = 320
    const h = 140
    const pad = { t: 12, r: 8, b: 28, l: 8 }
    const innerW = w - pad.l - pad.r
    const innerH = h - pad.t - pad.b
    const max = Math.max(...data.map((d) => d.count), 1)
    const step = data.length > 1 ? innerW / (data.length - 1) : 0
    const pts = data.map((d, i) => {
      const x = pad.l + (data.length > 1 ? i * step : innerW / 2)
      const y = pad.t + innerH - (d.count / max) * innerH
      return { x, y, label: formatShortDate(d.date), n: d.count }
    })
    const dPath =
      pts.length > 0
        ? `M ${pts.map((p) => `${p.x},${p.y}`).join(' L ')}`
        : ''
    return { pathD: dPath, points: pts, maxY: max }
  }, [data])

  if (!data.length) {
    return (
      <p className="text-sm text-gray-400 text-center py-10">لا توجد بيانات زيارات بعد</p>
    )
  }

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox="0 0 320 160" className="w-full max-w-full h-40" role="img" aria-label="اتجاه الزيارات اليومية">
        <defs>
          <linearGradient id="analyticsTrendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={primary} stopOpacity="0.25" />
            <stop offset="100%" stopColor={primary} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <line
            key={t}
            x1="8"
            y1={12 + (140 - 40) * t}
            x2="312"
            y2={12 + (140 - 40) * t}
            stroke="#f3f4f6"
            strokeWidth="1"
          />
        ))}
        {pathD && (
          <>
            <path
              d={`${pathD} L ${points[points.length - 1]?.x ?? 0},124 L ${points[0]?.x ?? 0},124 Z`}
              fill="url(#analyticsTrendFill)"
            />
            <path d={pathD} fill="none" stroke={primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </>
        )}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill="white" stroke={primary} strokeWidth="2" />
            <text x={p.x} y="148" textAnchor="middle" className="fill-gray-400 text-[9px] font-sans">
              {p.label}
            </text>
          </g>
        ))}
        <text x="8" y="10" className="fill-gray-400 text-[9px] font-sans">
          أعلى: {maxY}
        </text>
      </svg>
    </div>
  )
}

function HorizontalBars({ rows, emptyText }: { rows: { label: string; count: number }[]; emptyText: string }) {
  const max = Math.max(...rows.map((r) => r.count), 1)
  if (!rows.length) {
    return <p className="text-sm text-gray-400 text-center py-8">{emptyText}</p>
  }
  return (
    <ul className="space-y-3" dir="rtl">
      {rows.map((r, i) => (
        <li key={`${r.label}-${i}`}>
          <div className="flex justify-between text-xs text-gray-600 mb-1 gap-2">
            <span className="truncate font-medium text-gray-700" title={r.label}>
              {r.label}
            </span>
            <span className="shrink-0 tabular-nums text-gray-500">{r.count}</span>
          </div>
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.round((r.count / max) * 100)}%`,
                background: `linear-gradient(90deg, ${primaryMuted}, ${primary})`,
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

function Analytics() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [trend, setTrend] = useState<AnalyticsTrendPoint[]>([])
  const [productViews, setProductViews] = useState<AnalyticsProductViewRow[]>([])
  const [pageViews, setPageViews] = useState<AnalyticsPageViewRow[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setErr(null)
      try {
        const [sRes, tRes, pRes, pvRes] = await Promise.all([
          getAnalyticsSummary(),
          getAnalyticsTrend('page_view'),
          getAnalyticsProductViews(10),
          getAnalyticsPageViews(),
        ])
        if (cancelled) return
        setSummary(sRes.data)
        setTrend(Array.isArray(tRes.data) ? tRes.data : [])
        setProductViews(Array.isArray(pRes.data) ? pRes.data : [])
        setPageViews(Array.isArray(pvRes.data) ? pvRes.data : [])
      } catch {
        if (!cancelled) setErr('تعذر تحميل إحصائيات الزيارات')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const productBarRows = useMemo(() => {
    return productViews.map((row) => {
      const name =
        (typeof row.name === 'string' && row.name) ||
        (typeof row.slug === 'string' && row.slug) ||
        (typeof row.productId === 'string' && row.productId) ||
        (typeof row.sku === 'string' && row.sku) ||
        'منتج'
      return { label: name, count: row.count }
    })
  }, [productViews])

  const pageBarRows = useMemo(() => {
    return [...pageViews]
      .map((r) => ({ label: r._id || '/', count: r.count }))
      .sort((a, b) => b.count - a.count)
  }, [pageViews])

  return (
    <div className="flex flex-col gap-6">
      <Navbar title="تحليلات الزيارات" />

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <BarChart3 size={18} style={{ color: primary }} />
            نظرة عامة على الزيارات
          </h2>
          {loading && (
            <span className="flex items-center gap-1.5 text-xs text-gray-400">
              <Loader2 size={14} className="animate-spin" /> جاري التحميل
            </span>
          )}
        </div>
        {err && (
          <p className="text-sm text-red-500 mb-4" role="alert">
            {err}
          </p>
        )}
        {!err && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl border border-gray-50 bg-gray-50/50 p-4">
              <p className="text-xs text-gray-500 mb-3 font-medium">ملخص</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                  <div className="flex items-center gap-2 text-gray-500 text-xs mb-2">
                    <Eye size={16} /> إجمالي الزيارات
                  </div>
                  <p className="text-2xl font-semibold text-gray-800 tabular-nums">
                    {summary?.total ?? '—'}
                  </p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                  <div className="flex items-center gap-2 text-gray-500 text-xs mb-2">
                    <Users size={16} /> زوار فريدون
                  </div>
                  <p className="text-2xl font-semibold text-gray-800 tabular-nums">
                    {summary?.uniqueVisitors ?? '—'}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-gray-50 bg-gray-50/50 p-4">
              <p className="text-xs text-gray-500 mb-2 font-medium">اتجاه يومي (مشاهدات الصفحات)</p>
              <AnalyticsTrendChart data={trend} />
            </div>
            <div className="rounded-xl border border-gray-50 bg-gray-50/50 p-4 lg:col-span-1">
              <p className="text-xs text-gray-500 mb-3 font-medium">أكثر المنتجات مشاهدة</p>
              <HorizontalBars
                rows={productBarRows}
                emptyText="لا توجد مشاهدات منتجات مسجّلة بعد"
              />
            </div>
            <div className="rounded-xl border border-gray-50 bg-gray-50/50 p-4 lg:col-span-1">
              <p className="text-xs text-gray-500 mb-3 font-medium">توزيع المسارات</p>
              <HorizontalBars rows={pageBarRows} emptyText="لا توجد بيانات صفحات" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Analytics
