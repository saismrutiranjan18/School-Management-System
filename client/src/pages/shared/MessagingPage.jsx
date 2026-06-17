import { useState, useEffect, useRef, useCallback } from 'react'
import { useSelector }   from 'react-redux'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchConversations, fetchThread,
  sendMessage, fetchContacts,
} from '../../api/messages.api'
import { useSocket } from '../../context/SocketContext'

/* ── SVG helper ── */
const Icon = ({ d, size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
    strokeLinejoin="round" aria-hidden="true"
    className={className} style={{ flexShrink: 0 }}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
)

const ICONS = {
  chat:     ['M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'],
  send:     ['M22 2 11 13','M22 2 15 22 11 13 2 9l20-7z'],
  plus:     ['M12 5v14','M5 12h14'],
  search:   ['M21 21l-4.35-4.35','M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z'],
  close:    ['M18 6 6 18','M6 6l12 12'],
  wave:     ['M7.76 2.24a6 6 0 1 1 8.48 8.48L12 15l-4.24-4.28a6 6 0 0 1 0-8.48z','M12 15v7'],
  user:     ['M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2','M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'],
  newMsg:   ['M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z','M12 8v4','M12 16h.01'],
  inbox:    ['M22 12h-4l-3 9L9 3l-3 9H2'],
}

const ROLE_COLORS = {
  admin:   'bg-purple-100 text-purple-700',
  teacher: 'bg-blue-100   text-blue-700',
  student: 'bg-green-100  text-green-700',
  parent:  'bg-orange-100 text-orange-700',
}

function timeLabel(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now  = new Date()
  const diff = now - date
  const mins = Math.floor(diff / 60000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  if (diff < 86400000)
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}

/* ────────────────────────────────────────────────────────────
   Conversation List
──────────────────────────────────────────────────────────── */
function ConversationList({ selectedId, onSelect, onNewChat }) {
  const { user } = useSelector(state => state.auth)
  const [search, setSearch] = useState('')

  const { data: conversations = [], isLoading } = useQuery({
    queryKey:    ['conversations'],
    queryFn:     fetchConversations,
    refetchInterval: 10000,
  })

  const filtered = conversations.filter(c =>
    c.other_user_name.toLowerCase().includes(search.toLowerCase())
  )

  const totalUnread = conversations.reduce(
    (sum, c) => sum + parseInt(c.unread_count || 0), 0
  )

  return (
    <div className="w-72 shrink-0 border-r border-gray-200 flex flex-col h-full">

      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-gray-800">Messages</h2>
            {totalUnread > 0 && (
              <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs
                               rounded-full font-medium">
                {totalUnread}
              </span>
            )}
          </div>
          <button
            onClick={onNewChat}
            className="w-7 h-7 bg-blue-600 text-white rounded-lg flex items-center
                       justify-center hover:bg-blue-700 transition-colors"
            title="New message"
          >
            <Icon d={ICONS.plus} size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Icon d={ICONS.search} size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search conversations…"
            className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg
                       text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <p className="text-xs text-gray-400 text-center py-8">Loading…</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="flex justify-center mb-2 text-gray-300">
              <Icon d={ICONS.inbox} size={36} />
            </div>
            <p className="text-xs text-gray-400">No conversations yet</p>
            <button
              onClick={onNewChat}
              className="mt-2 text-xs text-blue-500 hover:underline"
            >
              Start a conversation
            </button>
          </div>
        ) : (
          filtered.map(conv => {
            const isSelected = selectedId === conv.other_user_id
            const unread     = parseInt(conv.unread_count || 0)
            const isMine     = parseInt(conv.last_sender_id) === user?.id

            return (
              <button
                key={conv.other_user_id}
                onClick={() => onSelect(conv.other_user_id, conv.other_user_name, conv.other_user_role)}
                className={`w-full text-left px-4 py-3 border-b border-gray-50 transition-all
                  ${isSelected
                    ? 'bg-blue-50 border-l-2 border-l-blue-500'
                    : 'hover:bg-gray-50'}`}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center
                                   text-sm font-bold shrink-0
                                   ${ROLE_COLORS[conv.other_user_role]}`}>
                    {conv.other_user_name?.[0]?.toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className={`text-xs font-semibold truncate
                        ${isSelected ? 'text-blue-700' : 'text-gray-800'}`}>
                        {conv.other_user_name}
                      </p>
                      <span className="text-xs text-gray-400 shrink-0 ml-1">
                        {timeLabel(conv.last_message_at)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <p className={`text-xs truncate
                        ${unread > 0 ? 'font-medium text-gray-800' : 'text-gray-500'}`}>
                        {isMine ? 'You: ' : ''}{conv.last_message}
                      </p>
                      {unread > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 bg-blue-600 text-white
                                         text-xs rounded-full font-medium shrink-0">
                          {unread}
                        </span>
                      )}
                    </div>

                    <span className={`text-xs px-1.5 py-0.5 rounded-full capitalize
                                      mt-1 inline-block ${ROLE_COLORS[conv.other_user_role]}`}>
                      {conv.other_user_role}
                    </span>
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────
   New Chat Modal
──────────────────────────────────────────────────────────── */
function NewChatModal({ onClose, onSelect }) {
  const [search, setSearch] = useState('')

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn:  fetchContacts,
  })

  const filtered = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">

        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-800">New Message</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600
                       hover:bg-gray-100 transition-colors"
          >
            <Icon d={ICONS.close} size={18} />
          </button>
        </div>

        <div className="px-4 py-3">
          <div className="relative">
            <Icon d={ICONS.search} size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search contacts…"
              autoFocus
              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="max-h-72 overflow-y-auto px-2 pb-3">
          {isLoading ? (
            <p className="text-xs text-gray-400 text-center py-6">Loading contacts…</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-6">
              <div className="flex justify-center mb-2 text-gray-300">
                <Icon d={ICONS.user} size={28} />
              </div>
              <p className="text-xs text-gray-400">No contacts found.</p>
            </div>
          ) : (
            filtered.map(contact => (
              <button
                key={contact.id}
                onClick={() => { onSelect(contact.id, contact.name, contact.role); onClose() }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                           hover:bg-gray-50 text-left transition-colors"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center
                                 text-sm font-bold ${ROLE_COLORS[contact.role]}`}>
                  {contact.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{contact.name}</p>
                  <p className={`text-xs px-1.5 py-0.5 rounded-full inline-block
                                 capitalize ${ROLE_COLORS[contact.role]}`}>
                    {contact.role}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────
   Message Thread
──────────────────────────────────────────────────────────── */
function MessageThread({ otherUserId, otherUserName, otherUserRole }) {
  const qc              = useQueryClient()
  const { user }        = useSelector(state => state.auth)
  const { socket }      = useSocket()
  const [input, setInput]           = useState('')
  const [isTyping, setIsTyping]     = useState(false)
  const [theyTyping, setTheyTyping] = useState(false)
  const bottomRef   = useRef(null)
  const typingTimer = useRef(null)

  const { data, isLoading } = useQuery({
    queryKey: ['thread', otherUserId],
    queryFn:  () => fetchThread(otherUserId),
    enabled:  !!otherUserId,
    refetchInterval: 8000,
  })

  const messages = data?.messages || []

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  useEffect(() => {
    if (!socket || !otherUserId) return

    socket.emit('join_conversation', { other_user_id: otherUserId })

    const handleNewMessage = (msg) => {
      if (
        (msg.sender_id === otherUserId   && msg.receiver_id === user?.id) ||
        (msg.sender_id === user?.id      && msg.receiver_id === otherUserId)
      ) {
        qc.invalidateQueries({ queryKey: ['thread', otherUserId] })
        qc.invalidateQueries({ queryKey: ['conversations'] })
      }
    }

    const handleTyping = ({ from_user_id }) => {
      if (from_user_id === otherUserId) {
        setTheyTyping(true)
        setTimeout(() => setTheyTyping(false), 3000)
      }
    }

    socket.on('new_message',      handleNewMessage)
    socket.on('user_typing',      handleTyping)
    socket.on('user_stop_typing', ({ from_user_id }) => {
      if (from_user_id === otherUserId) setTheyTyping(false)
    })

    return () => {
      socket.off('new_message',      handleNewMessage)
      socket.off('user_typing',      handleTyping)
      socket.off('user_stop_typing')
      socket.emit('leave_conversation', { other_user_id: otherUserId })
    }
  }, [socket, otherUserId, user?.id, qc])

  const mutation = useMutation({
    mutationFn: sendMessage,
    onSuccess: () => {
      setInput('')
      qc.invalidateQueries({ queryKey: ['thread', otherUserId] })
      qc.invalidateQueries({ queryKey: ['conversations'] })
    },
  })

  const handleSend = () => {
    if (!input.trim()) return
    mutation.mutate({ receiver_id: otherUserId, content: input.trim() })
    if (socket) socket.emit('stop_typing', { to_user_id: otherUserId })
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInputChange = (e) => {
    setInput(e.target.value)
    if (!socket) return
    if (!isTyping) {
      setIsTyping(true)
      socket.emit('typing', { to_user_id: otherUserId })
    }
    clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => {
      setIsTyping(false)
      socket.emit('stop_typing', { to_user_id: otherUserId })
    }, 2000)
  }

  /* group messages by date */
  const grouped = messages.reduce((acc, msg) => {
    const day = new Date(msg.sent_at).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'long', year: 'numeric',
    })
    if (!acc[day]) acc[day] = []
    acc[day].push(msg)
    return acc
  }, {})

  return (
    <div className="flex-1 flex flex-col h-full">

      {/* Thread header */}
      <div className="px-5 py-3 border-b border-gray-200 bg-white flex items-center gap-3">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center
                         font-bold text-sm ${ROLE_COLORS[otherUserRole]}`}>
          {otherUserName?.[0]?.toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800">{otherUserName}</p>
          <span className={`text-xs px-1.5 py-0.5 rounded-full capitalize
                            ${ROLE_COLORS[otherUserRole]}`}>
            {otherUserRole}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {isLoading ? (
          <p className="text-xs text-gray-400 text-center py-8">Loading messages…</p>
        ) : messages.length === 0 ? (
          <div className="text-center py-16">
            <div className="flex justify-center mb-3 text-gray-300">
              <Icon d={ICONS.wave} size={40} />
            </div>
            <p className="text-sm text-gray-400">
              Say hello to {otherUserName}!
            </p>
          </div>
        ) : (
          Object.entries(grouped).map(([day, msgs]) => (
            <div key={day}>
              {/* Date separator */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400 font-medium">{day}</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {msgs.map((msg, i) => {
                const isMine   = msg.sender_id === user?.id
                const showTime = i === msgs.length - 1 ||
                  new Date(msgs[i+1]?.sent_at) - new Date(msg.sent_at) > 300000

                return (
                  <div key={msg.id}
                    className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-1`}>
                    <div className="max-w-xs lg:max-w-md">
                      <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed
                        ${isMine
                          ? 'bg-blue-600 text-white rounded-br-sm'
                          : 'bg-gray-100 text-gray-800 rounded-bl-sm'}`}>
                        {msg.content}
                      </div>

                      {showTime && (
                        <div className={`flex items-center gap-1 mt-0.5
                                         ${isMine ? 'justify-end' : ''}`}>
                          <span className="text-xs text-gray-400">
                            {new Date(msg.sent_at).toLocaleTimeString('en-IN', {
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </span>
                          {isMine && (
                            <span className="text-xs text-gray-400">
                              {msg.read_at ? '✓✓' : '✓'}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ))
        )}

        {/* Typing indicator */}
        {theyTyping && (
          <div className="flex justify-start mb-1">
            <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-2.5">
              <div className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-gray-200 bg-white">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${otherUserName}…`}
            rows={1}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-2xl text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none max-h-32"
            style={{ height: 'auto' }}
            onInput={e => {
              e.target.style.height = 'auto'
              e.target.style.height = e.target.scrollHeight + 'px'
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || mutation.isPending}
            className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center
                       justify-center hover:bg-blue-700 disabled:opacity-40
                       transition-colors shrink-0"
          >
            <Icon d={ICONS.send} size={16} />
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1.5 ml-1">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────
   Main Page
──────────────────────────────────────────────────────────── */
export default function MessagingPage() {
  const [selected,    setSelected]    = useState(null)
  const [showNewChat, setShowNewChat] = useState(false)

  const handleSelectConversation = (id, name, role) => {
    setSelected({ id, name, role })
  }

  return (
    <div className="flex h-[calc(100vh-56px)] bg-white">

      <ConversationList
        selectedId={selected?.id}
        onSelect={handleSelectConversation}
        onNewChat={() => setShowNewChat(true)}
      />

      {selected ? (
        <MessageThread
          otherUserId={selected.id}
          otherUserName={selected.name}
          otherUserRole={selected.role}
        />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center
                        text-gray-400 bg-gray-50">
          <div className="mb-4 text-gray-300">
            <Icon d={ICONS.chat} size={52} />
          </div>
          <p className="text-sm font-medium text-gray-600">
            Select a conversation
          </p>
          <p className="text-xs text-gray-400 mt-1">or start a new one</p>
          <button
            onClick={() => setShowNewChat(true)}
            className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white
                       text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Icon d={ICONS.plus} size={16} />
            New Message
          </button>
        </div>
      )}

      {showNewChat && (
        <NewChatModal
          onClose={() => setShowNewChat(false)}
          onSelect={handleSelectConversation}
        />
      )}
    </div>
  )
}