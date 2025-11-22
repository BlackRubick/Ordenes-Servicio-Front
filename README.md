# SIEEG - Sistema de Órdenes de Servicio (prototipo local)

Proyecto front-end local-first (React + Vite + Tailwind) para gestionar órdenes de servicio. Todo funciona 100% en local usando IndexedDB (Dexie) y LocalStorage.

Quick start

1. Instala dependencias

```bash
cd /home/blackrubick/Escritorio/ordenes-servicio
npm install
```

2. Arranca en desarrollo

```bash
npm run dev
```

Credenciales de prueba (seeded):

- admin@sieeg.com / admin123 (rol: admin)
- tecnico@sieeg.com / tecnico123 (rol: tecnico)

Estructura y recomendaciones

- `src/services/storage.service.js` contiene la capa de abstracción storage. En el futuro la lógica puede cambiar a fetch/axios y los componentes no necesitan modificaciones.
- PDFs simples generados con `jspdf` en `src/pages/ordenes/PdfPreview.jsx` (puedes cambiar a `react-pdf/renderer` si prefieres templates React).
- Órdenes almacenadas en IndexedDB (Dexie). Usuarios y sesión en LocalStorage.

Próximos pasos sugeridos:

- Añadir validaciones completas con Zod en todos los formularios.
- Mejorar UI con componentes reusables en `src/components`.
- Implementar notificaciones y export a Excel (biblioteca por elegir).
