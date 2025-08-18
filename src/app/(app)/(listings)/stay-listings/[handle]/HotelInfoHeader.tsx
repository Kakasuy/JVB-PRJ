'use client'

import SectionHeader from '../../components/SectionHeader'
import { UsersIcon } from '@heroicons/react/24/outline'
import {
  Bathtub02Icon,
  BedSingle01Icon,
  MeetingRoomIcon,
} from '@/components/Icons'
import { useHotelState } from './HotelStateContext'

interface HotelInfoHeaderProps {
  listing: any
}

const HotelInfoHeader: React.FC<HotelInfoHeaderProps> = ({ listing }) => {
  const { appliedState, currentOffer } = useHotelState()

  // Get current display values
  const currentGuests = appliedState.adults
  const currentRooms = appliedState.rooms
  
  // Use current offer data if available (from new API call), otherwise fall back to initial listing
  const offerData = currentOffer || listing
  
  // Check if we have Amadeus offer data with room details
  const amadeusOffer = offerData?.amadeus?.offers?.[0]
  
  // Extract room specs from offer (if available) or fall back to listing data
  let hotelBeds, hotelBathrooms, hotelBedrooms
  
  if (amadeusOffer?.roomDescription) {
    // Try to parse room details from Amadeus description
    const description = amadeusOffer.roomDescription.toUpperCase()
    
    // Parse beds from description (e.g., "2 DOUBLE BEDS", "1 KING BED", "TWIN BEDS")
    if (description.includes('2 DOUBLE') || description.includes('2 QUEEN') || description.includes('2 TWIN') || description.includes('TWIN BEDS')) {
      hotelBeds = 2
    } else if (description.includes('1 KING') || description.includes('1 QUEEN') || description.includes('1 DOUBLE') || description.includes('KING BED') || description.includes('QUEEN BED')) {
      hotelBeds = 1
    } else if (description.match(/\d+\s*(BED|DOUBLE|QUEEN|KING)/)) {
      // Extract number from patterns like "3 BEDS" or "2 DOUBLE"
      const match = description.match(/(\d+)\s*(BED|DOUBLE|QUEEN|KING)/)
      hotelBeds = match ? parseInt(match[1]) : (offerData.beds || 2)
    } else {
      hotelBeds = offerData.beds || 2
    }
    
    // Estimate bathrooms based on beds/rooms (more beds usually means more bathrooms)
    hotelBathrooms = Math.max(1, Math.ceil(hotelBeds / 2)) || offerData.bathrooms || 1
    hotelBedrooms = Math.max(1, currentRooms) || offerData.bedrooms || 1
  } else {
    // Use original listing data
    hotelBeds = offerData.beds || 2
    hotelBathrooms = offerData.bathrooms || 1  
    hotelBedrooms = offerData.bedrooms || 1
  }
  
  // Display room specs (multiply by room count if booking multiple rooms)
  const displayBeds = hotelBeds * currentRooms
  const displayBathrooms = hotelBathrooms * currentRooms  
  const displayBedrooms = hotelBedrooms * currentRooms

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
        <span>{displayBeds} bed{displayBeds !== 1 ? 's' : ''}</span>
      </div>
      <div className="flex items-center gap-x-3">
        <Bathtub02Icon className="mb-0.5 size-6" />
        <span>{displayBathrooms} bath{displayBathrooms !== 1 ? 's' : ''}</span>
      </div>
      <div className="flex items-center gap-x-3">
        <MeetingRoomIcon className="mb-0.5 size-6" />
        <span>{displayBedrooms} bedroom{displayBedrooms !== 1 ? 's' : ''}</span>
      </div>
    </SectionHeader>
  )
}

export default HotelInfoHeader