'use client'

import { auth } from '@/lib/firebase'
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth'
import { createContext, useContext, useEffect, useState } from 'react'

interface AuthContextType {
  currentUser: User | null
  login: (email: string, password: string) => Promise<any>
  signup: (email: string, password: string, name?: string) => Promise<any>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  function signup(email: string, password: string, name?: string) {
    return createUserWithEmailAndPassword(auth, email, password).then(
      (userCredential) => {
        if (name && userCredential.user) {
          return updateProfile(userCredential.user, {
            displayName: name
          })
        }
        return userCredential
      }
    )
  }

  function login(email: string, password: string) {
    return signInWithEmailAndPassword(auth, email, password)
  }

  function logout() {
    return signOut(auth)
  }

  function resetPassword(email: string) {
    return sendPasswordResetEmail(auth, email)
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const value = {
    currentUser,
    login,
    signup,
    logout,
    resetPassword,
    loading
  }

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>
}