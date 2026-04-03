import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import Pusher from 'pusher-js'

interface Notification {
  id: string
  message: string
  event: string
  time: Date
  read: boolean
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  markAllRead: () => void
  markRead: (id: string) => void
}

const NotificationContext = createContext<NotificationContextType | null>(null)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    const pusher = new Pusher('2c74e166168870fe943d', {
      cluster: 'eu',
      forceTLS: true,
      enabledTransports: ['ws', 'wss'],
      disableStats: true,
      wsHost: 'ws-eu.pusher.com',
      wsPort: 443,
      wssPort: 443,
    })

    pusher.connection.bind('connected', () => {
      console.log('✅ Pusher connected successfully!')
    })

    pusher.connection.bind('error', (err: any) => {
      console.error('❌ Pusher error:', err)
    })

    pusher.connection.bind('failed', () => {
      console.error('❌ Pusher connection failed')
    })

    const channel = pusher.subscribe('pharma-channel')

    const events = ['order-created', 'order-updated', 'order-deleted']

    events.forEach(event => {
      channel.bind(event, (data: any) => {
        console.log(`📢 Event received: ${event}`, data)
        setNotifications(prev => [{
          id: crypto.randomUUID(),
          message: data.message,
          event,
          time: new Date(),
          read: false,
        }, ...prev].slice(0, 50))
      })
    })

    return () => {
      pusher.unsubscribe('pharma-channel')
      pusher.disconnect()
    }
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  const markAllRead = () =>
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))

  const markRead = (id: string) =>
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAllRead, markRead }}>
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be inside NotificationProvider')
  return ctx
}