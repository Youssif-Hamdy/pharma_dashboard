import { Package, Tag, Building2, Pill, TrendingUp } from 'lucide-react'
import Navbar from '../components/Navbar'
import { DEFAULT_BRANDS, DEFAULT_CATEGORIES, DEFAULT_PRODUCTS } from '../data/defaultData'

function Dashboard() {
  const stats = [
    { label: 'الأدوية', value: String(DEFAULT_PRODUCTS.length), icon: Pill, color: '#1a5c3a', bg: '#e8f5ee', trend: '+12%' },
    { label: 'المنتجات', value: String(DEFAULT_PRODUCTS.length), icon: Package, color: '#c9a84c', bg: '#f9f3e3', trend: '+8%' },
    { label: 'الفئات', value: String(DEFAULT_CATEGORIES.length), icon: Tag, color: '#2563eb', bg: '#eff6ff', trend: '+2%' },
    { label: 'الماركات', value: String(DEFAULT_BRANDS.length), icon: Building2, color: '#7c3aed', bg: '#f5f3ff', trend: '+5%' },
  ]

  const recentProducts = DEFAULT_PRODUCTS.slice(0, 5).map((product, index) => ({
    name: product.name,
    category: product.category.name,
    brand: product.brand.name,
    price: product.price,
    status: index % 4 === 0 ? 'منتهي' : 'متاح',
  }))

  return (
    <div className="flex flex-col gap-4 sm:gap-6 pb-20 w-full min-w-0">
      <Navbar title="الرئيسية" />

      {/* إحصائيات — شبكة ٢×٢ على التلفون، صف واحد على الشاشات العريضة */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg, trend }) => (
          <div
            key={label}
            className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow min-w-0"
          >
            <div className="flex justify-between items-start gap-2 mb-3 sm:mb-4">
              <div
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: bg }}
              >
                <Icon size={22} style={{ color }} />
              </div>
              <span className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs text-green-500 font-medium shrink-0">
                <TrendingUp size={13} /> {trend}
              </span>
            </div>
            <p className="text-lg sm:text-2xl font-medium text-gray-800 tabular-nums truncate">{value}</p>
            <p className="text-[11px] sm:text-xs text-gray-400 mt-1 line-clamp-2">{label}</p>
          </div>
        ))}
      </div>

      {/* آخر المنتجات — بطاقات على الهاتف، جدول من md فأعلى */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden w-full min-w-0">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100">
          <h3 className="text-sm font-medium text-gray-700">آخر المنتجات المضافة</h3>
          <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full w-fit">
            {recentProducts.length} منتجات
          </span>
        </div>

        {/* هاتف: بطاقات */}
        <div className="md:hidden p-3 space-y-3">
          {recentProducts.map((p, i) => (
            <article
              key={i}
              className="flex flex-col rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden min-w-0"
            >
              <div className="flex items-center gap-3 p-3 border-b border-gray-50 bg-gray-50/50">
                <div className="w-12 h-12 rounded-xl bg-white border border-gray-100 flex items-center justify-center shrink-0 text-[var(--primary)]">
                  <Package size={22} strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-800 leading-snug line-clamp-2">{p.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5 tabular-nums">{p.price} ج.م</p>
                </div>
                <span
                  className={`shrink-0 text-[10px] px-2 py-1 rounded-full font-medium whitespace-nowrap ${
                    p.status === 'متاح'
                      ? 'bg-green-50 text-green-600'
                      : 'bg-red-50 text-red-500'
                  }`}
                >
                  {p.status}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 p-3">
                <span className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full">{p.category}</span>
                <span className="text-xs bg-purple-50 text-purple-600 px-2.5 py-1 rounded-full">{p.brand}</span>
              </div>
            </article>
          ))}
        </div>

        {/* شاشة كبيرة: جدول */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs">
                <th className="text-right px-6 py-3 font-medium">الاسم</th>
                <th className="text-right px-6 py-3 font-medium">السعر</th>
                <th className="text-right px-6 py-3 font-medium">الفئة</th>
                <th className="text-right px-6 py-3 font-medium">الماركة</th>
                <th className="text-right px-6 py-3 font-medium">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {recentProducts.map((p, i) => (
                <tr key={i} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3.5 font-medium text-gray-700">{p.name}</td>
                  <td className="px-6 py-3.5 text-gray-500 tabular-nums whitespace-nowrap">{p.price} ج.م</td>
                  <td className="px-6 py-3.5 text-gray-500">{p.category}</td>
                  <td className="px-6 py-3.5 text-gray-500">{p.brand}</td>
                  <td className="px-6 py-3.5">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        p.status === 'متاح'
                          ? 'bg-green-50 text-green-600'
                          : 'bg-red-50 text-red-500'
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
