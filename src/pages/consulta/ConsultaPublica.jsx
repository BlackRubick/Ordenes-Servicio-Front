import React, { useState } from 'react'
import { Search, FileText, Clock, User, AlertCircle, CheckCircle2, Package, Wrench, Calendar } from 'lucide-react'
import { getOrdenByFolioPublic } from '../../services/consulta.service'

function getEstadoIcon(estado) {
  const icons = {
    'Pendiente': <Clock className="w-6 h-6" />,
    'En revisión': <Search className="w-6 h-6" />,
    'En reparación': <Wrench className="w-6 h-6" />,
    'Listo': <CheckCircle2 className="w-6 h-6" />,
    'Entregado': <Package className="w-6 h-6" />
  }
  return icons[estado] || <FileText className="w-6 h-6" />
}

function getEstadoStyle(estado) {
  const styles = {
    'Pendiente': 'bg-gray-100 text-gray-700 border-gray-300',
    'En revisión': 'bg-yellow-100 text-yellow-800 border-yellow-300',
    'En reparación': 'bg-blue-100 text-[#0078ff] border-[#0078ff]',
    'Listo': 'bg-green-100 text-green-800 border-green-300',
    'Entregado': 'bg-gray-100 text-gray-600 border-gray-300'
  }
  return styles[estado] || styles['Pendiente']
}

function Timeline({ estado }) {
  const estados = ['Pendiente', 'En revisión', 'En reparación', 'Listo', 'Entregado']
  const currentIndex = estados.indexOf(estado)

  return (
    <div className="w-full py-8">
      <div className="flex items-center justify-between relative">
        {/* Línea de fondo */}
        <div className="absolute left-0 top-1/2 w-full h-1 bg-gray-200 -translate-y-1/2"></div>
        
        {/* Línea de progreso con gradiente SIEEG */}
        <div 
          className="absolute left-0 top-1/2 h-1 bg-gradient-to-r from-[#0078ff] to-[#66b3ff] -translate-y-1/2 transition-all duration-500"
          style={{ width: `${(currentIndex / (estados.length - 1)) * 100}%` }}
        ></div>

        {estados.map((e, idx) => {
          const isCompleted = idx <= currentIndex
          const isCurrent = idx === currentIndex
          
          return (
            <div key={e} className="flex flex-col items-center relative z-10">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-300 ${
                  isCompleted 
                    ? 'bg-[#0078ff] border-[#0078ff] shadow-lg' 
                    : 'bg-white border-gray-300'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5 text-white" />
                ) : (
                  <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                )}
              </div>
              <span 
                className={`text-xs mt-2 font-semibold max-w-20 text-center ${
                  isCurrent ? 'text-[#0078ff]' : isCompleted ? 'text-gray-700' : 'text-gray-400'
                }`}
              >
                {e}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function ConsultaPublica() {
  const [folio, setFolio] = useState('')
  const [orden, setOrden] = useState(null)
  const [searching, setSearching] = useState(false)
  const [notFound, setNotFound] = useState(false)

  async function buscar(e) {
    e?.preventDefault()
    if (!folio.trim()) {
      alert('Por favor ingresa un número de folio')
      return
    }

    setSearching(true)
    setNotFound(false)
    setOrden(null)

    try {
      const found = await getOrdenByFolioPublic(folio.trim())
      setOrden(found)
      setNotFound(false)
    } catch (e) {
      setOrden(null)
      setNotFound(true)
    } finally {
      setSearching(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header con gradiente SIEEG */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#0078ff] to-[#66b3ff] rounded-full mb-4 shadow-xl">
            <Search className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-[#0078ff] to-[#66b3ff] bg-clip-text text-transparent mb-3">
            Consulta tu Orden
          </h1>
          <p className="text-gray-600 text-lg">
            Ingresa tu número de folio para ver el estado de tu equipo
          </p>
        </div>

        {/* Search Form con diseño SIEEG */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-8 border-t-4 border-[#0078ff]">
          <div className="space-y-4">
            <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">
              Número de Folio
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input 
                value={folio} 
                onChange={e => setFolio(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && buscar(e)}
                placeholder="Ej: S2501104" 
                className="flex-1 px-6 py-4 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-[#0078ff] transition text-lg font-mono uppercase"
                disabled={searching}
              />
              <button 
                onClick={buscar}
                disabled={searching}
                className="bg-gradient-to-r from-[#0078ff] to-[#66b3ff] text-white px-8 py-4 rounded-xl font-bold hover:from-[#0066dd] hover:to-[#5599ee] transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-36"
              >
                {searching ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Buscando...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    Buscar
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              El folio te fue proporcionado al ingresar tu equipo
            </p>
          </div>
        </div>

        {/* Results */}
        {orden && (
          <div className="space-y-6 animate-fade-in">
            {/* Status Card */}
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-gray-100">
              {/* Header con gradiente SIEEG */}
              <div className="bg-gradient-to-r from-[#0078ff] to-[#66b3ff] p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-100 mb-1 font-semibold">Folio de Orden</p>
                    <h2 className="text-4xl font-bold text-white font-mono tracking-wider">{orden.folio}</h2>
                  </div>
                  <div className="p-4 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/30">
                    <div className="text-white">
                      {getEstadoIcon(orden.estado)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="p-8 bg-gradient-to-br from-gray-50 to-blue-50">
                <h3 className="text-lg font-bold text-gray-800 mb-4 text-center flex items-center justify-center gap-2">
                  <Wrench className="w-5 h-5 text-[#0078ff]" />
                  Progreso de tu Reparación
                </h3>
                <Timeline estado={orden.estado} />
              </div>

              {/* Details */}
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start gap-4 p-4 bg-gradient-to-br from-blue-50 to-white rounded-xl border-2 border-blue-100 hover:shadow-md transition-shadow">
                    <div className="p-3 bg-gradient-to-br from-[#0078ff] to-[#66b3ff] rounded-xl shadow-md">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">Fecha de Ingreso</p>
                      <p className="text-gray-800 font-bold text-lg mt-1">
                        {orden.fechaIngreso || new Date(orden.createdAt).toLocaleDateString('es-MX')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-gradient-to-br from-purple-50 to-white rounded-xl border-2 border-purple-100 hover:shadow-md transition-shadow">
                    <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-md">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">Técnico Asignado</p>
                      <p className="text-gray-800 font-bold text-lg mt-1">
                        {orden.tecnicoNombre || 'No asignado aún'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-gradient-to-br from-orange-50 to-white rounded-xl border-2 border-orange-100 hover:shadow-md transition-shadow">
                    <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-md">
                      <Package className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">Equipo</p>
                      <p className="text-gray-800 font-bold text-lg mt-1">
                        {orden.equipo?.tipo} {orden.equipo?.marca}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-gradient-to-br from-green-50 to-white rounded-xl border-2 border-green-100 hover:shadow-md transition-shadow">
                    <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-md">
                      <CheckCircle2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">Estado Actual</p>
                      <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold mt-1 border-2 ${getEstadoStyle(orden.estado)}`}>
                        {orden.estado}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Descripción de falla */}
                {orden.descripcionFalla && (
                  <div className="pt-6 border-t-2 border-gray-200">
                    <div className="flex items-start gap-4 p-6 bg-gradient-to-br from-red-50 to-white rounded-xl border-2 border-red-100">
                      <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-md">
                        <AlertCircle className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-2">Problema Reportado</p>
                        <p className="text-gray-700 leading-relaxed text-lg">
                          {orden.descripcionFalla}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Piezas y costos */}
                {(orden.piezasUsadas && orden.piezasUsadas.length > 0) && (
                  <div className="pt-6 border-t-2 border-gray-200">
                    <div className="p-6 bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-gray-200">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl shadow-md">
                          <Package className="w-6 h-6 text-white" />
                        </div>
                        <p className="text-sm font-bold text-gray-700 uppercase tracking-wide">Piezas / Productos</p>
                      </div>
                      <ul className="text-gray-700 space-y-2 mb-4">
                        {orden.piezasUsadas.map((p, i) => (
                          <li key={i} className="flex justify-between p-3 bg-white rounded-lg border">
                            <span className="font-medium">{p.descripcion} <span className="text-gray-500">x{p.cantidad}</span></span>
                            <span className="font-bold text-[#0078ff]">${(Number(p.precio)||0) * (Number(p.cantidad)||0)}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="flex justify-between items-center p-4 bg-gradient-to-r from-[#0078ff] to-[#66b3ff] rounded-xl text-white">
                        <span className="text-lg font-bold uppercase">Total:</span>
                        <div className="text-3xl font-bold">${orden.costoTotal || 0}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Info adicional con diseño SIEEG */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-[#0078ff] rounded-xl p-6 shadow-lg">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-[#0078ff] rounded-full">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-[#0078ff] mb-3 text-lg">Información Importante</h4>
                  <ul className="text-sm text-gray-700 space-y-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#0078ff]" />
                      Te notificaremos cuando tu equipo esté listo para recoger
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#0078ff]" />
                      Si tienes dudas, contacta al técnico asignado
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#0078ff]" />
                      Conserva tu número de folio para futuras consultas
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Not Found */}
        {notFound && (
          <div className="bg-white rounded-2xl shadow-2xl p-12 text-center animate-fade-in border-t-4 border-red-500">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-red-500 to-red-600 rounded-full mb-6 shadow-xl">
              <AlertCircle className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-3xl font-bold text-gray-800 mb-3">
              Orden no encontrada
            </h3>
            <p className="text-gray-600 mb-6 text-lg">
              No encontramos ninguna orden con el folio <span className="font-mono font-bold text-[#0078ff]">{folio}</span>
            </p>
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 text-left border-2 border-gray-200">
              <p className="text-sm text-gray-700 font-bold mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-[#0078ff]" />
                Verifica que:
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-gray-400" />
                  El folio esté escrito correctamente
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-gray-400" />
                  Incluyas la letra inicial (Ej: S2501104)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-gray-400" />
                  No haya espacios extras
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Footer con diseño SIEEG */}
        <div className="mt-8 text-center">
          <div className="inline-block bg-white rounded-xl shadow-xl px-8 py-6 border-t-4 border-[#0078ff]">
            <p className="text-sm text-gray-600 mb-3 font-semibold">¿Necesitas ayuda?</p>
            <div className="flex items-center justify-center gap-4 text-sm">
              <a href="tel:9611180157" className="flex items-center gap-2 text-[#0078ff] font-bold hover:underline px-4 py-2 bg-blue-50 rounded-lg transition-all hover:bg-blue-100">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                961 333 6529
              </a>
              <span className="text-gray-300 font-bold">|</span>
              <a href="https://wa.me/529613336529" className="flex items-center gap-2 text-green-600 font-bold hover:underline px-4 py-2 bg-green-50 rounded-lg transition-all hover:bg-green-100">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
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