import { Router } from 'express'
import { requireAdmin } from '../config/firebaseAdmin.js'
import { requireDocumentRole } from '../services/documentAccess.js'
import { adminStorage } from '../config/firebaseAdmin.js'
import { deleteCollaborationState } from '../collaboration/server.js'

const router = Router()

router.delete('/:documentId', async (request, response, next) => {
  try {
    const access = await requireDocumentRole(request.params.documentId, request.user.uid, ['owner'])
    await access.documentRef.firestore.recursiveDelete(access.documentRef)
    try { await deleteCollaborationState(request.params.documentId) }
    catch (error) { console.error('Could not remove persisted collaboration state:', error.message) }
    try { await adminStorage.bucket().deleteFiles({ prefix: `documents/${request.params.documentId}/` }) }
    catch (error) { console.warn('Could not remove document image files:', error.message) }
    response.json({ ok: true })
  } catch (error) { next(error) }
})

export default router
