import React, { useEffect, useState } from 'react'
import { Plus, Search, FileText, Eye, Download, Filter, TrendingUp, Package, Calendar } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { storageService } from '../../services/storage.service'
import { useAuth } from '../../context/AuthContext'

function getEstadoBadge(estado) {
  const styles = {
    'Pendiente': 'bg-gray-100 text-gray-700 border-gray-300',
    'En revisión': 'bg-amber-100 text-amber-700 border-amber-300',
    'En reparación': 'bg-sky-100 text-sky-700 border-sky-300',
    'Listo': 'bg-emerald-100 text-emerald-700 border-emerald-300',
    'Entregado': 'bg-gray-100 text-gray-600 border-gray-300'
  }
  
  return (
    <span className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 ${styles[estado] || styles['Pendiente']} whitespace-nowrap shadow-sm`}>
      {estado}
    </span>
  )
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

export default function OrdenesList() {
  const [ordenes, setOrdenes] = useState([])
  const [filteredOrdenes, setFilteredOrdenes] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState('Todos')
  const navigate = useNavigate()
  const { user } = useAuth()

  async function load() {
    const all = await storageService.getOrdenes()
    setOrdenes(all.reverse())
    setFilteredOrdenes(all.reverse())
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getEstadoBadge(o.estado)}
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
    </div>
  )
}