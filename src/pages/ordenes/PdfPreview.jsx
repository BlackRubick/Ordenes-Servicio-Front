import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { storageService } from '../../services/storage.service'
import { downloadOrdenPDF } from '../../services/pdf.service'
import { Download, Send, Mail, Phone, FileText, User, Package, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react'

export default function PdfPreview() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [orden, setOrden] = useState(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    storageService.getOrdenById(id).then(o => {
      setOrden(o)
      setLoading(false)
    })
  }, [id])

  async function downloadPDF() {
    if (!orden || downloading) return
    setDownloading(true)
    try {
      await downloadOrdenPDF(orden)
    } catch (e) {
      alert('Error al descargar el PDF')
    } finally {
      setDownloading(false)
    }
  }

  async function sendWhatsApp() {
    if (!orden) return
    // First, download the PDF
    await downloadOrdenPDF(orden)
    const tel = orden.cliente?.telefono || ''
    const mensaje = `Hola ${orden.cliente?.nombre || ''}, te envío la información de tu Orden *${orden.folio}*\n\n📋 Estado: *${orden.estado || 'En proceso'}*\n🔧 Equipo: ${orden.equipo?.tipo || ''} ${orden.equipo?.marca || ''}\n\nPor favor revisa el PDF adjunto para más detalles.\n\n_SIEEG - Ingeniería y Telecomunicaciones_`
    const phone = tel.replace(/\D/g, '')
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(mensaje)}`
    window.open(url, '_blank')
  }

  async function sendEmail() {
    if (!orden) return
    const email = orden.cliente?.correo || ''
    const subject = `Orden de Servicio ${orden.folio} - SIEEG`
    const body = `Estimado/a ${orden.cliente?.nombre || 'Cliente'},\n\nAdjunto encontrará la orden de servicio ${orden.folio}.\n\nDetalles:\n- Estado: ${orden.estado || ''}\n- Equipo: ${orden.equipo?.tipo || ''} ${orden.equipo?.marca || ''}\n- Técnico asignado: ${orden.tecnicoAsignado || 'Por asignar'}\n\nPor favor, revise el documento PDF descargado.\n\nSaludos cordiales,\nSIEEG - Ingeniería y Telecomunicaciones\nTel: 961 333 6529`
    
    // Download PDF for manual attachment
    await downloadOrdenPDF(orden)
    const mailto = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.location.href = mailto
  }

  const getEstadoBadge = (estado) => {
    const badges = {
      'Pendiente': { bg: 'bg-gray-400', text: 'Pendiente', icon: <AlertCircle className="w-4 h-4" /> },
      'En revisión': { bg: 'bg-yellow-400', text: 'En revisión', icon: <FileText className="w-4 h-4" /> },
      'En reparación': { bg: 'bg-[#0078ff]', text: 'En reparación', icon: <Package className="w-4 h-4" /> },
      'Listo': { bg: 'bg-green-500', text: 'Listo', icon: <CheckCircle2 className="w-4 h-4" /> },
      'Entregado': { bg: 'bg-gray-500', text: 'Entregado', icon: <CheckCircle2 className="w-4 h-4" /> }
    }
    return badges[estado] || badges['Pendiente']
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-[#0078ff] border-r-transparent mb-4"></div>
          <p className="text-gray-600 font-semibold">Cargando orden...</p>
        </div>
      </div>
    )
  }

  if (!orden) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-4">
        <div className="text-center bg-white rounded-2xl shadow-2xl p-12 max-w-md">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Orden no encontrada</h2>
          <p className="text-gray-600 mb-6">No se pudo cargar la información de esta orden</p>
          <button 
            onClick={() => navigate('/ordenes')}
            className="px-6 py-3 bg-gradient-to-r from-[#0078ff] to-[#66b3ff] text-white rounded-xl font-bold hover:from-[#0066dd] hover:to-[#5599ee] transition-all"
          >
            Volver a órdenes
          </button>
        </div>
      </div>
    )
  }

  const estadoBadge = getEstadoBadge(orden.estado)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        
        {/* Header con gradiente SIEEG */}
        <div className="bg-gradient-to-r from-[#0078ff] to-[#66b3ff] rounded-2xl shadow-2xl p-8 mb-8">
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={() => navigate(`/ordenes/${id}`)}
              className="px-4 py-2 bg-white/20 backdrop-blur-sm border-2 border-white/30 text-white rounded-xl hover:bg-white/30 transition-all font-semibold flex items-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Volver
            </button>
            <div className={`px-4 py-2 ${estadoBadge.bg} text-white rounded-full font-bold flex items-center gap-2`}>
              {estadoBadge.icon}
              {estadoBadge.text}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border-2 border-white/30">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Orden {orden.folio}</h1>
              <p className="text-blue-100">Previsualización y opciones de envío</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Información del Cliente */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border-t-4 border-[#0078ff]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#0078ff] to-[#66b3ff] rounded-xl flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Cliente</h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Nombre</p>
                <p className="text-gray-900 font-semibold">{orden.cliente?.nombre || 'N/A'}</p>
              </div>
              {orden.cliente?.telefono && (
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase mb-1">Teléfono</p>
                  <p className="text-gray-900 font-semibold flex items-center gap-2">
                    <Phone className="w-4 h-4 text-[#0078ff]" />
                    {orden.cliente.telefono}
                  </p>
                </div>
              )}
              {orden.cliente?.correo && (
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase mb-1">Correo</p>
                  <p className="text-gray-900 font-semibold flex items-center gap-2 text-sm break-all">
                    <Mail className="w-4 h-4 text-[#0078ff] flex-shrink-0" />
                    {orden.cliente.correo}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Información del Equipo */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border-t-4 border-purple-500">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Equipo</h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Tipo y Marca</p>
                <p className="text-gray-900 font-semibold">
                  {orden.equipo?.tipo || 'N/A'} {orden.equipo?.marca || ''}
                </p>
              </div>
              {orden.equipo?.modelo && (
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase mb-1">Modelo</p>
                  <p className="text-gray-900 font-semibold">{orden.equipo.modelo}</p>
                </div>
              )}
              {orden.equipo?.numeroSerie && (
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase mb-1">Número de Serie</p>
                  <p className="text-gray-900 font-mono text-sm">{orden.equipo.numeroSerie}</p>
                </div>
              )}
            </div>
          </div>

          {/* Información de Servicio */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border-t-4 border-green-500">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Servicio</h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Fecha de Ingreso</p>
                <p className="text-gray-900 font-semibold">{orden.fechaIngreso || 'N/A'}</p>
              </div>
              {orden.tecnicoAsignado && (
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase mb-1">Técnico</p>
                  <p className="text-gray-900 font-semibold">{orden.tecnicoAsignado}</p>
                </div>
              )}
              {orden.costoTotal > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase mb-1">Costo Total</p>
                  <p className="text-2xl font-bold text-green-600">${orden.costoTotal}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Descripción de la falla */}
        {orden.descripcionFalla && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border-l-4 border-red-500">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Descripción de la Falla</h3>
            </div>
            <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-xl border-2 border-gray-200">
              {orden.descripcionFalla}
            </p>
          </div>
        )}

        {/* Acciones principales */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border-t-4 border-[#0078ff]">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Send className="w-6 h-6 text-[#0078ff]" />
            Opciones de Envío
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Descargar PDF */}
            <button 
              onClick={downloadPDF}
              disabled={downloading}
              className="group relative overflow-hidden bg-gradient-to-r from-[#0078ff] to-[#66b3ff] text-white px-6 py-4 rounded-xl font-bold hover:from-[#0066dd] hover:to-[#5599ee] transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex flex-col items-center gap-2">
                {downloading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Download className="w-6 h-6" />
                )}
                <span className="text-sm">
                  {downloading ? 'Descargando...' : 'Descargar PDF'}
                </span>
              </div>
            </button>

            {/* Enviar por WhatsApp */}
            <button 
              onClick={sendWhatsApp}
              className="group relative overflow-hidden bg-gradient-to-r from-green-600 to-green-500 text-white px-6 py-4 rounded-xl font-bold hover:from-green-700 hover:to-green-600 transition-all shadow-lg hover:shadow-xl"
            >
              <div className="flex flex-col items-center gap-2">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                <span className="text-sm">Enviar WhatsApp</span>
              </div>
            </button>

            {/* Enviar por Email */}
            <button 
              onClick={sendEmail}
              className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-4 rounded-xl font-bold hover:from-blue-700 hover:to-blue-600 transition-all shadow-lg hover:shadow-xl"
            >
              <div className="flex flex-col items-center gap-2">
                <Mail className="w-6 h-6" />
                <span className="text-sm">Enviar Email</span>
              </div>
            </button>
          </div>

          {/* Nota informativa */}
          <div className="mt-6 p-4 bg-blue-50 border-l-4 border-[#0078ff] rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[#0078ff] flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-700">
                <p className="font-semibold text-[#0078ff] mb-1">Nota importante:</p>
                <p>El PDF se descargará automáticamente. Deberás adjuntarlo manualmente al enviar por WhatsApp o Email.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Información adicional */}
        <div className="mt-6 text-center">
          <div className="inline-block bg-white rounded-xl shadow-lg px-8 py-4 border-t-4 border-[#0078ff]">
            <p className="text-sm text-gray-600 mb-2 font-semibold">SIEEG - Ingeniería y Telecomunicaciones</p>
            <div className="flex items-center justify-center gap-4 text-sm">
              <a href="tel:9613336529" className="text-[#0078ff] font-bold hover:underline flex items-center gap-1">
                <Phone className="w-4 h-4" />
                961 333 6529
              </a>
              <span className="text-gray-300">|</span>
              <a href="https://wa.me/529613336529" className="text-green-600 font-bold hover:underline flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}