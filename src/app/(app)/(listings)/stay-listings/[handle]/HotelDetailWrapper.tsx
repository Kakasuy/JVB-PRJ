'use client'

import { useState, useCallback } from 'react'
import SectionHeader from '../../components/SectionHeader'
import { UsersIcon } from '@heroicons/react/24/outline'
import {
  Bathtub02Icon,
  BedSingle01Icon,
  MeetingRoomIcon,
} from '@/components/Icons'
import HotelDetailClient from './HotelDetailClient'

interface HotelDetailWrapperProps {
  listing: any
  hotelId: string
  initialSearchParams: {
    checkInDate?: string
    checkOutDate?: string
    adults?: string
    rooms?: string
  }
}

const HotelDetailWrapper: React.FC<HotelDetailWrapperProps> = ({
  listing,
  hotelId,
  initialSearchParams
}) => {
  // Current display state for hotel info
  const [displayState, setDisplayState] = useState({
    checkInDate: initialSearchParams.checkInDate || '',
    checkOutDate: initialSearchParams.checkOutDate || '',
    adults: parseInt(initialSearchParams.adults || '1'),
    rooms: parseInt(initialSearchParams.rooms || '1')
  })

  // Calculate dynamic values based on current state
  const calculateBeds = useCallback((adults: number, rooms: number) => {
    // Simple heuristic: 1-2 adults = 1 bed per room, 3+ adults = 2 beds per room
    const bedsPerRoom = adults <= 2 ? 1 : 2
    return Math.max(1, bedsPerRoom * rooms)
  }, [])

  const handleStateChange = useCallback((newState: {
    checkInDate: string
    checkOutDate: string
    adults: number
    rooms: number
  }) => {
    setDisplayState(newState)
  }, [])

  // Get current display values
  const currentGuests = displayState.adults
  const currentRooms = displayState.rooms
  const currentBeds = calculateBeds(currentGuests, currentRooms)
  const currentBathrooms = listing.bathrooms || Math.max(1, Math.floor(currentRooms * 1.5)) // Estimate bathrooms
  const currentBedrooms = listing.bedrooms || currentRooms // Assume 1 bedroom per room

  const renderSectionHeader = () => {
    const {
      address,
      host,
      listingCategory,
      reviewCount,
      reviewStart,
      title,
    } = listing

    return (
      <SectionHeader
        address={address}
        host={host}
        listingCategory={listingCategory}
        reviewCount={reviewCount}
        reviewStart={reviewStart}
        title={title}
      >
        <div className="flex items-center gap-x-3">
          <UsersIcon className="mb-0.5 size-6" />
          <span>{currentGuests} guest{currentGuests !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center gap-x-3">
          <BedSingle01Icon className="mb-0.5 size-6" />
          <span>{currentBeds} bed{currentBeds !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center gap-x-3">
          <Bathtub02Icon className="mb-0.5 size-6" />
          <span>{currentBathrooms} bath{currentBathrooms !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center gap-x-3">
          <MeetingRoomIcon className="mb-0.5 size-6" />
          <span>{currentBedrooms} bedroom{currentBedrooms !== 1 ? 's' : ''}</span>
        </div>
      </SectionHeader>
    )
  }

  return (
    <>
      {/* HOTEL INFO HEADER - Updates dynamically */}
      {renderSectionHeader()}
      
      {/* Hidden component that controls the shared state */}
      <div style={{ display: 'none' }}>
        <HotelDetailClient 
          initialListing={listing}
          hotelId={hotelId}
          searchParams={initialSearchParams}
          onStateChange={handleStateChange}
        />
      </div>
    </>
  )
}

export default HotelDetailWrapper