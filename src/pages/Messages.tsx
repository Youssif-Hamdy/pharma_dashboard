import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import api from "../api/axios";
import Navbar from "../components/Navbar";
import { useToast } from "../components/ToastContext";
import { DEFAULT_MESSAGES } from "../data/defaultData";
import {
  AddMessageModal,
  EditMessageModal,
  ViewMessageModal,
  formatMessagesFetchError,
  parseList,
  type Message,
} from "./messages/messageModals";

export default function Messages() {
  const toast = useToast();
  const [items, setItems] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [viewing, setViewing] = useState<Message | null>(null);
  const [editing, setEditing] = useState<Message | null>(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await api.get("/messages", {
        params: { page, limit: 10 },
        timeout: 60_000,
      });
      const { list, pages: p, total: t } = parseList(res.data);
      setItems(list);
      setPages(p);
      setTotal(t);
    } catch (e) {
      console.error(e);
      const desc = formatMessagesFetchError(e);
      setItems(DEFAULT_MESSAGES);
      setPages(1);
      setTotal(DEFAULT_MESSAGES.length);
      toast.show({
        type: "error",
        title: "فشل تحميل الرسائل",
        description: desc,
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

  const handlePost = async (body: { title: string; content: string }) => {
    await api.post("/messages", body);
    setPage(1);
    await fetchAll();
  };

  const handlePut = async (
    id: string,
    body: { title: string; content: string },
  ) => {
    await api.put(`/messages/${id}`, body);
    setEditing(null);
    await fetchAll();
  };

  const handleDelete = async (id: string): Promise<boolean> => {
    const ok = await toast.confirm({
      title: "حذف الرسالة؟",
      description: "لن يمكن التراجع عن هذا الإجراء.",
      confirmLabel: "حذف",
      cancelLabel: "إلغاء",
    });
    if (!ok) return false;
    try {
      await api.delete(`/messages/${id}`);
      setViewing(null);
      setEditing(null);
      await fetchAll();
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const rowPreview = (text: string) => {
    const t = text.replace(/\s+/g, " ").trim();
    if (!t) return "—";
    return t.length > 48 ? `${t.slice(0, 48)}…` : t;
  };

  return (
    <div className="flex flex-col gap-6 min-h-[calc(100vh-3rem)]">
      <Navbar title="الرسائل" />

      <div className="flex flex-wrap justify-between items-center gap-3 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 px-4 py-3 shadow-sm">
        <p className="text-sm text-gray-500">إدارة رسائل التواصل </p>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl text-white hover:opacity-90 transition-all duration-200 hover:-translate-y-0.5 w-full sm:w-auto justify-center cursor-pointer shadow-sm hover:shadow-md"
          style={{ background: "var(--primary)" }}
        >
          <Plus size={16} /> رسالة جديدة
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden flex-1">
        <div className="px-6 py-3.5 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
          <span className="text-sm font-medium text-gray-700">قائمة الرسائل</span>
          <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">
            {total} رسالة
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs">
                  <th className="text-right px-4 py-3 font-medium">التاريخ</th>
                  <th className="text-right px-4 py-3 font-medium">العنوان</th>
                  <th className="text-right px-4 py-3 font-medium">
                    معاينة المحتوى
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((m) => (
                  <tr
                    key={m._id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setViewing(m)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setViewing(m);
                      }
                    }}
                    className="border-t border-gray-50 hover:bg-gray-50/80 transition-colors duration-200 cursor-pointer"
                  >
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {m.createdAt
                        ? new Date(m.createdAt).toLocaleDateString("ar-EG")
                        : "—"}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-700 max-w-[200px] truncate">
                      {m.title || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-500 max-w-[280px]">
                      {rowPreview(m.content)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {items.length === 0 && (
              <div className="text-center py-14 text-gray-400 text-sm">
                لا توجد رسائل بعد
              </div>
            )}
          </div>
        )}

        {pages > 1 && (
          <div className="flex justify-center items-center gap-3 px-6 py-4 border-t border-gray-100 bg-white/90">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className="px-4 py-2 text-sm rounded-xl border border-gray-200 disabled:opacity-50 cursor-pointer hover:bg-gray-50 transition-colors"
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
              className="px-4 py-2 text-sm rounded-xl border border-gray-200 disabled:opacity-50 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              التالي
            </button>
          </div>
        )}
      </div>

      {showAdd && (
        <AddMessageModal
          onClose={() => setShowAdd(false)}
          onSubmit={handlePost}
        />
      )}

      {viewing && !editing && (
        <ViewMessageModal
          msg={viewing}
          onClose={() => setViewing(null)}
          onEdit={() => {
            setEditing(viewing);
            setViewing(null);
          }}
          onDelete={() => handleDelete(viewing._id)}
        />
      )}

      {editing && (
        <EditMessageModal
          initial={editing}
          onClose={() => setEditing(null)}
          onSubmit={(body) => handlePut(editing._id, body)}
        />
      )}
    </div>
  );
}
