import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { storage } from './firebase.js'

const MAX_IMAGE_SIZE = 5 * 1024 * 1024
const ALLOWED_IMAGES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']

export async function uploadDocumentImage(documentId, file) {
  if (!ALLOWED_IMAGES.includes(file.type)) throw new Error('Choose a PNG, JPG, GIF, or WebP image.')
  if (file.size > MAX_IMAGE_SIZE) throw new Error('Images must be 5 MB or smaller.')
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const destination = ref(storage, `documents/${documentId}/${crypto.randomUUID()}-${safeName}`)
  await uploadBytes(destination, file, { contentType: file.type })
  return getDownloadURL(destination)
}
