import { Router } from 'express'
import { FieldValue } from 'firebase-admin/firestore'
import { requireAdmin } from '../config/firebaseAdmin.js'
import { requireDocumentRole } from '../services/documentAccess.js'

const router = Router()
router.use('/:documentId/shares', async (request, response, next) => {
  try { request.access = await requireDocumentRole(request.params.documentId, request.user.uid, ['owner']); next() }
  catch (error) { response.status(error.status || 500).json({ error: error.message }) }
})

router.get('/:documentId/shares', async (request, response, next) => {
  try {
    const snapshot = await request.access.documentRef.collection('permissions').get()
    response.json({ shares: snapshot.docs.map((person) => ({ ...person.data(), userId: person.id })) })
  } catch (error) { next(error) }
})

router.post('/:documentId/shares', async (request, response, next) => {
  try {
    const email = String(request.body.email || '').trim().toLowerCase()
    const role = request.body.role
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return response.status(400).json({ error: 'Enter a valid email address.' })
    if (!['editor', 'viewer'].includes(role)) return response.status(400).json({ error: 'Choose Editor or Viewer access.' })
    const { auth, db } = requireAdmin()
    let target
    try { target = await auth.getUserByEmail(email) }
    catch (error) {
      if (error.code === 'auth/user-not-found') return response.status(404).json({ error: 'No CloudSync account was found for that email.' })
      throw error
    }
    if (target.disabled) return response.status(400).json({ error: 'That account is disabled.' })
    if (target.uid === request.user.uid) return response.status(400).json({ error: 'You already own this document.' })
    const profile = await db.collection('users').doc(target.uid).get()
    const permissionRef = request.access.documentRef.collection('permissions').doc(target.uid)
    await permissionRef.set({
      userId: target.uid, email: (target.email || email).toLowerCase(), name: profile.data()?.name || target.displayName || '', role, grantedBy: request.user.uid,
      createdAt: FieldValue.serverTimestamp(),
    })
    await request.access.documentRef.update({ visibility: 'shared', updatedAt: FieldValue.serverTimestamp() })
    response.status(201).json({ ok: true })
  } catch (error) { next(error) }
})

router.patch('/:documentId/shares/:userId', async (request, response, next) => {
  try {
    if (!['editor', 'viewer'].includes(request.body.role)) return response.status(400).json({ error: 'Choose Editor or Viewer access.' })
    if (request.params.userId === request.user.uid) return response.status(400).json({ error: 'The owner role cannot be changed.' })
    const permission = request.access.documentRef.collection('permissions').doc(request.params.userId)
    const snapshot = await permission.get()
    if (!snapshot.exists) return response.status(404).json({ error: 'This person no longer has access.' })
    await permission.update({ role: request.body.role, updatedAt: FieldValue.serverTimestamp() })
    response.json({ ok: true })
  } catch (error) { next(error) }
})

router.delete('/:documentId/shares/:userId', async (request, response, next) => {
  try {
    if (request.params.userId === request.user.uid) return response.status(400).json({ error: 'The owner cannot be removed.' })
    const permission = request.access.documentRef.collection('permissions').doc(request.params.userId)
    await permission.delete()
    const remaining = await request.access.documentRef.collection('permissions').limit(1).get()
    if (remaining.empty) await request.access.documentRef.update({ visibility: 'private', updatedAt: FieldValue.serverTimestamp() })
    response.json({ ok: true })
  } catch (error) { next(error) }
})

export default router
