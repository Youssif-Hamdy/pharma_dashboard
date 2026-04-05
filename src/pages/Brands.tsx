import { useEffect, useState } from "react";
import { Plus, Trash2, Search, Building2, ChevronLeft, ChevronRight } from "lucide-react";
import api from "../api/axios";
import Navbar from "../components/Navbar";
import { useToast } from "../components/ToastContext";
import { DEFAULT_BRANDS } from "../data/defaultData";
import BrandAddModal from "./brands/BrandAddModal";

interface Brand {
  _id: string;
  name: string;
}

export default function Brands() {
  const toast = useToast();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
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

  return (
    <div className="flex flex-col gap-6">
      <Navbar title="الماركات" />

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

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div
            className="w-6 h-6 border-2 border-gray-200 rounded-full animate-spin"
            style={{ borderTopColor: "var(--primary)" }}
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {brands.map((b) => (
              <div
                key={b._id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex justify-between items-center hover:shadow-md transition-shadow"
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
                <button
                  type="button"
                  onClick={() => void handleDelete(b._id)}
                  className="w-8 h-8 rounded-lg border border-red-100 flex items-center justify-center text-red-400 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {brands.length === 0 && (
              <div className="col-span-3 text-center py-16 text-gray-400 text-sm">
                لا يوجد ماركات
              </div>
            )}
          </div>

          {pages > 1 && (
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mt-2">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm rounded-xl border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                <ChevronRight size={16} /> السابق
              </button>
              <span className="text-sm text-gray-600">
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
        </>
      )}

      {showModal && (
        <BrandAddModal onClose={() => setShowModal(false)} onAdd={handleAdd} />
      )}
    </div>
  );
}
