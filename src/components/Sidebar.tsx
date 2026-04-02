import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Package, Tag,
  Building2, LogOut, ChevronRight, X, Mail,
} from "lucide-react";
import logo from "../assets/logo.jpg.jpeg";
import type { StoredUser } from "../api/authStorage";

function avatarInitial(email: string): string {
  const localPart = email.split("@")[0]?.trim() ?? "";
  if (!localPart) return "?";
  const first = [...localPart][0] ?? "?";
  return /[a-z]/i.test(first) ? first.toUpperCase() : first;
}

const links = [
  { path: "/",           label: "الرئيسية", icon: LayoutDashboard },
  { path: "/products",   label: "المنتجات", icon: Package },
  { path: "/categories", label: "الفئات",   icon: Tag },
  { path: "/brands",     label: "الماركات", icon: Building2 },
  { path: "/messages",   label: "الرسائل",  icon: Mail },
];

interface SidebarProps {
  isMobile?: boolean;
  onCloseMobile?: () => void;
  user?: StoredUser | null;
}

function Sidebar({ isMobile, onCloseMobile, user }: SidebarProps) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  // ✅ Mobile — بيعرض نفسه بس، الأنيميشن في App.tsx
  if (isMobile) {
    return (
      <div className="relative h-full bg-white border-l border-gray-100 flex flex-col p-4 gap-1 shadow-xl w-80 max-w-xs">
        <button
          type="button"
          onClick={onCloseMobile}
          className="absolute top-4 left-4 w-8 h-8 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-500 shadow-sm hover:bg-gray-50 transition-colors"
        >
          <X size={16} />
        </button>
        <SidebarContent
          collapsed={false}
          isMobile={true}
          location={location}
          onClose={onCloseMobile}
          user={user}
        />
      </div>
    );
  }

  // ✅ Desktop — collapse عادي
  return (
    <div
      className={`relative h-full bg-white border-l border-gray-100 flex flex-col p-4 gap-1 shadow-sm transition-all duration-300 ${
        collapsed ? "w-20 items-center" : "w-64"
      }`}
    >
      <button
        type="button"
        onClick={() => setCollapsed(v => !v)}
        className="absolute -left-3 top-16 w-6 h-6 rounded-full border border-gray-200 bg-white flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors z-10"
      >
        <ChevronRight
          size={14}
          className={`text-gray-500 transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`}
        />
      </button>
      <SidebarContent
        collapsed={collapsed}
        isMobile={false}
        location={location}
        onClose={undefined}
        user={user}
      />
    </div>
  );
}

function SidebarContent({
  collapsed, isMobile, location, onClose, user,
}: {
  collapsed: boolean;
  isMobile: boolean;
  location: ReturnType<typeof useLocation>;
  onClose?: () => void;
  user?: StoredUser | null;
}) {
  const displayEmail = user?.email ?? "—";
  const initial = user?.email ? avatarInitial(user.email) : "؟";

  return (
    <>
      <div className={`flex flex-col items-center gap-2 py-5 mb-2 border-b border-gray-100`}>
        <img
          src={logo}
          alt="الفِرمشية"
          className={`object-contain transition-all duration-300 ${collapsed ? "h-12" : "h-20"}`}
        />
        {!collapsed && (
          <span className="text-xs text-gray-400 bg-gray-50 px-3 py-0.5 rounded-full">
            لوحة التحكم
          </span>
        )}
      </div>

      <nav className="flex flex-col gap-1 flex-1 w-full">
        {links.map(({ path, label, icon: Icon }) => {
          const active = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                active
                  ? "font-medium shadow-sm"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              } ${collapsed && !isMobile ? "justify-center !px-0" : ""}`}
              style={active ? { background: "var(--primary-light)", color: "var(--primary)" } : {}}
            >
              <Icon size={18} />
              {(!collapsed || isMobile) && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-100 pt-3 w-full">
        <div
          className={`flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 ${
            collapsed && !isMobile ? "justify-center !px-0" : ""
          }`}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs text-white font-medium shrink-0"
            style={{ background: "var(--primary)" }}
          >
            {initial}
          </div>
          {(!collapsed || isMobile) && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-700">الأدمن</p>
                <p className="text-xs text-gray-400 truncate">{displayEmail}</p>
              </div>
              <LogOut size={15} className="text-gray-400 shrink-0" />
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default Sidebar;