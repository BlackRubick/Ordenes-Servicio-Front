import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Save, FileText, Trash2, Check, User, Smartphone, Shield, AlertCircle, Pencil } from 'lucide-react'
import { downloadOrdenPDF } from '../../services/pdf.service'
import { storageService } from '../../services/storage.service'
import { generateFolio } from '../../utils/folio'
import { findTechnicians } from '../../services/user.service'
import { useAuth } from '../../context/AuthContext'

function PatternLock({ value, onChange }) {
  const canvasRef = useRef(null)
  const [pattern, setPattern] = useState([])
  const [drawing, setDrawing] = useState(false)
  const points = useRef([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    
    points.current = []
    const spacing = 60
    const offsetX = 30
    const offsetY = 30
    
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const x = offsetX + col * spacing
        const y = offsetY + row * spacing
        points.current.push({ x, y, id: row * 3 + col })
        
        ctx.beginPath()
        ctx.arc(x, y, 15, 0, Math.PI * 2)
        ctx.fillStyle = pattern.includes(row * 3 + col) ? '#0ea5e9' : '#e0f2fe'
        ctx.fill()
        ctx.strokeStyle = '#0ea5e9'
        ctx.lineWidth = 2
        ctx.stroke()
      }
    }
    
    if (pattern.length > 1) {
      ctx.beginPath()
      ctx.strokeStyle = '#0ea5e9'
      ctx.lineWidth = 3
      const firstPoint = points.current[pattern[0]]
      ctx.moveTo(firstPoint.x, firstPoint.y)
      
      for (let i = 1; i < pattern.length; i++) {
        const point = points.current[pattern[i]]
        ctx.lineTo(point.x, point.y)
      }
      ctx.stroke()
    }
  }, [pattern])

  function handleMouseDown(e) {
    setDrawing(true)
    handleMouseMove(e)
  }

  function handleMouseMove(e) {
    if (!drawing && e.type === 'mousemove') return
    
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    for (const point of points.current) {
      const distance = Math.sqrt((x - point.x) ** 2 + (y - point.y) ** 2)
      if (distance < 20 && !pattern.includes(point.id)) {
        const newPattern = [...pattern, point.id]
        setPattern(newPattern)
        onChange(newPattern.join('-'))
        break
      }
    }
  }

  function handleMouseUp() {
    setDrawing(false)
  }

  function clearPattern() {
    setPattern([])
    onChange('')
  }

  return (
    <div className="space-y-2">
      <div className="border-2 border-sky-200 rounded-xl p-4 bg-sky-50 inline-block">
        <canvas
          ref={canvasRef}
          width={180}
          height={180}
          className="cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={clearPattern}
          className="text-sm px-3 py-1.5 border-2 border-sky-300 rounded-lg hover:bg-sky-50 flex items-center gap-1 text-sky-700 font-semibold transition"
        >
          <Trash2 className="w-3 h-3" />
          Limpiar
        </button>
        {pattern.length > 0 && (
          <span className="text-sm text-sky-700 flex items-center gap-1 font-medium">
            <Check className="w-4 h-4 text-emerald-600" />
            Patrón: {pattern.join('-')}
          </span>
        )}
      </div>
    </div>
  )
}

export default function NuevaOrden() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    folio: generateFolio(),
    fechaIngreso: new Date().toISOString().slice(0,10),
    estado: 'Pendiente',
    cliente: { nombre: '', telefono: '', correo: '' },
    equipo: { tipo: '', marca: '', modelo: '', numeroSerie: '' },
    accesorios: { cargador: false, simCard: false, bandejaSIM: false, memoriaSD: false, funda: false, cable: false, otro: '', patron: '' },
    contrasena: '',
    descripcionFalla: '',
    comentarios: '',
    tecnicoUid: '',
    tecnicoNombre: ''
  })

  const canvasRef = useRef(null)
  const drawing = useRef(false)
  const techCanvasRef = useRef(null)
  const drawingTech = useRef(false)
  const [showDraftSaved, setShowDraftSaved] = useState(false)
  const [showTechSaved, setShowTechSaved] = useState(false)
  const [errors, setErrors] = useState({})
  const draftKey = 'nuevo_orden_draft'

  useEffect(() => {
    // Clear any previous draft when opening the New Order page so the form is fresh
    try { localStorage.removeItem(draftKey) } catch (e) {}
  }, [])

  // drawing handlers for technician signature canvas (on create page)
  useEffect(() => {
    const canvas = techCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#0f172a'

    function getPosFromMouse(e) {
      const rect = canvas.getBoundingClientRect()
      return { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }
    function getPosFromTouch(e) {
      const rect = canvas.getBoundingClientRect()
      const t = e.touches[0] || e.changedTouches[0]
      return { x: t.clientX - rect.left, y: t.clientY - rect.top }
    }

    function start(e) {
      drawingTech.current = true
      ctx.beginPath()
      const p = e.type && e.type.startsWith && e.type.startsWith('touch') ? getPosFromTouch(e) : getPosFromMouse(e)
      ctx.moveTo(p.x, p.y)
      if (e.cancelable) e.preventDefault()
    }
    function move(e) {
      if (!drawingTech.current) return
      const p = e.type && e.type.startsWith && e.type.startsWith('touch') ? getPosFromTouch(e) : getPosFromMouse(e)
      ctx.lineTo(p.x, p.y)
      ctx.stroke()
      if (e.cancelable) e.preventDefault()
    }
    function end(e) { drawingTech.current = false; if (e && e.cancelable) e.preventDefault() }

    canvas.addEventListener('mousedown', start)
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', end)
    canvas.addEventListener('touchstart', start, { passive: false })
    // attach touchmove/end to the canvas only to avoid interfering with page scrolling
    canvas.addEventListener('touchmove', move, { passive: false })
    canvas.addEventListener('touchend', end, { passive: false })

    return () => {
      canvas.removeEventListener('mousedown', start)
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', end)
      canvas.removeEventListener('touchstart', start)
      canvas.removeEventListener('touchmove', move)
      canvas.removeEventListener('touchend', end)
    }
  }, [techCanvasRef.current])

  const { user } = useAuth()
  const [tecnicos, setTecnicos] = useState([])

  useEffect(() => {
    setTecnicos(findTechnicians())
    if (user?.rol === 'tecnico') {
      setFormData(prev => ({ ...prev, tecnicoUid: user.uid, tecnicoNombre: user.nombre || user.email }))
    }
  }, [user])

  useEffect(() => {
    const t = setTimeout(() => {
      localStorage.setItem(draftKey, JSON.stringify(formData))
    }, 500)
    return () => clearTimeout(t)
  }, [formData])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#0ea5e9'
    
    function getPosFromMouse(e) {
      const rect = canvas.getBoundingClientRect()
      return { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }

    function getPosFromTouch(e) {
      const rect = canvas.getBoundingClientRect()
      const t = e.touches[0] || e.changedTouches[0]
      return { x: t.clientX - rect.left, y: t.clientY - rect.top }
    }

    function start(e) {
      drawing.current = true
      ctx.beginPath()
      const p = e.type && e.type.startsWith && e.type.startsWith('touch') ? getPosFromTouch(e) : getPosFromMouse(e)
      ctx.moveTo(p.x, p.y)
      if (e.cancelable) e.preventDefault()
    }

    function move(e) {
      if (!drawing.current) return
      const p = e.type && e.type.startsWith && e.type.startsWith('touch') ? getPosFromTouch(e) : getPosFromMouse(e)
      ctx.lineTo(p.x, p.y)
      ctx.stroke()
      if (e.cancelable) e.preventDefault()
    }

    function end(e) { drawing.current = false; if (e && e.cancelable) e.preventDefault() }

    canvas.addEventListener('mousedown', start)
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', end)
    canvas.addEventListener('touchstart', start, { passive: false })
    // attach touchmove/end to the canvas only to avoid interfering with page scrolling
    canvas.addEventListener('touchmove', move, { passive: false })
    canvas.addEventListener('touchend', end, { passive: false })

    return () => {
      canvas.removeEventListener('mousedown', start)
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', end)
      canvas.removeEventListener('touchstart', start)
      canvas.removeEventListener('touchmove', move)
      canvas.removeEventListener('touchend', end)
    }
  }, [])

  function updateField(path, value) {
    setFormData(prev => {
      const newData = { ...prev }
      const keys = path.split('.')
      let current = newData
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] }
        current = current[keys[i]]
      }
      current[keys[keys.length - 1]] = value
      return newData
    })
  }

  function clearSignature() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0,0,canvas.width,canvas.height)
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

  function saveSignatureToForm() {
    const canvas = canvasRef.current
    if (!canvas) return
    const dataUrl = optimizeSignatureDataUrl(canvas, 800, 0.75)
    if (dataUrl) updateField('firmaCliente', dataUrl)
    setShowDraftSaved(true)
    setTimeout(() => setShowDraftSaved(false), 2000)
  }

  function clearTechSignature() {
    const canvas = techCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0,0,canvas.width,canvas.height)
  }

  function saveTechSignatureToForm() {
    const canvas = techCanvasRef.current
    if (!canvas) return
    const dataUrl = optimizeSignatureDataUrl(canvas, 800, 0.75)
    if (dataUrl) updateField('firmaTecnico', dataUrl)
    setShowTechSaved(true)
    setTimeout(() => setShowTechSaved(false), 2000)
  }

  function getSignatureDataUrl() {
    const canvas = canvasRef.current
    if (!canvas) return null
    try { return optimizeSignatureDataUrl(canvas, 800, 0.75) } catch (e) { return null }
  }

  function saveDraft() {
    localStorage.setItem(draftKey, JSON.stringify(formData))
    setShowDraftSaved(true)
    setTimeout(() => setShowDraftSaved(false), 2000)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    
    const newErrors = {}
    if (!formData.cliente.nombre) newErrors.clienteNombre = 'Nombre requerido'
    if (!formData.equipo.tipo) newErrors.equipoTipo = 'Tipo requerido'
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    const sig = getSignatureDataUrl()
    const techSig = techCanvasRef.current ? optimizeSignatureDataUrl(techCanvasRef.current, 800, 0.75) : null
    const orden = {
      ...formData,
      firmaCliente: sig || formData.firmaCliente || null,
      firmaTecnico: techSig || formData.firmaTecnico || null,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    const created = await storageService.createOrden(orden)
    try {
      await downloadOrdenPDF(created)
    } catch (err) {
      console.warn('Error generating PDF on create', err)
    }

    localStorage.removeItem(draftKey)
    alert('Orden creada exitosamente')
    // navigate to the order detail so assigned technician (or admin) can add technician signature
    try {
      navigate(`/ordenes/${created.id}`)
    } catch (e) {
      // fallback: change location
      try { window.location.href = `/ordenes/${created.id}` } catch(err){}
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-cyan-50 p-3 sm:p-6 lg:p-8">
      {showDraftSaved && (
        <div className="fixed top-4 right-4 bg-gradient-to-r from-emerald-500 to-green-500 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2 z-40 animate-in slide-in-from-top">
          <Check className="w-5 h-5" />
          <span className="font-semibold">Borrador guardado</span>
        </div>
      )}
      
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-sky-500 to-cyan-500 rounded-xl shadow-lg">
              <FileText className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-gray-900">
                Nueva Orden de Servicio
              </h1>
              <p className="text-sm text-gray-600 font-medium">
                Ingrese los datos del equipo y el cliente
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Header Info Card */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border-l-4 border-sky-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Folio</label>
                <input 
                  value={formData.folio}
                  readOnly
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-sky-50 font-mono text-lg font-black text-sky-700" 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Fecha de ingreso</label>
                <input 
                  type="date"
                  value={formData.fechaIngreso}
                  onChange={(e) => updateField('fechaIngreso', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition-all" 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Estado</label>
                <select 
                  value={formData.estado}
                  onChange={(e) => updateField('estado', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition-all font-semibold"
                >
                  <option>Pendiente</option>
                  <option>En revisión</option>
                  <option>En reparación</option>
                  <option>Listo</option>
                  <option>Entregado</option>
                </select>
              </div>
            </div>
          </div>

          {/* Cliente Card */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-sky-100">
            <div className="flex items-center gap-3 mb-5 pb-3 border-b-2 border-sky-100">
              <div className="p-2 bg-sky-100 rounded-lg">
                <User className="w-5 h-5 text-sky-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                Información del Cliente
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input 
                  value={formData.cliente.nombre}
                  onChange={(e) => updateField('cliente.nombre', e.target.value)}
                  placeholder="Nombre completo"
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-sky-400 transition-all ${errors.clienteNombre ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-sky-400'}`}
                />
                {errors.clienteNombre && (
                  <p className="text-red-600 text-xs mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3 h-3" />
                    {errors.clienteNombre}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Teléfono</label>
                <input 
                  value={formData.cliente.telefono}
                  onChange={(e) => updateField('cliente.telefono', e.target.value)}
                  placeholder="9621234567"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Correo</label>
                <input 
                  type="email"
                  value={formData.cliente.correo}
                  onChange={(e) => updateField('cliente.correo', e.target.value)}
                  placeholder="cliente@ejemplo.com"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Equipo Card */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-sky-100">
            <div className="flex items-center gap-3 mb-5 pb-3 border-b-2 border-sky-100">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Smartphone className="w-5 h-5 text-orange-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                Información del Equipo
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Tipo <span className="text-red-500">*</span>
                </label>
                <input 
                  value={formData.equipo.tipo}
                  onChange={(e) => updateField('equipo.tipo', e.target.value)}
                  placeholder="Laptop, Celular, Tablet"
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-sky-400 transition-all ${errors.equipoTipo ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-sky-400'}`}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Marca</label>
                <input 
                  value={formData.equipo.marca}
                  onChange={(e) => updateField('equipo.marca', e.target.value)}
                  placeholder="HP, Samsung, Apple"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Modelo</label>
                <input 
                  value={formData.equipo.modelo}
                  onChange={(e) => updateField('equipo.modelo', e.target.value)}
                  placeholder="Pavilion 15"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Número de Serie</label>
                <input 
                  value={formData.equipo.numeroSerie}
                  onChange={(e) => updateField('equipo.numeroSerie', e.target.value)}
                  placeholder="SN123456789"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Accesorios Card */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-sky-100">
            <div className="flex items-center gap-3 mb-5 pb-3 border-b-2 border-sky-100">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Shield className="w-5 h-5 text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                Accesorios y Seguridad
              </h2>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-3">Accesorios incluidos</label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { key: 'cargador', label: 'Cargador' },
                  { key: 'simCard', label: 'SIM Card' },
                  { key: 'bandejaSIM', label: 'Bandeja SIM' },
                  { key: 'memoriaSD', label: 'Memoria SD' },
                  { key: 'funda', label: 'Funda' },
                  { key: 'cable', label: 'Cable' }
                ].map(item => (
                  <label key={item.key} className="flex items-center p-3 border-2 border-sky-100 rounded-xl hover:bg-sky-50 cursor-pointer transition group">
                    <input 
                      type="checkbox" 
                      checked={formData.accesorios[item.key]}
                      onChange={(e) => updateField(`accesorios.${item.key}`, e.target.checked)}
                      className="mr-2 w-4 h-4 text-sky-600 rounded focus:ring-sky-500" 
                    />
                    <span className="text-sm font-semibold text-gray-700 group-hover:text-sky-700">{item.label}</span>
                  </label>
                ))}
              </div>
              <div className="mt-3">
                <input 
                  value={formData.accesorios.otro}
                  onChange={(e) => updateField('accesorios.otro', e.target.value)}
                  placeholder="Otros accesorios..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Contraseña del Equipo</label>
                <input 
                  type="text"
                  value={formData.contrasena}
                  onChange={(e) => updateField('contrasena', e.target.value)}
                  placeholder="Contraseña o PIN"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Patrón de Desbloqueo</label>
                <PatternLock 
                  value={formData.accesorios.patron}
                  onChange={(pattern) => updateField('accesorios.patron', pattern)}
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">Técnico Asignado</label>
              <select
                value={formData.tecnicoUid}
                onChange={(e) => {
                  const uid = e.target.value
                  const t = findTechnicians().find(x => x.uid === uid)
                  updateField('tecnicoUid', uid)
                  updateField('tecnicoNombre', t ? t.nombre : '')
                }}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition-all font-semibold"
              >
                <option value="">-- Sin asignar --</option>
                {tecnicos.map(t => (
                  <option key={t.uid} value={t.uid}>{t.nombre} — {t.email}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Descripción Card */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-sky-100">
            <div className="flex items-center gap-3 mb-5 pb-3 border-b-2 border-sky-100">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                Descripción del Problema
              </h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Descripción de la falla</label>
                <textarea 
                  value={formData.descripcionFalla}
                  onChange={(e) => updateField('descripcionFalla', e.target.value)}
                  rows={5}
                  placeholder="Describa detalladamente el problema reportado por el cliente..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition-all resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Comentarios / Observaciones</label>
                <textarea 
                  value={formData.comentarios}
                  onChange={(e) => updateField('comentarios', e.target.value)}
                  rows={3}
                  placeholder="Observaciones adicionales, condiciones del equipo, etc..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition-all resize-none"
                />
              </div>
            </div>
          </div>

          {/* Firma Card */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-sky-100">
            <div className="flex items-center gap-3 mb-5 pb-3 border-b-2 border-sky-100">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Pencil className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                Firma del Cliente
              </h2>
            </div>
            <div className="border-2 border-dashed border-sky-300 rounded-2xl p-4 bg-sky-50">
              <canvas 
                ref={canvasRef} 
                width={800} 
                height={150} 
                className="w-full h-36 bg-white rounded-xl cursor-crosshair shadow-sm" 
              />
              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <button 
                  type="button"
                  onClick={clearSignature} 
                  className="w-full sm:w-auto px-4 py-2 sm:px-5 sm:py-2.5 border-2 border-sky-300 rounded-xl hover:bg-sky-50 flex items-center justify-center sm:justify-start gap-2 transition font-semibold text-sky-700"
                >
                  <Trash2 className="w-4 h-4" />
                  Borrar
                </button>
                <button 
                  type="button"
                  onClick={saveSignatureToForm} 
                  className="w-full sm:w-auto px-4 py-2 sm:px-5 sm:py-2.5 bg-gradient-to-r from-sky-500 to-cyan-500 text-white rounded-xl hover:from-sky-600 hover:to-cyan-600 flex items-center justify-center sm:justify-start gap-2 transition font-semibold shadow-lg"
                >
                  <Check className="w-4 h-4" />
                  Guardar firma
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {/* Technician Signature Card */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-sky-100">
            <div className="flex items-center gap-3 mb-5 pb-3 border-b-2 border-sky-100">
              <div className="p-2 bg-gray-100 rounded-lg">
                <User className="w-5 h-5 text-gray-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Firma del Técnico (opcional)</h2>
            </div>
            <div className="border-2 border-dashed border-sky-300 rounded-2xl p-4 bg-sky-50">
              <canvas
                ref={techCanvasRef}
                width={800}
                height={150}
                className="w-full h-36 bg-white rounded-xl cursor-crosshair shadow-sm"
              />
              <div className="mt-4 flex flex-col sm:flex-row gap-3 items-start">
                <button
                  type="button"
                  onClick={clearTechSignature}
                  className="w-full sm:w-auto px-4 py-2 sm:px-5 sm:py-2.5 border-2 border-sky-300 rounded-xl hover:bg-sky-50 flex items-center justify-center sm:justify-start gap-2 transition font-semibold text-sky-700"
                >
                  <Trash2 className="w-4 h-4" />
                  Borrar
                </button>
                <button
                  type="button"
                  onClick={saveTechSignatureToForm}
                  className="w-full sm:w-auto px-4 py-2 sm:px-5 sm:py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 flex items-center justify-center sm:justify-start gap-2 transition font-semibold shadow-lg"
                >
                  <Check className="w-4 h-4" />
                  Guardar firma técnico
                </button>
                {showTechSaved && (
                  <span className="text-sm text-emerald-700 flex items-center gap-2 font-medium">
                    <Check className="w-4 h-4 text-emerald-600" /> Firmado
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={handleSubmit}
              className="flex-1 bg-gradient-to-r from-sky-500 to-cyan-500 text-white px-8 py-4 rounded-xl font-bold hover:from-sky-600 hover:to-cyan-600 transition-all shadow-xl hover:shadow-2xl flex items-center justify-center gap-3 text-lg transform hover:scale-105"
            >
              <FileText className="w-6 h-6" />
              Crear Orden de Servicio
            </button>
            <button 
              onClick={saveDraft}
              className="px-8 py-4 border-2 border-sky-300 rounded-xl font-bold hover:bg-sky-50 transition-all flex items-center justify-center gap-3 text-sky-700 shadow-lg hover:shadow-xl text-lg"
            >
              <Save className="w-6 h-6" />
              Guardar Borrador
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}