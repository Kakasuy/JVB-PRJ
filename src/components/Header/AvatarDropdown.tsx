'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useUserProfile } from '@/hooks/useUserProfile'
import avatarImage from '@/images/avatars/Image-1.png'
import Avatar from '@/shared/Avatar'
import { Divider } from '@/shared/divider'
import { Link } from '@/shared/link'
import SwitchDarkMode2 from '@/shared/SwitchDarkMode2'
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react'
import {
  BulbChargingIcon,
  FavouriteIcon,
  Idea01Icon,
  Logout01Icon,
  Task01Icon,
  UserIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useRouter } from 'next/navigation'

interface Props {
  className?: string
}

export default function AvatarDropdown({ className }: Props) {
  const { currentUser, loading, logout } = useAuth()
  const { profile, loading: profileLoading } = useUserProfile()
  const router = useRouter()

  async function handleLogout() {
    try {
      await logout()
      router.push('/')
    } catch (error) {
      console.error('Failed to log out:', error)
    }
  }

  // Show loading state while checking auth
  if (loading || profileLoading) {
    return (
      <div className={className}>
        <div className="rounded-full bg-neutral-200 animate-pulse dark:bg-neutral-700">
          <div className="h-8 w-8 bg-neutral-300 rounded-full dark:bg-neutral-600"></div>
        </div>
      </div>
    )
  }

  // Show login button if user is not authenticated
  if (!currentUser) {
    return (
      <div className="!opacity-100 !visible !block">
        <Link 
          href="/login" 
          className="rounded-full bg-transparent border border-neutral-300 px-4 py-2 text-sm font-medium text-black hover:bg-primary-700 hover:text-white hover:border-primary-700 transition-colors duration-200 dark:text-white dark:border-neutral-600"
        >
          Login
        </Link>
      </div>
    )
  }

  // Get avatar and display name from profile or fallback to auth
  const avatarSrc = profile?.photoURL || currentUser?.photoURL || avatarImage.src
  const displayName = profile?.displayName || currentUser?.displayName || currentUser?.email || 'User'
  const userEmail = profile?.email || currentUser?.email || ''

  // Check if profile is incomplete
  const isProfileIncomplete = !profile?.displayName || !profile?.photoURL

  return (
    <div className={className}>
      <Popover>
        <PopoverButton className="-m-1.5 flex cursor-pointer items-center justify-center rounded-full p-1.5 hover:bg-neutral-100 focus-visible:outline-hidden dark:hover:bg-neutral-800">
          <Avatar src={avatarSrc} className="size-8" />
        </PopoverButton>

        <PopoverPanel
          transition
          anchor={{
            to: 'bottom end',
            gap: 16,
          }}
          className="z-40 w-80 rounded-3xl shadow-lg ring-1 ring-black/5 transition duration-200 ease-in-out data-closed:translate-y-1 data-closed:opacity-0"
        >
          <div className="relative grid grid-cols-1 gap-6 bg-white px-6 py-7 dark:bg-neutral-800">
            <div className="flex items-center space-x-3">
              <Avatar src={avatarSrc} className="size-12" />

              <div className="grow">
                <h4 className="font-semibold">{displayName}</h4>
                <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">{userEmail}</p>
              </div>
            </div>

            {/* Profile completion reminder */}
            {isProfileIncomplete && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
                  <span className="text-sm text-orange-700">Complete your profile</span>
                </div>
                <p className="text-xs text-orange-600 mt-1">
                  Add your name and photo to get started
                </p>
              </div>
            )}

            <Divider />

            {/* ------------------ 1 --------------------- */}
            <Link
              href={'/account'}
              className="-m-3 flex items-center rounded-lg p-2 transition duration-150 ease-in-out hover:bg-neutral-100 focus:outline-hidden focus-visible:ring-3 focus-visible:ring-orange-500/50 dark:hover:bg-neutral-700"
            >
              <div className="flex shrink-0 items-center justify-center text-neutral-500 dark:text-neutral-300">
                <HugeiconsIcon icon={UserIcon} size={24} strokeWidth={1.5} />
              </div>
              <p className="ms-4 text-sm font-medium">{'My Account'}</p>
            </Link>

            {/* ------------------ 2 --------------------- */}
            <Link
              href={profile?.handle ? `/authors/${profile.handle}` : '/authors/current-user'}
              className="-m-3 flex items-center rounded-lg p-2 transition duration-150 ease-in-out hover:bg-neutral-100 focus:outline-hidden focus-visible:ring-3 focus-visible:ring-orange-500/50 dark:hover:bg-neutral-700"
            >
              <div className="flex shrink-0 items-center justify-center text-neutral-500 dark:text-neutral-300">
                <HugeiconsIcon icon={Task01Icon} size={24} strokeWidth={1.5} />
              </div>
              <p className="ms-4 text-sm font-medium">My Public Profile</p>
            </Link>

            {/* ------------------ 2 --------------------- */}
            <Link
              href={'/account-savelists'}
              className="-m-3 flex items-center rounded-lg p-2 transition duration-150 ease-in-out hover:bg-neutral-100 focus:outline-hidden focus-visible:ring-3 focus-visible:ring-orange-500/50 dark:hover:bg-neutral-700"
            >
              <div className="flex shrink-0 items-center justify-center text-neutral-500 dark:text-neutral-300">
                <HugeiconsIcon icon={FavouriteIcon} size={24} strokeWidth={1.5} />
              </div>
              <p className="ms-4 text-sm font-medium">Wishlist</p>
            </Link>

            <Divider />

            {/* ------------------ 2 --------------------- */}
            <div className="focus-visible:ring-opacity-50 -m-3 flex items-center justify-between rounded-lg p-2 hover:bg-neutral-100 focus:outline-none focus-visible:ring focus-visible:ring-orange-500 dark:hover:bg-neutral-700">
              <div className="flex items-center">
                <div className="flex flex-shrink-0 items-center justify-center text-neutral-500 dark:text-neutral-300">
                  <HugeiconsIcon icon={Idea01Icon} size={24} strokeWidth={1.5} />
                </div>
                <p className="ms-4 text-sm font-medium">Dark theme</p>
              </div>
              <SwitchDarkMode2 />
            </div>

            {/* ------------------ 2 --------------------- */}

            <Link
              href={'#'}
              className="-m-3 flex items-center rounded-lg p-2 transition duration-150 ease-in-out hover:bg-neutral-100 focus:outline-hidden focus-visible:ring-3 focus-visible:ring-orange-500/50 dark:hover:bg-neutral-700"
            >
              <div className="flex shrink-0 items-center justify-center text-neutral-500 dark:text-neutral-300">
                <HugeiconsIcon icon={BulbChargingIcon} size={24} strokeWidth={1.5} />
              </div>
              <p className="ms-4 text-sm font-medium">{'Help'}</p>
            </Link>

            {/* ------------------ 2 --------------------- */}
            <button
              onClick={handleLogout}
              className="-m-3 flex w-full items-center rounded-lg p-2 text-left transition duration-150 ease-in-out hover:bg-neutral-100 focus:outline-hidden focus-visible:ring-3 focus-visible:ring-orange-500/50 dark:hover:bg-neutral-700"
            >
              <div className="flex shrink-0 items-center justify-center text-neutral-500 dark:text-neutral-300">
                <HugeiconsIcon icon={Logout01Icon} size={24} strokeWidth={1.5} />
              </div>
              <p className="ms-4 text-sm font-medium">{'Log out'}</p>
            </button>
          </div>
        </PopoverPanel>
      </Popover>
    </div>
  )
}
