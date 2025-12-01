const rawBase = import.meta.env.VITE_API_URL || ''
// remove trailing slash for safe concatenation
export const API_BASE = rawBase.replace(/\/$/, '')

export async function apiFetch(path, options) {
  // If a full URL is provided, use it as-is
  if (/^https?:\/\//i.test(path)) return fetch(path, options)
  const url = API_BASE ? `${API_BASE}${path}` : path
  return fetch(url, options)
}

export default apiFetch
