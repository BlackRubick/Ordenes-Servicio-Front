export function seedUsers() {
  const key = 'sieeg_users'
  const existing = localStorage.getItem(key)
  if (existing) return

  const users = [
    { uid: 'admin', email: 'admin@sieeg.com', password: 'admin123', nombre: 'Administrador', rol: 'admin', activo: true, createdAt: Date.now() },
    { uid: 'tecnico', email: 'tecnico@sieeg.com', password: 'tecnico123', nombre: 'Técnico', rol: 'tecnico', activo: true, createdAt: Date.now() }
  ]
  localStorage.setItem(key, JSON.stringify(users))
}
