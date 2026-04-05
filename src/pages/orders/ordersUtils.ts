import L from "leaflet";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface OrderItem {
  _id: string;
  customerName: string;
  phone: string;
  addressText: string;
  productName: string;
  price: number | null;
  quantity: number;
  status: OrderStatus;
  createdAt?: string;
  location?: { lat: number; lng: number };
}

export const ORDER_STATUS_OPTIONS: OrderStatus[] = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
];

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export const arrowMarkerIcon = L.divIcon({
  html: '<div style="width:0;height:0;border-left:10px solid transparent;border-right:10px solid transparent;border-bottom:18px solid #16a34a;transform:rotate(45deg);"></div>',
  className: "",
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

export function asStatus(value: unknown): OrderStatus {
  if (
    typeof value === "string" &&
    ORDER_STATUS_OPTIONS.includes(value as OrderStatus)
  )
    return value as OrderStatus;
  return "pending";
}

export function statusLabel(status: OrderStatus): string {
  if (status === "pending") return "قيد الانتظار";
  if (status === "confirmed") return "تم التأكيد";
  if (status === "shipped") return "تم الشحن";
  if (status === "delivered") return "تم التسليم";
  return "ملغي";
}

export function statusBadgeClass(status: OrderStatus): string {
  if (status === "pending") return "bg-amber-50 text-amber-700 border-amber-200";
  if (status === "confirmed") return "bg-blue-50 text-blue-700 border-blue-200";
  if (status === "shipped") return "bg-purple-50 text-purple-700 border-purple-200";
  if (status === "delivered")
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  return "bg-red-50 text-red-700 border-red-200";
}

export function normalizeOrder(raw: Record<string, unknown>): OrderItem {
  const id = raw._id ?? raw.id;
  const user = raw.user as Record<string, unknown> | undefined;
  const productObj = raw.product as Record<string, unknown> | undefined;
  const customer =
    (typeof raw.customerName === "string" && raw.customerName) ||
    (typeof raw.name === "string" && raw.name) ||
    (typeof user?.name === "string" && user.name) ||
    (typeof user?.email === "string" && user.email) ||
    "—";

  const phone =
    (typeof raw.phone === "string" && raw.phone) ||
    (typeof user?.phone === "string" && user.phone) ||
    "—";
  const addressText =
    (typeof raw.addressText === "string" && raw.addressText) ||
    (typeof raw.address === "string" && raw.address) ||
    "—";
  const quantityValue = Number(raw.quantity ?? 1);
  const locationObj = raw.location as Record<string, unknown> | undefined;
  const latValue = Number(locationObj?.lat);
  const lngValue = Number(locationObj?.lng);

  const directProductName =
    (typeof productObj?.name === "string" && productObj.name) ||
    (typeof raw.productName === "string" && raw.productName) ||
    "";
  const directPriceRaw = productObj?.price ?? raw.price ?? null;
  const directPriceValue =
    directPriceRaw === null ? null : Number(directPriceRaw);

  const lineItems =
    (Array.isArray(raw.items) && raw.items) ||
    (Array.isArray(raw.orderItems) && raw.orderItems) ||
    (Array.isArray(raw.products) && raw.products) ||
    [];

  const firstLineItem = lineItems[0] as Record<string, unknown> | undefined;
  const firstProductObj = firstLineItem?.product as
    | Record<string, unknown>
    | undefined;
  const lineItemName =
    (typeof firstLineItem?.name === "string" && firstLineItem.name) ||
    (typeof firstLineItem?.productName === "string" &&
      firstLineItem.productName) ||
    (typeof firstProductObj?.name === "string" && firstProductObj.name) ||
    "";
  const lineItemPriceRaw = firstProductObj?.price ?? firstLineItem?.price ?? null;
  const lineItemPriceValue =
    lineItemPriceRaw === null ? null : Number(lineItemPriceRaw);

  const products = lineItems
    .map((item) => {
      const asObj = item as Record<string, unknown>;
      const product = asObj.product as Record<string, unknown> | undefined;
      const name =
        (typeof asObj.name === "string" && asObj.name) ||
        (typeof asObj.productName === "string" && asObj.productName) ||
        (typeof product?.name === "string" && product.name) ||
        (typeof asObj.title === "string" && asObj.title) ||
        "";
      return name.trim();
    })
    .filter(Boolean);

  return {
    _id: String(id ?? ""),
    customerName: customer,
    phone,
    addressText,
    productName:
      directProductName || lineItemName || (products[0] ?? "—"),
    price: Number.isFinite(directPriceValue as number)
      ? (directPriceValue as number)
      : Number.isFinite(lineItemPriceValue as number)
        ? (lineItemPriceValue as number)
        : null,
    quantity: Number.isFinite(quantityValue) ? quantityValue : 1,
    status: asStatus(raw.status),
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : undefined,
    location:
      Number.isFinite(latValue) && Number.isFinite(lngValue)
        ? { lat: latValue, lng: lngValue }
        : undefined,
  };
}

export function parseOrders(resData: unknown): OrderItem[] {
  const raw = resData as Record<string, unknown>;
  const listRaw = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.data)
      ? (raw.data as unknown[])
      : [];
  return listRaw
    .map((x) => normalizeOrder(x as Record<string, unknown>))
    .filter((o) => Boolean(o._id));
}
