import React, { useEffect, useState } from 'react'
import { Trash2, Search, FileText, Eye, Download, RefreshCw, Calendar, AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { storageService } from '../../services/storage.service'
import { useAuth } from '../../context/AuthContext'

function ModalRestaurar({ isOpen, onClose, onConfirm, ordenFolio }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in">
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-4 flex items-center gap-3">
          <RefreshCw className="w-6 h-6 text-white" />
          <h2 className="text-xl font-bold text-white">Restaurar Orden</h2>
        </div>

        <div className="p-6">
          <p className="text-gray-700 font-semibold mb-4">Orden: <span className="text-emerald-600 font-mono">{ordenFolio}</span></p>
          <p className="text-gray-600 text-sm">
            ¿Estás seguro de que deseas restaurar esta orden? Volverá a aparecer en el listado principal de órdenes.
          </p>
        </div>

        <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-end border-t-2 border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-gray-700 bg-gray-200 hover:bg-gray-300 font-semibold transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg text-white font-semibold transition-all bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Restaurar
          </button>
        </div>
      </div>
    </div>
  )
}

export default function OrdenesEliminadas() {
  const [ordenes, setOrdenes] = useState([])
  const [filteredOrdenes, setFilteredOrdenes] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [modalRestaurar, setModalRestaurar] = useState({ isOpen: false, ordenId: null, ordenFolio: null })
  const navigate = useNavigate()
  const { user } = useAuth()

  async function load() {
    try {
      const all = await storageService.getOrdenesEliminadas()
      setOrdenes(all.reverse())
      setFilteredOrdenes(all.reverse())
    } catch (err) {
      console.error('Error al cargar órdenes eliminadas:', err)
      alert('Error al cargar órdenes eliminadas')
    }
  }

  async function restaurarOrden(ordenId) {
    try {
      await storageService.restoreOrden(ordenId)
      setModalRestaurar({ isOpen: false, ordenId: null, ordenFolio: null })
      load()
      alert('Orden restaurada correctamente')
    } catch (err) {
      alert('Error al restaurar la orden')
      console.error(err)
    }
  }

  function abrirModalRestaurar(ordenId, ordenFolio) {
    setModalRestaurar({ isOpen: true, ordenId, ordenFolio })
  }

  function cerrarModalRestaurar() {
    setModalRestaurar({ isOpen: false, ordenId: null, ordenFolio: null })
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    function onChanged() { load() }
    window.addEventListener('sieeg:ordenes-changed', onChanged)
    return () => window.removeEventListener('sieeg:ordenes-changed', onChanged)
  }, [])

  useEffect(() => {
    let filtered = ordenes

    if (searchTerm) {
      filtered = filtered.filter(o => 
        o.folio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.cliente?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.equipo?.tipo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.equipo?.marca?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (user && user.rol === 'tecnico') {
      filtered = filtered.filter(o => o.tecnicoUid === user.uid)
    }

    setFilteredOrdenes(filtered)
  }, [searchTerm, ordenes, user])

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 p-3 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl shadow-lg">
                  <Trash2 className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-black text-gray-900">
                    Órdenes Eliminadas
                  </h1>
                  <p className="text-sm text-gray-600 font-medium">
                    Gestiona y restaura órdenes eliminadas
                  </p>
                </div>
              </div>
            </div>
            <button 
              onClick={() => navigate('/ordenes')}
              className="group bg-gradient-to-r from-sky-500 to-cyan-500 text-white px-6 py-3.5 rounded-xl font-bold hover:from-sky-600 hover:to-cyan-600 transition-all shadow-xl hover:shadow-2xl flex items-center justify-center gap-2 transform hover:scale-105"
            >
              <FileText className="w-5 h-5" />
              Ver Órdenes Activas
            </button>
          </div>
        </div>

        {/* Stats Card */}
        <div className="bg-gradient-to-br from-red-500 to-orange-500 text-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-5xl font-black mb-2">{ordenes.length}</div>
              <div className="text-sm font-semibold opacity-90">Órdenes Eliminadas</div>
            </div>
            <Trash2 className="w-16 h-16 opacity-30" />
          </div>
        </div>

        {/* Barra de Búsqueda */}
        <div className="bg-white rounded-2xl shadow-xl p-5 sm:p-6 mb-6 border-2 border-red-100">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-red-600 transition-colors" />
            <input
              type="text"
              placeholder="Buscar por folio, cliente, equipo o marca..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-400 focus:border-red-400 transition-all text-sm font-medium"
            />
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-red-100">
          {filteredOrdenes.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-12 h-12 text-red-600" />
              </div>
              <p className="text-gray-700 text-xl font-bold mb-2">No hay órdenes eliminadas</p>
              <p className="text-gray-500 text-sm">
                {searchTerm 
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'Las órdenes eliminadas aparecerán aquí'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-red-500 to-orange-500">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                      Folio
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                      Fecha Ingreso
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                      Equipo
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                      Fecha Eliminación
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                      Motivo
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredOrdenes.map((o) => (
                    <tr 
                      key={o.id} 
                      className="hover:bg-gradient-to-r hover:from-red-50 hover:to-orange-50 transition-all group"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono font-black text-red-700 text-base">
                          {o.folio}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {o.fechaIngreso}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-gray-900">
                          {o.cliente?.nombre}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-900">
                          {o.equipo?.tipo}
                        </div>
                        <div className="text-xs text-gray-500 font-medium">
                          {o.equipo?.marca}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-red-600 font-medium">
                          <AlertCircle className="w-4 h-4" />
                          {o.fechaEliminacion}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded border border-gray-300 max-w-xs">
                          {o.motivoEliminacion || 'Sin motivo especificado'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => navigate(`/ordenes/${o.id}`)}
                            className="p-2.5 text-sky-600 hover:bg-sky-100 rounded-lg transition-all group-hover:scale-110"
                            title="Ver detalles"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => navigate(`/ordenes/${o.id}/pdf`)}
                            className="p-2.5 text-orange-600 hover:bg-orange-100 rounded-lg transition-all group-hover:scale-110"
                            title="Descargar PDF"
                          >
                            <Download className="w-5 h-5" />
                          </button>
                          {user?.rol === 'admin' && (
                            <button
                              onClick={() => abrirModalRestaurar(o.id, o.folio)}
                              className="px-3 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-all group-hover:scale-105 flex items-center gap-1"
                              title="Restaurar orden"
                            >
                              <RefreshCw className="w-4 h-4" />
                              Restaurar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer con Información */}
        {filteredOrdenes.length > 0 && (
          <div className="mt-6 flex items-center justify-between px-2">
            <div className="text-sm text-gray-600 font-medium">
              Mostrando <span className="font-bold text-red-700">{filteredOrdenes.length}</span> de <span className="font-bold text-red-700">{ordenes.length}</span> órdenes eliminadas
            </div>
          </div>
        )}
      </div>

      {/* Modal de Restaurar */}
      <ModalRestaurar
        isOpen={modalRestaurar.isOpen}
        onClose={cerrarModalRestaurar}
        onConfirm={() => restaurarOrden(modalRestaurar.ordenId)}
        ordenFolio={modalRestaurar.ordenFolio}
      />
    </div>
  )
}
