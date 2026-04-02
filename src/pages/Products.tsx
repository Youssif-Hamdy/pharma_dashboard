import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Table2,
} from "lucide-react";
import api from "../api/axios";
import Navbar from "../components/Navbar";
import ProductModal from "../components/ProductModal";
import { useToast } from "../components/ToastContext";
import {
  DEFAULT_BRANDS,
  DEFAULT_CATEGORIES,
  DEFAULT_PRODUCTS,
} from "../data/defaultData";

interface Product {
  _id: string;
  name: string;
  price: number;
  category: { _id: string; name: string } | string;
  brand: { _id: string; name: string } | string;
  image?: { url: string; fileId: string; thumbnailUrl: string };
}
interface Category {
  _id: string;
  name: string;
}
interface Brand {
  _id: string;
  name: string;
}

const getName = (c: { _id: string; name: string } | string) =>
  typeof c === "object" ? c.name : c;

type ProductsViewMode = "table" | "cards";

const VIEW_STORAGE_KEY = "pharma-products-view";

function Products() {
  const toast = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({
    name: "",
    price: "",
    category: "",
    brand: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null); // ✅ الصورة
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ProductsViewMode>(() => {
    try {
      const v = localStorage.getItem(VIEW_STORAGE_KEY);
      return v === "cards" || v === "table" ? v : "table";
    } catch {
      return "table";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, viewMode);
    } catch {
      /* ignore */
    }
  }, [viewMode]);

  const [isMdUp, setIsMdUp] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = () => setIsMdUp(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  /** شاشات أصغر من md: عرض البطاقات فقط */
  const layoutMode: ProductsViewMode = isMdUp ? viewMode : "cards";

  const fetchAll = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      params.page = String(currentPage);
      params.limit = String(itemsPerPage);
      params.search = search;
      if (filterCategory) params.category = filterCategory;
      if (filterBrand) params.brand = filterBrand;

      const [p, c, b] = await Promise.all([
        api.get("/products", { params }),
        api.get("/categories", { params: { limit: 1000 } }),
        api.get("/brands", { params: { limit: 1000 } }),
      ]);
      const data = Array.isArray(p.data) ? p.data : p.data.data || [];
      const pagination = p.data?.pagination || {};
      const totalCount =
        pagination.total ?? pagination.count ?? p.data?.total ?? null;
      const knownPageCount =
        pagination.pages ?? pagination.totalPages ?? p.data?.pages;
      const pageCount =
        typeof knownPageCount === "number"
          ? knownPageCount
          : typeof totalCount === "number"
            ? Math.max(1, Math.ceil(totalCount / itemsPerPage))
            : data.length >= itemsPerPage
              ? currentPage + 1
              : currentPage;
      setProducts(data);
      setPages(pageCount);
      setTotal(totalCount);
      setCategories(Array.isArray(c.data) ? c.data : c.data.data || []);
      setBrands(Array.isArray(b.data) ? b.data : b.data.data || []);
    } catch (e) {
      console.error(e);
      setProducts(DEFAULT_PRODUCTS);
      setCategories(DEFAULT_CATEGORIES);
      setBrands(DEFAULT_BRANDS);
      setPages(1);
      setTotal(DEFAULT_PRODUCTS.length);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, [filterCategory, filterBrand, currentPage, search]);
  useEffect(() => {
    setCurrentPage(1);
  }, [filterCategory, filterBrand, search]);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", price: "", category: "", brand: "" });
    setImageFile(null);
    setShowModal(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name,
      price: String(p.price),
      category: getName(p.category),
      brand: getName(p.brand),
    });
    setImageFile(null);
    setShowModal(true);
  };

  // ✅ بيبعت FormData عشان فيه صورة
const handleSave = async () => {
  if (!form.name || !form.price) return

  const formData = new FormData()
  formData.append('name', form.name.trim())
  formData.append('price', String(Number(form.price)))   // ✅ number صحيح
  if (form.category) formData.append('category', form.category)  // ✅ مش بيبعت لو فاضي
  if (form.brand)    formData.append('brand', form.brand)        // ✅ مش بيبعت لو فاضي
  if (imageFile)     formData.append('image', imageFile)

  try {
    editing
      ? await api.put(`/products/${editing._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      : await api.post('/products', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
    setShowModal(false)
    fetchAll()
  } catch (e) {
    console.error(e)
  }
}
  const handleDelete = async (id: string) => {
    const ok = await toast.confirm({
      title: "حذف المنتج؟",
      description: "سيتم إزالة المنتج نهائياً من النظام.",
      confirmLabel: "حذف",
      cancelLabel: "إلغاء",
    });
    if (!ok) return;
    try {
      await api.delete(`/products/${id}`);
      fetchAll();
      toast.success("تم حذف المنتج");
    } catch (e) {
      console.error(e);
      toast.error(
        "تعذر حذف المنتج",
        "تحقق من الاتصال أو حاول مرة أخرى."
      );
    }
  };

  const hasFilter = filterCategory || filterBrand || search;
  const currentProducts = products;

  return (
    <div className="flex flex-col gap-6 pb-20 w-full min-w-0">
      <Navbar title="المنتجات" />

      {/* Toolbar */}
      <div className="flex flex-wrap md:flex-nowrap justify-between items-center gap-3">
        <div className="flex flex-wrap gap-3 flex-1 items-center">
          <div className="relative w-full sm:w-auto">
            <Search
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="text"
              placeholder="ابحث عن منتج..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-9 pl-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none bg-white w-full sm:w-52 focus:border-green-400 transition-colors"
            />
          </div>

          <div className="relative w-full sm:w-auto">
            <ChevronDown
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="appearance-none w-full sm:w-44 pr-4 pl-8 py-2.5 border border-gray-200 rounded-xl text-sm outline-none bg-white focus:border-green-400 cursor-pointer"
            >
              <option value="">كل الفئات</option>
              {categories.map((c) => (
                <option key={c._id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="relative w-full sm:w-auto">
            <ChevronDown
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <select
              value={filterBrand}
              onChange={(e) => setFilterBrand(e.target.value)}
              className="appearance-none w-full sm:w-44 pr-4 pl-8 py-2.5 border border-gray-200 rounded-xl text-sm outline-none bg-white focus:border-green-400 cursor-pointer"
            >
              <option value="">كل الماركات</option>
              {brands.map((b) => (
                <option key={b._id} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {hasFilter && (
            <button
              onClick={() => {
                setFilterCategory("");
                setFilterBrand("");
                setSearch("");
              }}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-red-100 text-red-400 text-sm hover:bg-red-50 transition-colors cursor-pointer"
            >
              <X size={13} /> مسح
            </button>
          )}
        </div>

        <button
          onClick={openAdd}
          className="flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl text-white hover:opacity-90 transition-opacity w-full sm:w-auto justify-center cursor-pointer"
          style={{ background: "var(--primary)" }}
        >
          <Plus size={16} /> إضافة منتج
        </button>
      </div>

      {/* Table */}
      <div
        className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden w-full min-w-0 ${
          layoutMode === "cards" ? "min-h-[760px]" : "min-h-[680px]"
        }`}
      >
        <div className="px-4 sm:px-6 py-3.5 border-b border-gray-100 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center justify-between gap-3 sm:justify-start">
            <span className="text-sm font-medium text-gray-700">المنتجات</span>
            <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full sm:hidden">
              {total ?? currentProducts.length} نتيجة
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
            <div
              className="hidden md:inline-flex p-1 rounded-xl bg-gray-100/90 border border-gray-200/80 shadow-inner"
              role="group"
              aria-label="طريقة العرض"
            >
              <button
                type="button"
                onClick={() => setViewMode("table")}
                aria-pressed={viewMode === "table"}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  viewMode === "table"
                    ? "bg-white text-gray-800 shadow-sm ring-1 ring-gray-200/80"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                style={
                  viewMode === "table"
                    ? { color: "var(--primary)", boxShadow: "0 1px 2px rgb(0 0 0 / 0.05)" }
                    : undefined
                }
              >
                <Table2 size={15} strokeWidth={2} />
                جدول
              </button>
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                aria-pressed={viewMode === "cards"}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  viewMode === "cards"
                    ? "bg-white text-gray-800 shadow-sm ring-1 ring-gray-200/80"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                style={
                  viewMode === "cards"
                    ? { color: "var(--primary)", boxShadow: "0 1px 2px rgb(0 0 0 / 0.05)" }
                    : undefined
                }
              >
                <LayoutGrid size={15} strokeWidth={2} />
                بطاقات
              </button>
            </div>
            <span className="hidden sm:inline text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">
              {total ?? currentProducts.length} نتيجة
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div
              className="w-6 h-6 border-2 border-gray-200 rounded-full animate-spin"
              style={{ borderTopColor: "var(--primary)" }}
            />
          </div>
        ) : layoutMode === "table" ? (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs">
                    <th className="text-right px-6 py-3 font-medium">الصورة</th>
                    <th className="text-right px-6 py-3 font-medium">الاسم</th>
                    <th className="text-right px-6 py-3 font-medium">السعر</th>
                    <th className="text-right px-6 py-3 font-medium">الفئة</th>
                    <th className="text-right px-6 py-3 font-medium">
                      الماركة
                    </th>
                    <th className="text-right px-6 py-3 font-medium">
                      إجراءات
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentProducts.map((p) => (
                    <tr
                      key={p._id}
                      className="border-t border-gray-50 hover:bg-gray-50 transition-colors"
                    >
                      {/* ✅ عمود الصورة */}
                      <td className="px-6 py-3">
                        {p.image?.url ? (
                          <img
                            src={p.image.thumbnailUrl || p.image.url}
                            alt={p.name}
                            className="w-10 h-10 rounded-lg object-cover border border-gray-100"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300 text-xs border border-gray-100">
                            📦
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-3.5 font-medium text-gray-700">
                        {p.name}
                      </td>
                      <td className="px-6 py-3.5 text-gray-500 whitespace-nowrap">
                        {p.price} ج.م
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full whitespace-nowrap">
                          {getName(p.category)}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="text-xs bg-purple-50 text-purple-600 px-2.5 py-1 rounded-full whitespace-nowrap">
                          {getName(p.brand)}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEdit(p)}
                            className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(p._id)}
                            className="w-8 h-8 rounded-lg border border-red-100 flex items-center justify-center text-red-400 hover:bg-red-50 transition-colors cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {currentProducts.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="text-center py-16 text-gray-400 text-sm"
                      >
                        لا يوجد منتجات
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile: scrollable table */}
            <div className="md:hidden overflow-x-auto -mx-px px-4 py-3">
              <table className="w-full text-sm min-w-[520px]">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs">
                    <th className="text-right px-3 py-2.5 font-medium whitespace-nowrap">
                      الصورة
                    </th>
                    <th className="text-right px-3 py-2.5 font-medium">الاسم</th>
                    <th className="text-right px-3 py-2.5 font-medium whitespace-nowrap">
                      السعر
                    </th>
                    <th className="text-right px-3 py-2.5 font-medium whitespace-nowrap">
                      إجراءات
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentProducts.map((p) => (
                    <tr
                      key={p._id}
                      className="border-t border-gray-50 align-middle"
                    >
                      <td className="px-3 py-2.5">
                        {p.image?.url ? (
                          <img
                            src={p.image.thumbnailUrl || p.image.url}
                            alt={p.name}
                            className="w-10 h-10 rounded-lg object-cover border border-gray-100"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300 text-xs border border-gray-100">
                            📦
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2.5 max-w-[140px]">
                        <p className="font-medium text-gray-800 text-xs leading-snug line-clamp-2">
                          {p.name}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">
                            {getName(p.category)}
                          </span>
                          <span className="text-[10px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded-full">
                            {getName(p.brand)}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap text-xs">
                        {p.price} ج.م
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => openEdit(p)}
                            className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer"
                            aria-label="تعديل"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(p._id)}
                            className="w-8 h-8 rounded-lg border border-red-100 flex items-center justify-center text-red-400 hover:bg-red-50 transition-colors cursor-pointer"
                            aria-label="حذف"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {currentProducts.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="text-center py-12 text-gray-400 text-sm"
                      >
                        لا يوجد منتجات
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-3 px-4 md:px-6 py-3 border-t border-gray-100 bg-white">
              <span className="text-xs text-gray-400 whitespace-nowrap">
                صفحة {currentPage} من {pages}
              </span>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="flex-1 md:flex-none min-w-[112px] justify-center whitespace-nowrap flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-sm"
                >
                  <ChevronRight size={16} /> السابق
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, pages))
                  }
                  disabled={currentPage === pages}
                  className="flex-1 md:flex-none min-w-[112px] justify-center whitespace-nowrap flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-sm"
                >
                  التالي <ChevronLeft size={16} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Cards grid */}
            <div className="px-4 sm:px-6 py-5">
              <div className="grid grid-cols-1 gap-4 sm:gap-5 sm:[grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
                {currentProducts.map((p) => (
                  <article
                    key={p._id}
                    className="group flex flex-col rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden transition-shadow hover:shadow-md hover:border-gray-200/80"
                  >
                    <div className="relative aspect-[4/3] bg-gray-50 border-b border-gray-100">
                      {p.image?.url ? (
                        <img
                          src={p.image.thumbnailUrl || p.image.url}
                          alt={p.name}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-4xl text-gray-200 select-none">
                          📦
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col flex-1 p-4 gap-2">
                      <h3 className="text-sm font-semibold text-gray-800 leading-snug line-clamp-2 min-h-[2.5rem]">
                        {p.name}
                      </h3>
                      <p className="text-sm font-medium text-gray-600 tabular-nums">
                        {p.price}{" "}
                        <span className="text-xs font-normal text-gray-400">
                          ج.م
                        </span>
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full">
                          {getName(p.category)}
                        </span>
                        <span className="text-xs bg-purple-50 text-purple-600 px-2.5 py-1 rounded-full">
                          {getName(p.brand)}
                        </span>
                      </div>
                      <div className="flex gap-2 mt-auto pt-3">
                        <button
                          type="button"
                          onClick={() => openEdit(p)}
                          className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2.5 rounded-xl border border-gray-200 text-gray-700 bg-gray-50/50 hover:bg-gray-100 transition-colors cursor-pointer font-medium"
                        >
                          <Pencil size={14} /> تعديل
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(p._id)}
                          className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2.5 rounded-xl border border-red-100 text-red-600 bg-red-50/60 hover:bg-red-50 transition-colors cursor-pointer font-medium"
                        >
                          <Trash2 size={14} /> حذف
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
              {currentProducts.length === 0 && (
                <div className="text-center py-20 text-gray-400 text-sm">
                  لا يوجد منتجات
                </div>
              )}
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-3 px-4 md:px-6 py-3 border-t border-gray-100 bg-white">
              <span className="text-xs text-gray-400 whitespace-nowrap">
                صفحة {currentPage} من {pages}
              </span>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="flex-1 md:flex-none min-w-[112px] justify-center whitespace-nowrap flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-sm"
                >
                  <ChevronRight size={16} /> السابق
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, pages))
                  }
                  disabled={currentPage === pages}
                  className="flex-1 md:flex-none min-w-[112px] justify-center whitespace-nowrap flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-sm"
                >
                  التالي <ChevronLeft size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <ProductModal
          isEditing={!!editing}
          form={form}
          categories={categories}
          brands={brands}
          onChange={setForm}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
          currentImageUrl={editing?.image?.url} // ✅ عرض الصورة الحالية في التعديل
          onImageChange={setImageFile} // ✅ استقبال الصورة الجديدة
        />
      )}
    </div>
  );
}

export default Products;
