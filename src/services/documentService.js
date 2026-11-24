import {
  addDoc, collection, collectionGroup, doc, getDoc, getDocs, limit, orderBy,
  query, serverTimestamp, updateDoc, where,
} from 'firebase/firestore'
import { db } from './firebase.js'
import { apiRequest } from './api.js'

function asDocument(snapshot, role = 'owner') { return { id: snapshot.id, ...snapshot.data(), role } }

export async function createDocument(user, title = 'Untitled document') {
  const reference = await addDoc(collection(db, 'documents'), {
    title: title.trim() || 'Untitled document', ownerId: user.uid, ownerName: user.displayName || user.email,
    createdAt: serverTimestamp(), updatedAt: serverTimestamp(), updatedBy: user.uid,
    isDeleted: false, isStarred: false, visibility: 'private',
  })
  return reference.id
}

export async function getDocument(documentId, userId) {
  const snapshot = await getDoc(doc(db, 'documents', documentId))
  if (!snapshot.exists()) return null
  const data = snapshot.data()
  if (!userId || data.ownerId === userId) return asDocument(snapshot, 'owner')
  if (data.isDeleted) return null
  const access = await getDoc(doc(db, 'documents', documentId, 'permissions', userId))
  return access.exists() ? asDocument(snapshot, access.data().role || 'viewer') : null
}

export async function listDocuments(user, view = 'home') {
  const ownedQuery = query(collection(db, 'documents'), where('ownerId', '==', user.uid), orderBy('updatedAt', 'desc'), limit(100))
  const ownedSnapshots = await getDocs(ownedQuery)
  let docs = ownedSnapshots.docs.map((item) => asDocument(item))
  if (view === 'shared' || view === 'recent') {
    const permissionQuery = query(collectionGroup(db, 'permissions'), where('userId', '==', user.uid))
    const permissionSnapshots = await getDocs(permissionQuery)
    const sharedIds = permissionSnapshots.docs.map((item) => item.ref.parent.parent?.id).filter(Boolean)
    const shared = await Promise.all(sharedIds.map(async (id) => {
      const snapshot = await getDoc(doc(db, 'documents', id))
      const role = permissionSnapshots.docs.find((item) => item.ref.parent.parent?.id === id)?.data().role || 'viewer'
      return snapshot.exists() ? asDocument(snapshot, role) : null
    }))
    const sharedDocs = shared.filter(Boolean)
    docs = view === 'shared' ? sharedDocs : [...docs, ...sharedDocs]
  } else if (view === 'trash') docs = docs.filter((item) => item.isDeleted)
  else if (view === 'starred') docs = docs.filter((item) => item.isStarred && !item.isDeleted)
  else docs = docs.filter((item) => !item.isDeleted)
  if (view === 'recent') docs = docs.filter((item) => !item.isDeleted).sort((a, b) => (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0)).slice(0, 12)
  if (view === 'shared') docs = docs.filter((item) => !item.isDeleted).sort((a, b) => (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0))
  return docs
}

export async function renameDocument(documentId, title) {
  const cleanTitle = title.trim()
  if (!cleanTitle) throw new Error('A document title cannot be empty.')
  await updateDoc(doc(db, 'documents', documentId), { title: cleanTitle, updatedAt: serverTimestamp() })
}

export async function updateDocumentMetadata(documentId, fields) {
  await updateDoc(doc(db, 'documents', documentId), { ...fields, updatedAt: serverTimestamp() })
}

export async function setDocumentDeleted(documentId, isDeleted) {
  await updateDoc(doc(db, 'documents', documentId), { isDeleted, updatedAt: serverTimestamp() })
}

export async function permanentlyDeleteDocument(documentId) {
  await apiRequest(`/api/documents/${documentId}`, { method: 'DELETE' })
}

export async function listVersions(documentId) {
  const snapshot = await getDocs(query(collection(db, 'documents', documentId, 'versions'), orderBy('createdAt', 'desc'), limit(30)))
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
}

export async function addVersion(documentId, content, user) {
  return addDoc(collection(db, 'documents', documentId, 'versions'), {
    content, createdBy: user.uid, createdByName: user.displayName || user.email, createdAt: serverTimestamp(),
  })
}

export async function listActivity(documentId) {
  const snapshot = await getDocs(query(collection(db, 'documents', documentId, 'activity'), orderBy('timestamp', 'desc'), limit(25)))
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
}
