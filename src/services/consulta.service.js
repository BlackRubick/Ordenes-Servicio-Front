import { api } from './api'

export async function getOrdenByFolioPublic(folio) {
  const res = await api.get(`/api/public/orden/${encodeURIComponent(folio)}`)
  return res.data
}

export default { getOrdenByFolioPublic }
