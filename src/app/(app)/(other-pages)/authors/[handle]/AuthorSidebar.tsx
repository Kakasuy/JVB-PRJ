'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useUserProfile } from '@/hooks/useUserProfile'
import { useEffect, useState } from 'react'
import Avatar from '@/shared/Avatar'
import StartRating from '@/components/StartRating'
import SocialsList from '@/shared/SocialsList'
import { Divider } from '@/shared/divider'
import { Link } from '@/shared/link'
import { 
  Medal01Icon, 
  Award04Icon,
  Flag03Icon,
  Mail01Icon,
  UserIcon
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { HomeIcon } from '@heroicons/react/24/outline'
import { Calendar01Icon, Comment01Icon } from '@/components/Icons'

interface AuthorSidebarProps {
  author: any
  handle: string
  displayName: string
  avatarUrl: string
  count: number
  description: string
  starRating: number
  address: string
  languages: string
  joinedDate: string
  reviewsCount: number
}

export default function AuthorSidebar({ 
  author,
  handle,
  displayName: initialDisplayName,
  avatarUrl: initialAvatarUrl,
  count: initialCount,
  description: initialDescription,
  starRating: initialStarRating,
  address: initialAddress,
  languages: initialLanguages,
  joinedDate: initialJoinedDate,
  reviewsCount: initialReviewsCount
}: AuthorSidebarProps) {
  const { currentUser } = useAuth()
  const { profile } = useUserProfile()
  
  // State để lưu thông tin hiển thị
  const [authorData, setAuthorData] = useState({
    displayName: initialDisplayName,
    avatarUrl: initialAvatarUrl,
    count: initialCount,
    description: initialDescription,
    starRating: initialStarRating,
    address: initialAddress,
    languages: initialLanguages,
    joinedDate: initialJoinedDate,
    reviewsCount: initialReviewsCount
  })

  useEffect(() => {
    // Kiểm tra nếu đây là trang của current user
    const isCurrentUser = handle === 'current-user' || 
                         handle === 'my-profile' || 
                         (profile?.handle && handle === profile.handle)

    if (isCurrentUser && currentUser && profile) {
      // Sử dụng thông tin thật từ Firebase
      setAuthorData({
        displayName: profile.displayName || currentUser.displayName || 'User',
        avatarUrl: profile.photoURL || currentUser.photoURL || '/placeholder-avatar.jpg',
        count: 0, // Số listings của user
        description: profile.bio || 'Welcome to my profile! I\'m excited to host you.',
        starRating: 4.8, // Có thể tính từ reviews thật
        address: profile.address || 'Ha Noi, Viet Nam',
        languages: profile.languages?.join(', ') || 'English, Vietnamese',
        joinedDate: profile.createdAt ? 
          new Date(profile.createdAt.seconds * 1000).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long' 
          }) : 'Recently',
        reviewsCount: 0, // Reviews của user này
      })
    }
  }, [currentUser, profile, handle])

  const { displayName, avatarUrl, count, description, starRating, address, languages, joinedDate, reviewsCount } = authorData

  return (
    <div>
      <div className="flex w-full flex-col items-start gap-y-6 border-neutral-200 px-0 sm:gap-y-7 sm:rounded-2xl sm:border sm:p-6 xl:p-8 dark:border-neutral-700">
        <div className="flex items-center gap-x-5">
          <Avatar src={avatarUrl} className="size-24" />
          <div className="flex flex-col gap-y-3">
            <h2 className="text-3xl font-semibold">{displayName}</h2>
          </div>
        </div>


        {/* ---- */}
        <p className="block leading-relaxed text-neutral-700 dark:text-neutral-300">{description}</p>

        {/* ---- */}
        <SocialsList itemClass="flex items-center justify-center w-9 h-9 rounded-full bg-neutral-100 dark:bg-neutral-800 text-xl" />

        {/* ---- */}
        <div className="flex flex-col gap-y-3.5 text-neutral-700 dark:text-neutral-300">
          <div className="flex items-center gap-x-4">
            <HomeIcon className="size-6" />
            <span>{address}</span>
          </div>

          <div className="flex items-center gap-x-4">
            <Comment01Icon className="size-6" />
            <span>{languages}</span>
          </div>

          <div className="flex items-center gap-x-4">
            <Calendar01Icon className="size-6" />
            <span>{`Joined on ${joinedDate}`}</span>
          </div>

          {/* New user info */}
          {(handle === 'current-user' || handle === 'my-profile' || (profile?.handle && handle === profile.handle)) && currentUser && profile && (
            <>
              {profile.email && (
                <div className="flex items-center gap-x-4">
                  <HugeiconsIcon icon={Mail01Icon} size={24} color="currentColor" strokeWidth={1.5} />
                  <span>{profile.email}</span>
                </div>
              )}
              
              {profile.gender && (
                <div className="flex items-center gap-x-4">
                  <HugeiconsIcon icon={UserIcon} size={24} color="currentColor" strokeWidth={1.5} />
                  <span>{profile.gender}</span>
                </div>
              )}
              
              {profile.dateOfBirth && (
                <div className="flex items-center gap-x-4">
                  <Calendar01Icon className="size-6" />
                  <span>{`Birthday: ${profile.dateOfBirth}`}</span>
                </div>
              )}
            </>
          )}
        </div>

        <Divider />
        <Link href={'#'} className="flex items-center gap-x-2 text-sm text-neutral-700 dark:text-neutral-300">
          <HugeiconsIcon icon={Flag03Icon} size={16} color="currentColor" strokeWidth={1.5} />
          <span>Report this host</span>
        </Link>
      </div>
    </div>
  )
}