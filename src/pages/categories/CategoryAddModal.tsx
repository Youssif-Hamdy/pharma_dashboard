import { useEffect, useState, type CSSProperties } from "react";
import { X } from "lucide-react";

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
    transition: "background-color 210ms cubic-bezier(0.4,0,1,1)",
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
      "opacity 210ms cubic-bezier(0.4,0,1,1), transform 210ms cubic-bezier(0.4,0,1,1)",
  },
};

export default function CategoryAddModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (name: string) => void;
}) {
  const [phase, setPhase] = useState<Phase>("closed");
  const [name, setName] = useState("");

  useEffect(() => {
    const id = requestAnimationFrame(() => setPhase("open"));
    return () => cancelAnimationFrame(id);
  }, []);

  const close = () => {
    if (phase === "closing") return;
    setPhase("closing");
    setTimeout(onClose, 220);
  };

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd(name);
    close();
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
        className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl flex flex-col gap-4"
        style={{ ...modalStyle[phase], willChange: "transform, opacity" }}
      >
        <div className="flex justify-between items-center">
          <h3 className="text-base font-medium text-gray-800">إضافة فئة جديدة</h3>
          <button
            type="button"
            onClick={close}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
        <input
          placeholder="اسم الفئة"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-400 transition-colors"
        />
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={close}
            className="text-sm px-4 py-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleAdd}
            className="text-sm px-5 py-2.5 rounded-xl text-white hover:opacity-90 transition-opacity cursor-pointer"
            style={{ background: "var(--primary)" }}
          >
            إضافة
          </button>
        </div>
      </div>
    </div>
  );
}
