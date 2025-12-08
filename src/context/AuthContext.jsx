import React, { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    const s = localStorage.getItem('sieeg_session')
    if (s) {
      const parsed = JSON.parse(s)
      setUser({ ...parsed, rol: parsed.rol || parsed.role })
    }
    setInitialized(true)
  }, [])

  async function login({ email, password }) {
    const res = await api.post('/api/auth/login', { email, password })
    const { token, user: userData } = res.data
    const normalized = { ...userData, rol: userData.rol || userData.role }
    localStorage.setItem('sieeg_session', JSON.stringify(normalized))
    localStorage.setItem('sieeg_token', token)
    setUser(normalized)
    return normalized
  }

  function logout() {
    localStorage.removeItem('sieeg_session')
    localStorage.removeItem('sieeg_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, initialized }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
