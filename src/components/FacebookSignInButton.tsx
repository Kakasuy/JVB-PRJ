'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface Props {
  className?: string
  onSuccess?: () => void
  onError?: (error: string) => void
}

export default function FacebookSignInButton({ className = '', onSuccess, onError }: Props) {
  const [loading, setLoading] = useState(false)
  const { signInWithFacebook } = useAuth()
  const router = useRouter()

  async function handleFacebookSignIn() {
    try {
      setLoading(true)
      await signInWithFacebook()
      
      // Call success callback or redirect
      if (onSuccess) {
        onSuccess()
      } else {
        router.push('/')
      }
    } catch (error: any) {
      console.error('Facebook Sign-In error:', error)
      const errorMessage = error.message || 'Failed to sign in with Facebook'
      
      if (onError) {
        onError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleFacebookSignIn}
      disabled={loading}
      className={`flex w-full items-center justify-center gap-3 rounded-lg border border-neutral-200 bg-[#1877F2] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[#166FE5] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 ${className}`}
    >
      {loading ? (
        <>
          <div className="size-5 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
          <span>Signing in...</span>
        </>
      ) : (
        <>
          <svg className="size-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          <span>Continue with Facebook</span>
        </>
      )}
    </button>
  )
}