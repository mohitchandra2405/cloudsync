import {
  createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword,
  signInWithPopup, signOut, updateProfile,
} from 'firebase/auth'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db, googleProvider, isFirebaseConfigured } from './firebase.js'

function requireFirebase() {
  if (!isFirebaseConfigured) throw new Error('Firebase is not configured yet. Copy .env.example to .env.local and add your Firebase web app settings.')
}

export async function registerUser({ name, email, password }) {
  requireFirebase()
  const credential = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password)
  await updateProfile(credential.user, { displayName: name.trim() })
  await setDoc(doc(db, 'users', credential.user.uid), {
    name: name.trim(), email: credential.user.email.toLowerCase(), photoURL: '', createdAt: serverTimestamp(),
  })
  return credential.user
}

export async function loginUser(email, password) {
  requireFirebase()
  return (await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password)).user
}

export async function loginWithGoogle() {
  requireFirebase()
  const { user } = await signInWithPopup(auth, googleProvider)
  await setDoc(doc(db, 'users', user.uid), {
    name: user.displayName || user.email.split('@')[0], email: user.email.toLowerCase(), photoURL: user.photoURL || '',
    updatedAt: serverTimestamp(),
  }, { merge: true })
  return user
}

export async function resetPassword(email) {
  requireFirebase()
  return sendPasswordResetEmail(auth, email.trim().toLowerCase())
}

export async function logoutUser() { if (auth) await signOut(auth) }
