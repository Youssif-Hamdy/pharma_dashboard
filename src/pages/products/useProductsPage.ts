import { useEffect, useState } from "react";
import api from "../../api/axios";
import { useToast } from "../../components/ToastContext";
import {
  DEFAULT_BRANDS,
  DEFAULT_CATEGORIES,
  DEFAULT_PRODUCTS,
} from "../../data/defaultData";

export interface Product {
  _id: string;
  name: string;
  price: number;
  category: { _id: string; name: string } | string;
  brand: { _id: string; name: string } | string;
  image?: { url: string; fileId: string; thumbnailUrl: string };
  isOffer?: boolean;
  offerDiscountPercent?: number;
  offerDiscountAmount?: number;
  isBestSeller?: boolean;
}

export interface Category {
  _id: string;
  name: string;
}

export interface Brand {
  _id: string;
  name: string;
}

export const getName = (c: { _id: string; name: string } | string) =>
  typeof c === "object" ? c.name : c;

export type ProductsViewMode = "table" | "cards";

export const VIEW_STORAGE_KEY = "pharma-products-view";

export type ProductsFilterType = "" | "offer" | "bestseller";

export function useProductsPage() {
  const toast = useToast();
  const [filterType, setFilterType] = useState<ProductsFilterType>("");
  const isOfferFilter = filterType === "offer";
  const isBestsellerFilter = filterType === "bestseller";

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
    isOffer: false,
    offerDiscountPercent: "",
    offerDiscountAmount: "",
    isBestSeller: false,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
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
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(min-width: 768px)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = () => setIsMdUp(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

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
      if (isOfferFilter) params.isOffer = "true";
      if (isBestsellerFilter) params.isBestSeller = "true";

      const [p, c, b] = await Promise.all([
        api.get("/products", { params }),
        api.get("/categories", { params: { limit: 1000 } }),
        api.get("/brands", { params: { limit: 1000 } }),
      ]);
      let data = Array.isArray(p.data) ? p.data : p.data.data || [];
      if (isOfferFilter) data = data.filter((x: Product) => x.isOffer);
      if (isBestsellerFilter) data = data.filter((x: Product) => x.isBestSeller);
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
  }, [
    filterCategory,
    filterBrand,
    currentPage,
    search,
    isOfferFilter,
    isBestsellerFilter,
  ]);
  useEffect(() => {
    setCurrentPage(1);
  }, [filterCategory, filterBrand, search, filterType]);

  const openAdd = () => {
    setEditing(null);
    setForm({
      name: "",
      price: "",
      category: "",
      brand: "",
      isOffer: false,
      offerDiscountPercent: "",
      offerDiscountAmount: "",
      isBestSeller: false,
    });
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
      isOffer: p.isOffer ?? false,
      offerDiscountPercent: String(p.offerDiscountPercent ?? ""),
      offerDiscountAmount: String(p.offerDiscountAmount ?? ""),
      isBestSeller: p.isBestSeller ?? false,
    });
    setImageFile(null);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price) return;

    const formData = new FormData();
    formData.append("name", form.name.trim());
    formData.append("price", String(Number(form.price)));
    if (form.category) formData.append("category", form.category);
    if (form.brand) formData.append("brand", form.brand);
    if (imageFile) formData.append("image", imageFile);

    // Offer & BestSeller fields
    formData.append("isOffer", String(form.isOffer));
    formData.append("isBestSeller", String(form.isBestSeller));
    if (form.isOffer && form.offerDiscountPercent)
      formData.append("offerDiscountPercent", form.offerDiscountPercent);
    if (form.isOffer && form.offerDiscountAmount)
      formData.append("offerDiscountAmount", form.offerDiscountAmount);

    try {
      editing
        ? await api.put(`/products/${editing._id}`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          })
        : await api.post("/products", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
      setShowModal(false);
      await fetchAll();
    } catch (e) {
      console.error(e);
    }
  };

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
      await fetchAll();
      toast.success("تم حذف المنتج");
    } catch (e) {
      console.error(e);
      toast.error("تعذر حذف المنتج", "تحقق من الاتصال أو حاول مرة أخرى.");
    }
  };

  const clearFilters = () => {
    setFilterCategory("");
    setFilterBrand("");
    setSearch("");
    setFilterType("");
  };

  const hasFilter = Boolean(
    filterCategory || filterBrand || search || filterType,
  );
  const currentProducts = products;

  return {
    products: currentProducts,
    filterType,
    setFilterType,
    categories,
    brands,
    loading,
    showModal,
    setShowModal,
    editing,
    form,
    setForm,
    imageFile,
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
    openAdd,
    openEdit,
    handleSave,
    handleDelete,
  };
}