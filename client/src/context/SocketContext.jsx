import {
  createContext, useContext,
  useEffect, useRef, useState,
} from 'react'
import { io }            from 'socket.io-client'
import { useSelector }   from 'react-redux'

const SocketContext = createContext(null)

export const SocketProvider = ({ children }) => {
  const { token, user }  = useSelector(state => state.auth)
  const socketRef        = useRef(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    // Only connect if logged in
    if (!token || !user) {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
        setConnected(false)
      }
      return
    }

    // Don't reconnect if already connected
    if (socketRef.current?.connected) return

    const socket = io('http://localhost:5000', {
      auth:        { token },
      transports:  ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay:    2000,
    })

    socket.on('connect', () => {
      console.log('🔌 Socket connected:', socket.id)
      setConnected(true)
    })

    socket.on('disconnect', () => {
      console.log('🔌 Socket disconnected')
      setConnected(false)
    })

    socket.on('connect_error', (err) => {
      console.error('Socket connect error:', err.message)
      setConnected(false)
    })

    socketRef.current = socket

    return () => {
      socket.disconnect()
      socketRef.current = null
      setConnected(false)
    }
  }, [token, user])

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected }}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => useContext(SocketContext)