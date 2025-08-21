import { TStayListing } from '@/data/listings'

export interface ClientSideFilterParams {
  price_min?: string | null
  price_max?: string | null
  hotel_stars?: string | null
  beds?: string | null
  bedrooms?: string | null
  bathrooms?: string | null
  room_types?: string | null
  free_cancellation?: string | null
  refundable_only?: string | null
  payment_types?: string | null
}

// Define which filters can be handled client-side
export const CLIENT_SIDE_FILTERS = [
  'price_min', 'price_max', 'hotel_stars', 
  'beds', 'bedrooms', 'bathrooms', 'room_types',
  'free_cancellation', 'refundable_only', 'payment_types'
]

// Define which filters require server-side API calls
export const SERVER_SIDE_FILTERS = [
  'cityCode', 'checkInDate', 'checkOutDate', 
  'adults', 'rooms', 'radius', 'amenities', 'board_types'
]

// Check if a filter change requires API call
export function requiresAPICall(changedFilters: string[]): boolean {
  return changedFilters.some(filter => SERVER_SIDE_FILTERS.includes(filter))
}

// Extract price from hotel data
function getHotelPrice(hotel: TStayListing): number {
  // Try to parse price from different possible formats
  if (typeof hotel.price === 'string') {
    const priceMatch = hotel.price.match(/[\d,]+/)
    if (priceMatch) {
      return parseFloat(priceMatch[0].replace(/,/g, ''))
    }
  }
  
  // Check Amadeus data if available
  if (hotel.amadeus?.offers?.[0]?.price?.total) {
    return parseFloat(hotel.amadeus.offers[0].price.total)
  }
  
  return 0
}

// Extract star rating from hotel data
function getHotelStars(hotel: TStayListing): number {
  // Check reviewStart rating (converted to stars)
  if (hotel.reviewStart) {
    return Math.round(hotel.reviewStart)
  }
  
  // Check Amadeus rating if available
  if (hotel.amadeus?.hotel?.rating) {
    return parseInt(hotel.amadeus.hotel.rating)
  }
  
  return 0
}

// Check if hotel has free cancellation
function hasFreeCancel(hotel: TStayListing): boolean {
  // Check Amadeus cancellation policy
  if (hotel.amadeus?.offers?.[0]?.policies?.cancellation) {
    const cancelPolicy = hotel.amadeus.offers[0].policies.cancellation
    return cancelPolicy.type === 'FREE_CANCELLATION' || 
           cancelPolicy.amount?.amount === '0.00'
  }
  
  // Default assumption for mock data
  return Math.random() > 0.3 // 70% have free cancellation
}

// Check if hotel is refundable
function isRefundable(hotel: TStayListing): boolean {
  // Check Amadeus guarantee policy  
  if (hotel.amadeus?.offers?.[0]?.policies?.guarantee) {
    const guarantee = hotel.amadeus.offers[0].policies.guarantee
    return guarantee.acceptedPayments?.creditCards?.length > 0
  }
  
  // Default assumption for mock data
  return Math.random() > 0.2 // 80% are refundable
}

// Main client-side filtering function
export function applyClientSideFilters(
  hotels: TStayListing[],
  filters: ClientSideFilterParams
): TStayListing[] {
  console.log('⚡ Applying client-side filters:', filters)
  console.log(`📊 Filtering ${hotels.length} hotels`)
  
  let filteredHotels = [...hotels]

  // Price range filter
  if (filters.price_min || filters.price_max) {
    const minPrice = filters.price_min ? parseFloat(filters.price_min) : 0
    const maxPrice = filters.price_max ? parseFloat(filters.price_max) : Infinity
    
    filteredHotels = filteredHotels.filter(hotel => {
      const price = getHotelPrice(hotel)
      const inRange = price >= minPrice && price <= maxPrice
      if (!inRange) {
        console.log(`💰 Filtered out ${hotel.title}: $${price} not in range $${minPrice}-$${maxPrice}`)
      }
      return inRange
    })
    
    console.log(`💰 Price filter (${minPrice}-${maxPrice}): ${filteredHotels.length} hotels remaining`)
  }

  // Hotel stars filter
  if (filters.hotel_stars) {
    const selectedStars = filters.hotel_stars.split(',').map(s => parseInt(s))
    
    filteredHotels = filteredHotels.filter(hotel => {
      const stars = getHotelStars(hotel)
      const matches = selectedStars.includes(stars)
      if (!matches) {
        console.log(`⭐ Filtered out ${hotel.title}: ${stars} stars not in ${selectedStars}`)
      }
      return matches
    })
    
    console.log(`⭐ Stars filter (${selectedStars}): ${filteredHotels.length} hotels remaining`)
  }

  // Beds filter
  if (filters.beds) {
    const minBeds = parseInt(filters.beds)
    
    filteredHotels = filteredHotels.filter(hotel => {
      const beds = hotel.beds || 1
      const hasEnough = beds >= minBeds
      if (!hasEnough) {
        console.log(`🛏️ Filtered out ${hotel.title}: ${beds} beds < ${minBeds}`)
      }
      return hasEnough
    })
    
    console.log(`🛏️ Beds filter (${minBeds}+): ${filteredHotels.length} hotels remaining`)
  }

  // Bedrooms filter
  if (filters.bedrooms) {
    const minBedrooms = parseInt(filters.bedrooms)
    
    filteredHotels = filteredHotels.filter(hotel => {
      const bedrooms = hotel.bedrooms || 1
      const hasEnough = bedrooms >= minBedrooms
      if (!hasEnough) {
        console.log(`🏠 Filtered out ${hotel.title}: ${bedrooms} bedrooms < ${minBedrooms}`)
      }
      return hasEnough
    })
    
    console.log(`🏠 Bedrooms filter (${minBedrooms}+): ${filteredHotels.length} hotels remaining`)
  }

  // Bathrooms filter
  if (filters.bathrooms) {
    const minBathrooms = parseInt(filters.bathrooms)
    
    filteredHotels = filteredHotels.filter(hotel => {
      const bathrooms = hotel.bathrooms || 1
      const hasEnough = bathrooms >= minBathrooms
      if (!hasEnough) {
        console.log(`🚿 Filtered out ${hotel.title}: ${bathrooms} bathrooms < ${minBathrooms}`)
      }
      return hasEnough
    })
    
    console.log(`🚿 Bathrooms filter (${minBathrooms}+): ${filteredHotels.length} hotels remaining`)
  }

  // Free cancellation filter
  if (filters.free_cancellation === 'true') {
    filteredHotels = filteredHotels.filter(hotel => {
      const hasFreeCancellation = hasFreeCancel(hotel)
      if (!hasFreeCancellation) {
        console.log(`❌ Filtered out ${hotel.title}: No free cancellation`)
      }
      return hasFreeCancellation
    })
    
    console.log(`🔄 Free cancellation filter: ${filteredHotels.length} hotels remaining`)
  }

  // Refundable filter
  if (filters.refundable_only === 'true') {
    filteredHotels = filteredHotels.filter(hotel => {
      const refundable = isRefundable(hotel)
      if (!refundable) {
        console.log(`💳 Filtered out ${hotel.title}: Not refundable`)
      }
      return refundable
    })
    
    console.log(`💳 Refundable filter: ${filteredHotels.length} hotels remaining`)
  }

  console.log(`✅ Client-side filtering complete: ${filteredHotels.length}/${hotels.length} hotels match criteria`)
  
  return filteredHotels
}