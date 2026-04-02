import { useEffect, useState, type CSSProperties } from 'react'
import { X, ChevronDown } from 'lucide-react'

interface Category {
  _id: string
  name: string
}

interface Brand {
  _id: string
  name: string
}

export interface ProductForm {
  name: string
  price: string
  category: string
  brand: string
}

type Phase = 'closed' | 'open' | 'closing'

const overlayStyle: Record<Phase, CSSProperties> = {
  closed: {
    backgroundColor: 'rgba(0,0,0,0)',
    pointerEvents: 'none',
    transition: 'background-color 260ms cubic-bezier(0.4,0,0.2,1)',
  },
  open: {
    backgroundColor: 'rgba(0,0,0,0.42)',
    pointerEvents: 'all',
    transition: 'background-color 260ms cubic-bezier(0.4,0,0.2,1)',
  },
  closing: {
    backgroundColor: 'rgba(0,0,0,0)',
    pointerEvents: 'none',
    transition: 'background-color 210ms cubic-bezier(0.4,0,1,1)',
  },
}

const modalStyle: Record<Phase, CSSProperties> = {
  closed: {
    opacity: 0,
    transform: 'scale(0.93) translateY(10px)',
    transition:
      'opacity 260ms cubic-bezier(0.4,0,0.2,1), transform 260ms cubic-bezier(0.34,1.56,0.64,1)',
  },
  open: {
    opacity: 1,
    transform: 'scale(1) translateY(0)',
    transition:
      'opacity 260ms cubic-bezier(0.4,0,0.2,1), transform 260ms cubic-bezier(0.34,1.56,0.64,1)',
  },
  closing: {
    opacity: 0,
    transform: 'scale(0.95) translateY(6px)',
    transition:
      'opacity 210ms cubic-bezier(0.4,0,1,1), transform 210ms cubic-bezier(0.4,0,1,1)',
  },
}

type ProductModalProps = {
  isEditing: boolean
  form: ProductForm
  categories: Category[]
  brands: Brand[]
  onChange: (form: ProductForm) => void
  onSave: () => void
  onClose: () => void
}

export default function ProductModal({
  isEditing,
  form,
  categories,
  brands,
  onChange,
  onSave,
  onClose,
}: ProductModalProps) {
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

  const save = () => {
    if (!form.name.trim() || !form.price) return
    onSave()
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={overlayStyle[phase]}
      onClick={e => {
        if (e.target === e.currentTarget) close()
      }}
      role="presentation"
    >
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
        style={{ ...modalStyle[phase], willChange: 'transform, opacity' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center gap-2">
          <h3 className="text-base font-medium text-gray-800">
            {isEditing ? 'تعديل منتج' : 'إضافة منتج'}
          </h3>
          <button
            type="button"
            onClick={close}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors cursor-pointer shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs text-gray-500">اسم المنتج</label>
          <input
            type="text"
            placeholder="الاسم"
            value={form.name}
            onChange={e => onChange({ ...form, name: e.target.value })}
            onKeyDown={e => e.key === 'Enter' && save()}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-400 transition-colors"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs text-gray-500">السعر (ج.م)</label>
          <input
            type="number"
            min={0}
            step="any"
            placeholder="0"
            value={form.price}
            onChange={e => onChange({ ...form, price: e.target.value })}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-400 transition-colors"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs text-gray-500">الفئة</label>
          <div className="relative">
            <ChevronDown
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <select
              value={form.category}
              onChange={e => onChange({ ...form, category: e.target.value })}
              className="appearance-none w-full pr-4 pl-8 py-2.5 border border-gray-200 rounded-xl text-sm outline-none bg-white focus:border-green-400 cursor-pointer"
            >
              <option value="">اختر الفئة</option>
              {categories.map(c => (
                <option key={c._id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs text-gray-500">الماركة</label>
          <div className="relative">
            <ChevronDown
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <select
              value={form.brand}
              onChange={e => onChange({ ...form, brand: e.target.value })}
              className="appearance-none w-full pr-4 pl-8 py-2.5 border border-gray-200 rounded-xl text-sm outline-none bg-white focus:border-green-400 cursor-pointer"
            >
              <option value="">اختر الماركة</option>
              {brands.map(b => (
                <option key={b._id} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-1">
          <button
            type="button"
            onClick={close}
            className="text-sm px-4 py-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={save}
            className="text-sm px-5 py-2.5 rounded-xl text-white hover:opacity-90 transition-opacity cursor-pointer"
            style={{ background: 'var(--primary)' }}
          >
            {isEditing ? 'حفظ' : 'إضافة'}
          </button>
        </div>
      </div>
    </div>
  )
}
