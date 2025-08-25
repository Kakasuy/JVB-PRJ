'use client'

import { useAuth } from '@/contexts/AuthContext'
import Logo from '@/shared/Logo'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function CompleteSignInPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { completeMagicLinkSignIn } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    async function handleSignIn() {
      try {
        await completeMagicLinkSignIn()
        // Redirect to home page on success
        router.push('/')
      } catch (error: any) {
        console.error('Magic link sign-in error:', error)
        setError(error.message || 'Failed to complete sign-in')
      } finally {
        setLoading(false)
      }
    }

    // Only attempt sign-in if we're actually on the complete sign-in flow
    if (typeof window !== 'undefined') {
      handleSignIn()
    }
  }, [completeMagicLinkSignIn, router])

  if (loading) {
    return (
      <div className="container flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Logo className="mx-auto mb-8 w-32" />
          <div className="mb-4 inline-flex items-center justify-center">
            <div className="size-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
          </div>
          <h2 className="mb-2 text-xl font-semibold text-neutral-900 dark:text-neutral-100">
            Completing sign-in...
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Please wait while we verify your magic link
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container flex min-h-screen items-center justify-center">
        <div className="mx-auto max-w-md text-center">
          <Logo className="mx-auto mb-8 w-32" />
          
          <div className="rounded-lg bg-red-50 p-6 dark:bg-red-900/20">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50">
              <svg className="size-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            
            <h2 className="mb-2 text-lg font-semibold text-red-900 dark:text-red-100">
              Sign-in failed
            </h2>
            <p className="mb-4 text-sm text-red-700 dark:text-red-300">
              {error}
            </p>
            
            <div className="space-y-2">
              <button
                onClick={() => router.push('/login')}
                className="w-full rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600"
              >
                Back to Login
              </button>
              <p className="text-xs text-red-600 dark:text-red-400">
                The link may have expired or already been used
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // This shouldn't render as we redirect on success, but just in case
  return (
    <div className="container flex min-h-screen items-center justify-center">
      <div className="text-center">
        <Logo className="mx-auto mb-8 w-32" />
        <h2 className="mb-2 text-xl font-semibold text-green-900 dark:text-green-100">
          Sign-in successful!
        </h2>
        <p className="text-sm text-green-700 dark:text-green-300">
          Redirecting you now...
        </p>
      </div>
    </div>
  )
}