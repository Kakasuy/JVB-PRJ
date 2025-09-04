'use client'

import { useAuth } from '@/contexts/AuthContext'
import BookingTabs from './BookingTabs'
import ListingTabs from './ListingTabs'
import { Divider } from '@/shared/divider'

interface UserBookingsPageProps {
  handle: string
  displayName: string
  author: any
}

const UserBookingsPage: React.FC<UserBookingsPageProps> = ({ handle, displayName, author }) => {
  const { currentUser } = useAuth()
  
  // Check if current user is viewing their own profile
  // Since we don't have real user profile integration, always show BookingTabs for logged in users
  const isOwnProfile = currentUser !== null
  
  console.log('🔍 Profile Debug:', {
    handle,
    currentUserId: currentUser?.uid,
    authorId: author?.id,
    currentUserEmail: currentUser?.email,
    authorEmail: author?.email,
    isOwnProfile
  })

  const renderSectionContent = () => {
    if (isOwnProfile) {
      return (
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
      )
    } else {
      return (
        <div className="listingSection__wrap">
          <div>
            <h2 className="text-2xl font-semibold">{displayName}&apos;s listings</h2>
            <span className="mt-2 block text-neutral-500 dark:text-neutral-400">
              {displayName}&apos;s listings is very rich, 5 star reviews help him to be more branded.
            </span>
          </div>
          <Divider className="w-14!" />
          <ListingTabs />
        </div>
      )
    }
  }

  return renderSectionContent()
}

export default UserBookingsPage