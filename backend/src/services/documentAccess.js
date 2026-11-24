import { requireAdmin } from '../config/firebaseAdmin.js'

export async function getDocumentAccess(documentId, userId) {
  const { db } = requireAdmin()
  const documentRef = db.collection('documents').doc(documentId)
  const snapshot = await documentRef.get()
  if (!snapshot.exists) return { allowed: false, reason: 'Document not found.' }
  const document = snapshot.data()
  if (document.ownerId === userId) return { allowed: true, role: 'owner', document, documentRef }
  if (document.isDeleted) return { allowed: false, reason: 'This document is in the owner’s trash.' }
  const permission = await documentRef.collection('permissions').doc(userId).get()
  if (!permission.exists) return { allowed: false, reason: 'You do not have access to this document.' }
  const role = permission.data().role
  if (!['editor', 'viewer'].includes(role)) return { allowed: false, reason: 'The document permission is invalid.' }
  return { allowed: true, role, document, documentRef }
}

export async function requireDocumentRole(documentId, userId, roles = ['owner', 'editor', 'viewer']) {
  const access = await getDocumentAccess(documentId, userId)
  if (!access.allowed) {
    const error = new Error(access.reason)
    error.status = access.reason === 'Document not found.' ? 404 : 403
    throw error
  }
  if (!roles.includes(access.role)) {
    const error = new Error('You do not have permission to perform this action.')
    error.status = 403
    throw error
  }
  return access
}
