import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { storageService } from '../../services/storage.service'

export default function DownloadUpload() {
  const { uploadId } = useParams()
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    let revoked = false
    async function run() {
      try {
        const blob = await storageService.getUploadBlob(uploadId)
        if (!blob) {
          setStatus('error')
          setMessage('Archivo no encontrado o ya expiró.')
          return
        }

        const url = URL.createObjectURL(blob)
        // trigger download
        const a = document.createElement('a')
        a.href = url
        // try to get filename from the uploads store
        try {
          const rec = await storageService.db.uploads.get(Number(uploadId))
          a.download = rec?.filename || `archivo_${uploadId}.pdf`
        } catch (e) {
          a.download = `archivo_${uploadId}.pdf`
        }
        document.body.appendChild(a)
        a.click()
        a.remove()
        // revoke after short timeout
        setTimeout(() => { URL.revokeObjectURL(url); revoked = true }, 30 * 1000)
        setStatus('done')
        setMessage('Descarga iniciada...')
      } catch (e) {
        console.warn('Error descargando upload', e)
        setStatus('error')
        setMessage('Error descargando el archivo.')
      }
    }
    run()
    return () => { if (!revoked) {/* no-op */} }
  }, [uploadId])

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="bg-white p-6 rounded shadow text-center max-w-lg">
        {status === 'loading' && <div className="text-gray-700">Preparando descarga...</div>}
        {status === 'done' && <div className="text-green-600 font-semibold">{message}</div>}
        {status === 'error' && <div className="text-red-600">{message}</div>}
        <p className="text-sm text-gray-500 mt-4">Si la descarga no inicia, asegúrate de abrir este enlace desde el mismo navegador donde se generó la cotización.</p>
      </div>
    </div>
  )
}
