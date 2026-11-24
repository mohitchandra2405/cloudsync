import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db, isFirebaseConfigured } from '../services/firebase.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isFirebaseConfigured) { setLoading(false); return undefined }
    return onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser)
      if (nextUser) {
        try {
          const snapshot = await getDoc(doc(db, 'users', nextUser.uid))
          const nextProfile = snapshot.exists() ? snapshot.data() : {
            name: nextUser.displayName || nextUser.email?.split('@')[0] || 'CloudSync user',
            email: nextUser.email || '', photoURL: nextUser.photoURL || '',
          }
          setProfile(nextProfile)
        } catch (error) { console.error('Profile could not be loaded', error); setProfile(null) }
      } else setProfile(null)
      setLoading(false)
    })
  }, [])

  const saveProfile = async (data) => {
    if (!user) throw new Error('Sign in to update your profile.')
    const next = { ...profile, ...data, email: user.email || '', updatedAt: serverTimestamp() }
    await setDoc(doc(db, 'users', user.uid), next, { merge: true })
    setProfile({ ...next, updatedAt: new Date() })
  }

  const value = useMemo(() => ({ user, profile, loading, saveProfile }), [user, profile, loading])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
