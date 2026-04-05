import { useEffect, useState } from "react";
import { Plus, Trash2, Tag } from "lucide-react";
import api from "../api/axios";
import Navbar from "../components/Navbar";
import { useToast } from "../components/ToastContext";
import { DEFAULT_CATEGORIES } from "../data/defaultData";
import CategoryAddModal from "./categories/CategoryAddModal";
import { formatCategoriesFetchError } from "./categories/categoriesHelpers";

interface Category {
  _id: string;
  name: string;
}

export default function Categories() {
  const toast = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await api.get("/categories", { params: { page, limit: 6 } });
      const data = Array.isArray(res.data) ? res.data : res.data.data;
      setCategories(data || []);
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

  return (
    <div className="flex flex-col gap-6 pb-20">
      <Navbar title="الفئات" />

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

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[680px]">
        <div className="px-6 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">الفئات</span>
          <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">
            {categories.length} نتيجة
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div
              className="w-6 h-6 border-2 border-gray-200 rounded-full animate-spin"
              style={{ borderTopColor: "var(--primary)" }}
            />
          </div>
        ) : (
          <div className="px-6 py-4 space-y-3">
            {categories.map((c) => (
              <div
                key={c._id}
                className="flex justify-between items-center border border-gray-100 rounded-xl px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <span className="flex items-center gap-2 text-gray-700 text-sm">
                  <Tag size={16} /> {c.name}
                </span>
                <button
                  type="button"
                  onClick={() => void handleDelete(c._id)}
                  className="w-8 h-8 rounded-lg border border-red-100 flex items-center justify-center text-red-400 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {categories.length === 0 && (
              <div className="text-center py-10 text-gray-400 text-sm">
                لا يوجد فئات
              </div>
            )}

            <div className="flex justify-center items-center gap-3 mt-6 border-t border-gray-100 pt-4 bg-white">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-colors cursor-pointer disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed"
              >
                السابق
              </button>
              <span className="text-sm text-gray-600">
                صفحة {page} من {pages}
              </span>
              <button
                type="button"
                onClick={() => setPage((prev) => Math.min(prev + 1, pages))}
                disabled={page === pages}
                className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-colors cursor-pointer disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed"
              >
                التالي
              </button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <CategoryAddModal onAdd={handleAdd} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}
