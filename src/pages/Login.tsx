import { Pill } from 'lucide-react'

function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <div className="flex flex-col items-center gap-3 mb-8">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--primary-light)' }}
            >
              <Pill size={28} style={{ color: 'var(--primary)' }} />
            </div>
            <h1 className="text-xl font-semibold text-gray-800">تسجيل الدخول</h1>
            <p className="text-sm text-gray-500 text-center">لوحة تحكم الصيدلية</p>
          </div>

          {/* Login flow is temporarily disabled. */}
          <div className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-center">
            تم إيقاف تسجيل الدخول مؤقتا.
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
