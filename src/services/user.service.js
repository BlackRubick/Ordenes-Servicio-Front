import { api } from './api'

export async function getUsers() {
  const res = await api.get('/api/users')
  return res.data || []
}

export async function findUserByUid(uid) {
  const res = await api.get(`/api/users/${uid}`)
  return res.data
}

export async function findTechnicians() {
  const res = await api.get('/api/tecnicos')
  return res.data || []
}

export async function createUser(payload) {
  const res = await api.post('/api/tecnicos', payload)
  return res.data
}

export async function deleteUser(uid) {
  const res = await api.delete(`/api/users/${uid}`)
  return res.data
}

export async function updateUser(uid, payload) {
  const res = await api.put(`/api/users/${uid}`, payload)
  return res.data
}

export default {
  getUsers, findUserByUid, findTechnicians, createUser, deleteUser, updateUser
}
