import { useEffect, useState, type CSSProperties } from 'react'
import { Plus, Trash2, Search, Building2, X, ChevronLeft, ChevronRight } from 'lucide-react'
import api from '../api/axios'
import Navbar from '../components/Navbar'
import { useToast } from '../components/ToastContext'
import { DEFAULT_BRANDS, DEFAULT_FALLBACK_MESSAGES } from '../data/defaultData'

interface Brand { _id: string; name: string }

type Phase = 'closed' | 'open' | 'closing'

const overlayStyle: Record<Phase, CSSProperties> = {
  closed:  { backgroundColor: 'rgba(0,0,0,0)',    pointerEvents: 'none', transition: 'background-color 260ms cubic-bezier(0.4,0,0.2,1)' },
  open:    { backgroundColor: 'rgba(0,0,0,0.42)', pointerEvents: 'all',  transition: 'background-color 260ms cubic-bezier(0.4,0,0.2,1)' },
  closing: { backgroundColor: 'rgba(0,0,0,0)',    pointerEvents: 'none', transition: 'background-color 210ms cubic-bezier(0.4,0,1,1)' },
}

const modalStyle: Record<Phase, CSSProperties> = {
  closed:  { opacity: 0, transform: 'scale(0.93) translateY(10px)', transition: 'opacity 260ms cubic-bezier(0.4,0,0.2,1), transform 260ms cubic-bezier(0.34,1.56,0.64,1)' },
  open:    { opacity: 1, transform: 'scale(1) translateY(0)',        transition: 'opacity 260ms cubic-bezier(0.4,0,0.2,1), transform 260ms cubic-bezier(0.34,1.56,0.64,1)' },
  closing: { opacity: 0, transform: 'scale(0.95) translateY(6px)',   transition: 'opacity 210ms cubic-bezier(0.4,0,1,1), transform 210ms cubic-bezier(0.4,0,1,1)' },
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
          <h3 className="text-base font-medium text-gray-800">إضافة ماركة جديدة</h3>
          <button onClick={close} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors cursor-pointer">
            <X size={16} />
          </button>
        </div>
        <input
          placeholder="اسم الماركة"
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

function Brands() {
  const toast = useToast()
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [fetchMessage, setFetchMessage] = useState('')

  const fetchAll = async () => {
    setLoading(true)
    try {
      const res = await api.get('/brands', {
        params: { page, limit: 8, search }
      })
      const raw = res.data
      const list = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.data)
          ? raw.data
          : []
      const normalized = list.map((item: any) => ({
        _id: item._id || item.id,
        name: item.name,
      }))
      setBrands(normalized)
      setPages(raw?.pagination?.pages || 1)
      setTotal(raw?.pagination?.total || normalized.length)
      setFetchMessage('')
    } catch (error) {
      console.error(error)
      setBrands(DEFAULT_BRANDS)
      setPages(1)
      setTotal(DEFAULT_BRANDS.length)
      setFetchMessage(DEFAULT_FALLBACK_MESSAGES.brands)
    }
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [page, search])
  useEffect(() => { setPage(1) }, [search])

  const handleAdd = async (name: string) => {
    await api.post('/brands', { name })
    setPage(1)
    fetchAll()
  }

  const handleDelete = async (id: string) => {
    const ok = await toast.confirm({
      title: 'حذف الماركة؟',
      description: 'سيتم إزالة الماركة نهائياً من النظام.',
      confirmLabel: 'حذف',
      cancelLabel: 'إلغاء',
    })
    if (!ok) return
    await api.delete(`/brands/${id}`)
    fetchAll()
  }

  return (
    <div className="flex flex-col gap-6">
      <Navbar title="الماركات" />

      <div className="flex flex-wrap justify-between items-center gap-3">
        <div className="relative">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="ابحث عن ماركة..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pr-9 pl-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none bg-white w-52 focus:border-green-400 transition-colors"
          />
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl text-white hover:opacity-90 cursor-pointer"
          style={{ background: 'var(--primary)' }}
        >
          <Plus size={16} /> إضافة ماركة
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: 'var(--primary)' }} />
        </div>
      ) : (
        <>
          {fetchMessage && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700">
              {fetchMessage}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {brands.map((b) => (
              <div key={b._id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex justify-between items-center hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--gold-light)' }}>
                    <Building2 size={18} style={{ color: 'var(--gold)' }} />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{b.name}</span>
                </div>
                <button
                  onClick={() => handleDelete(b._id)}
                  className="w-8 h-8 rounded-lg border border-red-100 flex items-center justify-center text-red-400 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {brands.length === 0 && (
              <div className="col-span-3 text-center py-16 text-gray-400 text-sm">لا يوجد ماركات</div>
            )}
          </div>

          {pages > 1 && (
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mt-2">
              <button
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm rounded-xl border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                <ChevronRight size={16} /> السابق
              </button>
              <span className="text-sm text-gray-600">صفحة {page} من {pages} · {total} ماركة</span>
              <button
                onClick={() => setPage(prev => Math.min(prev + 1, pages))}
                disabled={page === pages}
                className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm rounded-xl border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                التالي <ChevronLeft size={16} />
              </button>
            </div>
          )}
        </>
      )}

      {showModal && (
        <Modal onClose={() => setShowModal(false)} onAdd={handleAdd} />
      )}
    </div>
  )
}

export default Brands