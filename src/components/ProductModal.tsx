import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { X, ChevronDown, Upload, Trash2, Check, Search } from "lucide-react";

interface Category {
  _id: string;
  name: string;
}
interface Brand {
  _id: string;
  name: string;
}

export interface ProductForm {
  name: string;
  price: string;
  category: string;
  brand: string;
}

type Phase = "closed" | "open" | "closing";

const overlayStyle: Record<Phase, CSSProperties> = {
  closed: {
    backgroundColor: "rgba(0,0,0,0)",
    pointerEvents: "none",
    transition: "background-color 260ms cubic-bezier(0.4,0,0.2,1)",
  },
  open: {
    backgroundColor: "rgba(0,0,0,0.42)",
    pointerEvents: "all",
    transition: "background-color 260ms cubic-bezier(0.4,0,0.2,1)",
  },
  closing: {
    backgroundColor: "rgba(0,0,0,0)",
    pointerEvents: "none",
    transition: "background-color 210ms cubic-bezier(0.4,0,1,1)",
  },
};
const modalStyle: Record<Phase, CSSProperties> = {
  closed: {
    opacity: 0,
    transform: "scale(0.93) translateY(10px)",
    transition:
      "opacity 260ms cubic-bezier(0.4,0,0.2,1), transform 260ms cubic-bezier(0.34,1.56,0.64,1)",
  },
  open: {
    opacity: 1,
    transform: "scale(1) translateY(0)",
    transition:
      "opacity 260ms cubic-bezier(0.4,0,0.2,1), transform 260ms cubic-bezier(0.34,1.56,0.64,1)",
  },
  closing: {
    opacity: 0,
    transform: "scale(0.95) translateY(6px)",
    transition:
      "opacity 210ms cubic-bezier(0.4,0,1,1), transform 210ms cubic-bezier(0.4,0,1,1)",
  },
};

// ─── Portal Dropdown ───────────────────────────────────────────────
interface DropdownProps {
  label: string;
  value: string;
  options: { _id: string; name: string }[];
  onChange: (val: string) => void;
  placeholder: string;
}

function CustomDropdown({
  label,
  value,
  options,
  onChange,
  placeholder,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [rect, setRect] = useState<DOMRect | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const filtered = options.filter((o) =>
    o.name.toLowerCase().includes(search.toLowerCase()),
  );

  const openDropdown = () => {
    if (triggerRef.current) setRect(triggerRef.current.getBoundingClientRect());
    setSearch("");
    setOpen(true);
  };

  // close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!triggerRef.current?.contains(t) && !panelRef.current?.contains(t)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // focus search on open
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 60);
  }, [open]);

  // reposition on resize/scroll
  useEffect(() => {
    if (!open) return;
    const update = () => {
      if (triggerRef.current)
        setRect(triggerRef.current.getBoundingClientRect());
    };
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open]);

  const estPanelH = Math.min(
    filtered.length * 44 + (options.length > 6 ? 60 : 0) + 12,
    260,
  );
  const spaceBelow = rect ? window.innerHeight - rect.bottom - 8 : 999;
  const openUp = rect ? spaceBelow < estPanelH && rect.top > estPanelH : false;

  const panelStyle: CSSProperties = rect
    ? {
        position: "fixed",
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
        ...(openUp
          ? { bottom: window.innerHeight - rect.top + 6 }
          : { top: rect.bottom + 6 }),
      }
    : {};

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-gray-500 px-0.5">
        {label}
      </label>

      <button
        ref={triggerRef}
        type="button"
        onClick={openDropdown}
        className={`w-full flex items-center justify-between px-4 py-2.5 border rounded-xl text-sm bg-white transition-all duration-150 cursor-pointer ${
          open
            ? "border-green-400 ring-2 ring-green-100 shadow-sm"
            : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
        }`}
      >
        <span className={value ? "text-gray-800 font-medium" : "text-gray-400"}>
          {value || placeholder}
        </span>
        <ChevronDown
          size={14}
          className={`text-gray-400 transition-transform duration-200 shrink-0 ml-2 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open &&
        rect &&
        createPortal(
          <div
            ref={panelRef}
            style={{
              ...panelStyle,
              animation: "ddIn 140ms cubic-bezier(0.34,1.4,0.64,1)",
            }}
            className="bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden"
          >
            {options.length > 6 && (
              <div className="px-3 pt-3 pb-2">
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl border border-gray-100 focus-within:border-green-400 focus-within:ring-2 focus-within:ring-green-50 transition-all">
                  <Search size={13} className="text-gray-400 shrink-0" />
                  <input
                    ref={searchRef}
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="ابحث..."
                    className="flex-1 text-xs bg-transparent outline-none text-gray-700 placeholder-gray-400"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="text-gray-300 hover:text-gray-500 transition-colors"
                    >
                      <X size={11} />
                    </button>
                  )}
                </div>
              </div>
            )}

            <ul
              className="overflow-y-auto py-1.5"
              style={{
                maxHeight: "210px",
                scrollbarWidth: "thin",
                scrollbarColor: "#d1d5db transparent",
              }}
            >
              <li>
                <button
                  type="button"
                  onClick={() => {
                    onChange("");
                    setOpen(false);
                    setSearch("");
                  }}
                  className="w-full text-right px-4 py-2.5 text-sm text-gray-400 hover:bg-gray-50 transition-colors flex items-center justify-between gap-2"
                >
                  <span className="text-xs">{placeholder}</span>
                  {!value && (
                    <Check size={12} className="text-green-500 shrink-0" />
                  )}
                </button>
              </li>

              {filtered.length === 0 ? (
                <li className="text-center py-5 text-xs text-gray-400">
                  لا توجد نتائج
                </li>
              ) : (
                filtered.map((opt) => (
                  <li key={opt._id}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(opt.name);
                        setOpen(false);
                        setSearch("");
                      }}
                      className={`w-full text-right px-4 py-2.5 text-sm transition-colors flex items-center justify-between gap-2 ${
                        value === opt.name
                          ? "bg-green-50 text-green-700 font-medium"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <span>{opt.name}</span>
                      {value === opt.name && (
                        <Check size={13} className="text-green-500 shrink-0" />
                      )}
                    </button>
                  </li>
                ))
              )}
            </ul>

            <style>{`
            @keyframes ddIn {
              from { opacity:0; transform: translateY(${openUp ? "6px" : "-6px"}) scale(0.97) }
              to   { opacity:1; transform: translateY(0) scale(1) }
            }
            ul::-webkit-scrollbar       { width: 4px }
            ul::-webkit-scrollbar-track { background: transparent }
            ul::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 99px }
            ul::-webkit-scrollbar-thumb:hover { background: #9ca3af }
          `}</style>
          </div>,
          document.body,
        )}
    </div>
  );
}

// ─── Main Modal ────────────────────────────────────────────────────
type ProductModalProps = {
  isEditing: boolean;
  form: ProductForm;
  categories: Category[];
  brands: Brand[];
  onChange: (form: ProductForm) => void;
  onSave: () => void;
  onClose: () => void;
  currentImageUrl?: string;
  onImageChange: (file: File | null) => void;
};

export default function ProductModal({
  isEditing,
  form,
  categories,
  brands,
  onChange,
  onSave,
  onClose,
  currentImageUrl,
  onImageChange,
}: ProductModalProps) {
  const [phase, setPhase] = useState<Phase>("closed");
  const [preview, setPreview] = useState<string | null>(
    currentImageUrl || null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => setPhase("open"));
    return () => cancelAnimationFrame(id);
  }, []);

  const close = () => {
    if (phase === "closing") return;
    setPhase("closing");
    setTimeout(onClose, 220);
  };

  const save = () => {
    if (!form.name.trim() || !form.price) return;
    onSave();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;
    onImageChange(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    onImageChange(null);
    setPreview(currentImageUrl || null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={overlayStyle[phase]}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
      role="presentation"
    >
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
        style={{ ...modalStyle[phase], willChange: "transform, opacity" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center">
          <h3 className="text-base font-semibold text-gray-800">
            {isEditing ? "تعديل منتج" : "إضافة منتج"}
          </h3>
          <button
            type="button"
            onClick={close}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Image */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-gray-500 px-0.5">
            صورة المنتج (اختياري)
          </label>
          {preview ? (
            <div className="relative w-full h-40 rounded-xl overflow-hidden border border-gray-200 group">
              <img
                src={preview}
                alt="product"
                className="w-full h-full object-contain bg-gray-50"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-2 left-2 w-7 h-7 rounded-lg bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <Trash2 size={13} />
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-2 left-2 flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-sm"
              >
                <Upload size={12} /> تغيير
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-28 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1.5 text-gray-400 hover:border-green-400 hover:text-green-500 transition-colors cursor-pointer bg-gray-50 hover:bg-green-50"
            >
              <Upload size={20} />
              <span className="text-xs font-medium">اضغط لرفع صورة</span>
              <span className="text-xs text-gray-300">
                JPG, PNG — حد أقصى 5MB
              </span>
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-gray-500 px-0.5">
            اسم المنتج
          </label>
          <input
            type="text"
            placeholder="الاسم"
            value={form.name}
            onChange={(e) => onChange({ ...form, name: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && save()}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all hover:border-gray-300"
          />
        </div>

        {/* Price */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-gray-500 px-0.5">
            السعر (ج.م)
          </label>
          <input
            type="number"
            min={0}
            step="any"
            placeholder="0"
            value={form.price ?? ''}
            onChange={(e) => onChange({ ...form, price: e.target.value })}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all hover:border-gray-300"
          />
        </div>

        {/* Category */}
        <CustomDropdown
          label="الفئة"
          placeholder="اختر الفئة"
          value={form.category}
          options={categories}
          onChange={(val) => onChange({ ...form, category: val })}
        />

        {/* Brand */}
        <CustomDropdown
          label="الماركة"
          placeholder="اختر الماركة"
          value={form.brand}
          options={brands}
          onChange={(val) => onChange({ ...form, brand: val })}
        />

        {/* Buttons */}
        <div className="flex gap-3 justify-end pt-2 border-t border-gray-50 mt-1">
          <button
            type="button"
            onClick={close}
            className="text-sm px-4 py-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer font-medium"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={save}
            className="text-sm px-6 py-2.5 rounded-xl text-white hover:opacity-90 transition-opacity cursor-pointer font-medium shadow-sm"
            style={{ background: "var(--primary)" }}
          >
            {isEditing ? "حفظ التعديلات" : "إضافة المنتج"}
          </button>
        </div>
      </div>
    </div>
  );
}
