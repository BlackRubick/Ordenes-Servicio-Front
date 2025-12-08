import React, { useEffect, useState } from 'react'
import { createUser, getUsers, deleteUser, updateUser } from '../../services/user.service'
import { Plus, Trash2, Edit2, Save, X, Users, Mail, Lock, Shield, UserCog } from 'lucide-react'

export default function TecnicosPage() {
  const [tecnicos, setTecnicos] = useState([])
  const [form, setForm] = useState({ nombre: '', email: '', password: '', rol: 'tecnico' })
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})

  async function load() {
    try {
      const list = await getUsers()
      const normalized = (list || []).map(u => ({ ...u, rol: u.rol || u.role || 'tecnico' }))
      setTecnicos(normalized.filter(u => u.rol === 'tecnico' || u.rol === 'admin'))
    } catch (e) {
      setTecnicos([])
    }
  }

  useEffect(() => { load() }, [])

  function updateField(k, v) { setForm(prev => ({ ...prev, [k]: v })) }
  function updateEditField(k, v) { setEditForm(prev => ({ ...prev, [k]: v })) }

  async function handleCreate(e) {
    e.preventDefault()
    if (!form.nombre || !form.email || !form.password) {
      alert('Nombre, correo y contraseña son requeridos')
      return
    }
    
    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(form.email)) {
      alert('Por favor ingresa un correo válido')
      return
    }

    try {
      await createUser({ 
        nombre: form.nombre, 
        email: form.email, 
        password: form.password, 
        rol: form.rol || 'tecnico' 
      })
      setForm({ nombre: '', email: '', password: '', rol: 'tecnico' })
      load()
    } catch (err) {
      alert('No se pudo crear el usuario')
    }
  }

  function startEdit(tecnico) {
    setEditingId(tecnico.uid)
    setEditForm({
      nombre: tecnico.nombre,
      email: tecnico.email,
      rol: tecnico.rol,
      password: ''
    })
  }

  function cancelEdit() {
    setEditingId(null)
    setEditForm({})
  }

  async function saveEdit(uid) {
    if (!editForm.nombre || !editForm.email) {
      alert('Nombre y correo son requeridos')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(editForm.email)) {
      alert('Por favor ingresa un correo válido')
      return
    }

    const payload = {
      nombre: editForm.nombre,
      email: editForm.email,
      rol: editForm.rol || 'tecnico'
    }

    if (editForm.password && editForm.password.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres')
      return
    }

    if (editForm.password) {
      payload.password = editForm.password
    }

    try {
      await updateUser(uid, payload)
      setEditingId(null)
      setEditForm({})
      await load()
    } catch (err) {
      alert('No se pudo actualizar el usuario')
    }
  }

  async function handleDelete(uid) {
    if (!confirm('¿Eliminar este usuario?')) return
    try {
      await deleteUser(uid)
      load()
    } catch (e) {
      alert('No se pudo eliminar')
    }
  }

  const getRolBadge = (rol) => {
    if (rol === 'admin') {
      return 'bg-gradient-to-r from-purple-500 to-purple-600 text-white'
    }
    return 'bg-gradient-to-r from-[#0078ff] to-[#66b3ff] text-white'
  }

  const getRolIcon = (rol) => {
    if (rol === 'admin') {
      return <Shield className="w-4 h-4" />
    }
    return <UserCog className="w-4 h-4" />
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0078ff] to-[#66b3ff] rounded-2xl shadow-2xl p-8 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border-2 border-white/30">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2">Gestión de Usuarios</h1>
              <p className="text-blue-100">Administra técnicos y personal del sistema</p>
            </div>
          </div>
        </div>

        {/* Formulario de creación */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border-t-4 border-[#0078ff]">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Plus className="w-6 h-6 text-[#0078ff]" />
            Agregar Nuevo Usuario
          </h2>
          
          <form onSubmit={handleCreate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                  <Users className="w-4 h-4 text-[#0078ff]" />
                  Nombre completo
                </label>
                <input 
                  value={form.nombre} 
                  onChange={(e) => updateField('nombre', e.target.value)} 
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#0078ff] focus:ring-4 focus:ring-blue-200 transition-all"
                  placeholder="Ej: Juan Pérez"
                  required
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                  <Mail className="w-4 h-4 text-[#0078ff]" />
                  Correo electrónico
                </label>
                <input 
                  type="email"
                  value={form.email} 
                  onChange={(e) => updateField('email', e.target.value)} 
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#0078ff] focus:ring-4 focus:ring-blue-200 transition-all"
                  placeholder="usuario@ejemplo.com"
                  required
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                  <Lock className="w-4 h-4 text-[#0078ff]" />
                  Contraseña
                </label>
                <input 
                  type="password"
                  value={form.password} 
                  onChange={(e) => updateField('password', e.target.value)} 
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#0078ff] focus:ring-4 focus:ring-blue-200 transition-all"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                  <Shield className="w-4 h-4 text-[#0078ff]" />
                  Rol
                </label>
                <select 
                  value={form.rol} 
                  onChange={(e) => updateField('rol', e.target.value)} 
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#0078ff] focus:ring-4 focus:ring-blue-200 transition-all"
                >
                  <option value="tecnico">Técnico</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
            </div>

            <button 
              type="submit"
              className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-[#0078ff] to-[#66b3ff] text-white rounded-xl font-bold hover:from-[#0066dd] hover:to-[#5599ee] transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Crear Usuario
            </button>
          </form>
        </div>

        {/* Listado */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border-t-4 border-[#0078ff]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Users className="w-6 h-6 text-[#0078ff]" />
              Usuarios Registrados
            </h2>
            <div className="px-4 py-2 bg-gradient-to-r from-blue-50 to-blue-100 rounded-full">
              <span className="text-sm font-bold text-[#0078ff]">{tecnicos.length} usuarios</span>
            </div>
          </div>

          {tecnicos.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
                <Users className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-gray-500 text-lg">No hay usuarios registrados</p>
              <p className="text-gray-400 text-sm mt-2">Agrega el primer usuario usando el formulario de arriba</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tecnicos.map(t => (
                <div 
                  key={t.uid} 
                  className="group p-5 border-2 border-gray-200 rounded-xl hover:border-[#0078ff] hover:shadow-lg transition-all bg-gradient-to-r from-white to-gray-50"
                >
                  {editingId === t.uid ? (
                    // Modo edición
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className="text-xs font-bold text-gray-600 mb-1 block">Nombre</label>
                          <input
                            value={editForm.nombre}
                            onChange={(e) => updateEditField('nombre', e.target.value)}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-[#0078ff] focus:ring-2 focus:ring-blue-200"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-600 mb-1 block">Correo</label>
                          <input
                            type="email"
                            value={editForm.email}
                            onChange={(e) => updateEditField('email', e.target.value)}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-[#0078ff] focus:ring-2 focus:ring-blue-200"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-600 mb-1 block">Rol</label>
                          <select
                            value={editForm.rol}
                            onChange={(e) => updateEditField('rol', e.target.value)}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-[#0078ff] focus:ring-2 focus:ring-blue-200"
                          >
                            <option value="tecnico">Técnico</option>
                            <option value="admin">Administrador</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-600 mb-1 block">Contraseña (opcional)</label>
                          <input
                            type="password"
                            value={editForm.password || ''}
                            onChange={(e) => updateEditField('password', e.target.value)}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-[#0078ff] focus:ring-2 focus:ring-blue-200"
                            placeholder="Dejar en blanco para mantener"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => saveEdit(t.uid)}
                          className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center justify-center sm:justify-start gap-2"
                        >
                          <Save className="w-4 h-4" />
                          <span className="hidden sm:inline">Guardar</span>
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="w-full sm:w-auto px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-semibold flex items-center justify-center sm:justify-start gap-2"
                        >
                          <X className="w-4 h-4" />
                          <span className="hidden sm:inline">Cancelar</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Modo vista
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#0078ff] to-[#66b3ff] rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg flex-shrink-0">
                          {(t.nombre || '').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1 flex-wrap">
                            <h3 className="font-bold text-gray-800 text-lg truncate">{t.nombre}</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${getRolBadge(t.rol)}`}>
                              {getRolIcon(t.rol)}
                              {t.rol === 'admin' ? 'Administrador' : 'Técnico'}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 flex items-center gap-2 break-words truncate">
                            <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="truncate break-words">{t.email}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-3 sm:mt-0">
                        <button
                          onClick={() => startEdit(t)}
                          className="px-4 py-2 bg-[#0078ff] text-white rounded-lg hover:bg-[#0066dd] transition-colors font-semibold flex items-center gap-2 shadow-md hover:shadow-lg"
                        >
                          <Edit2 className="w-4 h-4" />
                          <span className="hidden sm:inline">Editar</span>
                        </button>
                        <button
                          onClick={() => handleDelete(t.uid)}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold flex items-center gap-2 shadow-md hover:shadow-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="hidden sm:inline">Eliminar</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}