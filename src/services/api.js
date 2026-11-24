import { auth } from './firebase.js'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export async function apiRequest(path, options = {}) {
  if (!auth?.currentUser) throw new Error('Your sign-in has expired. Please sign in again.')
  const token = await auth.currentUser.getIdToken()
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options.headers },
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.error || 'The request could not be completed.')
  return payload
}

export { API_URL }
