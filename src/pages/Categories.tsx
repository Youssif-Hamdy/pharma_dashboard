import { useEffect, useState, type CSSProperties } from 'react'
import { Plus, Trash2, Tag, X } from 'lucide-react'
import axios from 'axios'
import api from '../api/axios'
import Navbar from '../components/Navbar'
import { useToast } from '../components/ToastContext'
import { DEFAULT_CATEGORIES } from '../data/defaultData'

interface Category { _id: string; name: string }

type Phase = 'closed' | 'open' | 'closing'

function formatCategoriesFetchError(err: unknown): string {
  if (!axios.isAxiosError(err)) return 'تعذر تحميل الفئات. تحقق من الشبكة وحاول مرة أخرى.'
  const raw = (err.response?.data as { message?: string } | undefined)?.message
  const lower = raw?.toLowerCase() ?? ''
  if (lower.includes('buffering timed out') || lower.includes('mongodb') || lower.includes('categories.find')) {
    return 'الخادم لا يصل إلى قاعدة البيانات (انتهت مهلة الاتصال). راجع MONGODB_URI وصلاحيات IP في MongoDB Atlas ثم أعد نشر الـ API.'
  }
  if (raw) return raw
  if (err.response?.status === 500) return 'خطأ داخلي من الخادم (500) أثناء تحميل الفئات.'
  return 'تعذر تحميل الفئات.'
}

const overlayStyle: Record<Phase, CSSProperties> = {
  closed:  { backgroundColor: 'rgba(0,0,0,0)', pointerEvents: 'none', transition: 'background-color 260ms cubic-bezier(0.4,0,0.2,1)' },
  open:    { backgroundColor: 'rgba(0,0,0,0.42)', pointerEvents: 'all',  transition: 'background-color 260ms cubic-bezier(0.4,0,0.2,1)' },
  closing: { backgroundColor: 'rgba(0,0,0,0)', pointerEvents: 'none', transition: 'background-color 210ms cubic-bezier(0.4,0,1,1)' },
}

const modalStyle: Record<Phase, CSSProperties> = {
  closed:  { opacity: 0, transform: 'scale(0.93) translateY(10px)', transition: 'opacity 260ms cubic-bezier(0.4,0,0.2,1), transform 260ms cubic-bezier(0.34,1.56,0.64,1)' },
  open:    { opacity: 1, transform: 'scale(1) translateY(0)', transition: 'opacity 260ms cubic-bezier(0.4,0,0.2,1), transform 260ms cubic-bezier(0.34,1.56,0.64,1)' },
  closing: { opacity: 0, transform: 'scale(0.95) translateY(6px)', transition: 'opacity 210ms cubic-bezier(0.4,0,1,1), transform 210ms cubic-bezier(0.4,0,1,1)' },
}

function Modal({ onClose, onAdd }: { onClose: () => void; onAdd: (name: string) => void }) {
  const [phase, setPhase] = useState<Phase>('closed')
  const [name, setName] = useState('')

  useEffect(() => {
    const id = requestAnimationFrame(() => setPhase('open'))
    return () => cancelAnimationFrame(id)
  }, [])

  const close = () => {
    if (phase === 'closing') return
    setPhase('closing')
    setTimeout(onClose, 220)
  }

  const handleAdd = () => {
    if (!name.trim()) return
    onAdd(name)
    close()
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={overlayStyle[phase]}
      onClick={e => { if (e.target === e.currentTarget) close() }}
    >
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl flex flex-col gap-4"
        style={{ ...modalStyle[phase], willChange: 'transform, opacity' }}
      >
        <div className="flex justify-between items-center">
          <h3 className="text-base font-medium text-gray-800">إضافة فئة جديدة</h3>
          <button onClick={close} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors cursor-pointer">
            <X size={16} />
          </button>
        </div>
        <input
          placeholder="اسم الفئة"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-400 transition-colors"
        />
        <div className="flex gap-3 justify-end">
          <button onClick={close} className="text-sm px-4 py-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer">إلغاء</button>
          <button onClick={handleAdd} className="text-sm px-5 py-2.5 rounded-xl text-white hover:opacity-90 transition-opacity cursor-pointer" style={{ background: 'var(--primary)' }}>إضافة</button>
        </div>
      </div>
    </div>
  )
}

export default function Categories() {
  const toast = useToast()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const res = await api.get('/categories', { params: { page, limit: 6 } })
      const data = Array.isArray(res.data) ? res.data : res.data.data
      setCategories(data || [])
      setPages(res.data.pagination?.pages || 1)
    } catch (e) {
      console.error(e)
      setCategories(DEFAULT_CATEGORIES)
      setPages(1)
      toast.show({
        type: 'error',
        title: 'فشل تحميل الفئات',
        description: formatCategoriesFetchError(e),
        duration: 0,
        actions: [
          {
            label: 'إعادة المحاولة',
            variant: 'primary',
            onClick: () => {
              void fetchAll()
            },
          },
        ],
      })
    }
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [page])

  const handleAdd = async (name: string) => {
    try { await api.post('/categories', { name }); setPage(1); fetchAll() } 
    catch (e) { console.error(e) }
  }

  const handleDelete = async (id: string) => {
    const ok = await toast.confirm({
      title: 'حذف الفئة؟',
      description: 'سيتم إزالة الفئة نهائياً من النظام.',
      confirmLabel: 'حذف',
      cancelLabel: 'إلغاء',
    })
    if (!ok) return
    await api.delete(`/categories/${id}`)
    fetchAll()
  }

  return (
    <div className="flex flex-col gap-6 pb-20">
      <Navbar title="الفئات" />

      <div className="flex justify-between items-center gap-3">
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl text-white hover:opacity-90 transition-opacity w-full sm:w-auto justify-center cursor-pointer"
          style={{ background: 'var(--primary)' }}>
          <Plus size={16} /> إضافة فئة
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[680px]">
        <div className="px-6 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">الفئات</span>
          <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">{categories.length} نتيجة</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: 'var(--primary)' }} />
          </div>
        ) : (
          <div className="px-6 py-4 space-y-3">
            {categories.map(c => (
              <div key={c._id} className="flex justify-between items-center border border-gray-100 rounded-xl px-4 py-3 hover:bg-gray-50 transition-colors">
                <span className="flex items-center gap-2 text-gray-700 text-sm"><Tag size={16} /> {c.name}</span>
                <button onClick={() => handleDelete(c._id)}
                  className="w-8 h-8 rounded-lg border border-red-100 flex items-center justify-center text-red-400 hover:bg-red-50 transition-colors cursor-pointer">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {categories.length === 0 && (
              <div className="text-center py-10 text-gray-400 text-sm">لا يوجد فئات</div>
            )}

            {/* Pagination */}
            <div className="flex justify-center items-center gap-3 mt-6 border-t border-gray-100 pt-4 bg-white">
              <button
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-colors cursor-pointer disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed"
              >
                السابق
              </button>
              <span className="text-sm text-gray-600">صفحة {page} من {pages}</span>
              <button
                onClick={() => setPage(prev => Math.min(prev + 1, pages))}
                disabled={page === pages}
                className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-colors cursor-pointer disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed"
              >
                التالي
              </button>
            </div>
          </div>
        )}
      </div>

      {showModal && <Modal onAdd={handleAdd} onClose={() => setShowModal(false)} />}
    </div>
  )
}