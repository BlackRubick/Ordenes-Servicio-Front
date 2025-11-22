// Simple user service backed by localStorage for managing users (tecnicos/admin)
const USERS_KEY = 'sieeg_users'

export function getUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY) || '[]'
    return JSON.parse(raw)
  } catch (e) {
    return []
  }
}

export function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export function createUser({ uid, nombre, email, password, rol = 'tecnico', activo = true }) {
  const users = getUsers()
  // ensure uid unique
  const newUid = uid || `${rol}_${Date.now().toString().slice(-6)}`
  const user = { uid: newUid, nombre, email, password, rol, activo, createdAt: Date.now() }
  users.push(user)
  saveUsers(users)
  return user
}

export function findUserByUid(uid) {
  const users = getUsers()
  return users.find(u => u.uid === uid) || null
}

export function findTechnicians() {
  return getUsers().filter(u => u.rol === 'tecnico' && u.activo)
}

export default {
  getUsers, saveUsers, createUser, findUserByUid, findTechnicians
}
