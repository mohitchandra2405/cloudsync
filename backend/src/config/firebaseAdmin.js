import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import { existsSync } from 'node:fs'

let adminApp = null
let initError = null
try {
  if (getApps().length) adminApp = getApps()[0]
  else {
    const serializedAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
    const credential = serializedAccount ? cert(JSON.parse(serializedAccount)) : applicationDefault()
    adminApp = initializeApp({ credential, projectId: process.env.FIREBASE_PROJECT_ID || undefined, storageBucket: process.env.FIREBASE_STORAGE_BUCKET || undefined })
  }
} catch (error) { initError = error }

const adminCredentialsConfigured = Boolean(
  process.env.FIREBASE_SERVICE_ACCOUNT_JSON ||
  (process.env.GOOGLE_APPLICATION_CREDENTIALS && existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) ||
  process.env.K_SERVICE || process.env.GAE_ENV || process.env.FUNCTION_TARGET,
)
export const adminReady = Boolean(adminApp && adminCredentialsConfigured)
export const adminConfigError = initError
export const adminAuth = adminApp ? getAuth(adminApp) : null
export const adminDb = adminApp ? getFirestore(adminApp) : null
export const adminStorage = adminApp ? getStorage(adminApp) : null

export function requireAdmin() {
  if (!adminReady) {
    const reason = initError?.message || 'Application Default Credentials are unavailable.'
    const error = new Error(`Firebase Admin is not configured. Set GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT_JSON. ${reason}`)
    error.status = 503
    throw error
  }
  return { auth: adminAuth, db: adminDb }
}
