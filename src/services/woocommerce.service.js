import { api } from './api'

export async function getProducts(options = {}) {
  const { params = {} } = options || {}
  try {
    const res = await api.get('/api/wc/products', { params })
    return res.data
  } catch (err) {
    console.error('Error fetching WooCommerce products:', err)
    throw err
  }
}

export default { getProducts }
