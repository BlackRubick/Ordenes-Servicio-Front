import { api, API_BASE_URL } from './api'
import { generateFolio } from '../utils/folio'

class StorageService {
  async getOrdenes() {
    try {
      const res = await api.get('/api/ordenes')
      const data = res.data
      return Array.isArray(data) ? data : []
    } catch (err) {
      if (err?.response?.status === 401) {
        try {
          localStorage.removeItem('sieeg_session')
          localStorage.removeItem('sieeg_token')
        } catch (e) {}
        // Forzar re-login si el token expira
        try { window.location.replace('/login') } catch (e) {}
        return []
      }
      throw err
    }
  }

  async getOrdenById(id) {
    const res = await api.get(`/api/ordenes/${id}`)
    return res.data
  }

  async createOrden(data) {
    const payload = { ...data, folio: data.folio || generateFolio() }
    const res = await api.post('/api/ordenes', payload)
    const created = res.data
    try { window.dispatchEvent(new CustomEvent('sieeg:ordenes-changed', { detail: { type: 'created', id: created?.id } })) } catch (e) {}
    return created
  }

  async updateOrden(id, patch) {
    const res = await api.put(`/api/ordenes/${id}`, patch)
    const updated = res.data
    try { window.dispatchEvent(new CustomEvent('sieeg:ordenes-changed', { detail: { type: 'updated', id } })) } catch (e) {}
    return updated
  }

  async deleteOrden(id, motivo) {
    const res = await api.delete(`/api/ordenes/${id}`, { data: { motivo } })
    try { window.dispatchEvent(new CustomEvent('sieeg:ordenes-changed', { detail: { type: 'deleted', id } })) } catch (e) {}
    return res.data
  }

  async getOrdenesEliminadas() {
    try {
      const res = await api.get('/api/ordenes/eliminadas')
      const data = res.data
      return Array.isArray(data) ? data : []
    } catch (err) {
      if (err?.response?.status === 401) {
        try {
          localStorage.removeItem('sieeg_session')
          localStorage.removeItem('sieeg_token')
        } catch (e) {}
        try { window.location.replace('/login') } catch (e) {}
        return []
      }
      throw err
    }
  }

  async restoreOrden(id) {
    const res = await api.post(`/api/ordenes/${id}/restore`)
    try { window.dispatchEvent(new CustomEvent('sieeg:ordenes-changed', { detail: { type: 'restored', id } })) } catch (e) {}
    return res.data
  }

  async addLog() {
    // Not implemented server-side yet
    return true
  }

  async getLogsForOrden() {
    return []
  }

  async saveUpload(ordenId, filename, blob) {
    const formData = new FormData()
    formData.append('file', blob, filename)
    if (ordenId) formData.append('ordenId', ordenId)
    const res = await api.post('/api/uploads', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    const rec = res.data
    return { id: rec.id, url: `${API_BASE_URL.replace(/\/$/, '')}/api/uploads/${rec.id}` }
  }
}

export const storageService = new StorageService()
