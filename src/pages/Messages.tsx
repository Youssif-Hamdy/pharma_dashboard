import { useEffect, useState, type CSSProperties } from 'react'
import { Plus, Trash2, Mail, X, Pencil } from 'lucide-react'
import axios from 'axios'
import api from '../api/axios'
import Navbar from '../components/Navbar'
import { useToast } from '../components/ToastContext'
import { DEFAULT_MESSAGES } from '../data/defaultData'

function formatMessagesFetchError(err: unknown): string {
  if (!axios.isAxiosError(err)) return 'تعذر تحميل الرسائل. تحقق من الشبكة وحاول مرة أخرى.'
  const raw = (err.response?.data as { message?: string } | undefined)?.message
  const lower = raw?.toLowerCase() ?? ''
  if (lower.includes('buffering timed out') || lower.includes('mongodb') || lower.includes('messages.find')) {
    return 'الخادم لا يصل إلى قاعدة البيانات (انتهت مهلة الاتصال). في مشروع الـ API على Vercel: راجع أن متغير MONGODB_URI صحيح وأن الـ cluster يسمح بالاتصال من أي IP، ثم أعد نشر الـ API.'
  }
  if (raw) return raw
  if (err.response?.status === 500) return 'خطأ داخلي من الخادم (500).'
  return 'تعذر تحميل الرسائل.'
}

/** يطابق الـ API: POST/PUT { title, content } */
interface Message {
  _id: string
  title: string
  content: string
  createdAt?: string
}

type Phase = 'closed' | 'open' | 'closing'

const overlayStyle: Record<Phase, CSSProperties> = {
  closed:  { backgroundColor: 'rgba(0,0,0,0)',    pointerEvents: 'none', transition: 'background-color 260ms cubic-bezier(0.4,0,0.2,1)' },
  open:    { backgroundColor: 'rgba(0,0,0,0.42)', pointerEvents: 'all',  transition: 'background-color 260ms cubic-bezier(0.4,0,0.2,1)' },
  closing: { backgroundColor: 'rgba(0,0,0,0)',    pointerEvents: 'none', transition: 'background-color 210ms cubic-bezier(0.4,0,0.2,1)' },
}

const modalStyle: Record<Phase, CSSProperties> = {
  closed:  { opacity: 0, transform: 'scale(0.93) translateY(10px)', transition: 'opacity 260ms cubic-bezier(0.4,0,0.2,1), transform 260ms cubic-bezier(0.34,1.56,0.64,1)' },
  open:    { opacity: 1, transform: 'scale(1) translateY(0)',        transition: 'opacity 260ms cubic-bezier(0.4,0,0.2,1), transform 260ms cubic-bezier(0.34,1.56,0.64,1)' },
  closing: { opacity: 0, transform: 'scale(0.95) translateY(6px)',   transition: 'opacity 210ms cubic-bezier(0.4,0,0.2,1), transform 210ms cubic-bezier(0.4,0,0.2,1)' },
}

function normalizeMessage(item: Record<string, unknown>): Message {
  const id = item._id ?? item.id
  return {
    _id: String(id),
    title: String(item.title ?? item.subject ?? ''),
    content: String(item.content ?? item.message ?? item.body ?? ''),
    createdAt: item.createdAt ? String(item.createdAt) : item.created_at ? String(item.created_at) : undefined,
  }
}

function parseList(resData: unknown): { list: Message[]; pages: number; total: number } {
  const raw = resData as Record<string, unknown>
  const listRaw = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.data)
      ? (raw.data as unknown[])
      : []
  const list = listRaw.map((x) => normalizeMessage(x as Record<string, unknown>))
  const pagination = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw.pagination as Record<string, number> | undefined) : undefined
  return {
    list,
    pages: pagination?.pages ?? 1,
    total: pagination?.total ?? list.length,
  }
}

function AddMessageModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void
  onSubmit: (p: { title: string; content: string }) => Promise<void>
}) {
  const [phase, setPhase] = useState<Phase>('closed')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setPhase('open'))
    return () => cancelAnimationFrame(id)
  }, [])

  const close = () => {
    if (phase === 'closing' || saving) return
    setPhase('closing')
    setTimeout(onClose, 220)
  }

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return
    setSaving(true)
    try {
      await onSubmit({ title: title.trim(), content: content.trim() })
      close()
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={overlayStyle[phase]}
      onClick={(e) => { if (e.target === e.currentTarget) close() }}
    >
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
        style={{ ...modalStyle[phase], willChange: 'transform, opacity' }}
      >
        <div className="flex justify-between items-center">
          <h3 className="text-base font-medium text-gray-800">رسالة جديدة</h3>
          <button type="button" onClick={close} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors cursor-pointer">
            <X size={16} />
          </button>
        </div>
        <input
          placeholder="العنوان (title) *"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-400 transition-colors"
        />
        <textarea
          placeholder="المحتوى (content) *"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-400 transition-colors resize-y min-h-[140px]"
        />
        <div className="flex gap-3 justify-end">
          <button type="button" onClick={close} disabled={saving} className="text-sm px-4 py-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50">إلغاء</button>
          <button type="button" onClick={handleSave} disabled={saving} className="text-sm px-5 py-2.5 rounded-xl text-white hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50" style={{ background: 'var(--primary)' }}>
            {saving ? 'جاري الإرسال…' : 'إرسال'}
          </button>
        </div>
      </div>
    </div>
  )
}

function EditMessageModal({
  initial,
  onClose,
  onSubmit,
}: {
  initial: Message
  onClose: () => void
  onSubmit: (p: { title: string; content: string }) => Promise<void>
}) {
  const [phase, setPhase] = useState<Phase>('closed')
  const [title, setTitle] = useState(initial.title)
  const [content, setContent] = useState(initial.content)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setPhase('open'))
    return () => cancelAnimationFrame(id)
  }, [])

  const close = () => {
    if (phase === 'closing' || saving) return
    setPhase('closing')
    setTimeout(onClose, 220)
  }

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return
    setSaving(true)
    try {
      await onSubmit({ title: title.trim(), content: content.trim() })
      close()
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[60] p-4"
      style={overlayStyle[phase]}
      onClick={(e) => { if (e.target === e.currentTarget) close() }}
    >
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
        style={{ ...modalStyle[phase], willChange: 'transform, opacity' }}
      >
        <div className="flex justify-between items-center">
          <h3 className="text-base font-medium text-gray-800">تعديل الرسالة</h3>
          <button type="button" onClick={close} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors cursor-pointer">
            <X size={16} />
          </button>
        </div>
        <input
          placeholder="العنوان *"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-400 transition-colors"
        />
        <textarea
          placeholder="المحتوى *"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-400 transition-colors resize-y min-h-[140px]"
        />
        <div className="flex gap-3 justify-end">
          <button type="button" onClick={close} disabled={saving} className="text-sm px-4 py-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 cursor-pointer disabled:opacity-50">إلغاء</button>
          <button type="button" onClick={handleSave} disabled={saving} className="text-sm px-5 py-2.5 rounded-xl text-white hover:opacity-90 cursor-pointer disabled:opacity-50" style={{ background: 'var(--primary)' }}>
            {saving ? 'جاري الحفظ…' : 'حفظ'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ViewMessageModal({
  msg,
  onClose,
  onEdit,
  onDelete,
}: {
  msg: Message
  onClose: () => void
  onEdit: () => void
  onDelete: () => Promise<boolean>
}) {
  const [phase, setPhase] = useState<Phase>('closed')

  useEffect(() => {
    const id = requestAnimationFrame(() => setPhase('open'))
    return () => cancelAnimationFrame(id)
  }, [])

  const close = () => {
    if (phase === 'closing') return
    setPhase('closing')
    setTimeout(onClose, 220)
  }

  const dateLabel = msg.createdAt
    ? new Date(msg.createdAt).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })
    : '—'

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={overlayStyle[phase]}
      onClick={(e) => { if (e.target === e.currentTarget) close() }}
    >
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl flex flex-col gap-4"
        style={{ ...modalStyle[phase], willChange: 'transform, opacity' }}
      >
        <div className="flex justify-between items-start gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--primary-light)' }}>
              <Mail size={18} style={{ color: 'var(--primary)' }} />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-medium text-gray-800 truncate">{msg.title || 'بدون عنوان'}</h3>
              <p className="text-xs text-gray-400 mt-0.5">{dateLabel}</p>
            </div>
          </div>
          <button type="button" onClick={close} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 shrink-0 cursor-pointer">
            <X size={16} />
          </button>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-2">المحتوى (content)</p>
          <div className="text-sm text-gray-700 whitespace-pre-wrap max-h-64 overflow-y-auto border border-gray-100 rounded-xl px-4 py-3 bg-white">
            {msg.content || '—'}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 justify-between items-center pt-1">
          <button
            type="button"
            onClick={async () => {
              const deleted = await onDelete()
              if (deleted) close()
            }}
            className="flex items-center gap-1.5 text-sm px-4 py-2.5 rounded-xl border border-red-100 text-red-500 hover:bg-red-50 cursor-pointer"
          >
            <Trash2 size={15} /> حذف
          </button>
          <div className="flex gap-2">
            <button type="button" onClick={close} className="text-sm px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 cursor-pointer">إغلاق</button>
            <button
              type="button"
              onClick={() => { onEdit(); close() }}
              className="flex items-center gap-1.5 text-sm px-4 py-2.5 rounded-xl text-white hover:opacity-90 cursor-pointer"
              style={{ background: 'var(--primary)' }}
            >
              <Pencil size={15} /> تعديل
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Messages() {
  const toast = useToast()
  const [items, setItems] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [viewing, setViewing] = useState<Message | null>(null)
  const [editing, setEditing] = useState<Message | null>(null)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const res = await api.get('/messages', { params: { page, limit: 10 }, timeout: 60_000 })
      const { list, pages: p, total: t } = parseList(res.data)
      setItems(list)
      setPages(p)
      setTotal(t)
    } catch (e) {
      console.error(e)
      const desc = formatMessagesFetchError(e)
      setItems(DEFAULT_MESSAGES)
      setPages(1)
      setTotal(DEFAULT_MESSAGES.length)
      toast.show({
        type: 'error',
        title: 'فشل تحميل الرسائل',
        description: desc,
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

  const handlePost = async (body: { title: string; content: string }) => {
    await api.post('/messages', body)
    setPage(1)
    await fetchAll()
  }

  const handlePut = async (id: string, body: { title: string; content: string }) => {
    await api.put(`/messages/${id}`, body)
    setEditing(null)
    await fetchAll()
  }

  const handleDelete = async (id: string): Promise<boolean> => {
    const ok = await toast.confirm({
      title: 'حذف الرسالة؟',
      description: 'لن يمكن التراجع عن هذا الإجراء.',
      confirmLabel: 'حذف',
      cancelLabel: 'إلغاء',
    })
    if (!ok) return false
    try {
      await api.delete(`/messages/${id}`)
      setViewing(null)
      setEditing(null)
      await fetchAll()
      return true
    } catch (e) {
      console.error(e)
      return false
    }
  }

  const rowPreview = (text: string) => {
    const t = text.replace(/\s+/g, ' ').trim()
    if (!t) return '—'
    return t.length > 48 ? `${t.slice(0, 48)}…` : t
  }

  return (
    <div className="flex flex-col gap-6 min-h-[calc(100vh-3rem)]">
      <Navbar title="الرسائل" />

      <div className="flex flex-wrap justify-between items-center gap-3 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 px-4 py-3 shadow-sm">
        <p className="text-sm text-gray-500">إدارة رسائل التواصل </p>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl text-white hover:opacity-90 transition-all duration-200 hover:-translate-y-0.5 w-full sm:w-auto justify-center cursor-pointer shadow-sm hover:shadow-md"
          style={{ background: 'var(--primary)' }}
        >
          <Plus size={16} /> رسالة جديدة
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden flex-1">
        <div className="px-6 py-3.5 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
          <span className="text-sm font-medium text-gray-700">قائمة الرسائل</span>
          <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">{total} رسالة</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: 'var(--primary)' }} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs">
                  <th className="text-right px-4 py-3 font-medium">التاريخ</th>
                  <th className="text-right px-4 py-3 font-medium">العنوان</th>
                  <th className="text-right px-4 py-3 font-medium">معاينة المحتوى</th>
                </tr>
              </thead>
              <tbody>
                {items.map((m) => (
                  <tr
                    key={m._id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setViewing(m)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setViewing(m) } }}
                    className="border-t border-gray-50 hover:bg-gray-50/80 transition-colors duration-200 cursor-pointer"
                  >
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {m.createdAt ? new Date(m.createdAt).toLocaleDateString('ar-EG') : '—'}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-700 max-w-[200px] truncate">{m.title || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-[280px]">{rowPreview(m.content)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {items.length === 0 && (
              <div className="text-center py-14 text-gray-400 text-sm">لا توجد رسائل بعد</div>
            )}
          </div>
        )}

        {pages > 1 && (
          <div className="flex justify-center items-center gap-3 px-6 py-4 border-t border-gray-100 bg-white/90">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className="px-4 py-2 text-sm rounded-xl border border-gray-200 disabled:opacity-50 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              السابق
            </button>
            <span className="text-sm text-gray-600">صفحة {page} من {pages}</span>
            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(prev + 1, pages))}
              disabled={page === pages}
              className="px-4 py-2 text-sm rounded-xl border border-gray-200 disabled:opacity-50 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              التالي
            </button>
          </div>
        )}
      </div>

      {showAdd && (
        <AddMessageModal
          onClose={() => setShowAdd(false)}
          onSubmit={handlePost}
        />
      )}

      {viewing && !editing && (
        <ViewMessageModal
          msg={viewing}
          onClose={() => setViewing(null)}
          onEdit={() => {
            setEditing(viewing)
            setViewing(null)
          }}
          onDelete={() => handleDelete(viewing._id)}
        />
      )}

      {editing && (
        <EditMessageModal
          initial={editing}
          onClose={() => setEditing(null)}
          onSubmit={(body) => handlePut(editing._id, body)}
        />
      )}
    </div>
  )
}
