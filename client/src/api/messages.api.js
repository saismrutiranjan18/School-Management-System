import api from './axios'

export const fetchConversations = ()             =>
  api.get('/messages/conversations').then(r => r.data)

export const fetchThread        = (otherUserId, page = 1) =>
  api.get(`/messages/conversation/${otherUserId}`, { params: { page } }).then(r => r.data)

export const sendMessage        = (data)         =>
  api.post('/messages', data).then(r => r.data)

export const fetchContacts      = ()             =>
  api.get('/messages/contacts').then(r => r.data)

export const fetchUnreadCount   = ()             =>
  api.get('/messages/unread-count').then(r => r.data)