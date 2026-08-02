import { Bell, Menu, ClipboardList} from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useSidebar } from '../context/SidebarContext'
import { useNotifications } from './NotificationContext'
import { getStoredUser } from '../api/authStorage'

const eventIcon = () => <ClipboardList size={14} />

const eventColor = (event: string) => {
  if (event.includes('created')) return 'text-emerald-500 bg-emerald-50 border-emerald-100'
  if (event.includes('updated')) return 'text-blue-500 bg-blue-50 border-blue-100'
  return 'text-red-500 bg-red-50 border-red-100'
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
    <div className="sticky top-0 z-40 w-full px-5 sm:px-8 py-3 bg-white/90 backdrop-blur-xl border-b border-gray-100 shadow-sm transition-all duration-300">
      <div className="flex items-center justify-between">
        
        {/* Title and Date */}
        <div className="flex items-center gap-4">
          {sidebar && (
            <button
              type="button"
              onClick={sidebar.openMobileSidebar}
              className="md:hidden w-10 h-10 rounded-2xl border border-gray-100 bg-white shadow-sm flex items-center justify-center text-gray-600 hover:text-[var(--primary)] hover:border-[var(--primary)] hover:shadow-md transition-all active:scale-95"
            >
              <Menu size={18} />
            </button>
          )}
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-800 tracking-tight">{title}</h2>
            <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5 font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse"></span>
              {new Date().toLocaleDateString('ar-EG', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
              })}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          
          {/* Notification Button */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setOpen(o => !o)}
              className="relative w-10 h-10 rounded-2xl border border-gray-100 bg-white shadow-sm flex items-center justify-center text-gray-500 hover:text-[var(--primary)] hover:border-[var(--primary)] hover:shadow-md transition-all active:scale-95 group"
            >
              <Bell size={18} className="group-hover:animate-[wiggle_1s_ease-in-out_infinite]" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-xl bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-sm animate-bounce">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Dropdown with animation */}
            {open && (
              <div 
                className="absolute left-0 top-12 w-80 sm:w-96 bg-white/95 backdrop-blur-xl rounded-3xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] border border-white z-50 overflow-hidden origin-top-left animate-[toast-animate-in_0.3s_cubic-bezier(0.22,1,0.36,1)]"
                style={{ direction: 'rtl' }}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50/50 bg-gradient-to-r from-gray-50/50 to-transparent">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-gray-800">الإشعارات</span>
                    <span className="px-2 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-[10px] font-bold">
                      {unreadCount} جديد
                    </span>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs text-[var(--primary)] hover:text-[var(--gold)] font-bold transition-colors"
                    >
                      تحديد الكل كمقروء
                    </button>
                  )}
                </div>

                {/* List */}
                <div className="max-h-[340px] overflow-y-auto p-2 space-y-1">
                  {notifications.length === 0 ? (
                    <div className="py-12 text-center flex flex-col items-center">
                      <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4 shadow-inner">
                        <Bell size={28} className="text-gray-300 animate-pulse" />
                      </div>
                      <p className="text-sm font-bold text-gray-600">لا توجد إشعارات حالياً</p>
                      <p className="text-[11px] text-gray-400 mt-1">ستظهر هنا كل التحديثات الهامة الخاصة بالنظام</p>
                    </div>
                  ) : notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => markRead(n.id)}
                      className={`flex gap-3 px-3 py-3 rounded-2xl cursor-pointer transition-all duration-200 ${
                        !n.read 
                          ? 'bg-blue-50/50 hover:bg-blue-50 border border-blue-100/50' 
                          : 'hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      <div className={`mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${eventColor(n.event)} shadow-sm`}>
                        {eventIcon()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm leading-snug truncate ${!n.read ? 'font-bold text-gray-800' : 'font-medium text-gray-600'}`}>
                          {n.message}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-1 font-medium flex items-center gap-1">
                          {timeAgo(n.time)}
                        </p>
                      </div>
                      {!n.read && (
                        <div className="w-2.5 h-2.5 rounded-full bg-[var(--primary)] mt-1.5 flex-shrink-0 shadow-[0_0_8px_rgba(26,92,58,0.5)]" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Avatar */}
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-sm text-[var(--gold)] font-bold border border-[var(--gold)]/20 shadow-sm relative overflow-hidden group cursor-pointer"
            style={{ background: 'linear-gradient(135deg, var(--primary), #114228)' }}
          >
            <div className="absolute inset-0 bg-white/20 group-hover:opacity-0 transition-opacity"></div>
            <span className="relative z-10">{getUserInitial()}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Navbar