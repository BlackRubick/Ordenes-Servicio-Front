import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Menu, X } from 'lucide-react'

export default function Header() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  function handleLogout() {
    logout()
    navigate('/login')
  }

  // If no user session, don't render the header at all
  if (!user) return null

  return (
    <header className="bg-white shadow-sm relative z-[9999]">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/dashboard" className=" font-bold text-[#66b3ff]">SIEEG</Link>
        </div>

        <nav className="hidden sm:flex gap-6 text-sm justify-center flex-1 lg:gap-10">
          <Link to="/dashboard" className="text-gray-600 hover:text-sieeg">Dashboard</Link>
          <Link to="/ordenes" className="text-gray-600 hover:text-sieeg">Órdenes</Link>
          {user?.rol !== 'tecnico' && (
            <Link to="/ordenes/nueva" className="text-gray-600 hover:text-sieeg">Nueva orden</Link>
          )}
          {user && user.rol === 'admin' && (
            <Link to="/ordenes/eliminadas" className="text-gray-600 hover:text-sieeg">Eliminadas</Link>
          )}
          <Link to="/consulta" className="text-gray-600 hover:text-sieeg">Consulta pública</Link>
          {user && user.rol === 'admin' && (
            <Link to="/tecnicos" className="text-gray-600 hover:text-sieeg">Técnicos</Link>
          )}
          <Link to="/servicio-foraneo" className="text-gray-600 hover:text-sieeg">Servicio foráneo</Link>
        </nav>

        <div className="flex items-center justify-end gap-3">
          {/* mobile menu button */}
          <button
            type="button"
            onClick={() => setMobileOpen(v => !v)}
            className="sm:hidden p-2 rounded border"
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            aria-label="Abrir menú"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="hidden sm:flex items-center gap-3">
            {/* avatar */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#66b3ff] text-white flex items-center justify-center font-semibold text-sm">
                {(() => {
                  const name = user.nombre || user.email || ''
                  const parts = String(name).trim().split(/\s+/)
                  if (parts.length === 1) return parts[0].slice(0,1).toUpperCase()
                  return (parts[0].slice(0,1) + parts[parts.length-1].slice(0,1)).toUpperCase()
                })()}
              </div>
            </div>
            <span className="text-sm text-gray-700 truncate max-w-[10rem] text-right">{user.nombre || user.email}</span>
            <button 
              onClick={handleLogout} 
              className="text-sm px-4 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition">Cerrar sesión</button>

          </div>
        </div>
      </div>

      {/* Mobile menu (renders always for smoother animation; hidden on sm+) */}
      <div
        id="mobile-menu"
        className={`sm:hidden border-t bg-white shadow-md transform-gpu transition-all duration-200 ease-out origin-top fixed left-0 right-0 top-16 z-[9999] ${mobileOpen ? 'scale-y-100 translate-y-0 opacity-100 pointer-events-auto' : 'scale-y-0 -translate-y-2 opacity-0 pointer-events-none'}`}
        aria-hidden={!mobileOpen}
      >
        <div className="px-4 py-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-900 text-white flex items-center justify-center font-semibold text-sm">
                {(() => {
                  const name = user.nombre || user.email || ''
                  const parts = String(name).trim().split(/\s+/)
                  if (parts.length === 1) return parts[0].slice(0,1).toUpperCase()
                  return (parts[0].slice(0,1) + parts[parts.length-1].slice(0,1)).toUpperCase()
                })()}
              </div>
              <div className="font-semibold">{user.nombre || user.email}</div>
            </div>
            <button onClick={handleLogout} className="text-sm px-3 py-1 border rounded">Cerrar sesión</button>
          </div>
          <div className="pt-2 flex flex-col gap-2">
            <Link onClick={() => setMobileOpen(false)} to="/dashboard" className="py-2 px-2 rounded hover:bg-gray-50">Dashboard</Link>
            <Link onClick={() => setMobileOpen(false)} to="/ordenes" className="py-2 px-2 rounded hover:bg-gray-50">Órdenes</Link>
            {user?.rol !== 'tecnico' && (
              <Link onClick={() => setMobileOpen(false)} to="/ordenes/nueva" className="py-2 px-2 rounded hover:bg-gray-50">Nueva orden</Link>
            )}
            {user && user.rol === 'admin' && (
              <Link onClick={() => setMobileOpen(false)} to="/ordenes/eliminadas" className="py-2 px-2 rounded hover:bg-gray-50">Órdenes Eliminadas</Link>
            )}
            <Link onClick={() => setMobileOpen(false)} to="/consulta" className="py-2 px-2 rounded hover:bg-gray-50">Consulta pública</Link>
            {user && user.rol === 'admin' && (
              <Link onClick={() => setMobileOpen(false)} to="/tecnicos" className="py-2 px-2 rounded hover:bg-gray-50">Técnicos</Link>
            )}
            <Link onClick={() => setMobileOpen(false)} to="/servicio-foraneo" className="py-2 px-2 rounded hover:bg-gray-50">Servicio foráneo</Link>
          </div>
        </div>
      </div>
    </header>
  )
}
