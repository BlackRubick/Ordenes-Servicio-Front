import axios from 'axios'

// Simple WooCommerce client using consumer key/secret for basic auth
// Usage: set the base URL, key and secret when calling getProducts

const ENV_BASE = import.meta.env.VITE_WC_BASE_URL || ''
const ENV_KEY = import.meta.env.VITE_WC_KEY || ''
const ENV_SECRET = import.meta.env.VITE_WC_SECRET || ''

export async function getProducts(options = {}) {
  const { baseUrl = ENV_BASE, key = ENV_KEY, secret = ENV_SECRET, params = {} } = options || {}
  if (!baseUrl) throw new Error('baseUrl is required (set VITE_WC_BASE_URL or pass baseUrl)')
  if (!key || !secret) throw new Error('key and secret are required (set VITE_WC_KEY / VITE_WC_SECRET or pass them)')

  const url = String(baseUrl).replace(/\/$/, '') + '/wp-json/wc/v3/products'

  const res = await axios.get(url, {
    auth: { username: key, password: secret },
    params,
    timeout: 15000
  })

  return res.data
}

export default { getProducts }
