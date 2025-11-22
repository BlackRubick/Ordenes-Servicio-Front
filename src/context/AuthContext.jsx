import React, { createContext, useContext, useEffect, useState } from 'react'
import { seedUsers } from '../data/seed'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    // seed users on first run
    seedUsers()
    const s = localStorage.getItem('sieeg_session')
    if (s) setUser(JSON.parse(s))
    setInitialized(true)
  }, [])

  function login(userData) {
    localStorage.setItem('sieeg_session', JSON.stringify(userData))
    setUser(userData)
  }

  function logout() {
    localStorage.removeItem('sieeg_session')
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
