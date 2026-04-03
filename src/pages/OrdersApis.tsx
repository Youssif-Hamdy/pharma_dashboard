import  { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { RefreshCw, Trash2, MapPin, ChevronDown } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import api from '../api/axios'
import Navbar from '../components/Navbar'
import { useToast } from '../components/ToastContext'

type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'

interface OrderItem {
  _id: string
  customerName: string
  phone: string
  addressText: string
  productName: string
  price: number | null
  quantity: number
  status: OrderStatus
  createdAt?: string
  location?: { lat: number; lng: number }
}

const ORDER_STATUS_OPTIONS: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const arrowMarkerIcon = L.divIcon({
  html: '<div style="width:0;height:0;border-left:10px solid transparent;border-right:10px solid transparent;border-bottom:18px solid #16a34a;transform:rotate(45deg);"></div>',
  className: '',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

function asStatus(value: unknown): OrderStatus {
  if (typeof value === 'string' && ORDER_STATUS_OPTIONS.includes(value as OrderStatus)) return value as OrderStatus
  return 'pending'
}

function statusLabel(status: OrderStatus): string {
  if (status === 'pending') return 'قيد الانتظار'
  if (status === 'confirmed') return 'تم التأكيد'
  if (status === 'shipped') return 'تم الشحن'
  if (status === 'delivered') return 'تم التسليم'
  return 'ملغي'
}

function statusBadgeClass(status: OrderStatus): string {
  if (status === 'pending') return 'bg-amber-50 text-amber-700 border-amber-200'
  if (status === 'confirmed') return 'bg-blue-50 text-blue-700 border-blue-200'
  if (status === 'shipped') return 'bg-purple-50 text-purple-700 border-purple-200'
  if (status === 'delivered') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  return 'bg-red-50 text-red-700 border-red-200'
}

function normalizeOrder(raw: Record<string, unknown>): OrderItem {
  const id = raw._id ?? raw.id
  const user = raw.user as Record<string, unknown> | undefined
  const productObj = raw.product as Record<string, unknown> | undefined
  const customer =
    (typeof raw.customerName === 'string' && raw.customerName) ||
    (typeof raw.name === 'string' && raw.name) ||
    (typeof user?.name === 'string' && user.name) ||
    (typeof user?.email === 'string' && user.email) ||
    '—'

  const phone =
    (typeof raw.phone === 'string' && raw.phone) ||
    (typeof user?.phone === 'string' && user.phone) ||
    '—'
  const addressText =
    (typeof raw.addressText === 'string' && raw.addressText) ||
    (typeof raw.address === 'string' && raw.address) ||
    '—'
  const quantityValue = Number(raw.quantity ?? 1)
  const locationObj = raw.location as Record<string, unknown> | undefined
  const latValue = Number(locationObj?.lat)
  const lngValue = Number(locationObj?.lng)

  const directProductName =
    (typeof productObj?.name === 'string' && productObj.name) ||
    (typeof raw.productName === 'string' && raw.productName) ||
    ''
  const directPriceRaw = productObj?.price ?? raw.price ?? null
  const directPriceValue = directPriceRaw === null ? null : Number(directPriceRaw)

  const lineItems =
    (Array.isArray(raw.items) && raw.items) ||
    (Array.isArray(raw.orderItems) && raw.orderItems) ||
    (Array.isArray(raw.products) && raw.products) ||
    []

  const firstLineItem = lineItems[0] as Record<string, unknown> | undefined
  const firstProductObj = firstLineItem?.product as Record<string, unknown> | undefined
  const lineItemName =
    (typeof firstLineItem?.name === 'string' && firstLineItem.name) ||
    (typeof firstLineItem?.productName === 'string' && firstLineItem.productName) ||
    (typeof firstProductObj?.name === 'string' && firstProductObj.name) ||
    ''
  const lineItemPriceRaw = firstProductObj?.price ?? firstLineItem?.price ?? null
  const lineItemPriceValue = lineItemPriceRaw === null ? null : Number(lineItemPriceRaw)

  const products = lineItems
    .map((item) => {
      const asObj = item as Record<string, unknown>
      const product = asObj.product as Record<string, unknown> | undefined
      const name =
        (typeof asObj.name === 'string' && asObj.name) ||
        (typeof asObj.productName === 'string' && asObj.productName) ||
        (typeof product?.name === 'string' && product.name) ||
        (typeof asObj.title === 'string' && asObj.title) ||
        ''
      return name.trim()
    })
    .filter(Boolean)

  return {
    _id: String(id ?? ''),
    customerName: customer,
    phone,
    addressText,
    productName: directProductName || lineItemName || (products[0] ?? '—'),
    price: Number.isFinite(directPriceValue as number)
      ? (directPriceValue as number)
      : Number.isFinite(lineItemPriceValue as number)
        ? (lineItemPriceValue as number)
        : null,
    quantity: Number.isFinite(quantityValue) ? quantityValue : 1,
    status: asStatus(raw.status),
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : undefined,
    location: Number.isFinite(latValue) && Number.isFinite(lngValue) ? { lat: latValue, lng: lngValue } : undefined,
  }
}

function parseOrders(resData: unknown): OrderItem[] {
  const raw = resData as Record<string, unknown>
  const listRaw = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.data)
      ? (raw.data as unknown[])
      : []
  return listRaw
    .map((x) => normalizeOrder(x as Record<string, unknown>))
    .filter((o) => Boolean(o._id))
}

export default function OrdersApis() {
  const toast = useToast()
  const [orders, setOrders] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [activeOrder, setActiveOrder] = useState<OrderItem | null>(null)
  const [draftStatus, setDraftStatus] = useState<OrderStatus>('pending')

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const res = await api.get('/orders')
      setOrders(parseOrders(res.data))
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? ((err.response?.data as { message?: string } | undefined)?.message ?? err.message)
        : 'فشل تحميل الطلبات'
      toast.error('فشل تحميل الطلبات', message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchOrders()
  }, [])

  const statusById = useMemo(
    () => orders.reduce<Record<string, OrderStatus>>((acc, o) => ({ ...acc, [o._id]: o.status }), {}),
    [orders],
  )

  const handleStatusUpdate = async (id: string, status: OrderStatus) => {
    setUpdatingId(id)
    try {
      await api.put(`/orders/${id}/status`, { status })
      setOrders((prev) => prev.map((o) => (o._id === id ? { ...o, status } : o)))
      toast.success('تم تحديث الحالة')
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? ((err.response?.data as { message?: string } | undefined)?.message ?? err.message)
        : 'فشل تحديث الحالة'
      toast.error('فشل تحديث الحالة', message)
    } finally {
      setUpdatingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    const ok = await toast.confirm({
      title: 'حذف الطلب؟',
      description: 'لن يمكن التراجع عن هذا الإجراء.',
      confirmLabel: 'حذف',
      cancelLabel: 'إلغاء',
    })
    if (!ok) return
    setDeletingId(id)
    try {
      await api.delete(`/orders/${id}`)
      setOrders((prev) => prev.filter((o) => o._id !== id))
      toast.success('تم حذف الطلب')
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? ((err.response?.data as { message?: string } | undefined)?.message ?? err.message)
        : 'فشل حذف الطلب'
      toast.error('فشل حذف الطلب', message)
    } finally {
      setDeletingId(null)
    }
  }

  const openOrderModal = (order: OrderItem) => {
    setActiveOrder(order)
    setDraftStatus(statusById[order._id] ?? order.status)
  }

  const closeOrderModal = () => {
    if (updatingId || deletingId) return
    setActiveOrder(null)
  }

  return (
    <div className="flex flex-col gap-6 min-h-[calc(100vh-3rem)]">
      <Navbar title="Order" />

      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
          <h2 className="text-sm font-medium text-gray-700">Order</h2>
          <button
            type="button"
            onClick={() => void fetchOrders()}
            className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 hover:bg-gray-50 cursor-pointer inline-flex items-center gap-1.5"
          >
            <RefreshCw size={13} /> تحديث
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-sm text-gray-500 text-center">جاري تحميل الطلبات...</div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-sm text-gray-500 text-center">لا توجد طلبات</div>
        ) : (
          <>
            <div className="md:hidden p-3 space-y-3">
              {orders.map((o) => (
                <article
                  key={o._id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openOrderModal(o)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      openOrderModal(o)
                    }
                  }}
                  className="border border-gray-100 rounded-2xl p-3.5 shadow-sm bg-white cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{o.customerName}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{o.phone}</p>
                    </div>
                    <span className={`text-[11px] px-2.5 py-1 rounded-full border font-medium ${statusBadgeClass(o.status)}`}>
                      {statusLabel(o.status)}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-gray-600">
                    <p><span className="text-gray-400">العنوان:</span> {o.addressText}</p>
                    <p className="line-clamp-2"><span className="text-gray-400">المنتج:</span> {o.productName}</p>
                    <p><span className="text-gray-400">السعر:</span> {o.price === null ? '—' : `${o.price} ج.م`}</p>
                    <p><span className="text-gray-400">الكمية:</span> {o.quantity}</p>
                  </div>

                  <p className="text-[11px] text-gray-400 mt-3">اضغط لعرض الخيارات</p>
                </article>
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs">
                  <th className="text-right px-4 py-3 font-medium">العميل</th>
                  <th className="text-right px-4 py-3 font-medium">الهاتف</th>
                  <th className="text-right px-4 py-3 font-medium">العنوان</th>
                  <th className="text-right px-4 py-3 font-medium">المنتج</th>
                  <th className="text-right px-4 py-3 font-medium">السعر</th>
                  <th className="text-right px-4 py-3 font-medium">الكمية</th>
                  <th className="text-right px-4 py-3 font-medium">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr
                    key={o._id}
                    onClick={() => openOrderModal(o)}
                    className="border-t border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3 text-gray-700">{o.customerName}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{o.phone}</td>
                    <td className="px-4 py-3 text-gray-600">{o.addressText}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-[340px]">{o.productName}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {o.price === null ? '—' : `${o.price} ج.م`}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{o.quantity}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${statusBadgeClass(o.status)}`}>
                        {statusLabel(o.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </>
        )}
      </section>

      {activeOrder && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={closeOrderModal}>
          <div
            className="w-full max-w-md rounded-2xl bg-white border border-gray-100 shadow-xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-gray-800 mb-1">{activeOrder.customerName}</h3>
            <p className="text-xs text-gray-500 mb-4 line-clamp-2">{activeOrder.productName}</p>

            <label className="text-xs text-gray-500 mb-1 block">تغيير الحالة</label>
            <div className="rounded-xl border border-gray-200 px-3 py-2.5 bg-white">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${statusBadgeClass(draftStatus)}`}>
                  {statusLabel(draftStatus)}
                </span>
                <ChevronDown size={14} className="text-gray-400" />
              </div>
              <select
                value={draftStatus}
                onChange={(e) => setDraftStatus(e.target.value as OrderStatus)}
                className="w-full text-sm bg-transparent outline-none"
              >
                {ORDER_STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{statusLabel(s)}</option>
                ))}
              </select>
            </div>

            {activeOrder.location && (
              <div className="mt-4">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
                  <MapPin size={13} />
                  {activeOrder.location.lat.toFixed(4)}, {activeOrder.location.lng.toFixed(4)}
                </div>
                <div className="h-52 rounded-xl overflow-hidden border border-gray-200">
                  <MapContainer
                    center={[activeOrder.location.lat, activeOrder.location.lng]}
                    zoom={14}
                    className="h-full w-full"
                  >
                    <TileLayer
                      attribution='&copy; OpenStreetMap contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={[activeOrder.location.lat, activeOrder.location.lng]} icon={arrowMarkerIcon}>
                      <Popup>{activeOrder.addressText || 'موقع الطلب'}</Popup>
                    </Marker>
                  </MapContainer>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-2 mt-5">
              <button
                type="button"
                onClick={() => void handleDelete(activeOrder._id)}
                disabled={deletingId === activeOrder._id || updatingId === activeOrder._id}
                className="inline-flex items-center gap-1 text-xs px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-60"
              >
                <Trash2 size={13} /> حذف الطلب
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={closeOrderModal}
                  className="text-xs px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await handleStatusUpdate(activeOrder._id, draftStatus)
                    setActiveOrder((prev) => (prev ? { ...prev, status: draftStatus } : prev))
                  }}
                  disabled={updatingId === activeOrder._id || deletingId === activeOrder._id}
                  className="text-xs px-3 py-2 rounded-lg text-white disabled:opacity-60"
                  style={{ background: 'var(--primary)' }}
                >
                  حفظ الحالة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
