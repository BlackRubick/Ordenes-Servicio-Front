import { jsPDF } from 'jspdf'

async function urlToDataUrl(url) {
  try {
    const res = await fetch(url)
    const blob = await res.blob()
    return await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch (e) {
    return null
  }
}

// Detectar si es orden foránea
function isServicioForaneo(trabajos) {
  if (!Array.isArray(trabajos) || trabajos.length === 0) return false
  const first = trabajos[0]
  return first && typeof first === 'object' && ('area' in first || 'presionGas' in first || 'limpiezaFiltros' in first)
}

// Helper para dibujar secciones con encabezado mejorado
function drawSection(doc, x, y, w, h, title) {
  // Sombra sutil
  doc.setFillColor(220, 220, 220)
  doc.rect(x + 2, y + 2, w, h, 'F')
  
  // Fondo del contenedor
  doc.setFillColor(255, 255, 255)
  doc.rect(x, y, w, h, 'F')
  
  // Borde del contenedor
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.5)
  doc.rect(x, y, w, h)
  
  // Header con gradiente simulado
  doc.setFillColor(30, 64, 175) // azul más vibrante
  doc.rect(x, y, w, 28, 'F')
  
  // Línea decorativa en el header
  doc.setFillColor(59, 130, 246) // azul claro
  doc.rect(x, y, 4, 28, 'F')
  
  // Título
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text(title, x + 12, y + 18)
  
  // Reset
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'normal')
}

// Checkbox mejorado con estilo más moderno
function drawCheckbox(doc, x, y, label, checked) {
  // Fondo del checkbox
  if (checked) {
    doc.setFillColor(30, 64, 175)
    doc.roundedRect(x, y, 12, 12, 2, 2, 'FD')
  } else {
    doc.setFillColor(248, 250, 252)
    doc.setDrawColor(203, 213, 225)
    doc.setLineWidth(0.5)
    doc.roundedRect(x, y, 12, 12, 2, 2, 'FD')
  }
  
  if (checked) {
    // Checkmark blanco más elegante
    doc.setDrawColor(255, 255, 255)
    doc.setLineWidth(2)
    doc.line(x + 3, y + 6, x + 5, y + 9)
    doc.line(x + 5, y + 9, x + 9, y + 3)
  }
  
  // Label con mejor contraste
  doc.setFontSize(9.5)
  doc.setTextColor(51, 65, 85)
  doc.setFont('helvetica', 'normal')
  doc.text(label, x + 16, y + 9)
  doc.setTextColor(0, 0, 0)
}

// Campo de texto con estilo mejorado
function drawField(doc, x, y, w, label, value) {
  // Label con estilo moderno
  doc.setFontSize(7.5)
  doc.setTextColor(100, 116, 139)
  doc.setFont('helvetica', 'bold')
  doc.text(label.toUpperCase(), x, y)
  
  // Valor con mejor tipografía
  doc.setFontSize(10)
  doc.setTextColor(15, 23, 42)
  doc.setFont('helvetica', 'normal')
  
  const displayValue = String(value || '—')
  doc.text(displayValue, x + 2, y + 11)
  
  // Línea inferior más sutil pero visible
  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(0.8)
  doc.line(x, y + 14, x + w, y + 14)
}

// Patrón visual mejorado
function drawPatternGrid(doc, x, y, size, patternStr) {
  const spacing = size / 2
  const points = []
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      points.push({ x: x + c * spacing, y: y + r * spacing })
    }
  }

  const indices = String(patternStr || '').split(/[^0-9]+/).map(s => parseInt(s)).filter(n => !Number.isNaN(n))

  // Fondo del grid
  doc.setFillColor(248, 250, 252)
  doc.roundedRect(x - 8, y - 8, size + 16, size + 16, 3, 3, 'F')

  // Líneas de conexión con efecto de profundidad
  if (indices.length > 1) {
    doc.setDrawColor(30, 64, 175)
    doc.setLineWidth(2.5)
    for (let i = 1; i < indices.length; i++) {
      const a = points[indices[i - 1]]
      const b = points[indices[i]]
      if (a && b) doc.line(a.x, a.y, b.x, b.y)
    }
  }

  // Puntos con mejor diseño
  for (let i = 0; i < points.length; i++) {
    const p = points[i]
    const visited = indices.includes(i)
    if (visited) {
      // Sombra
      doc.setFillColor(100, 116, 139)
      try { doc.circle(p.x + 0.5, p.y + 0.5, 5, 'F') } catch (e) { doc.circle(p.x + 0.5, p.y + 0.5, 5) }
      // Punto principal
      doc.setFillColor(30, 64, 175)
      try { doc.circle(p.x, p.y, 5, 'F') } catch (e) { doc.circle(p.x, p.y, 5) }
    } else {
      // Punto inactivo con borde
      doc.setFillColor(255, 255, 255)
      doc.setDrawColor(203, 213, 225)
      doc.setLineWidth(1.5)
      try { doc.circle(p.x, p.y, 4, 'FD') } catch (e) { doc.circle(p.x, p.y, 4) }
    }
  }
}

function getEstadoBadge(estado) {
  const badges = {
    'Pendiente': { color: [148, 163, 184], text: 'PENDIENTE', textColor: [255, 255, 255] },
    'En revisión': { color: [251, 191, 36], text: 'EN REVISIÓN', textColor: [120, 53, 15] },
    'En reparación': { color: [59, 130, 246], text: 'EN REPARACIÓN', textColor: [255, 255, 255] },
    'Listo': { color: [34, 197, 94], text: 'LISTO', textColor: [255, 255, 255] },
    'Entregado': { color: [100, 116, 139], text: 'ENTREGADO', textColor: [255, 255, 255] }
  }
  return badges[estado] || badges['Pendiente']
}

export async function generateOrdenPDF(orden) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidth = 595
  const margin = 40
  let y = 40
  
  // Detectar si es servicio foráneo
  const esForaneo = isServicioForaneo(orden.trabajosRealizados)

  // Si es foráneo, generar PDF simplificado
  if (esForaneo) {
    return generateOrdenForaneoPDF(orden, doc, pageWidth, margin)
  }

  // ============ PÁGINA 1: ORDEN DE SERVICIO (NORMAL) ============
  
  // Fondo decorativo sutil en el header
  doc.setFillColor(248, 250, 252)
  doc.rect(0, 0, pageWidth, 110, 'F')
  
  // Logo
  let logoData = null
  try { logoData = await urlToDataUrl('/sieeg-new.png') } catch (e) {}

  if (logoData) {
    try {
      // Sombra del logo
      doc.setFillColor(200, 200, 200)
      doc.roundedRect(margin + 2, y + 2, 105, 55, 4, 4, 'F')
      // Fondo blanco del logo
      doc.setFillColor(255, 255, 255)
      doc.roundedRect(margin, y, 105, 55, 4, 4, 'F')
      doc.addImage(logoData, 'PNG', margin + 2.5, y + 2.5, 100, 50)
    } catch (e) {}
  }

  // Información empresa con mejor tipografía
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 64, 175)
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(71, 85, 105)
  doc.text('Ingeniería y Telecomunicaciones', margin + 120, y + 38)
  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)
  doc.text('Orden de Servicio', margin + 120, y + 52)
  
  // Caja de folio mejorada con sombra
  const infoBoxX = pageWidth - margin - 170
  // Sombra
  doc.setFillColor(220, 220, 220)
  doc.roundedRect(infoBoxX + 2, y + 2, 170, 58, 6, 6, 'F')
  // Fondo principal
  doc.setFillColor(255, 255, 255)
  doc.roundedRect(infoBoxX, y, 170, 58, 6, 6, 'F')
  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(1)
  doc.roundedRect(infoBoxX, y, 170, 58, 6, 6, 'D')
  
  doc.setFontSize(8)
  doc.setTextColor(100, 116, 139)
  doc.setFont('helvetica', 'bold')
  doc.text('FOLIO', infoBoxX + 10, y + 16)
  
  doc.setFontSize(18)
  doc.setTextColor(30, 64, 175)
  doc.setFont('helvetica', 'bold')
  doc.text(orden.folio || '—', infoBoxX + 10, y + 36)
  
  doc.setFontSize(8.5)
  doc.setTextColor(100, 116, 139)
  doc.setFont('helvetica', 'normal')
  doc.text(orden.fechaIngreso || '—', infoBoxX + 10, y + 50)

  // Badge de estado mejorado
  const badge = getEstadoBadge(orden.estado)
  const badgeX = infoBoxX + 10
  const badgeY = y + 62
  // Sombra del badge
  doc.setFillColor(200, 200, 200)
  doc.roundedRect(badgeX + 1, badgeY + 1, 150, 20, 10, 10, 'F')
  // Badge principal
  doc.setFillColor(...badge.color)
  doc.roundedRect(badgeX, badgeY, 150, 20, 10, 10, 'F')
  doc.setFontSize(8)
  doc.setTextColor(...badge.textColor)
  doc.setFont('helvetica', 'bold')
  const badgeText = badge.text
  const badgeTextWidth = doc.getTextWidth(badgeText)
  doc.text(badgeText, badgeX + (150 - badgeTextWidth) / 2, badgeY + 13)

  y += 90

  // ===== SECCIÓN: INFORMACIÓN DEL CLIENTE =====
  const clientH = 95
  drawSection(doc, margin, y, pageWidth - 2 * margin, clientH, 'INFORMACIÓN DEL CLIENTE')
  
  y += 42
  drawField(doc, margin + 15, y, 235, 'Nombre completo', orden.cliente?.nombre)
  drawField(doc, margin + 270, y, 105, 'Teléfono', orden.cliente?.telefono)
  drawField(doc, margin + 395, y, 115, 'Correo electrónico', orden.cliente?.correo)

  y += clientH - 8

  // ===== SECCIÓN: INFORMACIÓN DEL EQUIPO =====
  const equipoH = 95
  drawSection(doc, margin, y, pageWidth - 2 * margin, equipoH, 'INFORMACIÓN DEL EQUIPO')
  
  y += 42
  drawField(doc, margin + 15, y, 115, 'Tipo de equipo', orden.equipo?.tipo)
  drawField(doc, margin + 145, y, 105, 'Marca', orden.equipo?.marca)
  drawField(doc, margin + 270, y, 105, 'Modelo', orden.equipo?.modelo)
  drawField(doc, margin + 395, y, 115, 'Número de serie', orden.equipo?.numeroSerie)

  y += equipoH - 8

  // ===== SECCIÓN: ACCESORIOS Y SEGURIDAD =====
  const accH = 170
  const accTop = y
  drawSection(doc, margin, accTop, pageWidth - 2 * margin, accH, 'ACCESORIOS Y SEGURIDAD')
  
  y = accTop + 42
  
  // Checkboxes: solo mostrar los accesorios seleccionados
  const checkboxes = [
    ['Cargador', orden.accesorios?.cargador],
    ['SIM Card', orden.accesorios?.simCard],
    ['Bandeja SIM', orden.accesorios?.bandejaSIM],
    ['Memoria SD', orden.accesorios?.memoriaSD],
    ['Funda', orden.accesorios?.funda],
    ['Cable', orden.accesorios?.cable]
  ]
  const selectedCheckboxes = checkboxes.filter(([, checked]) => !!checked)
  const maxCols = 3
  const colWidth = 170
  let cbRows = 0

  if (selectedCheckboxes.length > 0) {
    let cbX = margin + 15
    let cbY = y
    selectedCheckboxes.forEach(([label, checked], i) => {
      drawCheckbox(doc, cbX, cbY, label, checked)
      cbX += colWidth
      const isRowEnd = (i + 1) % maxCols === 0
      if (isRowEnd) {
        cbX = margin + 15
        cbY += 28
      }
    })
    cbRows = Math.ceil(selectedCheckboxes.length / maxCols)
    y = y + (cbRows * 28) + 6
  } else {
    doc.setFontSize(8)
    doc.setTextColor(120, 120, 120)
    doc.text('Sin accesorios marcados', margin + 15, y + 12)
    y = y + 24
  }
  
  // Detectar si hay patrón o contraseña
  const patronVal = orden.accesorios?.patron || orden.patron || ''
  const contrasenaVal = orden.contrasena || ''
  const tienePatron = patronVal && patronVal.trim().length > 0
  const tieneContrasena = contrasenaVal && contrasenaVal.trim().length > 0
  const otrosAccesorios = orden.accesorios?.otro

  // Layout inferior: otros accesorios, patrón y contraseña solo si existen
  let currentX = margin + 15
  const baseY = Math.max(y + 8, accTop + 72)
  let lowerRowHeight = 0

  if (otrosAccesorios && String(otrosAccesorios).trim().length > 0) {
    drawField(doc, currentX, baseY, 220, 'Otros accesorios', otrosAccesorios)
    currentX += 240
    lowerRowHeight = Math.max(lowerRowHeight, 24)
  }

  if (tienePatron) {
    doc.setFontSize(7.5)
    doc.setTextColor(100, 116, 139)
    doc.setFont('helvetica', 'bold')
    doc.text('PATRÓN DE SEGURIDAD', currentX, baseY)
    drawPatternGrid(doc, currentX, baseY + 10, 52, patronVal)
    currentX += 130
    lowerRowHeight = Math.max(lowerRowHeight, 72)
  }

  if (tieneContrasena) {
    const availableWidth = pageWidth - margin - currentX - 20
    drawField(doc, currentX, baseY, Math.max(availableWidth, 120), 'Contraseña', contrasenaVal)
    lowerRowHeight = Math.max(lowerRowHeight, 24)
  }

  // Avanzar dentro de la sección sin romper el recuadro
  y = baseY + lowerRowHeight + 16

  // ===== SECCIÓN: DESCRIPCIÓN DE LA FALLA =====
  const fallaH = 210
  drawSection(doc, margin, y, pageWidth - 2 * margin, fallaH, 'DESCRIPCIÓN DE LA FALLA')
  
  y += 42
  doc.setFontSize(10)
  doc.setTextColor(51, 65, 85)
  doc.setFont('helvetica', 'normal')
  const desc = String(orden.descripcionFalla || 'Sin descripción')
  const splitDesc = doc.splitTextToSize(desc, pageWidth - 2 * margin - 30)
  doc.text(splitDesc, margin + 15, y)

  // Footer mejorado página 1
  doc.setFillColor(248, 250, 252)
  doc.rect(0, 770, pageWidth, 72, 'F')
  doc.setFontSize(7.5)
  doc.setTextColor(100, 116, 139)
  doc.setFont('helvetica', 'normal')
  doc.text('Boulevard Belisario Domínguez #4213 L5, Fracc. La Gloria, Tuxtla Gutiérrez, Chiapas', margin, 785)
  doc.text('Tel: 961 118 0157  •  WhatsApp: 961 333 6529', margin, 797)
  doc.setFontSize(7)
  doc.setTextColor(148, 163, 184)
  doc.text('Página 1 de 2', pageWidth - margin - 60, 797)

  // ============ PÁGINA 2: TÉRMINOS Y FIRMAS ============
  doc.addPage()
  
  // Fondo decorativo superior
  doc.setFillColor(248, 250, 252)
  doc.rect(0, 0, pageWidth, 80, 'F')
  
  y = 55

  // Título de términos con diseño mejorado
  doc.setFillColor(30, 64, 175)
  doc.rect(margin - 5, y - 5, 6, 32, 'F')
  
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 64, 175)
  doc.text('Términos y Condiciones', margin + 8, y + 12)
  
  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)
  doc.setFont('helvetica', 'normal')
  doc.text('Por favor, lea cuidadosamente antes de firmar', margin + 8, y + 26)

  y += 50

  // Términos con mejor formato
  const terms = [
    'SIEEG no se responsabiliza en caso el equipo presente daños por mal uso de terceros o a nivel software y/o hardware antes de su ingreso a reparación.',
    'El cliente acepta pagar todas las piezas y mano de obra al finalizar la reparación.',
    'La fecha estimada de finalización está sujeta a cambios según la disponibilidad de piezas.',
    'El taller de reparación no es responsable de ninguna pérdida de datos en equipos electrónicos.',
    'Si la reparación requiere trabajos y/o piezas que no se hayan especificado anteriormente, SIEEG indicará un presupuesto actualizado, en caso de no autorizarlo no se realizará ninguna reparación.',
    'SIEEG te notificará una vez que tu producto esté reparado y listo para su entrega, este mismo se almacenará sin coste durante los primeros 10 días hábiles. Después de 10 días, si no se ha retirado el dispositivo, se cobrará los gastos de almacenamiento. El gasto de almacenamiento equivale a $50.00 por día.',
    'Una vez el producto se considere abandonado, SIEEG tomará la propiedad del mismo en compensación de los costos de almacenamiento.',
    'La garantía sobre reparaciones es válida solo en la mano de obra a partir de la fecha de finalización.'
  ]

  doc.setFontSize(9)
  doc.setTextColor(51, 65, 85)
  doc.setFont('helvetica', 'normal')
  
  terms.forEach((term, i) => {
    // Círculo numerado
    doc.setFillColor(30, 64, 175)
    doc.circle(margin + 5, y - 3, 7, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text(`${i + 1}`, margin + (i < 9 ? 3 : 1.5), y + 1)
    
    // Texto del término
    doc.setFontSize(9)
    doc.setTextColor(51, 65, 85)
    doc.setFont('helvetica', 'normal')
    const splitTerm = doc.splitTextToSize(term, pageWidth - 2 * margin - 25)
    doc.text(splitTerm, margin + 20, y)
    
    y += splitTerm.length * 11 + 10
  })

  // Sección de firmas mejorada
  y = 595

  // Contenedor de firmas con sombra
  doc.setFillColor(220, 220, 220)
  doc.roundedRect(margin + 2, y + 2, pageWidth - 2 * margin, 155, 8, 8, 'F')
  doc.setFillColor(255, 255, 255)
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 155, 8, 8, 'F')
  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(1)
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 155, 8, 8, 'D')

  // Línea divisoria vertical con estilo
  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(1)
  doc.line((pageWidth / 2), y + 10, (pageWidth / 2), y + 145)

  // FIRMA DEL CLIENTE
  const sigClientX = margin + 35
  const sigY = y + 25

  doc.setFontSize(10)
  doc.setTextColor(30, 64, 175)
  doc.setFont('helvetica', 'bold')
  doc.text('FIRMA DEL CLIENTE', sigClientX + 22, y + 18)

  // Área de firma con fondo
  doc.setFillColor(248, 250, 252)
  doc.roundedRect(sigClientX, sigY, 180, 70, 4, 4, 'F')
  doc.setDrawColor(203, 213, 225)
  doc.setLineWidth(0.5)
  doc.roundedRect(sigClientX, sigY, 180, 70, 4, 4, 'D')

  if (orden.firmaCliente) {
    try {
      const mime = String(orden.firmaCliente).slice(5, 15)
      const fmt = mime.includes('jpeg') || mime.includes('jpg') ? 'JPEG' : 'PNG'
      doc.addImage(orden.firmaCliente, fmt, sigClientX + 10, sigY + 5, 160, 60)
    } catch (e) {
      console.warn('Error al incrustar firma:', e)
    }
  }

  // Línea de nombre
  doc.setDrawColor(203, 213, 225)
  doc.setLineWidth(0.8)
  doc.line(sigClientX + 20, sigY + 95, sigClientX + 160, sigY + 95)
  
  doc.setFontSize(9)
  doc.setTextColor(71, 85, 105)
  doc.setFont('helvetica', 'normal')
  const clienteTexto = doc.getTextWidth(orden.cliente?.nombre || '______________________')
  doc.text(orden.cliente?.nombre || '______________________', sigClientX + 90 - clienteTexto/2, sigY + 108)
  
  doc.setFontSize(7.5)
  doc.setTextColor(148, 163, 184)
  doc.text('Nombre del cliente', sigClientX + 55, sigY + 118)

  // FIRMA DEL TÉCNICO
  const sigTecX = (pageWidth / 2) + 35

  doc.setFontSize(10)
  doc.setTextColor(30, 64, 175)
  doc.setFont('helvetica', 'bold')
  doc.text('FIRMA DEL TÉCNICO', sigTecX + 20, y + 18)

  // Área de firma
  doc.setFillColor(248, 250, 252)
  doc.roundedRect(sigTecX, sigY, 180, 70, 4, 4, 'F')
  doc.setDrawColor(203, 213, 225)
  doc.setLineWidth(0.5)
  doc.roundedRect(sigTecX, sigY, 180, 70, 4, 4, 'D')

  if (orden.firmaTecnico) {
    try {
      const mimeT = String(orden.firmaTecnico).slice(5, 15)
      const fmtT = mimeT.includes('jpeg') || mimeT.includes('jpg') ? 'JPEG' : 'PNG'
      doc.addImage(orden.firmaTecnico, fmtT, sigTecX + 10, sigY + 5, 160, 60)
    } catch (e) {
      console.warn('Error al incrustar firma técnico:', e)
    }
  }

  // Línea de nombre
  doc.setDrawColor(203, 213, 225)
  doc.setLineWidth(0.8)
  doc.line(sigTecX + 20, sigY + 95, sigTecX + 160, sigY + 95)
  
  doc.setFontSize(9)
  doc.setTextColor(71, 85, 105)
  doc.setFont('helvetica', 'normal')
  const tecnicoNombre = orden.tecnicoNombre || orden.tecnicoAsignado || orden.tecnico?.nombre || ''
  const tecnicoTexto = doc.getTextWidth(tecnicoNombre || '______________________')
  doc.text(tecnicoNombre || '______________________', sigTecX + 90 - tecnicoTexto/2, sigY + 108)
  
  doc.setFontSize(7.5)
  doc.setTextColor(148, 163, 184)
  doc.text('Nombre del técnico', sigTecX + 53, sigY + 118)

  // Footer mejorado página 2
  doc.setFillColor(248, 250, 252)
  doc.rect(0, 770, pageWidth, 72, 'F')
  doc.setFontSize(7.5)
  doc.setTextColor(100, 116, 139)
  doc.setFont('helvetica', 'normal')
  doc.text('Boulevard Belisario Domínguez #4213 L5, Fracc. La Gloria, Tuxtla Gutiérrez, Chiapas', margin, 785)
  doc.text('Tel: 961 118 0157  •  WhatsApp: 961 333 6529', margin, 797)
  doc.setFontSize(7)
  doc.setTextColor(148, 163, 184)
  doc.text('Página 2 de 2', pageWidth - margin - 60, 797)

  return doc
}

// ===== PDF PARA SERVICIO FORÁNEO (SIMPLIFICADO) =====
async function generateOrdenForaneoPDF(orden, doc, pageWidth, margin) {
  let y = 40
  
  // ============ PÁGINA 1: INFORMACIÓN BÁSICA ============
  
  // Fondo decorativo
  doc.setFillColor(248, 250, 252)
  doc.rect(0, 0, pageWidth, 110, 'F')
  
  // Logo
  let logoData = null
  try { logoData = await urlToDataUrl('/sieeg-new.png') } catch (e) {}

  if (logoData) {
    try {
      doc.setFillColor(200, 200, 200)
      doc.roundedRect(margin + 2, y + 2, 105, 55, 4, 4, 'F')
      doc.setFillColor(255, 255, 255)
      doc.roundedRect(margin, y, 105, 55, 4, 4, 'F')
      doc.addImage(logoData, 'PNG', margin + 2.5, y + 2.5, 100, 50)
    } catch (e) {}
  }

  // Título
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 184, 148)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(71, 85, 105)
  doc.text('Servicio Foráneo - Mantenimiento', margin + 120, y + 38)
  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)
  doc.text('Bitácora de Aire Acondicionado', margin + 120, y + 52)
  
  // Caja de folio
  const infoBoxX = pageWidth - margin - 170
  doc.setFillColor(220, 220, 220)
  doc.roundedRect(infoBoxX + 2, y + 2, 170, 58, 6, 6, 'F')
  doc.setFillColor(255, 255, 255)
  doc.roundedRect(infoBoxX, y, 170, 58, 6, 6, 'F')
  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(1)
  doc.roundedRect(infoBoxX, y, 170, 58, 6, 6, 'D')
  
  doc.setFontSize(8)
  doc.setTextColor(100, 116, 139)
  doc.setFont('helvetica', 'bold')
  doc.text('FOLIO', infoBoxX + 10, y + 16)
  
  doc.setFontSize(18)
  doc.setTextColor(0, 184, 148)
  doc.setFont('helvetica', 'bold')
  doc.text(orden.folio || '—', infoBoxX + 10, y + 36)
  
  doc.setFontSize(8.5)
  doc.setTextColor(100, 116, 139)
  doc.setFont('helvetica', 'normal')
  doc.text(orden.fechaIngreso || '—', infoBoxX + 10, y + 50)

  y += 90

  // ===== INFORMACIÓN DEL CLIENTE =====
  const clientH = 95
  drawSection(doc, margin, y, pageWidth - 2 * margin, clientH, 'INFORMACIÓN DEL CLIENTE')
  
  y += 42
  drawField(doc, margin + 15, y, 235, 'Nombre completo', orden.cliente?.nombre)
  drawField(doc, margin + 270, y, 105, 'Teléfono', orden.cliente?.telefono)
  drawField(doc, margin + 395, y, 115, 'Dirección', orden.cliente?.direccion)

  y += clientH - 8

  // ===== INFORMACIÓN DEL LUGAR (FECHA) =====
  const ubicH = 60
  drawSection(doc, margin, y, pageWidth - 2 * margin, ubicH, 'INFORMACIÓN DE SERVICIO')
  
  y += 42
  drawField(doc, margin + 15, y, pageWidth - 2 * margin - 30, 'Fecha de mantenimiento', orden.fechaIngreso)

  y += ubicH - 8

  // Footer
  doc.setFillColor(248, 250, 252)
  doc.rect(0, 770, pageWidth, 72, 'F')
  doc.setFontSize(7.5)
  doc.setTextColor(100, 116, 139)
  doc.setFont('helvetica', 'normal')
  doc.text('Boulevard Belisario Domínguez #4213 L5, Fracc. La Gloria, Tuxtla Gutiérrez, Chiapas', margin, 785)
  doc.text('Tel: 961 118 0157  •  WhatsApp: 961 333 6529', margin, 797)
  doc.setFontSize(7)
  doc.setTextColor(148, 163, 184)
  doc.text('Página 1 de 2', pageWidth - margin - 60, 797)

  // ============ PÁGINA 2: BITÁCORA DE MANTENIMIENTO ============
  doc.addPage()
  
  // Fondo decorativo
  doc.setFillColor(248, 250, 252)
  doc.rect(0, 0, pageWidth, 80, 'F')
  
  let yFoneo = 40
  
  // Título
  doc.setFillColor(0, 184, 148)
  doc.rect(margin - 5, yFoneo - 5, 6, 32, 'F')
  
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 184, 148)
  doc.text('Bitácora de Mantenimiento', margin + 8, yFoneo + 12)
  
  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)
  doc.setFont('helvetica', 'normal')
  doc.text('Registro detallado de revisiones por área', margin + 8, yFoneo + 26)
  
  yFoneo = 90
  
  // Tabla header
  const colWidths = [70, 35, 45, 40, 45, 45, 70]
  const colNames = ['Área', 'Filtros', 'Condensadora', 'Presión Gas', 'Evaporadora', 'Revisión Elect.', 'Observaciones']
  let xPos = margin
  
  doc.setFillColor(0, 184, 148)
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  
  colNames.forEach((name, idx) => {
    doc.rect(xPos, yFoneo, colWidths[idx], 12, 'F')
    doc.text(name, xPos + 2, yFoneo + 8, { maxWidth: colWidths[idx] - 4 })
    xPos += colWidths[idx]
  })
  
  yFoneo += 12
  
  // Tabla filas
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  
  orden.trabajosRealizados.forEach((row, idx) => {
    // Fondo alternado
    if (idx % 2 === 0) {
      doc.setFillColor(248, 250, 252)
      doc.rect(margin, yFoneo, pageWidth - 2 * margin, 14, 'F')
    }
    
    // Bordes
    doc.setDrawColor(200, 200, 200)
    doc.setLineWidth(0.5)
    
    xPos = margin
    const rowHeight = 14
    
    // Área
    doc.rect(xPos, yFoneo, colWidths[0], rowHeight)
    doc.text(String(row.area || '-'), xPos + 2, yFoneo + 7, { maxWidth: colWidths[0] - 4 })
    xPos += colWidths[0]
    
    // Filtros - Badge
    doc.rect(xPos, yFoneo, colWidths[1], rowHeight)
    const filtroColor = row.limpiezaFiltros === 'SI' ? [34, 197, 94] : [239, 68, 68]
    doc.setFillColor(...filtroColor)
    doc.rect(xPos + 2, yFoneo + 2, colWidths[1] - 4, rowHeight - 4, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.text(String(row.limpiezaFiltros || '-'), xPos + colWidths[1]/2 - 3, yFoneo + 7)
    doc.setTextColor(0, 0, 0)
    doc.setFont('helvetica', 'normal')
    xPos += colWidths[1]
    
    // Condensadora - Badge
    doc.rect(xPos, yFoneo, colWidths[2], rowHeight)
    const condColor = row.limpiezaCondensadora === 'SI' ? [34, 197, 94] : [239, 68, 68]
    doc.setFillColor(...condColor)
    doc.rect(xPos + 2, yFoneo + 2, colWidths[2] - 4, rowHeight - 4, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.text(String(row.limpiezaCondensadora || '-'), xPos + colWidths[2]/2 - 3, yFoneo + 7)
    doc.setTextColor(0, 0, 0)
    doc.setFont('helvetica', 'normal')
    xPos += colWidths[2]
    
    // Presión Gas
    doc.rect(xPos, yFoneo, colWidths[3], rowHeight)
    doc.text(String(row.presionGas || '-'), xPos + 2, yFoneo + 7, { maxWidth: colWidths[3] - 4 })
    xPos += colWidths[3]
    
    // Evaporadora - Badge
    doc.rect(xPos, yFoneo, colWidths[4], rowHeight)
    const evapColor = row.limpiezaEvaporadora === 'SI' ? [34, 197, 94] : [239, 68, 68]
    doc.setFillColor(...evapColor)
    doc.rect(xPos + 2, yFoneo + 2, colWidths[4] - 4, rowHeight - 4, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.text(String(row.limpiezaEvaporadora || '-'), xPos + colWidths[4]/2 - 3, yFoneo + 7)
    doc.setTextColor(0, 0, 0)
    doc.setFont('helvetica', 'normal')
    xPos += colWidths[4]
    
    // Revisión Eléctrica
    doc.rect(xPos, yFoneo, colWidths[5], rowHeight)
    doc.text(String(row.revisionElectrica || '-'), xPos + 2, yFoneo + 7, { maxWidth: colWidths[5] - 4, fontSize: 7 })
    xPos += colWidths[5]
    
    // Observaciones
    doc.rect(xPos, yFoneo, colWidths[6], rowHeight)
    doc.text(String(row.observaciones || '-'), xPos + 2, yFoneo + 7, { maxWidth: colWidths[6] - 4 })
    
    yFoneo += rowHeight
    
    // Evitar overflow de página
    if (yFoneo > 720) {
      doc.addPage()
      yFoneo = 40
      // Repetir header
      doc.setFillColor(0, 184, 148)
      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      xPos = margin
      colNames.forEach((name, i) => {
        doc.rect(xPos, yFoneo, colWidths[i], 12, 'F')
        doc.text(name, xPos + 2, yFoneo + 8, { maxWidth: colWidths[i] - 4 })
        xPos += colWidths[i]
      })
      yFoneo += 12
      doc.setTextColor(0, 0, 0)
      doc.setFont('helvetica', 'normal')
    }
  })
  
  // Footer página foráneo
  doc.setFillColor(248, 250, 252)
  doc.rect(0, 770, pageWidth, 72, 'F')
  doc.setFontSize(7.5)
  doc.setTextColor(100, 116, 139)
  doc.setFont('helvetica', 'normal')
  doc.text('Boulevard Belisario Domínguez #4213 L5, Fracc. La Gloria, Tuxtla Gutiérrez, Chiapas', margin, 785)
  doc.text('Tel: 961 118 0157  •  WhatsApp: 961 333 6529', margin, 797)
  doc.setFontSize(7)
  doc.setTextColor(148, 163, 184)
  const pageNum = doc.getNumberOfPages()
  doc.text(`Página 2 de 2`, pageWidth - margin - 60, 797)

  return doc
}

export async function downloadOrdenPDF(orden) {
  const doc = await generateOrdenPDF(orden)
  const fileName = `Orden_${orden.folio || 'servicio'}.pdf`
  doc.save(fileName)
}

// Abre el PDF en una pestaña temporal y lanza el diálogo de impresión
export async function printOrdenPDF(orden) {
  const doc = await generateOrdenPDF(orden)
  const blobUrl = doc.output('bloburl')
  const printWindow = window.open(blobUrl)

  if (!printWindow) {
    throw new Error('No se pudo abrir la vista de impresión (popup bloqueado)')
  }

  const triggerPrint = () => {
    try {
      printWindow.focus()
      printWindow.print()
    } catch (e) {
      console.warn('Error al imprimir PDF', e)
    }
  }

  // Algunos navegadores no disparan load para blob://, por eso el fallback con timeout
  try { printWindow.addEventListener('load', () => setTimeout(triggerPrint, 200)) } catch (e) {}
  setTimeout(triggerPrint, 500)
}
// Ticket compacto con diseño mejorado
export async function generateOrdenTicketPDF(orden) {
  const doc = new jsPDF({ unit: 'mm', format: [80, 200] })
  const margin = 6
  const pageWidth = 80
  const contentWidth = pageWidth - (margin * 2)
  let y = 8
  const consultaUrl = `${(typeof window !== 'undefined' && window.location ? window.location.origin : 'https://sieeg.com.mx')}/consulta?folio=${encodeURIComponent(orden.folio || '')}`

  // Logo centrado
  let logoData = null
  try { logoData = await urlToDataUrl('/sieeg-new.png') } catch (e) {}
  if (logoData) {
    try {
      doc.addImage(logoData, 'PNG', (pageWidth - 24) / 2, y, 24, 12)
    } catch (e) {}
  }
  y += 15

  // Título centrado
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  const titulo = 'ORDEN DE SERVICIO'
  doc.text(titulo, pageWidth / 2, y, { align: 'center' })
  y += 5
  
  // Línea decorativa
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.4)
  doc.line(margin + 10, y, pageWidth - margin - 10, y)
  y += 6

  // Folio destacado
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('FOLIO:', margin, y)
  doc.setFontSize(12)
  const folioText = orden.folio || '—'
  const folioWidth = doc.getTextWidth(folioText)
  doc.text(folioText, pageWidth - margin - folioWidth, y)
  y += 6

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Fecha: ${orden.fechaIngreso || '—'}`, margin, y)
  y += 8

  // Sección Cliente
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('CLIENTE', margin, y)
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.2)
  doc.line(margin, y + 1, pageWidth - margin, y + 1)
  y += 5

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  const clienteNombre = doc.splitTextToSize((orden.cliente?.nombre || '—').toString(), contentWidth)
  doc.text(clienteNombre, margin, y)
  y += clienteNombre.length * 4.5 + 2

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  if (orden.cliente?.telefono) {
    doc.text(`Tel: ${orden.cliente.telefono}`, margin, y)
    y += 5
  }
  y += 3

  // Sección Equipo
  doc.setFont('helvetica', 'bold')
  doc.text('EQUIPO', margin, y)
  doc.line(margin, y + 1, pageWidth - margin, y + 1)
  y += 5

  doc.setFontSize(10)
  const equipoTitulo = `${orden.equipo?.tipo || '—'} ${orden.equipo?.marca || ''}`.trim()
  doc.text(equipoTitulo, margin, y)
  y += 5

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  if (orden.equipo?.modelo) {
    doc.text(`Modelo: ${orden.equipo.modelo}`, margin, y)
    y += 4
  }
  if (orden.equipo?.numeroSerie) {
    doc.text(`Serie: ${orden.equipo.numeroSerie}`, margin, y)
    y += 4
  }
  y += 3

  // Estado destacado
  doc.setFont('helvetica', 'bold')
  doc.text('ESTADO', margin, y)
  doc.line(margin, y + 1, pageWidth - margin, y + 1)
  y += 5

  doc.setFontSize(10)
  doc.setFillColor(245, 245, 245)
  doc.rect(margin, y - 3, contentWidth, 7, 'F')
  doc.text(orden.estado || '—', margin + 2, y + 1)
  y += 9

  // Descripción
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('DESCRIPCIÓN / FALLA', margin, y)
  doc.line(margin, y + 1, pageWidth - margin, y + 1)
  y += 5

  doc.setFont('helvetica', 'normal')
  const desc = doc.splitTextToSize(String(orden.descripcionFalla || 'Sin descripción'), contentWidth)
  doc.text(desc, margin, y)
  y += desc.length * 4.5 + 4

  // Accesorios
  if (orden.accesorios && Object.values(orden.accesorios).some(Boolean)) {
    doc.setFont('helvetica', 'bold')
    doc.text('ACCESORIOS', margin, y)
    doc.line(margin, y + 1, pageWidth - margin, y + 1)
    y += 5

    doc.setFont('helvetica', 'normal')
    const accList = []
    const acc = orden.accesorios
    if (acc.cargador) accList.push('Cargador')
    if (acc.simCard) accList.push('SIM Card')
    if (acc.bandejaSIM) accList.push('Bandeja SIM')
    if (acc.memoriaSD) accList.push('Memoria SD')
    if (acc.funda) accList.push('Funda')
    if (acc.cable) accList.push('Cable')
    if (acc.otro) accList.push(acc.otro)
    
    if (accList.length) {
      const accText = doc.splitTextToSize(accList.join(', '), contentWidth)
      doc.text(accText, margin, y)
      y += accText.length * 4.5 + 3
    }
    
    if (acc.patron) {
      doc.text(`Patrón: ${acc.patron}`, margin, y)
      y += 4
    }
    if (orden.contrasena) {
      doc.text(`Contraseña: ${orden.contrasena}`, margin, y)
      y += 4
    }
    y += 2
  }

  // Consulta en línea
  y += 3
  doc.setLineWidth(0.3)
  doc.line(margin, y, pageWidth - margin, y)
  y += 6

  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('CONSULTA EN LÍNEA', margin, y)
  doc.line(margin, y + 1, pageWidth - margin, y + 1)
  y += 5

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  const urlLines = doc.splitTextToSize(consultaUrl, contentWidth)
  doc.text(urlLines, margin, y)
  y += urlLines.length * 4 + 4

  doc.setFontSize(8)
  doc.setFont('helvetica', 'italic')
  const instruccion = 'Escanea o visita para ver el estado de tu equipo.'
  doc.text(instruccion, margin, y)
  y += 6

  // Footer
  doc.setLineWidth(0.2)
  doc.line(margin, y, pageWidth - margin, y)
  y += 4
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.text('Gracias por confiar en SIEEG', pageWidth / 2, y, { align: 'center' })

  return doc
}

export async function downloadOrdenTicketPDF(orden) {
  const doc = await generateOrdenTicketPDF(orden)
  const fileName = `Ticket_${orden.folio || 'servicio'}.pdf`
  doc.save(fileName)
}

export async function printOrdenTicketPDF(orden) {
  const doc = await generateOrdenTicketPDF(orden)
  const blobUrl = doc.output('bloburl')
  const printWindow = window.open(blobUrl)
  if (!printWindow) throw new Error('No se pudo abrir la vista de impresión (popup bloqueado)')

  const triggerPrint = () => { try { printWindow.focus(); printWindow.print() } catch (e) { console.warn('Error al imprimir ticket', e) } }
  try { printWindow.addEventListener('load', () => setTimeout(triggerPrint, 200)) } catch (e) {}
  setTimeout(triggerPrint, 500)
}