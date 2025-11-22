import Dexie from 'dexie'
import { generateFolio } from '../utils/folio'

// StorageService abstracts current local storage / IndexedDB implementation.
// In the future, swap these methods to call a REST API without touching components.

const DB_NAME = 'sieeg_db_v1'

class StorageService {
  constructor() {
    this.db = new Dexie(DB_NAME)
    // Initial schema for ordenes, later versions add logs
    this.db.version(1).stores({
      ordenes: '++id,folio,fechaIngreso,estado,cliente.nombre'
    })
    // add logs store for history tracking
    this.db.version(2).stores({
      ordenes: '++id,folio,fechaIngreso,estado,cliente.nombre',
      logs: '++id,ordenId,createdAt'
    })
    // add uploads store for temporary local shares and tecnico index
    // bump to version 4 to add tecnicoUid index
    this.db.version(4).stores({
      ordenes: '++id,folio,fechaIngreso,estado,cliente.nombre,tecnicoUid',
      logs: '++id,ordenId,createdAt',
      uploads: '++id,ordenId,filename,createdAt'
    })
  }

  // ORDERS
  async getOrdenes() {
    return await this.db.ordenes.toArray()
  }

  async getOrdenById(id) {
    return await this.db.ordenes.get(Number(id))
  }

  async createOrden(data) {
    const now = Date.now()
    const orden = {
      ...data,
      folio: data.folio || generateFolio(),
      createdAt: now,
      updatedAt: now
    }
    const id = await this.db.ordenes.add(orden)
    const created = { ...orden, id }
    // add a creation log
    try { await this.db.logs.add({ ordenId: id, action: 'created', payload: JSON.stringify(created), createdAt: now }) } catch(e) { /* ignore */ }
    // notify listeners
    try { window.dispatchEvent(new CustomEvent('sieeg:ordenes-changed', { detail: { type: 'created', id } })) } catch(e) {}
    return created
  }

  async updateOrden(id, patch) {
    patch.updatedAt = Date.now()
    await this.db.ordenes.update(Number(id), patch)
    const updated = await this.getOrdenById(id)
    // add update log
    try { await this.db.logs.add({ ordenId: Number(id), action: 'updated', payload: JSON.stringify(patch), createdAt: Date.now() }) } catch(e) { /* ignore */ }
    // notify listeners
    try { window.dispatchEvent(new CustomEvent('sieeg:ordenes-changed', { detail: { type: 'updated', id: Number(id) } })) } catch(e) {}
    return updated
  }

  async deleteOrden(id) {
    const res = await this.db.ordenes.delete(Number(id))
    try { await this.db.logs.add({ ordenId: Number(id), action: 'deleted', payload: '', createdAt: Date.now() }) } catch(e) {}
    try { window.dispatchEvent(new CustomEvent('sieeg:ordenes-changed', { detail: { type: 'deleted', id: Number(id) } })) } catch(e) {}
    return res
  }

  // Logs helper
  async addLog(ordenId, action, payload) {
    try {
      const now = Date.now()
      await this.db.logs.add({ ordenId: Number(ordenId), action, payload: typeof payload === 'string' ? payload : JSON.stringify(payload), createdAt: now })
      return true
    } catch (e) {
      return false
    }
  }

  // Uploads (local temporary storage)
  async saveUpload(ordenId, filename, blob) {
    try {
      const now = Date.now()
      const id = await this.db.uploads.add({ ordenId: Number(ordenId), filename, blob, createdAt: now })
      return id
    } catch (e) {
      console.warn('Error saving upload', e)
      return null
    }
  }

  async getUploadBlob(id) {
    try {
      const rec = await this.db.uploads.get(Number(id))
      return rec?.blob || null
    } catch (e) {
      return null
    }
  }

  // Return an object URL for an upload (caller responsible for revoking)
  async getUploadUrl(id) {
    const blob = await this.getUploadBlob(id)
    if (!blob) return null
    try {
      return URL.createObjectURL(blob)
    } catch (e) {
      return null
    }
  }

  // Logs
  async getLogsForOrden(ordenId) {
    return await this.db.logs.where('ordenId').equals(Number(ordenId)).sortBy('createdAt')
  }

  // Helpers for migration: export/import simple JSON
  async exportAll() {
    const ordenes = await this.getOrdenes()
    return { ordenes }
  }
}

export const storageService = new StorageService()
