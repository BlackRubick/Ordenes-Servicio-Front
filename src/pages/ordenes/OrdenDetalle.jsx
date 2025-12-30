import React, { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { storageService } from '../../services/storage.service'
import { downloadOrdenPDF, generateOrdenPDF, printOrdenPDF, printOrdenTicketPDF } from '../../services/pdf.service'
import { getProducts } from '../../services/woocommerce.service'
import { useAuth } from '../../context/AuthContext'

function normalizeTrabajos(value) {
  if (Array.isArray(value)) return value
  if (value && Array.isArray(value.registros)) return value.registros
  return []
}

function isServicioForaneo(trabajos) {
  if (!Array.isArray(trabajos) || trabajos.length === 0) return false
  const first = trabajos[0]
  return first && typeof first === 'object' && ('area' in first || 'presionGas' in first || 'limpiezaFiltros' in first)
}

export default function OrdenDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [orden, setOrden] = useState(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({})
  const formRef = useRef(form)
  const [logs, setLogs] = useState([])
  const techCanvasRef = useRef(null)
  const [showTechCanvas, setShowTechCanvas] = useState(false)
  const [savingTechSig, setSavingTechSig] = useState(false)
  // WooCommerce credentials (user-provided)
  const WOOCOMMERCE_URL = 'https://sieeg.com.mx'
  const WOOCOMMERCE_CONSUMER_KEY = 'ck_8598eeff250d6976f6c0e66f0dba734eb00b1ea7'
  const WOOCOMMERCE_CONSUMER_SECRET = 'cs_0c9d0bde94223a177c008750caf49337b33fbff0'

  // product suggestions state per pieza index
  const [productSuggestions, setProductSuggestions] = useState({})
  const [productLoading, setProductLoading] = useState({})
  const [productSelected, setProductSelected] = useState({})
  const searchTimers = useRef({})

  async function load() {
    const o = await storageService.getOrdenById(id)
    const normalizedTrabajos = normalizeTrabajos(o.trabajosRealizados)
    const normalizedOrden = { ...o, trabajosRealizados: normalizedTrabajos }
    setOrden(normalizedOrden)
    setForm({
      diagnostico: o.diagnostico || '',
      trabajosRealizados: normalizedTrabajos,
      piezasUsadas: o.piezasUsadas || [],
      costoTotal: o.costoTotal || 0,
      fechaEstimada: o.fechaEstimada || '',
      fechaFinalizacion: o.fechaFinalizacion || '',
      fechaEntrega: o.fechaEntrega || '',
      quienRecibe: o.quienRecibe || '',
      estado: o.estado || 'En revisión'
    })
    try {
      const l = await storageService.getLogsForOrden(o.id || id)
      setLogs(l || [])
    } catch (e) { setLogs([]) }
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  // keep a ref to latest form to avoid stale closures when persisting
  useEffect(() => { formRef.current = form }, [form])

  // run initial searches for pre-filled piezas so suggestions show up,
  // but skip indices that already have a selected product
  useEffect(() => {
    if (loading) return
    const piezas = form.piezasUsadas || []
    piezas.forEach((p, idx) => {
      try {
        if (p && p.descripcion && String(p.descripcion).trim().length >= 2) {
          // skip if user already selected a product for this index
          if (productSelected[idx]) return
          // only trigger if we don't already have suggestions
          if (!productSuggestions[idx] || productSuggestions[idx].length === 0) {
            searchProductsForIndex(idx, p.descripcion)
          }
        }
      } catch (e) {}
    })
  }, [loading, form.piezasUsadas, productSelected, productSuggestions])

  const { user } = useAuth()
  const canEdit = user?.rol === 'admin' && orden?.estado !== 'Cancelado'
  const canSign = user?.rol === 'admin' || (user?.rol === 'tecnico' && orden?.tecnicoUid === user.uid)
  const trabajosView = normalizeTrabajos(canEdit ? form.trabajosRealizados : orden?.trabajosRealizados)

  useEffect(() => {
    if (!loading && user && user.rol === 'tecnico') {
      if (orden && orden.tecnicoUid && orden.tecnicoUid !== user.uid) {
        alert('No autorizado para ver esta orden')
        navigate('/ordenes')
      }
    }
  }, [loading, user, orden, navigate])

  function updateField(path, value) {
    setForm(prev => ({ ...prev, [path]: value }))
  }

  function addTrabajo() {
    setForm(prev => ({ ...prev, trabajosRealizados: [...(prev.trabajosRealizados||[]), ''] }))
  }

  function updateTrabajo(index, value) {
    setForm(prev => {
      const arr = [...(prev.trabajosRealizados||[])]
      arr[index] = value
      return { ...prev, trabajosRealizados: arr }
    })
  }

  function removeTrabajo(index) {
    setForm(prev => {
      const arr = [...(prev.trabajosRealizados||[])]
      arr.splice(index,1)
      return { ...prev, trabajosRealizados: arr }
    })
  }

  function addPieza() {
    setForm(prev => ({ ...prev, piezasUsadas: [...(prev.piezasUsadas||[]), { descripcion: '', cantidad: 1, precio: 0 }] }))
  }

  function updatePieza(index, field, value) {
    setForm(prev => {
      const arr = [...(prev.piezasUsadas||[])]
      let v = value
      if (field === 'cantidad') v = Math.max(1, Number(value) || 0)
      if (field === 'precio') v = Math.max(0, Number(value) || 0)
      arr[index] = { ...arr[index], [field]: v }
      return { ...prev, piezasUsadas: arr }
    })
  }

  // select a product from suggestions and persist immediately
  async function selectProductForIndex(index, product) {
    // clear suggestions immediately
    setProductSuggestions(prev => ({ ...prev, [index]: [] }))
    setProductLoading(prev => ({ ...prev, [index]: false }))
    setProductSelected(prev => ({ ...prev, [index]: true }))

    // build updated piezas array using latest form from ref
    const currentForm = formRef.current || { piezasUsadas: [] }
    const currentArr = Array.isArray(currentForm.piezasUsadas) ? [...currentForm.piezasUsadas] : []
    const selected = {
      ...(currentArr[index] || {}),
      descripcion: product.name || product.title || product.slug || '',
      sku: product.sku || '',
      precio: Number(product.price || product.regular_price || 0) || 0,
      woocommerceId: product.id
    }
    currentArr[index] = selected

    // update local state
    setForm(prev => ({ ...prev, piezasUsadas: currentArr }))

    // persist immediately
    try {
      const updated = await storageService.updateOrden(id, { piezasUsadas: currentArr, updatedAt: Date.now() })
      setOrden(updated)
      setForm(prev => ({ ...prev, piezasUsadas: updated.piezasUsadas || currentArr }))
    } catch (e) {
      console.warn('Error guardando pieza seleccionada', e)
    }
  }

  // Search products helper (debounced per index) - Direct WooCommerce
  function searchProductsForIndex(index, term) {
    if (!term || String(term).trim().length < 2) {
      setProductSuggestions(prev => ({ ...prev, [index]: [] }))
      setProductLoading(prev => ({ ...prev, [index]: false }))
      return
    }

    // clear previous timer
    if (searchTimers.current[index]) clearTimeout(searchTimers.current[index])
    setProductLoading(prev => ({ ...prev, [index]: true }))
    searchTimers.current[index] = setTimeout(async () => {
      try {
        const WC_URL = import.meta.env.VITE_WC_URL || 'https://sieeg.com.mx'
        const WC_KEY = import.meta.env.VITE_WC_KEY || ''
        const WC_SECRET = import.meta.env.VITE_WC_SECRET || ''

        if (!WC_KEY || !WC_SECRET) {
          console.warn('WooCommerce credentials not configured. Add VITE_WC_KEY and VITE_WC_SECRET to .env.local')
          setProductSuggestions(prev => ({ ...prev, [index]: [] }))
          setProductLoading(prev => ({ ...prev, [index]: false }))
          return
        }

        const url = new URL(`${WC_URL}/wp-json/wc/v3/products`)
        url.searchParams.append('consumer_key', WC_KEY)
        url.searchParams.append('consumer_secret', WC_SECRET)
        url.searchParams.append('search', term)
        url.searchParams.append('per_page', '10')

        const res = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })

        if (!res.ok) {
          throw new Error(`WooCommerce error: ${res.status}`)
        }

        const results = await res.json()
        setProductSuggestions(prev => ({ ...prev, [index]: results || [] }))
      } catch (e) {
        console.warn('Error buscando productos en WooCommerce:', e)
        setProductSuggestions(prev => ({ ...prev, [index]: [] }))
      } finally {
        setProductLoading(prev => ({ ...prev, [index]: false }))
      }
    }, 350)
  }

  function optimizeSignatureDataUrl(sourceCanvas, maxWidth = 800, quality = 0.75) {
    if (!sourceCanvas) return null
    try {
      const w = sourceCanvas.width
      const h = sourceCanvas.height
      const ratio = w > maxWidth ? (maxWidth / w) : 1
      const tw = Math.round(w * ratio)
      const th = Math.round(h * ratio)

      const tmp = document.createElement('canvas')
      tmp.width = tw
      tmp.height = th
      const ctx = tmp.getContext('2d')
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, tw, th)
      ctx.drawImage(sourceCanvas, 0, 0, tw, th)
      return tmp.toDataURL('image/jpeg', quality)
    } catch (e) {
      try { return sourceCanvas.toDataURL('image/png') } catch (err) { return null }
    }
  }

  function removePieza(index) {
    setForm(prev => {
      const arr = [...(prev.piezasUsadas||[])]
      arr.splice(index,1)
      return { ...prev, piezasUsadas: arr }
    })
  }

  async function handleSave() {
    setLoading(true)
    for (const p of (form.piezasUsadas||[])) {
      if (!p.descripcion || String(p.descripcion).trim() === '') { alert('Cada pieza necesita descripción'); setLoading(false); return }
      if ((p.cantidad || 0) < 1) { alert('La cantidad debe ser al menos 1'); setLoading(false); return }
      if ((p.precio || 0) < 0) { alert('El precio no puede ser negativo'); setLoading(false); return }
    }

    const patch = {
      diagnostico: form.diagnostico,
      trabajosRealizados: form.trabajosRealizados,
      piezasUsadas: form.piezasUsadas,
      costoTotal: Number(form.costoTotal) || 0,
      fechaEstimada: form.fechaEstimada,
      fechaFinalizacion: form.fechaFinalizacion,
      fechaEntrega: form.fechaEntrega,
      quienRecibe: form.quienRecibe,
      estado: form.estado,
      actualizadoPor: 'local'
    }
    const updated = await storageService.updateOrden(id, patch)
    setOrden(updated)
    setLoading(false)
    alert('Orden actualizada')
  }

  async function saveTechnicianSignature() {
    if (!techCanvasRef.current) return
    setSavingTechSig(true)
    try {
      const dataUrl = optimizeSignatureDataUrl(techCanvasRef.current, 800, 0.75)
      if (!dataUrl) throw new Error('No signature')
      const updated = await storageService.updateOrden(id, { firmaTecnico: dataUrl, updatedAt: Date.now() })
      setOrden(updated)
      setForm(prev => ({ ...prev }))
      setShowTechCanvas(false)
      alert('Firma del técnico guardada')
    } catch (e) {
      console.warn(e)
      alert('Error guardando firma del técnico')
    } finally {
      setSavingTechSig(false)
    }
  }

  function clearTechCanvas() {
    const c = techCanvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')
    ctx.clearRect(0, 0, c.width, c.height)
  }

  useEffect(() => {
    const canvas = techCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#0078ff'
    let drawing = false

    function getPosFromMouse(e) {
      const rect = canvas.getBoundingClientRect()
      return { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }
    function getPosFromTouch(e) {
      const rect = canvas.getBoundingClientRect()
      const t = e.touches[0] || e.changedTouches[0]
      return { x: t.clientX - rect.left, y: t.clientY - rect.top }
    }

    function start(e) { drawing = true; ctx.beginPath(); const p = e.type.startsWith('touch') ? getPosFromTouch(e) : getPosFromMouse(e); ctx.moveTo(p.x, p.y); e.preventDefault && e.preventDefault() }
    function move(e) { if (!drawing) return; const p = e.type.startsWith('touch') ? getPosFromTouch(e) : getPosFromMouse(e); ctx.lineTo(p.x, p.y); ctx.stroke(); e.preventDefault && e.preventDefault() }
    function end(e) { drawing = false; e && e.preventDefault && e.preventDefault() }

    canvas.addEventListener('mousedown', start)
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', end)
    canvas.addEventListener('touchstart', start, { passive: false })
    window.addEventListener('touchmove', move, { passive: false })
    window.addEventListener('touchend', end, { passive: false })

    return () => {
      canvas.removeEventListener('mousedown', start)
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', end)
      canvas.removeEventListener('touchstart', start)
      window.removeEventListener('touchmove', move)
      window.removeEventListener('touchend', end)
    }
  }, [techCanvasRef.current, showTechCanvas])

  async function sendCotizacionWhatsApp() {
    try {
      await downloadOrdenPDF(orden)
      const phone = orden.cliente?.telefono ? orden.cliente.telefono.replace(/[^0-9]/g, '') : '529613336529'
      const text = encodeURIComponent(`Cotización para la orden ${orden.folio} - Por favor revisa el archivo PDF adjunto. Si tienes preguntas, contáctanos.`)
      const waUrl = `https://wa.me/${phone}?text=${text}`
      window.open(waUrl, '_blank')
      try { await storageService.addLog(orden.id || id, 'send_quote', { method: 'download_and_open_wa', telefono: phone }) } catch (e) {}
    } catch (e) {
      console.warn('Error enviando cotización:', e)
      alert('Ocurrió un error generando la cotización')
    }
  }

  async function sendCotizacionLink() {
    try {
      const doc = await generateOrdenPDF(orden)
      const blob = doc.output('blob')
      const fileName = `Orden_${orden.folio || 'servicio'}.pdf`
      const uploadId = await storageService.saveUpload(orden.id || id, fileName, blob)
      if (!uploadId) throw new Error('No se pudo guardar el archivo localmente')
      const url = `${window.location.origin}/download/${uploadId}`
      try { await storageService.addLog(orden.id || id, 'send_quote_link', { uploadId, filename: fileName, url }) } catch (e) {}
      const phone = orden.cliente?.telefono ? orden.cliente.telefono.replace(/[^0-9]/g, '') : '529613336529'
      const text = encodeURIComponent(`Cotización para la orden ${orden.folio}. Descarga aquí: ${url} (enlace local, válido en este navegador).`)
      const waUrl = `https://wa.me/${phone}?text=${text}`
      window.open(waUrl, '_blank')
    } catch (e) {
      console.warn('Error creando link de cotización:', e)
      alert('No se pudo crear el enlace local para la cotización')
    }
  }

  useEffect(() => {
    const piezas = form.piezasUsadas || []
    const sum = piezas.reduce((acc, p) => acc + ((Number(p.cantidad) || 0) * (Number(p.precio) || 0)), 0)
    if (form.costoTotal !== sum) setForm(prev => ({ ...prev, costoTotal: sum }))
  }, [form.piezasUsadas])

  // cleanup pending search timers on unmount
  useEffect(() => {
    return () => {
      try { Object.values(searchTimers.current).forEach(t => clearTimeout(t)) } catch (e) {}
    }
  }, [])

  const getEstadoBadgeClass = (estado) => {
    const badges = {
      'Pendiente': 'bg-gray-400 text-white',
      'En revisión': 'bg-yellow-400 text-yellow-900',
      'En reparación': 'bg-[#0078ff] text-white',
      'Listo': 'bg-green-500 text-white',
      'Entregado': 'bg-gray-500 text-white'
    }
    return badges[estado] || badges['Pendiente']
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-[#0078ff] border-r-transparent mb-4"></div>
        <p className="text-gray-600">Cargando orden...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      {/* Header con gradiente */}
      <div className="bg-gradient-to-r from-[#0078ff] to-[#66b3ff] rounded-2xl shadow-xl p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Orden {orden.folio}</h1>
            <p className="text-blue-100">Gestión de orden de servicio</p>
          </div>
          <div className="flex gap-3">
            <span className={`px-4 py-2 rounded-full font-semibold ${getEstadoBadgeClass(orden.estado)}`}>
              {orden.estado}
            </span>
            <button 
              onClick={() => navigate('/ordenes')} 
              className="px-4 py-2 bg-white text-[#0078ff] rounded-lg hover:bg-blue-50 font-semibold transition-all shadow-md hover:shadow-lg"
            >
              ← Volver
            </button>
          </div>
        </div>
      </div>

      {/* Banner de Orden Cancelada */}
      {orden.estado === 'Cancelado' && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-800 mb-1">Orden Cancelada</h3>
              <p className="text-red-700 text-sm mb-2">Esta orden ha sido cancelada y no puede ser modificada.</p>
              {orden.motivoCancelacion && (
                <div className="bg-white border border-red-200 rounded p-3 mt-3">
                  <p className="text-sm font-semibold text-red-900 mb-1">Motivo de cancelación:</p>
                  <p className="text-red-800 text-sm">{orden.motivoCancelacion}</p>
                  {orden.fechaCancelacion && (
                    <p className="text-xs text-red-600 mt-2">Cancelada el {orden.fechaCancelacion}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cards principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Cliente */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-[#0078ff] hover:shadow-xl transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[#0078ff] to-[#66b3ff] rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800">Cliente</h3>
          </div>
          <div className="space-y-2">
            <p className="text-lg font-semibold text-gray-900">{orden.cliente?.nombre}</p>
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              {orden.cliente?.telefono}
            </p>
            {orden.cliente?.correo && (
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {orden.cliente?.correo}
              </p>
            )}
          </div>
          {orden.firmaCliente && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <label className="block text-xs font-semibold text-gray-500 mb-2">FIRMA DEL CLIENTE</label>
              <img src={orden.firmaCliente} alt="firma" className="w-full h-24 object-contain border-2 border-gray-200 rounded-lg bg-gray-50" />
            </div>
          )}
        </div>

        {/* Equipo */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-[#0078ff] hover:shadow-xl transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[#0078ff] to-[#66b3ff] rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800">Equipo</h3>
          </div>
          <div className="space-y-2">
            <p className="text-lg font-semibold text-gray-900">{orden.equipo?.tipo} {orden.equipo?.marca}</p>
            <p className="text-sm text-gray-600">Modelo: <span className="font-medium">{orden.equipo?.modelo}</span></p>
            <p className="text-xs text-gray-500">S/N: {orden.equipo?.numeroSerie}</p>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <label className="block text-xs font-semibold text-gray-500 mb-2">TÉCNICO ASIGNADO</label>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">{orden.tecnicoNombre || orden.tecnicoAsignado || 'No asignado'}</span>
              {canSign && orden.tecnicoNombre && !orden.firmaTecnico && (
                <button 
                  onClick={()=>setShowTechCanvas(true)} 
                  className="px-3 py-1 text-xs bg-[#0078ff] text-white rounded-lg hover:bg-[#0066dd] transition-colors font-semibold"
                >
                  Firmar
                </button>
              )}
            </div>

            {orden.firmaTecnico && (
              <div className="mt-4">
                <label className="block text-xs font-semibold text-gray-500 mb-2">FIRMA DEL TÉCNICO</label>
                <img src={orden.firmaTecnico} alt="firma-tecnico" className="w-full h-24 object-contain border-2 border-gray-200 rounded-lg bg-gray-50" />
              </div>
            )}

            {showTechCanvas && (
              <div className="mt-4 p-4 border-2 border-[#0078ff] rounded-xl bg-blue-50">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Dibuja tu firma:</label>
                <canvas ref={techCanvasRef} width={600} height={120} className="w-full h-28 bg-white rounded-lg shadow-inner border border-gray-300" />
                <div className="mt-3 flex gap-2">
                  <button 
                    onClick={clearTechCanvas} 
                    className="px-3 py-2 border-2 border-gray-300 rounded-lg text-sm hover:bg-gray-100 transition-colors font-medium"
                  >
                    Limpiar
                  </button>
                  <button 
                    onClick={saveTechnicianSignature} 
                    disabled={savingTechSig} 
                    className="flex-1 px-4 py-2 bg-[#0078ff] text-white rounded-lg text-sm hover:bg-[#0066dd] transition-colors font-semibold disabled:opacity-50"
                  >
                    {savingTechSig ? 'Guardando...' : 'Guardar Firma'}
                  </button>
                  <button 
                    onClick={()=>setShowTechCanvas(false)} 
                    className="px-3 py-2 border-2 border-gray-300 rounded-lg text-sm hover:bg-gray-100 transition-colors font-medium"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Estado */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-[#0078ff] hover:shadow-xl transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[#0078ff] to-[#66b3ff] rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800">Estado</h3>
          </div>
          {canEdit ? (
            <select 
              value={form.estado} 
              onChange={(e)=>updateField('estado', e.target.value)} 
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-[#0078ff] focus:ring-2 focus:ring-blue-200 transition-all font-medium"
            >
              <option>Pendiente</option>
              <option>En revisión</option>
              <option>En reparación</option>
              <option>Listo</option>
              <option>Entregado</option>
            </select>
          ) : (
            <div className={`p-4 rounded-lg text-center font-semibold ${getEstadoBadgeClass(orden.estado)}`}>
              {orden.estado}
            </div>
          )}
        </div>
      </div>

      {/* Información de Entrega */}
      {(orden?.estado === 'Entregado' || (form.fechaEntrega && form.quienRecibe)) && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-t-4 border-emerald-500 hover:shadow-xl transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-400 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800">Información de Entrega</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha de Entrega</label>
              {canEdit ? (
                <input
                  type="date"
                  value={form.fechaEntrega}
                  onChange={(e) => updateField('fechaEntrega', e.target.value)}
                  className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all font-medium"
                />
              ) : (
                <div className="p-3 border-2 border-emerald-200 rounded-lg bg-emerald-50 font-medium text-gray-800">
                  {form.fechaEntrega || (orden?.fechaEntrega ? orden.fechaEntrega : 'No registrada')}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">¿Quién Recibe?</label>
              {canEdit ? (
                <input
                  type="text"
                  value={form.quienRecibe}
                  onChange={(e) => updateField('quienRecibe', e.target.value)}
                  placeholder="Nombre de quien recibe..."
                  className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
                />
              ) : (
                <div className="p-3 border-2 border-emerald-200 rounded-lg bg-emerald-50 font-medium text-gray-800">
                  {form.quienRecibe || (orden?.quienRecibe ? orden.quienRecibe : 'No registrado')}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Diagnóstico */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-l-4 border-[#0078ff]">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <svg className="w-6 h-6 text-[#0078ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Diagnóstico
        </h3>
        {canEdit ? (
          <textarea 
            value={form.diagnostico} 
            onChange={(e)=>updateField('diagnostico', e.target.value)} 
            className="w-full p-4 border-2 border-gray-300 rounded-lg h-32 focus:border-[#0078ff] focus:ring-2 focus:ring-blue-200 transition-all" 
            placeholder="Describe el diagnóstico del equipo..."
          />
        ) : (
          <div className="p-4 border-2 border-gray-200 rounded-lg min-h-[8rem] whitespace-pre-wrap bg-gray-50">
            {orden.diagnostico || <span className="text-gray-400">Sin diagnóstico registrado</span>}
          </div>
        )}
      </div>

      {/* Trabajos realizados o Servicio Foráneo */}
      {isServicioForaneo(trabajosView) ? (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-l-4 border-cyan-500">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-2">
              <svg className="w-6 h-6 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              Bitácora de Mantenimiento (Servicio Foráneo)
            </h3>
            <p className="text-sm text-gray-600">Registro de mantenimiento preventivo de aire acondicionado</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border px-2 py-2 text-left font-semibold text-gray-700">Área</th>
                  <th className="border px-2 py-2 text-center font-semibold text-gray-700">Filtros</th>
                  <th className="border px-2 py-2 text-center font-semibold text-gray-700">Condensadora</th>
                  <th className="border px-2 py-2 text-center font-semibold text-gray-700">Presión Gas</th>
                  <th className="border px-2 py-2 text-center font-semibold text-gray-700">Evaporadora</th>
                  <th className="border px-2 py-2 text-center font-semibold text-gray-700">Revisión Eléctrica</th>
                  <th className="border px-2 py-2 text-left font-semibold text-gray-700">Observaciones</th>
                </tr>
              </thead>
              <tbody>
                {trabajosView.map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="border px-2 py-2 font-semibold text-gray-700">{row.area || '-'}</td>
                    <td className="border px-2 py-2 text-center"><span className={`inline-block px-2 py-1 rounded text-xs font-bold ${row.limpiezaFiltros === 'SI' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{row.limpiezaFiltros || '-'}</span></td>
                    <td className="border px-2 py-2 text-center"><span className={`inline-block px-2 py-1 rounded text-xs font-bold ${row.limpiezaCondensadora === 'SI' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{row.limpiezaCondensadora || '-'}</span></td>
                    <td className="border px-2 py-2 text-center font-mono text-gray-700">{row.presionGas || '-'}</td>
                    <td className="border px-2 py-2 text-center"><span className={`inline-block px-2 py-1 rounded text-xs font-bold ${row.limpiezaEvaporadora === 'SI' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{row.limpiezaEvaporadora || '-'}</span></td>
                    <td className="border px-2 py-2 text-xs text-gray-700">{row.revisionElectrica || '-'}</td>
                    <td className="border px-2 py-2 text-gray-700 font-semibold">{row.observaciones || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-l-4 border-[#0078ff]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <svg className="w-6 h-6 text-[#0078ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Trabajos realizados
            </h3>
            {canEdit && (
              <button 
                onClick={addTrabajo} 
                className="px-4 py-2 bg-[#0078ff] text-white rounded-lg hover:bg-[#0066dd] transition-colors font-semibold text-sm flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Agregar
              </button>
            )}
          </div>
          <div className="space-y-3">
            {trabajosView.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <svg className="w-16 h-16 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                No hay trabajos registrados
              </div>
            ) : (
              trabajosView.map((t, idx) => (
                <div key={idx} className="flex gap-3 items-center">
                  {canEdit ? (
                    <>
                      <input 
                        value={typeof t === 'string' ? t : JSON.stringify(t)} 
                        onChange={(e)=>updateTrabajo(idx, e.target.value)} 
                        className="flex-1 p-3 border-2 border-gray-300 rounded-lg focus:border-[#0078ff] focus:ring-2 focus:ring-blue-200 transition-all"
                        placeholder="Describe el trabajo realizado..."
                      />
                      <button 
                        onClick={()=>removeTrabajo(idx)} 
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold"
                      >
                        Eliminar
                      </button>
                    </>
                  ) : (
                    <div className="flex-1 p-3 border-2 border-gray-200 rounded-lg bg-gray-50">{typeof t === 'string' ? t : JSON.stringify(t)}</div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Piezas usadas */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-l-4 border-[#0078ff]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <svg className="w-6 h-6 text-[#0078ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Piezas usadas
          </h3>
          {canEdit && (
            <button 
              onClick={addPieza} 
              className="px-4 py-2 bg-[#0078ff] text-white rounded-lg hover:bg-[#0066dd] transition-colors font-semibold text-sm flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Agregar pieza
            </button>
          )}
        </div>
        <div className="space-y-3">
          {((canEdit ? (form.piezasUsadas||[]) : (orden.piezasUsadas||[])) || []).length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <svg className="w-16 h-16 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              No hay piezas registradas
            </div>
          ) : (
            (canEdit ? (form.piezasUsadas||[]) : (orden.piezasUsadas||[])).map((p, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-3 items-center">
                {canEdit ? (
                  <>
                    <div className="col-span-6 relative">
                      <input 
                        value={p.descripcion} 
                        onChange={(e)=>{ setProductSelected(prev=>({ ...prev, [idx]: false })); updatePieza(idx,'descripcion', e.target.value); searchProductsForIndex(idx, e.target.value) }} 
                        onFocus={()=>{ if(!productSelected[idx] && (!productSuggestions[idx] || productSuggestions[idx].length===0)) searchProductsForIndex(idx, p.descripcion || '') }}
                        onClick={()=>{ if(!productSelected[idx] && (!productSuggestions[idx] || productSuggestions[idx].length===0)) searchProductsForIndex(idx, p.descripcion || '') }}
                        placeholder="Descripción de la pieza" 
                        autoComplete="off"
                        className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-[#0078ff] focus:ring-2 focus:ring-blue-200 transition-all" 
                      />

                      {(productLoading[idx] || (productSuggestions[idx] && productSuggestions[idx].length > 0)) && (
                        <div className="absolute left-0 right-0 mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-lg z-50 max-h-48 overflow-auto">
                          {productLoading[idx] ? (
                            <div className="px-3 py-2 text-sm text-gray-600">Buscando...</div>
                          ) : (
                            productSuggestions[idx].map((prod) => (
                              <button key={prod.id} type="button" onClick={()=>selectProductForIndex(idx, prod)} className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-3">
                                {prod.images && prod.images[0] && prod.images[0].src ? (
                                  <img src={prod.images[0].src} alt={prod.name} className="w-10 h-10 object-cover rounded" />
                                ) : (
                                  <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-400">IMG</div>
                                )}
                                <div className="flex-1">
                                  <div className="font-medium text-sm">{prod.name}</div>
                                  <div className="text-xs text-gray-500">SKU: {prod.sku || '-'}</div>
                                </div>
                                <div className="text-sm font-semibold text-[#0078ff]">${Number(prod.price || prod.regular_price || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                    <input 
                      type="number" 
                      value={p.cantidad} 
                      onChange={(e)=>updatePieza(idx,'cantidad', Number(e.target.value))} 
                      placeholder="Cant" 
                      className="col-span-2 p-3 border-2 border-gray-300 rounded-lg focus:border-[#0078ff] focus:ring-2 focus:ring-blue-200 transition-all" 
                    />
                    <input 
                      type="number" 
                      value={p.precio} 
                      onChange={(e)=>updatePieza(idx,'precio', Number(e.target.value))} 
                      placeholder="Precio" 
                      className="col-span-2 p-3 border-2 border-gray-300 rounded-lg focus:border-[#0078ff] focus:ring-2 focus:ring-blue-200 transition-all" 
                    />
                    <button 
                      onClick={()=>removePieza(idx)} 
                      className="col-span-2 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold"
                    >
                      Eliminar
                    </button>
                  </>
                ) : (
                  <>
                    <div className="col-span-6 p-3 border-2 border-gray-200 rounded-lg bg-gray-50">{p.descripcion}</div>
                    <div className="col-span-2 p-3 border-2 border-gray-200 rounded-lg bg-gray-50 text-center font-semibold">{p.cantidad}</div>
                    <div className="col-span-2 p-3 border-2 border-gray-200 rounded-lg bg-gray-50 text-center font-semibold">${p.precio}</div>
                    <div className="col-span-2"></div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
        <div className="mt-6 pt-6 border-t-2 border-gray-200">
          <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
            <label className="text-lg font-bold text-gray-800">Costo Total:</label>
            <div className="text-3xl font-bold text-[#0078ff]">
              ${Number(form.costoTotal || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex flex-wrap gap-3 mb-6">
        {canEdit && (
          <button 
            onClick={handleSave} 
            className="px-6 py-3 bg-gradient-to-r from-[#0078ff] to-[#66b3ff] text-white rounded-lg hover:from-[#0066dd] hover:to-[#5599ee] transition-all font-bold shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            Guardar cambios
          </button>
        )}
        <button 
          onClick={()=>navigate(`/ordenes/${id}/pdf`)} 
          className="px-6 py-3 bg-white border-2 border-[#0078ff] text-[#0078ff] rounded-lg hover:bg-blue-50 transition-all font-bold shadow-md hover:shadow-lg flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          Generar PDF
        </button>
        <button 
          onClick={async () => {
            try { await printOrdenPDF({ ...orden, ...form }) } catch (e) { console.error('Error al imprimir PDF', e); alert('No se pudo imprimir el PDF') }
          }} 
          className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all font-bold shadow-md hover:shadow-lg flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm0 0V9a2 2 0 012-2h6a2 2 0 012 2v12" />
          </svg>
          Imprimir
        </button>
        <button 
          onClick={async () => {
            try { await printOrdenTicketPDF({ ...orden, ...form }) } catch (e) { console.error('Error al imprimir ticket', e); alert('No se pudo imprimir el ticket') }
          }} 
          className="px-6 py-3 bg-white border-2 border-gray-400 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-bold shadow-md hover:shadow-lg flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m-6 4h6m-6 4h6M7 3h10a2 2 0 012 2v2a2 2 0 010 4 2 2 0 010 4 2 2 0 010 4v2a2 2 0 01-2 2H7a2 2 0 01-2-2v-2a2 2 0 010-4 2 2 0 010-4 2 2 0 010-4V5a2 2 0 012-2z" />
          </svg>
          Imprimir ticket
        </button>
        {canEdit && (
          <>
            <button 
              onClick={sendCotizacionWhatsApp} 
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-bold shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              Enviar cotización (WhatsApp)
            </button>
            <button 
              onClick={sendCotizacionLink} 
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-bold shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Enviar cotización (Link)
            </button>
          </>
        )}
      </div>


    </div>
  )
}