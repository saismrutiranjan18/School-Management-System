import api from './axios'

export const fetchMyProfile   = ()     => api.get('/auth/me').then(r => r.data)
export const updateMyProfile  = (data) => api.put('/auth/me', data).then(r => r.data)
export const changeMyPassword = (data) => api.put('/auth/me/password', data).then(r => r.data)

export const uploadMyPhoto = (file) => {
  const formData = new FormData()
  formData.append('photo', file)
  return api.post('/auth/me/photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data)
}