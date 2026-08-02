import { useEffect, useState } from "react";
import { Plus, Trash2, Search, Building2, ChevronLeft, ChevronRight, Sparkles, Edit2 } from "lucide-react";
import api from "../api/axios";
import { useToast } from "../components/ToastContext";
import { DEFAULT_BRANDS } from "../data/defaultData";
import BrandAddModal from "./brands/BrandAddModal";
import BrandEditModal from "./brands/BrandEditModal";

interface Brand {
  _id: string;
  name: string;
}

/* ── Premium Empty State ────────────────────────────────── */
function EmptyBrands() {
  return (
    <div className="col-span-3 flex flex-col items-center justify-center py-20 gap-5 select-none">
      <style>{`
        @keyframes floatBrand {
          0%,100% { transform: translateY(0) rotate(-2deg); }
          50%      { transform: translateY(-14px) rotate(2deg); }
        }
        @keyframes orbitDot {
          from { transform: rotate(0deg) translateX(44px); }
          to   { transform: rotate(360deg) translateX(44px); }
        }
        @keyframes fadeInUp {
          from { opacity:0; transform:translateY(16px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .brand-float  { animation: floatBrand 3.2s ease-in-out infinite; }
        .orbit-dot    { animation: orbitDot 2.4s linear infinite; transform-origin: 0 0; }
        .orbit-dot-2  { animation: orbitDot 2.4s linear infinite reverse; animation-delay:-.8s; transform-origin:0 0; }
        .fade-in-up   { animation: fadeInUp .6s cubic-bezier(.22,1,.36,1) both; }
        .fade-in-up-2 { animation: fadeInUp .6s cubic-bezier(.22,1,.36,1) .12s both; }
        .fade-in-up-3 { animation: fadeInUp .6s cubic-bezier(.22,1,.36,1) .24s both; }
      `}</style>

      {/* Floating icon area */}
      <div className="relative w-28 h-28 flex items-center justify-center">
        {/* Glow ring */}
        <div className="absolute inset-0 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(201,168,76,0.15) 0%, transparent 70%)" }} />

        {/* Orbiting dots */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="orbit-dot w-2.5 h-2.5 rounded-full bg-amber-300/70" />
          <div className="orbit-dot-2 w-2 h-2 rounded-full bg-green-300/70" />
        </div>

        {/* Main icon */}
        <div
          className="brand-float w-20 h-20 rounded-3xl flex items-center justify-center shadow-xl relative z-10"
          style={{ background: "linear-gradient(135deg,#fffbe6 0%,#fef3c7 100%)", border: "1.5px solid rgba(201,168,76,0.35)" }}
        >
          <Building2 size={36} style={{ color: "var(--gold)" }} strokeWidth={1.5} />
          {/* Sparkle accent */}
          <Sparkles size={14} className="absolute top-2 right-2 text-amber-400 opacity-70" />
        </div>
      </div>

      <div className="text-center fade-in-up">
        <p className="text-base font-bold text-gray-700">لا يوجد ماركات بعد</p>
      </div>
      <p className="text-sm text-gray-400 text-center max-w-[220px] fade-in-up-2">
        ابدأ بإضافة ماركة جديدة وستظهر هنا في لمح البصر
      </p>
      <div className="fade-in-up-3">
        <div className="flex gap-1.5">
          {[0,1,2].map(i => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-amber-300"
              style={{ animation: `floatBrand 1.2s ease-in-out infinite`, animationDelay: `${i*0.2}s` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Brands() {
  const toast = useToast();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await api.get("/brands", {
        params: { page, limit: 8, search },
      });
      const raw = res.data;
      const list = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.data)
          ? raw.data
          : [];
      const normalized = list.map((item: { _id?: string; id?: string; name: string }) => ({
        _id: item._id || item.id,
        name: item.name,
      }));
      setBrands(normalized);
      setPages(raw?.pagination?.pages || 1);
      setTotal(raw?.pagination?.total || normalized.length);
    } catch (error) {
      console.error(error);
      setBrands(DEFAULT_BRANDS);
      setPages(1);
      setTotal(DEFAULT_BRANDS.length);
    }
    setLoading(false);
  };

  useEffect(() => {
    void fetchAll();
  }, [page, search]);
  useEffect(() => {
    setPage(1);
  }, [search]);

  const handleAdd = async (name: string) => {
    await api.post("/brands", { name });
    setPage(1);
    await fetchAll();
  };

  const handleDelete = async (id: string) => {
    const ok = await toast.confirm({
      title: "حذف الماركة؟",
      description: "سيتم إزالة الماركة نهائياً من النظام.",
      confirmLabel: "حذف",
      cancelLabel: "إلغاء",
    });
    if (!ok) return;
    await api.delete(`/brands/${id}`);
    await fetchAll();
  };

  const handleEdit = async (id: string, newName: string) => {
    try {
      await api.put(`/brands/${id}`, { name: newName });
      await fetchAll();
    } catch (e) {
      console.error(e);
      toast.show({
        type: "error",
        title: "فشل تعديل الماركة",
        description: "حدث خطأ أثناء تعديل الماركة.",
      });
    }
  };

  return (
    <div className="flex flex-col gap-6">

      {/* Toolbar */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div className="relative">
          <Search
            size={15}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="ابحث عن ماركة..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9 pl-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none bg-white w-52 focus:border-green-400 transition-colors"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl text-white hover:opacity-90 cursor-pointer"
          style={{ background: "var(--primary)" }}
        >
          <Plus size={16} /> إضافة ماركة
        </button>
      </div>

      {/* Container */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[560px] flex flex-col">
        {/* Header */}
        <div className="px-6 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">الماركات</span>
          <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">
            {total} ماركة
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
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {brands.length === 0 ? (
                <EmptyBrands />
              ) : (
                brands.map((b, idx) => (
                  <div
                    key={b._id}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex justify-between items-center hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                    style={{ animation: `fadeInUp 0.4s cubic-bezier(.22,1,.36,1) ${idx * 50}ms both` }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: "var(--gold-light)" }}
                      >
                        <Building2 size={18} style={{ color: "var(--gold)" }} />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{b.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingBrand(b)}
                        className="w-8 h-8 rounded-lg border border-blue-100 flex items-center justify-center text-blue-400 hover:bg-blue-50 transition-colors cursor-pointer"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(b._id)}
                        className="w-8 h-8 rounded-lg border border-red-100 flex items-center justify-center text-red-400 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Pagination — always at bottom */}
        {!loading && pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 mt-auto flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm rounded-xl border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <ChevronRight size={16} /> السابق
            </button>
            <span className="text-sm text-gray-600 text-center">
              صفحة {page} من {pages} · {total} ماركة
            </span>
            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(prev + 1, pages))}
              disabled={page === pages}
              className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm rounded-xl border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              التالي <ChevronLeft size={16} />
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <BrandAddModal onClose={() => setShowModal(false)} onAdd={handleAdd} />
      )}
      {editingBrand && (
        <BrandEditModal
          initialName={editingBrand.name}
          onClose={() => setEditingBrand(null)}
          onEdit={(newName) => handleEdit(editingBrand._id, newName)}
        />
      )}
    </div>
  );
}
