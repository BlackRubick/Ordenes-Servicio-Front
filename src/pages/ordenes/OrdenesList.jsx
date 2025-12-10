import React, { useEffect, useState } from 'react'
import { Plus, Search, FileText, Eye, Download, Filter, TrendingUp, Package, Calendar, X, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { storageService } from '../../services/storage.service'
import { useAuth } from '../../context/AuthContext'

function getEstadoBadge(estado) {
  const styles = {
    'Pendiente': 'bg-gray-100 text-gray-700 border-gray-300',
    'En revisión': 'bg-amber-100 text-amber-700 border-amber-300',
    'En reparación': 'bg-sky-100 text-sky-700 border-sky-300',
    'Listo': 'bg-emerald-100 text-emerald-700 border-emerald-300',
    'Entregado': 'bg-emerald-100 text-emerald-700 border-emerald-300',
    'Cancelado': 'bg-red-100 text-red-700 border-red-300'
  }
  
  return (
    <span className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 ${styles[estado] || styles['Pendiente']} whitespace-nowrap shadow-sm`}>
      {estado}
    </span>
  )
}

function getEstadoSelectClass(estado) {
  const styles = {
    'Pendiente': 'bg-gray-50 border-gray-300 text-gray-700',
    'En revisión': 'bg-amber-50 border-amber-300 text-amber-700',
    'En reparación': 'bg-sky-50 border-sky-300 text-sky-700',
    'Listo': 'bg-emerald-50 border-emerald-300 text-emerald-700',
    'Entregado': 'bg-emerald-50 border-emerald-300 text-emerald-700',
    'Cancelado': 'bg-red-50 border-red-300 text-red-700'
  }
  return styles[estado] || styles['Pendiente']
}

function StatCard({ label, count, estado, isActive, onClick, icon: Icon }) {
  return (
    <button
      onClick={onClick}
      className={`group relative overflow-hidden p-5 rounded-xl border-2 transition-all duration-300 ${
        isActive 
          ? 'bg-gradient-to-br from-sky-500 to-cyan-500 text-white border-transparent shadow-xl scale-105' 
          : 'bg-white text-gray-700 border-gray-200 hover:border-sky-300 hover:shadow-lg'
      }`}
    >
      <div className="absolute top-0 right-0 w-20 h-20 bg-white opacity-10 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500"></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <Icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-sky-600'}`} />
          <TrendingUp className={`w-4 h-4 ${isActive ? 'text-white opacity-70' : 'text-gray-400'}`} />
        </div>
        <div className={`text-3xl font-black mb-1 ${isActive ? 'text-white' : 'text-gray-900'}`}>
          {count}
        </div>
        <div className={`text-xs font-semibold ${isActive ? 'text-white opacity-90' : 'text-gray-600'}`}>
          {label}
        </div>
      </div>
    </button>
  )
}

function ModalCancelacion({ isOpen, onClose, onConfirm, ordenFolio }) {
  const [motivo, setMotivo] = useState('')

  const handleConfirm = () => {
    if (motivo.trim()) {
      onConfirm(motivo)
      setMotivo('')
    }
  }

  const handleClose = () => {
    setMotivo('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in">
        <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4 flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-white" />
          <h2 className="text-xl font-bold text-white">Cancelar Orden</h2>
        </div>

        <div className="p-6">
          <p className="text-gray-700 font-semibold mb-2">Orden: <span className="text-red-600 font-mono">{ordenFolio}</span></p>
          <p className="text-gray-600 text-sm mb-4">
            Una vez cancelada, la orden no podrá ser modificada. Por favor, indica el motivo de la cancelación:
          </p>
          
          <textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Escribe el motivo de la cancelación..."
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-400 transition-all resize-none"
            rows="4"
          />
        </div>

        <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-end border-t-2 border-gray-100">
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-lg text-gray-700 bg-gray-200 hover:bg-gray-300 font-semibold transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!motivo.trim()}
            className={`px-4 py-2 rounded-lg text-white font-semibold transition-all ${
              motivo.trim() 
                ? 'bg-red-600 hover:bg-red-700 cursor-pointer' 
                : 'bg-red-300 cursor-not-allowed opacity-50'
            }`}
          >
            Confirmar Cancelación
          </button>
        </div>
      </div>
    </div>
  )
}

function ModalEntrega({ isOpen, onClose, onConfirm, ordenFolio }) {
  const [quienRecibe, setQuienRecibe] = useState('')
  const [fechaEntrega, setFechaEntrega] = useState(new Date().toISOString().split('T')[0])

  const handleConfirm = () => {
    if (quienRecibe.trim() && fechaEntrega) {
      onConfirm({ quienRecibe, fechaEntrega })
      setQuienRecibe('')
      setFechaEntrega(new Date().toISOString().split('T')[0])
    }
  }

  const handleClose = () => {
    setQuienRecibe('')
    setFechaEntrega(new Date().toISOString().split('T')[0])
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in">
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-4 flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-white" />
          <h2 className="text-xl font-bold text-white">Entregar Orden</h2>
        </div>

        <div className="p-6">
          <p className="text-gray-700 font-semibold mb-4">Orden: <span className="text-emerald-600 font-mono">{ordenFolio}</span></p>
          
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Fecha de Entrega
            </label>
            <input
              type="date"
              value={fechaEntrega}
              onChange={(e) => setFechaEntrega(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              ¿Quién Recibe?
            </label>
            <input
              type="text"
              value={quienRecibe}
              onChange={(e) => setQuienRecibe(e.target.value)}
              placeholder="Nombre de quien recibe la orden..."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400 transition-all"
            />
            <p className="text-xs text-gray-500 mt-2">
              Si es diferente del cliente, escribe el nombre de quién recibe la orden.
            </p>
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-end border-t-2 border-gray-100">
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-lg text-gray-700 bg-gray-200 hover:bg-gray-300 font-semibold transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!quienRecibe.trim() || !fechaEntrega}
            className={`px-4 py-2 rounded-lg text-white font-semibold transition-all ${
              quienRecibe.trim() && fechaEntrega
                ? 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer' 
                : 'bg-emerald-300 cursor-not-allowed opacity-50'
            }`}
          >
            Confirmar Entrega
          </button>
        </div>
      </div>
    </div>
  )
}

export default function OrdenesList() {
  const [ordenes, setOrdenes] = useState([])
  const [filteredOrdenes, setFilteredOrdenes] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState('Todos')
  const [modalCancelacion, setModalCancelacion] = useState({ isOpen: false, ordenId: null, ordenFolio: null })
  const [modalEntrega, setModalEntrega] = useState({ isOpen: false, ordenId: null, ordenFolio: null })
  const [modalConfirmacionCancelacion, setModalConfirmacionCancelacion] = useState({ isOpen: false, motivo: '', ordenFolio: null })
  const navigate = useNavigate()
  const { user } = useAuth()

  async function load() {
    const all = await storageService.getOrdenes()
    setOrdenes(all.reverse())
    setFilteredOrdenes(all.reverse())
  }

  async function cambiarEstado(ordenId, nuevoEstado) {
    try {
      await storageService.updateOrden(ordenId, { estado: nuevoEstado })
      load()
    } catch (err) {
      alert('Error al actualizar el estado')
      console.error(err)
    }
  }

  async function cancelarOrden(ordenId, motivo, ordenFolio) {
    try {
      await storageService.updateOrden(ordenId, { 
        estado: 'Cancelado',
        motivoCancelacion: motivo,
        fechaCancelacion: new Date().toLocaleDateString('es-ES')
      })
      setModalCancelacion({ isOpen: false, ordenId: null, ordenFolio: null })
      setModalConfirmacionCancelacion({ isOpen: true, motivo, ordenFolio })
      load()
    } catch (err) {
      alert('Error al cancelar la orden')
      console.error(err)
    }
  }

  function abrirModalCancelacion(ordenId, ordenFolio) {
    setModalCancelacion({ isOpen: true, ordenId, ordenFolio })
  }

  function cerrarModalCancelacion() {
    setModalCancelacion({ isOpen: false, ordenId: null, ordenFolio: null })
  }

  async function entregarOrden(ordenId, datos) {
    try {
      await storageService.updateOrden(ordenId, { 
        estado: 'Entregado',
        quienRecibe: datos.quienRecibe,
        fechaEntrega: datos.fechaEntrega
      })
      setModalEntrega({ isOpen: false, ordenId: null, ordenFolio: null })
      load()
    } catch (err) {
      alert('Error al registrar la entrega')
      console.error(err)
    }
  }

  function abrirModalEntrega(ordenId, ordenFolio) {
    setModalEntrega({ isOpen: true, ordenId, ordenFolio })
  }

  function cerrarModalEntrega() {
    setModalEntrega({ isOpen: false, ordenId: null, ordenFolio: null })
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

    if (estadoFiltro !== 'Todos') {
      filtered = filtered.filter(o => o.estado === estadoFiltro)
    }

    if (user && user.rol === 'tecnico') {
      filtered = filtered.filter(o => o.tecnicoUid === user.uid)
    }

    setFilteredOrdenes(filtered)
  }, [searchTerm, estadoFiltro, ordenes, user])

  const estadosConfig = [
    { label: 'Todos', icon: Package },
    { label: 'Pendiente', icon: FileText },
    { label: 'En revisión', icon: Search },
    { label: 'En reparación', icon: Package },
    { label: 'Listo', icon: FileText },
    { label: 'Entregado', icon: FileText }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-cyan-50 p-3 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Moderno */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-br from-sky-500 to-cyan-500 rounded-xl shadow-lg">
                  <FileText className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-black text-gray-900">
                    Órdenes de Servicio
                  </h1>
                  <p className="text-sm text-gray-600 font-medium">
                    Gestiona todas las reparaciones
                  </p>
                </div>
              </div>
            </div>
            <button 
              onClick={() => navigate('/ordenes/nueva')}
              className="group bg-gradient-to-r from-sky-500 to-cyan-500 text-white px-6 py-3.5 rounded-xl font-bold hover:from-sky-600 hover:to-cyan-600 transition-all shadow-xl hover:shadow-2xl flex items-center justify-center gap-2 transform hover:scale-105"
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
              Nueva Orden
            </button>
          </div>
        </div>

        {/* Stats Cards Mejoradas */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6">
          {estadosConfig.map((config) => {
            const count = config.label === 'Todos' 
              ? ordenes.length 
              : ordenes.filter(o => o.estado === config.label).length
            
            return (
              <StatCard
                key={config.label}
                label={config.label}
                count={count}
                estado={config.label}
                isActive={estadoFiltro === config.label}
                onClick={() => setEstadoFiltro(config.label)}
                icon={config.icon}
              />
            )
          })}
        </div>

        {/* Barra de Búsqueda Moderna */}
        <div className="bg-white rounded-2xl shadow-xl p-5 sm:p-6 mb-6 border-2 border-sky-100">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-sky-600 transition-colors" />
              <input
                type="text"
                placeholder="Buscar por folio, cliente, equipo o marca..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition-all text-sm font-medium"
              />
            </div>
            <div className="flex items-center gap-3 bg-sky-50 rounded-xl px-4 py-2 border-2 border-sky-100">
              <Filter className="w-5 h-5 text-sky-600" />
              <select
                value={estadoFiltro}
                onChange={(e) => setEstadoFiltro(e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-sm font-semibold text-gray-700 cursor-pointer"
              >
                {estadosConfig.map(config => (
                  <option key={config.label}>{config.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tabla Moderna */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-sky-100">
          {filteredOrdenes.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-br from-sky-100 to-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-12 h-12 text-sky-600" />
              </div>
              <p className="text-gray-700 text-xl font-bold mb-2">No se encontraron órdenes</p>
              <p className="text-gray-500 text-sm">
                {searchTerm || estadoFiltro !== 'Todos' 
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'Crea tu primera orden de servicio'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-sky-500 to-cyan-500">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                      Firma
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                      Folio
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                      Equipo
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                      Técnico
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
                      className="hover:bg-gradient-to-r hover:from-sky-50 hover:to-cyan-50 transition-all group"
                    >
                      <td className="px-6 py-4">
                        {o.firmaCliente ? (
                          <img 
                            src={o.firmaCliente} 
                            alt="firma" 
                            className="w-20 h-12 object-cover rounded-lg border-2 border-gray-200 shadow-sm"
                          />
                        ) : (
                          <div className="w-20 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center text-xs text-gray-400 font-semibold border-2 border-gray-200">
                            Sin firma
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono font-black text-sky-700 text-base">
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
                      <td className="px-6 py-4">
                        {o.estado === 'Cancelado' ? (
                          <div className="space-y-2">
                            <div className="px-3 py-2 rounded-lg bg-red-50 border-2 border-red-300">
                              <span className="text-xs font-bold text-red-700">Cancelado</span>
                            </div>
                            {o.motivoCancelacion && (
                              <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded border border-gray-300">
                                <p className="font-semibold text-gray-700 mb-1">Motivo:</p>
                                <p>{o.motivoCancelacion}</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <select
                            value={o.estado}
                            onChange={(e) => cambiarEstado(o.id, e.target.value)}
                            className={`px-3 py-2 rounded-lg text-xs font-bold border-2 focus:ring-2 focus:ring-offset-1 cursor-pointer transition-all ${getEstadoSelectClass(o.estado)}`}
                          >
                            <option value="Pendiente">Pendiente</option>
                            <option value="En revisión">En revisión</option>
                            <option value="En reparación">En reparación</option>
                            <option value="Listo">Listo</option>
                          </select>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-700">
                          {o.tecnicoNombre || (
                            <span className="text-gray-400 italic">Sin asignar</span>
                          )}
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
                          {o.estado !== 'Cancelado' && (
                            <button
                              onClick={() => abrirModalCancelacion(o.id, o.folio)}
                              className="px-3 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-all group-hover:scale-105"
                              title="Cancelar orden"
                            >
                              Cancelar
                            </button>
                          )}
                          {o.estado === 'Listo' && (
                            <button
                              onClick={() => abrirModalEntrega(o.id, o.folio)}
                              className="px-3 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-all group-hover:scale-105"
                              title="Registrar entrega"
                            >
                              Entregar
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
              Mostrando <span className="font-bold text-sky-700">{filteredOrdenes.length}</span> de <span className="font-bold text-sky-700">{ordenes.length}</span> órdenes
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className="w-2 h-2 bg-sky-500 rounded-full animate-pulse"></div>
              Sistema actualizado
            </div>
          </div>
        )}
      </div>

      {/* Modal de Cancelación */}
      <ModalCancelacion
        isOpen={modalCancelacion.isOpen}
        onClose={cerrarModalCancelacion}
        onConfirm={(motivo) => cancelarOrden(modalCancelacion.ordenId, motivo, modalCancelacion.ordenFolio)}
        ordenFolio={modalCancelacion.ordenFolio}
      />

      {/* Modal de Entrega */}
      <ModalEntrega
        isOpen={modalEntrega.isOpen}
        onClose={cerrarModalEntrega}
        onConfirm={(datos) => entregarOrden(modalEntrega.ordenId, datos)}
        ordenFolio={modalEntrega.ordenFolio}
      />
      {/* Modal de Confirmación de Cancelación */}
      {modalConfirmacionCancelacion.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in">
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4 flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-white" />
              <h2 className="text-xl font-bold text-white">Orden Cancelada</h2>
            </div>

            <div className="p-6">
              <p className="text-gray-700 font-semibold mb-4">Orden: <span className="text-red-600 font-mono">{modalConfirmacionCancelacion.ordenFolio}</span></p>
              
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-4">
                <p className="text-sm font-semibold text-red-900 mb-2">Motivo de cancelación:</p>
                <p className="text-red-800 text-sm whitespace-pre-wrap">{modalConfirmacionCancelacion.motivo}</p>
              </div>

              <p className="text-gray-600 text-sm">
                La orden ha sido cancelada correctamente. ¿Deseas imprimir el comprobante de cancelación?
              </p>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-end border-t-2 border-gray-100">
              <button
                onClick={() => setModalConfirmacionCancelacion({ isOpen: false, motivo: '', ordenFolio: null })}
                className="px-4 py-2 rounded-lg text-gray-700 bg-gray-200 hover:bg-gray-300 font-semibold transition-all"
              >
                No, cerrar
              </button>
              <button
                onClick={() => {
                  setModalConfirmacionCancelacion({ isOpen: false, motivo: '', ordenFolio: null })
                  window.print()
                }}
                className="px-4 py-2 rounded-lg text-white bg-red-600 hover:bg-red-700 font-semibold transition-all flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm0 0V9a2 2 0 012-2h6a2 2 0 012 2v12" />
                </svg>
                Sí, imprimir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}