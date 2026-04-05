import { useEffect, useState, type CSSProperties } from "react";
import { Trash2, Mail, X, Pencil } from "lucide-react";
import axios from "axios";

export function formatMessagesFetchError(err: unknown): string {
  if (!axios.isAxiosError(err))
    return "تعذر تحميل الرسائل. تحقق من الشبكة وحاول مرة أخرى.";
  const raw = (err.response?.data as { message?: string } | undefined)?.message;
  const lower = raw?.toLowerCase() ?? "";
  if (
    lower.includes("buffering timed out") ||
    lower.includes("mongodb") ||
    lower.includes("messages.find")
  ) {
    return "الخادم لا يصل إلى قاعدة البيانات (انتهت مهلة الاتصال). في مشروع الـ API على Vercel: راجع أن متغير MONGODB_URI صحيح وأن الـ cluster يسمح بالاتصال من أي IP، ثم أعد نشر الـ API.";
  }
  if (raw) return raw;
  if (err.response?.status === 500) return "خطأ داخلي من الخادم (500).";
  return "تعذر تحميل الرسائل.";
}

/** يطابق الـ API: POST/PUT { title, content } */
export interface Message {
  _id: string;
  title: string;
  content: string;
  createdAt?: string;
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
    transition: "background-color 210ms cubic-bezier(0.4,0,0.2,1)",
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
      "opacity 210ms cubic-bezier(0.4,0,0.2,1), transform 210ms cubic-bezier(0.4,0,0.2,1)",
  },
};

function normalizeMessage(item: Record<string, unknown>): Message {
  const id = item._id ?? item.id;
  return {
    _id: String(id),
    title: String(item.title ?? item.subject ?? ""),
    content: String(item.content ?? item.message ?? item.body ?? ""),
    createdAt: item.createdAt
      ? String(item.createdAt)
      : item.created_at
        ? String(item.created_at)
        : undefined,
  };
}

export function parseList(resData: unknown): {
  list: Message[];
  pages: number;
  total: number;
} {
  const raw = resData as Record<string, unknown>;
  const listRaw = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.data)
      ? (raw.data as unknown[])
      : [];
  const list = listRaw.map((x) =>
    normalizeMessage(x as Record<string, unknown>),
  );
  const pagination =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? (raw.pagination as Record<string, number> | undefined)
      : undefined;
  return {
    list,
    pages: pagination?.pages ?? 1,
    total: pagination?.total ?? list.length,
  };
}

export function AddMessageModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (p: { title: string; content: string }) => Promise<void>;
}) {
  const [phase, setPhase] = useState<Phase>("closed");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setPhase("open"));
    return () => cancelAnimationFrame(id);
  }, []);

  const close = () => {
    if (phase === "closing" || saving) return;
    setPhase("closing");
    setTimeout(onClose, 220);
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    try {
      await onSubmit({ title: title.trim(), content: content.trim() });
      close();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={overlayStyle[phase]}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
        style={{ ...modalStyle[phase], willChange: "transform, opacity" }}
      >
        <div className="flex justify-between items-center">
          <h3 className="text-base font-medium text-gray-800">رسالة جديدة</h3>
          <button
            type="button"
            onClick={close}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
        <input
          placeholder="العنوان (title) *"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-400 transition-colors"
        />
        <textarea
          placeholder="المحتوى (content) *"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-400 transition-colors resize-y min-h-[140px]"
        />
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={close}
            disabled={saving}
            className="text-sm px-4 py-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="text-sm px-5 py-2.5 rounded-xl text-white hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
            style={{ background: "var(--primary)" }}
          >
            {saving ? "جاري الإرسال…" : "إرسال"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function EditMessageModal({
  initial,
  onClose,
  onSubmit,
}: {
  initial: Message;
  onClose: () => void;
  onSubmit: (p: { title: string; content: string }) => Promise<void>;
}) {
  const [phase, setPhase] = useState<Phase>("closed");
  const [title, setTitle] = useState(initial.title);
  const [content, setContent] = useState(initial.content);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setPhase("open"));
    return () => cancelAnimationFrame(id);
  }, []);

  const close = () => {
    if (phase === "closing" || saving) return;
    setPhase("closing");
    setTimeout(onClose, 220);
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    try {
      await onSubmit({ title: title.trim(), content: content.trim() });
      close();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[60] p-4"
      style={overlayStyle[phase]}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
        style={{ ...modalStyle[phase], willChange: "transform, opacity" }}
      >
        <div className="flex justify-between items-center">
          <h3 className="text-base font-medium text-gray-800">تعديل الرسالة</h3>
          <button
            type="button"
            onClick={close}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
        <input
          placeholder="العنوان *"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-400 transition-colors"
        />
        <textarea
          placeholder="المحتوى *"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-400 transition-colors resize-y min-h-[140px]"
        />
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={close}
            disabled={saving}
            className="text-sm px-4 py-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 cursor-pointer disabled:opacity-50"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="text-sm px-5 py-2.5 rounded-xl text-white hover:opacity-90 cursor-pointer disabled:opacity-50"
            style={{ background: "var(--primary)" }}
          >
            {saving ? "جاري الحفظ…" : "حفظ"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ViewMessageModal({
  msg,
  onClose,
  onEdit,
  onDelete,
}: {
  msg: Message;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => Promise<boolean>;
}) {
  const [phase, setPhase] = useState<Phase>("closed");

  useEffect(() => {
    const id = requestAnimationFrame(() => setPhase("open"));
    return () => cancelAnimationFrame(id);
  }, []);

  const close = () => {
    if (phase === "closing") return;
    setPhase("closing");
    setTimeout(onClose, 220);
  };

  const dateLabel = msg.createdAt
    ? new Date(msg.createdAt).toLocaleString("ar-EG", {
        dateStyle: "short",
        timeStyle: "short",
      })
    : "—";

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={overlayStyle[phase]}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl flex flex-col gap-4"
        style={{ ...modalStyle[phase], willChange: "transform, opacity" }}
      >
        <div className="flex justify-between items-start gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "var(--primary-light)" }}
            >
              <Mail size={18} style={{ color: "var(--primary)" }} />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-medium text-gray-800 truncate">
                {msg.title || "بدون عنوان"}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">{dateLabel}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={close}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 shrink-0 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-2">المحتوى (content)</p>
          <div className="text-sm text-gray-700 whitespace-pre-wrap max-h-64 overflow-y-auto border border-gray-100 rounded-xl px-4 py-3 bg-white">
            {msg.content || "—"}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 justify-between items-center pt-1">
          <button
            type="button"
            onClick={async () => {
              const deleted = await onDelete();
              if (deleted) close();
            }}
            className="flex items-center gap-1.5 text-sm px-4 py-2.5 rounded-xl border border-red-100 text-red-500 hover:bg-red-50 cursor-pointer"
          >
            <Trash2 size={15} /> حذف
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={close}
              className="text-sm px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 cursor-pointer"
            >
              إغلاق
            </button>
            <button
              type="button"
              onClick={() => {
                onEdit();
                close();
              }}
              className="flex items-center gap-1.5 text-sm px-4 py-2.5 rounded-xl text-white hover:opacity-90 cursor-pointer"
              style={{ background: "var(--primary)" }}
            >
              <Pencil size={15} /> تعديل
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
