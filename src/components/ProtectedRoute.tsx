'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { currentUser, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login')
    }
  }, [currentUser, loading, router])

  // Show loading while checking auth status
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="size-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
          <p className="mt-2 text-sm text-neutral-500">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render anything if not authenticated (redirect will happen)
  if (!currentUser) {
    return null
  }

  return <>{children}</>
}