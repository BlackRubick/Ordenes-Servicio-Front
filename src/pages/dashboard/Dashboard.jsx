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
  Users,
  ArrowRight,
  Activity,
  XCircle,
  ChevronRight
} from 'lucide-react'
import { storageService } from '../../services/storage.service'

function MetricCard({ title, value, icon: Icon, color, trend, description, bgColor }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${bgColor}`}>
          <Icon className={`w-5 h-5 ${color}`} strokeWidth={2} />
        </div>
        {trend && (
          <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
            {trend}
          </span>
        )}
      </div>
      
      <div className="space-y-1">
        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</h3>
        <p className="text-3xl font-semibold text-gray-900 tabular-nums">{value}</p>
        {description && (
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ estado }) {
  const config = {
    'Pendiente': { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400' },
    'En revisión': { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
    'En reparación': { bg: 'bg-sky-100', text: 'text-sky-700', dot: 'bg-sky-500' },
    'Listo': { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    'Entregado': { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
    'Cancelado': { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' }
  }
  
  const style = config[estado] || config['Pendiente']
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${style.bg} ${style.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`}></span>
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-gray-200 border-t-sky-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-600 font-medium">Cargando información...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Superior */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-cyan-600 rounded-lg flex items-center justify-center">
                  <LayoutDashboard className="w-5 h-5 text-white" strokeWidth={2} />
                </div>
                <h1 className="text-2xl font-semibold text-gray-900">Panel de Control</h1>
              </div>
              <p className="text-sm text-gray-500 ml-13">Sistema de gestión de órdenes de servicio</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span className="font-medium">{new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Métricas Principales */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Resumen General</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Ingresos Hoy"
              value={stats.hoy}
              icon={Calendar}
              color="text-sky-600"
              bgColor="bg-sky-50"
              description="Órdenes del día actual"
            />
            <MetricCard
              title="Pendientes"
              value={stats.pendientes}
              icon={Clock}
              color="text-gray-600"
              bgColor="bg-gray-50"
              description="Esperando asignación"
            />
            <MetricCard
              title="En Proceso"
              value={stats.enReparacion}
              icon={Wrench}
              color="text-cyan-600"
              bgColor="bg-cyan-50"
              description="Reparaciones activas"
            />
            <MetricCard
              title="Completadas"
              value={stats.listos}
              icon={CheckCircle2}
              color="text-emerald-600"
              bgColor="bg-emerald-50"
              description="Listas para entrega"
            />
          </div>
        </section>

        {/* Métricas Secundarias */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Estadísticas Operativas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="En Revisión"
              value={stats.enRevision}
              icon={FileText}
              color="text-amber-600"
              bgColor="bg-amber-50"
              description="Diagnóstico técnico"
            />
            <MetricCard
              title="Entregadas"
              value={stats.entregados}
              icon={Package}
              color="text-gray-600"
              bgColor="bg-gray-50"
              description="Servicios finalizados"
            />
            <MetricCard
              title="Canceladas"
              value={stats.canceladas}
              icon={XCircle}
              color="text-red-600"
              bgColor="bg-red-50"
              description="Órdenes canceladas"
            />
            <MetricCard
              title="Total General"
              value={stats.total}
              icon={Users}
              color="text-sky-600"
              bgColor="bg-sky-50"
              trend="+12%"
              description="Todas las órdenes"
            />
          </div>
        </section>

        {/* Tabla de Órdenes Recientes */}
        <section>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Órdenes Recientes</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Últimas 5 órdenes registradas en el sistema</p>
                </div>
                <button
                  onClick={() => navigate('/ordenes')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 text-white text-sm font-medium rounded-lg hover:bg-sky-700 transition-colors"
                >
                  Ver todas las órdenes
                  <ArrowRight className="w-4 h-4" strokeWidth={2} />
                </button>
              </div>
            </div>

            {recentOrders.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-gray-400" strokeWidth={1.5} />
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">No hay órdenes registradas</h3>
                <p className="text-sm text-gray-500">Las nuevas órdenes aparecerán aquí</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Folio</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Cliente</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">Equipo</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Estado</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden sm:table-cell">Fecha</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentOrders.map(orden => (
                      <tr key={orden.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-mono font-semibold text-sky-700 bg-sky-50 px-2 py-1 rounded">
                            {orden.folio}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{orden.cliente?.nombre}</div>
                        </td>
                        <td className="px-6 py-4 hidden md:table-cell">
                          <div className="text-sm text-gray-600">{orden.equipo?.tipo}</div>
                          <div className="text-xs text-gray-500">{orden.equipo?.marca}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge estado={orden.estado} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            <span className="tabular-nums">{orden.fechaIngreso}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button className="text-sky-600 hover:text-sky-700 transition-colors">
                            <ChevronRight className="w-5 h-5" strokeWidth={2} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
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