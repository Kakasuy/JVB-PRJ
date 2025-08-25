'use client'

import { auth } from '@/lib/firebase'
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink
} from 'firebase/auth'
import { createContext, useContext, useEffect, useState } from 'react'

interface AuthContextType {
  currentUser: User | null
  login: (email: string, password: string) => Promise<any>
  signup: (email: string, password: string, name?: string) => Promise<any>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  sendMagicLink: (email: string) => Promise<void>
  completeMagicLinkSignIn: (email?: string) => Promise<any>
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

  function sendMagicLink(email: string) {
    const actionCodeSettings = {
      url: `${window.location.origin}/complete-signin`,
      handleCodeInApp: true,
    }
    
    return sendSignInLinkToEmail(auth, email, actionCodeSettings).then(() => {
      // Store email locally so user doesn't need to re-enter it
      window.localStorage.setItem('emailForSignIn', email)
    })
  }

  function completeMagicLinkSignIn(email?: string) {
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let emailForSignIn = email
      
      // Get email from localStorage if not provided
      if (!emailForSignIn) {
        emailForSignIn = window.localStorage.getItem('emailForSignIn')
      }
      
      if (!emailForSignIn) {
        throw new Error('Email is required to complete sign-in')
      }

      return signInWithEmailLink(auth, emailForSignIn, window.location.href).then((result) => {
        // Clear the stored email
        window.localStorage.removeItem('emailForSignIn')
        return result
      })
    }
    throw new Error('Invalid sign-in link')
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
    sendMagicLink,
    completeMagicLinkSignIn,
    loading
  }

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>
}