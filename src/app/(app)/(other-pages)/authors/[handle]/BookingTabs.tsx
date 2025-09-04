'use client'

import { useState, useMemo } from 'react'
import { useUserBookings } from '@/hooks/useUserBookings'
import BookingCard from '@/components/BookingCard'
import TransferCard from '@/components/TransferCard'
import { HotelBooking, TransferBooking } from '@/services/BookingService'
import ButtonSecondary from '@/shared/ButtonSecondary'

interface BookingTabsProps {
  userId: string
}

const BookingTabs: React.FC<BookingTabsProps> = ({ userId }) => {
  const { bookings, transferBookings, allBookings, loading, error, refreshBookings } = useUserBookings()
  const [activeCategory, setActiveCategory] = useState<'stays' | 'experiences' | 'real-estate' | 'car-rentals'>('stays')
  const [activeStatusTab, setActiveStatusTab] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('all')

  // Category tabs configuration  
  const categoryTabs = [
    { id: 'stays', name: 'Stays', count: bookings.length },
    { id: 'experiences', name: 'Experiences', count: 0 },
    { id: 'real-estate', name: 'Real Estate', count: 0 },
    { id: 'car-rentals', name: 'Car Rentals', count: transferBookings.length }
  ] as const

  // Status tabs configuration for current category
  const getStatusTabs = () => {
    if (activeCategory === 'stays') {
      return [
        { id: 'all', name: 'All', count: bookings.length },
        { id: 'upcoming', name: 'Upcoming', count: bookings.filter(b => b.status === 'upcoming').length },
        { id: 'completed', name: 'Completed', count: bookings.filter(b => b.status === 'completed').length },
        { id: 'cancelled', name: 'Cancelled', count: bookings.filter(b => b.status === 'cancelled').length }
      ] as const
    } else if (activeCategory === 'car-rentals') {
      return [
        { id: 'all', name: 'All', count: transferBookings.length },
        { id: 'upcoming', name: 'Upcoming', count: transferBookings.filter(t => t.status === 'upcoming').length },
        { id: 'completed', name: 'Completed', count: transferBookings.filter(t => t.status === 'completed').length },
        { id: 'cancelled', name: 'Cancelled', count: transferBookings.filter(t => t.status === 'cancelled').length }
      ] as const
    } else {
      return [{ id: 'all', name: 'All', count: 0 }] as const
    }
  }

  const statusTabs = getStatusTabs()

  // Get filtered data for current category and status
  const getFilteredData = () => {
    if (activeCategory === 'stays') {
      if (activeStatusTab === 'all') return bookings
      return bookings.filter(booking => booking.status === activeStatusTab)
    } else if (activeCategory === 'car-rentals') {
      if (activeStatusTab === 'all') return transferBookings
      return transferBookings.filter(transfer => transfer.status === activeStatusTab)
    }
    return []
  }

  const filteredData = getFilteredData()

  const handleCategoryChange = (categoryId: typeof activeCategory) => {
    setActiveCategory(categoryId)
    setActiveStatusTab('all') // Reset status tab when category changes
  }

  const handleStatusTabChange = (tabId: typeof activeStatusTab) => {
    setActiveStatusTab(tabId)
  }

  const getEmptyStateContent = () => {
    const categoryName = categoryTabs.find(tab => tab.id === activeCategory)?.name

    if (activeCategory === 'experiences' || activeCategory === 'real-estate') {
      return {
        icon: activeCategory === 'experiences' ? '🎭' : '🏡',
        title: `${categoryName} Coming Soon`,
        description: `${categoryName} booking feature will be available soon.`,
        actionButtons: null
      }
    }

    return {
      icon: activeCategory === 'stays' ? '🏨' : '🚗',
      title: activeStatusTab === 'all' 
        ? `No ${categoryName?.toLowerCase()} yet` 
        : `No ${activeStatusTab} ${categoryName?.toLowerCase()}`,
      description: activeStatusTab === 'all'
        ? `Start exploring and book your first ${categoryName?.toLowerCase()}!`
        : `You don't have any ${activeStatusTab} ${categoryName?.toLowerCase()} at the moment.`,
      actionButtons: activeCategory === 'stays' 
        ? <ButtonSecondary href="/stay">Find Hotels</ButtonSecondary>
        : activeCategory === 'car-rentals'
        ? <ButtonSecondary href="/car-categories/all">Book Transfers</ButtonSecondary>
        : null
    }
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

  const emptyState = getEmptyStateContent()

  return (
    <div className="w-full">
      {/* Category Tabs */}
      <div className="flex items-center gap-6 mb-8">
        {categoryTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleCategoryChange(tab.id)}
            className={`block rounded-full px-4 py-2.5 leading-none font-medium whitespace-nowrap focus-within:outline-hidden transition-all duration-200 sm:px-6 sm:py-3 ${
              activeCategory === tab.id
                ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                : 'hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {/* Status Tabs (only show if category has content) */}
      {(activeCategory === 'stays' || activeCategory === 'car-rentals') && (
        <div className="flex space-x-1 rounded-xl bg-neutral-50 p-1 dark:bg-neutral-700 mb-6">
          {statusTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleStatusTabChange(tab.id)}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                activeStatusTab === tab.id
                  ? 'bg-white text-primary-700 shadow-sm dark:bg-neutral-600 dark:text-primary-300'
                  : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
              }`}
            >
              <span>{tab.name}</span>
              {tab.count > 0 && (
                <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                  activeStatusTab === tab.id
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                    : 'bg-neutral-200 text-neutral-600 dark:bg-neutral-600 dark:text-neutral-300'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Content Area */}
      <div className="mt-8">
        {filteredData.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-neutral-400 text-4xl">
              {emptyState.icon}
            </div>
            <h3 className="mt-4 text-lg font-medium text-neutral-900 dark:text-neutral-100">
              {emptyState.title}
            </h3>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              {emptyState.description}
            </p>
            {emptyState.actionButtons && (
              <div className="mt-6">
                {emptyState.actionButtons}
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {activeCategory === 'stays' && (
                (filteredData as HotelBooking[]).map((booking) => (
                  <BookingCard 
                    key={`hotel-${booking.id}`} 
                    booking={booking}
                    className="h-full"
                  />
                ))
              )}
              
              {activeCategory === 'car-rentals' && (
                (filteredData as TransferBooking[]).map((transfer) => (
                  <TransferCard 
                    key={`transfer-${transfer.id}`} 
                    booking={transfer}
                    className="h-full"
                  />
                ))
              )}
            </div>
            
            {/* Load More Button (if needed for pagination) */}
            {filteredData.length >= 6 && (
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