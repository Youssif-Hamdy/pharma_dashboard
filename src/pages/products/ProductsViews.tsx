import type { Dispatch, SetStateAction } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Table2,
  Star,
  Tag,
  PackageX,
} from "lucide-react";
import ProductModal from "../../components/ProductModal";
import CustomSelect from "../../components/CustomSelect";
import type {
  Product,
  ProductsViewMode,
  Category,
  Brand,
  ProductsFilterType,
} from "./useProductsPage";
import { getName } from "./useProductsPage";
import type { ProductForm } from "../../components/ProductModal";

export interface ProductsViewsProps {
  products: Product[];
  categories: Category[];
  brands: Brand[];
  loading: boolean;
  showModal: boolean;
  setShowModal: (v: boolean) => void;
  editing: Product | null;
  form: ProductForm;
  setForm: Dispatch<SetStateAction<ProductForm>>;
  setImageFile: (f: File | null) => void;
  search: string;
  setSearch: (v: string) => void;
  filterCategory: string;
  setFilterCategory: (v: string) => void;
  filterBrand: string;
  setFilterBrand: (v: string) => void;
  currentPage: number;
  setCurrentPage: Dispatch<SetStateAction<number>>;
  pages: number;
  total: number | null;
  viewMode: ProductsViewMode;
  setViewMode: (v: ProductsViewMode) => void;
  layoutMode: ProductsViewMode;
  hasFilter: boolean;
  clearFilters: () => void;
  filterType: ProductsFilterType;
  setFilterType: (v: ProductsFilterType) => void;
  openAdd: () => void;
  openEdit: (p: Product) => void;
  handleSave: () => Promise<void>;
  handleDelete: (id: string) => Promise<void>;
}

// ── Glassy card styles (injected once) ──────────────────────────────
const glassStyles = `
  @keyframes cardFadeUp {
    from { opacity: 0; transform: translateY(24px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0)    scale(1);    }
  }
  @keyframes floatPkg {
    0%,100% { transform: translateY(0) rotate(-2deg); }
    50%      { transform: translateY(-13px) rotate(2deg); }
  }
  @keyframes orbitPkg {
    from { transform: rotate(0deg) translateX(46px); }
    to   { transform: rotate(360deg) translateX(46px); }
  }
  @keyframes orbitPkg2 {
    from { transform: rotate(90deg) translateX(36px); }
    to   { transform: rotate(450deg) translateX(36px); }
  }
  @keyframes fadeUpPkg {
    from { opacity:0; transform:translateY(14px); }
    to   { opacity:1; transform:translateY(0); }
  }
  .pkg-float  { animation: floatPkg 3s ease-in-out infinite; }
  .pkg-orbit  { animation: orbitPkg 2.5s linear infinite; transform-origin:0 0; }
  .pkg-orbit2 { animation: orbitPkg2 2.5s linear infinite; transform-origin:0 0; }
  .pkg-fu     { animation: fadeUpPkg .5s cubic-bezier(.22,1,.36,1) both; }
  .pkg-fu2    { animation: fadeUpPkg .5s cubic-bezier(.22,1,.36,1) .1s both; }
  .pkg-fu3    { animation: fadeUpPkg .5s cubic-bezier(.22,1,.36,1) .2s both; }
  @keyframes badgePop {
    0%   { transform: scale(0.7); opacity: 0; }
    70%  { transform: scale(1.1); }
    100% { transform: scale(1);   opacity: 1; }
  }

  /* ── Card shell ── */
  .glass-card {
    animation: cardFadeUp 0.42s cubic-bezier(0.22,1,0.36,1) both;
    background: rgba(255, 255, 255, 0.4);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.6);
    box-shadow:
      0 4px 20px rgba(0, 0, 0, 0.05),
      0 1px 0 rgba(255, 255, 255, 0.8) inset;
    transition:
      transform    0.3s cubic-bezier(0.22,1,0.36,1),
      box-shadow   0.3s ease,
      border-color 0.3s ease,
      background   0.3s ease;
    position: relative;
    overflow: hidden; /* clips image to card corners */
  }
  .glass-card:hover {
    transform: translateY(-5px) scale(1.02);
    box-shadow:
      0 20px 40px rgba(0, 0, 0, 0.08),
      0 8px  16px rgba(0, 0, 0, 0.04),
      0 1px  0   rgba(255, 255, 255, 0.9) inset;
    border-color: rgba(255, 255, 255, 0.9);
    background: rgba(255, 255, 255, 0.55);
  }

  /* ── Shine layer (pointer-events:none so it can't block img) ── */
  .glass-card::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      140deg,
      rgba(255,255,255,0.5) 0%,
      rgba(255,255,255,0)    55%
    );
    pointer-events: none;
    z-index: 3;          /* above image but below badges/buttons */
    border-radius: inherit;
  }

/* ── Image wrapper ── */
  .glass-img-wrapper {
    position: relative;
    width: 100%;
    aspect-ratio: 1 / 1;
    overflow: hidden;
    z-index: 1;
    border-radius: 16px 16px 0 0;
  }
.glass-img-wrapper img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: full;
  object-position: center;
  transform: scale(1.25); /* زوّد الرقم لو لسا فيه بياض ظاهر */
  transition: transform 0.45s cubic-bezier(0.22,1,0.36,1), filter 0.45s ease;
}
.glass-card:hover .glass-img-wrapper img {
  transform: scale(1.24); /* على الهوفر تكبير أكتر شوية */
}

  /* شيلنا الـ ::after بتاع الـ fade الأبيض خالص */
  /* Subtle bottom fade so text area feels separated from image */
  .glass-img-wrapper::after {
    content: '';
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 56px;
    background: linear-gradient(to bottom, transparent, rgba(232,240,254,0.7));
    pointer-events: none;
    z-index: 2;
  }

  /* Empty image placeholder */
  .glass-img-placeholder {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    z-index: 1;
  }

  /* ── Floating badges ── */
  .glass-badges-wrap {
    position: absolute;
    top: 10px;
    right: 10px;
    display: flex;
    flex-direction: column;
    gap: 5px;
    z-index: 4;
  }
  .glass-badge-bestseller {
    animation: badgePop 0.38s cubic-bezier(0.22,1,0.36,1) 0.12s both;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 10px;
    font-weight: 600;
    color: #92400e;
    background: rgba(255,249,230,0.92);
    border: 1px solid rgba(251,191,36,0.4);
    backdrop-filter: blur(6px);
    box-shadow: 0 2px 8px rgba(245,158,11,0.2);
    padding: 3px 8px;
    border-radius: 999px;
    white-space: nowrap;
  }
  .glass-badge-offer {
    animation: badgePop 0.38s cubic-bezier(0.22,1,0.36,1) 0.2s both;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 10px;
    font-weight: 600;
    color: #14532d;
    background: rgba(236,253,245,0.92);
    border: 1px solid rgba(74,222,128,0.4);
    backdrop-filter: blur(6px);
    box-shadow: 0 2px 8px rgba(34,197,94,0.2);
    padding: 3px 8px;
    border-radius: 999px;
    white-space: nowrap;
  }

  .glass-badge-out-of-stock {
    animation: badgePop 0.38s cubic-bezier(0.22,1,0.36,1) 0.12s both;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 10px;
    font-weight: 600;
    color: #991b1b;
    background: rgba(254,242,242,0.92);
    border: 1px solid rgba(248,113,113,0.4);
    backdrop-filter: blur(6px);
    box-shadow: 0 2px 8px rgba(239,68,68,0.2);
    padding: 3px 8px;
    border-radius: 999px;
    white-space: nowrap;
  }

  /* ── Card body ── */
  .glass-card-body {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    flex: 1;
    padding: 10px;
    gap: 8px;
  }
  @media (min-width: 640px) {
    .glass-card-body {
      padding: 14px 16px 14px;
      gap: 10px;
    }
  }

  /* ── Price tag ── */
  .glass-price-tag {
    display: inline-flex;
    align-items: baseline;
    gap: 4px;
    background: linear-gradient(90deg, rgba(34,197,94,0.1), rgba(34,197,94,0.04));
    border: 1px solid rgba(34,197,94,0.2);
    border-radius: 10px;
    padding: 4px 10px;
    align-self: flex-start;
  }

  /* ── Chips ── */
  .glass-chip-category {
    font-size: 10px;
    font-weight: 500;
    color: #1d4ed8;
    background: rgba(219,234,254,0.75);
    border: 1px solid rgba(147,197,253,0.45);
    padding: 2px 6px;
    border-radius: 999px;
    transition: transform 0.18s;
  }
  .glass-chip-category:hover { transform: scale(1.04); }
  .glass-chip-brand {
    font-size: 10px;
    font-weight: 500;
    color: #6d28d9;
    background: rgba(237,233,254,0.75);
    border: 1px solid rgba(196,181,253,0.45);
    padding: 2px 6px;
    border-radius: 999px;
    transition: transform 0.18s;
  }
  .glass-chip-brand:hover { transform: scale(1.04); }

  @media (min-width: 640px) {
    .glass-chip-category, .glass-chip-brand {
      font-size: 11px;
      padding: 3px 10px;
    }
  }

  /* ── Action buttons ── */
  .glass-btn-edit {
    flex: 1;
    display: flex; align-items: center; justify-content: center; gap: 4px;
    font-size: 11px; font-weight: 600;
    color: #374151;
    background: rgba(249,250,251,0.8);
    border: 1px solid rgba(209,213,219,0.7);
    border-radius: 10px;
    padding: 6px 0;
    cursor: pointer;
    transition: background 0.18s, transform 0.18s, box-shadow 0.18s;
  }
  .glass-btn-edit:hover {
    background: #ffffff;
    transform: translateY(-1px);
    box-shadow: 0 3px 10px rgba(0,0,0,0.09);
  }
  .glass-btn-delete {
    flex: 1;
    display: flex; align-items: center; justify-content: center; gap: 4px;
    font-size: 11px; font-weight: 600;
    color: #dc2626;
    background: rgba(254,242,242,0.8);
    border: 1px solid rgba(252,165,165,0.45);
    border-radius: 10px;
    padding: 6px 0;
    cursor: pointer;
    transition: background 0.18s, transform 0.18s, box-shadow 0.18s;
  }
  .glass-btn-delete:hover {
    background: rgba(254,226,226,0.95);
    transform: translateY(-1px);
    box-shadow: 0 3px 10px rgba(239,68,68,0.13);
  }

  @media (min-width: 640px) {
    .glass-btn-edit, .glass-btn-delete {
      font-size: 12px;
      gap: 6px;
      padding: 9px 0;
      border-radius: 12px;
    }
  }

  /* ── Grid background ── */
  .cards-grid-bg {
    background:
      radial-gradient(ellipse at 15% 0%,   rgba(34,197,94,0.06)  0%, transparent 50%),
      radial-gradient(ellipse at 85% 100%, rgba(99,102,241,0.05) 0%, transparent 50%),
      #f8fafc;
  }
`;

function PaginationBar({
  currentPage,
  pages,
  setCurrentPage,
}: {
  currentPage: number;
  pages: number;
  setCurrentPage: Dispatch<SetStateAction<number>>;
}) {
  return (
    <div className="mt-auto flex flex-col md:flex-row items-center justify-between gap-3 px-4 md:px-6 py-3 border-t border-gray-100 bg-white">
      <span className="text-xs text-gray-400 whitespace-nowrap">
        صفحة {currentPage} من {pages}
      </span>
      <div className="flex items-center gap-2 w-full md:w-auto">
        <button
          type="button"
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="flex-1 md:flex-none min-w-[112px] justify-center whitespace-nowrap flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-sm"
        >
          <ChevronRight size={16} /> السابق
        </button>
        <button
          type="button"
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, pages))}
          disabled={currentPage === pages}
          className="flex-1 md:flex-none min-w-[112px] justify-center whitespace-nowrap flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-sm"
        >
          التالي <ChevronLeft size={16} />
        </button>
      </div>
    </div>
  );
}

// ── Badge components (glassy) ────────────────────────────────────────
function BestSellerBadge() {
  return (
    <span className="glass-badge-bestseller">
      <Star size={9} fill="#f59e0b" />
      الأكثر مبيعاً
    </span>
  );
}

function OfferBadge({ percent, amount }: { percent?: number; amount?: number }) {
  const label = percent ? `${percent}%` : amount ? `${amount} ج.م` : null;
  return (
    <span className="glass-badge-offer">
      <Tag size={9} />
      {label ? `خصم ${label}` : "عرض خاص"}
    </span>
  );
}

export default function ProductsViews(p: ProductsViewsProps) {
  const {
    products: currentProducts,
    categories,
    brands,
    loading,
    showModal,
    setShowModal,
    editing,
    form,
    setForm,
    setImageFile,
    search,
    setSearch,
    filterCategory,
    setFilterCategory,
    filterBrand,
    setFilterBrand,
    currentPage,
    setCurrentPage,
    pages,
    total,
    viewMode,
    setViewMode,
    layoutMode,
    hasFilter,
    clearFilters,
    filterType,
    setFilterType,
    openAdd,
    openEdit,
    handleSave,
    handleDelete,
  } = p;

  return (
    <>
      {/* Inject glassy styles once */}
      <style>{glassStyles}</style>

      <div className="flex flex-wrap md:flex-nowrap justify-between items-center gap-3">
        <div className="flex flex-wrap gap-3 flex-1 items-center">
          <div className="relative w-full sm:w-auto group">
            <Search
              size={15}
              className={`absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors duration-300 ${search ? 'text-[var(--primary)]' : 'text-gray-400 group-hover:text-gray-500'}`}
            />
            <input
              type="text"
              placeholder="ابحث عن منتج..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`pr-10 pl-4 py-2.5 rounded-2xl border text-sm outline-none w-full sm:w-60 transition-all duration-300 shadow-sm hover:shadow-md focus:shadow-md focus:border-[var(--primary)] ${
                search ? 'bg-[var(--primary-light)]/30 border-[var(--primary)]/50 text-[var(--primary)] placeholder-[var(--primary)]/50 font-medium' : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
              }`}
            />
          </div>

          <div className="relative w-full sm:w-auto group">
            <CustomSelect
              value={filterCategory}
              onChange={setFilterCategory}
              options={[
                { value: "", label: "كل الفئات" },
                ...categories.map(c => ({ value: c.name, label: c.name }))
              ]}
              placeholder="كل الفئات"
              className="w-full sm:w-44"
            />
          </div>

          <div className="relative w-full sm:w-auto group">
            <CustomSelect
              value={filterBrand}
              onChange={setFilterBrand}
              options={[
                { value: "", label: "كل الماركات" },
                ...brands.map(b => ({ value: b.name, label: b.name }))
              ]}
              placeholder="كل الماركات"
              className="w-full sm:w-44"
            />
          </div>

          <div className="relative w-full sm:w-auto group">
            <CustomSelect
              value={filterType}
              onChange={(v) => {
                const val = v as ProductsFilterType;
                setFilterType(val);
                if (val) setViewMode("cards");
              }}
              options={[
                { value: "", label: "كل المنتجات" },
                { value: "offer", label: "عروض فقط" },
                { value: "bestseller", label: "الأكثر مبيعاً فقط" }
              ]}
              placeholder="كل المنتجات"
              className="w-full sm:w-48"
            />
          </div>

          {hasFilter && (
            <button
              type="button"
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border border-red-200 bg-red-50 text-red-600 text-sm font-bold hover:bg-red-100 hover:shadow-sm transition-all cursor-pointer"
            >
              <X size={15} strokeWidth={2.5} /> مسح
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={openAdd}
          className="flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl text-white hover:opacity-90 transition-opacity w-full sm:w-auto justify-center cursor-pointer"
          style={{ background: "var(--primary)" }}
        >
          <Plus size={16} /> إضافة منتج
        </button>
      </div>

      <div
        className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden w-full min-w-0 flex flex-col ${
          layoutMode === "cards" ? "min-h-[760px]" : "min-h-[680px]"
        }`}
      >
        <div className="px-4 sm:px-6 py-3.5 border-b border-gray-100 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center justify-between gap-3 sm:justify-start flex-wrap">
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

        <div className="flex-1 flex flex-col overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div
              className="w-6 h-6 border-2 border-gray-200 rounded-full animate-spin"
              style={{ borderTopColor: "var(--primary)" }}
            />
          </div>
        ) : layoutMode === "table" ? (
          <>
            {/* ── Desktop Table ── */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs">
                    <th className="text-right px-6 py-3 font-medium">الصورة</th>
                    <th className="text-right px-6 py-3 font-medium">الاسم</th>
                    <th className="text-right px-6 py-3 font-medium">السعر</th>
                    <th className="text-right px-6 py-3 font-medium">الفئة</th>
                    <th className="text-right px-6 py-3 font-medium">الماركة</th>
                    <th className="text-right px-6 py-3 font-medium">المميزات</th>
                    <th className="text-right px-6 py-3 font-medium">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {currentProducts.map((prod) => (
                    <tr
                      key={prod._id}
                      className="border-t border-gray-50 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-3">
                        {prod.image?.url ? (
                          <img
                            src={prod.image.thumbnailUrl || prod.image.url}
                            alt={prod.name}
                            className="w-10 h-10 rounded-lg object-cover border border-gray-100"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300 text-xs border border-gray-100">
                            📦
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-3.5 font-medium text-gray-700">
                        {prod.name}
                      </td>
                      <td className="px-6 py-3.5 text-gray-500 whitespace-nowrap">
                        {prod.price} ج.م
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full whitespace-nowrap">
                          {getName(prod.category)}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="text-xs bg-purple-50 text-purple-600 px-2.5 py-1 rounded-full whitespace-nowrap">
                          {getName(prod.brand)}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex flex-wrap gap-1.5">
                          {prod.isAvailable === false && (
                            <span className="glass-badge-out-of-stock">
                              غير متوفر
                            </span>
                          )}
                          {prod.isBestSeller && <BestSellerBadge />}
                          {prod.isOffer && (
                            <OfferBadge
                              percent={prod.offerDiscountPercent}
                              amount={prod.offerDiscountAmount}
                            />
                          )}
                          {prod.isAvailable !== false && !prod.isBestSeller && !prod.isOffer && (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(prod)}
                            className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(prod._id)}
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
                      <td colSpan={7} className="text-center py-16">
                        <div className="flex flex-col items-center gap-4">
                          <div className="relative w-24 h-24 flex items-center justify-center">
                            <div className="absolute inset-0 rounded-full" style={{ background: "radial-gradient(circle, rgba(34,197,94,0.1) 0%, transparent 70%)" }} />
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="pkg-orbit w-2 h-2 rounded-full bg-green-300/70" />
                              <div className="pkg-orbit2 w-2 h-2 rounded-full bg-emerald-300/60" />
                            </div>
                            <div className="pkg-float w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg relative z-10" style={{ background: "linear-gradient(135deg,#f0fdf4,#dcfce7)", border: "1.5px solid rgba(134,239,172,0.5)" }}>
                              <PackageX size={30} className="text-green-400" strokeWidth={1.5} />
                            </div>
                          </div>
                          <div className="pkg-fu">
                            <p className="text-sm font-bold text-gray-700">لا توجد منتجات حالياً</p>
                          </div>
                          <p className="text-xs text-gray-400 max-w-[220px] pkg-fu2">لم يتم العثور على أي منتجات تطابق بحثك أو لم تقم بإضافة منتجات بعد.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* ── Mobile Table ── */}
            <div className="md:hidden overflow-x-auto -mx-px px-4 py-3">
              <table className="w-full text-sm min-w-[520px]">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs">
                    <th className="text-right px-3 py-2.5 font-medium whitespace-nowrap">الصورة</th>
                    <th className="text-right px-3 py-2.5 font-medium">الاسم</th>
                    <th className="text-right px-3 py-2.5 font-medium whitespace-nowrap">السعر</th>
                    <th className="text-right px-3 py-2.5 font-medium whitespace-nowrap">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {currentProducts.map((prod) => (
                    <tr key={prod._id} className="border-t border-gray-50 align-middle">
                      <td className="px-3 py-2.5">
                        {prod.image?.url ? (
                          <img
                            src={prod.image.thumbnailUrl || prod.image.url}
                            alt={prod.name}
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
                          {prod.name}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">
                            {getName(prod.category)}
                          </span>
                          <span className="text-[10px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded-full">
                            {getName(prod.brand)}
                          </span>
                          {prod.isAvailable === false && (
                            <span className="text-[10px] bg-red-50 text-red-700 border border-red-200 px-1.5 py-0.5 rounded-full">
                              غير متوفر
                            </span>
                          )}
                          {prod.isBestSeller && <BestSellerBadge />}
                          {prod.isOffer && (
                            <OfferBadge
                              percent={prod.offerDiscountPercent}
                              amount={prod.offerDiscountAmount}
                            />
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap text-xs">
                        {prod.price} ج.م
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEdit(prod)}
                            className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer"
                            aria-label="تعديل"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(prod._id)}
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
                      <td colSpan={4} className="text-center py-12">
                        <div className="flex flex-col items-center gap-3">
                          <div className="pkg-float w-14 h-14 rounded-2xl flex items-center justify-center shadow-md" style={{ background: "linear-gradient(135deg,#f0fdf4,#dcfce7)", border: "1.5px solid rgba(134,239,172,0.5)" }}>
                            <PackageX size={24} className="text-green-400" strokeWidth={1.5} />
                          </div>
                          <p className="text-xs font-bold text-gray-600 pkg-fu">لا توجد منتجات حالياً</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </>
        ) : (
          <>
            {/* ══════════════════════════════════════
                ── GLASSY Cards View ──
            ══════════════════════════════════════ */}
            <div className="cards-grid-bg px-4 sm:px-6 py-6">
              <div className="grid grid-cols-1 gap-5 sm:gap-6 sm:[grid-template-columns:repeat(auto-fill,minmax(240px,1fr))] max-w-[320px] mx-auto sm:max-w-none">
                {currentProducts.map((prod, idx) => (
                  <article
                    key={prod._id}
                    className="glass-card rounded-2xl flex flex-col"
                    style={{ animationDelay: `${idx * 55}ms` }}
                  >
                    {/* ── Image ── */}
                    <div className="glass-img-wrapper">
                      {prod.image?.url ? (
                        <img
                          src={prod.image.thumbnailUrl || prod.image.url}
                          alt={prod.name}
                        />
                      ) : (
                        <div className="glass-img-placeholder">
                          <span style={{ fontSize: 36, opacity: 0.25 }}>📦</span>
                          <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 500, letterSpacing: "0.04em" }}>
                            لا توجد صورة
                          </span>
                        </div>
                      )}

                      {/* Floating badges */}
                      {(prod.isBestSeller || prod.isOffer || prod.isAvailable === false) && (
                        <div className="glass-badges-wrap">
                          {prod.isAvailable === false && (
                            <span className="glass-badge-out-of-stock">
                              غير متوفر
                            </span>
                          )}
                          {prod.isBestSeller && <BestSellerBadge />}
                          {prod.isOffer && (
                            <OfferBadge
                              percent={prod.offerDiscountPercent}
                              amount={prod.offerDiscountAmount}
                            />
                          )}
                        </div>
                      )}
                    </div>

                    {/* ── Body ── */}
                    <div className="glass-card-body">
                      {/* Name & Price */}
                      <div className="flex flex-row sm:flex-col justify-between sm:justify-start items-start gap-2">
                        <h3 className="text-sm font-bold text-gray-800 leading-snug line-clamp-2 sm:min-h-[2.5rem] tracking-tight flex-1">
                          {prod.name}
                        </h3>
                        <div className="glass-price-tag shrink-0 mt-0 sm:mt-1">
                          <span className="text-sm sm:text-base font-extrabold tabular-nums" style={{ color: "var(--primary)" }}>
                            {prod.price}
                          </span>
                          <span className="text-[10px] sm:text-xs font-normal text-gray-400">ج.م</span>
                        </div>
                      </div>

                      {/* Chips */}
                      <div className="flex flex-wrap gap-1 mt-0.5 sm:mt-0">
                        <span className="glass-chip-category">{getName(prod.category)}</span>
                        <span className="glass-chip-brand">{getName(prod.brand)}</span>
                      </div>

                      {/* Divider */}
                      <div
                        style={{
                          height: 1,
                          background: "linear-gradient(to right, transparent, rgba(203,213,225,0.7), transparent)",
                          marginTop: "auto",
                        }}
                      />

                      {/* Action buttons */}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(prod)}
                          className="glass-btn-edit"
                        >
                          <Pencil size={13} />
                          تعديل
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(prod._id)}
                          className="glass-btn-delete"
                        >
                          <Trash2 size={13} />
                          حذف
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {currentProducts.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 gap-5">
                  <div className="relative w-28 h-28 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full" style={{ background: "radial-gradient(circle, rgba(34,197,94,0.1) 0%, transparent 70%)" }} />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="pkg-orbit  w-2.5 h-2.5 rounded-full bg-green-300/70" />
                      <div className="pkg-orbit2 w-2   h-2   rounded-full bg-emerald-300/60" />
                    </div>
                    <div className="pkg-float w-20 h-20 rounded-3xl flex items-center justify-center shadow-xl relative z-10" style={{ background: "linear-gradient(135deg,#f0fdf4,#dcfce7)", border: "1.5px solid rgba(134,239,172,0.5)" }}>
                      <PackageX size={36} className="text-green-400" strokeWidth={1.5} />
                    </div>
                  </div>
                  <div className="text-center pkg-fu">
                    <p className="text-base font-bold text-gray-700">لا يوجد منتجات بعد</p>
                  </div>
                  <p className="text-sm text-gray-400 text-center max-w-[220px] pkg-fu2">
                    ابدأ بإضافة أول منتج وستظهر بطاقاته هنا بشكل جميل
                  </p>
                  <div className="pkg-fu3 flex gap-1.5">
                    {[0,1,2].map(i => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full bg-green-300"
                        style={{ animation: `floatPkg 1.1s ease-in-out infinite`, animationDelay: `${i*0.18}s` }} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
        </div>

        {/* ── Pagination always pinned at bottom ── */}
        {!loading && (
          <PaginationBar currentPage={currentPage} pages={pages} setCurrentPage={setCurrentPage} />
        )}
      </div>

      {showModal && (
        <ProductModal
          isEditing={!!editing}
          form={form}
          categories={categories}
          brands={brands}
          onChange={setForm}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
          currentImageUrl={editing?.image?.url}
          onImageChange={setImageFile}
        />
      )}
    </>
  );
}