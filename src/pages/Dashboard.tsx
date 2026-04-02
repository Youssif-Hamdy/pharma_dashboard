import { Link } from 'react-router-dom'
import { Package, Tag, Building2, Pill, TrendingUp, Mail } from 'lucide-react'
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
    status: index % 4 === 0 ? 'منتهي' : 'متاح',
  }))

  return (
    <div className="flex flex-col gap-6">
      <Navbar title="الرئيسية" />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg, trend }) => (
          <div key={label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: bg }}>
                <Icon size={22} style={{ color }} />
              </div>
              <span className="flex items-center gap-1 text-xs text-green-500 font-medium">
                <TrendingUp size={13} /> {trend}
              </span>
            </div>
            <p className="text-2xl font-medium text-gray-800">{value}</p>
            <p className="text-xs text-gray-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

    
      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-medium text-gray-700">آخر المنتجات المضافة</h3>
          <span className="text-xs text-gray-400">{recentProducts.length} منتجات</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs">
                <th className="text-right px-6 py-3 font-medium">الاسم</th>
                <th className="text-right px-6 py-3 font-medium">الفئة</th>
                <th className="text-right px-6 py-3 font-medium">الماركة</th>
                <th className="text-right px-6 py-3 font-medium">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {recentProducts.map((p, i) => (
                <tr key={i} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3.5 font-medium text-gray-700">{p.name}</td>
                  <td className="px-6 py-3.5 text-gray-500">{p.category}</td>
                  <td className="px-6 py-3.5 text-gray-500">{p.brand}</td>
                  <td className="px-6 py-3.5">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium
                      ${p.status === 'متاح' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
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
