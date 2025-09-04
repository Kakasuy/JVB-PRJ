'use client'

import { useState, useMemo } from 'react'
import { useUserBookings } from '@/hooks/useUserBookings'
import BookingCard from '@/components/BookingCard'
import { HotelBooking } from '@/services/BookingService'
import ButtonSecondary from '@/shared/ButtonSecondary'

interface BookingTabsProps {
  userId: string
}

const BookingTabs: React.FC<BookingTabsProps> = ({ userId }) => {
  const { bookings, loading, error, refreshBookings } = useUserBookings()
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('all')

  // Filter bookings based on active tab
  const filteredBookings = useMemo(() => {
    if (activeTab === 'all') return bookings
    return bookings.filter(booking => booking.status === activeTab)
  }, [bookings, activeTab])

  // Tab configuration
  const tabs = [
    { id: 'all', name: 'All Bookings', count: bookings.length },
    { id: 'upcoming', name: 'Upcoming', count: bookings.filter(b => b.status === 'upcoming').length },
    { id: 'completed', name: 'Completed', count: bookings.filter(b => b.status === 'completed').length },
    { id: 'cancelled', name: 'Cancelled', count: bookings.filter(b => b.status === 'cancelled').length }
  ] as const

  const handleTabChange = (tabId: typeof activeTab) => {
    setActiveTab(tabId)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-3 text-neutral-600">Loading your bookings...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <ButtonSecondary onClick={refreshBookings}>Try Again</ButtonSecondary>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Tab Navigation */}
      <div className="flex space-x-1 rounded-xl bg-neutral-100 p-1 dark:bg-neutral-800">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
              activeTab === tab.id
                ? 'bg-white text-primary-700 shadow-sm dark:bg-neutral-700 dark:text-primary-300'
                : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
            }`}
          >
            <span>{tab.name}</span>
            {tab.count > 0 && (
              <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                activeTab === tab.id
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                  : 'bg-neutral-200 text-neutral-600 dark:bg-neutral-600 dark:text-neutral-300'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Booking Cards Grid */}
      <div className="mt-8">
        {filteredBookings.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-neutral-400">
              🏨
            </div>
            <h3 className="mt-4 text-lg font-medium text-neutral-900 dark:text-neutral-100">
              {activeTab === 'all' 
                ? 'No bookings yet' 
                : `No ${activeTab} bookings`
              }
            </h3>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              {activeTab === 'all'
                ? 'Start exploring and book your first hotel stay!'
                : `You don't have any ${activeTab} bookings at the moment.`
              }
            </p>
            {activeTab === 'all' && (
              <div className="mt-6">
                <ButtonSecondary href="/stay">Find Hotels</ButtonSecondary>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {filteredBookings.map((booking) => (
                <BookingCard 
                  key={booking.id} 
                  booking={booking}
                  className="h-full"
                />
              ))}
            </div>
            
            {/* Load More Button (if needed for pagination) */}
            {filteredBookings.length >= 6 && (
              <div className="flex justify-center mt-8">
                <ButtonSecondary>Load More Bookings</ButtonSecondary>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default BookingTabs