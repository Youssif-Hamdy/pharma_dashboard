import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  RefreshCw, Trash2, MapPin, Clock, CheckCircle2,
  Truck, Star, XCircle, ChevronRight, Package,
} from "lucide-react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import api from "../api/axios";
import { useToast } from "../components/ToastContext";
import {
  arrowMarkerIcon,
  parseOrders,
  statusBadgeClass,
  statusLabel,
  type OrderItem,
  type OrderStatus,
} from "./orders/ordersUtils";

/* ─── Step meta ────────────────────────────────────────────── */
const STEPS = [
  {
    key: "pending" as OrderStatus,
    label: "قيد الانتظار",
    Icon: Clock,
    color: "#d97706",
    bg: "#fffbeb",
    border: "#fcd34d",
    glow: "rgba(217,119,6,0.22)",
  },
  {
    key: "confirmed" as OrderStatus,
    label: "تم التأكيد",
    Icon: CheckCircle2,
    color: "#2563eb",
    bg: "#eff6ff",
    border: "#93c5fd",
    glow: "rgba(37,99,235,0.22)",
  },
  {
    key: "shipped" as OrderStatus,
    label: "تم الشحن",
    Icon: Truck,
    color: "#7c3aed",
    bg: "#f5f3ff",
    border: "#c4b5fd",
    glow: "rgba(124,58,237,0.22)",
  },
  {
    key: "delivered" as OrderStatus,
    label: "تم التسليم",
    Icon: Star,
    color: "#059669",
    bg: "#ecfdf5",
    border: "#6ee7b7",
    glow: "rgba(5,150,105,0.22)",
  },
] as const;

/* ─── StatusTimeline ───────────────────────────────────────── */
function StatusTimeline({
  current,
  draft,
  onChange,
}: {
  current: OrderStatus;
  draft: OrderStatus;
  onChange: (s: OrderStatus) => void;
}) {
  const isCancelled = draft === "cancelled";
  const draftIdx = STEPS.findIndex((s) => s.key === draft);

  return (
    <div dir="rtl">
      <style>{`
        @keyframes stepPop {
          0%  { transform:scale(.82); opacity:0; }
          70% { transform:scale(1.08); }
          100%{ transform:scale(1);   opacity:1; }
        }
        @keyframes lineExpand {
          from { transform:scaleX(0); }
          to   { transform:scaleX(1); }
        }
        @keyframes glowPulse {
          0%,100%{ box-shadow:0 0 0 0 var(--glow); }
          50%    { box-shadow:0 0 0 7px var(--glow); }
        }
        .step-pop  { animation: stepPop  .35s cubic-bezier(.22,1,.36,1) both; }
        .line-grow { animation: lineExpand .55s cubic-bezier(.22,1,.36,1) both; transform-origin:right; }
        .glow-ring { animation: glowPulse 2s ease-in-out infinite; }
      `}</style>

      {/* ── 4-step track ── */}
      <div className="relative flex items-start justify-between mb-5">
        {STEPS.map((step, idx) => {
          const isPast   = !isCancelled && idx < draftIdx;
          const isActive = !isCancelled && idx === draftIdx;
          const isFuture = isCancelled || idx > draftIdx;
          const isLast   = idx === STEPS.length - 1;
          const StepIcon = step.Icon;

          return (
            <div key={step.key} className="flex-1 flex flex-col items-center relative z-10">

              {/* Connector line (sits behind circles) */}
              {!isLast && (
                <div
                  className="absolute top-[21px] right-[calc(50%+20px)] left-[calc(-50%+20px)] h-[3px] rounded-full overflow-hidden"
                  style={{
                    background: isCancelled
                      ? "#fee2e2"
                      : isPast
                        ? `linear-gradient(to left, ${STEPS[idx + 1].color}55, ${step.color}88)`
                        : "#e5e7eb",
                    zIndex: 0,
                  }}
                >
                  {isPast && !isCancelled && (
                    <div
                      className="h-full rounded-full line-grow"
                      style={{
                        background: `linear-gradient(to left, ${STEPS[idx + 1].color}, ${step.color})`,
                        animationDelay: `${idx * 80}ms`,
                      }}
                    />
                  )}
                </div>
              )}

              {/* Circle button */}
              <button
                type="button"
                onClick={() => !isCancelled && onChange(step.key)}
                disabled={isCancelled}
                className={`step-pop relative w-11 h-11 rounded-full flex items-center justify-center border-[2.5px] transition-all duration-300 ${
                  isCancelled
                    ? "cursor-not-allowed opacity-40"
                    : "cursor-pointer hover:scale-110 active:scale-95"
                } ${isActive ? "glow-ring" : ""}`}
                style={{
                  background:    isFuture ? "#f9fafb" : step.bg,
                  borderColor:   isFuture ? "#e5e7eb" : isActive ? step.color : step.border,
                  color:         isFuture ? "#9ca3af" : step.color,
                  animationDelay: `${idx * 55}ms`,
                  ...(isActive ? { "--glow": step.glow } as React.CSSProperties : {}),
                }}
              >
                {isPast ? (
                  <CheckCircle2 size={19} strokeWidth={2.5} style={{ color: step.color }} />
                ) : (
                  <StepIcon size={17} strokeWidth={2} fill={step.key === "delivered" && !isFuture ? "currentColor" : "none"} />
                )}
              </button>

              {/* Label */}
              <span
                className="mt-2 text-[10.5px] font-semibold text-center leading-tight whitespace-nowrap"
                style={{
                  color: isFuture || isCancelled
                    ? "#9ca3af"
                    : isActive
                      ? step.color
                      : step.color + "cc",
                }}
              >
                {step.label}
              </span>

              {/* Active dot */}
              {isActive && !isCancelled && (
                <div
                  className="mt-1.5 w-1.5 h-1.5 rounded-full"
                  style={{ background: step.color, animation: "glowPulse 1.4s ease-in-out infinite", "--glow": step.glow } as React.CSSProperties}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* ── Change arrow summary ── */}
      {!isCancelled && draft !== current && (
        <div
          className="flex items-center justify-center gap-2 text-xs font-medium rounded-2xl px-4 py-2 mb-4 border"
          style={{
            background: STEPS[draftIdx]?.bg ?? "#f9fafb",
            borderColor: STEPS[draftIdx]?.border ?? "#e5e7eb",
            color: STEPS[draftIdx]?.color ?? "#374151",
          }}
        >
          <span className="opacity-60">{statusLabel(current)}</span>
          <ChevronRight size={12} className="rotate-180 shrink-0" />
          <span className="font-bold">{statusLabel(draft)}</span>
        </div>
      )}

      {/* ── Cancel toggle ── */}
      <div className="flex justify-center pt-1">
        <button
          type="button"
          onClick={() => onChange(draft === "cancelled" ? current : "cancelled")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-semibold transition-all duration-200 ${
            isCancelled
              ? "bg-red-50 border-red-300 text-red-700 shadow-inner"
              : "bg-white border-gray-200 text-gray-400 hover:bg-red-50 hover:border-red-200 hover:text-red-600"
          }`}
        >
          <XCircle size={13} />
          {isCancelled ? "إلغاء الطلب ✓" : "إلغاء الطلب"}
        </button>
      </div>
    </div>
  );
}

/* ─── Main page ────────────────────────────────────────────── */
export default function OrdersApis() {
  const toast = useToast();
  const [orders, setOrders]         = useState<OrderItem[]>([]);
  const [loading, setLoading]       = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activeOrder, setActiveOrder] = useState<OrderItem | null>(null);
  const [draftStatus, setDraftStatus] = useState<OrderStatus>("pending");

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get("/orders");
      setOrders(parseOrders(res.data));
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? ((err.response?.data as { message?: string } | undefined)?.message ?? err.message)
        : "فشل تحميل الطلبات";
      toast.error("فشل تحميل الطلبات", message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchOrders(); }, []);

  const statusById = useMemo(
    () => orders.reduce<Record<string, OrderStatus>>((acc, o) => ({ ...acc, [o._id]: o.status }), {}),
    [orders],
  );

  const handleStatusUpdate = async (id: string, status: OrderStatus) => {
    setUpdatingId(id);
    try {
      await api.put(`/orders/${id}/status`, { status });
      setOrders((prev) => prev.map((o) => (o._id === id ? { ...o, status } : o)));
      toast.success("تم تحديث الحالة");
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? ((err.response?.data as { message?: string } | undefined)?.message ?? err.message)
        : "فشل تحديث الحالة";
      toast.error("فشل تحديث الحالة", message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await toast.confirm({
      title: "حذف الطلب؟",
      description: "لن يمكن التراجع عن هذا الإجراء.",
      confirmLabel: "حذف",
      cancelLabel: "إلغاء",
    });
    if (!ok) return;
    setDeletingId(id);
    try {
      await api.delete(`/orders/${id}`);
      setOrders((prev) => prev.filter((o) => o._id !== id));
      toast.success("تم حذف الطلب");
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? ((err.response?.data as { message?: string } | undefined)?.message ?? err.message)
        : "فشل حذف الطلب";
      toast.error("فشل حذف الطلب", message);
    } finally {
      setDeletingId(null);
    }
  };

  const openOrderModal = (order: OrderItem) => {
    setActiveOrder(order);
    setDraftStatus(statusById[order._id] ?? order.status);
  };

  const closeOrderModal = () => {
    if (updatingId || deletingId) return;
    setActiveOrder(null);
  };

  return (
    <div className="flex flex-col gap-6 min-h-[calc(100vh-3rem)]">

      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
          <h2 className="text-sm font-medium text-gray-700">الطلبات</h2>
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
            {/* Mobile cards */}
            <div className="md:hidden p-3 space-y-3">
              {orders.map((o) => (
                <article
                  key={o._id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openOrderModal(o)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openOrderModal(o); }
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
                    <p><span className="text-gray-400">السعر:</span> {o.price === null ? "—" : `${o.price} ج.م`}</p>
                    <p><span className="text-gray-400">الكمية:</span> {o.quantity}</p>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-3">اضغط لعرض الخيارات</p>
                </article>
              ))}
            </div>

            {/* Desktop table */}
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
                        {o.price === null ? "—" : `${o.price} ج.م`}
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

      {/* ── Order Detail Modal ─────────────────────────────── */}
      {activeOrder && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={closeOrderModal}
        >
          <div
            className="w-full max-w-lg rounded-3xl bg-white border border-gray-100 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            style={{ direction: "rtl" }}
          >
            {/* Header */}
            <div className="px-6 pt-5 pb-4 border-b border-gray-100 bg-gradient-to-l from-gray-50/60 to-white flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-base font-bold text-gray-800 truncate">{activeOrder.customerName}</h3>
                <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{activeOrder.productName}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-[11px] px-2.5 py-1 rounded-full border font-medium ${statusBadgeClass(activeOrder.status)}`}>
                  {statusLabel(activeOrder.status)}
                </span>
                <div className="flex items-center gap-1 text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                  <Package size={12} />
                  <span>{activeOrder.quantity}</span>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-5">
              {/* Timeline */}
              <div>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <Truck size={12} />
                  مسار الطلب
                </p>
                <StatusTimeline
                  current={activeOrder.status}
                  draft={draftStatus}
                  onChange={setDraftStatus}
                />
              </div>

              {/* Map */}
              {activeOrder.location && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
                    <MapPin size={13} />
                    {activeOrder.location.lat.toFixed(4)}, {activeOrder.location.lng.toFixed(4)}
                  </div>
                  <div className="h-44 rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                    <MapContainer
                      center={[activeOrder.location.lat, activeOrder.location.lng]}
                      zoom={14}
                      className="h-full w-full"
                    >
                      <TileLayer
                        attribution="&copy; OpenStreetMap contributors"
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <Marker position={[activeOrder.location.lat, activeOrder.location.lng]} icon={arrowMarkerIcon}>
                        <Popup>{activeOrder.addressText || "موقع الطلب"}</Popup>
                      </Marker>
                    </MapContainer>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => void handleDelete(activeOrder._id)}
                disabled={deletingId === activeOrder._id || updatingId === activeOrder._id}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-60 transition-colors"
              >
                <Trash2 size={13} /> حذف الطلب
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={closeOrderModal}
                  className="text-xs px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await handleStatusUpdate(activeOrder._id, draftStatus);
                    setActiveOrder((prev) => prev ? { ...prev, status: draftStatus } : prev);
                  }}
                  disabled={
                    updatingId === activeOrder._id ||
                    deletingId === activeOrder._id ||
                    draftStatus === activeOrder.status
                  }
                  className="text-xs px-5 py-2.5 rounded-xl text-white font-semibold disabled:opacity-50 transition-all hover:shadow-md active:scale-95"
                  style={{ background: "var(--primary)" }}
                >
                  {updatingId === activeOrder._id ? "جاري الحفظ..." : "حفظ الحالة"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
