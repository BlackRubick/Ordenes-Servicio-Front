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
    <div className={`relative overflow-hidden bg-white rounded-2xl shadow-xl p-6 sm:p-7 transform hover:scale-105 transition-all duration-300 group border-l-4 ${color}`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-sky-50 opacity-30 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-xl bg-sky-100 shadow-lg`}>
            <Icon className={`w-6 h-6 sm:w-7 sm:h-7 text-sky-600`} />
          </div>
          {trend && (
            <div className="flex items-center gap-1 px-2 py-1 bg-sky-100 rounded-full">
              <TrendingUp className="w-3 h-3 text-sky-600" />
              <span className="text-sky-700 text-xs font-bold">{trend}</span>
            </div>
          )}
        </div>
        
        <div>
          <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
          <p className="text-4xl sm:text-5xl font-bold text-gray-900 mb-1">{value}</p>
          {description && (
            <p className="text-xs text-gray-500">{description}</p>
          )}
        </div>
      </div>
      
      <div className="absolute bottom-0 right-0 w-24 h-24 bg-sky-50 opacity-20 rounded-tl-full"></div>
    </div>
  )
}

function getEstadoBadge(estado) {
  const styles = {
    'Pendiente': 'bg-gray-100 text-gray-700 border-gray-300',
    'En revisión': 'bg-amber-100 text-amber-700 border-amber-300',
    'En reparación': 'bg-sky-100 text-sky-700 border-sky-300',
    'Listo': 'bg-emerald-100 text-emerald-700 border-emerald-300',
    'Entregado': 'bg-gray-100 text-gray-600 border-gray-300'
  }
  
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${styles[estado]} whitespace-nowrap`}>
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
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-cyan-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin mx-auto mb-4"></div>
            <Activity className="w-6 h-6 text-sky-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-base text-gray-700 font-medium">Cargando datos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-cyan-50 p-3 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Moderno */}
        <div className="mb-8 sm:mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-gradient-to-br from-sky-500 to-cyan-500 rounded-xl shadow-lg">
              <LayoutDashboard className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-600 font-medium">Monitoreo en tiempo real</p>
            </div>
          </div>
        </div>

        {/* Stats Grid Mejorado */}
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8">
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

        {/* Layout de Contenido */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
          
          {/* Órdenes Recientes Mejorado */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-2xl p-5 sm:p-7 border-2 border-sky-100">
            <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-sky-500 to-cyan-500 rounded-lg">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Órdenes Recientes
                </h2>
              </div>
              <button onClick={() => navigate('/ordenes')} className="flex items-center gap-1 text-sky-600 text-sm font-bold hover:gap-2 transition-all group">
                Ver todas
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            
            {recentOrders.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-10 h-10 text-sky-500" />
                </div>
                <p className="text-gray-500 font-medium">No hay órdenes registradas</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentOrders.map(orden => (
                  <div 
                    key={orden.id} 
                    className="group relative flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gradient-to-r from-sky-50 to-white border-2 border-gray-100 rounded-xl hover:border-sky-300 hover:shadow-lg transition-all cursor-pointer"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-sky-500 to-cyan-500 rounded-l-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    <div className="flex-1 min-w-0 pl-2">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className="font-mono text-base font-black text-sky-700">{orden.folio}</span>
                        {getEstadoBadge(orden.estado)}
                      </div>
                      <p className="text-sm font-semibold text-gray-700 mb-1">{orden.cliente?.nombre}</p>
                      <p className="text-xs text-gray-500 font-medium">{orden.equipo?.tipo} - {orden.equipo?.marca}</p>
                    </div>
                    <div className="mt-3 sm:mt-0 sm:text-right pl-2">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-100 rounded-lg">
                        <Calendar className="w-3 h-3 text-sky-600" />
                        <p className="text-xs font-semibold text-sky-700">{orden.fechaIngreso}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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