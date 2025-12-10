import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  LayoutDashboard, 
  FileText, 
  Clock, 
  Wrench, 
  CheckCircle2, 
  Package,
  TrendingUp,
  Calendar,
  AlertCircle,
  Users,
  ArrowRight,
  Activity,
  XCircle
} from 'lucide-react'
import { storageService } from '../../services/storage.service'

function StatCard({ title, value, icon: Icon, color, trend, description }) {
  return (
    <div className={`relative overflow-hidden bg-white rounded-xl shadow-md hover:shadow-xl p-5 sm:p-6 transition-all duration-300 group border-t-4 ${color}`}>
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-sky-50 to-transparent opacity-40 rounded-full -mr-12 -mt-12"></div>
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-5">
          <div className="p-2.5 rounded-lg bg-gradient-to-br from-sky-50 to-sky-100">
            <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-sky-600" strokeWidth={2} />
          </div>
          {trend && (
            <div className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 rounded-md border border-emerald-200">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" strokeWidth={2.5} />
              <span className="text-emerald-700 text-xs font-semibold">{trend}</span>
            </div>
          )}
        </div>
        
        <div className="space-y-1.5">
          <p className="text-xs uppercase font-semibold text-gray-500 tracking-wider">{title}</p>
          <p className="text-3xl sm:text-4xl font-bold text-gray-900 tabular-nums">{value}</p>
          {description && (
            <p className="text-xs text-gray-500 font-medium pt-1">{description}</p>
          )}
        </div>
      </div>
    </div>
  )
}

function getEstadoBadge(estado) {
  const styles = {
    'Pendiente': 'bg-gray-50 text-gray-700 border-gray-200',
    'En revisión': 'bg-amber-50 text-amber-700 border-amber-200',
    'En reparación': 'bg-sky-50 text-sky-700 border-sky-200',
    'Listo': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Entregado': 'bg-gray-50 text-gray-600 border-gray-200',
    'Cancelado': 'bg-red-50 text-red-700 border-red-200'
  }
  
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${styles[estado] || styles['Pendiente']} whitespace-nowrap`}>
      {estado}
    </span>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    hoy: 0,
    pendientes: 0,
    enRevision: 0,
    enReparacion: 0,
    listos: 0,
    entregados: 0,
    canceladas: 0,
    total: 0
  })
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const ordenes = await storageService.getOrdenes()
    
    const hoy = new Date().toISOString().slice(0, 10)
    const ordenesHoy = ordenes.filter(o => o.fechaIngreso === hoy)
    
    setStats({
      hoy: ordenesHoy.length,
      pendientes: ordenes.filter(o => o.estado === 'Pendiente').length,
      enRevision: ordenes.filter(o => o.estado === 'En revisión').length,
      enReparacion: ordenes.filter(o => o.estado === 'En reparación').length,
      listos: ordenes.filter(o => o.estado === 'Listo').length,
      entregados: ordenes.filter(o => o.estado === 'Entregado').length,
      canceladas: ordenes.filter(o => o.estado === 'Cancelado').length,
      total: ordenes.length
    })

    setRecentOrders(ordenes.slice(0, 5))
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-cyan-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="relative inline-block">
            <div className="w-14 h-14 border-3 border-sky-200 border-t-sky-600 rounded-full animate-spin"></div>
            <Activity className="w-5 h-5 text-sky-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" strokeWidth={2} />
          </div>
          <p className="text-sm text-gray-700 font-medium mt-4">Cargando datos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-cyan-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        
        {/* Header Refinado */}
        <div className="mb-8 sm:mb-12">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-gradient-to-br from-sky-500 to-cyan-500 rounded-lg shadow-md">
              <LayoutDashboard className="w-6 h-6 text-white" strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
              <p className="text-sm text-gray-600 mt-0.5">Monitoreo en tiempo real del sistema</p>
            </div>
          </div>
        </div>

        {/* Stats Grid Principal */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-6">
          <StatCard
            title="Órdenes Hoy"
            value={stats.hoy}
            icon={Calendar}
            color="border-sky-500"
            description="Ingresadas hoy"
          />
          <StatCard
            title="Pendientes"
            value={stats.pendientes}
            icon={Clock}
            color="border-gray-400"
            description="Esperando inicio"
          />
          <StatCard
            title="En Reparación"
            value={stats.enReparacion}
            icon={Wrench}
            color="border-cyan-500"
            description="Proceso activo"
          />
          <StatCard
            title="Listas"
            value={stats.listos}
            icon={CheckCircle2}
            color="border-emerald-500"
            description="Para entregar"
          />
        </div>

        {/* Stats Grid Secundario */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8 sm:mb-10">
          <StatCard
            title="En Revisión"
            value={stats.enRevision}
            icon={FileText}
            color="border-amber-500"
            description="Diagnóstico"
          />
          <StatCard
            title="Entregadas"
            value={stats.entregados}
            icon={Package}
            color="border-gray-500"
            description="Completadas"
          />
          <StatCard
            title="Canceladas"
            value={stats.canceladas}
            icon={XCircle}
            color="border-red-500"
            description="No completadas"
          />
          <StatCard
            title="Total"
            value={stats.total}
            icon={Users}
            color="border-sky-600"
            trend="+12%"
            description="Todas las órdenes"
          />
        </div>

        {/* Sección de Órdenes Recientes */}
        <div className="grid grid-cols-1 gap-5 sm:gap-6">
          
          <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
            <div className="px-5 sm:px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-sky-500 to-cyan-500 rounded-lg">
                    <FileText className="w-5 h-5 text-white" strokeWidth={2} />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                      Órdenes Recientes
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">Últimas 5 órdenes registradas</p>
                  </div>
                </div>
                <button 
                  onClick={() => navigate('/ordenes')} 
                  className="flex items-center justify-center gap-1.5 px-4 py-2 text-sky-600 text-sm font-semibold hover:bg-sky-50 rounded-lg transition-colors group"
                >
                  Ver todas
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" strokeWidth={2} />
                </button>
              </div>
            </div>
            
            <div className="p-5 sm:p-6">
              {recentOrders.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-sky-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-sky-400" strokeWidth={1.5} />
                  </div>
                  <p className="text-gray-500 font-medium text-sm">No hay órdenes registradas</p>
                  <p className="text-gray-400 text-xs mt-1">Las órdenes aparecerán aquí</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentOrders.map(orden => (
                    <div 
                      key={orden.id} 
                      className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-sky-50 hover:border-sky-300 transition-all cursor-pointer"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                          <span className="font-mono text-sm font-bold text-sky-700 px-2 py-0.5 bg-sky-100 rounded">{orden.folio}</span>
                          {getEstadoBadge(orden.estado)}
                        </div>
                        <p className="text-sm font-semibold text-gray-800 mb-1 truncate">{orden.cliente?.nombre}</p>
                        <p className="text-xs text-gray-600 truncate">{orden.equipo?.tipo} - {orden.equipo?.marca}</p>
                      </div>
                      <div className="flex-shrink-0">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg">
                          <Calendar className="w-3.5 h-3.5 text-gray-500" strokeWidth={2} />
                          <p className="text-xs font-medium text-gray-700 tabular-nums">{orden.fechaIngreso}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  )
}