import { requireAdmin } from '../config/firebaseAdmin.js'

export async function authenticate(request, response, next) {
  try {
    const header = request.headers.authorization || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : ''
    if (!token) return response.status(401).json({ error: 'Sign in to continue.' })
    const { auth } = requireAdmin()
    request.user = await auth.verifyIdToken(token)
    return next()
  } catch (error) {
    const status = error.status || 401
    return response.status(status).json({ error: status === 401 ? 'Your session is invalid or expired. Sign in again.' : error.message })
  }
}
