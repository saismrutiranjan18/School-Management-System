import { useState, useEffect, useCallback } from 'react'
import { useSocket }                         from '../context/SocketContext'

const MAX_NOTIFICATIONS = 50

export const useNotifications = () => {
  const { socket }  = useSocket()
  const [notifications, setNotifications] = useState(() => {
    // Persist across page refreshes in sessionStorage
    try {
      const stored = sessionStorage.getItem('sms_notifications')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  const [unreadCount, setUnreadCount] = useState(() => {
    try {
      return parseInt(sessionStorage.getItem('sms_unread') || '0')
    } catch {
      return 0
    }
  })

  // Listen for incoming notifications
  useEffect(() => {
    if (!socket) return

    const handleNotification = (payload) => {
      const notif = {
        ...payload,
        _id:    Date.now() + Math.random(),  // local unique key
        read:   false,
      }

      setNotifications(prev => {
        const updated = [notif, ...prev].slice(0, MAX_NOTIFICATIONS)
        sessionStorage.setItem('sms_notifications', JSON.stringify(updated))
        return updated
      })

      setUnreadCount(prev => {
        const next = prev + 1
        sessionStorage.setItem('sms_unread', String(next))
        return next
      })
    }

    socket.on('notification', handleNotification)
    return () => socket.off('notification', handleNotification)
  }, [socket])

  // Mark all as read
  const markAllRead = useCallback(() => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }))
      sessionStorage.setItem('sms_notifications', JSON.stringify(updated))
      return updated
    })
    setUnreadCount(0)
    sessionStorage.setItem('sms_unread', '0')
  }, [])

  // Mark one as read
  const markRead = useCallback((id) => {
    setNotifications(prev => {
      const updated = prev.map(n => n._id === id ? { ...n, read: true } : n)
      sessionStorage.setItem('sms_notifications', JSON.stringify(updated))
      return updated
    })
    setUnreadCount(prev => Math.max(0, prev - 1))
  }, [])

  // Clear all
  const clearAll = useCallback(() => {
    setNotifications([])
    setUnreadCount(0)
    sessionStorage.removeItem('sms_notifications')
    sessionStorage.setItem('sms_unread', '0')
  }, [])

  return {
    notifications,
    unreadCount,
    markAllRead,
    markRead,
    clearAll,
  }
}