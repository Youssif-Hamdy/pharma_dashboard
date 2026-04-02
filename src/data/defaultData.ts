export interface DefaultCategory {
  _id: string
  name: string
}

export interface DefaultBrand {
  _id: string
  name: string
}

export interface DefaultProduct {
  _id: string
  name: string
  price: number
  category: DefaultCategory
  brand: DefaultBrand
}

export interface DefaultMessage {
  _id: string
  title: string
  content: string
  createdAt: string
}

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  { _id: 'default-cat-1', name: 'مسكنات' },
  { _id: 'default-cat-2', name: 'فيتامينات' },
  { _id: 'default-cat-3', name: 'مضادات حيوية' },
  { _id: 'default-cat-4', name: 'جهاز هضمي' },
  { _id: 'default-cat-5', name: 'عناية بالبشرة' },
]

export const DEFAULT_BRANDS: DefaultBrand[] = [
  { _id: 'default-brand-1', name: 'PharmaCare' },
  { _id: 'default-brand-2', name: 'MediPlus' },
  { _id: 'default-brand-3', name: 'HealthLine' },
  { _id: 'default-brand-4', name: 'VitaLab' },
  { _id: 'default-brand-5', name: 'BioPharm' },
]

export const DEFAULT_PRODUCTS: DefaultProduct[] = [
  { _id: 'default-product-1', name: 'باراسيتامول 500', price: 35, category: DEFAULT_CATEGORIES[0], brand: DEFAULT_BRANDS[0] },
  { _id: 'default-product-2', name: 'ايبوبروفين 400', price: 42, category: DEFAULT_CATEGORIES[0], brand: DEFAULT_BRANDS[2] },
  { _id: 'default-product-3', name: 'فيتامين C 1000', price: 60, category: DEFAULT_CATEGORIES[1], brand: DEFAULT_BRANDS[1] },
  { _id: 'default-product-4', name: 'فيتامين D3', price: 75, category: DEFAULT_CATEGORIES[1], brand: DEFAULT_BRANDS[3] },
  { _id: 'default-product-5', name: 'أوجمنتين 1جم', price: 120, category: DEFAULT_CATEGORIES[2], brand: DEFAULT_BRANDS[4] },
  { _id: 'default-product-6', name: 'أموكسيسيلين 500', price: 88, category: DEFAULT_CATEGORIES[2], brand: DEFAULT_BRANDS[0] },
  { _id: 'default-product-7', name: 'أوميبرازول 20', price: 66, category: DEFAULT_CATEGORIES[3], brand: DEFAULT_BRANDS[2] },
]

export const DEFAULT_MESSAGES: DefaultMessage[] = [
  {
    _id: 'default-message-1',
    title: 'تأكيد الطلب',
    content: 'تم استلام طلبك بنجاح وسيتم التواصل معك خلال اليوم.',
    createdAt: '2026-04-01T09:30:00.000Z',
  },
  {
    _id: 'default-message-2',
    title: 'عرض خاص',
    content: 'خصم 10% على منتجات الفيتامينات حتى نهاية الأسبوع.',
    createdAt: '2026-04-01T11:15:00.000Z',
  },
  {
    _id: 'default-message-3',
    title: 'تحديث المخزون',
    content: 'منتج أوجمنتين 1جم متاح الآن بكميات محدودة.',
    createdAt: '2026-04-01T14:20:00.000Z',
  },
  {
    _id: 'default-message-4',
    title: 'صيانة النظام',
    content: 'قد يحدث بطء بسيط اليوم من 12AM إلى 2AM بسبب الصيانة.',
    createdAt: '2026-04-01T17:45:00.000Z',
  },
]
