import React, { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import LoginPage from './pages/auth/LoginPage'
import Dashboard from './pages/dashboard/Dashboard'
import OrdenesList from './pages/ordenes/OrdenesList'
import OrdenesEliminadas from './pages/ordenes/OrdenesEliminadas'
import NuevaOrden from './pages/ordenes/NuevaOrden'
import OrdenDetalle from './pages/ordenes/OrdenDetalle'
import ConsultaPublica from './pages/consulta/ConsultaPublica'
import PdfPreview from './pages/ordenes/PdfPreview'
import DownloadUpload from './pages/download/DownloadUpload'
import TecnicosPage from './pages/tecnicos/Tecnicos'
import ProductsPage from './pages/products/Products'
import ServicioForaneo from './pages/servicio/ServicioForaneo'
import { useAuth } from './context/AuthContext'
import Header from './components/layout/Header'

function Protected({ children, roles }) {
  const { user, initialized } = useAuth()
  if (!initialized) return null
  if (!user) return <Navigate to="/login" replace />
  if (roles && roles.length && !roles.includes(user.rol)) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const { user, initialized } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    // Wait until auth context has initialized before redirecting
    if (initialized && !user) {
      const path = location.pathname || '/'
      const allowed = ['/login', '/consulta']
      const isAllowed = allowed.includes(path) || path.startsWith('/download')
      if (!isAllowed) navigate('/login', { replace: true })
    }
  }, [initialized, user, location.pathname, navigate])

  // Lleva la vista al inicio cada vez que cambia la ruta
  useEffect(() => {
    try {
      window.scrollTo({ top: 0, behavior: 'instant' })
    } catch (e) {
      window.scrollTo(0, 0)
    }
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-gray-50">
      {initialized && user && <Header />}
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<LoginPage />} />

        <Route path="/consulta" element={<ConsultaPublica />} />

        <Route
          path="/dashboard"
          element={<Protected><Dashboard /></Protected>}
        />

        <Route
          path="/ordenes"
          element={<Protected><OrdenesList /></Protected>}
        />
        <Route
          path="/ordenes/eliminadas"
          element={<Protected roles={["admin"]}><OrdenesEliminadas /></Protected>}
        />
        <Route
          path="/ordenes/nueva"
          element={<Protected roles={["admin"]}><NuevaOrden /></Protected>}
        />
        <Route
          path="/ordenes/:id"
          element={<Protected><OrdenDetalle /></Protected>}
        />
        <Route
          path="/ordenes/:id/pdf"
          element={<Protected><PdfPreview /></Protected>}
        />
        <Route
          path="/tecnicos"
          element={<Protected roles={["admin"]}><TecnicosPage /></Protected>}
        />
        <Route
          path="/productos"
          element={<Protected><ProductsPage /></Protected>}
        />
        <Route
          path="/servicio-foraneo"
          element={<Protected><ServicioForaneo /></Protected>}
        />
        {/* Public local download route for uploads saved in IndexedDB */}
        <Route path="/download/:uploadId" element={<DownloadUpload />} />

        <Route path="*" element={<div className="p-8">Ruta no encontrada</div>} />
      </Routes>
    </div>
  )
}
