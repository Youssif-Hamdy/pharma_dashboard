// Navbar.tsx
import { Bell, Menu, Package, Tag, Grid } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useSidebar } from '../context/SidebarContext'
import { useNotifications } from './NotificationContext'
import { getStoredUser } from '../api/authStorage'

const eventIcon = (event: string) => {
  if (event.startsWith('product')) return <Package size={14} />
  if (event.startsWith('brand')) return <Tag size={14} />
  return <Grid size={14} />
}

const eventColor = (event: string) => {
  if (event.includes('created')) return 'text-emerald-500 bg-emerald-50'
  if (event.includes('updated')) return 'text-blue-500 bg-blue-50'
  return 'text-red-500 bg-red-50'
}

const timeAgo = (date: Date) => {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000)
  if (diff < 60) return 'الآن'
  if (diff < 3600) return `منذ ${Math.floor(diff / 60)} د`
  return `منذ ${Math.floor(diff / 3600)} س`
}

interface Props { title: string }

const getUserInitial = () => {
  const user = getStoredUser()
  const source = (user?.name?.trim() || user?.email?.split('@')[0]?.trim() || '').toUpperCase()
  return source.charAt(0) || '؟'
}

function Navbar({ title }: Props) {
  const sidebar = useSidebar()
  const { notifications, unreadCount, markAllRead, markRead } = useNotifications()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div>
          <h2 className="text-xl font-medium text-gray-800">{title}</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {new Date().toLocaleDateString('ar-EG', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            })}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {sidebar && (
          <button
            type="button"
            onClick={sidebar.openMobileSidebar}
            className="md:hidden w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50"
          >
            <Menu size={18} />
          </button>
        )}

        {/* Bell Button */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen(o => !o)}
            className="relative w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown */}
          {open && (
            <div className="absolute left-0 top-11 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden"
              style={{ direction: 'rtl' }}>
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <span className="text-sm font-semibold text-gray-800">الإشعارات</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-blue-500 hover:text-blue-600 font-medium"
                  >
                    تحديد الكل كمقروء
                  </button>
                )}
              </div>

              {/* List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                {notifications.length === 0 ? (
                  <div className="py-10 text-center">
                    <Bell size={28} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-sm text-gray-400">لا توجد إشعارات</p>
                  </div>
                ) : notifications.map(n => (
                  <div
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    className={`flex gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${!n.read ? 'bg-blue-50/40' : ''}`}
                  >
                    <div className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${eventColor(n.event)}`}>
                      {eventIcon(n.event)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 leading-snug">{n.message}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{timeAgo(n.time)}</p>
                    </div>
                    {!n.read && (
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs text-white font-medium"
          style={{ background: 'var(--primary)' }}
        >
          {getUserInitial()}
        </div>
      </div>
    </div>
  )
}

export default Navbar