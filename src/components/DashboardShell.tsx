import { useState, useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import { fetchMe } from '../api/auth'
import { getStoredToken, getStoredUser, type StoredUser } from '../api/authStorage'

type Props = {
  mobileOpen: boolean
  onCloseMobile: () => void
}

function DashboardShell({ mobileOpen, onCloseMobile }: Props) {
  const location = useLocation()
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  const [user, setUser] = useState<StoredUser | null>(() => getStoredUser())

  useEffect(() => {
    if (!getStoredToken() || getStoredUser()) return
    fetchMe()
      .then(d => setUser({ id: d.user.id, email: d.user.email }))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (mobileOpen) {
      setMounted(true)
      const id = setTimeout(() => setVisible(true), 10)
      return () => clearTimeout(id)
    }
    setVisible(false)
    const id = setTimeout(() => setMounted(false), 300)
    return () => clearTimeout(id)
  }, [mobileOpen])

  if (!getStoredToken()) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <div className="hidden md:block shrink-0">
        <Sidebar user={user} />
      </div>

      <main className="flex-1 h-full overflow-auto p-6 min-w-0 flex">
        <div className="flex-1 min-h-full flex flex-col [&>*]:min-h-full">
          <Outlet />
        </div>
      </main>

      {mounted && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          style={{
            backgroundColor: visible ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0)',
            transition: 'background-color 300ms ease-in-out',
          }}
          onClick={onCloseMobile}
        >
          <div
            className="absolute top-0 right-0 h-full"
            style={{
              transform: visible ? 'translateX(0%)' : 'translateX(100%)',
              transition: 'transform 300ms cubic-bezier(0.4,0,0.2,1)',
              willChange: 'transform',
            }}
            onClick={e => e.stopPropagation()}
          >
            <Sidebar user={user} isMobile onCloseMobile={onCloseMobile} />
          </div>
        </div>
      )}
    </div>
  )
}

export default DashboardShell
