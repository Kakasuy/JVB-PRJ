'use client'

import { useAuth } from '@/contexts/AuthContext'
import BookingTabs from '../[handle]/BookingTabs'
import { Divider } from '@/shared/divider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Avatar from '@/shared/Avatar'

const MyProfilePage = () => {
  const { currentUser, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login')
    }
  }, [currentUser, loading, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-3 text-neutral-600">Loading...</span>
      </div>
    )
  }

  if (!currentUser) {
    return null
  }

  return (
    <div className="container mt-12 mb-24 lg:mb-32">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="flex items-center space-x-4 mb-8">
          <Avatar 
            imgUrl={currentUser.photoURL || '/placeholder-avatar.jpg'}
            sizeClass="h-16 w-16"
          />
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
              {currentUser.displayName || 'My Profile'}
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400">
              {currentUser.email}
            </p>
          </div>
        </div>

        {/* My Bookings Section */}
        <div className="listingSection__wrap">
          <div>
            <h2 className="text-2xl font-semibold">My Bookings</h2>
            <span className="mt-2 block text-neutral-500 dark:text-neutral-400">
              View and manage your hotel booking history
            </span>
          </div>
          <Divider className="w-14!" />
          <BookingTabs userId={currentUser.uid} />
        </div>
      </div>
    </div>
  )
}

export default MyProfilePage