import React, { useMemo, useState } from 'react'
import { storageService } from '../../services/storage.service'
import { generateFolio } from '../../utils/folio'

const AREAS = [
  'Comedor de logística',
  'Auxiliar administrativo',
  'Gerencia',
  'Seguridad patrimonial',
  'Dormitorio',
  'Site',
  'Crédito y cobranza',
  'Atención al cliente 1',
  'Atención al cliente 2',
  'Atención al cliente 3',
  'Comedor operaciones',
  'Sala de juntas',
  'Cortes y acuses',
  'Asesor logístico',
  'Caseta de vigilancia',
  'Capacitación',
  'Supervisores operaciones',
]

function buildInitialRows() {
  return AREAS.map(area => ({
    area,
    limpiezaFiltros: 'SI',
    limpiezaCondensadora: 'SI',
    presionGas: '125 PSI',
    limpiezaEvaporadora: 'SI',
    revisionElectrica: '',
    observaciones: 'CORRECTO',
  }))
}

export default function ServicioForaneo() {
  const [cliente, setCliente] = useState({
    nombre: '',
    direccion: '',
    telefono: '',
    fecha: new Date().toISOString().split('T')[0],
  })
  const [registros, setRegistros] = useState(() => buildInitialRows())
  const [estadoEnvio, setEstadoEnvio] = useState({ guardando: false, folio: '', error: '' })

  const resumen = useMemo(() => ({ cliente, registros }), [cliente, registros])

  function handleClienteChange(field, value) {
    setCliente(prev => ({ ...prev, [field]: value }))
  }

  function handleRegistroChange(index, field, value) {
    setRegistros(prev => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)))
  }

  function marcarTodos(field, value) {
    setRegistros(prev => prev.map(row => ({ ...row, [field]: value })))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setEstadoEnvio({ guardando: true, folio: '', error: '' })

    try {
      if (!cliente.nombre || !cliente.direccion || !cliente.telefono) {
        throw new Error('Nombre, direccion y telefono son obligatorios')
      }

      const folio = generateFolio()
      const payload = {
        folio,
        fechaIngreso: cliente.fecha,
        estado: 'Servicio foraneo',
        cliente: {
          nombre: cliente.nombre,
          direccion: cliente.direccion,
          telefono: cliente.telefono,
        },
        trabajosRealizados: registros,
        comentarios: 'Servicio foraneo (formulario rapido)',
      }

      const created = await storageService.createOrden(payload)
      setEstadoEnvio({ guardando: false, folio: created?.folio || folio, error: '' })
    } catch (err) {
      const message = err?.response?.status === 401
        ? 'Sesión expirada, vuelve a iniciar sesión.'
        : err?.response?.data?.message || err?.message || 'Error al guardar'
      setEstadoEnvio({ guardando: false, folio: '', error: message })
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Servicio foráneo</h1>
        <p className="text-sm text-gray-600 mt-1">Captura los datos del cliente y los puntos revisados de cada área como en la bitácora de aire acondicionado.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <section className="bg-white rounded-lg shadow p-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm text-gray-600">Nombre del cliente</label>
            <input
              className="w-full border rounded px-3 py-2 text-sm"
              value={cliente.nombre}
              onChange={e => handleClienteChange('nombre', e.target.value)}
              placeholder="Ej. Empresa XYZ"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-gray-600">Dirección</label>
            <input
              className="w-full border rounded px-3 py-2 text-sm"
              value={cliente.direccion}
              onChange={e => handleClienteChange('direccion', e.target.value)}
              placeholder="Calle, número, ciudad"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-gray-600">Teléfono</label>
            <input
              className="w-full border rounded px-3 py-2 text-sm"
              value={cliente.telefono}
              onChange={e => handleClienteChange('telefono', e.target.value)}
              placeholder="10 dígitos"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-gray-600">Fecha de mantenimiento</label>
            <input
              type="date"
              className="w-full border rounded px-3 py-2 text-sm"
              value={cliente.fecha}
              onChange={e => handleClienteChange('fecha', e.target.value)}
              required
            />
          </div>
        </section>

        <section className="bg-white rounded-lg shadow p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
            <div>
              <h2 className="font-semibold text-gray-800">Tabla de mantenimiento</h2>
              <p className="text-xs text-gray-600">Cada columna es un área; puedes llenar rápido con los botones inferiores.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => marcarTodos('limpiezaFiltros', 'SI')} className="text-xs px-3 py-1 border rounded bg-gray-50 hover:bg-gray-100">Marcar filtros en SI</button>
              <button type="button" onClick={() => marcarTodos('limpiezaCondensadora', 'SI')} className="text-xs px-3 py-1 border rounded bg-gray-50 hover:bg-gray-100">Marcar condensadora en SI</button>
              <button type="button" onClick={() => marcarTodos('limpiezaEvaporadora', 'SI')} className="text-xs px-3 py-1 border rounded bg-gray-50 hover:bg-gray-100">Marcar evaporadora en SI</button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-xs border">
              <thead>
                <tr className="bg-slate-100 text-[11px] uppercase tracking-wide">
                  <th className="border px-2 py-2 text-left">Área</th>
                  <th className="border px-2 py-2">Limpieza de filtros</th>
                  <th className="border px-2 py-2">Limpieza de condensadora</th>
                  <th className="border px-2 py-2">Revisión presión gas (PSI)</th>
                  <th className="border px-2 py-2">Limpieza de evaporadora</th>
                  <th className="border px-2 py-2">Revisión instalación eléctrica</th>
                  <th className="border px-2 py-2">Observaciones</th>
                </tr>
              </thead>
              <tbody>
                {registros.map((row, index) => (
                  <tr key={row.area} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="border px-2 py-2 font-semibold text-gray-700 min-w-[180px]">{row.area}</td>
                    <td className="border px-2 py-1">
                      <select
                        className="w-full border rounded px-2 py-1"
                        value={row.limpiezaFiltros}
                        onChange={e => handleRegistroChange(index, 'limpiezaFiltros', e.target.value)}
                      >
                        <option value="SI">SI</option>
                        <option value="NO">NO</option>
                      </select>
                    </td>
                    <td className="border px-2 py-1">
                      <select
                        className="w-full border rounded px-2 py-1"
                        value={row.limpiezaCondensadora}
                        onChange={e => handleRegistroChange(index, 'limpiezaCondensadora', e.target.value)}
                      >
                        <option value="SI">SI</option>
                        <option value="NO">NO</option>
                      </select>
                    </td>
                    <td className="border px-2 py-1">
                      <input
                        className="w-full border rounded px-2 py-1"
                        value={row.presionGas}
                        onChange={e => handleRegistroChange(index, 'presionGas', e.target.value)}
                        placeholder="Ej. 125 PSI"
                      />
                    </td>
                    <td className="border px-2 py-1">
                      <select
                        className="w-full border rounded px-2 py-1"
                        value={row.limpiezaEvaporadora}
                        onChange={e => handleRegistroChange(index, 'limpiezaEvaporadora', e.target.value)}
                      >
                        <option value="SI">SI</option>
                        <option value="NO">NO</option>
                      </select>
                    </td>
                    <td className="border px-2 py-1">
                      <input
                        className="w-full border rounded px-2 py-1"
                        value={row.revisionElectrica}
                        onChange={e => handleRegistroChange(index, 'revisionElectrica', e.target.value)}
                        placeholder="Ej. L1-L2=232 V / L1-T=116V / L2-T=117V"
                      />
                    </td>
                    <td className="border px-2 py-1">
                      <input
                        className="w-full border rounded px-2 py-1"
                        value={row.observaciones}
                        onChange={e => handleRegistroChange(index, 'observaciones', e.target.value)}
                        placeholder="CORRECTO"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={estadoEnvio.guardando} className="px-4 py-2 bg-sieeg text-white rounded hover:bg-blue-700 disabled:opacity-60">
            {estadoEnvio.guardando ? 'Guardando...' : 'Guardar orden de servicio'}
          </button>
          <button
            type="button"
            onClick={() => navigator.clipboard?.writeText(JSON.stringify(resumen, null, 2))}
            className="px-4 py-2 border rounded hover:bg-gray-50"
          >
            Copiar datos en JSON
          </button>
          {estadoEnvio.folio && (
            <span className="inline-flex items-center px-3 py-2 text-sm bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
              Folio generado: {estadoEnvio.folio}
            </span>
          )}
          {estadoEnvio.error && (
            <span className="inline-flex items-center px-3 py-2 text-sm bg-red-50 text-red-700 border border-red-200 rounded">
              {estadoEnvio.error}
            </span>
          )}
        </div>
      </form>
    </div>
  )
}
