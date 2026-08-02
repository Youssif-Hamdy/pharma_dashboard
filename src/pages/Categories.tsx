import { useEffect, useState } from "react";
import { Plus, Trash2, Tag, Sparkles, ChevronLeft, ChevronRight, Edit2 } from "lucide-react";
import api from "../api/axios";
import { useToast } from "../components/ToastContext";
import { DEFAULT_CATEGORIES } from "../data/defaultData";
import CategoryAddModal from "./categories/CategoryAddModal";
import CategoryEditModal from "./categories/CategoryEditModal";
import { formatCategoriesFetchError } from "./categories/categoriesHelpers";

interface Category {
  _id: string;
  name: string;
}

/* ── Premium Empty State ────────────────────────────────── */
function EmptyCategories() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-5 select-none">
      <style>{`
        @keyframes floatCat {
          0%,100% { transform: translateY(0) rotate(1deg); }
          50%      { transform: translateY(-12px) rotate(-1deg); }
        }
        @keyframes orbitTag {
          from { transform: rotate(0deg) translateX(40px); }
          to   { transform: rotate(360deg) translateX(40px); }
        }
        @keyframes orbitTag2 {
          from { transform: rotate(180deg) translateX(32px); }
          to   { transform: rotate(540deg) translateX(32px); }
        }
        @keyframes fadeInUpCat {
          from { opacity:0; transform:translateY(14px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .cat-float   { animation: floatCat 3s ease-in-out infinite; }
        .orbit-tag   { animation: orbitTag 2.6s linear infinite; transform-origin:0 0; }
        .orbit-tag2  { animation: orbitTag2 2.6s linear infinite; transform-origin:0 0; }
        .fu-cat      { animation: fadeInUpCat .55s cubic-bezier(.22,1,.36,1) both; }
        .fu-cat-2    { animation: fadeInUpCat .55s cubic-bezier(.22,1,.36,1) .1s both; }
        .fu-cat-3    { animation: fadeInUpCat .55s cubic-bezier(.22,1,.36,1) .2s both; }
      `}</style>

      <div className="relative w-28 h-28 flex items-center justify-center">
        {/* Glow */}
        <div className="absolute inset-0 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)" }} />

        {/* Orbit dots */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="orbit-tag  w-2.5 h-2.5 rounded-full bg-blue-300/80" />
          <div className="orbit-tag2 w-2   h-2   rounded-full bg-indigo-300/70" />
        </div>

        {/* Icon */}
        <div
          className="cat-float w-20 h-20 rounded-3xl flex items-center justify-center shadow-xl relative z-10"
          style={{ background: "linear-gradient(135deg,#eff6ff 0%,#dbeafe 100%)", border: "1.5px solid rgba(147,197,253,0.5)" }}
        >
          <Tag size={36} className="text-blue-500" strokeWidth={1.5} />
          <Sparkles size={13} className="absolute top-2 right-2 text-blue-400 opacity-70" />
        </div>
      </div>

      <div className="text-center fu-cat">
        <p className="text-base font-bold text-gray-700">لا يوجد فئات بعد</p>
      </div>
      <p className="text-sm text-gray-400 text-center max-w-[220px] fu-cat-2">
        أضف فئتك الأولى الآن وابدأ في تنظيم منتجاتك بشكل احترافي
      </p>
      <div className="fu-cat-3 flex gap-1.5">
        {[0,1,2].map(i => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-300"
            style={{ animation: `floatCat 1.1s ease-in-out infinite`, animationDelay: `${i * 0.18}s` }} />
        ))}
      </div>
    </div>
  );
}

export default function Categories() {
  const toast = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await api.get("/categories", { params: { page, limit: 6 } });
      const data = Array.isArray(res.data) ? res.data : res.data.data;
      const normalized = (data || []).map((item: any) => ({
        _id: item._id || item.id,
        name: item.name,
      }));
      setCategories(normalized);
      setPages(res.data.pagination?.pages || 1);
    } catch (e) {
      console.error(e);
      setCategories(DEFAULT_CATEGORIES);
      setPages(1);
      toast.show({
        type: "error",
        title: "فشل تحميل الفئات",
        description: formatCategoriesFetchError(e),
        duration: 0,
        actions: [
          {
            label: "إعادة المحاولة",
            variant: "primary",
            onClick: () => {
              void fetchAll();
            },
          },
        ],
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    void fetchAll();
  }, [page]);

  const handleAdd = async (name: string) => {
    try {
      await api.post("/categories", { name });
      setPage(1);
      await fetchAll();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await toast.confirm({
      title: "حذف الفئة؟",
      description: "سيتم إزالة الفئة نهائياً من النظام.",
      confirmLabel: "حذف",
      cancelLabel: "إلغاء",
    });
    if (!ok) return;
    await api.delete(`/categories/${id}`);
    await fetchAll();
  };

  const handleEdit = async (id: string, newName: string) => {
    try {
      await api.put(`/categories/${id}`, { name: newName });
      await fetchAll();
    } catch (e) {
      console.error(e);
      toast.show({
        type: "error",
        title: "فشل تعديل الفئة",
        description: "حدث خطأ أثناء تعديل الفئة.",
      });
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-20">

      {/* Toolbar */}
      <div className="flex justify-between items-center gap-3">
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl text-white hover:opacity-90 transition-opacity w-full sm:w-auto justify-center cursor-pointer"
          style={{ background: "var(--primary)" }}
        >
          <Plus size={16} /> إضافة فئة
        </button>
      </div>

      {/* Container */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[680px] flex flex-col">
        {/* Header */}
        <div className="px-6 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">الفئات</span>
          <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">
            {categories.length} نتيجة
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div
                className="w-6 h-6 border-2 border-gray-200 rounded-full animate-spin"
                style={{ borderTopColor: "var(--primary)" }}
              />
            </div>
          ) : categories.length === 0 ? (
            <EmptyCategories />
          ) : (
            <div className="space-y-3">
              {categories.map((c, idx) => (
                <div
                  key={c._id}
                  className="flex justify-between items-center border border-gray-100 rounded-xl px-4 py-3 hover:bg-gray-50 hover:shadow-sm transition-all duration-200"
                  style={{ animation: `fadeInUpCat 0.4s cubic-bezier(.22,1,.36,1) ${idx * 45}ms both` }}
                >
                  <span className="flex items-center gap-2 text-gray-700 text-sm">
                    <Tag size={16} className="text-blue-400" /> {c.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingCategory(c)}
                      className="w-8 h-8 rounded-lg border border-blue-100 flex items-center justify-center text-blue-400 hover:bg-blue-50 transition-colors cursor-pointer"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(c._id)}
                      className="w-8 h-8 rounded-lg border border-red-100 flex items-center justify-center text-red-400 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination — always at bottom */}
        {!loading && pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 mt-auto flex justify-center items-center gap-3 bg-white">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-colors cursor-pointer disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed"
            >
              <ChevronRight size={15} /> السابق
            </button>
            <span className="text-sm text-gray-600">
              صفحة {page} من {pages}
            </span>
            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(prev + 1, pages))}
              disabled={page === pages}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-colors cursor-pointer disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed"
            >
              التالي <ChevronLeft size={15} />
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <CategoryAddModal onAdd={handleAdd} onClose={() => setShowModal(false)} />
      )}
      {editingCategory && (
        <CategoryEditModal
          initialName={editingCategory.name}
          onClose={() => setEditingCategory(null)}
          onEdit={(newName) => handleEdit(editingCategory._id, newName)}
        />
      )}
    </div>
  );
}
