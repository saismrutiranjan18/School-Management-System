import { useState, useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchConversations, fetchThread,
  sendMessage, fetchContacts,
} from '../../api/messages.api'
import { useSocket } from '../../context/SocketContext'
import DashboardLayout from '../../components/DashboardLayout'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { Input, Textarea } from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import {
  Search, Send, MessageSquare, User, Clock, Check, CheckCheck,
  Inbox, Sparkles, Plus, AlertCircle,
} from 'lucide-react'

const ROLE_VARIANTS = {
  admin: 'purple',
  teacher: 'info',
  student: 'success',
  parent: 'warning',
}

function timeLabel(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now - date
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (diff < 86400000) {
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  }
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}

/* ── Conversation List ── */
function ConversationList({ selectedId, onSelect, onNewChat }) {
  const { user } = useSelector(state => state.auth)
  const [search, setSearch] = useState('')

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: fetchConversations,
    refetchInterval: 10000,
  })

  const filtered = conversations.filter(c =>
    c.other_user_name.toLowerCase().includes(search.toLowerCase())
  )

  const totalUnread = conversations.reduce(
    (sum, c) => sum + parseInt(c.unread_count || 0), 0
  )

  return (
    <Card padding="none" className="w-80 shrink-0 flex flex-col h-[calc(100vh-140px)] border border-slate-200 dark:border-slate-800 rounded-r-none rounded-[20px] overflow-hidden bg-white dark:bg-slate-900 shadow-sm z-10">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100 font-display">Inbox</span>
            {totalUnread > 0 && <Badge variant="danger">{totalUnread} new</Badge>}
          </div>
          <Button size="xs" variant="outline" onClick={onNewChat} className="p-1 rounded-lg">
            <Plus size={16} />
          </Button>
        </div>

        {/* Search */}
        <Input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search chats…" leftIcon={<Search size={14} />} />
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/50">
        {isLoading ? (
          <p className="text-xs text-slate-400 text-center py-12 animate-pulse">Loading inbox…</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Inbox size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-2 opacity-55" />
            <p className="text-xs text-slate-400 dark:text-slate-500">No chats found</p>
            <button onClick={onNewChat} className="mt-2 text-xs text-primary-500 hover:underline">Start a conversation</button>
          </div>
        ) : (
          filtered.map(conv => {
            const isSelected = selectedId === conv.other_user_id
            const unread = parseInt(conv.unread_count || 0)
            const isMine = parseInt(conv.last_sender_id) === user?.id

            return (
              <button key={conv.other_user_id}
                onClick={() => onSelect(conv.other_user_id, conv.other_user_name, conv.other_user_role)}
                className={`w-full text-left px-4 py-3.5 transition-all flex items-start gap-3 border-l-2
                  ${isSelected
                    ? 'bg-slate-50 dark:bg-slate-800/30 border-l-primary-500'
                    : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/10 border-l-transparent'}`}>
                
                {/* Avatar */}
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 font-display
                  ${isSelected ? 'bg-primary-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                  {conv.other_user_name?.[0]?.toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className={`text-xs font-bold truncate ${isSelected ? 'text-primary-700 dark:text-primary-400' : 'text-slate-800 dark:text-slate-200'}`}>
                      {conv.other_user_name}
                    </p>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0 ml-1">
                      {timeLabel(conv.last_message_at)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-1">
                    <p className={`text-xs truncate ${unread > 0 ? 'font-semibold text-slate-800 dark:text-slate-105' : 'text-slate-500 dark:text-slate-450'}`}>
                      {isMine ? 'You: ' : ''}{conv.last_message}
                    </p>
                    {unread > 0 && (
                      <span className="px-1.5 py-0.5 bg-primary-600 text-white text-[10px] rounded-full font-bold shrink-0">
                        {unread}
                      </span>
                    )}
                  </div>

                  <div className="mt-1.5">
                    <Badge variant={ROLE_VARIANTS[conv.other_user_role]}>{conv.other_user_role}</Badge>
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>
    </Card>
  )
}

/* ── New Chat Modal ── */
function NewChatModal({ onClose, onSelect }) {
  const [search, setSearch] = useState('')

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: fetchContacts,
  })

  const filtered = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Modal open onClose={onClose} title="New Message" size="sm">
      <div className="space-y-4">
        <Input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search contacts…" leftIcon={<Search size={14} />} autoFocus />

        <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
          {isLoading ? (
            <p className="text-xs text-slate-400 text-center py-6 animate-pulse">Loading contacts…</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8">
              <User size={28} className="mx-auto text-slate-350 dark:text-slate-600 mb-2 opacity-50" />
              <p className="text-xs text-slate-400">No contacts found</p>
            </div>
          ) : (
            filtered.map(contact => (
              <button key={contact.id}
                onClick={() => { onSelect(contact.id, contact.name, contact.role); onClose() }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 text-left transition-colors">
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs">
                  {contact.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{contact.name}</p>
                  <div className="mt-0.5">
                    <Badge variant={ROLE_VARIANTS[contact.role]}>{contact.role}</Badge>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </Modal>
  )
}

/* ── Message Thread ── */
function MessageThread({ otherUserId, otherUserName, otherUserRole }) {
  const qc = useQueryClient()
  const { user } = useSelector(state => state.auth)
  const { socket } = useSocket()
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [theyTyping, setTheyTyping] = useState(false)
  const bottomRef = useRef(null)
  const typingTimer = useRef(null)

  const { data, isLoading } = useQuery({
    queryKey: ['thread', otherUserId],
    queryFn: () => fetchThread(otherUserId),
    enabled: !!otherUserId,
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
        (msg.sender_id === otherUserId && msg.receiver_id === user?.id) ||
        (msg.sender_id === user?.id && msg.receiver_id === otherUserId)
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

    socket.on('new_message', handleNewMessage)
    socket.on('user_typing', handleTyping)
    socket.on('user_stop_typing', ({ from_user_id }) => {
      if (from_user_id === otherUserId) setTheyTyping(false)
    })

    return () => {
      socket.off('new_message', handleNewMessage)
      socket.off('user_typing', handleTyping)
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

  const grouped = messages.reduce((acc, msg) => {
    const day = new Date(msg.sent_at).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'long', year: 'numeric',
    })
    if (!acc[day]) acc[day] = []
    acc[day].push(msg)
    return acc
  }, {})

  return (
    <Card padding="none" className="flex-1 flex flex-col h-[calc(100vh-140px)] border border-slate-200 dark:border-slate-800 rounded-l-none rounded-[20px] overflow-hidden bg-white dark:bg-slate-900 shadow-sm relative">
      {/* Thread header */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/20 dark:bg-slate-850 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 flex items-center justify-center font-bold text-sm">
            {otherUserName?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 font-display">{otherUserName}</p>
            <div className="mt-0.5">
              <Badge variant={ROLE_VARIANTS[otherUserRole]}>{otherUserRole}</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 dark:bg-slate-900/10">
        {isLoading ? (
          <p className="text-xs text-slate-400 text-center py-12 animate-pulse">Loading message thread…</p>
        ) : messages.length === 0 ? (
          <div className="text-center py-20 text-slate-400 dark:text-slate-500">
            <Sparkles size={36} className="mx-auto text-primary-500 opacity-60 mb-3 animate-pulse" />
            <p className="text-sm font-semibold font-display text-slate-750 dark:text-slate-200">Say hello to {otherUserName}!</p>
            <p className="text-xs mt-1 text-slate-400">Send a message to kick off the thread.</p>
          </div>
        ) : (
          Object.entries(grouped).map(([day, msgs]) => (
            <div key={day} className="space-y-3">
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800/60" />
                <span className="text-[10px] text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wider font-display">{day}</span>
                <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800/60" />
              </div>

              {msgs.map((msg, i) => {
                const isMine = msg.sender_id === user?.id
                const showTime = i === msgs.length - 1 || new Date(msgs[i + 1]?.sent_at) - new Date(msg.sent_at) > 300000

                return (
                  <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-xs sm:max-w-md md:max-w-lg">
                      <div className={`px-4 py-2.5 rounded-[16px] text-sm leading-relaxed whitespace-pre-wrap
                        ${isMine
                          ? 'bg-gradient-to-br from-primary-550 to-primary-650 text-white rounded-tr-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-150 rounded-tl-sm'}`}>
                        {msg.content}
                      </div>

                      {showTime && (
                        <div className={`flex items-center gap-1 mt-1 text-[10px] text-slate-400 dark:text-slate-500 ${isMine ? 'justify-end' : ''}`}>
                          <span>{new Date(msg.sent_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                          {isMine && (msg.read_at ? <CheckCheck size={11} className="text-emerald-500" /> : <Check size={11} />)}
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
          <div className="flex justify-start">
            <div className="bg-slate-100 dark:bg-slate-800 rounded-[16px] rounded-tl-sm px-4 py-3">
              <div className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 shrink-0">
        <div className="flex items-end gap-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-1.5">
          <textarea value={input} onChange={handleInputChange} onKeyDown={handleKeyDown}
            placeholder={`Message ${otherUserName}…`} rows={1}
            className="flex-1 px-3 py-2 bg-transparent text-slate-850 dark:text-slate-100 text-sm focus:outline-none resize-none max-h-24 scrollbar-none"
            style={{ height: 'auto' }}
            onInput={e => {
              e.target.style.height = 'auto'
              e.target.style.height = e.target.scrollHeight + 'px'
            }} />
          
          <Button size="sm" onClick={handleSend} disabled={!input.trim() || mutation.isPending} className="h-9 w-9 shrink-0 flex items-center justify-center p-0 rounded-xl">
            <Send size={14} />
          </Button>
        </div>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 ml-1">Enter to send · Shift+Enter for new line</p>
      </div>
    </Card>
  )
}

/* ── Main Messaging Page ── */
export default function MessagingPage() {
  const [selected, setSelected] = useState(null)
  const [showNewChat, setShowNewChat] = useState(false)

  const handleSelectConversation = (id, name, role) => {
    setSelected({ id, name, role })
  }

  return (
    <DashboardLayout title="Messages">
      <div className="p-6">
        <div className="flex w-full">
          <ConversationList selectedId={selected?.id} onSelect={handleSelectConversation} onNewChat={() => setShowNewChat(true)} />

          {selected ? (
            <MessageThread otherUserId={selected.id} otherUserName={selected.name} otherUserRole={selected.role} />
          ) : (
            <Card padding="none" className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-l-none rounded-[20px] h-[calc(100vh-140px)]">
              <MessageSquare size={48} className="text-primary-500/30 mb-4" />
              <p className="text-sm font-semibold font-display text-slate-750 dark:text-slate-200">Start Messaging</p>
              <p className="text-xs text-slate-400 mt-1">Select a contact from the inbox or start a new thread</p>
              <Button leftIcon={<Plus size={14} />} onClick={() => setShowNewChat(true)} className="mt-4">New Message</Button>
            </Card>
          )}

          {showNewChat && <NewChatModal onClose={() => setShowNewChat(false)} onSelect={handleSelectConversation} />}
        </div>
      </div>
    </DashboardLayout>
  )
}