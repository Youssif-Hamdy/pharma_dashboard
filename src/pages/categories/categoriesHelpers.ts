import axios from "axios";

export function formatCategoriesFetchError(err: unknown): string {
  if (!axios.isAxiosError(err))
    return "تعذر تحميل الفئات. تحقق من الشبكة وحاول مرة أخرى.";
  const raw = (err.response?.data as { message?: string } | undefined)?.message;
  const lower = raw?.toLowerCase() ?? "";
  if (
    lower.includes("buffering timed out") ||
    lower.includes("mongodb") ||
    lower.includes("categories.find")
  ) {
    return "الخادم لا يصل إلى قاعدة البيانات (انتهت مهلة الاتصال). راجع MONGODB_URI وصلاحيات IP في MongoDB Atlas ثم أعد نشر الـ API.";
  }
  if (raw) return raw;
  if (err.response?.status === 500)
    return "خطأ داخلي من الخادم (500) أثناء تحميل الفئات.";
  return "تعذر تحميل الفئات.";
}
