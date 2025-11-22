import React, { useEffect, useState } from 'react'
import { getProducts } from '../../services/woocommerce.service'

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

 const cfg = { baseUrl: 'https://sieeg.com.mx/', key: 'ck_8598eeff250d6976f6c0e66f0dba734eb00b1ea7', secret: 'cs_0c9d0bde94223a177c008750caf49337b33fbff0' }

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        // Try to read config from window.__WC_CONFIG__ if available (developer convenience)
        const cfg = (window && window.__WC_CONFIG__) || {}
        if (!cfg.baseUrl || !cfg.key || !cfg.secret) {
          setError('WooCommerce config missing. Set window.__WC_CONFIG__ or call getProducts with credentials.')
          setLoading(false)
          return
        }
        const data = await getProducts({ baseUrl: cfg.baseUrl, key: cfg.key, secret: cfg.secret })
        setProducts(data || [])
      } catch (e) {
        setError(String(e.message || e))
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Productos (WooCommerce)</h1>
        {loading && <p>Cargando productos...</p>}
        {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded mb-4">{error}</div>}
        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {products.map(p => (
              <div key={p.id} className="p-4 border rounded-lg bg-white">
                <div className="flex items-start gap-3">
                  <img src={(p.images && p.images[0] && p.images[0].src) || ''} alt={p.name} className="w-20 h-20 object-cover rounded" />
                  <div className="flex-1">
                    <h3 className="font-bold">{p.name}</h3>
                    <p className="text-sm text-gray-600">{p.price ? `$${p.price}` : '—'}</p>
                    <p className="text-xs text-gray-500 truncate">{p.sku}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
